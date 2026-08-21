-- ============================================
-- URL Shortener — PostgreSQL Schema
-- ============================================

-- Enable UUID generation
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
-- Handles both registration verification and password reset
CREATE TABLE IF NOT EXISTS otps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    otp_code        VARCHAR(10) NOT NULL,
    purpose         VARCHAR(20) NOT NULL CHECK (purpose IN ('register', 'reset_password')),
    is_used         BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup for verifying OTP by email + purpose
CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON otps (email, purpose);

-- ---------- LINKS ----------
CREATE TABLE IF NOT EXISTS links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = guest-created link
    original_url    TEXT NOT NULL,
    short_code      VARCHAR(30) UNIQUE NOT NULL,   -- nanoid-generated OR custom alias
    is_custom_alias BOOLEAN NOT NULL DEFAULT FALSE,
    guest_identifier VARCHAR(100),                 -- IP or session id, used for guest limit enforcement
    expires_at      TIMESTAMPTZ,                   -- NULL = never expires
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_links_short_code ON links (short_code);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links (user_id);
CREATE INDEX IF NOT EXISTS idx_links_guest_identifier ON links (guest_identifier);

-- ---------- CLICKS ----------
CREATE TABLE IF NOT EXISTS clicks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id         UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    referrer        TEXT,
    country         VARCHAR(100),
    clicked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks (link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks (clicked_at);
