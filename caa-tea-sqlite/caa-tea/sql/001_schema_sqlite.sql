-- CAA-TEA · Esquema SQLite
-- Ejecutar: sqlite3 caa_tea.db < sql/001_schema_sqlite.sql

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL CHECK(role IN ('child','adult')),
  pin_hash     TEXT,
  avatar_color TEXT DEFAULT '#1D9E75',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS adult_child_links (
  adult_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (adult_id, child_id)
);

CREATE TABLE IF NOT EXISTS generated_phrases (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pictogram_ids TEXT NOT NULL,
  phrase_length INTEGER NOT NULL,
  phrase_text   TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_phrases_user ON generated_phrases(user_id, created_at);

CREATE TABLE IF NOT EXISTS schedules (
  id         TEXT PRIMARY KEY,
  child_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT NOT NULL DEFAULT (date('now')),
  slot_now   TEXT,
  slot_next  TEXT,
  slot_later TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(child_id, date)
);

CREATE TABLE IF NOT EXISTS emotional_logs (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emotion          TEXT NOT NULL,
  intensity        INTEGER CHECK(intensity BETWEEN 1 AND 3),
  strategy_chosen  TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_events (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_user_type ON usage_events(user_id, event_type, created_at);

-- Progreso/gamificación del niño
CREATE TABLE IF NOT EXISTS child_progress (
  child_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_stars      INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  last_active_date TEXT,
  streak_days      INTEGER NOT NULL DEFAULT 0,
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
