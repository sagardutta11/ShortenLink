import { Router } from 'express';
import { verifyRegisterOtp, verifyResetOtp } from '../controllers/otpController.js';

const router = Router();

router.post('/verify-register', verifyRegisterOtp);
router.post('/verify-reset', verifyResetOtp);

export default router;