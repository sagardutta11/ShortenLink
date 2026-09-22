-- ============================================
-- URL Shortener — PostgreSQL Schema
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- OTPS ----------
CREATE TABLE IF NOT EXISTS otps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,

    --  Was VARCHAR(10) — only fits a 5-digit plaintext OTP.
    -- bcrypt hashes are 60 characters. Changing to TEXT to accommodate the hash.
    -- If you are migrating an existing database, run:
    --   ALTER TABLE otps ALTER COLUMN otp_code TYPE TEXT;
    otp_code        TEXT NOT NULL,

    purpose         VARCHAR(20) NOT NULL CHECK (purpose IN ('register', 'reset_password')),
    is_used         BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON otps (email, purpose);

--  Partial index for faster lookup of only unused, non-expired OTPs.
-- getLatestOtp filters on is_used=FALSE and expires_at>NOW() — this index
-- makes that query hit only the small live subset, not the full table.
CREATE INDEX IF NOT EXISTS idx_otps_active
    ON otps (email, purpose)
    WHERE is_used = FALSE;

-- ---------- LINKS ----------
CREATE TABLE IF NOT EXISTS links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    original_url    TEXT NOT NULL,
    short_code      VARCHAR(30) UNIQUE NOT NULL,
    is_custom_alias BOOLEAN NOT NULL DEFAULT FALSE,
    guest_identifier VARCHAR(100),
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_links_short_code ON links (short_code);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links (user_id);
CREATE INDEX IF NOT EXISTS idx_links_guest_identifier ON links (guest_identifier);

--  Partial index for active, non-expired links — the hot path for redirects.
-- findLinkByShortCode now filters is_active=TRUE and expires_at>NOW();
-- this index makes that lookup sub-millisecond even with millions of rows.
CREATE INDEX IF NOT EXISTS idx_links_short_code_active
    ON links (short_code)
    WHERE is_active = TRUE;

-- ---------- CLICKS ----------
CREATE TABLE IF NOT EXISTS clicks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id         UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    ip_address      VARCHAR(50),
    user_agent      VARCHAR(512),   --  was TEXT (unlimited). Capped to 512 to match sanitizeUserAgent's output.
    referrer        TEXT,
    country         VARCHAR(100),
    clicked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks (link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks (clicked_at);