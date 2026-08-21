import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import { requireAuth } from './middleware/authMiddleware.js';
import { redirectToOriginalUrl } from './controllers/linkController.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/links', linkRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Temporary test route — confirms JWT middleware works. Remove once dashboard/link routes exist.
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

// Root-level redirect — must be LAST so it doesn't shadow /api or /health routes
app.get('/:shortCode', redirectToOriginalUrl);

export default app;