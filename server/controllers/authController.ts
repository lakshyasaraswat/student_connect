import { Response } from 'express';
import { signToken } from '../config/jwt.ts';
import { validateCollegeEmail } from '../validators/validators.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { SUPPORTED_CAMPUSES } from '../config/constants.ts';
import { MailerService } from '../services/mailerService.ts';
import {
  UserModel,
  TutorProfileModel,
  TutoringSessionModel,
  NoteModel,
  RideModel,
  EquipmentModel,
  StudyGroupModel,
} from '../models/schemas.ts';

// In-memory OTP storage for registration (fine for hackathon; use Redis in prod)
const pendingOtps: Record<
  string,
  { otp: string; expiresAt: number; data: any }
> = {};

export const AuthController = {
  getCampuses(_req: AuthenticatedRequest, res: Response) {
    res.json({ success: true, campuses: SUPPORTED_CAMPUSES });
  },

  async requestRegisterOTP(req: AuthenticatedRequest, res: Response) {
    const { email } = req.body;
    const emailCheck = validateCollegeEmail(email);

    if (!emailCheck.valid || !emailCheck.campus) {
      return res.status(400).json({
        success: false,
        message: emailCheck.error || 'Invalid college email domain.',
      });
    }

    const existing = await UserModel.findOne({
      email: email.toLowerCase(),
    }).lean();
    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          'An account with this campus email already exists. Please log in.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingOtps[email.toLowerCase()] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      data: { campus: emailCheck.campus },
    };

    await MailerService.sendVerificationOTP(
      email,
      otp,
      emailCheck.campus.name
    );

    res.json({
      success: true,
      message: `Verification code sent to ${email}.`,
      campus: emailCheck.campus,
      demoOtp: otp,
    });
  },

  async verifyAndRegister(req: AuthenticatedRequest, res: Response) {
    const {
      name,
      phone,
      email,
      collegeName,
      collegeIdCardUrl,
      username,
      admissionNumber,
      password,
      course,
      year,
      branch,
      hostelStatus,
      bio,
      skills,
      interests,
      otp,
    } = req.body;

    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: 'Student full name is required.' });
    if (!phone?.trim())
      return res
        .status(400)
        .json({ success: false, message: 'Valid phone number is required.' });
    if (!email?.trim())
      return res
        .status(400)
        .json({ success: false, message: 'Student email is required.' });
    if (!collegeName?.trim())
      return res.status(400).json({
        success: false,
        message: 'College / University name is required.',
      });
    if (!collegeIdCardUrl?.trim())
      return res.status(400).json({
        success: false,
        message:
          'College ID Card photo or document is required for verification.',
      });

    const cleanEmail = email.trim().toLowerCase();

    if (otp && pendingOtps[cleanEmail]) {
      const record = pendingOtps[cleanEmail];
      if (record.otp !== otp || record.expiresAt < Date.now()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP verification code.',
        });
      }
      delete pendingOtps[cleanEmail];
    }

    const existingEmail = await UserModel.findOne({
      email: cleanEmail,
    }).lean();
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          'An account with this email address already exists. Please log in.',
      });
    }

    const matchedCampus =
      SUPPORTED_CAMPUSES.find(
        (c) =>
          c.name.toLowerCase().includes(collegeName.toLowerCase()) ||
          cleanEmail.endsWith(`@${c.domain}`)
      ) || {
        id: `campus_${collegeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: collegeName.trim(),
        domain: cleanEmail.split('@')[1] || 'college.edu',
        city: 'Campus City',
        state: 'State',
        centerCoordinates: { lat: 37.4275, lng: -122.1697 },
      };

    const cleanUsername = (
      username?.trim() ||
      cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
    ).toLowerCase();
    const cleanAdmissionNo = (
      admissionNumber?.trim() || `ADM-${Date.now().toString().slice(-6)}`
    ).toUpperCase();

    if (await UserModel.findOne({ username: cleanUsername }).lean()) {
      return res.status(400).json({
        success: false,
        message: `Username "${cleanUsername}" is already taken. Please choose another.`,
      });
    }
    if (
      await UserModel.findOne({ admissionNumber: cleanAdmissionNo }).lean()
    ) {
      return res.status(400).json({
        success: false,
        message: `Admission number "${cleanAdmissionNo}" is already registered. Please log in.`,
      });
    }

    const isAdmin = cleanEmail.startsWith('admin@');

    const newUser = await UserModel.create({
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      username: cleanUsername,
      admissionNumber: cleanAdmissionNo,
      phone: phone.trim(),
      email: cleanEmail,
      collegeName: collegeName.trim(),
      collegeIdCardUrl: collegeIdCardUrl.trim(),
      campusId: matchedCampus.id,
      domain: matchedCampus.domain,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        cleanUsername || name
      )}`,
      course: course || 'Undergraduate Degree',
      year: year || '1st Year',
      branch: branch || 'General',
      hostelStatus: hostelStatus || 'Hostelite',
      bio:
        bio ||
        `Student at ${collegeName.trim()}. Ready to tutor, carpool, and collaborate on campus.`,
      skills: Array.isArray(skills)
        ? skills
        : ['Problem Solving', 'Peer Collaboration'],
      interests: Array.isArray(interests)
        ? interests
        : ['Campus Activities', 'Technology'],
      role: isAdmin ? 'admin' : 'student',
      isVerified: isAdmin,
      idVerificationStatus: isAdmin ? 'verified' : 'pending',
      idVerificationSubmittedAt: new Date().toISOString(),
      idVerificationNotes: isAdmin
        ? 'Administrator verified account'
        : 'Awaiting manual administrator verification of Student ID card.',
      walletBalance: 500,
      escrowBalance: 0,
      createdAt: new Date().toISOString(),
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      campusId: newUser.campusId,
      collegeName: newUser.collegeName,
      name: newUser.name,
    });

    res.status(201).json({
      success: true,
      message: `Registration successful! Verified with ${collegeName}. You can now log in using your username (${cleanUsername}) or admission number (${cleanAdmissionNo}).`,
      token,
      user: newUser.toObject(),
    });
  },

  async login(req: AuthenticatedRequest, res: Response) {
    const { identifier, username, admissionNumber, email, role, password } =
      req.body;
    const lookup = (
      identifier ||
      username ||
      admissionNumber ||
      email ||
      ''
    )
      .trim()
      .toLowerCase();

    if (!lookup) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide your Username or Student Admission Number to log in.',
      });
    }

    const user: any = await UserModel.findOne({
      $or: [
        { username: lookup },
        { admissionNumber: lookup.toUpperCase() },
        { email: lookup },
      ],
    }).lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `No account found with username or admission number "${lookup}". Please verify your credentials or register a new student account.`,
      });
    }

    if (role) {
      if (role === 'admin' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message:
            'Access restricted: This account is a Student account, not an Administrator account. Please select "Student Login".',
        });
      }
      if (role === 'student' && user.role !== 'student') {
        return res.status(401).json({
          success: false,
          message: `No student account found with username or admission number "${lookup}". Please verify your credentials or register a new student account.`,
        });
      }
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
      collegeName: user.collegeName,
      name: user.name,
    });

    res.json({
      success: true,
      token,
      user,
      message: `Welcome back, ${user.name}! Logged in as ${user.role === 'admin' ? 'Administrator' : 'Student'
        }.`,
    });
  },

  async switchUser(_req: AuthenticatedRequest, res: Response) {
    return res.status(403).json({
      success: false,
      message:
        'Direct user switching without login and logout is disabled. Please log in using your student or administrator credentials.',
    });
  },

  async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await UserModel.findOne({ id: req.user.userId }).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session expired or user account not found.',
      });
    }

    res.json({ success: true, user });
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await UserModel.findOne({ id: req.user.userId });
    if (!user)
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });

    const {
      name,
      bio,
      course,
      year,
      branch,
      hostelStatus,
      skills,
      interests,
      avatar,
      phone,
    } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (course) user.course = course;
    if (year) user.year = year;
    if (branch) user.branch = branch;
    if (hostelStatus) user.hostelStatus = hostelStatus;
    if (skills) user.skills = skills;
    if (interests) user.interests = interests;
    if (avatar) user.avatar = avatar;
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: user.toObject(),
    });
  },

  async topupWallet(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { amount, gateway = 'UPI / NetBanking / Cards' } = req.body;
    const topupAmount = Number(amount) || 500;

    const user = await UserModel.findOne({ id: req.user.userId });
    if (!user)
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });

    user.walletBalance += topupAmount;
    await user.save();

    res.json({
      success: true,
      message: `Successfully added ₹${topupAmount} to wallet via ${gateway}.`,
      walletBalance: user.walletBalance,
    });
  },

  async getUserActivity(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user: any = await UserModel.findOne({ id: req.user.userId }).lean();
    if (!user)
      return res.status(401).json({
        success: false,
        message: 'User session expired or user account not found.',
      });

    const myTutorProfile = await TutorProfileModel.findOne({
      userId: user.id,
    }).lean();

    const [
      tutoringAsStudent,
      tutoringAsTutor,
      purchasedNotes,
      uploadedNotes,
      ridesOffered,
      ridesJoined,
      equipmentListed,
      equipmentRented,
      studyGroupsJoined,
    ] = await Promise.all([
      TutoringSessionModel.find({ studentId: user.id }).lean(),
      myTutorProfile
        ? TutoringSessionModel.find({ tutorId: myTutorProfile.id }).lean()
        : Promise.resolve([] as any[]),
      NoteModel.find({ purchasedBy: user.id }).lean(),
      NoteModel.find({ sellerId: user.id }).lean(),
      RideModel.find({ driverId: user.id }).lean(),
      RideModel.find({ 'passengers.passengerId': user.id }).lean(),
      EquipmentModel.find({ ownerId: user.id }).lean(),
      EquipmentModel.find({ 'rentHistory.renterId': user.id }).lean(),
      StudyGroupModel.find({
        $or: [{ creatorId: user.id }, { 'members.userId': user.id }],
      }).lean(),
    ]);

    res.json({
      success: true,
      activity: {
        tutoring: {
          asStudent: tutoringAsStudent,
          asTutor: tutoringAsTutor,
          totalHoursLearned: tutoringAsStudent.reduce(
            (acc: number, s: any) => acc + (s.durationHours || 1),
            0
          ),
          totalSessionsCompleted: tutoringAsStudent.filter(
            (s: any) => s.status === 'completed'
          ).length,
          activeEscrowAmount: tutoringAsStudent
            .filter((s: any) => s.status === 'booked')
            .reduce((acc: number, s: any) => acc + (s.amount || 0), 0),
        },
        notes: {
          purchased: purchasedNotes,
          uploaded: uploadedNotes,
          totalPurchasedCount: purchasedNotes.length,
          totalUploadedCount: uploadedNotes.length,
        },
        carpooling: { offered: ridesOffered, joined: ridesJoined },
        equipment: { listed: equipmentListed, rented: equipmentRented },
        studyGroups: { joined: studyGroupsJoined },
        idVerification: {
          isVerified: user.isVerified,
          status:
            user.idVerificationStatus ||
            (user.isVerified ? 'verified' : 'pending'),
          admissionNumber: user.admissionNumber || '',
          collegeName: user.collegeName || '',
          collegeIdCardUrl: user.collegeIdCardUrl || '',
          domain: user.domain || '',
          submittedAt: user.idVerificationSubmittedAt || user.createdAt,
          notes:
            user.idVerificationNotes || 'Institutional domain match checked.',
        },
      },
    });
  },

  async updateIdVerification(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await UserModel.findOne({ id: req.user.userId });
    if (!user)
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });

    const { collegeIdCardUrl, admissionNumber, collegeName } = req.body;

    if (collegeIdCardUrl) user.collegeIdCardUrl = collegeIdCardUrl;
    if (admissionNumber) user.admissionNumber = admissionNumber.toUpperCase();
    if (collegeName) user.collegeName = collegeName;

    user.idVerificationSubmittedAt = new Date().toISOString();
    user.isVerified = false;
    user.idVerificationStatus = 'pending';
    user.idVerificationNotes =
      'Submitted for campus administrator inspection. Awaiting verification in Administrator Portal.';
    await user.save();

    res.json({
      success: true,
      message:
        'College ID document submitted for administrative review. Verification is processed via Administrator Portal.',
      user: user.toObject(),
    });
  },
};