import { nanoid } from 'nanoid';
import {
  createPlaylist,
  findPlaylistById,
  findPlaylistByShareCode,
  findPlaylistsByUserId,
  searchPublicPlaylists,
  updatePlaylist,
  deletePlaylist,
  getMaxPosition,
  addLinkToPlaylist,
  removeLinkFromPlaylist,
  getPlaylistLinks,
  isLinkInPlaylist,
  updateLinkPosition,
} from '../models/playlistModel.js';
import { query } from '../config/db.js';

// Only the owner may mutate a playlist.
const assertOwner = (playlist, userId) => playlist && playlist.user_id === userId;

// ── INPUT LIMITS ──────────────────────────────────────────────────────────────
const PLAYLIST_NAME_MAX = 150;    // matches schema VARCHAR(150)
const PLAYLIST_DESC_MAX = 1000;   //  schema has TEXT (unlimited) — cap in controller
const SEARCH_QUERY_MAX = 100;     // prevent overlong ILIKE patterns hitting DB
const REORDER_MAX_LINKS = 500;    //  prevent thousands of sequential DB updates

const VALID_VISIBILITY = ['private', 'unlisted', 'public'];

// POST /api/playlists
export const createNewPlaylist = async (req, res) => {
  try {
    const { name, description, visibility } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'name is required.' });
    }
    // ✅ FIXED: Length limits enforced at controller level — the DB column caps at 150
    // but an explicit error here is clearer than a DB constraint violation bubbling up.
    if (name.length > PLAYLIST_NAME_MAX) {
      return res.status(400).json({ message: `Playlist name must be ${PLAYLIST_NAME_MAX} characters or fewer.` });
    }
    if (description && description.length > PLAYLIST_DESC_MAX) {
      return res.status(400).json({ message: `Description must be ${PLAYLIST_DESC_MAX} characters or fewer.` });
    }
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      return res.status(400).json({ message: 'Invalid visibility value.' });
    }

    const shareCode = nanoid(8);
    const playlist = await createPlaylist({
      userId: req.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      shareCode,
      visibility: visibility || 'private',
    });

    return res.status(201).json({ message: 'Playlist created.', playlist });
  } catch (err) {
    console.error('createNewPlaylist error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/playlists
export const getMyPlaylists = async (req, res) => {
  try {
    const playlists = await findPlaylistsByUserId(req.user.id);
    return res.status(200).json({ playlists });
  } catch (err) {
    console.error('getMyPlaylists error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/playlists/:id
export const getPlaylistById = async (req, res) => {
  try {
    const playlist = await findPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }
    if (!assertOwner(playlist, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const links = await getPlaylistLinks(playlist.id);
    return res.status(200).json({ playlist, links });
  } catch (err) {
    console.error('getPlaylistById error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PATCH /api/playlists/:id
export const updatePlaylistDetails = async (req, res) => {
  try {
    const playlist = await findPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }
    if (!assertOwner(playlist, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const { name, description, visibility } = req.body;

    // ✅ FIXED: Validate lengths on update too
    if (name !== undefined && name.length > PLAYLIST_NAME_MAX) {
      return res.status(400).json({ message: `Playlist name must be ${PLAYLIST_NAME_MAX} characters or fewer.` });
    }
    if (description !== undefined && description.length > PLAYLIST_DESC_MAX) {
      return res.status(400).json({ message: `Description must be ${PLAYLIST_DESC_MAX} characters or fewer.` });
    }
    if (visibility && !VALID_VISIBILITY.includes(visibility)) {
      return res.status(400).json({ message: 'Invalid visibility value.' });
    }

    const updated = await updatePlaylist(playlist.id, { name, description, visibility });
    return res.status(200).json({ message: 'Playlist updated.', playlist: updated });
  } catch (err) {
    console.error('updatePlaylistDetails error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// DELETE /api/playlists/:id
export const removePlaylist = async (req, res) => {
  try {
    const playlist = await findPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }
    if (!assertOwner(playlist, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    await deletePlaylist(playlist.id);
    return res.status(200).json({ message: 'Playlist deleted.' });
  } catch (err) {
    console.error('removePlaylist error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// POST /api/playlists/:id/links
export const addLink = async (req, res) => {
  try {
    const playlist = await findPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }
    if (!assertOwner(playlist, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const { linkId } = req.body;
    if (!linkId) {
      return res.status(400).json({ message: 'linkId is required.' });
    }

    // Verify link exists AND belongs to this user — already IDOR-safe
    const linkResult = await query(
      `SELECT id, user_id FROM links WHERE id = $1`,
      [linkId]
    );
    const link = linkResult.rows[0];
    if (!link) {
      return res.status(404).json({ message: 'Link not found.' });
    }
    if (link.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only add your own links.' });
    }

    const alreadyIn = await isLinkInPlaylist(playlist.id, linkId);
    if (alreadyIn) {
      return res.status(409).json({ message: 'This link is already in the playlist.' });
    }

    const maxPosition = await getMaxPosition(playlist.id);

    // ✅ FIXED: Cap playlist size to prevent unbounded growth
    if (maxPosition >= REORDER_MAX_LINKS) {
      return res.status(400).json({ message: `A playlist can hold at most ${REORDER_MAX_LINKS} links.` });
    }

    const entry = await addLinkToPlaylist({
      playlistId: playlist.id,
      linkId,
      position: maxPosition + 1,
    });

    return res.status(201).json({ message: 'Link added to playlist.', entry });
  } catch (err) {
    console.error('addLink error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// DELETE /api/playlists/:id/links/:linkId
export const removeLink = async (req, res) => {
  try {
    const playlist = await findPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }
    if (!assertOwner(playlist, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const removed = await removeLinkFromPlaylist(playlist.id, req.params.linkId);
    if (!removed) {
      return res.status(404).json({ message: 'Link not found in this playlist.' });
    }

    return res.status(200).json({ message: 'Link removed from playlist.' });
  } catch (err) {
    console.error('removeLink error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// PATCH /api/playlists/:id/reorder
export const reorderLinks = async (req, res) => {
  try {
    const playlist = await findPlaylistById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }
    if (!assertOwner(playlist, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ message: 'order must be a non-empty array of linkIds.' });
    }

    // ✅ FIXED: No upper bound meant a 10,000-element array = 10,000 sequential DB writes.
    // Cap to the same limit used for playlist size.
    if (order.length > REORDER_MAX_LINKS) {
      return res.status(400).json({ message: `Cannot reorder more than ${REORDER_MAX_LINKS} links at once.` });
    }

    // ✅ FIXED: Validate every element is a non-empty string before issuing DB queries.
    // Previously any value (including objects, null) would be passed to updateLinkPosition.
    if (!order.every((id) => typeof id === 'string' && id.trim().length > 0)) {
      return res.status(400).json({ message: 'All items in order must be valid link ID strings.' });
    }

    // Position always recomputed server-side — never trust frontend-supplied numbers
    for (let i = 0; i < order.length; i++) {
      await updateLinkPosition(playlist.id, order[i], i + 1);
    }

    const links = await getPlaylistLinks(playlist.id);
    return res.status(200).json({ message: 'Playlist reordered.', links });
  } catch (err) {
    console.error('reorderLinks error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/playlists/search?q=...
export const searchPlaylists = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Query parameter q is required.' });
    }
    // ✅ FIXED: Unbounded search query → arbitrarily long ILIKE pattern → slow DB scan.
    if (q.length > SEARCH_QUERY_MAX) {
      return res.status(400).json({ message: `Search query must be ${SEARCH_QUERY_MAX} characters or fewer.` });
    }

    const results = await searchPublicPlaylists(q.trim());
    return res.status(200).json({ results });
  } catch (err) {
    console.error('searchPlaylists error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /p/:shareCode — PUBLIC, unauthenticated
export const viewPublicPlaylist = async (req, res) => {
  try {
    const playlist = await findPlaylistByShareCode(req.params.shareCode);
    if (!playlist || playlist.visibility === 'private') {
      // Same 404 for both cases — don't reveal that a private playlist exists
      return res.status(404).json({ message: 'Playlist not found.' });
    }

    const links = await getPlaylistLinks(playlist.id);
    return res.status(200).json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        visibility: playlist.visibility,
        created_at: playlist.created_at,
      },
      links,
    });
  } catch (err) {
    console.error('viewPublicPlaylist error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};