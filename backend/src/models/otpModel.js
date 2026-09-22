import { query } from '../config/db.js';
import bcrypt from 'bcrypt';

const OTP_HASH_ROUNDS = 10;

// OTP is now hashed before storage using bcrypt.
// Previously OTP was stored as plaintext — a DB read or SQL injection
// would expose valid OTPs that could be used to take over accounts.
//

// Create a new OTP entry — stores a bcrypt hash, not the raw OTP
export const createOtp = async ({ email, otpCode, purpose, expiresAt }) => {
  const otpHash = await bcrypt.hash(otpCode, OTP_HASH_ROUNDS);

  const result = await query(
    `INSERT INTO otps (email, otp_code, purpose, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, purpose, expires_at`,
    [email, otpHash, purpose, expiresAt]
  );
  return result.rows[0];
};

// Get the latest unused, non-expired OTP record for email + purpose
// Returns the row with the HASHED otp_code — do NOT compare directly.
// Use verifyAndGetOtp() for user-submitted OTP verification.
export const getLatestOtp = async (email, purpose) => {
  const result = await query(
    `SELECT * FROM otps
     WHERE email = $1 AND purpose = $2 AND is_used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, purpose]
  );
  return result.rows[0] || null;
};

// Verify a raw OTP submitted by the user against the stored bcrypt hash.
// Use this in your auth controller instead of a direct string comparison.
// Returns the OTP record on match, null on mismatch or not found.
//
// Usage in controller:
//   const otpRecord = await verifyAndGetOtp(email, 'register', submittedOtp);
//   if (!otpRecord) return res.status(400).json({ message: 'Invalid or expired OTP.' });
//   await markOtpUsed(otpRecord.id);
export const verifyAndGetOtp = async (email, purpose, rawOtp) => {
  const record = await getLatestOtp(email, purpose);
  if (!record) return null;

  const isMatch = await bcrypt.compare(rawOtp, record.otp_code);
  if (!isMatch) return null;

  return record;
};

// Mark an OTP as used (call this immediately after successful verifyAndGetOtp)
export const markOtpUsed = async (id) => {
  const result = await query(
    `UPDATE otps SET is_used = TRUE WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};

// Invalidate all previous unused OTPs for email+purpose before issuing a new one
export const invalidatePreviousOtps = async (email, purpose) => {
  await query(
    `UPDATE otps SET is_used = TRUE
     WHERE email = $1 AND purpose = $2 AND is_used = FALSE`,
    [email, purpose]
  );
};

// Cleanup: delete expired OTPs (call via a cron job)
export const deleteExpiredOtps = async () => {
  await query(`DELETE FROM otps WHERE expires_at < NOW()`);
};