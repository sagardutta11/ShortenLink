import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Validate JWT_SECRET exists and is strong at startup.
// If it's undefined, jwt.verify() silently accepts tokens signed with "undefined" as the secret.
if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  throw new Error(
    'FATAL: JWT_SECRET is missing or too short (minimum 32 characters). ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"'
  );
}

const JWT_ALGORITHM = 'HS256';

export const signToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM, // Explicit algorithm — prevents alg-confusion attacks
  });
};

export const verifyToken = (token) => {
  // algorithms array pins the allowed algorithm.
  // Without this, a token crafted with alg:"none" would be accepted by some jwt versions.
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
  });
};