import { query } from '../config/db.js';

// Create a new user
export const createUser = async ({ name, email, passwordHash }) => {
  const result = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, is_verified, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
};

// Find user by email (used for login + checking duplicates)
export const findUserByEmail = async (email) => {
  const result = await query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

// Find user by id (used for JWT-authenticated routes)
export const findUserById = async (id) => {
  const result = await query(
    `SELECT id, name, email, is_verified, created_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Mark user as verified after successful registration OTP
export const markUserVerified = async (email) => {
  const result = await query(
    `UPDATE users SET is_verified = TRUE, updated_at = NOW()
     WHERE email = $1
     RETURNING id, name, email, is_verified`,
    [email]
  );
  return result.rows[0] || null;
};

// Update password (used after reset OTP verification)
export const updateUserPassword = async (email, passwordHash) => {
  const result = await query(
    `UPDATE users SET password_hash = $1, updated_at = NOW()
     WHERE email = $2
     RETURNING id, email`,
    [passwordHash, email]
  );
  return result.rows[0] || null;
};
