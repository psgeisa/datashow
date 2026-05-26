-- Migration 001 — versão corrigida (sem FK violation)
-- Execute no Supabase SQL Editor

-- 1. Remover constraint antiga de category
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_category_check;

-- 2. Alterar default de category
ALTER TABLE questions ALTER COLUMN category SET DEFAULT 'data_science';

-- 3. Adicionar coluna super_topic
ALTER TABLE questions ADD COLUMN IF NOT EXISTS super_topic TEXT;

-- 4. Adicionar coluna topic
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic TEXT;

-- 5. Remover constraint antiga de type
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;

-- 6. Habilitar RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 7. Policy de delete (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'questions_delete'
  ) THEN
    CREATE POLICY "questions_delete" ON questions FOR DELETE USING (true);
  END IF;
END$$;

-- 8. Índices
CREATE INDEX IF NOT EXISTS idx_questions_super_topic ON questions(super_topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty  ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_times_used  ON questions(times_used);

-- 9. Limpar referências órfãs de game_questions → questions legadas
DELETE FROM game_questions
WHERE question_id IN (
  SELECT id FROM questions
  WHERE is_ai_generated = false
    AND category IN ('sql','python','ml','stats','powerbi','azure','data_eng','databricks','meme')
);

-- 10. Agora sim deletar as questões legadas
DELETE FROM questions
WHERE is_ai_generated = false
  AND category IN ('sql','python','ml','stats','powerbi','azure','data_eng','databricks','meme');