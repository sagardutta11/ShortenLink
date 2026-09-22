import { Router } from 'express';
import { verifyRegisterOtp, verifyResetOtp } from '../controllers/otpController.js';
import { otpVerifyRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// otpVerifyRateLimiter is now keyed by IP + email (from req.body.email).
// This means 10 wrong OTP guesses for bob@example.com won't block
// alice@example.com from verifying her OTP from the same IP.
router.post('/verify-register', otpVerifyRateLimiter, verifyRegisterOtp);
router.post('/verify-reset', otpVerifyRateLimiter, verifyResetOtp);

export default router;