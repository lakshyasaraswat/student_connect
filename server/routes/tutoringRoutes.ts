import { Router } from 'express';
import { TutoringController } from '../controllers/tutoringController.ts';
import { requireAuth, optionalAuth } from '../middlewares/auth.ts';
import { enforceCampusIsolation } from '../middlewares/campusIsolation.ts';

const router = Router();

router.get('/tutors', optionalAuth, enforceCampusIsolation, TutoringController.getTutors);
router.get('/sessions', requireAuth, TutoringController.getSessions);
router.post('/tutor-profile', requireAuth, enforceCampusIsolation, TutoringController.createOrUpdateTutorProfile);
router.post('/book', requireAuth, enforceCampusIsolation, TutoringController.bookSession);
router.post('/sessions/:id/complete', requireAuth, TutoringController.completeSession);
router.post('/sessions/:id/rate', requireAuth, TutoringController.rateSession);
router.post('/sessions/:id/cancel', requireAuth, TutoringController.cancelSession);

export default router;
