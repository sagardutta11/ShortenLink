import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// ✅ FIXED: Use explicit host/port instead of service:'gmail'
// Render free tier blocks port 465 (SSL) but allows port 587 (TLS)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS — upgrades after connection
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_APP_PASSWORD,
  },
});

const VALID_EMAIL_RE = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;

const assertSafeEmail = (email) => {
  if (!email || typeof email !== 'string') throw new Error('Invalid recipient email.');
  if (/[\r\n]/.test(email)) throw new Error('Email address contains illegal characters.');
  if (!VALID_EMAIL_RE.test(email)) throw new Error('Email address format is invalid.');
};

const assertSafeOtp = (otp) => {
  if (!/^\d{5}$/.test(otp)) throw new Error('OTP format is invalid.');
};

export const sendOtpEmail = async ({ to, otp, purpose }) => {
  assertSafeEmail(to);
  assertSafeOtp(otp);

  const isRegister = purpose === 'register';

  const subject = isRegister
    ? 'Verify your email — OTP inside'
    : 'Reset your password — OTP inside';

  const text = isRegister
    ? `Your registration OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`
    : `Your password reset OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`;

  try {
    await transporter.sendMail({
      from: `"ShortenLink" <${env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('[sendEmail] SMTP error:', err.message);
    throw new Error('Failed to send email. Please try again.');
  }
};