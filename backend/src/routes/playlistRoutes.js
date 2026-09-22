import { Router } from 'express';
import {
  createNewPlaylist,
  getMyPlaylists,
  getPlaylistById,
  updatePlaylistDetails,
  removePlaylist,
  addLink,
  removeLink,
  reorderLinks,
  searchPlaylists,
} from '../controllers/playlistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// IMPORTANT: /search must come before /:id, otherwise Express treats
// "search" as the :id parameter and this route is never reached.
router.get('/search', searchPlaylists);

router.post('/', requireAuth, createNewPlaylist);
router.get('/', requireAuth, getMyPlaylists);
router.get('/:id', requireAuth, getPlaylistById);
router.patch('/:id', requireAuth, updatePlaylistDetails);
router.delete('/:id', requireAuth, removePlaylist);

router.post('/:id/links', requireAuth, addLink);
router.delete('/:id/links/:linkId', requireAuth, removeLink);
router.patch('/:id/reorder', requireAuth, reorderLinks);

export default router;
