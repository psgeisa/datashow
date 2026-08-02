'use client'
import type { CSSProperties } from 'react'
import type { QuestionOutcomeStatus } from './ExamQuestionCard'

interface Props {
  total: number
  currentIndex: number
  statuses: (QuestionOutcomeStatus | null)[]
  onJump: (index: number) => void
}

export function ExamProgressStrip({ total, currentIndex, statuses, onJump }: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-wrap gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const status = statuses[i] ?? null
        const isCurrent = i === currentIndex

        let style: CSSProperties
        if (status === 'correct') {
          style = { borderColor: '#22c55e', background: 'rgba(34,197,94,0.15)', color: '#22c55e' }
        } else if (status === 'wrong' || status === 'invalid') {
          style = { borderColor: '#ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }
        } else {
          style = { borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-muted)' }
        }
        if (isCurrent) style = { ...style, borderColor: status ? style.borderColor : 'var(--accent)' }

        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            title={`Questão ${i + 1}${status ? ` (${status === 'correct' ? 'correta' : status === 'wrong' ? 'errada' : 'inválida'})` : ''}`}
            className="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center border transition-all"
            style={{ ...style, borderWidth: isCurrent ? 2 : 1 }}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
