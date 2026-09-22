import { randomInt } from 'crypto';

// Use crypto.randomInt instead of Math.random()
// Math.random() is NOT cryptographically secure — predictable under analysis.
// crypto.randomInt(min, max) uses the OS CSPRNG (same source as bcrypt/JWT secrets).
export const generateOtp = () => {
  // randomInt(10000, 100000) gives a uniform distribution over [10000, 99999]
  return randomInt(10000, 100000).toString();
};

// Returns a Date object X minutes from now — used for otps.expires_at
export const getOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};