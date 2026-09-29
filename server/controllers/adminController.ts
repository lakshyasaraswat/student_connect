import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { EscrowService } from '../services/escrowService.ts';
import { SUPPORTED_CAMPUSES } from '../config/constants.ts';
import {
  UserModel,
  RideModel,
  NoteModel,
  EquipmentModel,
  TutorProfileModel,
  TutoringSessionModel,
  StudyGroupModel,
  RoommatePostModel,
  PGListingModel,
  EscrowTransactionModel,
} from '../models/schemas.ts';

export const AdminController = {
  async getOverviewMetrics(req: AuthenticatedRequest, res: Response) {
    const [
      totalStudents,
      totalRides,
      activeRides,
      totalNotes,
      totalEquipment,
      activeRentals,
      totalTutors,
      totalSessions,
      totalStudyGroups,
      totalRoommatePosts,
      totalListings,
    ] = await Promise.all([
      UserModel.countDocuments(),
      RideModel.countDocuments(),
      RideModel.countDocuments({ status: 'active' }),
      NoteModel.countDocuments(),
      EquipmentModel.countDocuments(),
      EquipmentModel.countDocuments({ status: 'rented' }),
      TutorProfileModel.countDocuments(),
      TutoringSessionModel.countDocuments(),
      StudyGroupModel.countDocuments(),
      RoommatePostModel.countDocuments(),
      PGListingModel.countDocuments(),
    ]);

    // Total notes sold — sum of purchasedBy lengths across all notes
    const notesAgg = await NoteModel.aggregate([
      { $project: { c: { $size: { $ifNull: ['$purchasedBy', []] } } } },
      { $group: { _id: null, total: { $sum: '$c' } } },
    ]);
    const totalNotesSold = notesAgg[0]?.total ?? 0;

    // Escrow stats
    const [escrowHeldAgg, escrowReleasedAgg, escrowCount] = await Promise.all([
      EscrowTransactionModel.aggregate([
        { $match: { status: 'held' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      EscrowTransactionModel.aggregate([
        { $match: { status: 'released' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      EscrowTransactionModel.countDocuments(),
    ]);

    const totalEscrowHeld = escrowHeldAgg[0]?.total ?? 0;
    const totalEscrowReleased = escrowReleasedAgg[0]?.total ?? 0;

    // Campus breakdown — aggregate counts per campus in parallel
    const campusBreakdown = await Promise.all(
      SUPPORTED_CAMPUSES.map(async (c) => {
        const [studentCount, ridesCount, notesCount, listingsCount] =
          await Promise.all([
            UserModel.countDocuments({ campusId: c.id }),
            RideModel.countDocuments({ campusId: c.id }),
            NoteModel.countDocuments({ campusId: c.id }),
            PGListingModel.countDocuments({ campusId: c.id }),
          ]);
        return {
          campusId: c.id,
          name: c.name,
          domain: c.domain,
          studentCount,
          ridesCount,
          notesCount,
          listingsCount,
        };
      })
    );

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
        escrowTransactionsCount: escrowCount,
        campusBreakdown,
      },
    });
  },

  async getAllUsers(req: AuthenticatedRequest, res: Response) {
    const users = await UserModel.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  },

  async getAllEscrowTransactions(
    req: AuthenticatedRequest,
    res: Response
  ) {
    const transactions = await EscrowTransactionModel.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, transactions });
  },

  async resolveEscrowDispute(req: AuthenticatedRequest, res: Response) {
    const { referenceId, resolution } = req.body;

    if (resolution === 'release_to_seller') {
      const result = await EscrowService.releaseFunds(referenceId);
      if (!result.success) return res.status(400).json(result);
      return res.json({
        success: true,
        message: 'Dispute resolved: Escrow released to payee.',
        transaction: result.transaction,
      });
    } else {
      const result = await EscrowService.refundFunds(
        referenceId,
        'Admin resolution: Refunded to student.'
      );
      if (!result.success) return res.status(400).json(result);
      return res.json({
        success: true,
        message: 'Dispute resolved: Escrow refunded to payer.',
        transaction: result.transaction,
      });
    }
  },

  async verifyListing(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    const listing = await PGListingModel.findOne({ id });
    if (!listing)
      return res
        .status(404)
        .json({ success: false, message: 'Listing not found.' });

    listing.verified = true;
    await listing.save();

    res.json({
      success: true,
      message: 'Listing verified by Campus Moderator/Admin.',
      listing: listing.toObject(),
    });
  },

  async toggleUserVerification(
    req: AuthenticatedRequest,
    res: Response
  ) {
    const id = String(req.params.id);
    const user = await UserModel.findOne({ id });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });

    user.isVerified = !user.isVerified;
    user.idVerificationStatus = user.isVerified ? 'verified' : 'pending';
    user.idVerificationNotes = user.isVerified
      ? 'Verified by campus administrator.'
      : 'Pending administrator verification.';
    await user.save();

    res.json({
      success: true,
      message: `User status set to ${user.isVerified ? 'Verified' : 'Pending'
        }.`,
      user: user.toObject(),
    });
  },

  async approveUserVerification(
    req: AuthenticatedRequest,
    res: Response
  ) {
    const id = String(req.params.id);
    const user = await UserModel.findOne({ id });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });

    user.isVerified = true;
    user.idVerificationStatus = 'verified';
    user.idVerificationNotes = `Student ID verified & approved by Administrator on ${new Date().toLocaleDateString()}.`;
    await user.save();

    res.json({
      success: true,
      message: `Student ID for ${user.name} verified and approved.`,
      user: user.toObject(),
    });
  },

  async rejectUserVerification(
    req: AuthenticatedRequest,
    res: Response
  ) {
    const id = String(req.params.id);
    const {
      reason = 'ID card document unclear or details mismatch registrar roster.',
    } = req.body;

    const user = await UserModel.findOne({ id });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });

    user.isVerified = false;
    user.idVerificationStatus = 'rejected';
    user.idVerificationNotes = `ID Verification rejected: ${reason}`;
    await user.save();

    res.json({
      success: true,
      message: `Student ID for ${user.name} rejected.`,
      user: user.toObject(),
    });
  },
};