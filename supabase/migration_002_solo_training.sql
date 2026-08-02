-- Migration 002 — Treino Solo
-- Execute no Supabase SQL Editor

-- Log append-only de respostas do modo solo. question_id é guardado sem FK
-- de propósito: scripts/seed-questions.mjs apaga e reinsere as perguntas de
-- um super_topic a cada seed, gerando UUIDs novos — uma FK com ON DELETE
-- CASCADE apagaria em cascata todo o histórico de treino a cada reseed.
-- super_topic/topic/difficulty ficam desnormalizados na própria linha para
-- as estatísticas não precisarem de join com questions.
CREATE TABLE IF NOT EXISTS solo_answers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solo_player_id TEXT NOT NULL,
  question_id    UUID NOT NULL,
  super_topic    TEXT NOT NULL,
  topic          TEXT,
  difficulty     TEXT,
  selected_index INTEGER,
  is_correct     BOOLEAN NOT NULL,
  answered_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solo_answers_player_topic
  ON solo_answers(solo_player_id, super_topic);
CREATE INDEX IF NOT EXISTS idx_solo_answers_player_topic_subtopic
  ON solo_answers(solo_player_id, super_topic, topic);

-- RLS habilitado, sem nenhuma policy: bloqueia totalmente o anon key do
-- browser. Só o service-role client (usado nas rotas server-side de
-- src/app/api/solo/*) consegue ler/escrever aqui — ele ignora RLS.
ALTER TABLE solo_answers ENABLE ROW LEVEL SECURITY;
