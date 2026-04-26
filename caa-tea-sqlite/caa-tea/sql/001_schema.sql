-- ============================================================
--  CAA-TEA · Migración inicial
--  PostgreSQL 14+
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────
--  USUARIOS (niños + adultos vinculados)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(80) NOT NULL,
  role          VARCHAR(10) NOT NULL CHECK (role IN ('child', 'adult')),
  pin_hash      VARCHAR(255),          -- solo adultos (bcrypt)
  avatar_color  VARCHAR(7)  DEFAULT '#1D9E75',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relación adulto → niños que supervisa
CREATE TABLE adult_child_links (
  adult_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (adult_id, child_id)
);

-- ──────────────────────────────────────────────────────────────
--  PICTOGRAMAS PERSONALIZADOS (ARASAAC es la fuente principal,
--  pero el adulto puede añadir fotos propias del entorno)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE custom_pictograms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       VARCHAR(60) NOT NULL,
  image_url   TEXT        NOT NULL,
  category    VARCHAR(40) NOT NULL DEFAULT 'personal',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
--  MÓDULO A · FRASES GENERADAS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE generated_phrases (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pictogram_ids   JSONB   NOT NULL,  -- [{id, label, imageUrl}, ...]
  phrase_length   INT     NOT NULL,
  phrase_text     TEXT    NOT NULL,  -- texto concatenado para TTS
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_phrases_user_date
  ON generated_phrases(user_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────
--  MÓDULO B · AGENDA VISUAL (Ahora / Después / Luego)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE schedules (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE  NOT NULL DEFAULT CURRENT_DATE,
  slot_now    JSONB,   -- {pictoId, label, imageUrl, completed}
  slot_next   JSONB,
  slot_later  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id, date)
);

-- ──────────────────────────────────────────────────────────────
--  MÓDULO C · REGISTRO EMOCIONAL
-- ──────────────────────────────────────────────────────────────
CREATE TABLE emotional_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emotion          VARCHAR(30) NOT NULL,
  intensity        SMALLINT    CHECK (intensity BETWEEN 1 AND 3),
  strategy_chosen  VARCHAR(60),   -- null = no eligió estrategia (mediación adulta)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emotional_user_date
  ON emotional_logs(user_id, created_at DESC);

-- ──────────────────────────────────────────────────────────────
--  TELEMETRÍA GENERAL (sesiones, navegación)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE usage_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  VARCHAR(60) NOT NULL,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_user_type
  ON usage_events(user_id, event_type, created_at DESC);

-- ──────────────────────────────────────────────────────────────
--  TRIGGER: updated_at automático
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
