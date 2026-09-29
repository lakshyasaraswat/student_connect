import { Router } from 'express';
import { RoommateController } from '../controllers/roommateController.ts';
import { requireAuth, optionalAuth } from '../middlewares/auth.ts';
import { enforceCampusIsolation } from '../middlewares/campusIsolation.ts';

const router = Router();

router.get('/', optionalAuth, enforceCampusIsolation, RoommateController.getRoommates);
router.post('/', requireAuth, enforceCampusIsolation, RoommateController.createOrUpdatePost);
router.put('/:id/status', requireAuth, RoommateController.updateStatus);
router.delete('/:id', requireAuth, RoommateController.deletePost);

export default router;
