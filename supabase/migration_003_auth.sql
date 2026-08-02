-- Migration 003 — Auth (login/cadastro com rate limit)
-- Execute no Supabase SQL Editor

-- Corrige seed antigo: badge de habilidade tem que ficar em inglês
UPDATE characters SET ability_name = 'Hypothesis' WHERE slug = 'data_scientist';

-- Controle de tentativas de login por email. Só é lido/escrito pela
-- service role (rotas /api/auth/*) — nunca exposto ao client anônimo,
-- por isso RLS fica ligado sem nenhuma policy permissiva.
CREATE TABLE IF NOT EXISTS login_attempts (
  email           TEXT PRIMARY KEY,
  attempt_count   INTEGER NOT NULL DEFAULT 0,
  locked_until    TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
