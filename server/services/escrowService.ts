import { db } from '../config/db.ts';

export interface EscrowTransaction {
  id: string;
  campusId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  type: 'tutoring_escrow' | 'equipment_deposit' | 'equipment_rent' | 'note_purchase' | 'assignment_bounty';
  referenceId: string;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  createdAt: string;
  releasedAt?: string;
  refundedAt?: string;
  note?: string;
}

export const escrowLedger: EscrowTransaction[] = [];

export const EscrowService = {
  /**
   * Hold funds from payer wallet into escrow
   */
  holdFunds(params: {
    campusId: string;
    payerId: string;
    payeeId: string;
    amount: number;
    type: EscrowTransaction['type'];
    referenceId: string;
    note?: string;
  }): { success: boolean; transaction?: EscrowTransaction; error?: string } {
    const payer = db.users.find(u => u.id === params.payerId);
    if (!payer) return { success: false, error: 'Payer account not found.' };

    if (payer.walletBalance < params.amount) {
      // Allow instant mock wallet auto-topup for seamless testing if desired, or error
      payer.walletBalance += Math.max(100, params.amount * 2);
    }

    payer.walletBalance -= params.amount;
    payer.escrowBalance += params.amount;

    const tx: EscrowTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      campusId: params.campusId,
      payerId: params.payerId,
      payeeId: params.payeeId,
      amount: params.amount,
      type: params.type,
      referenceId: params.referenceId,
      status: 'held',
      createdAt: new Date().toISOString(),
      note: params.note
    };

    escrowLedger.push(tx);
    return { success: true, transaction: tx };
  },

  /**
   * Release escrow funds to payee (e.g. after successful tutoring session or equipment return)
   */
  releaseFunds(referenceId: string): { success: boolean; transaction?: EscrowTransaction; error?: string } {
    const tx = escrowLedger.find(t => t.referenceId === referenceId && t.status === 'held');
    if (!tx) return { success: false, error: 'Active escrow transaction not found.' };

    const payer = db.users.find(u => u.id === tx.payerId);
    const payee = db.users.find(u => u.id === tx.payeeId);

    if (payer) {
      payer.escrowBalance = Math.max(0, payer.escrowBalance - tx.amount);
    }
    if (payee) {
      payee.walletBalance += tx.amount;
    }

    tx.status = 'released';
    tx.releasedAt = new Date().toISOString();

    return { success: true, transaction: tx };
  },

  /**
   * Refund escrow funds back to payer (e.g. cancelled session or rental dispute resolution)
   */
  refundFunds(referenceId: string, reason?: string): { success: boolean; transaction?: EscrowTransaction; error?: string } {
    const tx = escrowLedger.find(t => t.referenceId === referenceId && t.status === 'held');
    if (!tx) return { success: false, error: 'Active escrow transaction not found.' };

    const payer = db.users.find(u => u.id === tx.payerId);
    if (payer) {
      payer.escrowBalance = Math.max(0, payer.escrowBalance - tx.amount);
      payer.walletBalance += tx.amount;
    }

    tx.status = 'refunded';
    tx.refundedAt = new Date().toISOString();
    tx.note = reason ? `${tx.note || ''} (Refunded: ${reason})` : tx.note;

    return { success: true, transaction: tx };
  },

  getTransactionsForUser(userId: string) {
    return escrowLedger.filter(tx => tx.payerId === userId || tx.payeeId === userId);
  }
};
