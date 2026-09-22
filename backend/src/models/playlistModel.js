import { query } from '../config/db.js';

// ---------- PLAYLISTS ----------

// Create a new playlist
export const createPlaylist = async ({ userId, name, description, shareCode, visibility }) => {
  const result = await query(
    `INSERT INTO playlists (user_id, name, description, share_code, visibility)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, name, description, share_code, visibility, created_at`,
    [userId, name, description || null, shareCode, visibility || 'private']
  );
  return result.rows[0];
};

// Find a playlist by its id (used for ownership checks + owner's detail view)
export const findPlaylistById = async (id) => {
  const result = await query(
    `SELECT * FROM playlists WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Find a playlist by its share_code (used for the public /p/:shareCode route)
export const findPlaylistByShareCode = async (shareCode) => {
  const result = await query(
    `SELECT * FROM playlists WHERE share_code = $1`,
    [shareCode]
  );
  return result.rows[0] || null;
};

// List all playlists belonging to a user (their own dashboard)
export const findPlaylistsByUserId = async (userId) => {
  const result = await query(
    `SELECT id, name, description, share_code, visibility, created_at, updated_at
     FROM playlists WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

// Search publicly discoverable playlists by name (case-insensitive partial match)
export const searchPublicPlaylists = async (searchTerm, limit = 20) => {
  const result = await query(
    `SELECT id, name, description, share_code, created_at
     FROM playlists
     WHERE visibility = 'public' AND name ILIKE $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [`%${searchTerm}%`, limit]
  );
  return result.rows;
};

// Update a playlist's name/description/visibility
export const updatePlaylist = async (id, { name, description, visibility }) => {
  const result = await query(
    `UPDATE playlists
     SET name = COALESCE($2, name),
         description = COALESCE($3, description),
         visibility = COALESCE($4, visibility),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, description, share_code, visibility, updated_at`,
    [id, name || null, description || null, visibility || null]
  );
  return result.rows[0] || null;
};

// Delete a playlist (playlist_links rows cascade automatically)
export const deletePlaylist = async (id) => {
  const result = await query(
    `DELETE FROM playlists WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};

// ---------- PLAYLIST_LINKS ----------

// Get the current highest position in a playlist (used to compute the next position when appending)
export const getMaxPosition = async (playlistId) => {
  const result = await query(
    `SELECT COALESCE(MAX(position), 0) AS max_position
     FROM playlist_links WHERE playlist_id = $1`,
    [playlistId]
  );
  return result.rows[0].max_position;
};

// Add a link to a playlist at a given position
export const addLinkToPlaylist = async ({ playlistId, linkId, position }) => {
  const result = await query(
    `INSERT INTO playlist_links (playlist_id, link_id, position)
     VALUES ($1, $2, $3)
     RETURNING id, playlist_id, link_id, position, added_at`,
    [playlistId, linkId, position]
  );
  return result.rows[0];
};

// Remove a link from a playlist (does NOT delete the link itself)
export const removeLinkFromPlaylist = async (playlistId, linkId) => {
  const result = await query(
    `DELETE FROM playlist_links WHERE playlist_id = $1 AND link_id = $2 RETURNING id`,
    [playlistId, linkId]
  );
  return result.rows[0] || null;
};

// Get all links in a playlist, joined with the actual link data, ordered by position
export const getPlaylistLinks = async (playlistId) => {
  const result = await query(
    `SELECT pl.id AS playlist_link_id, pl.position, pl.added_at,
            l.id AS link_id, l.original_url, l.short_code, l.created_at AS link_created_at
     FROM playlist_links pl
     JOIN links l ON l.id = pl.link_id
     WHERE pl.playlist_id = $1
     ORDER BY pl.position ASC`,
    [playlistId]
  );
  return result.rows;
};

// Check if a specific link already exists in a playlist (used to prevent duplicate adds cleanly)
export const isLinkInPlaylist = async (playlistId, linkId) => {
  const result = await query(
    `SELECT id FROM playlist_links WHERE playlist_id = $1 AND link_id = $2`,
    [playlistId, linkId]
  );
  return result.rows.length > 0;
};

// Update the position of a single link within a playlist (used by reorder)
export const updateLinkPosition = async (playlistId, linkId, newPosition) => {
  const result = await query(
    `UPDATE playlist_links SET position = $3
     WHERE playlist_id = $1 AND link_id = $2
     RETURNING id, position`,
    [playlistId, linkId, newPosition]
  );
  return result.rows[0] || null;
};
