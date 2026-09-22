import { nanoid } from 'nanoid';
import { promises as dns } from 'dns';
import {
  createLink,
  findLinkByShortCode,
  findLinksByUserId,
  countLinksByGuestIdentifier,
  deleteLink,
} from '../models/linkModel.js';
import { createClick, getClicksForLink, countClicksForLink } from '../models/clickModel.js';
import { parseUserAgent, sanitizeUserAgent } from '../utils/parseUserAgent.js';
import { query } from '../config/db.js';

const GUEST_LINK_LIMIT = 5;

// ── URL VALIDATION ─────────────────────────────────────────────────────────────

const PRIVATE_IP_RE = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,           // AWS metadata
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

const isPrivateIp = (ip) => PRIVATE_IP_RE.some((re) => re.test(ip));

const validateDestinationUrl = async (rawUrl) => {
  // 1. Must be parseable
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format.');
  }

  // 2. Only http/https allowed
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed.');
  }

  const hostname = parsed.hostname;

  // 3. Block obvious private IP literals immediately (no DNS needed)
  if (isPrivateIp(hostname)) {
    throw new Error('URLs pointing to private or internal addresses are not allowed.');
  }

  // 4. Block localhost by name
  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new Error('URLs pointing to private or internal addresses are not allowed.');
  }

  // 5. SSRF via DNS — resolve and check IPs.
  // If DNS resolution fails (network issue, slow DNS, dev environment),
  // we now ALLOW the URL instead of blocking it. We only block if DNS succeeds
  // AND the resolved IP is private. This prevents valid public URLs like
  // youtube.com from being rejected due to transient DNS failures.
  try {
    const addresses = await Promise.race([
      dns.resolve(hostname),
      // Timeout after 3 seconds — don't make the user wait forever
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        throw new Error('URL resolves to a private or internal address.');
      }
    }
  } catch (err) {
    // Only block if we confirmed a private IP — let DNS failures and timeouts through
    if (err.message.includes('private') || err.message.includes('internal')) {
      throw err;
    }
    // DNS failed or timed out — allow the URL, log for monitoring
    console.warn(`[SSRF-check] DNS lookup failed for ${hostname}: ${err.message} — allowing`);
  }

  return parsed.href;
};

// ── ALIAS VALIDATION ───────────────────────────────────────────────────────────

const ALIAS_RE = /^[a-zA-Z0-9_-]{3,30}$/;

const validateAlias = (alias) => {
  if (!ALIAS_RE.test(alias)) {
    throw new Error('Alias must be 3–30 characters: letters, numbers, hyphens, underscores only.');
  }
};

// ── CONTROLLERS ────────────────────────────────────────────────────────────────

// POST /api/links
export const createShortLink = async (req, res) => {
  try {
    const { originalUrl, customAlias, expiresInDays } = req.body;
    const userId = req.user?.id || null;

    if (!originalUrl) {
      return res.status(400).json({ message: 'originalUrl is required.' });
    }

    try {
      await validateDestinationUrl(originalUrl);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    if (customAlias) {
      try {
        validateAlias(customAlias);
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    }

    if (expiresInDays !== undefined) {
      const days = Number(expiresInDays);
      if (!Number.isInteger(days) || days < 1 || days > 365) {
        return res.status(400).json({ message: 'expiresInDays must be an integer between 1 and 365.' });
      }
    }

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
        return res.status(409).json({ message: 'This alias is already taken.' });
      }
      shortCode = customAlias;
      isCustomAlias = true;
    } else {
      shortCode = nanoid(7);
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000)
      : null;

    const link = await createLink({
      userId,
      originalUrl,
      shortCode,
      isCustomAlias,
      guestIdentifier,
      expiresAt,
    });

    return res.status(201).json({ message: 'Short link created.', link });
  } catch (err) {
    console.error('createShortLink error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /:shortCode — redirect
export const redirectToOriginalUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    if (!ALIAS_RE.test(shortCode) && !/^[a-zA-Z0-9_-]{7}$/.test(shortCode)) {
      return res.status(404).json({ message: 'Link not found.' });
    }

    const link = await findLinkByShortCode(shortCode);
    if (!link) {
      return res.status(404).json({ message: 'Link not found.' });
    }

    const rawUa = req.headers['user-agent'];
    const safeUa = sanitizeUserAgent(rawUa);

    createClick({
      linkId: link.id,
      ipAddress: req.ip,
      userAgent: safeUa,
      referrer: req.headers['referer'] || req.headers['referrer'] || null,
    }).catch((err) => console.error('Failed to log click:', err));

    return res.redirect(302, link.original_url);
  } catch (err) {
    console.error('redirectToOriginalUrl error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/links
export const getMyLinks = async (req, res) => {
  try {
    const links = await findLinksByUserId(req.user.id);
    return res.status(200).json({ links });
  } catch (err) {
    console.error('getMyLinks error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// DELETE /api/links/:id
export const removeLink = async (req, res) => {
  try {
    const deleted = await deleteLink(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Link not found or not yours.' });
    }
    return res.status(200).json({ message: 'Link deleted.' });
  } catch (err) {
    console.error('removeLink error:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

// GET /api/links/:id/analytics
export const getLinkAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const linkResult = await query(
      `SELECT id FROM links WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (!linkResult.rows[0]) {
      return res.status(404).json({ message: 'Link not found.' });
    }

    const totalClicks = await countClicksForLink(id);
    const recentClicks = await getClicksForLink(id, 50);

    const deviceCounts = {};
    const browserCounts = {};
    const referrerCounts = {};

    for (const click of recentClicks) {
      const { device, browser } = parseUserAgent(click.user_agent);
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;

      let ref = 'Direct';
      if (click.referrer) {
        try {
          ref = new URL(click.referrer).hostname || click.referrer;
        } catch {
          ref = click.referrer.slice(0, 100);
        }
      }
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
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};