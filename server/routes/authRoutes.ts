import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { requireAuth } from '../middlewares/auth.ts';

const router = Router();

router.get('/campuses', AuthController.getCampuses);
router.post('/request-otp', AuthController.requestRegisterOTP);
router.post('/register', AuthController.verifyAndRegister);
router.post('/login', AuthController.login);
router.post('/switch-user', AuthController.switchUser);
router.get('/me', requireAuth, AuthController.getMe);
router.put('/profile', requireAuth, AuthController.updateProfile);
router.get('/activity', requireAuth, AuthController.getUserActivity);
router.put('/id-verification', requireAuth, AuthController.updateIdVerification);
router.post('/wallet/topup', requireAuth, AuthController.topupWallet);

export default router;
