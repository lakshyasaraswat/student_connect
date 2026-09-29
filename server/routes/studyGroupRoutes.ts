import { Router } from 'express';
import { StudyGroupController } from '../controllers/studyGroupController.ts';
import { requireAuth, optionalAuth } from '../middlewares/auth.ts';
import { enforceCampusIsolation } from '../middlewares/campusIsolation.ts';

const router = Router();

router.get('/', optionalAuth, enforceCampusIsolation, StudyGroupController.getGroups);
router.get('/:id', optionalAuth, StudyGroupController.getGroupById);
router.post('/', requireAuth, enforceCampusIsolation, StudyGroupController.createGroup);
router.delete('/:id', requireAuth, StudyGroupController.deleteGroup);
router.post('/:id/join', requireAuth, StudyGroupController.joinGroup);
router.post('/:id/leave', requireAuth, StudyGroupController.leaveGroup);
router.post('/:id/resources', requireAuth, StudyGroupController.addResource);
router.post('/:id/schedule', requireAuth, StudyGroupController.addSchedule);

export default router;
