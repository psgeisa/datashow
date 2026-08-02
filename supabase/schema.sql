-- ============================================================
-- DATASHOW — Schema completo
-- Copiar e executar no SQL Editor do Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PERSONAGENS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  color       TEXT NOT NULL,
  role        TEXT NOT NULL,
  ability_name        TEXT NOT NULL,
  ability_description TEXT NOT NULL,
  ability_type        TEXT NOT NULL CHECK (ability_type IN ('eliminate','skip','peek','double'))
);

-- ── SALAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,
  host_session_id  TEXT NOT NULL,
  status           TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','playing','finished')),
  current_round    INTEGER DEFAULT 0,
  total_rounds     INTEGER DEFAULT 10,
  timer_seconds    INTEGER DEFAULT 30,
  round_started_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── JOGADORES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  session_id     TEXT NOT NULL,
  nickname       TEXT NOT NULL,
  character_slug TEXT REFERENCES characters(slug),
  score          INTEGER DEFAULT 0,
  combo          INTEGER DEFAULT 0,
  multiplier     DECIMAL(3,1) DEFAULT 1.0,
  ability_uses   INTEGER DEFAULT 1,
  status         TEXT DEFAULT 'active' CHECK (status IN ('active','disconnected')),
  joined_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, session_id)
);

-- ── PERGUNTAS ────────────────────────────────────────────────
-- Questões populadas via: node scripts/seed-questions.mjs
-- (não inserir manualmente — usar seed script)
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        TEXT NOT NULL DEFAULT 'data_science',
  super_topic     TEXT,                    -- módulo temático escolhível no jogo
  topic           TEXT,                    -- subtópico dentro do super_topic
  difficulty      TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  type            TEXT DEFAULT 'multiple_choice',
  question        TEXT NOT NULL,
  options         JSONB NOT NULL,
  correct_index   INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation     TEXT,
  code_snippet    TEXT,
  meme_context    TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  times_used      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PERGUNTAS POR RODADA ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES questions(id),
  round_number INTEGER NOT NULL,
  UNIQUE(room_id, round_number)
);

-- ── RESPOSTAS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS answers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round_number   INTEGER NOT NULL,
  selected_index INTEGER,
  is_correct     BOOLEAN,
  time_taken_ms  INTEGER,
  points_earned  INTEGER DEFAULT 0,
  combo_at_time  INTEGER DEFAULT 0,
  ability_used   TEXT,
  answered_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, player_id, round_number)
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE players        ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers        ENABLE ROW LEVEL SECURITY;

-- Políticas abertas (MVP — restringir em produção)
CREATE POLICY "rooms_all"          ON rooms          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "players_all"        ON players        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "game_questions_all" ON game_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "answers_all"        ON answers        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "questions_read"     ON questions      FOR SELECT USING (true);
CREATE POLICY "questions_insert"   ON questions      FOR INSERT WITH CHECK (true);
CREATE POLICY "questions_delete"   ON questions      FOR DELETE USING (true);

-- ── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_super_topic ON questions(super_topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty  ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_times_used  ON questions(times_used);

-- ── FUNÇÃO: decrementar ability_uses ────────────────────────
CREATE OR REPLACE FUNCTION decrement_ability_uses(p_player_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE players
  SET ability_uses = GREATEST(0, ability_uses - 1)
  WHERE id = p_player_id;
END;
$$;

-- ── FUNÇÃO: incrementar times_used em lote ───────────────────
CREATE OR REPLACE FUNCTION increment_questions_used(question_ids UUID[])
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE questions
  SET times_used = times_used + 1
  WHERE id = ANY(question_ids);
END;
$$;

-- ── SEED: Personagens ────────────────────────────────────────
INSERT INTO characters (slug, name, emoji, color, role, ability_name, ability_description, ability_type)
VALUES
  ('data_scientist', 'Cientista de Dados', '🧪', '#00d4ff', 'Especialista em hipóteses e modelos',
   'Hypothesis', 'Elimina 2 alternativas erradas', 'eliminate'),
  ('data_engineer',  'Data Engineer',      '⚙️', '#ff6b35', 'Mestre dos pipelines de dados',
   'Pipeline',  'Pula uma pergunta sem penalidade', 'skip'),
  ('bi_analyst',     'Analista BI',         '📊', '#a855f7', 'Insights e dashboards estratégicos',
   'Dashboard', 'Vê quantos jogadores escolheram cada opção', 'peek'),
  ('ml_engineer',    'ML Engineer',         '🤖', '#22c55e', 'Modelos, algoritmos e prod',
   'Double Down', 'Dobra os pontos da próxima resposta certa', 'double')
ON CONFLICT (slug) DO NOTHING;
