import bcrypt from 'bcrypt';
import { createUser, findUserByEmail, updateUserPassword, markUserVerified } from '../models/userModel.js';
import {
  createOtp,
  invalidatePreviousOtps,
  verifyAndGetOtp,   // ✅ FIXED: replaces getLatestOtp + plaintext compare
  markOtpUsed,
} from '../models/otpModel.js';
import { generateOtp, getOtpExpiry } from '../utils/generateOtp.js';
import { sendOtpEmail } from '../utils/sendEmail.js';
import { signToken } from '../utils/jwt.js';

// Basic password strength rules enforced server-side.
// Never trust the frontend to enforce these — it's trivially bypassed.
const isStrongPassword = (pw) =>
  typeof pw === 'string' &&
  pw.length >= 8 &&
  /[A-Z]/.test(pw) &&
  /[0-9]/.test(pw);

// POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input length caps — prevent oversized payloads reaching the DB/bcrypt
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (name.length > 100) {
      return res.status(400).json({ message: 'Name must be 100 characters or fewer.' });
    }
    if (email.length > 255) {
      return res.status(400).json({ message: 'Email must be 255 characters or fewer.' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include an uppercase letter and a number.',
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser && existingUser.is_verified) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Re-registration race condition.
    // Previously, if user A registered with bob@example.com first (unverified),
    // then user B tried to register with the same email, B's password would be
    // silently ignored and A's hash kept — whoever verifies the OTP wins the account.
    // Now we always hash+update the password on re-registration so the latest
    // requester controls the account if they verify.
    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    if (existingUser && !existingUser.is_verified) {
      // Update the password hash for the existing unverified user
      user = await updateUserPassword(email, passwordHash) ?? existingUser;
    } else {
      user = await createUser({ name, email, passwordHash });
    }

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
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    if (email.length > 255) {
      return res.status(400).json({ message: 'Invalid email.' });
    }

    const user = await findUserByEmail(email);
    // Always respond the same way — prevents user enumeration
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
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }
    // ✅ FIXED: Enforce password strength on reset too — not just on register
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include an uppercase letter and a number.',
      });
    }

    // Use verifyAndGetOtp (bcrypt compare) instead of plaintext string comparison.
    // The old code did: getLatestOtp() then if (record.otp_code !== otp) —
    // this compared a plaintext OTP against a plaintext DB value, exposing OTPs on any DB read.
    const otpRecord = await verifyAndGetOtp(email, 'reset_password', otp);
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    await markOtpUsed(otpRecord.id);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(email, passwordHash);

    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    // Always run bcrypt even on missing user to prevent timing-based user enumeration.
    // Without this, a missing user returns ~0ms while a real user returns ~100ms (bcrypt time),
    // letting an attacker know which emails are registered.
    if (!user) {
      await bcrypt.compare(password, '$2b$10$invalidhashpaddingtowastetime000000000000000000000000'); // dummy
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken({ id: user.id, email: user.email });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('loginUser error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};