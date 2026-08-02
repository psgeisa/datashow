-- Migration 005 — Imagens (exhibits) nas perguntas
-- Execute no Supabase SQL Editor

-- Algumas perguntas (ex: AZ-104) referenciam um "exhibit" — um print de
-- configuração do Azure Portal que faz parte do enunciado. Uma pergunta
-- pode ter mais de um exhibit, por isso é um array e não uma URL única.
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;
