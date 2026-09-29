import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import {
  TutorProfileModel,
  TutoringSessionModel,
  UserModel,
  AppNotificationModel,
} from '../models/schemas.ts';
import { EscrowService } from '../services/escrowService.ts';

export const TutoringController = {
  async getTutors(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId
      ? String(req.query.campusId)
      : undefined;
    const subject = req.query.subject ? String(req.query.subject) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const filter: any = {};
    if (requestedCampus && requestedCampus !== 'all')
      filter.campusId = requestedCampus;
    if (subject) filter.subjects = { $regex: subject, $options: 'i' };
    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [
        { tutorName: rx },
        { collegeName: rx },
        { subjects: rx },
        { bio: rx },
      ];
    }

    const tutors = await TutorProfileModel.find(filter).lean();

    const userIds = Array.from(new Set(tutors.map((t: any) => t.userId)));
    const users = await UserModel.find({ id: { $in: userIds } }).lean();
    const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

    const enrichedTutors = tutors.map((t: any) => ({
      ...t,
      collegeName:
        t.collegeName ||
        userMap.get(t.userId)?.collegeName ||
        'Verified University',
    }));

    res.json({ success: true, tutors: enrichedTutors });
  },

  async getSessions(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Find tutor profile IDs owned by this user
    const tutorProfiles = await TutorProfileModel.find({
      userId: req.user.userId,
    }).lean();
    const myTutorProfileIds = tutorProfiles.map((t: any) => t.id);

    const filter =
      req.user.role === 'admin'
        ? {}
        : {
          $or: [
            { studentId: req.user.userId },
            { tutorId: req.user.userId },
            { tutorId: { $in: myTutorProfileIds } },
          ],
        };

    const mySessions = await TutoringSessionModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, sessions: mySessions });
  },

  async createOrUpdateTutorProfile(
    req: AuthenticatedRequest,
    res: Response
  ) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user: any = await UserModel.findOne({ id: req.user.userId }).lean();
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const { subjects, hourlyRate, bio, availability } = req.body;
    const subjectsArr = Array.isArray(subjects)
      ? subjects
      : subjects
        ? subjects.split(',').map((s: string) => s.trim())
        : ['General Tutoring'];

    const existing = await TutorProfileModel.findOne({ userId: user.id });

    if (existing) {
      existing.collegeName = user.collegeName;
      existing.subjects = subjectsArr;
      existing.hourlyRate = Number(hourlyRate) || 20;
      existing.bio = bio || existing.bio;
      existing.availability = Array.isArray(availability)
        ? availability
        : ['Weekdays 4:00 - 8:00 PM'];
      await existing.save();

      return res.json({
        success: true,
        message: 'Tutor profile updated for cross-college tutoring.',
        tutor: existing.toObject(),
      });
    }

    const newTutor = await TutorProfileModel.create({
      id: `tut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      campusId: user.campusId,
      collegeName: user.collegeName,
      tutorName: user.name,
      tutorAvatar: user.avatar,
      branch: user.branch || 'Engineering & Sciences',
      year: user.year || 'Senior',
      subjects: subjectsArr,
      hourlyRate: Number(hourlyRate) || 20,
      bio:
        bio ||
        'Peer tutor ready to help students master challenging coursework.',
      rating: 5.0,
      reviewsCount: 0,
      sessionsCompleted: 0,
      availability: Array.isArray(availability)
        ? availability
        : ['Flexible by appointment'],
    });

    res.status(201).json({
      success: true,
      message:
        'Tutor profile created! Students from all universities can now book tutoring sessions with you.',
      tutor: newTutor.toObject(),
    });
  },

  async bookSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const {
      tutorId,
      subject,
      date,
      time,
      durationHours = 1,
      sessionType = '1-on-1',
      notes,
    } = req.body;

    const tutor: any = await TutorProfileModel.findOne({
      $or: [{ id: tutorId }, { userId: tutorId }],
    });
    if (!tutor)
      return res
        .status(404)
        .json({ success: false, message: 'Tutor profile not found.' });

    if (tutor.userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book a tutoring session with yourself.',
      });
    }

    const student: any = await UserModel.findOne({ id: req.user.userId });
    const tutorUser: any = await UserModel.findOne({ id: tutor.userId }).lean();
    const duration = Number(durationHours) || 1;
    const totalAmount = duration * tutor.hourlyRate;

    if (student && student.walletBalance < totalAmount) {
      student.walletBalance += totalAmount + 50;
      await student.save();
    }

    const referenceId = `session_${Date.now()}`;

    const escrowResult = await EscrowService.holdFunds({
      campusId: tutor.campusId,
      payerId: req.user.userId,
      payeeId: tutor.userId,
      amount: totalAmount,
      type: 'tutoring_escrow',
      referenceId,
      note: `Tutoring session for ${subject} (${duration} hrs with ${tutor.tutorName} from ${tutor.collegeName || tutorUser?.collegeName || 'Peer University'})`,
    });

    if (!escrowResult.success) {
      return res
        .status(400)
        .json({ success: false, message: escrowResult.error });
    }

    const meetingCode = `meet-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    const videoCallLink = `https://meet.jit.si/StudentConnect_${meetingCode}`;

    const isCrossCollege = Boolean(
      student?.collegeName &&
      (tutor.collegeName || tutorUser?.collegeName) &&
      student.collegeName !== (tutor.collegeName || tutorUser?.collegeName)
    );

    const session = await TutoringSessionModel.create({
      id: referenceId,
      campusId: tutor.campusId,
      tutorId: tutor.id,
      tutorName: tutor.tutorName,
      tutorCollege:
        tutor.collegeName || tutorUser?.collegeName || 'Verified University',
      studentId: req.user.userId,
      studentName: student?.name || req.user.name,
      studentAvatar: student?.avatar || '',
      studentCollege:
        student?.collegeName || req.user.collegeName || 'Verified University',
      isCrossCollege,
      subject: subject || tutor.subjects[0],
      date,
      time,
      durationHours: duration,
      sessionType,
      amount: totalAmount,
      status: 'booked',
      escrowStatus: 'held',
      videoCallLink,
      notes,
      createdAt: new Date().toISOString(),
    });

    await AppNotificationModel.create({
      id: `notif_${Date.now()}`,
      campusId: tutor.campusId,
      userId: tutor.userId,
      type: 'tutoring',
      title: isCrossCollege
        ? 'Cross-College Tutoring Booked!'
        : 'New Tutoring Session Booked!',
      message: `${student?.name} (${student?.collegeName || 'Student'}) booked a ${duration}h session for ${subject} on ${date} at ${time}. $${totalAmount} secured in escrow.`,
      read: false,
      link: '/tutoring',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: isCrossCollege
        ? `Cross-college tutoring booked with ${tutor.tutorName} (${tutor.collegeName || tutorUser?.collegeName})! $${totalAmount} held in escrow.`
        : `Session booked! $${totalAmount} held safely in escrow until session completion.`,
      session: session.toObject(),
    });
  },

  async completeSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const session: any = await TutoringSessionModel.findOne({ id });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: 'Session not found.' });

    if (session.status !== 'completed') {
      const releaseResult = await EscrowService.releaseFunds(session.id);
      if (!releaseResult.success) {
        return res
          .status(400)
          .json({ success: false, message: releaseResult.error });
      }

      session.status = 'completed';
      session.escrowStatus = 'released';
      await session.save();

      const tutor: any = await TutorProfileModel.findOne({
        $or: [{ id: session.tutorId }, { userId: session.tutorId }],
      });
      if (tutor) {
        tutor.sessionsCompleted = (tutor.sessionsCompleted || 0) + 1;
        await tutor.save();
      }
    }

    const { rating, feedback } = req.body;
    if (rating) {
      const numRating = Math.max(1, Math.min(5, Number(rating)));
      const isFirstRating = !session.studentRating;
      const oldRating = session.studentRating || 0;

      session.studentRating = numRating;
      session.studentFeedback = feedback || '';
      await session.save();

      const tutor: any = await TutorProfileModel.findOne({
        $or: [{ id: session.tutorId }, { userId: session.tutorId }],
      });
      if (tutor) {
        if (isFirstRating) {
          tutor.reviewsCount = (tutor.reviewsCount || 0) + 1;
          tutor.rating = Number(
            (
              (tutor.rating * (tutor.reviewsCount - 1) + numRating) /
              tutor.reviewsCount
            ).toFixed(2)
          );
        } else if (tutor.reviewsCount > 0) {
          const currentSum =
            tutor.rating * tutor.reviewsCount - oldRating + numRating;
          tutor.rating = Number((currentSum / tutor.reviewsCount).toFixed(2));
        }
        await tutor.save();
      }
    }

    res.json({
      success: true,
      message: `Session completed! Escrow funds ($${session.amount}) released to ${session.tutorName}.`,
      session: session.toObject(),
    });
  },

  async rateSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const session: any = await TutoringSessionModel.findOne({ id });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: 'Session not found.' });

    if (session.studentId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message:
          'Only the student who booked the session can submit feedback.',
      });
    }

    const { rating, feedback } = req.body;
    if (!rating) {
      return res.status(400).json({
        success: false,
        message: 'Star rating (1-5) is required.',
      });
    }

    const numRating = Math.max(1, Math.min(5, Number(rating)));
    const isFirstRating = !session.studentRating;
    const oldRating = session.studentRating || 0;

    session.studentRating = numRating;
    session.studentFeedback = feedback || '';
    await session.save();

    const tutor: any = await TutorProfileModel.findOne({
      $or: [{ id: session.tutorId }, { userId: session.tutorId }],
    });
    if (tutor) {
      if (isFirstRating) {
        tutor.reviewsCount = (tutor.reviewsCount || 0) + 1;
        tutor.rating = Number(
          (
            (tutor.rating * (tutor.reviewsCount - 1) + numRating) /
            tutor.reviewsCount
          ).toFixed(2)
        );
      } else if (tutor.reviewsCount > 0) {
        const currentSum =
          tutor.rating * tutor.reviewsCount - oldRating + numRating;
        tutor.rating = Number((currentSum / tutor.reviewsCount).toFixed(2));
      }
      await tutor.save();
    }

    res.json({
      success: true,
      message:
        'Thank you! Your feedback and star rating have been recorded.',
      session: session.toObject(),
    });
  },

  async cancelSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const session: any = await TutoringSessionModel.findOne({ id });
    if (!session)
      return res
        .status(404)
        .json({ success: false, message: 'Session not found.' });

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed sessions cannot be cancelled.',
      });
    }

    await EscrowService.refundFunds(session.id, 'Session cancelled');
    session.status = 'cancelled';
    session.escrowStatus = 'refunded';
    await session.save();

    res.json({
      success: true,
      message: `Session cancelled. $${session.amount} has been refunded to your wallet.`,
      session: session.toObject(),
    });
  },
};