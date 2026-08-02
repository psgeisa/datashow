-- Migration 004 — Progresso de conta, ranking consolidado, encerramento antecipado
-- Execute no Supabase SQL Editor

-- ── SESSÕES DE JOGO SOLO ─────────────────────────────────────
-- Uma linha por tentativa de "Jogar Sozinho" (bateria completa ou
-- encerrada antes do fim) — diferente de solo_answers, que já loga
-- cada pergunta individualmente pra estatística de acerto por tópico.
-- user_id nulo = jogador anônimo, não entra no ranking.
CREATE TABLE IF NOT EXISTS solo_game_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solo_player_id     TEXT NOT NULL,
  user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  super_topic        TEXT NOT NULL,
  questions_answered INTEGER NOT NULL,
  correct_count      INTEGER NOT NULL,
  score              INTEGER NOT NULL,
  ended_early        BOOLEAN NOT NULL DEFAULT false,
  started_at         TIMESTAMPTZ NOT NULL,
  ended_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solo_game_sessions_user ON solo_game_sessions(user_id);

ALTER TABLE solo_game_sessions ENABLE ROW LEVEL SECURITY;

-- ── JOGO EM GRUPO — vincular partidas a uma conta ───────────
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_players_user ON players(user_id);

-- ── DEUCERT — documentando tabelas já existentes em produção ─
-- Essas duas tabelas foram criadas direto no Supabase quando o deuCert
-- foi trazido pra dentro do app (ver src/app/api/reforco/check-answer
-- e src/app/api/simulado/submit) e nunca ganharam migração neste repo.
-- CREATE TABLE IF NOT EXISTS não altera as que já existem em prod —
-- serve só pra quem sobe o banco do zero a partir daqui.
CREATE TABLE IF NOT EXISTS deucert_reforco_answers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      TEXT NOT NULL,
  question_id    UUID NOT NULL,
  super_topic    TEXT NOT NULL,
  topic          TEXT,
  difficulty     TEXT,
  source         TEXT NOT NULL CHECK (source IN ('reforco','simulado')),
  selected_index INTEGER,
  is_correct     BOOLEAN NOT NULL,
  answered_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deucert_reforco_answers_player_topic
  ON deucert_reforco_answers(player_id, super_topic);

ALTER TABLE deucert_reforco_answers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS deucert_simulado_results (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id          TEXT NOT NULL,
  exam_key           TEXT NOT NULL,
  question_count     INTEGER NOT NULL,
  correct_count      INTEGER NOT NULL,
  score_raw          INTEGER NOT NULL,
  passing_score      INTEGER NOT NULL,
  passed             BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deucert_simulado_results_player
  ON deucert_simulado_results(player_id);

ALTER TABLE deucert_simulado_results ENABLE ROW LEVEL SECURITY;

-- Roda mesmo se a tabela já existia em produção sem essa coluna —
-- marca tentativas de simulado encerradas antes do fim pelo usuário.
ALTER TABLE deucert_simulado_results ADD COLUMN IF NOT EXISTS ended_early BOOLEAN NOT NULL DEFAULT false;

-- ── PERFIL — nome de exibição no ranking ─────────────────────
-- Guarda só o nickname escolhido no cadastro, pra não expor o email
-- inteiro nas telas de ranking.
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Fallback de nome pra contas sem user_profiles (ex.: criadas antes
-- dessa migração) — só o service role consegue ler (sem grant pra
-- anon/authenticated), então não expõe email nenhum pro browser.
CREATE OR REPLACE VIEW leaderboard_profiles AS
SELECT id, email FROM auth.users;

REVOKE ALL ON leaderboard_profiles FROM anon, authenticated;
