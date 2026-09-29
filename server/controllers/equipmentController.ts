import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { validateEquipmentInput } from '../validators/validators.ts';
import { Equipment, EquipmentRental } from '../models/types.ts';
import { EscrowService } from '../services/escrowService.ts';

export const EquipmentController = {
  getEquipment(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId as string;
    const { category, condition, status, search } = req.query;

    let items = db.equipment;

    if (requestedCampus && requestedCampus !== 'all') {
      items = items.filter(e => e.campusId === requestedCampus);
    }

    if (category && category !== 'All') {
      items = items.filter(e => e.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (condition && condition !== 'All') {
      items = items.filter(e => e.condition.toLowerCase() === (condition as string).toLowerCase());
    }
    if (status && status !== 'All') {
      items = items.filter(e => e.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      items = items.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.collegeName && e.collegeName.toLowerCase().includes(q))
      );
    }

    const enrichedItems = items.map(e => {
      const owner = db.users.find(u => u.id === e.ownerId);
      return {
        ...e,
        collegeName: e.collegeName || owner?.collegeName || 'Verified University'
      };
    });

    res.json({ success: true, equipment: enrichedItems });
  },

  createEquipment(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const error = validateEquipmentInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newEquipment: Equipment = {
      id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user.campusId,
      collegeName: user.collegeName,
      ownerId: user.id,
      ownerName: user.name,
      ownerAvatar: user.avatar,
      name: req.body.name.trim(),
      category: req.body.category,
      condition: req.body.condition || 'Good',
      description: req.body.description || 'College equipment in working condition.',
      imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
      pricePerDay: Number(req.body.pricePerDay) >= 0 ? Number(req.body.pricePerDay) : 0,
      deposit: Number(req.body.deposit) >= 0 ? Number(req.body.deposit) : 0,
      lateFeePerDay: Number(req.body.lateFeePerDay) >= 0 ? Number(req.body.lateFeePerDay) : 0,
      allowBuy: Boolean(req.body.allowBuy),
      buyPrice: req.body.allowBuy ? (Number(req.body.buyPrice) >= 0 ? Number(req.body.buyPrice) : 0) : undefined,
      status: 'available',
      availabilityDays: req.body.availabilityDays || 'Monday - Sunday',
      rentHistory: [],
      createdAt: new Date().toISOString()
    };

    db.equipment.unshift(newEquipment);

    res.status(201).json({
      success: true,
      message: 'Equipment listed successfully.',
      equipment: newEquipment
    });
  },

  requestRental(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { days = 3 } = req.body;
    const item = db.equipment.find(e => e.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Equipment not found.' });

    if (item.status !== 'available') {
      return res.status(400).json({ success: false, message: 'This item is currently rented out or in maintenance.' });
    }

    if (item.ownerId === req.user.userId) {
      return res.status(400).json({ success: false, message: 'You cannot rent your own equipment.' });
    }

    const renter = db.users.find(u => u.id === req.user?.userId);
    const rentalDays = Math.max(1, Number(days));
    const rentalFee = rentalDays * item.pricePerDay;
    const totalDue = rentalFee + item.deposit;

    // Escrow hold for deposit + rental
    const escrowResult = EscrowService.holdFunds({
      campusId: item.campusId,
      payerId: req.user.userId,
      payeeId: item.ownerId,
      amount: totalDue,
      type: 'equipment_deposit',
      referenceId: `rental_${item.id}_${Date.now()}`,
      note: `Rental of ${item.name} (${rentalDays} days + $${item.deposit} deposit)`
    });

    if (!escrowResult.success) {
      return res.status(400).json({ success: false, message: escrowResult.error });
    }

    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(startDate.getDate() + rentalDays);

    const rental: EquipmentRental = {
      rentalId: escrowResult.transaction?.referenceId || `rent_${Date.now()}`,
      renterId: req.user.userId,
      renterName: renter?.name || req.user.name,
      renterAvatar: renter?.avatar || '',
      startDate: startDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      totalDays: rentalDays,
      rentalFee,
      depositHeld: item.deposit,
      status: 'active'
    };

    item.status = 'rented';
    item.activeRental = rental;

    // Notify owner
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      campusId: item.campusId,
      userId: item.ownerId,
      type: 'equipment',
      title: 'Equipment Rented!',
      message: `${renter?.name} rented your ${item.name}. Due on ${rental.dueDate}. Deposit $${item.deposit} secured in escrow.`,
      read: false,
      link: '/equipment',
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Equipment rented! Return by ${rental.dueDate} to reclaim your $${item.deposit} security deposit.`,
      equipment: item,
      rental
    });
  },

  returnEquipment(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const item = db.equipment.find(e => e.id === req.params.id);
    if (!item || !item.activeRental) {
      return res.status(400).json({ success: false, message: 'No active rental found for this item.' });
    }

    // Owner or admin or renter can trigger return confirmation
    const isOwner = item.ownerId === req.user.userId;
    const isRenter = item.activeRental.renterId === req.user.userId;
    if (!isOwner && !isRenter && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to return this item.' });
    }

    const rental = item.activeRental;
    const dueDateObj = new Date(rental.dueDate);
    const today = new Date();

    let lateFee = 0;
    if (today > dueDateObj) {
      const diffTime = Math.abs(today.getTime() - dueDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      lateFee = diffDays * item.lateFeePerDay;
    }

    rental.returnDate = today.toISOString().split('T')[0];
    rental.status = lateFee > 0 ? 'overdue' : 'returned';
    rental.lateFeeCharged = lateFee;

    // Release rental fee to owner
    const owner = db.users.find(u => u.id === item.ownerId);
    if (owner) {
      owner.walletBalance += rental.rentalFee + Math.min(lateFee, rental.depositHeld);
    }

    // Release remaining deposit back to renter
    const renter = db.users.find(u => u.id === rental.renterId);
    const depositReturn = Math.max(0, rental.depositHeld - lateFee);
    if (renter) {
      renter.walletBalance += depositReturn;
      renter.escrowBalance = Math.max(0, renter.escrowBalance - (rental.rentalFee + rental.depositHeld));
    }

    item.rentHistory.unshift({ ...rental });
    item.activeRental = undefined;
    item.status = 'available';

    res.json({
      success: true,
      message: `Equipment marked returned. $${depositReturn} deposit refunded to renter. Late fees assessed: $${lateFee}.`,
      equipment: item
    });
  },

  purchaseEquipment(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const item = db.equipment.find(e => e.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Equipment not found.' });

    if (item.status !== 'available') {
      return res.status(400).json({ success: false, message: `Item cannot be purchased because it is currently ${item.status}.` });
    }

    if (!item.allowBuy && item.buyPrice === undefined) {
      return res.status(400).json({ success: false, message: 'This item is only available for temporary rental, not permanent purchase.' });
    }

    if (item.ownerId === req.user.userId) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own equipment.' });
    }

    const buyer = db.users.find(u => u.id === req.user?.userId);
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer profile not found.' });

    const price = item.buyPrice !== undefined ? Number(item.buyPrice) : 0;

    if (price > 0) {
      if (buyer.walletBalance < price) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Total due is ₹${price.toLocaleString()}, but your current wallet balance is ₹${buyer.walletBalance.toLocaleString()}. Please top up in your Profile.`
        });
      }

      // Deduct from buyer
      buyer.walletBalance -= price;

      // Credit to owner
      const owner = db.users.find(u => u.id === item.ownerId);
      if (owner) {
        owner.walletBalance += price;
      }
    }

    // Mark as permanently sold
    item.status = 'sold';
    item.purchasedBy = {
      buyerId: buyer.id,
      buyerName: buyer.name,
      date: new Date().toISOString(),
      amount: price
    };

    // Notify owner
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      campusId: item.campusId,
      userId: item.ownerId,
      type: 'equipment',
      title: 'Equipment Sold Permanently!',
      message: `${buyer.name} purchased your "${item.name}" permanently${price > 0 ? ` for ₹${price.toLocaleString()}` : ' as a free transfer'}.`,
      read: false,
      link: '/equipment',
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Congratulations! You have permanently purchased ${item.name}${price === 0 ? ' for Free' : ` for ₹${price.toLocaleString()}`}.`,
      equipment: item,
      buyerWalletBalance: buyer.walletBalance
    });
  },

  deleteEquipment(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const index = db.equipment.findIndex(e => e.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Equipment not found.' });

    const item = db.equipment[index];
    if (item.ownerId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete your own equipment listings.' });
    }

    if (item.status === 'rented') {
      return res.status(400).json({ success: false, message: 'Cannot delete equipment while an active rental is in progress.' });
    }

    db.equipment.splice(index, 1);

    res.json({
      success: true,
      message: 'Equipment listing removed.'
    });
  }
};
