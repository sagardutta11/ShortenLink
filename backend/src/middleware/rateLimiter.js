import rateLimit from 'express-rate-limit';

// Limits how often a single IP can trigger OTP-sending endpoints
// (register, forgot-password) — prevents spamming someone's inbox
// or hammering the Gmail SMTP account.
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP per window
  message: { message: 'Too many OTP requests. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
