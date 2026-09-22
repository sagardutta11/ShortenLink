-- ============================================
-- Migration: Playlists — Web Playlists / Link Collections
-- ============================================

-- ---------- PLAYLISTS ----------
CREATE TABLE IF NOT EXISTS playlists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    share_code      VARCHAR(30) UNIQUE NOT NULL,
    visibility      VARCHAR(20) NOT NULL DEFAULT 'private'
                        CHECK (visibility IN ('private', 'unlisted', 'public')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists (user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_share_code ON playlists (share_code);
CREATE INDEX IF NOT EXISTS idx_playlists_visibility ON playlists (visibility);

-- ---------- PLAYLIST_LINKS (junction table) ----------
CREATE TABLE IF NOT EXISTS playlist_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id     UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    link_id         UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    position        INTEGER NOT NULL,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (playlist_id, link_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_links_playlist_id ON playlist_links (playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_links_link_id ON playlist_links (link_id);
