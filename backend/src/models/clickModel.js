import { query } from '../config/db.js';

// Log a click event for a link
export const createClick = async ({ linkId, ipAddress, userAgent, referrer }) => {
  await query(
    `INSERT INTO clicks (link_id, ip_address, user_agent, referrer)
     VALUES ($1, $2, $3, $4)`,
    [linkId, ipAddress || null, userAgent || null, referrer || null]
  );
};

// Total click count for a link
export const countClicksForLink = async (linkId) => {
  const result = await query(
    `SELECT COUNT(*) FROM clicks WHERE link_id = $1`,
    [linkId]
  );
  return parseInt(result.rows[0].count, 10);
};

// Recent clicks for a link (for a simple analytics table)
export const getClicksForLink = async (linkId, limit = 50) => {
  const result = await query(
    `SELECT ip_address, user_agent, referrer, clicked_at
     FROM clicks WHERE link_id = $1
     ORDER BY clicked_at DESC
     LIMIT $2`,
    [linkId, limit]
  );
  return result.rows;
};
