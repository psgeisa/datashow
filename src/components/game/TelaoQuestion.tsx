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
const OPTION_COLORS = ['#0ea5e9', '#f59e0b', '#a855f7', '#22c55e']

const CATEGORY_META: Record<string, { icon: string; label: string; color: string }> = {
  sql:        { icon: '🗃️', label: 'SQL',             color: '#00d4ff' },
  python:     { icon: '🐍', label: 'Python & IA',      color: '#3b82f6' },
  ml:         { icon: '🤖', label: 'Machine Learning', color: '#a855f7' },
  stats:      { icon: '📊', label: 'Estatística',      color: '#f59e0b' },
  data_eng:   { icon: '⚙️', label: 'Eng. de Dados',   color: '#10b981' },
  powerbi:    { icon: '📈', label: 'Power BI',         color: '#f97316' },
  azure:      { icon: '☁️', label: 'Azure',            color: '#60a5fa' },
  az104:      { icon: '☁️', label: 'AZ-104',           color: '#0078d4' },
  databricks: { icon: '⚡', label: 'Databricks',       color: '#ff6b35' },
  meme:       { icon: '😂', label: 'Meme',             color: '#ec4899' },
}

export function TelaoQuestion({ question, onAnswer, answered, eliminatedOptions = [], peekData }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const meta = CATEGORY_META[question.category] ?? { icon: '❓', label: question.category, color: '#888' }
  const totalPeek = peekData ? Object.values(peekData).reduce((a, b) => a + b, 0) : 0

  function handleSelect(index: number) {
    if (answered || eliminatedOptions.includes(index) || selected !== null) return
    setSelected(index)
    onAnswer(index)
  }

  return (
    <div
      className="w-full rounded-2xl overflow-hidden animate-telao-glow"
      style={{
        background: 'linear-gradient(160deg, #0a0a1f 0%, #070714 100%)',
        border: '2px solid rgba(201,162,39,0.6)',
      }}
    >
      {/* Telão header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'linear-gradient(90deg, rgba(201,162,39,0.15) 0%, transparent 100%)', borderBottom: '1px solid rgba(201,162,39,0.25)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            question.difficulty === 'hard'   ? 'bg-red-500/20 text-red-400' :
            question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                              'bg-green-500/20 text-green-400'
          }`}
        >
          {question.difficulty === 'hard' ? '🔥 DIFÍCIL' : question.difficulty === 'medium' ? '⚡ MÉDIO' : '✅ FÁCIL'}
        </span>
      </div>

      {/* Question text */}
      <div className="px-5 py-5">
        {question.meme_context && (
          <p className="text-xs text-yellow-400/70 italic mb-3 border-l-2 border-yellow-500/40 pl-3">
            {question.meme_context}
          </p>
        )}
        <p
          className="font-bold leading-relaxed text-white"
          style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
        >
          {question.question}
        </p>
        {question.code_snippet && (
          <pre
            className="mt-4 p-4 rounded-xl text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(34,197,94,0.2)' }}
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
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="px-4 pb-4 space-y-2.5">
        {question.options.map((option, i) => {
          const isEliminated = eliminatedOptions.includes(i)
          const isSelected   = selected === i
          const peekPct      = totalPeek > 0 ? Math.round(((peekData?.[i] ?? 0) / totalPeek) * 100) : 0
          const color        = OPTION_COLORS[i]

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isEliminated || answered || selected !== null}
              className="animate-option-enter w-full text-left transition-all duration-200 rounded-xl overflow-hidden group"
              style={{
                animationDelay: `${i * 0.07}s`,
                opacity: isEliminated ? 0.2 : 1,
                pointerEvents: isEliminated ? 'none' : undefined,
                transform: isSelected ? 'scale(0.98)' : undefined,
              }}
            >
              <div
                className="flex items-center gap-3 p-3.5"
                style={{
                  background: isSelected
                    ? `linear-gradient(90deg, ${color}30, ${color}10)`
                    : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${isSelected ? color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '0.75rem',
                  transition: 'all 0.15s',
                }}
              >
                {/* Letter badge */}
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                  style={{
                    background: isSelected ? color : `${color}20`,
                    color: isSelected ? '#fff' : color,
                    boxShadow: isSelected ? `0 0 10px ${color}60` : 'none',
                  }}
                >
                  {LABELS[i]}
                </div>

                {/* Text */}
                <span
                  className="flex-1 text-sm font-semibold"
                  style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.85)' }}
                >
                  {option}
                </span>

                {/* Arrow on hover */}
                {!answered && !isSelected && (
                  <span className="text-gray-600 group-hover:text-gray-400 text-xs transition-colors">›</span>
                )}
                {isSelected && <span style={{ color }}>✓</span>}
              </div>

              {/* Peek bar */}
              {peekData && !isEliminated && (
                <div className="flex items-center gap-2 mt-1 px-1">
                  <div className="flex-1 h-0.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${peekPct}%`, background: color }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{peekPct}%</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
