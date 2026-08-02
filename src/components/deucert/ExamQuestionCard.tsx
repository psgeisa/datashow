'use client'
import type { PublicQuestion } from '@/types/deucert'

export type QuestionOutcomeStatus = 'correct' | 'wrong' | 'invalid'

export interface QuestionOutcome {
  status: QuestionOutcomeStatus
  correct_index: number
  explanation: string | null
}

interface Props {
  question: PublicQuestion
  index: number
  total: number
  selectedIndex: number | null
  outcome: QuestionOutcome | null
  onSelect: (index: number) => void
  onReview: () => void
  onPrev: () => void
  onNext: () => void
  canGoPrev: boolean
  isLast: boolean
}

const LABELS = ['A', 'B', 'C', 'D']

const STATUS_BADGE: Record<QuestionOutcomeStatus, { text: string; color: string; bg: string }> = {
  correct: { text: '✅ Você acertou!', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  wrong: { text: '❌ Você errou', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  invalid: { text: '🚫 Questão invalidada — você viu a resposta antes de responder', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
}

export function ExamQuestionCard({
  question, index, total, selectedIndex, outcome, onSelect, onReview, onPrev, onNext, canGoPrev, isLast,
}: Props) {
  const resolved = outcome !== null

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 estudo-animate-slide-up">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Questão {index + 1} de {total}
      </p>

      <div className="rounded-2xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <p className="text-lg font-semibold leading-relaxed">{question.question}</p>
        {question.code_snippet && (
          <pre
            className="mt-4 rounded-xl p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'var(--accent)' }}
          >
            {question.code_snippet}
          </pre>
        )}
        {question.image_urls && question.image_urls.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.image_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`Exhibit ${i + 1}`}
                className="w-full rounded-xl"
                style={{ border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, i) => {
          const isSelected = selectedIndex === i
          const isTheCorrectOne = resolved && outcome.correct_index === i
          const showWrongSelected = resolved && outcome.status === 'wrong' && isSelected && outcome.correct_index !== i

          return (
            <button
              key={i}
              onClick={() => !resolved && onSelect(i)}
              disabled={resolved}
              className="relative p-4 rounded-xl border text-left text-sm font-medium transition-all duration-200"
              style={
                resolved
                  ? isTheCorrectOne
                    ? { borderColor: '#22c55e', borderWidth: 2, background: 'rgba(34,197,94,0.1)' }
                    : showWrongSelected
                      ? { borderColor: '#ef4444', borderWidth: 2, background: 'rgba(239,68,68,0.1)' }
                      : { borderColor: 'var(--border)', opacity: 0.5 }
                  : isSelected
                    ? { borderColor: 'var(--accent)', borderWidth: 2, background: 'var(--accent-soft)' }
                    : { borderColor: 'var(--border)', background: 'var(--bg-card)' }
              }
            >
              <span className="font-black mr-2" style={{ color: resolved ? undefined : 'var(--accent)' }}>{LABELS[i]}</span>
              {option}
              {isTheCorrectOne && <span className="ml-2">✅</span>}
              {showWrongSelected && <span className="ml-2">❌</span>}
            </button>
          )
        })}
      </div>

      {resolved && (
        <div
          className="rounded-2xl p-4 border estudo-animate-slide-up"
          style={{ borderColor: `${STATUS_BADGE[outcome.status].color}4d`, background: STATUS_BADGE[outcome.status].bg }}
        >
          <p className="font-black mb-1" style={{ color: STATUS_BADGE[outcome.status].color }}>{STATUS_BADGE[outcome.status].text}</p>
          {outcome.explanation && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{outcome.explanation}</p>}
        </div>
      )}

      {!resolved && (
        <button
          onClick={onReview}
          className="w-full py-2 rounded-xl text-sm font-bold border transition-all hover:scale-[1.01] active:scale-95"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          👁️ Revisar (mostra a resposta sem responder — invalida a questão)
        </button>
      )}

      <div className="flex gap-3">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="flex-1 py-3 px-6 rounded-2xl font-black border transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          ← Anterior
        </button>
        <button
          onClick={onNext}
          className="flex-1 py-3 px-6 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: 'var(--accent)', color: '#0a0e14' }}
        >
          {isLast ? 'Enviar simulado →' : 'Próxima →'}
        </button>
      </div>
    </div>
  )
}
