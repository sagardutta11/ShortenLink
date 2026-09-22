import {
  verifyAndGetOtp,  // replaces getLatestOtp + plaintext otp_code compare
  markOtpUsed,
} from '../models/otpModel.js';
import { markUserVerified } from '../models/userModel.js';

// POST /api/otp/verify-register
export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    // Was doing getLatestOtp() then `if (otpRecord.otp_code !== otp)` —
    // a plaintext string comparison against a plaintext DB value.
    // Now uses bcrypt.compare internally via verifyAndGetOtp.
    // Returns null on either "no record found" OR "hash mismatch" — callers can't
    // distinguish which, which is intentional (prevents OTP oracle attacks).
    const otpRecord = await verifyAndGetOtp(email, 'register', otp);
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    await markOtpUsed(otpRecord.id);
    const user = await markUserVerified(email);

    return res.status(200).json({
      message: 'Email verified successfully.',
      user,
    });
  } catch (err) {
    console.error('verifyRegisterOtp error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/otp/verify-reset
// Checks OTP validity WITHOUT marking it used — consumption happens in resetPassword.
//  Apply otpVerifyRateLimiter from rateLimiter.js to this route in otpRoutes.js.
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    // Same plaintext → bcrypt fix as verifyRegisterOtp.
    // Note: OTP is NOT marked used here because resetPassword re-verifies and marks it.
    // The rate limiter on this endpoint is the primary brute-force guard.
    const otpRecord = await verifyAndGetOtp(email, 'reset_password', otp);
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    return res.status(200).json({ message: 'OTP verified. You may now reset your password.' });
  } catch (err) {
    console.error('verifyResetOtp error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};