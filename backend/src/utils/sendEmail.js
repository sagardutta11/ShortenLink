import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_APP_PASSWORD,
  },
});

// Validate email format before using it as a mail header.
// An attacker who controls the `to` address could inject newlines to add
// arbitrary headers (email header injection) e.g. to BCC themselves.
const VALID_EMAIL_RE = /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/;

const assertSafeEmail = (email) => {
  if (!email || typeof email !== 'string') throw new Error('Invalid recipient email.');
  // Strip newlines/carriage returns — definitive header injection prevention
  if (/[\r\n]/.test(email)) throw new Error('Email address contains illegal characters.');
  if (!VALID_EMAIL_RE.test(email)) throw new Error('Email address format is invalid.');
};

// OTP is numeric only — assert that before embedding in the email body.
// Prevents any template-injection if generateOtp() were ever changed to return strings.
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

  // Plain text only — no HTML template means no XSS surface in the email body
  const text = isRegister
    ? `Your registration OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`
    : `Your password reset OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`;

  // Wrap in try/catch and re-throw a sanitized error.
  // Nodemailer errors can contain internal SMTP details — don't let them bubble up to the API response.
  try {
    await transporter.sendMail({
      from: `"Urlify" <${env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    // Log internally (use your logger, not console.log in prod)
    console.error('[sendEmail] SMTP error:', err.message);
    throw new Error('Failed to send email. Please try again.');
  }
};