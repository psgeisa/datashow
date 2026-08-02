'use client'
import { useState } from 'react'
import type { QuestionPublic } from '@/types/game'

interface Props {
  question: QuestionPublic
  onAnswer: (index: number) => void
  answered: boolean
  eliminatedOptions?: number[]
  peekData?: Record<number, number>
}

const LABELS = ['A', 'B', 'C', 'D']
const COLORS = ['#0080ff', '#a855f7', '#ff6b35', '#22c55e']

const CATEGORY_ICONS: Record<string, string> = {
  sql: '🗃️', python: '🐍', ml: '🤖', stats: '📈',
  powerbi: '📊', azure: '☁️', az104: '☁️', data_eng: '⚙️', databricks: '⚡', meme: '😂',
}

export function QuestionCard({ question, onAnswer, answered, eliminatedOptions = [], peekData }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  function handleSelect(index: number) {
    if (answered || eliminatedOptions.includes(index) || selected !== null) return
    setSelected(index)
    onAnswer(index)
  }

  const totalPeek = peekData ? Object.values(peekData).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-slide-up">
      {/* Header: categoria + tipo */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm px-3 py-1 rounded-full border border-white/10 bg-white/5">
          {CATEGORY_ICONS[question.category] ?? '❓'} {question.category.toUpperCase()}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
          question.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
          question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-green-500/20 text-green-400'
        }`}>
          {question.difficulty.toUpperCase()}
        </span>
        {question.type !== 'multiple_choice' && (
          <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
            {question.type === 'code' ? '💻 CÓDIGO' :
             question.type === 'debug' ? '🐛 DEBUG' :
             question.type === 'meme' ? '😂 MEME' : question.type.toUpperCase()}
          </span>
        )}
      </div>

      {/* Meme context */}
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
      </div>

      {/* Alternativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, i) => {
          const isEliminated = eliminatedOptions.includes(i)
          const isSelected = selected === i
          const peekPercent = totalPeek > 0 ? Math.round(((peekData?.[i] ?? 0) / totalPeek) * 100) : 0

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isEliminated || answered || selected !== null}
              className={`relative p-4 rounded-xl border text-left text-sm font-medium transition-all duration-200
                ${isEliminated ? 'opacity-20 cursor-not-allowed' : ''}
                ${!isEliminated && !isSelected ? 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02]' : ''}
                ${isSelected ? 'scale-95' : ''}
              `}
              style={isSelected ? {
                borderColor: COLORS[i],
                borderWidth: 2,
                background: `${COLORS[i]}15`,
              } : {}}
            >
              <span className="font-black mr-2 text-base" style={{ color: COLORS[i] }}>
                {LABELS[i]}
              </span>
              {option}

              {/* Peek do BI Analyst */}
              {peekData && !isEliminated && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${peekPercent}%`, background: COLORS[i] }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{peekPercent}%</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
