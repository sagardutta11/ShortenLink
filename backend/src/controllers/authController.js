import bcrypt from 'bcrypt';
import { createUser, findUserByEmail, updateUserPassword } from '../models/userModel.js';
import { createOtp, invalidatePreviousOtps, getLatestOtp, markOtpUsed } from '../models/otpModel.js';
import { generateOtp, getOtpExpiry } from '../utils/generateOtp.js';
import { sendOtpEmail } from '../utils/sendEmail.js';
import { signToken } from '../utils/jwt.js';

// POST /api/auth/register
// Creates an unverified user, generates + sends OTP for verification
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser && existingUser.is_verified) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    let user = existingUser;
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await createUser({ name, email, passwordHash });
    }

    // Invalidate any old unused OTPs, then create + send a new one
    await invalidatePreviousOtps(email, 'register');
    const otpCode = generateOtp();
    const expiresAt = getOtpExpiry(10);
    await createOtp({ email, otpCode, purpose: 'register', expiresAt });
    await sendOtpEmail({ to: email, otp: otpCode, purpose: 'register' });

    return res.status(201).json({
      message: 'OTP sent to email. Please verify to complete registration.',
      email,
    });
  } catch (err) {
    console.error('registerUser error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// POST /api/auth/forgot-password
// Sends a reset OTP if the email exists (doesn't reveal existence either way)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, an OTP has been sent.' });
    }

    await invalidatePreviousOtps(email, 'reset_password');
    const otpCode = generateOtp();
    const expiresAt = getOtpExpiry(10);
    await createOtp({ email, otpCode, purpose: 'reset_password', expiresAt });
    await sendOtpEmail({ to: email, otp: otpCode, purpose: 'reset_password' });

    return res.status(200).json({ message: 'If that email exists, an OTP has been sent.' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// POST /api/auth/reset-password
// Requires the reset OTP to already be verified (checked again here for safety)
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
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

    await markOtpUsed(otpRecord.id);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(email, passwordHash);

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, email: user.email });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('loginUser error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};