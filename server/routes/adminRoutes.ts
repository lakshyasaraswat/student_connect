import { Router } from 'express';
import { AdminController } from '../controllers/adminController.ts';
import { requireAuth, requireRole } from '../middlewares/auth.ts';

const router = Router();

// Restricted to Administrators
router.get('/metrics', requireAuth, requireRole(['admin']), AdminController.getOverviewMetrics);
router.get('/users', requireAuth, requireRole(['admin']), AdminController.getAllUsers);
router.get('/escrow-transactions', requireAuth, requireRole(['admin']), AdminController.getAllEscrowTransactions);
router.post('/resolve-dispute', requireAuth, requireRole(['admin']), AdminController.resolveEscrowDispute);
router.put('/verify-listing/:id', requireAuth, requireRole(['admin']), AdminController.verifyListing);
router.put('/toggle-user-verification/:id', requireAuth, requireRole(['admin']), AdminController.toggleUserVerification);
router.put('/approve-verification/:id', requireAuth, requireRole(['admin']), AdminController.approveUserVerification);
router.put('/reject-verification/:id', requireAuth, requireRole(['admin']), AdminController.rejectUserVerification);

export default router;
