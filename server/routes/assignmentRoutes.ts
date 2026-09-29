import { Router } from 'express';
import { AssignmentController } from '../controllers/assignmentController.ts';
import { requireAuth, optionalAuth } from '../middlewares/auth.ts';
import { enforceCampusIsolation } from '../middlewares/campusIsolation.ts';

const router = Router();

router.get('/', optionalAuth, enforceCampusIsolation, AssignmentController.getAssignments);
router.get('/:id', optionalAuth, AssignmentController.getAssignmentById);
router.post('/', requireAuth, enforceCampusIsolation, AssignmentController.createAssignment);
router.post('/:id/apply', requireAuth, AssignmentController.applyOrBid);
router.post('/:id/claim', requireAuth, AssignmentController.claimAssignment);
router.post('/:id/counter', requireAuth, AssignmentController.counterOffer);
router.post('/:id/assign', requireAuth, AssignmentController.assignSolver);
router.post('/:id/submit', requireAuth, AssignmentController.submitSolution);
router.post('/:id/review', requireAuth, AssignmentController.reviewSolution);
router.post('/:id/cancel', requireAuth, AssignmentController.cancelAssignment);
router.post('/:id/demo-offer', requireAuth, AssignmentController.addDemoOffer);
router.delete('/:id', requireAuth, AssignmentController.deleteAssignment);

export default router;
