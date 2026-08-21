import { Router } from 'express';
import { registerUser, forgotPassword, resetPassword, loginUser } from '../controllers/authController.js';
import { otpRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', otpRateLimiter, registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', otpRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;