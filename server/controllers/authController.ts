import { Response } from 'express';
import { db } from '../config/db.ts';
import { signToken } from '../config/jwt.ts';
import { validateCollegeEmail } from '../validators/validators.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { SUPPORTED_CAMPUSES } from '../config/constants.ts';
import { MailerService } from '../services/mailerService.ts';

// In-memory OTP storage for registration
const pendingOtps: Record<string, { otp: string; expiresAt: number; data: any }> = {};

export const AuthController = {
  getCampuses(req: AuthenticatedRequest, res: Response) {
    res.json({ success: true, campuses: SUPPORTED_CAMPUSES });
  },

  /**
   * Step 1: Submit college email -> validates domain -> sends OTP
   */
  async requestRegisterOTP(req: AuthenticatedRequest, res: Response) {
    const { email } = req.body;
    const emailCheck = validateCollegeEmail(email);

    if (!emailCheck.valid || !emailCheck.campus) {
      return res.status(400).json({
        success: false,
        message: emailCheck.error || 'Invalid college email domain.'
      });
    }

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this campus email already exists. Please log in.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingOtps[email.toLowerCase()] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      data: { campus: emailCheck.campus }
    };

    await MailerService.sendVerificationOTP(email, otp, emailCheck.campus.name);

    res.json({
      success: true,
      message: `Verification code sent to ${email}.`,
      campus: emailCheck.campus,
      // For immediate convenience during testing/review, return otp preview
      demoOtp: otp
    });
  },

  /**
   * Step 2: Register Student Profile
   * Requirements: Name, Phone, Email, College Name, and College ID Card.
   * Role is strictly 'student'. Login identifier is username or admission number.
   */
  verifyAndRegister(req: AuthenticatedRequest, res: Response) {
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
      otp
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Student full name is required.' });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required.' });
    }
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Student email is required.' });
    }
    if (!collegeName?.trim()) {
      return res.status(400).json({ success: false, message: 'College / University name is required.' });
    }
    if (!collegeIdCardUrl?.trim()) {
      return res.status(400).json({ success: false, message: 'College ID Card photo or document is required for verification.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // If OTP was requested and present, verify it
    if (otp && pendingOtps[cleanEmail]) {
      const record = pendingOtps[cleanEmail];
      if (record.otp !== otp || record.expiresAt < Date.now()) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP verification code.' });
      }
      delete pendingOtps[cleanEmail];
    }

    // Check existing email
    const existingEmail = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Determine campus config or match to supported campus
    const matchedCampus = SUPPORTED_CAMPUSES.find(c =>
      c.name.toLowerCase().includes(collegeName.toLowerCase()) ||
      cleanEmail.endsWith(`@${c.domain}`)
    ) || {
      id: `campus_${collegeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: collegeName.trim(),
      domain: cleanEmail.split('@')[1] || 'college.edu',
      city: 'Campus City',
      state: 'State',
      centerCoordinates: { lat: 37.4275, lng: -122.1697 }
    };

    // Generate smart username & admission number if not provided
    const cleanUsername = (username?.trim() || cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')).toLowerCase();
    const cleanAdmissionNo = (admissionNumber?.trim() || `ADM-${Date.now().toString().slice(-6)}`).toUpperCase();

    // Check duplicate username or admission number
    if (db.users.some(u => u.username?.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ success: false, message: `Username "${cleanUsername}" is already taken. Please choose another.` });
    }
    if (db.users.some(u => u.admissionNumber?.toUpperCase() === cleanAdmissionNo)) {
      return res.status(400).json({ success: false, message: `Admission number "${cleanAdmissionNo}" is already registered. Please log in.` });
    }

    const newUser = {
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
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername || name)}`,
      course: course || 'Undergraduate Degree',
      year: year || '1st Year',
      branch: branch || 'General',
      hostelStatus: (hostelStatus || 'Hostelite') as 'Hostelite' | 'Day Scholar',
      bio: bio || `Student at ${collegeName.trim()}. Ready to tutor, carpool, and collaborate on campus.`,
      skills: Array.isArray(skills) ? skills : ['Problem Solving', 'Peer Collaboration'],
      interests: Array.isArray(interests) ? interests : ['Campus Activities', 'Technology'],
      role: (cleanEmail.startsWith('admin@') || req.body.role === 'admin') ? 'admin' as const : 'student' as const,
      isVerified: cleanEmail.startsWith('admin@') ? true : false, // Verification handled only by Administrator Portal
      idVerificationStatus: (cleanEmail.startsWith('admin@') ? 'verified' : 'pending') as 'verified' | 'pending' | 'rejected',
      idVerificationSubmittedAt: new Date().toISOString(),
      idVerificationNotes: cleanEmail.startsWith('admin@') ? 'Administrator verified account' : 'Awaiting manual administrator verification of Student ID card.',
      walletBalance: 500, // Welcome credit in ₹ (Rupees)
      escrowBalance: 0,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      campusId: newUser.campusId,
      collegeName: newUser.collegeName,
      name: newUser.name
    });

    res.status(201).json({
      success: true,
      message: `Registration successful! Verified with ${collegeName}. You can now log in using your username (${cleanUsername}) or admission number (${cleanAdmissionNo}).`,
      token,
      user: newUser
    });
  },

  /**
   * Login on the basis of username or student Admission number
   * Supports two distinct login modes: Student Login and Administrator Login.
   */
  login(req: AuthenticatedRequest, res: Response) {
    const { identifier, username, admissionNumber, email, role, password } = req.body;
    const lookup = (identifier || username || admissionNumber || email || '').trim().toLowerCase();

    if (!lookup) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your Username or Student Admission Number to log in.'
      });
    }

    // Match against username, admission number, or email
    const user = db.users.find(u =>
      (u.username && u.username.toLowerCase() === lookup) ||
      (u.admissionNumber && u.admissionNumber.toLowerCase() === lookup) ||
      (u.email && u.email.toLowerCase() === lookup)
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `No account found with username or admission number "${lookup}". Please verify your credentials or register a new student account.`
      });
    }

    // Check requested role type (Student vs Administrator)
    if (role) {
      if (role === 'admin' && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: This account is a Student account, not an Administrator account. Please select "Student Login".'
        });
      }
      if (role === 'student' && user.role !== 'student') {
        return res.status(401).json({
          success: false,
          message: `No student account found with username or admission number "${lookup}". Please verify your credentials or register a new student account.`
        });
      }
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
      collegeName: user.collegeName,
      name: user.name
    });

    res.json({
      success: true,
      token,
      user,
      message: `Welcome back, ${user.name}! Logged in as ${user.role === 'admin' ? 'Administrator' : 'Student'}.`
    });
  },

  /**
   * Fast Switch / Direct user changing without login and logout is disabled.
   */
  switchUser(req: AuthenticatedRequest, res: Response) {
    return res.status(403).json({
      success: false,
      message: 'Direct user switching without login and logout is disabled. Please log in using your student or administrator credentials.'
    });
  },

  getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session expired or user account not found.' });
    }

    res.json({ success: true, user });
  },

  updateProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User account not found.' });

    const { name, bio, course, year, branch, hostelStatus, skills, interests, avatar, phone } = req.body;
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

    res.json({ success: true, message: 'Profile updated successfully.', user });
  },

  topupWallet(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { amount, gateway = 'UPI / NetBanking / Cards' } = req.body;
    const topupAmount = Number(amount) || 500;

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User account not found.' });

    user.walletBalance += topupAmount;

    res.json({
      success: true,
      message: `Successfully added ₹${topupAmount} to wallet via ${gateway}.`,
      walletBalance: user.walletBalance
    });
  },

  getUserActivity(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User session expired or user account not found.' });

    // 1. Tutoring Bookings
    const myTutorProfile = db.tutors.find(t => t.userId === user.id);
    const tutoringAsStudent = db.sessions.filter(s => s.studentId === user.id);
    const tutoringAsTutor = myTutorProfile ? db.sessions.filter(s => s.tutorId === myTutorProfile.id) : [];

    // 2. Owned Notes: purchased or authored/uploaded
    const purchasedNotes = db.notes.filter(n => n.purchasedBy && n.purchasedBy.includes(user.id));
    const uploadedNotes = db.notes.filter(n => n.sellerId === user.id);

    // 3. Carpooling
    const ridesOffered = db.rides.filter(r => r.driverId === user.id);
    const ridesJoined = db.rides.filter(r => r.passengers && r.passengers.some(p => p.passengerId === user.id));

    // 4. Equipment
    const equipmentListed = db.equipment.filter(e => e.ownerId === user.id);
    const equipmentRented = db.equipment.filter(e => e.rentHistory && e.rentHistory.some(h => h.renterId === user.id));

    // 5. Study Groups
    const studyGroupsJoined = db.studyGroups.filter(g =>
      g.creatorId === user.id || (g.members && g.members.some(m => m.userId === user.id))
    );

    res.json({
      success: true,
      activity: {
        tutoring: {
          asStudent: tutoringAsStudent,
          asTutor: tutoringAsTutor,
          totalHoursLearned: tutoringAsStudent.reduce((acc, s) => acc + (s.durationHours || 1), 0),
          totalSessionsCompleted: tutoringAsStudent.filter(s => s.status === 'completed').length,
          activeEscrowAmount: tutoringAsStudent.filter(s => s.status === 'booked').reduce((acc, s) => acc + (s.amount || 0), 0)
        },
        notes: {
          purchased: purchasedNotes,
          uploaded: uploadedNotes,
          totalPurchasedCount: purchasedNotes.length,
          totalUploadedCount: uploadedNotes.length
        },
        carpooling: {
          offered: ridesOffered,
          joined: ridesJoined
        },
        equipment: {
          listed: equipmentListed,
          rented: equipmentRented
        },
        studyGroups: {
          joined: studyGroupsJoined
        },
        idVerification: {
          isVerified: user.isVerified,
          status: user.idVerificationStatus || (user.isVerified ? 'verified' : 'pending'),
          admissionNumber: user.admissionNumber || '',
          collegeName: user.collegeName || '',
          collegeIdCardUrl: user.collegeIdCardUrl || '',
          domain: user.domain || '',
          submittedAt: user.idVerificationSubmittedAt || user.createdAt,
          notes: user.idVerificationNotes || 'Institutional domain match checked.'
        }
      }
    });
  },

  updateIdVerification(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User account not found.' });

    const { collegeIdCardUrl, admissionNumber, collegeName } = req.body;

    if (collegeIdCardUrl) user.collegeIdCardUrl = collegeIdCardUrl;
    if (admissionNumber) user.admissionNumber = admissionNumber.toUpperCase();
    if (collegeName) user.collegeName = collegeName;

    user.idVerificationSubmittedAt = new Date().toISOString();
    // Self-verification removed: Verification must be handled only by administrator portal
    user.isVerified = false;
    user.idVerificationStatus = 'pending';
    user.idVerificationNotes = 'Submitted for campus administrator inspection. Awaiting verification in Administrator Portal.';

    res.json({
      success: true,
      message: 'College ID document submitted for administrative review. Verification is processed via Administrator Portal.',
      user
    });
  }
};
