import { Router } from 'express';
import { ChatController } from '../controllers/chatController.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

router.get('/:roomId/messages', requireAuth, ChatController.getRoomMessages);
router.post('/messages', requireAuth, ChatController.postMessage);

export default router;
