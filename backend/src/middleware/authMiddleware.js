import { verifyToken } from '../utils/jwt.js';

// Protects routes — expects "Authorization: Bearer <token>" header
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// For routes usable by BOTH guests and logged-in users (e.g. creating links).
// Sets req.user if a valid token is present, otherwise leaves it undefined — never rejects.
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyToken(token);
    } catch {
      // invalid/expired token — just treat as guest, don't block
    }
  }

  next();
};