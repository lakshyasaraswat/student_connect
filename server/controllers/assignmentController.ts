import { Response, Request } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { Assignment, AssignmentProposal, AssignmentSubmission } from '../models/types.ts';
import { EscrowService, escrowLedger } from '../services/escrowService.ts';
import { broadcastAssignmentUpdate, sendRealTimeNotification } from '../sockets/chatSocket.ts';

export const AssignmentController = {
  // GET /api/assignments
  getAssignments(req: AuthenticatedRequest, res: Response) {
    const campusId = req.query.campusId as string;
    const status = req.query.status as string;
    const subject = req.query.subject as string;
    const search = req.query.search as string;
    const urgency = req.query.urgency as string;
    const minBounty = req.query.minBounty ? Number(req.query.minBounty) : undefined;
    const maxBounty = req.query.maxBounty ? Number(req.query.maxBounty) : undefined;

    let list = db.assignments;

    if (campusId && campusId !== 'all') {
      list = list.filter(a => a.campusId === campusId);
    }

    if (status && status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    if (subject && subject !== 'all') {
      const subLower = subject.toLowerCase();
      list = list.filter(a => a.subject.toLowerCase().includes(subLower));
    }

    if (urgency && urgency !== 'all') {
      list = list.filter(a => a.urgency === urgency);
    }

    if (minBounty !== undefined && !isNaN(minBounty)) {
      list = list.filter(a => a.bounty >= minBounty);
    }

    if (maxBounty !== undefined && !isNaN(maxBounty)) {
      list = list.filter(a => a.bounty <= maxBounty);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q) ||
        (a.courseCode && a.courseCode.toLowerCase().includes(q)) ||
        a.description.toLowerCase().includes(q) ||
        (a.collegeName && a.collegeName.toLowerCase().includes(q))
      );
    }

    // Sort by createdAt descending
    const sorted = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Enrich with student details if missing
    const enriched = sorted.map(a => {
      const poster = db.users.find(u => u.id === a.studentId);
      const solver = a.solverId ? db.users.find(u => u.id === a.solverId) : undefined;
      return {
        ...a,
        studentVerified: poster ? poster.isVerified : true,
        solverVerified: solver ? solver.isVerified : (a.solverId ? true : undefined),
        studentEmail: a.studentEmail || poster?.email || `${a.studentName.toLowerCase().replace(/\s+/g, '.')}@${a.campusId === 'berkeley' ? 'berkeley.edu' : 'stanford.edu'}`,
        studentPhone: a.studentPhone || poster?.phone || '+1 (650) 498-2041',
        studentLocation: a.studentLocation || 'Campus Quad / Student Center',
        preferredContactMethod: a.preferredContactMethod || 'chat',
        studentCollege: a.studentCollege || poster?.collegeName || 'Verified University',
        studentAvatar: a.studentAvatar || poster?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        proposals: (a.proposals || []).map(p => {
          const helper = db.users.find(u => u.id === p.solverId);
          return {
            ...p,
            solverVerified: helper ? helper.isVerified : true
          };
        })
      };
    });

    res.json({ success: true, assignments: enriched });
  },

  // GET /api/assignments/:id
  getAssignmentById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const poster = db.users.find(u => u.id === assignment.studentId);
    const solver = assignment.solverId ? db.users.find(u => u.id === assignment.solverId) : undefined;
    const enriched = {
      ...assignment,
      studentVerified: poster ? poster.isVerified : true,
      solverVerified: solver ? solver.isVerified : (assignment.solverId ? true : undefined),
      studentEmail: assignment.studentEmail || poster?.email || `${assignment.studentName.toLowerCase().replace(/\s+/g, '.')}@${assignment.campusId === 'berkeley' ? 'berkeley.edu' : 'stanford.edu'}`,
      studentPhone: assignment.studentPhone || poster?.phone || '+1 (650) 498-2041',
      studentLocation: assignment.studentLocation || 'Campus Quad / Student Center',
      preferredContactMethod: assignment.preferredContactMethod || 'chat',
      studentCollege: assignment.studentCollege || poster?.collegeName || 'Verified University',
      studentAvatar: assignment.studentAvatar || poster?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      proposals: (assignment.proposals || []).map(p => {
        const helper = db.users.find(u => u.id === p.solverId);
        return {
          ...p,
          solverVerified: helper ? helper.isVerified : true
        };
      })
    };

    res.json({ success: true, assignment: enriched });
  },

  // POST /api/assignments
  createAssignment(req: AuthenticatedRequest, res: Response) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const currentUser = db.users.find(u => u.id === user.userId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

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
      preferredContactMethod = 'chat'
    } = req.body;

    if (!title || !subject || !description || !deadline) {
      return res.status(400).json({ success: false, message: 'Title, subject, description, and deadline are required.' });
    }

    const bountyAmount = Math.max(0, Number(bounty) || 0);

    const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // If bounty offered, hold funds into escrow
    let escrowHeld = false;
    if (bountyAmount > 0) {
      const holdRes = EscrowService.holdFunds({
        campusId: currentUser.campusId,
        payerId: currentUser.id,
        payeeId: '', // To be filled when solver is assigned
        amount: bountyAmount,
        type: 'assignment_bounty',
        referenceId: assignmentId,
        note: `Bounty held for assignment: ${title.slice(0, 40)}`
      });
      if (holdRes.success) {
        escrowHeld = true;
      }
    }

    const newAssignment: Assignment = {
      id: assignmentId,
      campusId: currentUser.campusId,
      collegeName: currentUser.collegeName,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      studentEmail: contactEmail ? contactEmail.trim() : currentUser.email,
      studentPhone: contactPhone ? contactPhone.trim() : (currentUser.phone || '+1 (650) 498-2041'),
      studentLocation: contactLocation ? contactLocation.trim() : 'Campus Quad / Student Hostel',
      preferredContactMethod: preferredContactMethod || 'chat',
      studentCollege: currentUser.collegeName,
      title: title.trim(),
      subject: subject.trim(),
      courseCode: courseCode ? courseCode.trim() : undefined,
      description: description.trim(),
      requirements: Array.isArray(requirements)
        ? requirements
        : typeof requirements === 'string' && requirements.trim()
        ? requirements.split('\n').map((r: string) => r.trim()).filter(Boolean)
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
      createdAt: new Date().toISOString()
    };

    db.assignments.unshift(newAssignment);

    // Broadcast assignment update
    broadcastAssignmentUpdate(newAssignment);

    res.status(201).json({
      success: true,
      message: 'Assignment successfully posted to campus board!',
      assignment: newAssignment
    });
  },

  // POST /api/assignments/:id/apply
  applyOrBid(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const currentUser = db.users.find(u => u.id === user.userId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const isOwner = assignment.studentId === currentUser.id;
    // If the owner is giving an offer to test the flow, create a test peer solver identity
    const solverId = isOwner ? `test_peer_${currentUser.id.slice(0, 8)}` : currentUser.id;
    const solverName = isOwner ? `${currentUser.name} (Peer Helper)` : currentUser.name;

    if (assignment.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This assignment is already assigned or closed.' });
    }

    const { pitch, proposedTime, offeredPrice } = req.body;
    if (!pitch || !proposedTime) {
      return res.status(400).json({ success: false, message: 'Pitch and proposed completion time are required.' });
    }

    // Check if user already applied
    const existingIndex = assignment.proposals.findIndex(p => p.solverId === solverId);

    const proposal: AssignmentProposal = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      solverId,
      solverName,
      solverAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      solverCollege: currentUser.collegeName,
      proposedTime: proposedTime.trim(),
      pitch: pitch.trim(),
      offeredPrice: offeredPrice ? Number(offeredPrice) : assignment.bounty,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      assignment.proposals[existingIndex] = proposal;
    } else {
      assignment.proposals.push(proposal);
    }

    // Send notification to student poster
    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: currentUser.campusId,
      userId: assignment.studentId,
      type: 'assignment' as any,
      title: `⚡ New Solver Proposal: ${currentUser.name}`,
      message: `${currentUser.name} offered to solve "${assignment.title}": "${pitch.slice(0, 70)}..."`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notif);
    sendRealTimeNotification(assignment.studentId, notif);

    // Broadcast assignment update
    broadcastAssignmentUpdate(assignment, assignment.studentId, 'assignment_proposal_received', { proposal });

    res.json({
      success: true,
      message: 'Proposal successfully submitted to the student!',
      assignment
    });
  },

  // POST /api/assignments/:id/claim (Accept offer and work for the listed task)
  claimAssignment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (assignment.status !== 'open' && assignment.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Assignment is no longer open for work.' });
    }

    const currentUser = db.users.find(u => u.id === user.userId);
    const isOwner = assignment.studentId === (currentUser?.id || user.userId);
    if (isOwner && user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You listed this assignment. Other campus users can accept and work on this assignment.'
      });
    }

    const solverId = currentUser?.id || user.userId;
    const solverName = currentUser?.name || user.name || 'Campus Helper';
    const solverAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    const solverCollege = currentUser?.collegeName || user.collegeName || 'Verified University';

    assignment.solverId = solverId;
    assignment.solverName = solverName;
    assignment.solverAvatar = solverAvatar;
    assignment.solverCollege = solverCollege;
    assignment.status = 'assigned';
    assignment.assignedAt = new Date().toISOString();

    // Mark any existing proposal from this solver as accepted
    let prop = assignment.proposals.find(p => p.solverId === solverId || p.solverId === (currentUser?.id || user.userId));
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
        createdAt: new Date().toISOString()
      });
    }

    // Escrow updates
    const escrowTx = escrowLedger.find((t: any) => t.referenceId === assignment.id && t.status === 'held');
    if (escrowTx) {
      escrowTx.payeeId = solverId;
      escrowTx.amount = assignment.bounty;
    } else if (assignment.bounty > 0 && assignment.escrowStatus !== 'held') {
      EscrowService.holdFunds({
        campusId: assignment.campusId,
        payerId: assignment.studentId,
        payeeId: solverId,
        amount: assignment.bounty,
        type: 'assignment_bounty',
        referenceId: assignment.id,
        note: `Bounty held for assignment: ${assignment.title.slice(0, 40)}`
      });
      assignment.escrowStatus = 'held';
    }

    // Send notification
    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: assignment.campusId,
      userId: assignment.studentId,
      type: 'assignment' as any,
      title: `🎉 Offer Accepted: "${assignment.title}"!`,
      message: `${solverName} accepted the offer to work on your assignment for ₹${assignment.bounty.toLocaleString()}. Work is in progress!`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notif);
    sendRealTimeNotification(assignment.studentId, notif);

    broadcastAssignmentUpdate(assignment, solverId, 'assignment_assigned_to_you');

    return res.json({
      success: true,
      message: `You have accepted the offer to work on "${assignment.title}" for ₹${assignment.bounty.toLocaleString()}! You can now start working and submit your result.`,
      assignment
    });
  },

  // POST /api/assignments/:id/counter (Counter offer the previous amount - only for other users, NOT author)
  counterOffer(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const currentUser = db.users.find(u => u.id === user.userId);
    const isAuthor =
      assignment.studentId === user.userId ||
      (currentUser && assignment.studentId === currentUser.id);

    // CRITICAL REQUIREMENT: Give counter offer option to other users NOT to user who has listed the help
    if (isAuthor && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Counter offer option is only for other student helpers, not for the user who listed the help.'
      });
    }

    const { proposalId, counterPrice, counterNote, proposedTime } = req.body;
    if (counterPrice === undefined || isNaN(Number(counterPrice)) || Number(counterPrice) < 0) {
      return res.status(400).json({ success: false, message: 'Valid counter price is required.' });
    }

    const price = Number(counterPrice);

    let targetProposal: AssignmentProposal | undefined;
    if (proposalId) {
      targetProposal = assignment.proposals.find(p => p.id === proposalId || p.solverId === proposalId);
    }

    // If not found and current user is a helper making a counter offer:
    if (!targetProposal) {
      targetProposal = assignment.proposals.find(
        p => p.solverId === user.userId || (currentUser && p.solverId === currentUser.id)
      );
    }

    if (!targetProposal) {
      // Create new proposal with counter offer from this helper
      targetProposal = {
        id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        solverId: currentUser?.id || user.userId,
        solverName: currentUser?.name || user.name || 'Campus Helper',
        solverAvatar:
          currentUser?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        solverCollege: currentUser?.collegeName || user.collegeName || 'Verified University',
        proposedTime: proposedTime || 'Within 24 hours',
        pitch: counterNote || `Counter offer for assignment: ₹${price}`,
        offeredPrice: price,
        counterPrice: price,
        counterNote: counterNote || '',
        counterStatus: 'pending',
        counterBy: 'solver',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      assignment.proposals.push(targetProposal);
    } else {
      // Update existing proposal
      targetProposal.counterPrice = price;
      targetProposal.counterNote = counterNote ? counterNote.trim() : '';
      targetProposal.counterStatus = 'pending';
      targetProposal.counterBy = 'solver';
      if (proposedTime) {
        targetProposal.proposedTime = proposedTime.trim();
      }
    }

    const prevPrice = assignment.bounty;

    // Target recipient to notify is always the assignment lister
    const recipientId = assignment.studentId;
    const actorName = currentUser?.name || user.name || 'Campus Peer';

    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: assignment.campusId,
      userId: recipientId,
      type: 'assignment' as any,
      title: `⚡ Counter Offer on "${assignment.title}"`,
      message: `${actorName} counter offered ₹${price.toLocaleString()} (Previous: ₹${prevPrice.toLocaleString()}). Notes: "${(counterNote || 'No notes provided').slice(0, 60)}"`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notif);
    sendRealTimeNotification(recipientId, notif);

    broadcastAssignmentUpdate(assignment, recipientId, 'assignment_counter_offer', { proposal: targetProposal });

    return res.json({
      success: true,
      message: `Counter offer of ₹${price.toLocaleString()} (Previous: ₹${prevPrice.toLocaleString()}) submitted successfully!`,
      assignment,
      proposal: targetProposal
    });
  },

  // POST /api/assignments/:id/assign
  assignSolver(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const currentUser = db.users.find(u => u.id === user.userId);
    const isAuthor =
      assignment.studentId === user.userId ||
      (currentUser && assignment.studentId === currentUser.id) ||
      user.role === 'admin' ||
      (assignment.studentEmail && assignment.studentEmail === user.email);

    const { solverId, proposalId } = req.body;
    let targetProposal: AssignmentProposal | undefined;

    if (proposalId) {
      targetProposal = assignment.proposals.find(p => p.id === proposalId || p.solverId === proposalId);
    }
    if (!targetProposal && solverId) {
      targetProposal = assignment.proposals.find(p => p.solverId === solverId || p.id === solverId);
    }
    if (!targetProposal && assignment.proposals.length === 1) {
      targetProposal = assignment.proposals[0];
    }

    if (!targetProposal) {
      return res.status(400).json({ success: false, message: 'Proposal not found.' });
    }

    // Helper can accept if the author made a counter offer to them
    const isHelperAcceptingCounter =
      targetProposal.counterBy === 'poster' &&
      (targetProposal.solverId === user.userId || (currentUser && targetProposal.solverId === currentUser.id));

    if (!isAuthor && !isHelperAcceptingCounter) {
      return res.status(403).json({ success: false, message: 'Only the assignment author or the counter-offer recipient can accept.' });
    }

    const solverUser = db.users.find(u => u.id === targetProposal!.solverId);
    const assignedSolverId = targetProposal.solverId;
    const assignedSolverName = solverUser?.name || targetProposal.solverName || 'Campus Helper';
    const assignedSolverAvatar = solverUser?.avatar || targetProposal.solverAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    const assignedSolverCollege = solverUser?.collegeName || targetProposal.solverCollege || assignment.collegeName || 'Verified University';

    // If there's an agreed counterPrice, update the assignment bounty
    if (targetProposal.counterPrice && targetProposal.counterPrice > 0) {
      assignment.bounty = targetProposal.counterPrice;
      targetProposal.counterStatus = 'accepted';
    } else if (targetProposal.offeredPrice && targetProposal.offeredPrice > 0) {
      assignment.bounty = targetProposal.offeredPrice;
    }

    // Update assignment status
    assignment.status = 'assigned';
    assignment.solverId = assignedSolverId;
    assignment.solverName = assignedSolverName;
    assignment.solverAvatar = assignedSolverAvatar;
    assignment.solverCollege = assignedSolverCollege;
    assignment.assignedAt = new Date().toISOString();

    // Mark proposal accepted & others declined
    assignment.proposals.forEach(p => {
      if (p.id === targetProposal!.id || p.solverId === targetProposal!.solverId) {
        p.status = 'accepted';
        p.counterStatus = 'accepted';
      } else if (p.status === 'pending') {
        p.status = 'declined';
        p.counterStatus = 'declined';
      }
    });

    // Update escrow payee and amount
    const escrowTx = escrowLedger.find((t: any) => t.referenceId === assignment.id && t.status === 'held');
    if (escrowTx) {
      escrowTx.payeeId = assignedSolverId;
      escrowTx.amount = assignment.bounty;
    } else if (assignment.bounty > 0 && assignment.escrowStatus !== 'held') {
      EscrowService.holdFunds({
        campusId: assignment.campusId,
        payerId: assignment.studentId,
        payeeId: assignedSolverId,
        amount: assignment.bounty,
        type: 'assignment_bounty',
        referenceId: assignment.id,
        note: `Bounty held for assignment: ${assignment.title.slice(0, 40)}`
      });
      assignment.escrowStatus = 'held';
    }

    // Notify solver
    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: assignment.campusId,
      userId: assignedSolverId,
      type: 'assignment' as any,
      title: `🎉 Offer Accepted: "${assignment.title}"!`,
      message: `You were selected to solve this assignment! Bounty of ₹${assignment.bounty.toLocaleString()} is held in escrow. Due before ${assignment.deadline}.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notif);
    sendRealTimeNotification(assignedSolverId, notif);

    broadcastAssignmentUpdate(assignment, assignedSolverId, 'assignment_assigned_to_you');

    res.json({
      success: true,
      message: `Offer accepted! ${assignedSolverName} is now assigned to complete your assignment for ₹${assignment.bounty.toLocaleString()}.`,
      assignment
    });
  },

  // POST /api/assignments/:id/submit
  submitSolution(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const { solutionNotes, solutionFileUrl, solutionFileName } = req.body;
    if (!solutionNotes && !solutionFileUrl) {
      return res.status(400).json({ success: false, message: 'Please provide solution notes or upload a solution file.' });
    }

    const currentUser = db.users.find(u => u.id === user.userId);
    const isStudentAuthor =
      assignment.studentId === user.userId ||
      (currentUser && assignment.studentId === currentUser.id);

    // If author is testing self-submission, attribute gracefully so the workflow tests end-to-end smoothly
    const solverId = isStudentAuthor
      ? `peer_tester_${currentUser?.id || user.userId}`
      : (currentUser?.id || user.userId);
    const solverName = isStudentAuthor
      ? `${currentUser?.name || user.name || 'Campus Student'} (Peer Solver)`
      : (currentUser?.name || user.name || 'Campus Solver');

    // Automatically assign solver if open or if claimed
    assignment.solverId = solverId;
    assignment.solverName = solverName;
    assignment.solverAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    assignment.solverCollege = currentUser?.collegeName || user.collegeName || 'Verified University';
    if (!assignment.assignedAt) {
      assignment.assignedAt = new Date().toISOString();
    }

    const submission: AssignmentSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      solverId,
      solverName,
      submittedAt: new Date().toISOString(),
      solutionNotes: solutionNotes ? solutionNotes.trim() : '',
      solutionFileUrl: solutionFileUrl || undefined,
      solutionFileName: solutionFileName || undefined,
      status: 'submitted'
    };

    assignment.submission = submission;
    assignment.status = 'submitted';

    // Notify poster
    const notif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: assignment.campusId,
      userId: assignment.studentId,
      type: 'assignment' as any,
      title: `✅ Result Submitted: ${assignment.title}`,
      message: `${solverName} submitted the completed assignment result! Please review and release escrow payout.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notif);
    sendRealTimeNotification(assignment.studentId, notif);

    broadcastAssignmentUpdate(assignment, assignment.studentId, 'assignment_solution_submitted');

    res.json({
      success: true,
      message: 'Assignment result successfully submitted! The student has been notified to review and release funds.',
      assignment
    });
  },

  // POST /api/assignments/:id/review
  reviewSolution(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const currentUser = db.users.find(u => u.id === user.userId);
    const isAuthor =
      assignment.studentId === user.userId ||
      (currentUser && assignment.studentId === currentUser.id) ||
      user.role === 'admin' ||
      (assignment.studentEmail && assignment.studentEmail === user.email);

    if (!isAuthor) {
      return res.status(403).json({ success: false, message: 'Only the assignment author can review submissions.' });
    }

    if (!assignment.submission) {
      return res.status(400).json({ success: false, message: 'No submission found to review.' });
    }

    const { action, rating, review, revisionFeedback } = req.body;

    if (action === 'approve') {
      assignment.status = 'completed';
      assignment.submission.status = 'approved';
      if (rating) assignment.studentRating = Number(rating);
      if (review) assignment.studentReview = review.trim();

      // Release escrow bounty to solver
      if (assignment.bounty > 0 && assignment.escrowStatus === 'held') {
        const releaseRes = EscrowService.releaseFunds(assignment.id);
        if (releaseRes.success) {
          assignment.escrowStatus = 'released';
        }
      }

      // Notify solver
      if (assignment.solverId) {
        const notif = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          campusId: assignment.campusId,
          userId: assignment.solverId,
          type: 'assignment' as any,
          title: `💰 Bounty Released: ₹${assignment.bounty.toLocaleString()}!`,
          message: `Your solution for "${assignment.title}" was approved by ${assignment.studentName}. Funds credited to your wallet balance!`,
          read: false,
          createdAt: new Date().toISOString()
        };
        db.notifications.push(notif);
        sendRealTimeNotification(assignment.solverId, notif);
      }

      broadcastAssignmentUpdate(assignment, assignment.solverId, 'assignment_completed');

      return res.json({
        success: true,
        message: 'Solution approved and bounty funds released to solver!',
        assignment
      });
    } else if (action === 'request_revision') {
      assignment.status = 'assigned';
      assignment.submission.status = 'revision_requested';
      assignment.submission.reviewFeedback = revisionFeedback ? revisionFeedback.trim() : 'Please check and revise the solution.';

      if (assignment.solverId) {
        const notif = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          campusId: assignment.campusId,
          userId: assignment.solverId,
          type: 'assignment' as any,
          title: `✏️ Revision Requested: ${assignment.title}`,
          message: `${assignment.studentName} requested changes: "${(revisionFeedback || '').slice(0, 80)}"`,
          read: false,
          createdAt: new Date().toISOString()
        };
        db.notifications.push(notif);
        sendRealTimeNotification(assignment.solverId, notif);
      }

      broadcastAssignmentUpdate(assignment, assignment.solverId, 'assignment_revision_requested');

      return res.json({
        success: true,
        message: 'Revision request sent to solver.',
        assignment
      });
    }

    res.status(400).json({ success: false, message: 'Invalid action. Must be "approve" or "request_revision".' });
  },

  // POST /api/assignments/:id/cancel
  cancelAssignment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (assignment.studentId !== user.userId && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this assignment.' });
    }

    if (assignment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Completed assignments cannot be cancelled.' });
    }

    // Refund escrow if held
    if (assignment.bounty > 0 && assignment.escrowStatus === 'held') {
      EscrowService.refundFunds(assignment.id, 'Assignment cancelled by poster');
      assignment.escrowStatus = 'refunded';
    }

    assignment.status = 'cancelled';

    if (assignment.solverId) {
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        campusId: assignment.campusId,
        userId: assignment.solverId,
        type: 'assignment' as any,
        title: `⚠️ Assignment Cancelled: ${assignment.title}`,
        message: `The poster has cancelled this assignment.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      db.notifications.push(notif);
      sendRealTimeNotification(assignment.solverId, notif);
    }

    broadcastAssignmentUpdate(assignment);

    res.json({
      success: true,
      message: 'Assignment cancelled. Any held bounty has been refunded to your wallet.',
      assignment
    });
  },

  // DELETE /api/assignments/:id
  deleteAssignment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const index = db.assignments.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const assignment = db.assignments[index];
    if (assignment.studentId !== user.userId && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this assignment.' });
    }

    // Refund escrow if held
    if (assignment.bounty > 0 && assignment.escrowStatus === 'held') {
      EscrowService.refundFunds(assignment.id, 'Assignment deleted');
    }

    db.assignments.splice(index, 1);

    if (assignment.solverId) {
      sendRealTimeNotification(assignment.solverId, {
        id: `notif_${Date.now()}`,
        campusId: assignment.campusId,
        userId: assignment.solverId,
        type: 'assignment',
        title: `Assignment Deleted`,
        message: `Assignment "${assignment.title}" was removed.`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Assignment removed.' });
  },

  addDemoOffer: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const assignment = db.assignments.find(a => a.id === id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found.' });
      }

      if (assignment.status !== 'open') {
        return res.status(400).json({ success: false, message: 'Offers can only be added to open assignments.' });
      }

      const sampleHelpers = [
        {
          name: 'Rohan Sharma',
          college: 'CS & Engineering, Year 3',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          pitch: 'I took this exact course with an A grade. Have sample implementations ready with rigorous unit test suites and detailed explanations.',
          proposedTime: 'Within 12 hours',
          price: assignment.bounty
        },
        {
          name: 'Ananya Deshmukh',
          college: 'Mathematics & Data Science, Year 4',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          pitch: 'Skilled in formal proofs and structured code design. Will provide comprehensive documentation and step-by-step logic.',
          proposedTime: 'Within 18 hours',
          price: Math.max(100, assignment.bounty - 50)
        },
        {
          name: 'Vikram Seth',
          college: 'Electrical & Computing, Year 4',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          pitch: 'Peer lab tutor for 2 semesters. Will deliver clean verified solutions with comments and test verification runs.',
          proposedTime: 'Within 24 hours',
          price: assignment.bounty
        }
      ];

      const pick = sampleHelpers[assignment.proposals.length % sampleHelpers.length];
      const proposal: AssignmentProposal = {
        id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        solverId: `solver_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        solverName: pick.name,
        solverAvatar: pick.avatar,
        solverCollege: pick.college,
        proposedTime: pick.proposedTime,
        pitch: pick.pitch,
        offeredPrice: pick.price,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      assignment.proposals.push(proposal);

      sendRealTimeNotification(assignment.studentId, {
        id: `notif_${Date.now()}`,
        campusId: assignment.campusId,
        userId: assignment.studentId,
        type: 'assignment_bid',
        title: 'New Offer Received!',
        message: `${pick.name} gave an offer of ₹${proposal.offeredPrice} on "${assignment.title}". Click Accept Offer to start!`,
        read: false,
        createdAt: new Date().toISOString(),
        data: { assignmentId: assignment.id, proposalId: proposal.id }
      });

      return res.json({
        success: true,
        message: `Sample offer added from ${pick.name}!`,
        assignment
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};
