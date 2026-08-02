'use client'
import type { PublicQuestion } from '@/types/deucert'
import { normalizeTopicLabel } from '@/lib/deucert/topicLabels'

interface Props {
  question: PublicQuestion
  phase: 'answering' | 'revealed'
  selectedIndex: number | null
  correctIndex: number | null
  explanation: string | null
  onAnswer: (index: number) => void
  onNext: () => void
}

const LABELS = ['A', 'B', 'C', 'D']

export function QuestionCard({ question, phase, selectedIndex, correctIndex, explanation, onAnswer, onNext }: Props) {
  const revealed = phase === 'revealed'
  const isCorrect = revealed && selectedIndex === correctIndex

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 estudo-animate-slide-up">
      <div className="flex items-center gap-2 flex-wrap">
        {question.topic && (
          <span
            className="text-xs px-3 py-1 rounded-full border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {normalizeTopicLabel(question.topic)}
          </span>
        )}
        <span
          className="text-xs px-2 py-1 rounded-full font-bold uppercase"
          style={{
            color:
              question.difficulty === 'hard' ? '#ef4444' :
              question.difficulty === 'medium' ? '#f59e0b' : '#22c55e',
            background:
              question.difficulty === 'hard' ? 'rgba(239,68,68,0.12)' :
              question.difficulty === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
          }}
        >
          {question.difficulty}
        </span>
      </div>

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
          const isTheCorrectOne = revealed && correctIndex === i
          const showWrongSelected = revealed && isSelected && correctIndex !== i

          let feedbackClass = ''
          if (revealed) {
            if (isTheCorrectOne) feedbackClass = 'estudo-animate-correct'
            else if (showWrongSelected) feedbackClass = 'estudo-animate-wrong'
          }

          return (
            <button
              key={i}
              onClick={() => !revealed && onAnswer(i)}
              disabled={revealed}
              className={`relative p-4 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${feedbackClass}`}
              style={
                revealed
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
              <span className="font-black mr-2" style={{ color: 'var(--accent)' }}>{LABELS[i]}</span>
              {option}
              {isTheCorrectOne && <span className="ml-2">✅</span>}
              {showWrongSelected && <span className="ml-2">❌</span>}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="space-y-4 estudo-animate-slide-up">
          <div
            className="rounded-2xl p-4 border"
            style={{
              borderColor: isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
              background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            }}
          >
            <p className="font-black mb-1">{isCorrect ? '✅ Acertou!' : '❌ Errou'}</p>
            {explanation && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{explanation}</p>}
          </div>
          <button
            onClick={onNext}
            className="w-full py-3 px-6 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all"
            style={{ background: 'var(--accent)', color: '#0a0e14' }}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
