import { Router } from 'express';
import { RideController } from '../controllers/rideController.ts';
import { requireAuth, optionalAuth } from '../middlewares/auth.ts';
import { enforceCampusIsolation } from '../middlewares/campusIsolation.ts';

const router = Router();

router.get('/', optionalAuth, enforceCampusIsolation, RideController.getRides);
router.get('/:id', optionalAuth, RideController.getRideById);
router.post('/', requireAuth, enforceCampusIsolation, RideController.createRide);
router.post('/:id/request-seat', requireAuth, RideController.requestSeat);
router.post('/:id/withdraw-request', requireAuth, RideController.withdrawRequest);
router.post('/:id/manage-passenger', requireAuth, RideController.handleSeatRequest);
router.delete('/:id', requireAuth, RideController.deleteRide);
router.post('/calc/cost-split', RideController.calculateCostSplit);

export default router;
