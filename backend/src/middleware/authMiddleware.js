import { verifyToken } from '../utils/jwt.js';
import jwt from 'jsonwebtoken';

//  Extract only the fields we actually need from the decoded token.
// Previously req.user = decoded exposed the full JWT payload (iat, exp, etc.)
// to all downstream handlers — unnecessary data surface.
const extractUserPayload = (decoded) => ({
  id: decoded.id,
  email: decoded.email,
});

//  Distinguish between expired and invalid tokens.
// Returning the same 401 message for both leaks less info while still being debuggable server-side.
const handleJwtError = (err, res) => {
  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ message: 'Token expired. Please log in again.' });
  }
  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
  // Unexpected error — don't expose internals
  return res.status(401).json({ message: 'Authentication failed.' });
};

// Protects routes — expects "Authorization: Bearer <token>" header
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  //  Basic structural check before passing to jwt.verify
  // Prevents sending obviously malformed strings (e.g. empty string after split) to the library
  if (!token || token.split('.').length !== 3) {
    return res.status(401).json({ message: 'Malformed token.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = extractUserPayload(decoded);
    next();
  } catch (err) {
    return handleJwtError(err, res);
  }
};

// For routes usable by BOTH guests and logged-in users (e.g. creating links).
// Sets req.user if a valid token is present, otherwise leaves it undefined — never rejects.
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    if (token && token.split('.').length === 3) {
      try {
        const decoded = verifyToken(token);
        req.user = extractUserPayload(decoded); // payload restriction as requireAuth
      } catch {
        // Invalid/expired token — treat as guest, don't block
      }
    }
  }

  next();
};