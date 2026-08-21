import { getLatestOtp, markOtpUsed } from '../models/otpModel.js';
import { markUserVerified } from '../models/userModel.js';

// POST /api/otp/verify-register
export const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const otpRecord = await getLatestOtp(email, 'register');

    if (!otpRecord) {
      return res.status(400).json({ message: 'No pending OTP found. Please register again.' });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (otpRecord.otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await markOtpUsed(otpRecord.id);
    const user = await markUserVerified(email);

    return res.status(200).json({
      message: 'Email verified successfully',
      user,
    });
  } catch (err) {
    console.error('verifyRegisterOtp error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// POST /api/otp/verify-reset
// Checks OTP validity WITHOUT marking it used — actual consumption happens in resetPassword
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const otpRecord = await getLatestOtp(email, 'reset_password');

    if (!otpRecord) {
      return res.status(400).json({ message: 'No pending OTP found. Please request a new one.' });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (otpRecord.otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    return res.status(200).json({ message: 'OTP verified. You may now reset your password.' });
  } catch (err) {
    console.error('verifyResetOtp error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};