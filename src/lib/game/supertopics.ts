import type { QuestionSuperTopic } from '@/types/game'

/**
 * Infers a super_topic from category + question text using keyword rules.
 * Used in start/route.ts when seeding LOCAL_QUESTIONS to the DB.
 *
 * DB migration required once:
 *   ALTER TABLE questions ADD COLUMN IF NOT EXISTS super_topic TEXT DEFAULT 'machine_learning';
 */
export function computeSuperTopic(category: string, question: string): QuestionSuperTopic {
  const t = question.toLowerCase()

  // ── Category fast-paths ──────────────────────────────────────────────────
  if (category === 'sql' || category === 'meme' || category === 'python') return 'ciencia_dados'
  if (category === 'powerbi' || category === 'azure' || category === 'data_eng') return 'cultura_dados'
  if (category === 'databricks') return 'machine_learning'

  if (category === 'stats') {
    if (/\bauc\b|\bks\b|gini|\brecall\b|\bprecision\b|\brmse\b|\bmae\b|r²/.test(t)) return 'metricas'
    return 'tipos_analise'
  }

  // ── ml: keyword disambiguation ────────────────────────────────────────────
  if (/tipo.*anális|o que aconteceu|por que aconteceu|eventos futuros|recomendar.*ação|descritiv[ao]|diagnósti|prediti[vo]|prescritiv/.test(t))
    return 'tipos_analise'

  if (/treino.*teste|k-fold|overfitting|underfitting|leakage|out-of-time|holdout|amostragem.*estratific|passado e futuro|generaliz|separação.*treino/.test(t))
    return 'validacao'

  if (/\bauc\b|\bks\b|gini|\brecall\b|\bprecision\b|\brmse\b|\bmae\b|r²|acurácia.*problem|threshold.*inad|métrica.*crédit/.test(t))
    return 'metricas'

  if (/cultura.*dado|data.driven|\bkpi\b|governança|maturidade|lineage|rollback|auditab|versionam|monitoram|\bdrift\b|explicabilidade|pipeline.*automat/.test(t))
    return 'cultura_dados'

  if (/\bllm\b|\brag\b|prompt.*engineer|hallucin|grounding|guardrail|fine.tuning|\brlhf\b|transformer|self.attention|\bembedding|busca.*semântic/.test(t))
    return 'ciencia_dados'

  return 'machine_learning'
}
