'use client'
import { motion } from 'framer-motion'
import type { SoloStats } from '@/types/solo'

interface Props {
  stats: SoloStats
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
      {/* Acerto geral */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
        <p className="text-sm text-gray-400 mb-1">Acerto geral neste supertópico</p>
        <p className="text-4xl font-black" style={{ color: accuracyColor(overall.accuracy) }}>
          {Math.round(overall.accuracy * 100)}%
        </p>
        <p className="text-xs text-gray-500 mt-1">{overall.correct}/{overall.total} respostas certas (histórico completo)</p>
      </div>

      {!has_topic_data ? (
        <div className="text-sm text-gray-400 text-center border border-white/10 rounded-2xl p-5 bg-white/5">
          Este supertópico ainda não tem dados de subtópico — só é possível mostrar o acerto geral acima.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Ranking por tópico</p>
          {topics.map((t, i) => {
            const pct = Math.round(t.accuracy * 100)
            const color = accuracyColor(t.accuracy)
            return (
              <div key={t.topic} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t.topic}</span>
                  <span className="text-gray-400">{t.correct}/{t.total} ({pct}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
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
