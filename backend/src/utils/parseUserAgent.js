// Lightweight UA parser — no dependency needed for basic device/browser detection
export const parseUserAgent = (userAgent) => {
  if (!userAgent) return { device: 'Unknown', browser: 'Unknown' };

  const ua = userAgent.toLowerCase();

  let device = 'Desktop';
  if (/mobile|iphone|android.*mobile/.test(ua)) device = 'Mobile';
  else if (/ipad|tablet|android(?!.*mobile)/.test(ua)) device = 'Tablet';

  let browser = 'Other';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';

  return { device, browser };
};
