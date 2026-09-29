import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { validateEquipmentInput } from '../validators/validators.ts';
import {
  EquipmentModel,
  UserModel,
  AppNotificationModel,
} from '../models/schemas.ts';
import { EscrowService } from '../services/escrowService.ts';

export const EquipmentController = {
  async getEquipment(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId
      ? String(req.query.campusId)
      : undefined;
    const category = req.query.category ? String(req.query.category) : undefined;
    const condition = req.query.condition
      ? String(req.query.condition)
      : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const filter: any = {};
    if (requestedCampus && requestedCampus !== 'all')
      filter.campusId = requestedCampus;
    if (category && category !== 'All')
      filter.category = new RegExp(`^${category}$`, 'i');
    if (condition && condition !== 'All')
      filter.condition = new RegExp(`^${condition}$`, 'i');
    if (status && status !== 'All') filter.status = status;
    if (search) {
      const rx = new RegExp(search, 'i');
      filter.$or = [{ name: rx }, { description: rx }, { collegeName: rx }];
    }

    const items = await EquipmentModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich collegeName from owner if missing
    const ownerIds = Array.from(new Set(items.map((e: any) => e.ownerId)));
    const owners = await UserModel.find({ id: { $in: ownerIds } }).lean();
    const ownerMap = new Map<string, any>(owners.map((u: any) => [u.id, u]));

    const enrichedItems = items.map((e: any) => ({
      ...e,
      collegeName:
        e.collegeName ||
        ownerMap.get(e.ownerId)?.collegeName ||
        'Verified University',
    }));

    res.json({ success: true, equipment: enrichedItems });
  },

  async createEquipment(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const error = validateEquipmentInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const user: any = await UserModel.findOne({ id: req.user.userId }).lean();
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const newEquipment = await EquipmentModel.create({
      id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user.campusId,
      collegeName: user.collegeName,
      ownerId: user.id,
      ownerName: user.name,
      ownerAvatar: user.avatar,
      name: req.body.name.trim(),
      category: req.body.category,
      condition: req.body.condition || 'Good',
      description:
        req.body.description || 'College equipment in working condition.',
      imageUrl:
        req.body.imageUrl ||
        'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
      pricePerDay:
        Number(req.body.pricePerDay) >= 0 ? Number(req.body.pricePerDay) : 0,
      deposit: Number(req.body.deposit) >= 0 ? Number(req.body.deposit) : 0,
      lateFeePerDay:
        Number(req.body.lateFeePerDay) >= 0
          ? Number(req.body.lateFeePerDay)
          : 0,
      allowBuy: Boolean(req.body.allowBuy),
      buyPrice: req.body.allowBuy
        ? Number(req.body.buyPrice) >= 0
          ? Number(req.body.buyPrice)
          : 0
        : undefined,
      status: 'available',
      availabilityDays: req.body.availabilityDays || 'Monday - Sunday',
      rentHistory: [],
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Equipment listed successfully.',
      equipment: newEquipment.toObject(),
    });
  },

  async requestRental(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { days = 3 } = req.body;
    const id = String(req.params.id);

    const item: any = await EquipmentModel.findOne({ id });
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: 'Equipment not found.' });

    if (item.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'This item is currently rented out or in maintenance.',
      });
    }

    if (item.ownerId === req.user.userId) {
      return res
        .status(400)
        .json({ success: false, message: 'You cannot rent your own equipment.' });
    }

    const renter: any = await UserModel.findOne({ id: req.user.userId }).lean();
    const rentalDays = Math.max(1, Number(days));
    const rentalFee = rentalDays * item.pricePerDay;
    const totalDue = rentalFee + item.deposit;

    // ✅ FIXED: await the async EscrowService
    const escrowResult = await EscrowService.holdFunds({
      campusId: item.campusId,
      payerId: req.user.userId,
      payeeId: item.ownerId,
      amount: totalDue,
      type: 'equipment_deposit',
      referenceId: `rental_${item.id}_${Date.now()}`,
      note: `Rental of ${item.name} (${rentalDays} days + $${item.deposit} deposit)`,
    });

    if (!escrowResult.success) {
      return res
        .status(400)
        .json({ success: false, message: escrowResult.error });
    }

    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(startDate.getDate() + rentalDays);

    const rental = {
      rentalId: escrowResult.transaction?.referenceId || `rent_${Date.now()}`,
      renterId: req.user.userId,
      renterName: renter?.name || req.user.name,
      renterAvatar: renter?.avatar || '',
      startDate: startDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      totalDays: rentalDays,
      rentalFee,
      depositHeld: item.deposit,
      status: 'active' as const,
    };

    item.status = 'rented';
    item.activeRental = rental;
    await item.save();

    await AppNotificationModel.create({
      id: `notif_${Date.now()}`,
      campusId: item.campusId,
      userId: item.ownerId,
      type: 'equipment',
      title: 'Equipment Rented!',
      message: `${renter?.name} rented your ${item.name}. Due on ${rental.dueDate}. Deposit $${item.deposit} secured in escrow.`,
      read: false,
      link: '/equipment',
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Equipment rented! Return by ${rental.dueDate} to reclaim your $${item.deposit} security deposit.`,
      equipment: item.toObject(),
      rental,
    });
  },

  async returnEquipment(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const item: any = await EquipmentModel.findOne({ id });
    if (!item || !item.activeRental) {
      return res.status(400).json({
        success: false,
        message: 'No active rental found for this item.',
      });
    }

    const isOwner = item.ownerId === req.user.userId;
    const isRenter = item.activeRental.renterId === req.user.userId;
    if (!isOwner && !isRenter && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized to return this item.' });
    }

    const rental: any = item.activeRental;
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

    const owner: any = await UserModel.findOne({ id: item.ownerId });
    if (owner) {
      owner.walletBalance +=
        rental.rentalFee + Math.min(lateFee, rental.depositHeld);
      await owner.save();
    }

    const renter: any = await UserModel.findOne({ id: rental.renterId });
    const depositReturn = Math.max(0, rental.depositHeld - lateFee);
    if (renter) {
      renter.walletBalance += depositReturn;
      renter.escrowBalance = Math.max(
        0,
        renter.escrowBalance - (rental.rentalFee + rental.depositHeld)
      );
      await renter.save();
    }

    // Move active rental to history and mark item available
    item.rentHistory.unshift({ ...rental.toObject?.() ?? rental });
    item.activeRental = undefined;
    item.status = 'available';
    await item.save();

    res.json({
      success: true,
      message: `Equipment marked returned. $${depositReturn} deposit refunded to renter. Late fees assessed: $${lateFee}.`,
      equipment: item.toObject(),
    });
  },

  async purchaseEquipment(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const item: any = await EquipmentModel.findOne({ id });
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: 'Equipment not found.' });

    if (item.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `Item cannot be purchased because it is currently ${item.status}.`,
      });
    }

    if (!item.allowBuy && item.buyPrice === undefined) {
      return res.status(400).json({
        success: false,
        message:
          'This item is only available for temporary rental, not permanent purchase.',
      });
    }

    if (item.ownerId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot purchase your own equipment.',
      });
    }

    const buyer: any = await UserModel.findOne({ id: req.user.userId });
    if (!buyer)
      return res
        .status(404)
        .json({ success: false, message: 'Buyer profile not found.' });

    const price = item.buyPrice !== undefined ? Number(item.buyPrice) : 0;

    if (price > 0) {
      if (buyer.walletBalance < price) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Total due is ₹${price.toLocaleString()}, but your current wallet balance is ₹${buyer.walletBalance.toLocaleString()}. Please top up in your Profile.`,
        });
      }

      buyer.walletBalance -= price;
      await buyer.save();

      const owner: any = await UserModel.findOne({ id: item.ownerId });
      if (owner) {
        owner.walletBalance += price;
        await owner.save();
      }
    }

    item.status = 'sold';
    item.purchasedBy = {
      buyerId: buyer.id,
      buyerName: buyer.name,
      date: new Date().toISOString(),
      amount: price,
    };
    await item.save();

    await AppNotificationModel.create({
      id: `notif_${Date.now()}`,
      campusId: item.campusId,
      userId: item.ownerId,
      type: 'equipment',
      title: 'Equipment Sold Permanently!',
      message: `${buyer.name} purchased your "${item.name}" permanently${price > 0 ? ` for ₹${price.toLocaleString()}` : ' as a free transfer'
        }.`,
      read: false,
      link: '/equipment',
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Congratulations! You have permanently purchased ${item.name
        }${price === 0 ? ' for Free' : ` for ₹${price.toLocaleString()}`}.`,
      equipment: item.toObject(),
      buyerWalletBalance: buyer.walletBalance,
    });
  },

  async deleteEquipment(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const item: any = await EquipmentModel.findOne({ id }).lean();
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: 'Equipment not found.' });

    if (item.ownerId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own equipment listings.',
      });
    }

    if (item.status === 'rented') {
      return res.status(400).json({
        success: false,
        message:
          'Cannot delete equipment while an active rental is in progress.',
      });
    }

    await EquipmentModel.deleteOne({ id });

    res.json({
      success: true,
      message: 'Equipment listing removed.',
    });
  },
};