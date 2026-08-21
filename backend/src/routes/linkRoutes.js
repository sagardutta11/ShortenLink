import { Router } from 'express';
import {
  createShortLink,
  getMyLinks,
  removeLink,
  getLinkAnalytics,
} from '../controllers/linkController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', optionalAuth, createShortLink);
router.get('/', requireAuth, getMyLinks);
router.delete('/:id', requireAuth, removeLink);
router.get('/:id/analytics', requireAuth, getLinkAnalytics);

export default router;
