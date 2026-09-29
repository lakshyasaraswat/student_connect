import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { AppNotificationModel } from '../models/schemas.ts';

export const NotificationController = {
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const notifs = await AppNotificationModel
      .find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = await AppNotificationModel.countDocuments({
      userId: req.user.userId,
      read: false,
    });

    res.json({ success: true, notifications: notifs, unreadCount });
  },

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await AppNotificationModel.updateOne(
      { id: req.params.id, userId: req.user.userId },
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'Marked as read.' });
  },

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await AppNotificationModel.updateMany(
      { userId: req.user.userId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  },
};