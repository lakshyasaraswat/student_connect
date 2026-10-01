import { Router } from 'express';
import { StudyGroupController } from '../controllers/studyGroupController.ts';
import { requireAuth, optionalAuth } from '../middlewares/auth.ts';
import { enforceCampusIsolation } from '../middlewares/campusIsolation.ts';

const router = Router();

// List / detail / create / delete
router.get('/', optionalAuth, enforceCampusIsolation, StudyGroupController.getGroups);
router.get('/:id', optionalAuth, StudyGroupController.getGroupById);
router.post('/', requireAuth, enforceCampusIsolation, StudyGroupController.createGroup);
router.delete('/:id', requireAuth, StudyGroupController.deleteGroup);

// Join (public instant / private request) + leave
router.post('/:id/join', requireAuth, StudyGroupController.joinGroup);
router.post('/:id/leave', requireAuth, StudyGroupController.leaveGroup);

// Private group request lifecycle
router.post('/:id/cancel-request', requireAuth, StudyGroupController.cancelJoinRequest);
router.post(
    '/:id/requests/:requestId/respond',
    requireAuth,
    StudyGroupController.respondToJoinRequest
);

// Group content
router.post('/:id/resources', requireAuth, StudyGroupController.addResource);
router.post('/:id/schedule', requireAuth, StudyGroupController.addSchedule);

export default router;