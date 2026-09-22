// Max UA length to accept — real browsers cap around 300 chars.
// Attackers can send a 1 MB user-agent to bloat logs/DB rows.
const MAX_UA_LENGTH = 512;

// Sanitize and truncate the raw User-Agent string before parsing or storing.
// Strips non-printable characters (log injection vectors) and enforces a length cap.
export const sanitizeUserAgent = (rawUa) => {
  if (!rawUa || typeof rawUa !== 'string') return null;
  // Remove non-printable ASCII characters (newlines, carriage returns, etc.)
  // that could be used for log injection (CRLF injection)
  const cleaned = rawUa.replace(/[^\x20-\x7E]/g, '').trim();
  return cleaned.slice(0, MAX_UA_LENGTH) || null;
};

// Lightweight UA parser — no dependency needed for basic device/browser detection
export const parseUserAgent = (userAgent) => {
  const safeUa = sanitizeUserAgent(userAgent);
  if (!safeUa) return { device: 'Unknown', browser: 'Unknown', sanitized: null };

  const ua = safeUa.toLowerCase();

  let device = 'Desktop';
  if (/mobile|iphone|android.*mobile/.test(ua)) device = 'Mobile';
  else if (/ipad|tablet|android(?!.*mobile)/.test(ua)) device = 'Tablet';

  let browser = 'Other';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';

  //Return the sanitized string so callers store the clean version, not the raw one
  return { device, browser, sanitized: safeUa };
};