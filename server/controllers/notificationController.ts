import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';

export const NotificationController = {
  getNotifications(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const notifs = db.notifications.filter(n => n.userId === req.user?.userId);
    const unreadCount = notifs.filter(n => !n.read).length;

    res.json({ success: true, notifications: notifs, unreadCount });
  },

  markAsRead(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const notif = db.notifications.find(n => n.id === req.params.id && n.userId === req.user?.userId);
    if (notif) {
      notif.read = true;
    }

    res.json({ success: true, message: 'Marked as read.' });
  },

  markAllAsRead(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    db.notifications
      .filter(n => n.userId === req.user?.userId)
      .forEach(n => { n.read = true; });

    res.json({ success: true, message: 'All notifications marked as read.' });
  }
};
