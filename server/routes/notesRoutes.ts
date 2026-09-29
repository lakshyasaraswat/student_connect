import { Router } from 'express';
import { NotesController } from '../controllers/notesController.ts';
import { requireAuth, optionalAuth } from '../middlewares/auth.ts';
import { enforceCampusIsolation } from '../middlewares/campusIsolation.ts';

const router = Router();

router.get('/', optionalAuth, enforceCampusIsolation, NotesController.getNotes);
router.get('/dashboard', requireAuth, NotesController.getSellerDashboard);
router.get('/:id', optionalAuth, NotesController.getNoteById);
router.post('/', requireAuth, enforceCampusIsolation, NotesController.createNote);
router.post('/:id/purchase', requireAuth, NotesController.purchaseNote);
router.post('/:id/review', requireAuth, NotesController.addReview);

export default router;
