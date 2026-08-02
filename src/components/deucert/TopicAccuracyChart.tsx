'use client'
import { motion } from 'framer-motion'
import type { TopicStats } from '@/types/deucert'
import { normalizeTopicLabel } from '@/lib/deucert/topicLabels'

interface Props {
  stats: TopicStats
}

function accuracyColor(accuracy: number): string {
  if (accuracy < 0.5) return '#ef4444'
  if (accuracy < 0.8) return '#f59e0b'
  return '#22c55e'
}

export function TopicAccuracyChart({ stats }: Props) {
  const { overall, topics, has_topic_data } = stats

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      <div className="rounded-2xl p-5 text-center border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Acerto geral neste tópico</p>
        <p className="text-4xl font-black" style={{ color: accuracyColor(overall.accuracy) }}>
          {Math.round(overall.accuracy * 100)}%
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{overall.correct}/{overall.total} respostas certas (histórico completo)</p>
      </div>

      {!has_topic_data ? (
        <div className="text-sm text-center rounded-2xl p-5 border" style={{ color: 'var(--text-muted)', background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          Este supertópico ainda não tem dados de subtópico — só é possível mostrar o acerto geral acima.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Ranking por tópico</p>
          {topics.map((t, i) => {
            const pct = Math.round(t.accuracy * 100)
            const color = accuracyColor(t.accuracy)
            return (
              <div key={t.topic} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{normalizeTopicLabel(t.topic)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{t.correct}/{t.total} ({pct}%)</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
