import { nanoid } from 'nanoid';
import {
  createLink,
  findLinkByShortCode,
  findLinksByUserId,
  countLinksByGuestIdentifier,
  deleteLink,
} from '../models/linkModel.js';
import { createClick, getClicksForLink, countClicksForLink } from '../models/clickModel.js';
import { parseUserAgent } from '../utils/parseUserAgent.js';

const GUEST_LINK_LIMIT = 5; // adjust as needed

// POST /api/links
// Works for both logged-in users (req.user set by optional auth) and guests
export const createShortLink = async (req, res) => {
  try {
    const { originalUrl, customAlias, expiresInDays } = req.body;
    const userId = req.user?.id || null;

    if (!originalUrl) {
      return res.status(400).json({ message: 'originalUrl is required' });
    }

    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    // Guest limit enforcement — identify guest by IP
    let guestIdentifier = null;
    if (!userId) {
      guestIdentifier = req.ip;
      const guestLinkCount = await countLinksByGuestIdentifier(guestIdentifier);
      if (guestLinkCount >= GUEST_LINK_LIMIT) {
        return res.status(403).json({
          message: `Guest limit reached (${GUEST_LINK_LIMIT} links). Please register to create more.`,
        });
      }
    }

    let shortCode;
    let isCustomAlias = false;

    if (customAlias) {
      const existing = await findLinkByShortCode(customAlias);
      if (existing) {
        return res.status(409).json({ message: 'This alias is already taken' });
      }
      shortCode = customAlias;
      isCustomAlias = true;
    } else {
      shortCode = nanoid(7);
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const link = await createLink({
      userId,
      originalUrl,
      shortCode,
      isCustomAlias,
      guestIdentifier,
      expiresAt,
    });

    return res.status(201).json({ message: 'Short link created', link });
  } catch (err) {
    console.error('createShortLink error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// GET /:shortCode  — the actual redirect
export const redirectToOriginalUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const link = await findLinkByShortCode(shortCode);

    if (!link || !link.is_active) {
      return res.status(404).json({ message: 'Link not found' });
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ message: 'This link has expired' });
    }

    // Log the click (fire-and-forget, don't block the redirect)
    createClick({
      linkId: link.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer'] || req.headers['referrer'],
    }).catch((err) => console.error('Failed to log click:', err));

    return res.redirect(link.original_url);
  } catch (err) {
    console.error('redirectToOriginalUrl error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// GET /api/links  — logged-in user's own links (dashboard)
export const getMyLinks = async (req, res) => {
  try {
    const links = await findLinksByUserId(req.user.id);
    return res.status(200).json({ links });
  } catch (err) {
    console.error('getMyLinks error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// DELETE /api/links/:id
export const removeLink = async (req, res) => {
  try {
    const deleted = await deleteLink(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Link not found or not yours' });
    }
    return res.status(200).json({ message: 'Link deleted' });
  } catch (err) {
    console.error('removeLink error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

// GET /api/links/:id/analytics
export const getLinkAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const totalClicks = await countClicksForLink(id);
    const recentClicks = await getClicksForLink(id, 50);

    const deviceCounts = {};
    const browserCounts = {};
    const referrerCounts = {};

    for (const click of recentClicks) {
      const { device, browser } = parseUserAgent(click.user_agent);
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;

      const ref = click.referrer ? new URL(click.referrer, 'http://x').hostname || click.referrer : 'Direct';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    }

    const toSortedArray = (obj) =>
      Object.entries(obj)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      totalClicks,
      devices: toSortedArray(deviceCounts),
      browsers: toSortedArray(browserCounts),
      topReferrers: toSortedArray(referrerCounts).slice(0, 5),
      recentClicks: recentClicks.slice(0, 10).map((c) => ({
        clickedAt: c.clicked_at,
        ...parseUserAgent(c.user_agent),
        referrer: c.referrer,
      })),
    });
  } catch (err) {
    console.error('getLinkAnalytics error:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};