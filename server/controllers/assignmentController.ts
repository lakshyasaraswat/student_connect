import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { EscrowService } from '../services/escrowService.ts';
import {
  broadcastAssignmentUpdate,
  sendRealTimeNotification,
} from '../sockets/chatSocket.ts';
import {
  AssignmentModel,
  UserModel,
  AppNotificationModel,
  EscrowTransactionModel,
} from '../models/schemas.ts';

export const AssignmentController = {
  async getAssignments(req: AuthenticatedRequest, res: Response) {
    const campusId = req.query.campusId ? String(req.query.campusId) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const subject = req.query.subject ? String(req.query.subject) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const urgency = req.query.urgency ? String(req.query.urgency) : undefined;
    const minBounty = req.query.minBounty
      ? Number(req.query.minBounty)
      : undefined;
    const maxBounty = req.query.maxBounty
      ? Number(req.query.maxBounty)
      : undefined;

    const filter: any = {};
    if (campusId && campusId !== 'all') filter.campusId = campusId;
    if (status && status !== 'all') filter.status = status;
    if (subject && subject !== 'all')
      filter.subject = { $regex: subject, $options: 'i' };
    if (urgency && urgency !== 'all') filter.urgency = urgency;
    if (minBounty !== undefined && !isNaN(minBounty))
      filter.bounty = { ...(filter.bounty || {}), $gte: minBounty };
    if (maxBounty !== undefined && !isNaN(maxBounty))
      filter.bounty = { ...(filter.bounty || {}), $lte: maxBounty };
    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [
        { title: rx },
        { subject: rx },
        { courseCode: rx },
        { description: rx },
        { collegeName: rx },
      ];
    }

    const list = await AssignmentModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const allUserIds = new Set<string>();
    list.forEach((a: any) => {
      if (a.studentId) allUserIds.add(a.studentId);
      if (a.solverId) allUserIds.add(a.solverId);
      (a.proposals || []).forEach((p: any) => {
        if (p.solverId) allUserIds.add(p.solverId);
      });
    });
    const users = await UserModel.find({
      id: { $in: Array.from(allUserIds) },
    }).lean();
    const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

    const enriched = list.map((a: any) => {
      const poster = userMap.get(a.studentId);
      const solver = a.solverId ? userMap.get(a.solverId) : undefined;
      return {
        ...a,
        studentVerified: poster ? poster.isVerified : true,
        solverVerified: solver
          ? solver.isVerified
          : a.solverId
            ? true
            : undefined,
        studentEmail:
          a.studentEmail ||
          poster?.email ||
          `${a.studentName.toLowerCase().replace(/\s+/g, '.')}@${a.campusId === 'berkeley' ? 'berkeley.edu' : 'stanford.edu'
          }`,
        studentPhone: a.studentPhone || poster?.phone || '+1 (650) 498-2041',
        studentLocation: a.studentLocation || 'Campus Quad / Student Center',
        preferredContactMethod: a.preferredContactMethod || 'chat',
        studentCollege:
          a.studentCollege || poster?.collegeName || 'Verified University',
        studentAvatar:
          a.studentAvatar ||
          poster?.avatar ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        proposals: (a.proposals || []).map((p: any) => {
          const helper = userMap.get(p.solverId);
          return { ...p, solverVerified: helper ? helper.isVerified : true };
        }),
      };
    });

    res.json({ success: true, assignments: enriched });
  },

  async getAssignmentById(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    const assignment: any = await AssignmentModel.findOne({ id }).lean();
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found.' });

    const poster = await UserModel.findOne({
      id: assignment.studentId,
    }).lean();
    const solver = assignment.solverId
      ? await UserModel.findOne({ id: assignment.solverId }).lean()
      : undefined;

    const proposalIds = (assignment.proposals || []).map(
      (p: any) => p.solverId
    );
    const propUsers = proposalIds.length
      ? await UserModel.find({ id: { $in: proposalIds } }).lean()
      : [];
    const propUserMap = new Map<string, any>(
      propUsers.map((u: any) => [u.id, u])
    );

    const enriched = {
      ...assignment,
      studentVerified: poster ? poster.isVerified : true,
      solverVerified: solver
        ? solver.isVerified
        : assignment.solverId
          ? true
          : undefined,
      studentEmail:
        assignment.studentEmail ||
        poster?.email ||
        `${assignment.studentName.toLowerCase().replace(/\s+/g, '.')}@${assignment.campusId === 'berkeley' ? 'berkeley.edu' : 'stanford.edu'
        }`,
      studentPhone:
        assignment.studentPhone || poster?.phone || '+1 (650) 498-2041',
      studentLocation:
        assignment.studentLocation || 'Campus Quad / Student Center',
      preferredContactMethod: assignment.preferredContactMethod || 'chat',
      studentCollege:
        assignment.studentCollege ||
        poster?.collegeName ||
        'Verified University',
      studentAvatar:
        assignment.studentAvatar ||
        poster?.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      proposals: (assignment.proposals || []).map((p: any) => ({
        ...p,
        solverVerified: propUserMap.get(p.solverId)?.isVerified ?? true,
      })),
    };

    res.json({ success: true, assignment: enriched });
  },

  async createAssignment(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });

    const currentUser: any = await UserModel.findOne({
      id: req.user.userId,
    }).lean();
    if (!currentUser)
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });

    const {
      title,
      subject,
      courseCode,
      description,
      requirements,
      attachmentUrl,
      attachmentName,
      attachmentType,
      bounty = 0,
      deadline,
      urgency = 'Normal',
      contactPhone,
      contactEmail,
      contactLocation,
      preferredContactMethod = 'chat',
    } = req.body;

    if (!title || !subject || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, description, and deadline are required.',
      });
    }

    const bountyAmount = Math.max(0, Number(bounty) || 0);
    const assignmentId = `asgn_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    let escrowHeld = false;
    if (bountyAmount > 0) {
      const holdRes = await EscrowService.holdFunds({
        campusId: currentUser.campusId,
        payerId: currentUser.id,
        payeeId: '',
        amount: bountyAmount,
        type: 'assignment_bounty',
        referenceId: assignmentId,
        note: `Bounty held for assignment: ${title.slice(0, 40)}`,
      });
      if (holdRes.success) escrowHeld = true;
    }

    const newAssignment = await AssignmentModel.create({
      id: assignmentId,
      campusId: currentUser.campusId,
      collegeName: currentUser.collegeName,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentAvatar:
        currentUser.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      studentEmail: contactEmail ? contactEmail.trim() : currentUser.email,
      studentPhone: contactPhone
        ? contactPhone.trim()
        : currentUser.phone || '+1 (650) 498-2041',
      studentLocation: contactLocation
        ? contactLocation.trim()
        : 'Campus Quad / Student Hostel',
      preferredContactMethod: preferredContactMethod || 'chat',
      studentCollege: currentUser.collegeName,
      title: title.trim(),
      subject: subject.trim(),
      courseCode: courseCode ? courseCode.trim() : undefined,
      description: description.trim(),
      requirements: Array.isArray(requirements)
        ? requirements
        : typeof requirements === 'string' && requirements.trim()
          ? requirements
            .split('\n')
            .map((r: string) => r.trim())
            .filter(Boolean)
          : [],
      attachmentUrl: attachmentUrl || undefined,
      attachmentName: attachmentName || undefined,
      attachmentType: attachmentType || 'other',
      bounty: bountyAmount,
      escrowStatus: escrowHeld ? 'held' : 'none',
      deadline,
      urgency: urgency || 'Normal',
      status: 'open',
      proposals: [],
      createdAt: new Date().toISOString(),
    });

    broadcastAssignmentUpdate(newAssignment.toObject());

    res.status(201).json({
      success: true,
      message: 'Assignment successfully posted to campus board!',
      assignment: newAssignment.toObject(),
    });
  },

  async applyOrBid(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });

    const id = String(req.params.id);
    const currentUser: any = await UserModel.findOne({
      id: req.user.userId,
    }).lean();
    if (!currentUser)
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });

    const assignment: any = await AssignmentModel.findOne({ id });
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found.' });

    const isOwner = assignment.studentId === currentUser.id;
    const solverId = isOwner
      ? `test_peer_${currentUser.id.slice(0, 8)}`
      : currentUser.id;
    const solverName = isOwner
      ? `${currentUser.name} (Peer Helper)`
      : currentUser.name;

    if (assignment.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This assignment is already assigned or closed.',
      });
    }

    const { pitch, proposedTime, offeredPrice } = req.body;
    if (!pitch || !proposedTime) {
      return res.status(400).json({
        success: false,
        message: 'Pitch and proposed completion time are required.',
      });
    }

    const existingIndex = assignment.proposals.findIndex(
      (p: any) => p.solverId === solverId
    );

    const proposal = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      solverId,
      solverName,
      solverAvatar:
        currentUser.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      solverCollege: currentUser.collegeName,
      proposedTime: proposedTime.trim(),
      pitch: pitch.trim(),
      offeredPrice: offeredPrice ? Number(offeredPrice) : assignment.bounty,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      assignment.proposals[existingIndex] = proposal;
    } else {
      assignment.proposals.push(proposal);
    }
    await assignment.save();

    const notif = await AppNotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: currentUser.campusId,
      userId: assignment.studentId,
      type: 'assignment',
      title: `⚡ New Solver Proposal: ${currentUser.name}`,
      message: `${currentUser.name} offered to solve "${assignment.title}": "${pitch.slice(
        0,
        70
      )}..."`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    sendRealTimeNotification(assignment.studentId, notif.toObject());
    broadcastAssignmentUpdate(
      assignment.toObject(),
      assignment.studentId,
      'assignment_proposal_received',
      { proposal }
    );

    res.json({
      success: true,
      message: 'Proposal successfully submitted to the student!',
      assignment: assignment.toObject(),
    });
  },

  async claimAssignment(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });

    const id = String(req.params.id);
    const assignment: any = await AssignmentModel.findOne({ id });
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found.' });

    if (assignment.status !== 'open' && assignment.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Assignment is no longer open for work.',
      });
    }

    const currentUser: any = await UserModel.findOne({
      id: req.user.userId,
    }).lean();
    const isOwner =
      assignment.studentId === (currentUser?.id || req.user.userId);
    if (isOwner && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message:
          'You listed this assignment. Other campus users can accept and work on this assignment.',
      });
    }

    const solverId = currentUser?.id || req.user.userId;
    const solverName = currentUser?.name || req.user.name || 'Campus Helper';
    const solverAvatar =
      currentUser?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    const solverCollege =
      currentUser?.collegeName ||
      req.user.collegeName ||
      'Verified University';

    assignment.solverId = solverId;
    assignment.solverName = solverName;
    assignment.solverAvatar = solverAvatar;
    assignment.solverCollege = solverCollege;
    assignment.status = 'assigned';
    assignment.assignedAt = new Date().toISOString();

    const prop = assignment.proposals.find(
      (p: any) => p.solverId === solverId
    );
    if (prop) {
      prop.status = 'accepted';
      if (prop.counterPrice) {
        assignment.bounty = prop.counterPrice;
        prop.counterStatus = 'accepted';
      }
    } else {
      assignment.proposals.push({
        id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        solverId,
        solverName,
        solverAvatar,
        solverCollege,
        proposedTime: 'As per deadline',
        pitch: 'Accepted the listed assignment offer to complete the work.',
        offeredPrice: assignment.bounty,
        status: 'accepted',
        createdAt: new Date().toISOString(),
      });
    }

    const escrowTx: any = await EscrowTransactionModel.findOne({
      referenceId: assignment.id,
      status: 'held',
    });
    if (escrowTx) {
      escrowTx.payeeId = solverId;
      escrowTx.amount = assignment.bounty;
      await escrowTx.save();
    } else if (assignment.bounty > 0 && assignment.escrowStatus !== 'held') {
      await EscrowService.holdFunds({
        campusId: assignment.campusId,
        payerId: assignment.studentId,
        payeeId: solverId,
        amount: assignment.bounty,
        type: 'assignment_bounty',
        referenceId: assignment.id,
        note: `Bounty held for assignment: ${assignment.title.slice(0, 40)}`,
      });
      assignment.escrowStatus = 'held';
    }

    await assignment.save();

    const notif = await AppNotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: assignment.campusId,
      userId: assignment.studentId,
      type: 'assignment',
      title: `🎉 Offer Accepted: "${assignment.title}"!`,
      message: `${solverName} accepted the offer to work on your assignment for ₹${assignment.bounty.toLocaleString()}. Work is in progress!`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    sendRealTimeNotification(assignment.studentId, notif.toObject());
    broadcastAssignmentUpdate(
      assignment.toObject(),
      solverId,
      'assignment_assigned_to_you'
    );

    return res.json({
      success: true,
      message: `You have accepted the offer to work on "${assignment.title}" for ₹${assignment.bounty.toLocaleString()}! You can now start working and submit your result.`,
      assignment: assignment.toObject(),
    });
  },

  async counterOffer(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });

    const id = String(req.params.id);
    const assignment: any = await AssignmentModel.findOne({ id });
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found.' });

    const currentUser: any = await UserModel.findOne({
      id: req.user.userId,
    }).lean();
    const isAuthor =
      assignment.studentId === req.user.userId ||
      (currentUser && assignment.studentId === currentUser.id);

    if (isAuthor && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message:
          'Counter offer option is only for other student helpers, not for the user who listed the help.',
      });
    }

    const { proposalId, counterPrice, counterNote, proposedTime } = req.body;
    if (
      counterPrice === undefined ||
      isNaN(Number(counterPrice)) ||
      Number(counterPrice) < 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Valid counter price is required.' });
    }

    const price = Number(counterPrice);

    let targetProposal: any;
    if (proposalId) {
      targetProposal = assignment.proposals.find(
        (p: any) => p.id === proposalId || p.solverId === proposalId
      );
    }
    if (!targetProposal) {
      targetProposal = assignment.proposals.find(
        (p: any) =>
          p.solverId === req.user!.userId ||
          (currentUser && p.solverId === currentUser.id)
      );
    }

    if (!targetProposal) {
      targetProposal = {
        id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        solverId: currentUser?.id || req.user.userId,
        solverName: currentUser?.name || req.user.name || 'Campus Helper',
        solverAvatar:
          currentUser?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        solverCollege:
          currentUser?.collegeName ||
          req.user.collegeName ||
          'Verified University',
        proposedTime: proposedTime || 'Within 24 hours',
        pitch: counterNote || `Counter offer for assignment: ₹${price}`,
        offeredPrice: price,
        counterPrice: price,
        counterNote: counterNote || '',
        counterStatus: 'pending',
        counterBy: 'solver',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      assignment.proposals.push(targetProposal);
    } else {
      targetProposal.counterPrice = price;
      targetProposal.counterNote = counterNote ? counterNote.trim() : '';
      targetProposal.counterStatus = 'pending';
      targetProposal.counterBy = 'solver';
      if (proposedTime) targetProposal.proposedTime = proposedTime.trim();
    }

    const prevPrice = assignment.bounty;
    await assignment.save();

    const recipientId = assignment.studentId;
    const actorName = currentUser?.name || req.user.name || 'Campus Peer';

    const notif = await AppNotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: assignment.campusId,
      userId: recipientId,
      type: 'assignment',
      title: `⚡ Counter Offer on "${assignment.title}"`,
      message: `${actorName} counter offered ₹${price.toLocaleString()} (Previous: ₹${prevPrice.toLocaleString()}). Notes: "${(
        counterNote || 'No notes provided'
      ).slice(0, 60)}"`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    sendRealTimeNotification(recipientId, notif.toObject());
    broadcastAssignmentUpdate(
      assignment.toObject(),
      recipientId,
      'assignment_counter_offer',
      { proposal: targetProposal }
    );

    return res.json({
      success: true,
      message: `Counter offer of ₹${price.toLocaleString()} (Previous: ₹${prevPrice.toLocaleString()}) submitted successfully!`,
      assignment: assignment.toObject(),
      proposal: targetProposal,
    });
  },

  async assignSolver(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });

    const id = String(req.params.id);
    const assignment: any = await AssignmentModel.findOne({ id });
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found.' });

    const currentUser: any = await UserModel.findOne({
      id: req.user.userId,
    }).lean();
    const isAuthor =
      assignment.studentId === req.user.userId ||
      (currentUser && assignment.studentId === currentUser.id) ||
      req.user.role === 'admin' ||
      (assignment.studentEmail && assignment.studentEmail === req.user.email);

    const { solverId, proposalId } = req.body;
    let targetProposal: any;

    if (proposalId) {
      targetProposal = assignment.proposals.find(
        (p: any) => p.id === proposalId || p.solverId === proposalId
      );
    }
    if (!targetProposal && solverId) {
      targetProposal = assignment.proposals.find(
        (p: any) => p.solverId === solverId || p.id === solverId
      );
    }
    if (!targetProposal && assignment.proposals.length === 1) {
      targetProposal = assignment.proposals[0];
    }

    if (!targetProposal) {
      return res
        .status(400)
        .json({ success: false, message: 'Proposal not found.' });
    }

    const isHelperAcceptingCounter =
      targetProposal.counterBy === 'poster' &&
      (targetProposal.solverId === req.user.userId ||
        (currentUser && targetProposal.solverId === currentUser.id));

    if (!isAuthor && !isHelperAcceptingCounter) {
      return res.status(403).json({
        success: false,
        message:
          'Only the assignment author or the counter-offer recipient can accept.',
      });
    }

    const solverUser: any = await UserModel.findOne({
      id: targetProposal.solverId,
    }).lean();
    const assignedSolverId = targetProposal.solverId;
    const assignedSolverName =
      solverUser?.name || targetProposal.solverName || 'Campus Helper';
    const assignedSolverAvatar =
      solverUser?.avatar ||
      targetProposal.solverAvatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    const assignedSolverCollege =
      solverUser?.collegeName ||
      targetProposal.solverCollege ||
      assignment.collegeName ||
      'Verified University';

    if (targetProposal.counterPrice && targetProposal.counterPrice > 0) {
      assignment.bounty = targetProposal.counterPrice;
      targetProposal.counterStatus = 'accepted';
    } else if (targetProposal.offeredPrice && targetProposal.offeredPrice > 0) {
      assignment.bounty = targetProposal.offeredPrice;
    }

    assignment.status = 'assigned';
    assignment.solverId = assignedSolverId;
    assignment.solverName = assignedSolverName;
    assignment.solverAvatar = assignedSolverAvatar;
    assignment.solverCollege = assignedSolverCollege;
    assignment.assignedAt = new Date().toISOString();

    assignment.proposals.forEach((p: any) => {
      if (p.id === targetProposal.id || p.solverId === targetProposal.solverId) {
        p.status = 'accepted';
        p.counterStatus = 'accepted';
      } else if (p.status === 'pending') {
        p.status = 'declined';
        p.counterStatus = 'declined';
      }
    });

    const escrowTx: any = await EscrowTransactionModel.findOne({
      referenceId: assignment.id,
      status: 'held',
    });
    if (escrowTx) {
      escrowTx.payeeId = assignedSolverId;
      escrowTx.amount = assignment.bounty;
      await escrowTx.save();
    } else if (assignment.bounty > 0 && assignment.escrowStatus !== 'held') {
      await EscrowService.holdFunds({
        campusId: assignment.campusId,
        payerId: assignment.studentId,
        payeeId: assignedSolverId,
        amount: assignment.bounty,
        type: 'assignment_bounty',
        referenceId: assignment.id,
        note: `Bounty held for assignment: ${assignment.title.slice(0, 40)}`,
      });
      assignment.escrowStatus = 'held';
    }

    await assignment.save();

    const notif = await AppNotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: assignment.campusId,
      userId: assignedSolverId,
      type: 'assignment',
      title: `🎉 Offer Accepted: "${assignment.title}"!`,
      message: `You were selected to solve this assignment! Bounty of ₹${assignment.bounty.toLocaleString()} is held in escrow. Due before ${assignment.deadline}.`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    sendRealTimeNotification(assignedSolverId, notif.toObject());
    broadcastAssignmentUpdate(
      assignment.toObject(),
      assignedSolverId,
      'assignment_assigned_to_you'
    );

    res.json({
      success: true,
      message: `Offer accepted! ${assignedSolverName} is now assigned to complete your assignment for ₹${assignment.bounty.toLocaleString()}.`,
      assignment: assignment.toObject(),
    });
  },

  async submitSolution(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });

    const id = String(req.params.id);
    const assignment: any = await AssignmentModel.findOne({ id });
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found.' });

    const { solutionNotes, solutionFileUrl, solutionFileName } = req.body;
    if (!solutionNotes && !solutionFileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide solution notes or upload a solution file.',
      });
    }

    const currentUser: any = await UserModel.findOne({
      id: req.user.userId,
    }).lean();
    const isStudentAuthor =
      assignment.studentId === req.user.userId ||
      (currentUser && assignment.studentId === currentUser.id);

    const solverId = isStudentAuthor
      ? `peer_tester_${currentUser?.id || req.user.userId}`
      : currentUser?.id || req.user.userId;
    const solverName = isStudentAuthor
      ? `${currentUser?.name || req.user.name || 'Campus Student'} (Peer Solver)`
      : currentUser?.name || req.user.name || 'Campus Solver';

    assignment.solverId = solverId;
    assignment.solverName = solverName;
    assignment.solverAvatar =
      currentUser?.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    assignment.solverCollege =
      currentUser?.collegeName ||
      req.user.collegeName ||
      'Verified University';
    if (!assignment.assignedAt) {
      assignment.assignedAt = new Date().toISOString();
    }

    assignment.submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      solverId,
      solverName,
      submittedAt: new Date().toISOString(),
      solutionNotes: solutionNotes ? solutionNotes.trim() : '',
      solutionFileUrl: solutionFileUrl || undefined,
      solutionFileName: solutionFileName || undefined,
      status: 'submitted',
    };
    assignment.status = 'submitted';
    await assignment.save();

    const notif = await AppNotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: assignment.campusId,
      userId: assignment.studentId,
      type: 'assignment',
      title: `✅ Result Submitted: ${assignment.title}`,
      message: `${solverName} submitted the completed assignment result! Please review and release escrow payout.`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    sendRealTimeNotification(assignment.studentId, notif.toObject());
    broadcastAssignmentUpdate(
      assignment.toObject(),
      assignment.studentId,
      'assignment_solution_submitted'
    );

    res.json({
      success: true,
      message:
        'Assignment result successfully submitted! The student has been notified to review and release funds.',
      assignment: assignment.toObject(),
    });
  },

  async reviewSolution(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });

    const id = String(req.params.id);
    const assignment: any = await AssignmentModel.findOne({ id });
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found.' });

    const currentUser: any = await UserModel.findOne({
      id: req.user.userId,
    }).lean();
    const isAuthor =
      assignment.studentId === req.user.userId ||
      (currentUser && assignment.studentId === currentUser.id) ||
      req.user.role === 'admin' ||
      (assignment.studentEmail && assignment.studentEmail === req.user.email);

    if (!isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'Only the assignment author can review submissions.',
      });
    }

    if (!assignment.submission) {
      return res.status(400).json({
        success: false,
        message: 'No submission found to review.',
      });
    }

    const { action, rating, review, revisionFeedback } = req.body;

    if (action === 'approve') {
      assignment.status = 'completed';
      assignment.submission.status = 'approved';
      if (rating) assignment.studentRating = Number(rating);
      if (review) assignment.studentReview = review.trim();

      if (assignment.bounty > 0 && assignment.escrowStatus === 'held') {
        const releaseRes = await EscrowService.releaseFunds(assignment.id);
        if (releaseRes.success) {
          assignment.escrowStatus = 'released';
        }
      }
      await assignment.save();

      if (assignment.solverId) {
        const notif = await AppNotificationModel.create({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          campusId: assignment.campusId,
          userId: assignment.solverId,
          type: 'assignment',
          title: `💰 Bounty Released: ₹${assignment.bounty.toLocaleString()}!`,
          message: `Your solution for "${assignment.title}" was approved by ${assignment.studentName}. Funds credited to your wallet balance!`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        sendRealTimeNotification(assignment.solverId, notif.toObject());
      }

      broadcastAssignmentUpdate(
        assignment.toObject(),
        assignment.solverId,
        'assignment_completed'
      );

      return res.json({
        success: true,
        message: 'Solution approved and bounty funds released to solver!',
        assignment: assignment.toObject(),
      });
    } else if (action === 'request_revision') {
      assignment.status = 'assigned';
      assignment.submission.status = 'revision_requested';
      assignment.submission.reviewFeedback = revisionFeedback
        ? revisionFeedback.trim()
        : 'Please check and revise the solution.';
      await assignment.save();

      if (assignment.solverId) {
        const notif = await AppNotificationModel.create({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          campusId: assignment.campusId,
          userId: assignment.solverId,
          type: 'assignment',
          title: `✏️ Revision Requested: ${assignment.title}`,
          message: `${assignment.studentName} requested changes: "${(
            revisionFeedback || ''
          ).slice(0, 80)}"`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        sendRealTimeNotification(assignment.solverId, notif.toObject());
      }

      broadcastAssignmentUpdate(
        assignment.toObject(),
        assignment.solverId,
        'assignment_revision_requested'
      );

      return res.json({
        success: true,
        message: 'Revision request sent to solver.',
        assignment: assignment.toObject(),
      });
    }

    res.status(400).json({
      success: false,
      message: 'Invalid action. Must be "approve" or "request_revision".',
    });
  },

  async cancelAssignment(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });

    const id = String(req.params.id);
    const assignment: any = await AssignmentModel.findOne({ id });
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found.' });

    if (assignment.studentId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this assignment.',
      });
    }

    if (assignment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed assignments cannot be cancelled.',
      });
    }

    if (assignment.bounty > 0 && assignment.escrowStatus === 'held') {
      await EscrowService.refundFunds(
        assignment.id,
        'Assignment cancelled by poster'
      );
      assignment.escrowStatus = 'refunded';
    }

    assignment.status = 'cancelled';
    await assignment.save();

    if (assignment.solverId) {
      const notif = await AppNotificationModel.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        campusId: assignment.campusId,
        userId: assignment.solverId,
        type: 'assignment',
        title: `⚠️ Assignment Cancelled: ${assignment.title}`,
        message: `The poster has cancelled this assignment.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      sendRealTimeNotification(assignment.solverId, notif.toObject());
    }

    broadcastAssignmentUpdate(assignment.toObject());

    res.json({
      success: true,
      message:
        'Assignment cancelled. Any held bounty has been refunded to your wallet.',
      assignment: assignment.toObject(),
    });
  },

  async deleteAssignment(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' });

    const id = String(req.params.id);
    const assignment: any = await AssignmentModel.findOne({ id }).lean();
    if (!assignment)
      return res
        .status(404)
        .json({ success: false, message: 'Assignment not found.' });

    if (assignment.studentId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this assignment.',
      });
    }

    if (assignment.bounty > 0 && assignment.escrowStatus === 'held') {
      await EscrowService.refundFunds(assignment.id, 'Assignment deleted');
    }

    await AssignmentModel.deleteOne({ id });

    if (assignment.solverId) {
      sendRealTimeNotification(assignment.solverId, {
        id: `notif_${Date.now()}`,
        campusId: assignment.campusId,
        userId: assignment.solverId,
        type: 'assignment',
        title: `Assignment Deleted`,
        message: `Assignment "${assignment.title}" was removed.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ success: true, message: 'Assignment removed.' });
  },

  async addDemoOffer(req: AuthenticatedRequest, res: Response) {
    try {
      const id = String(req.params.id);
      const assignment: any = await AssignmentModel.findOne({ id });
      if (!assignment) {
        return res
          .status(404)
          .json({ success: false, message: 'Assignment not found.' });
      }

      if (assignment.status !== 'open') {
        return res.status(400).json({
          success: false,
          message: 'Offers can only be added to open assignments.',
        });
      }

      const sampleHelpers = [
        {
          name: 'Rohan Sharma',
          college: 'CS & Engineering, Year 3',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          pitch:
            'I took this exact course with an A grade. Have sample implementations ready with rigorous unit test suites and detailed explanations.',
          proposedTime: 'Within 12 hours',
          price: assignment.bounty,
        },
        {
          name: 'Ananya Deshmukh',
          college: 'Mathematics & Data Science, Year 4',
          avatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          pitch:
            'Skilled in formal proofs and structured code design. Will provide comprehensive documentation and step-by-step logic.',
          proposedTime: 'Within 18 hours',
          price: Math.max(100, assignment.bounty - 50),
        },
        {
          name: 'Vikram Seth',
          college: 'Electrical & Computing, Year 4',
          avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          pitch:
            'Peer lab tutor for 2 semesters. Will deliver clean verified solutions with comments and test verification runs.',
          proposedTime: 'Within 24 hours',
          price: assignment.bounty,
        },
      ];

      const pick =
        sampleHelpers[assignment.proposals.length % sampleHelpers.length];

      const proposal = {
        id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        solverId: `solver_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 5)}`,
        solverName: pick.name,
        solverAvatar: pick.avatar,
        solverCollege: pick.college,
        proposedTime: pick.proposedTime,
        pitch: pick.pitch,
        offeredPrice: pick.price,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      assignment.proposals.push(proposal);
      await assignment.save();

      sendRealTimeNotification(assignment.studentId, {
        id: `notif_${Date.now()}`,
        campusId: assignment.campusId,
        userId: assignment.studentId,
        type: 'assignment_bid',
        title: 'New Offer Received!',
        message: `${pick.name} gave an offer of ₹${proposal.offeredPrice} on "${assignment.title}". Click Accept Offer to start!`,
        read: false,
        createdAt: new Date().toISOString(),
        data: {
          assignmentId: assignment.id,
          proposalId: proposal.id,
        },
      });

      return res.json({
        success: true,
        message: `Sample offer added from ${pick.name}!`,
        assignment: assignment.toObject(),
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ success: false, message: err.message });
    }
  },
};