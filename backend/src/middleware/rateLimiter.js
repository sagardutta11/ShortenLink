import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// ─── Key generators ───────────────────────────────────────────────────────────

// IP only — uses express-rate-limit's built-in IPv6-safe helper
const byIp = (req) => ipKeyGenerator(req.ip);

// IP + email — each account gets its own bucket per IP.
// ipKeyGenerator normalises IPv6 addresses so they can't bypass limits.
const byIpAndEmail = (req) => {
  const email = (req.body?.email || '').toLowerCase().trim();
  return `${ipKeyGenerator(req.ip)}::${email}`;
};

// ─── OTP SEND limiter ──────────────────────────────────────────────────────────
export const otpSendRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: byIp,
  message: { message: 'Too many OTP requests. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── OTP VERIFY limiter ────────────────────────────────────────────────────────
// Keyed by IP + email — brute-forcing is per-account.
export const otpVerifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: byIpAndEmail,
  message: { message: 'Too many verification attempts. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── LOGIN limiter ─────────────────────────────────────────────────────────────
// Keyed by IP + email — hammering account A won't block account B.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: byIpAndEmail,
  message: { message: 'Too many login attempts for this account. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Forgot password limiter ──────────────────────────────────────────────────
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: byIpAndEmail,
  message: { message: 'Too many password reset requests for this account. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Link creation limiter ────────────────────────────────────────────────────
export const linkCreateRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: byIp,
  message: { message: 'Link creation limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Global API limiter ───────────────────────────────────────────────────────
export const globalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: byIp,
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

// ─── Redirect limiter ─────────────────────────────────────────────────────────
export const redirectRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  keyGenerator: byIp,
  message: { message: 'Too many redirect requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});