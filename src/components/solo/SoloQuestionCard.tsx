'use client'
import type { SoloQuestion } from '@/types/solo'

interface Props {
  question: SoloQuestion
  phase: 'answering' | 'revealed'
  selectedIndex: number | null
  correctIndex: number | null
  explanation: string | null
  onAnswer: (index: number) => void
  onNext: () => void
}

const LABELS = ['A', 'B', 'C', 'D']
const COLORS = ['#0080ff', '#a855f7', '#ff6b35', '#22c55e']

export function SoloQuestionCard({ question, phase, selectedIndex, correctIndex, explanation, onAnswer, onNext }: Props) {
  const revealed = phase === 'revealed'
  const isCorrect = revealed && selectedIndex === correctIndex

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-slide-up">
      {/* Header: dificuldade + tópico */}
      <div className="flex items-center gap-2 flex-wrap">
        {question.topic && (
          <span className="text-sm px-3 py-1 rounded-full border border-white/10 bg-white/5">
            🏷️ {question.topic}
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
          question.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
          question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-green-500/20 text-green-400'
        }`}>
          {question.difficulty.toUpperCase()}
        </span>
      </div>

      {question.meme_context && (
        <div className="text-sm text-gray-400 italic border-l-2 border-yellow-500/50 pl-3">
          {question.meme_context}
        </div>
      )}

      {/* Pergunta */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-lg font-semibold leading-relaxed">{question.question}</p>
        {question.code_snippet && (
          <pre className="mt-4 bg-black/70 border border-white/10 rounded-xl p-4 text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
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
                className="w-full rounded-xl border border-white/10 bg-black/30"
              />
            ))}
          </div>
        )}
      </div>

      {/* Alternativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, i) => {
          const isSelected = selectedIndex === i
          const isTheCorrectOne = revealed && correctIndex === i
          const showWrongSelected = revealed && isSelected && correctIndex !== i

          let feedbackClass = ''
          if (revealed) {
            if (isTheCorrectOne) feedbackClass = 'animate-correct'
            else if (showWrongSelected) feedbackClass = 'animate-wrong'
          }

          return (
            <button
              key={i}
              onClick={() => !revealed && onAnswer(i)}
              disabled={revealed}
              className={`relative p-4 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${feedbackClass}
                ${!revealed && !isSelected ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02]' : ''}
                ${!revealed && isSelected ? 'scale-95' : ''}
              `}
              style={
                revealed
                  ? isTheCorrectOne
                    ? { borderColor: '#22c55e', borderWidth: 2, background: '#22c55e15' }
                    : showWrongSelected
                      ? { borderColor: '#ef4444', borderWidth: 2, background: '#ef444415' }
                      : { opacity: 0.5 }
                  : isSelected
                    ? { borderColor: COLORS[i], borderWidth: 2, background: `${COLORS[i]}15` }
                    : {}
              }
            >
              <span className="font-black mr-2 text-base" style={{ color: revealed ? undefined : COLORS[i] }}>
                {LABELS[i]}
              </span>
              {option}
              {isTheCorrectOne && <span className="ml-2">✅</span>}
              {showWrongSelected && <span className="ml-2">❌</span>}
            </button>
          )
        })}
      </div>

      {/* Explicação + próxima */}
      {revealed && (
        <div className="space-y-4 animate-slide-up">
          <div className={`rounded-2xl p-4 border ${isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
            <p className="font-black mb-1">{isCorrect ? '✅ Acertou!' : '❌ Errou'}</p>
            {explanation && <p className="text-sm text-gray-300 leading-relaxed">{explanation}</p>}
          </div>
          <button
            onClick={onNext}
            className="w-full py-3 px-6 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)' }}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
