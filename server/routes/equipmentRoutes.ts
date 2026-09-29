import { Router } from 'express';
import { EquipmentController } from '../controllers/equipmentController.ts';
import { requireAuth, optionalAuth } from '../middlewares/auth.ts';
import { enforceCampusIsolation } from '../middlewares/campusIsolation.ts';

const router = Router();

router.get('/', optionalAuth, enforceCampusIsolation, EquipmentController.getEquipment);
router.post('/', requireAuth, enforceCampusIsolation, EquipmentController.createEquipment);
router.post('/:id/rent', requireAuth, EquipmentController.requestRental);
router.post('/:id/return', requireAuth, EquipmentController.returnEquipment);
router.post('/:id/purchase', requireAuth, EquipmentController.purchaseEquipment);
router.delete('/:id', requireAuth, EquipmentController.deleteEquipment);

export default router;
