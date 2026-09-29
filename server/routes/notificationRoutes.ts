import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

router.get('/', requireAuth, NotificationController.getNotifications);
router.put('/:id/read', requireAuth, NotificationController.markAsRead);
router.put('/read-all', requireAuth, NotificationController.markAllAsRead);

export default router;
