import express from 'express';
import cors from 'cors';
import helmet from 'helmet';  // npm install helmet
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import { requireAuth } from './middleware/authMiddleware.js';
import { redirectToOriginalUrl } from './controllers/linkController.js';
import { viewPublicPlaylist } from './controllers/playlistController.js';
import {
  globalApiRateLimiter,
  redirectRateLimiter,
} from './middleware/rateLimiter.js';

const app = express();

// ── TRUST PROXY ────────────────────────────────────────────────────────────────
// REQUIRED when deployed behind nginx / Render / Railway / Heroku / Cloudflare.
// Without this, req.ip is always the proxy's IP (127.0.0.1), which means:
//   - all users share one IP → rate limits fire after the first few requests
//   - click analytics log the proxy address, not the real visitor
// Set to 1 to trust exactly one proxy hop. Adjust if you have multiple proxy layers.
app.set('trust proxy', 1);

// ── SECURITY HEADERS (helmet) ──────────────────────────────────────────────────
// Sets 14 HTTP security headers in one call:
//   X-Frame-Options: SAMEORIGIN         → clickjacking protection
//   X-Content-Type-Options: nosniff     → MIME-type sniffing
//   X-XSS-Protection: 0                 → disables broken legacy XSS filter
//   Strict-Transport-Security           → HTTPS enforcement (prod only)
//   Content-Security-Policy             → restricts resource origins
//   Referrer-Policy: no-referrer        → leaks less referrer info
//   Permissions-Policy                  → disables browser features you don't need
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────────
// `cors()` with no arguments accepts requests from ANY origin.
// In production this means any website can make credentialed requests to your API.
// env.CORS_ORIGIN should be your deployed frontend URL, e.g. https://shortenlink.app
const corsOptions = {
  origin: env.NODE_ENV === 'production'
    ? env.CORS_ORIGIN   // set this in your .env: CORS_ORIGIN=https://yourdomain.com
    : true,             // allow all origins in dev
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // preflight cache: 24 hours
};
app.use(cors(corsOptions));

// ── BODY PARSING ───────────────────────────────────────────────────────────────
// Without a size limit, a client can send a 100 MB JSON body and
// exhaust memory before any route handler runs. 50kb is generous for this API.
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// ── GLOBAL API RATE LIMITER ────────────────────────────────────────────────────
// Blanket protection for all /api/* routes.
// Specific endpoints (OTP send/verify, link creation) have their own tighter
// limiters applied at the route level in their respective route files.
app.use('/api', globalApiRateLimiter);

// ── ROUTES ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/playlists', playlistRoutes);

// ── HEALTH CHECK ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── PUBLIC ROUTES ───────────────────────────────────────────────────────────────
// /p/:shareCode must be registered before /:shortCode — Express matches in order
// and /:shortCode would otherwise consume /p/anything
app.get('/p/:shareCode', viewPublicPlaylist);

// Root-level short-code redirect — MUST be LAST
// Apply the redirect rate limiter — bots can hit this endpoint thousands of times
app.get('/:shortCode', redirectRateLimiter, redirectToOriginalUrl);

// ── 404 CATCH-ALL ──────────────────────────────────────────────────────────────
// Without this, Express returns an HTML "Cannot GET /whatever" page for
// unknown routes, leaking that this is an Express app and its version.
app.use((req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

// ── GLOBAL ERROR HANDLER ───────────────────────────────────────────────────────
// Catch unhandled errors from async route handlers.
// Without this, Express would send a full stack trace in the response in some configs.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message,
  });
});

export default app;