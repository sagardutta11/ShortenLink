import { Router } from 'express';
import { registerUser, forgotPassword, resetPassword, loginUser } from '../controllers/authController.js';
import {
  otpSendRateLimiter,
  loginRateLimiter,
  forgotPasswordRateLimiter,
} from '../middleware/rateLimiter.js';

const router = Router();

// otpSendRateLimiter   — keyed by IP only (email unconfirmed at register time)
// loginRateLimiter     — keyed by IP + email (each account has its own bucket)
// forgotPasswordRateLimiter — keyed by IP + email (same reason as login)
router.post('/register', otpSendRateLimiter, registerUser);
router.post('/login', loginRateLimiter, loginUser);
router.post('/forgot-password', forgotPasswordRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;