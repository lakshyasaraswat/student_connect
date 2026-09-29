import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { EscrowService, escrowLedger } from '../services/escrowService.ts';
import { SUPPORTED_CAMPUSES } from '../config/constants.ts';

export const AdminController = {
  getOverviewMetrics(req: AuthenticatedRequest, res: Response) {
    const totalStudents = db.users.length;
    const totalRides = db.rides.length;
    const activeRides = db.rides.filter(r => r.status === 'active').length;
    const totalNotes = db.notes.length;
    const totalNotesSold = db.notes.reduce((acc, n) => acc + n.purchasedBy.length, 0);
    const totalEquipment = db.equipment.length;
    const activeRentals = db.equipment.filter(e => e.status === 'rented').length;
    const totalTutors = db.tutors.length;
    const totalSessions = db.sessions.length;
    const totalStudyGroups = db.studyGroups.length;
    const totalRoommatePosts = db.roommates.length;
    const totalListings = db.listings.length;

    // Escrow stats
    const totalEscrowHeld = escrowLedger
      .filter(t => t.status === 'held')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalEscrowReleased = escrowLedger
      .filter(t => t.status === 'released')
      .reduce((acc, t) => acc + t.amount, 0);

    // Campus breakdown
    const campusBreakdown = SUPPORTED_CAMPUSES.map(c => ({
      campusId: c.id,
      name: c.name,
      domain: c.domain,
      studentCount: db.users.filter(u => u.campusId === c.id).length,
      ridesCount: db.rides.filter(r => r.campusId === c.id).length,
      notesCount: db.notes.filter(n => n.campusId === c.id).length,
      listingsCount: db.listings.filter(l => l.campusId === c.id).length
    }));

    res.json({
      success: true,
      metrics: {
        totalStudents,
        totalRides,
        activeRides,
        totalNotes,
        totalNotesSold,
        totalEquipment,
        activeRentals,
        totalTutors,
        totalSessions,
        totalStudyGroups,
        totalRoommatePosts,
        totalListings,
        totalEscrowHeld,
        totalEscrowReleased,
        escrowTransactionsCount: escrowLedger.length,
        campusBreakdown
      }
    });
  },

  getAllUsers(req: AuthenticatedRequest, res: Response) {
    res.json({ success: true, users: db.users });
  },

  getAllEscrowTransactions(req: AuthenticatedRequest, res: Response) {
    res.json({ success: true, transactions: escrowLedger });
  },

  resolveEscrowDispute(req: AuthenticatedRequest, res: Response) {
    const { referenceId, resolution } = req.body; // resolution: 'release_to_seller' | 'refund_to_buyer'

    if (resolution === 'release_to_seller') {
      const result = EscrowService.releaseFunds(referenceId);
      if (!result.success) return res.status(400).json(result);
      return res.json({ success: true, message: 'Dispute resolved: Escrow released to payee.', transaction: result.transaction });
    } else {
      const result = EscrowService.refundFunds(referenceId, 'Admin resolution: Refunded to student.');
      if (!result.success) return res.status(400).json(result);
      return res.json({ success: true, message: 'Dispute resolved: Escrow refunded to payer.', transaction: result.transaction });
    }
  },

  verifyListing(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const listing = db.listings.find(l => l.id === id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    listing.verified = true;
    res.json({ success: true, message: 'Listing verified by Campus Moderator/Admin.', listing });
  },

  toggleUserVerification(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = db.users.find(u => u.id === id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isVerified = !user.isVerified;
    user.idVerificationStatus = user.isVerified ? 'verified' : 'pending';
    user.idVerificationNotes = user.isVerified ? 'Verified by campus administrator.' : 'Pending administrator verification.';
    res.json({ success: true, message: `User status set to ${user.isVerified ? 'Verified' : 'Pending'}.`, user });
  },

  approveUserVerification(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const user = db.users.find(u => u.id === id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isVerified = true;
    user.idVerificationStatus = 'verified';
    user.idVerificationNotes = `Student ID verified & approved by Administrator on ${new Date().toLocaleDateString()}.`;
    res.json({ success: true, message: `Student ID for ${user.name} verified and approved.`, user });
  },

  rejectUserVerification(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { reason = 'ID card document unclear or details mismatch registrar roster.' } = req.body;
    const user = db.users.find(u => u.id === id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isVerified = false;
    user.idVerificationStatus = 'rejected';
    user.idVerificationNotes = `ID Verification rejected: ${reason}`;
    res.json({ success: true, message: `Student ID for ${user.name} rejected.`, user });
  }
};
