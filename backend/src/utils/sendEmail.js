import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

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
    await resend.emails.send({
      from: 'ShortenLink <onboarding@resend.dev>',
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('[sendEmail] Resend error:', err.message);
    throw new Error('Failed to send email. Please try again.');
  }
};