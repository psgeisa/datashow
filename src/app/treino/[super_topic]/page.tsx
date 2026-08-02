'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CHOOSABLE_SUPERTOPICS } from '@/types/game'
import type { SoloQuestion, SoloAnswerResult, SoloStats } from '@/types/solo'
import { useIdentity } from '@/lib/identity/useIdentity'
import { authFetch } from '@/lib/supabase/authFetch'
import { SoloQuestionCard } from '@/components/solo/SoloQuestionCard'
import { TopicAccuracyChart } from '@/components/solo/TopicAccuracyChart'

type Phase = 'loading' | 'answering' | 'revealed' | 'round-complete' | 'all-clear' | 'error' | 'ended'

interface State {
  phase: Phase
  allQuestions: SoloQuestion[]
  roundQueue: SoloQuestion[]
  currentIndex: number
  wrongThisRound: SoloQuestion[]
  roundNumber: number
  lastResult: SoloAnswerResult | null
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

export default function TreinoSessao() {
  const params = useParams()
  const router = useRouter()
  const superTopic = params.super_topic as string
  const meta = CHOOSABLE_SUPERTOPICS.find(s => s.id === superTopic)

  const [state, setState] = useState<State>(INITIAL)
  const [stats, setStats] = useState<SoloStats | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [finalScore, setFinalScore] = useState<number | null>(null)

  const { playerId: soloPlayerId, ready } = useIdentity('solo')
  const submittingRef = useRef(false)
  const sessionStartedAtRef = useRef(Date.now())
  const endedRef = useRef(false)

  // Carrega a bateria completa uma única vez
  useEffect(() => {
    if (!ready) return
    fetch(`/api/solo/start-battery?super_topic=${superTopic}`)
      .then(r => r.json())
      .then(data => {
        if (data.error || !data.questions?.length) {
          setState(s => ({ ...s, phase: 'error' }))
          return
        }
        setState(s => ({
          ...s,
          allQuestions: data.questions,
          roundQueue: fisherYates(data.questions),
          phase: 'answering',
        }))
        setSessionStats({ correct: 0, total: 0 })
        setFinalScore(null)
        sessionStartedAtRef.current = Date.now()
        endedRef.current = false
      })
      .catch(() => setState(s => ({ ...s, phase: 'error' })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superTopic, ready])

  function fetchStats() {
    fetch(`/api/solo/stats?solo_player_id=${soloPlayerId}&super_topic=${superTopic}`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
  }

  async function endSession(endedEarly: boolean) {
    if (endedRef.current) return
    endedRef.current = true
    try {
      const res = await authFetch('/api/solo/end-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solo_player_id: soloPlayerId,
          super_topic: superTopic,
          questions_answered: sessionStats.total,
          correct_count: sessionStats.correct,
          ended_early: endedEarly,
          started_at: new Date(sessionStartedAtRef.current).toISOString(),
        }),
      })
      const data = await res.json()
      setFinalScore(data.score ?? sessionStats.correct * 100)
    } catch {
      setFinalScore(sessionStats.correct * 100)
    }
    if (endedEarly) setState(s => ({ ...s, phase: 'ended' }))
  }

  function handleEndEarly() {
    if (confirm('Encerrar o treino agora? Sua pontuação é calculada com o que você já respondeu.')) {
      endSession(true)
    }
  }

  useEffect(() => {
    if (state.phase === 'all-clear') {
      fetchStats()
      endSession(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  async function handleAnswer(index: number) {
    // Trava contra clique duplo/rápido enquanto o check-answer ainda está em
    // andamento — sem isso, dois cliques antes da resposta chegar registram
    // duas respostas para a mesma pergunta (ref via useRef porque precisa
    // ser síncrono, um useState só atualizaria depois do próximo render).
    if (state.phase !== 'answering' || submittingRef.current) return
    const current = state.roundQueue[state.currentIndex]
    if (!current) return

    submittingRef.current = true
    try {
      const res = await fetch('/api/solo/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solo_player_id: soloPlayerId,
          question_id: current.id,
          super_topic: superTopic,
          selected_index: index,
        }),
      })
      const result: SoloAnswerResult = await res.json()

      setState(s => ({
        ...s,
        phase: 'revealed',
        selectedIndex: index,
        lastResult: result,
        wrongThisRound: result.is_correct ? s.wrongThisRound : [...s.wrongThisRound, current],
        roundStats: {
          correct: s.roundStats.correct + (result.is_correct ? 1 : 0),
          total: s.roundStats.total + 1,
        },
      }))
      setSessionStats(s => ({
        correct: s.correct + (result.is_correct ? 1 : 0),
        total: s.total + 1,
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
      return {
        ...s,
        phase: s.wrongThisRound.length === 0 ? 'all-clear' : 'round-complete',
        selectedIndex: null,
        lastResult: null,
      }
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
    setSessionStats({ correct: 0, total: 0 })
    setFinalScore(null)
    sessionStartedAtRef.current = Date.now()
    endedRef.current = false
  }

  function toggleStats() {
    if (!showStats) fetchStats()
    setShowStats(s => !s)
  }

  const currentQuestion = state.roundQueue[state.currentIndex]

  return (
    <main
      className="min-h-screen flex flex-col items-center p-4 pt-10 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -5%, #1a0f3e 0%, #0d0d1f 40%, #050510 100%)' }}
    >
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between mb-6">
        <button onClick={() => router.push('/treino')} className="text-gray-400 hover:text-white transition-colors text-sm">
          ← Trocar tópico
        </button>
        <span className="text-sm font-bold">{meta?.emoji} {meta?.name ?? superTopic}</span>
        <div className="flex items-center gap-3">
          {(state.phase === 'answering' || state.phase === 'revealed' || state.phase === 'round-complete') && (
            <>
              <button onClick={toggleStats} className="text-sm text-gray-400 hover:text-white transition-colors">
                📊 Progresso
              </button>
              <button onClick={handleEndEarly} className="text-sm text-gray-400 hover:text-red-400 transition-colors">
                Encerrar
              </button>
            </>
          )}
        </div>
      </div>

      {showStats && stats && (
        <div className="w-full max-w-2xl mx-auto mb-6 p-4 rounded-2xl border border-white/10 bg-white/5">
          <TopicAccuracyChart stats={stats} />
        </div>
      )}

      {state.phase === 'loading' && <p className="text-gray-400">Carregando perguntas...</p>}

      {state.phase === 'error' && (
        <div className="text-center space-y-4">
          <p className="text-red-400">Não foi possível carregar as perguntas deste tópico.</p>
          <button onClick={() => router.push('/treino')} className="underline text-gray-400 hover:text-white">
            Voltar para a escolha de tópico
          </button>
        </div>
      )}

      {(state.phase === 'answering' || state.phase === 'revealed') && currentQuestion && (
        <div className="w-full space-y-4">
          <p className="text-center text-sm text-gray-500">
            {state.roundNumber === 1 ? 'Bateria completa' : `Retreino — rodada ${state.roundNumber}`}
            {' · '}
            Pergunta {state.currentIndex + 1} de {state.roundQueue.length}
          </p>
          <SoloQuestionCard
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
          <p className="text-2xl font-black">
            Você acertou {state.roundStats.correct}/{state.roundStats.total}
          </p>
          <p className="text-gray-400">
            {state.wrongThisRound.length} pergunta{state.wrongThisRound.length === 1 ? '' : 's'} para revisar
          </p>
          <button
            onClick={handleRetrain}
            className="w-full py-4 px-6 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)' }}
          >
            Retreinar {state.wrongThisRound.length} questões
          </button>
        </div>
      )}

      {state.phase === 'all-clear' && (
        <div className="text-center space-y-6 w-full max-w-md">
          <div className="text-6xl animate-bounce-in">🎉</div>
          <p className="text-2xl font-black">Rodada perfeita! Zero erros.</p>
          {finalScore !== null && (
            <p className="text-3xl font-black text-cyan-400">{finalScore.toLocaleString()} pts</p>
          )}

          {stats && <TopicAccuracyChart stats={stats} />}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRestart}
              className="w-full py-4 px-6 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)' }}
            >
              🔁 Treinar de novo
            </button>
            <button
              onClick={() => router.push('/treino')}
              className="w-full py-4 px-6 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/10 transition-all"
            >
              Escolher outro tópico
            </button>
          </div>
        </div>
      )}

      {state.phase === 'ended' && (
        <div className="text-center space-y-6 w-full max-w-md">
          <div className="text-6xl">🏁</div>
          <p className="text-2xl font-black">Treino encerrado</p>
          <p className="text-gray-400">
            Você acertou {sessionStats.correct}/{sessionStats.total} pergunta{sessionStats.total === 1 ? '' : 's'}
          </p>
          {finalScore !== null && (
            <p className="text-4xl font-black text-cyan-400">{finalScore.toLocaleString()} pts</p>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/ranking')}
              className="w-full py-4 px-6 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)' }}
            >
              🏆 Ver Classificação Geral
            </button>
            <button
              onClick={() => router.push('/treino')}
              className="w-full py-4 px-6 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/10 transition-all"
            >
              Escolher outro tópico
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
