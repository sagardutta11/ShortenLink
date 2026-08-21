import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_APP_PASSWORD,
  },
});

export const sendOtpEmail = async ({ to, otp, purpose }) => {
  const subject =
    purpose === 'register'
      ? 'Verify your email — OTP inside'
      : 'Reset your password — OTP inside';

  const text =
    purpose === 'register'
      ? `Your registration OTP is ${otp}. It expires in 10 minutes.`
      : `Your password reset OTP is ${otp}. It expires in 10 minutes.`;

  await transporter.sendMail({
    from: `"URL Shortener" <${env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};
