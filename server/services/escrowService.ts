// server/services/escrowService.ts
import { EscrowTransactionModel, UserModel } from '../models/schemas.ts';

export const EscrowService = {
  /** Hold funds from payer wallet into escrow */
  async holdFunds(params: {
    campusId: string;
    payerId: string;
    payeeId: string;
    amount: number;
    type: 'tutoring_escrow' | 'equipment_deposit' | 'equipment_rent' | 'note_purchase' | 'assignment_bounty';
    referenceId: string;
    note?: string;
  }) {
    const payer = await UserModel.findOne({ id: params.payerId });
    if (!payer) return { success: false as const, error: 'Payer account not found.' };

    // Auto-topup mock behavior from original
    if (payer.walletBalance < params.amount) {
      payer.walletBalance += Math.max(100, params.amount * 2);
    }

    payer.walletBalance -= params.amount;
    payer.escrowBalance += params.amount;
    await payer.save();

    const tx = await EscrowTransactionModel.create({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      campusId: params.campusId,
      payerId: params.payerId,
      payeeId: params.payeeId,
      amount: params.amount,
      type: params.type,
      referenceId: params.referenceId,
      status: 'held',
      createdAt: new Date().toISOString(),
      note: params.note,
    });

    return { success: true as const, transaction: tx };
  },

  /** Release escrow funds to payee */
  async releaseFunds(referenceId: string) {
    const tx = await EscrowTransactionModel.findOne({ referenceId, status: 'held' });
    if (!tx) return { success: false as const, error: 'Active escrow transaction not found.' };

    const payer = await UserModel.findOne({ id: tx.payerId });
    const payee = await UserModel.findOne({ id: tx.payeeId });

    if (payer) {
      payer.escrowBalance = Math.max(0, payer.escrowBalance - tx.amount);
      await payer.save();
    }
    if (payee) {
      payee.walletBalance += tx.amount;
      await payee.save();
    }

    tx.status = 'released';
    tx.releasedAt = new Date().toISOString();
    await tx.save();

    return { success: true as const, transaction: tx };
  },

  /** Refund escrow funds back to payer */
  async refundFunds(referenceId: string, reason?: string) {
    const tx = await EscrowTransactionModel.findOne({ referenceId, status: 'held' });
    if (!tx) return { success: false as const, error: 'Active escrow transaction not found.' };

    const payer = await UserModel.findOne({ id: tx.payerId });
    if (payer) {
      payer.escrowBalance = Math.max(0, payer.escrowBalance - tx.amount);
      payer.walletBalance += tx.amount;
      await payer.save();
    }

    tx.status = 'refunded';
    tx.refundedAt = new Date().toISOString();
    tx.note = reason ? `${tx.note || ''} (Refunded: ${reason})` : tx.note;
    await tx.save();

    return { success: true as const, transaction: tx };
  },

  async getTransactionsForUser(userId: string) {
    return EscrowTransactionModel.find({
      $or: [{ payerId: userId }, { payeeId: userId }],
    }).lean();
  },
};