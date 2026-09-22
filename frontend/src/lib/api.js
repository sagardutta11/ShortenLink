// Centralized API client — all functions make real fetch calls to the backend.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
export const BACKEND_HOST = BACKEND_ORIGIN.replace(/^https?:\/\//, '');

// ── localStorage keys ─────────────────────────────────────────────────────────
const LS_TOKEN          = 'sl_token';
const LS_USER           = 'sl_user';
const LS_GUEST_COUNT    = 'sl_guest_count';
const LS_PENDING_SIGNUP = 'sl_pending_signup';
const LS_PENDING_RESET  = 'sl_pending_reset';

const GUEST_LIMIT = 5; // must match backend's GUEST_LINK_LIMIT in linkController.js

// ── localStorage helpers ──────────────────────────────────────────────────────
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

// ── Token helpers ─────────────────────────────────────────────────────────────
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

// ── Error helper ──────────────────────────────────────────────────────────────
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

// ── URLs ──────────────────────────────────────────────────────────────────────

export async function shortenUrl({ longUrl, alias, expiresInDays }) {
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

  // Track guest link count locally for UI display ("X links remaining").
  // Backend is the source of truth for enforcement — this is display-only.
  if (!getCurrentUser()) {
    const count = readLS(LS_GUEST_COUNT, 0);
    writeLS(LS_GUEST_COUNT, count + 1);
  }

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
  if (getCurrentUser()) return null; // logged-in users have no guest limit
  const count = readLS(LS_GUEST_COUNT, 0);
  return Math.max(0, GUEST_LIMIT - count);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function register({ name, email, password }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function login({ email, password }) {
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

// ── OTP: registration ─────────────────────────────────────────────────────────
// Flow: requestRegistrationOtp → backend creates unverified user + sends OTP
//       verifyRegistrationOtp  → backend verifies OTP, marks user verified

export async function requestRegistrationOtp({ name, email, password }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw await toApiError(res);
  writeLS(LS_PENDING_SIGNUP, { name, email });
  return res.json();
}

export async function verifyRegistrationOtp({ email, otp }) {
  const res = await fetch(`${BASE_URL}/otp/verify-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw await toApiError(res);
  localStorage.removeItem(LS_PENDING_SIGNUP);
  return res.json();
}

export async function resendRegistrationOtp() {
  const pending = readLS(LS_PENDING_SIGNUP, null);
  if (!pending) throw new Error('No pending registration to resend a code for.');
  // Re-hitting /register invalidates previous OTP and sends a new one
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pending),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export function getPendingRegistrationEmail() {
  return readLS(LS_PENDING_SIGNUP, null)?.email || null;
}

// ── OTP: password reset ───────────────────────────────────────────────────────

export async function requestPasswordReset({ email }) {
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
  const res = await fetch(`${BASE_URL}/otp/verify-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw await toApiError(res);
  // Store verified otp locally — resetPassword resends it to the backend for final check
  writeLS(LS_PENDING_RESET, { email, otp, verified: true });
  return { email };
}

export async function resendPasswordResetOtp() {
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
  const pending = readLS(LS_PENDING_RESET, null);
  if (!pending || pending.email !== email || !pending.verified) {
    throw new Error('Please verify the code before setting a new password.');
  }
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
  return readLS(LS_PENDING_RESET, null)?.email || null;
}

// ── Playlists ─────────────────────────────────────────────────────────────────

export async function createPlaylist({ name, description, visibility }) {
  const res = await fetch(`${BASE_URL}/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, description, visibility }),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()).playlist;
}

export async function getMyPlaylists() {
  const res = await fetch(`${BASE_URL}/playlists`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()).playlists;
}

export async function getPlaylistDetail(playlistId) {
  const res = await fetch(`${BASE_URL}/playlists/${playlistId}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await toApiError(res);
  return res.json(); // { playlist, links }
}

export async function updatePlaylistDetails(playlistId, { name, description, visibility }) {
  const res = await fetch(`${BASE_URL}/playlists/${playlistId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, description, visibility }),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()).playlist;
}

export async function deletePlaylist(playlistId) {
  const res = await fetch(`${BASE_URL}/playlists/${playlistId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function addLinkToPlaylist(playlistId, linkId) {
  const res = await fetch(`${BASE_URL}/playlists/${playlistId}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ linkId }),
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function removeLinkFromPlaylist(playlistId, linkId) {
  const res = await fetch(`${BASE_URL}/playlists/${playlistId}/links/${linkId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function reorderPlaylistLinks(playlistId, orderedLinkIds) {
  const res = await fetch(`${BASE_URL}/playlists/${playlistId}/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ order: orderedLinkIds }),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()).links;
}

export async function searchPublicPlaylists(q) {
  const res = await fetch(`${BASE_URL}/playlists/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw await toApiError(res);
  return (await res.json()).results;
}

export async function getPublicPlaylist(shareCode) {
  const res = await fetch(`${BACKEND_ORIGIN}/p/${shareCode}`);
  if (!res.ok) throw await toApiError(res);
  return res.json(); // { playlist, links }
}