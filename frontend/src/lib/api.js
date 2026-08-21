// Centralized API client. Right now this runs against an in-memory mock so
// the frontend is fully usable before the backend exists. Once the backend
// is live, replace the internals of each function with real `fetch` calls to
// BASE_URL — the function signatures/return shapes are designed to stay the
// same so components don't need to change.

// Centralized API client — wired to the real backend.

const BASE_URL = import.meta.env.VITE_API_URL;
const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/?$/, ''); // strip trailing /api to get just the host
const BACKEND_HOST = BACKEND_ORIGIN.replace(/^https?:\/\//, ''); // strip protocol — UI adds its own
const USE_MOCK = false;

const LS_LINKS = 'urlify_mock_links';
const LS_USER = 'urlify_mock_user';
const LS_GUEST_COUNT = 'urlify_mock_guest_count';
const LS_TOKEN = 'urlify_token';
const GUEST_LIMIT = 5; // must match backend's GUEST_LINK_LIMIT in linkController.js

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function randomCode(len = 6) {
  return Math.random().toString(36).slice(2, 2 + len);
}

async function fakeDelay(ms = 500) {
  return new Promise((res) => setTimeout(res, ms));
}

function getToken() {
  return localStorage.getItem(LS_TOKEN);
}
function setToken(token) {
  localStorage.setItem(LS_TOKEN, token);
}
function clearToken() {
  localStorage.removeItem(LS_TOKEN);
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------- URLs ----------

export async function shortenUrl({ longUrl, alias, expiresInDays }) {
  if (USE_MOCK) {
    await fakeDelay(400);
    const user = readLS(LS_USER, null);
    if (!user) {
      const count = readLS(LS_GUEST_COUNT, 0);
      if (count >= GUEST_LIMIT) {
        const err = new Error('GUEST_LIMIT_REACHED');
        err.code = 'GUEST_LIMIT_REACHED';
        throw err;
      }
      writeLS(LS_GUEST_COUNT, count + 1);
    }
    if (alias && !user) {
      const err = new Error('Custom aliases require an account');
      err.code = 'ALIAS_REQUIRES_ACCOUNT';
      throw err;
    }
    const code = alias || randomCode();
    const links = readLS(LS_LINKS, []);
    if (links.some((l) => l.code === code)) {
      const err = new Error('That alias is already taken');
      err.code = 'ALIAS_TAKEN';
      throw err;
    }
    const link = {
      id: crypto.randomUUID(),
      longUrl,
      code,
      shortUrl: `urlify.dev/${code}`,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };
    links.unshift(link);
    writeLS(LS_LINKS, links);
    return link;
  }

  const res = await fetch(`${BASE_URL}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ originalUrl: longUrl, customAlias: alias, expiresInDays }),
  });
  if (!res.ok) {
    const err = await toApiError(res);
    if (res.status === 403 && /guest limit/i.test(err.message)) {
      err.code = 'GUEST_LIMIT_REACHED';
    }
    throw err;
  }
  const data = await res.json();
  const link = data.link;

  // Track guest link count locally too, so the UI can show "remaining" count.
  // Backend is the source of truth for enforcement; this is just for display.
  if (!getCurrentUser()) {
    const count = readLS(LS_GUEST_COUNT, 0);
    writeLS(LS_GUEST_COUNT, count + 1);
  }

  // Normalize backend shape to what components expect
  return {
    id: link.id,
    longUrl: link.original_url,
    code: link.short_code,
    shortUrl: `${BACKEND_HOST}/${link.short_code}`,
    clicks: 0,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
  };
}

export async function getMyUrls() {
  if (USE_MOCK) {
    await fakeDelay(300);
    return readLS(LS_LINKS, []);
  }
  const res = await fetch(`${BASE_URL}/links`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await toApiError(res);
  const data = await res.json();
  return (data.links || []).map((link) => ({
    id: link.id,
    longUrl: link.original_url,
    code: link.short_code,
    shortUrl: `${BACKEND_HOST}/${link.short_code}`,
    clicks: link.clicks || 0,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
  }));
}

export async function getLinkAnalytics(linkId) {
  const res = await fetch(`${BASE_URL}/links/${linkId}/analytics`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export function getGuestLinksRemaining() {
  const user = readLS(LS_USER, null);
  if (user) return null; // unlimited (or plan-based) once logged in
  const count = readLS(LS_GUEST_COUNT, 0);
  return Math.max(0, GUEST_LIMIT - count);
}

// ---------- Auth ----------

export async function register({ name, email, password }) {
  if (USE_MOCK) {
    await fakeDelay(500);
    const user = { id: crypto.randomUUID(), name, email };
    writeLS(LS_USER, user);
    return user;
  }
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function login({ email, password }) {
  if (USE_MOCK) {
    await fakeDelay(500);
    if (!email || !password) {
      const err = new Error('Email and password are required');
      throw err;
    }
    const user = { id: crypto.randomUUID(), name: email.split('@')[0], email };
    writeLS(LS_USER, user);
    return user;
  }
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await toApiError(res);
  const data = await res.json();
  setToken(data.token);
  writeLS(LS_USER, data.user);
  return data.user;
}

export function logout() {
  localStorage.removeItem(LS_USER);
  clearToken();
}

export function getCurrentUser() {
  return readLS(LS_USER, null);
}

// ---------- OTP: email verification (registration) ----------
// Flow: requestRegistrationOtp -> backend creates unverified user + sends OTP
//       verifyRegistrationOtp  -> backend verifies OTP, marks user verified

const LS_PENDING_SIGNUP = 'urlify_mock_pending_signup';
const LS_PENDING_RESET = 'urlify_mock_pending_reset';
const LS_USERS_BY_EMAIL = 'urlify_mock_users_by_email';

function generateOtp() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export async function requestRegistrationOtp({ name, email, password }) {
  if (USE_MOCK) {
    await fakeDelay(500);
    const otp = generateOtp();
    writeLS(LS_PENDING_SIGNUP, { name, email, password, otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.info(`[URLify mock] OTP for ${email}: ${otp}`);
    return { email, devOtp: otp };
  }
  // our backend's /auth/register both creates the user AND sends the OTP
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw await toApiError(res);
  writeLS(LS_PENDING_SIGNUP, { name, email }); // remember for resend/getPendingRegistrationEmail
  return res.json();
}

export async function verifyRegistrationOtp({ email, otp }) {
  if (USE_MOCK) {
    await fakeDelay(500);
    const pending = readLS(LS_PENDING_SIGNUP, null);
    if (!pending || pending.email !== email) {
      throw new Error('No pending registration found for this email.');
    }
    if (Date.now() > pending.expiresAt) {
      const err = new Error('This code has expired. Please request a new one.');
      err.code = 'OTP_EXPIRED';
      throw err;
    }
    if (String(otp) !== pending.otp) {
      const err = new Error('Incorrect code. Please check and try again.');
      err.code = 'OTP_INVALID';
      throw err;
    }
    const usersByEmail = readLS(LS_USERS_BY_EMAIL, {});
    usersByEmail[pending.email] = { name: pending.name, email: pending.email, password: pending.password };
    writeLS(LS_USERS_BY_EMAIL, usersByEmail);
    localStorage.removeItem(LS_PENDING_SIGNUP);
    const user = { id: crypto.randomUUID(), name: pending.name, email: pending.email };
    writeLS(LS_USER, user);
    return user;
  }
  const res = await fetch(`${BASE_URL}/otp/verify-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw await toApiError(res);
  const data = await res.json();
  localStorage.removeItem(LS_PENDING_SIGNUP);
  // Backend doesn't auto-login after verify — user still needs to log in.
  // We just clear pending state here; App should redirect to /login.
  return data.user;
}

export async function resendRegistrationOtp() {
  if (USE_MOCK) {
    await fakeDelay(400);
    const pending = readLS(LS_PENDING_SIGNUP, null);
    if (!pending) throw new Error('No pending registration to resend a code for.');
    const otp = generateOtp();
    writeLS(LS_PENDING_SIGNUP, { ...pending, otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.info(`[URLify mock] Resent OTP for ${pending.email}: ${otp}`);
    return { email: pending.email, devOtp: otp };
  }
  const pending = readLS(LS_PENDING_SIGNUP, null);
  if (!pending) throw new Error('No pending registration to resend a code for.');
  // our backend has no separate resend route — re-hitting /register invalidates + resends OTP
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pending),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export function getPendingRegistrationEmail() {
  const pending = readLS(LS_PENDING_SIGNUP, null);
  return pending?.email || null;
}

// ---------- OTP: forgot password ----------

export async function requestPasswordReset({ email }) {
  if (USE_MOCK) {
    await fakeDelay(500);
    const otp = generateOtp();
    writeLS(LS_PENDING_RESET, { email, otp, verified: false, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.info(`[URLify mock] Password reset OTP for ${email}: ${otp}`);
    return { email, devOtp: otp };
  }
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await toApiError(res);
  writeLS(LS_PENDING_RESET, { email, verified: false });
  return res.json();
}

export async function verifyPasswordResetOtp({ email, otp }) {
  if (USE_MOCK) {
    await fakeDelay(500);
    const pending = readLS(LS_PENDING_RESET, null);
    if (!pending || pending.email !== email) {
      throw new Error('No password reset in progress for this email.');
    }
    if (Date.now() > pending.expiresAt) {
      const err = new Error('This code has expired. Please request a new one.');
      err.code = 'OTP_EXPIRED';
      throw err;
    }
    if (String(otp) !== pending.otp) {
      const err = new Error('Incorrect code. Please check and try again.');
      err.code = 'OTP_INVALID';
      throw err;
    }
    writeLS(LS_PENDING_RESET, { ...pending, verified: true });
    return { email };
  }
  const res = await fetch(`${BASE_URL}/otp/verify-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw await toApiError(res);
  // remember the verified otp locally so resetPassword can resend it (backend re-checks it anyway)
  writeLS(LS_PENDING_RESET, { email, otp, verified: true });
  return { email };
}

export async function resendPasswordResetOtp() {
  if (USE_MOCK) {
    await fakeDelay(400);
    const pending = readLS(LS_PENDING_RESET, null);
    if (!pending) throw new Error('No password reset in progress to resend a code for.');
    const otp = generateOtp();
    writeLS(LS_PENDING_RESET, { ...pending, otp, verified: false, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.info(`[URLify mock] Resent password reset OTP for ${pending.email}: ${otp}`);
    return { email: pending.email, devOtp: otp };
  }
  const pending = readLS(LS_PENDING_RESET, null);
  if (!pending) throw new Error('No password reset in progress to resend a code for.');
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: pending.email }),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function resetPassword({ email, newPassword }) {
  if (USE_MOCK) {
    await fakeDelay(500);
    const pending = readLS(LS_PENDING_RESET, null);
    if (!pending || pending.email !== email || !pending.verified) {
      throw new Error('Please verify the code before setting a new password.');
    }
    const usersByEmail = readLS(LS_USERS_BY_EMAIL, {});
    if (usersByEmail[email]) {
      usersByEmail[email].password = newPassword;
      writeLS(LS_USERS_BY_EMAIL, usersByEmail);
    }
    localStorage.removeItem(LS_PENDING_RESET);
    return { success: true };
  }
  const pending = readLS(LS_PENDING_RESET, null);
  if (!pending || pending.email !== email || !pending.verified) {
    throw new Error('Please verify the code before setting a new password.');
  }
  // our backend's reset-password route re-validates the OTP itself, so we resend it here
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: pending.otp, newPassword }),
  });
  if (!res.ok) throw await toApiError(res);
  localStorage.removeItem(LS_PENDING_RESET);
  return res.json();
}

export function getPendingResetEmail() {
  const pending = readLS(LS_PENDING_RESET, null);
  return pending?.email || null;
}

async function toApiError(res) {
  let message = 'Something went wrong. Please try again.';
  try {
    const data = await res.json();
    message = data.message || message;
  } catch {
    // ignore parse errors
  }
  const err = new Error(message);
  err.status = res.status;
  return err;
}