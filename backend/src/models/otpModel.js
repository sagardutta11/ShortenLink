import { query } from '../config/db.js';

// Create a new OTP entry
export const createOtp = async ({ email, otpCode, purpose, expiresAt }) => {
  const result = await query(
    `INSERT INTO otps (email, otp_code, purpose, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, purpose, expires_at`,
    [email, otpCode, purpose, expiresAt]
  );
  return result.rows[0];
};

// Get the latest unused OTP for an email + purpose
export const getLatestOtp = async (email, purpose) => {
  const result = await query(
    `SELECT * FROM otps
     WHERE email = $1 AND purpose = $2 AND is_used = FALSE
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, purpose]
  );
  return result.rows[0] || null;
};

// Mark an OTP as used (after successful verification)
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

// Cleanup: delete expired OTPs (can be called via a cron job later)
export const deleteExpiredOtps = async () => {
  await query(`DELETE FROM otps WHERE expires_at < NOW()`);
};
