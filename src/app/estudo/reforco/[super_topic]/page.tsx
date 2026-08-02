'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/deucert/ThemeToggle'
import { CHOOSABLE_SUPERTOPICS, type PublicQuestion, type AnswerResult, type TopicStats } from '@/types/deucert'
import { useIdentity } from '@/lib/identity/useIdentity'
import { QuestionCard } from '@/components/deucert/QuestionCard'
import { TopicAccuracyChart } from '@/components/deucert/TopicAccuracyChart'

type Phase = 'loading' | 'answering' | 'revealed' | 'round-complete' | 'all-clear' | 'error'

interface State {
  phase: Phase
  allQuestions: PublicQuestion[]
  roundQueue: PublicQuestion[]
  currentIndex: number
  wrongThisRound: PublicQuestion[]
  roundNumber: number
  lastResult: AnswerResult | null
  selectedIndex: number | null
  roundStats: { correct: number; total: number }
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const INITIAL: State = {
  phase: 'loading',
  allQuestions: [],
  roundQueue: [],
  currentIndex: 0,
  wrongThisRound: [],
  roundNumber: 1,
  lastResult: null,
  selectedIndex: null,
  roundStats: { correct: 0, total: 0 },
}

export default function ReforcoSessao() {
  const params = useParams()
  const router = useRouter()
  const superTopic = params.super_topic as string
  const meta = CHOOSABLE_SUPERTOPICS.find(s => s.id === superTopic)

  const [state, setState] = useState<State>(INITIAL)
  const [stats, setStats] = useState<TopicStats | null>(null)
  const [showStats, setShowStats] = useState(false)
  const submittingRef = useRef(false)
  const { playerId, ready } = useIdentity('deucert')

  useEffect(() => {
    if (!ready) return
    fetch(`/api/reforco/start-battery?super_topic=${superTopic}`)
      .then(r => r.json())
      .then(data => {
        if (data.error || !data.questions?.length) {
          setState(s => ({ ...s, phase: 'error' }))
          return
        }
        setState(s => ({ ...s, allQuestions: data.questions, roundQueue: fisherYates(data.questions), phase: 'answering' }))
      })
      .catch(() => setState(s => ({ ...s, phase: 'error' })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superTopic, ready])

  function fetchStats() {
    fetch(`/api/reforco/stats?player_id=${playerId}&super_topic=${superTopic}`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }

  useEffect(() => {
    if (state.phase === 'all-clear') fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  async function handleAnswer(index: number) {
    if (state.phase !== 'answering' || submittingRef.current) return
    const current = state.roundQueue[state.currentIndex]
    if (!current) return

    submittingRef.current = true
    try {
      const res = await fetch('/api/reforco/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, question_id: current.id, super_topic: superTopic, selected_index: index }),
      })
      const result: AnswerResult = await res.json()
      setState(s => ({
        ...s,
        phase: 'revealed',
        selectedIndex: index,
        lastResult: result,
        wrongThisRound: result.is_correct ? s.wrongThisRound : [...s.wrongThisRound, current],
        roundStats: { correct: s.roundStats.correct + (result.is_correct ? 1 : 0), total: s.roundStats.total + 1 },
      }))
    } finally {
      submittingRef.current = false
    }
  }

  function handleNext() {
    setState(s => {
      const nextIndex = s.currentIndex + 1
      if (nextIndex < s.roundQueue.length) {
        return { ...s, currentIndex: nextIndex, phase: 'answering', selectedIndex: null, lastResult: null }
      }
      return { ...s, phase: s.wrongThisRound.length === 0 ? 'all-clear' : 'round-complete', selectedIndex: null, lastResult: null }
    })
  }

  function handleRetrain() {
    setState(s => ({
      ...s,
      roundQueue: fisherYates(s.wrongThisRound),
      wrongThisRound: [],
      currentIndex: 0,
      roundNumber: s.roundNumber + 1,
      roundStats: { correct: 0, total: 0 },
      phase: 'answering',
      selectedIndex: null,
      lastResult: null,
    }))
  }

  function handleRestart() {
    setState(s => ({
      ...s,
      roundQueue: fisherYates(s.allQuestions),
      wrongThisRound: [],
      currentIndex: 0,
      roundNumber: 1,
      roundStats: { correct: 0, total: 0 },
      phase: 'answering',
      selectedIndex: null,
      lastResult: null,
    }))
  }

  function toggleStats() {
    if (!showStats) fetchStats()
    setShowStats(s => !s)
  }

  const currentQuestion = state.roundQueue[state.currentIndex]

  return (
    <main className="min-h-screen estudo-bg-dots p-4 pt-10 flex flex-col items-center">
      <ThemeToggle />

      <div className="w-full max-w-2xl mx-auto flex items-center justify-between mb-6">
        <button onClick={() => router.push('/estudo/reforco')} className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ← Trocar tópico
        </button>
        <span className="text-sm font-bold">{meta?.emoji} {meta?.name ?? superTopic}</span>
        {(state.phase === 'answering' || state.phase === 'revealed' || state.phase === 'round-complete') && (
          <button onClick={toggleStats} className="text-sm" style={{ color: 'var(--text-muted)' }}>
            📊 Progresso
          </button>
        )}
      </div>

      {showStats && stats && (
        <div className="w-full max-w-2xl mx-auto mb-6 p-4 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <TopicAccuracyChart stats={stats} />
        </div>
      )}

      {state.phase === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Carregando perguntas...</p>}

      {state.phase === 'error' && (
        <div className="text-center space-y-4">
          <p className="text-red-400">Não foi possível carregar as perguntas deste tópico.</p>
          <button onClick={() => router.push('/estudo/reforco')} className="underline" style={{ color: 'var(--text-muted)' }}>
            Voltar para a escolha de tópico
          </button>
        </div>
      )}

      {(state.phase === 'answering' || state.phase === 'revealed') && currentQuestion && (
        <div className="w-full space-y-4">
          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {state.roundNumber === 1 ? 'Bateria completa' : `Retreino — rodada ${state.roundNumber}`}
            {' · '}Pergunta {state.currentIndex + 1} de {state.roundQueue.length}
          </p>
          <QuestionCard
            question={currentQuestion}
            phase={state.phase === 'revealed' ? 'revealed' : 'answering'}
            selectedIndex={state.selectedIndex}
            correctIndex={state.lastResult?.correct_index ?? null}
            explanation={state.lastResult?.explanation ?? null}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        </div>
      )}

      {state.phase === 'round-complete' && (
        <div className="text-center space-y-6 w-full max-w-md">
          <div className="text-6xl">📝</div>
          <p className="text-2xl font-black">Você acertou {state.roundStats.correct}/{state.roundStats.total}</p>
          <p style={{ color: 'var(--text-muted)' }}>
            {state.wrongThisRound.length} pergunta{state.wrongThisRound.length === 1 ? '' : 's'} para revisar
          </p>
          <button
            onClick={handleRetrain}
            className="w-full py-4 px-6 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--accent)', color: '#0a0e14' }}
          >
            Retreinar {state.wrongThisRound.length} questões
          </button>
        </div>
      )}

      {state.phase === 'all-clear' && (
        <div className="text-center space-y-6 w-full max-w-md">
          <div className="text-6xl">🎉</div>
          <p className="text-2xl font-black">Rodada perfeita! Zero erros.</p>
          {stats && <TopicAccuracyChart stats={stats} />}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRestart}
              className="w-full py-4 px-6 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: 'var(--accent)', color: '#0a0e14' }}
            >
              🔁 Treinar de novo
            </button>
            <button
              onClick={() => router.push('/estudo/reforco')}
              className="w-full py-4 px-6 rounded-2xl font-black text-lg border transition-all"
              style={{ borderColor: 'var(--border)' }}
            >
              Escolher outro tópico
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
