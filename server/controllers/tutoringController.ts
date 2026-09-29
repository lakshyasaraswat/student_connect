import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { TutorProfile, TutoringSession } from '../models/types.ts';
import { EscrowService } from '../services/escrowService.ts';

export const TutoringController = {
  getTutors(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId as string;
    const { subject, search } = req.query;

    let tutors = db.tutors;

    // Filter by campus if explicitly requested and not 'all'
    if (requestedCampus && requestedCampus !== 'all') {
      tutors = tutors.filter(t => t.campusId === requestedCampus);
    }

    if (subject) {
      tutors = tutors.filter(t => t.subjects.some(s => s.toLowerCase().includes((subject as string).toLowerCase())));
    }
    if (search) {
      const q = (search as string).toLowerCase();
      tutors = tutors.filter(t =>
        t.tutorName.toLowerCase().includes(q) ||
        (t.collegeName && t.collegeName.toLowerCase().includes(q)) ||
        t.subjects.some(s => s.toLowerCase().includes(q)) ||
        t.bio.toLowerCase().includes(q)
      );
    }

    // Attach collegeName
    const enrichedTutors = tutors.map(t => {
      const u = db.users.find(user => user.id === t.userId);
      return {
        ...t,
        collegeName: t.collegeName || u?.collegeName || 'Verified University'
      };
    });

    res.json({ success: true, tutors: enrichedTutors });
  },

  getSessions(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const mySessions = db.sessions.filter(s =>
      s.studentId === req.user?.userId ||
      s.tutorId === req.user?.userId ||
      db.tutors.some(t => t.id === s.tutorId && t.userId === req.user?.userId) ||
      req.user?.role === 'admin'
    );

    res.json({ success: true, sessions: mySessions });
  },

  createOrUpdateTutorProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const existingIndex = db.tutors.findIndex(t => t.userId === user.id);
    const { subjects, hourlyRate, bio, availability } = req.body;

    const subjectsArr = Array.isArray(subjects) ? subjects : (subjects ? subjects.split(',').map((s: string) => s.trim()) : ['General Tutoring']);

    if (existingIndex >= 0) {
      db.tutors[existingIndex] = {
        ...db.tutors[existingIndex],
        collegeName: user.collegeName,
        subjects: subjectsArr,
        hourlyRate: Number(hourlyRate) || 20,
        bio: bio || db.tutors[existingIndex].bio,
        availability: Array.isArray(availability) ? availability : ['Weekdays 4:00 - 8:00 PM']
      };
      return res.json({ success: true, message: 'Tutor profile updated for cross-college tutoring.', tutor: db.tutors[existingIndex] });
    }

    const newTutor: TutorProfile = {
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
      bio: bio || 'Peer tutor ready to help students master challenging coursework.',
      rating: 5.0,
      reviewsCount: 0,
      sessionsCompleted: 0,
      availability: Array.isArray(availability) ? availability : ['Flexible by appointment']
    };

    db.tutors.unshift(newTutor);

    res.status(201).json({ success: true, message: 'Tutor profile created! Students from all universities can now book tutoring sessions with you.', tutor: newTutor });
  },

  bookSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { tutorId, subject, date, time, durationHours = 1, sessionType = '1-on-1', notes } = req.body;
    const tutor = db.tutors.find(t => t.id === tutorId || t.userId === tutorId);
    if (!tutor) return res.status(404).json({ success: false, message: 'Tutor profile not found.' });

    if (tutor.userId === req.user.userId) {
      return res.status(400).json({ success: false, message: 'You cannot book a tutoring session with yourself.' });
    }

    const student = db.users.find(u => u.id === req.user?.userId);
    const tutorUser = db.users.find(u => u.id === tutor.userId);
    const duration = Number(durationHours) || 1;
    const totalAmount = duration * tutor.hourlyRate;

    // Sandbox wallet topup if balance low
    if (student && student.walletBalance < totalAmount) {
      student.walletBalance += totalAmount + 50;
    }

    const referenceId = `session_${Date.now()}`;

    // Hold payment in escrow
    const escrowResult = EscrowService.holdFunds({
      campusId: tutor.campusId,
      payerId: req.user.userId,
      payeeId: tutor.userId,
      amount: totalAmount,
      type: 'tutoring_escrow',
      referenceId,
      note: `Tutoring session for ${subject} (${duration} hrs with ${tutor.tutorName} from ${tutor.collegeName || tutorUser?.collegeName || 'Peer University'})`
    });

    if (!escrowResult.success) {
      return res.status(400).json({ success: false, message: escrowResult.error });
    }

    // Generate meeting link
    const meetingCode = `meet-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    const videoCallLink = `https://meet.jit.si/StudentConnect_${meetingCode}`;

    const isCrossCollege = Boolean(student?.collegeName && (tutor.collegeName || tutorUser?.collegeName) && student.collegeName !== (tutor.collegeName || tutorUser?.collegeName));

    const session: TutoringSession = {
      id: referenceId,
      campusId: tutor.campusId,
      tutorId: tutor.id,
      tutorName: tutor.tutorName,
      tutorCollege: tutor.collegeName || tutorUser?.collegeName || 'Verified University',
      studentId: req.user.userId,
      studentName: student?.name || req.user.name,
      studentAvatar: student?.avatar || '',
      studentCollege: student?.collegeName || req.user.collegeName || 'Verified University',
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
      createdAt: new Date().toISOString()
    };

    db.sessions.unshift(session);

    // Notify tutor
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      campusId: tutor.campusId,
      userId: tutor.userId,
      type: 'tutoring',
      title: isCrossCollege ? 'Cross-College Tutoring Booked!' : 'New Tutoring Session Booked!',
      message: `${student?.name} (${student?.collegeName || 'Student'}) booked a ${duration}h session for ${subject} on ${date} at ${time}. $${totalAmount} secured in escrow.`,
      read: false,
      link: '/tutoring',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: isCrossCollege
        ? `Cross-college tutoring booked with ${tutor.tutorName} (${tutor.collegeName || tutorUser?.collegeName})! $${totalAmount} held in escrow.`
        : `Session booked! $${totalAmount} held safely in escrow until session completion.`,
      session
    });
  },

  completeSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const session = db.sessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    // Release escrow if not already completed
    if (session.status !== 'completed') {
      const releaseResult = EscrowService.releaseFunds(session.id);
      if (!releaseResult.success) {
        return res.status(400).json({ success: false, message: releaseResult.error });
      }

      session.status = 'completed';
      session.escrowStatus = 'released';

      // Update tutor stats
      const tutor = db.tutors.find(t => t.id === session.tutorId || t.userId === session.tutorId);
      if (tutor) {
        tutor.sessionsCompleted += 1;
      }
    }

    const { rating, feedback } = req.body;
    if (rating) {
      const numRating = Math.max(1, Math.min(5, Number(rating)));
      const isFirstRating = !session.studentRating;
      const oldRating = session.studentRating || 0;

      session.studentRating = numRating;
      session.studentFeedback = feedback || '';

      const tutor = db.tutors.find(t => t.id === session.tutorId || t.userId === session.tutorId);
      if (tutor) {
        if (isFirstRating) {
          tutor.reviewsCount += 1;
          tutor.rating = Number(((tutor.rating * (tutor.reviewsCount - 1) + numRating) / tutor.reviewsCount).toFixed(2));
        } else if (tutor.reviewsCount > 0) {
          const currentSum = tutor.rating * tutor.reviewsCount - oldRating + numRating;
          tutor.rating = Number((currentSum / tutor.reviewsCount).toFixed(2));
        }
      }
    }

    res.json({
      success: true,
      message: `Session completed! Escrow funds ($${session.amount}) released to ${session.tutorName}.`,
      session
    });
  },

  rateSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const session = db.sessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (session.studentId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the student who booked the session can submit feedback.' });
    }

    const { rating, feedback } = req.body;
    if (!rating) {
      return res.status(400).json({ success: false, message: 'Star rating (1-5) is required.' });
    }

    const numRating = Math.max(1, Math.min(5, Number(rating)));
    const isFirstRating = !session.studentRating;
    const oldRating = session.studentRating || 0;

    session.studentRating = numRating;
    session.studentFeedback = feedback || '';

    const tutor = db.tutors.find(t => t.id === session.tutorId || t.userId === session.tutorId);
    if (tutor) {
      if (isFirstRating) {
        tutor.reviewsCount += 1;
        tutor.rating = Number(((tutor.rating * (tutor.reviewsCount - 1) + numRating) / tutor.reviewsCount).toFixed(2));
      } else if (tutor.reviewsCount > 0) {
        const currentSum = tutor.rating * tutor.reviewsCount - oldRating + numRating;
        tutor.rating = Number((currentSum / tutor.reviewsCount).toFixed(2));
      }
    }

    res.json({
      success: true,
      message: 'Thank you! Your feedback and star rating have been recorded.',
      session
    });
  },

  cancelSession(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const session = db.sessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Completed sessions cannot be cancelled.' });
    }

    // Refund escrow
    EscrowService.refundFunds(session.id, 'Session cancelled');
    session.status = 'cancelled';
    session.escrowStatus = 'refunded';

    res.json({
      success: true,
      message: `Session cancelled. $${session.amount} has been refunded to your wallet.`,
      session
    });
  }
};
