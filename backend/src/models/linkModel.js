import { query } from '../config/db.js';

// Create a new short link
export const createLink = async ({ userId, originalUrl, shortCode, isCustomAlias, guestIdentifier, expiresAt }) => {
  const result = await query(
    `INSERT INTO links (user_id, original_url, short_code, is_custom_alias, guest_identifier, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, original_url, short_code, is_custom_alias, expires_at, created_at`,
    [userId || null, originalUrl, shortCode, isCustomAlias, guestIdentifier || null, expiresAt || null]
  );
  return result.rows[0];
};

// Find a link by its short code (used for redirect + alias uniqueness check)
export const findLinkByShortCode = async (shortCode) => {
  const result = await query(
    `SELECT * FROM links WHERE short_code = $1`,
    [shortCode]
  );
  return result.rows[0] || null;
};

// Get all links belonging to a logged-in user (dashboard), with click counts
export const findLinksByUserId = async (userId) => {
  const result = await query(
    `SELECT l.id, l.original_url, l.short_code, l.is_custom_alias, l.expires_at, l.is_active, l.created_at,
            COUNT(c.id)::int AS clicks
     FROM links l
     LEFT JOIN clicks c ON c.link_id = l.id
     WHERE l.user_id = $1
     GROUP BY l.id
     ORDER BY l.created_at DESC`,
    [userId]
  );
  return result.rows;
};

// Count how many links a guest (by IP/session identifier) has created — for guest limit enforcement
export const countLinksByGuestIdentifier = async (guestIdentifier) => {
  const result = await query(
    `SELECT COUNT(*) FROM links WHERE guest_identifier = $1`,
    [guestIdentifier]
  );
  return parseInt(result.rows[0].count, 10);
};

// Delete a link (only if it belongs to the requesting user)
export const deleteLink = async (id, userId) => {
  const result = await query(
    `DELETE FROM links WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return result.rows[0] || null;
};

// Deactivate a link (soft alternative to delete, or auto-expire)
export const deactivateLink = async (id) => {
  await query(`UPDATE links SET is_active = FALSE WHERE id = $1`, [id]);
};