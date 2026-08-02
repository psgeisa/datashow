'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/deucert/ThemeToggle'
import { ExamQuestionCard, type QuestionOutcome, type QuestionOutcomeStatus } from '@/components/deucert/ExamQuestionCard'
import { ExamProgressStrip } from '@/components/deucert/ExamProgressStrip'
import { useIdentity } from '@/lib/identity/useIdentity'
import { findOfficialExam, buildGenericExamConfig, GENERIC_QUESTION_COUNT_OPTIONS } from '@/lib/deucert/exams'
import { CHOOSABLE_SUPERTOPICS, type PublicQuestion } from '@/types/deucert'

type Phase = 'config' | 'loading' | 'running' | 'submitting' | 'review' | 'error'

interface ExamMeta {
  key: string
  super_topic: string
  name: string
  official: boolean
  passingScore: number
  disclaimer?: string
  questionCount: number
  timeLimitMinutes: number
}

interface StoredAttempt {
  questions: PublicQuestion[]
  examMeta: ExamMeta
  answers: Record<string, number>
  outcomes: Record<string, QuestionOutcome>
  currentIndex: number
  startedAt: number
}

interface SubmitResult {
  question_count: number; correct_count: number; score_raw: number
  passing_score: number; score_scale: number; passed: boolean
  unresolved_review: { question_id: string; correct_index: number; explanation: string | null }[]
}

interface GabaritoItem {
  question_id: string
  status: QuestionOutcomeStatus | 'unanswered'
  correct_index: number
  explanation: string | null
}

function storageKey(examKey: string) {
  return `deucert_simulado_${examKey}`
}

export default function SimuladoSessao() {
  const params = useParams()
  const router = useRouter()
  const examKey = params.exam_key as string

  const [phase, setPhase] = useState<Phase>('loading')
  const [questionCount, setQuestionCount] = useState<number>(GENERIC_QUESTION_COUNT_OPTIONS[0])
  const [questions, setQuestions] = useState<PublicQuestion[]>([])
  const [examMeta, setExamMeta] = useState<ExamMeta | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [outcomes, setOutcomes] = useState<Record<string, QuestionOutcome>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [startedAt, setStartedAt] = useState<number>(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const submittingRef = useRef(false)
  const checkingRef = useRef(false)
  const reviewingRef = useRef(false)
  const submitRef = useRef<() => void>(() => {})
  const handleNextRef = useRef<() => void>(() => {})

  const official = findOfficialExam(examKey)
  const genericMeta = CHOOSABLE_SUPERTOPICS.find(s => s.id === examKey)
  const { playerId, ready } = useIdentity('deucert')

  const submit = useCallback(async (endedEarly = false) => {
    if (submittingRef.current || !examMeta) return
    submittingRef.current = true
    setPhase('submitting')

    const timeTaken = Math.round((Date.now() - startedAt) / 1000)
    const correctCount = Object.values(outcomes).filter(o => o.status === 'correct').length
    const unresolvedIds = questions.filter(q => !outcomes[q.id]).map(q => q.id)

    try {
      const res = await fetch('/api/simulado/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          exam_key: examKey,
          question_count: questions.length,
          correct_count: correctCount,
          time_taken_seconds: timeTaken,
          unresolved_question_ids: unresolvedIds,
          ended_early: endedEarly,
        }),
      })
      const data: SubmitResult = await res.json()
      localStorage.removeItem(storageKey(examKey))
      setResult(data)
      setPhase('review')
    } catch {
      setPhase('error')
    }
  }, [examMeta, questions, outcomes, startedAt, examKey, playerId])

  useEffect(() => { submitRef.current = submit }, [submit])

  // Restaura tentativa em andamento (F5 no meio do simulado) ou entra na tela de config
  useEffect(() => {
    const raw = localStorage.getItem(storageKey(examKey))
    if (raw) {
      try {
        const stored: StoredAttempt = JSON.parse(raw)
        setQuestions(stored.questions)
        setExamMeta(stored.examMeta)
        setAnswers(stored.answers)
        setOutcomes(stored.outcomes ?? {})
        setCurrentIndex(stored.currentIndex)
        setStartedAt(stored.startedAt)
        setPhase('running')
        return
      } catch {
        localStorage.removeItem(storageKey(examKey))
      }
    }
    setPhase('config')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examKey])

  // Cronômetro — recalcula a partir de startedAt (sobrevive a refresh)
  useEffect(() => {
    if (phase !== 'running' || !examMeta) return
    function tick() {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const remaining = examMeta!.timeLimitMinutes * 60 - elapsed
      setRemainingSeconds(Math.max(0, remaining))
      if (remaining <= 0) submitRef.current()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [phase, examMeta, startedAt])

  // Persiste progresso a cada mudança
  useEffect(() => {
    if (phase !== 'running' || !examMeta) return
    const stored: StoredAttempt = { questions, examMeta, answers, outcomes, currentIndex, startedAt }
    localStorage.setItem(storageKey(examKey), JSON.stringify(stored))
  }, [phase, examMeta, questions, answers, outcomes, currentIndex, startedAt, examKey])

  // Enter avança pra próxima pergunta (ou envia, na última)
  useEffect(() => {
    if (phase !== 'running') return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleNextRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [phase])

  async function handleStart() {
    if (!ready) return
    setPhase('loading')
    try {
      const res = await fetch('/api/simulado/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_key: examKey, question_count: questionCount }),
      })
      const data = await res.json()
      if (data.error || !data.questions?.length) {
        setPhase('error')
        return
      }
      setQuestions(data.questions)
      setExamMeta(data.exam)
      setAnswers({})
      setOutcomes({})
      setCurrentIndex(0)
      setStartedAt(Date.now())
      setPhase('running')
    } catch {
      setPhase('error')
    }
  }

  async function handleSelect(index: number) {
    const q = questions[currentIndex]
    if (!q || outcomes[q.id] || checkingRef.current) return
    checkingRef.current = true
    setAnswers(a => ({ ...a, [q.id]: index }))
    try {
      const res = await fetch('/api/simulado/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, question_id: q.id, super_topic: examMeta?.super_topic, selected_index: index }),
      })
      const data = await res.json()
      setOutcomes(o => ({
        ...o,
        [q.id]: { status: data.is_correct ? 'correct' : 'wrong', correct_index: data.correct_index, explanation: data.explanation },
      }))
    } finally {
      checkingRef.current = false
    }
  }

  async function handleReview() {
    const q = questions[currentIndex]
    if (!q || outcomes[q.id] || reviewingRef.current) return
    reviewingRef.current = true
    try {
      const res = await fetch('/api/simulado/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, question_id: q.id, super_topic: examMeta?.super_topic }),
      })
      const data = await res.json()
      setOutcomes(o => ({ ...o, [q.id]: { status: 'invalid', correct_index: data.correct_index, explanation: data.explanation } }))
    } finally {
      reviewingRef.current = false
    }
  }

  function handleNext() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1)
    } else {
      submitRef.current()
    }
  }
  useEffect(() => { handleNextRef.current = handleNext })

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timeLow = remainingSeconds < 300

  const statuses = questions.map(q => outcomes[q.id]?.status ?? null)

  const gabarito: GabaritoItem[] = questions.map(q => {
    const o = outcomes[q.id]
    if (o) return { question_id: q.id, status: o.status, correct_index: o.correct_index, explanation: o.explanation }
    const fromResult = result?.unresolved_review.find(r => r.question_id === q.id)
    return { question_id: q.id, status: 'unanswered', correct_index: fromResult?.correct_index ?? -1, explanation: fromResult?.explanation ?? null }
  })

  const GABARITO_LABEL: Record<GabaritoItem['status'], string> = {
    correct: '✅',
    wrong: '❌',
    invalid: '🚫',
    unanswered: '⬜',
  }

  return (
    <main className="min-h-screen estudo-bg-dots p-4 pt-10 flex flex-col items-center">
      <ThemeToggle />

      {phase === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>}

      {phase === 'config' && (official || genericMeta) && (
        <div className="w-full max-w-xl space-y-6 text-center">
          <button onClick={() => router.push('/estudo/simulados')} className="text-sm" style={{ color: 'var(--text-muted)' }}>
            ← Voltar aos simulados
          </button>
          <h1 className="text-3xl font-black">{official?.name ?? genericMeta?.name}</h1>

          {official ? (
            <p style={{ color: 'var(--text-muted)' }}>
              {official.questionCount} perguntas · {official.timeLimitMinutes} min · nota de corte {official.passingScore}/1000
            </p>
          ) : (
            <div className="space-y-3">
              <p style={{ color: 'var(--text-muted)' }}>Escolha quantas perguntas quer no simulado:</p>
              <div className="flex justify-center gap-3">
                {GENERIC_QUESTION_COUNT_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className="px-5 py-2 rounded-xl border font-bold transition-all"
                    style={
                      questionCount === n
                        ? { borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-soft)' }
                        : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                ~{Math.ceil(questionCount * 1.5)} min · nota de corte 70%
              </p>
            </div>
          )}

          <p className="text-xs leading-relaxed p-3 rounded-xl border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            {official?.disclaimer ?? 'Simulado genérico — não existe uma certificação oficial associada a este tópico. Parâmetros definidos pelo app, não por uma prova real.'}
          </p>

          <button
            onClick={handleStart}
            className="w-full py-4 px-6 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--accent)', color: '#0a0e14' }}
          >
            Iniciar simulado
          </button>
        </div>
      )}

      {phase === 'config' && !official && !genericMeta && (
        <p className="text-red-400">Simulado &quot;{examKey}&quot; não encontrado.</p>
      )}

      {(phase === 'running' || phase === 'submitting') && examMeta && questions[currentIndex] && (
        <div className="w-full space-y-6">
          <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-3">
            <span className="font-bold">{examMeta.name}</span>
            <div className="flex items-center gap-2">
              <span
                className="font-mono font-black text-lg px-3 py-1 rounded-lg"
                style={{ color: timeLow ? '#ef4444' : 'var(--accent)', background: timeLow ? 'rgba(239,68,68,0.1)' : 'var(--accent-soft)' }}
              >
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
              {phase === 'running' && (
                <button
                  onClick={() => {
                    if (confirm('Encerrar o simulado agora? As perguntas não respondidas contam como erradas.')) submit(true)
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:bg-white/5"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  Encerrar
                </button>
              )}
            </div>
          </div>

          <ExamProgressStrip
            total={questions.length}
            currentIndex={currentIndex}
            statuses={statuses}
            onJump={setCurrentIndex}
          />

          <ExamQuestionCard
            question={questions[currentIndex]}
            index={currentIndex}
            total={questions.length}
            selectedIndex={answers[questions[currentIndex].id] ?? null}
            outcome={outcomes[questions[currentIndex].id] ?? null}
            onSelect={handleSelect}
            onReview={handleReview}
            onPrev={handlePrev}
            onNext={handleNext}
            canGoPrev={currentIndex > 0}
            isLast={currentIndex === questions.length - 1}
          />

          {phase === 'submitting' && <p className="text-center" style={{ color: 'var(--text-muted)' }}>Enviando respostas...</p>}
        </div>
      )}

      {phase === 'review' && result && (
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="text-6xl">{result.passed ? '🎉' : '📋'}</div>
            <p className="text-2xl font-black" style={{ color: result.passed ? '#22c55e' : '#ef4444' }}>
              {result.passed ? 'Aprovado' : 'Reprovado'}
            </p>
            <p className="text-lg font-bold">
              {result.score_raw}/{result.score_scale} · {result.correct_count}/{result.question_count} corretas
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nota de corte: {result.passing_score}/{result.score_scale}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => examMeta && router.push(`/estudo/reforco/${examMeta.super_topic}`)}
              className="w-full py-3 px-6 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: 'var(--accent)', color: '#0a0e14' }}
            >
              🎯 Praticar este tópico no reforço
            </button>
            <button
              onClick={() => router.push('/estudo/simulados')}
              className="w-full py-3 px-6 rounded-2xl font-black border transition-all hover:scale-[1.02] active:scale-95"
              style={{ borderColor: 'var(--border)' }}
            >
              Voltar aos simulados
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Gabarito</p>
            {gabarito.map((r, i) => {
              const q = questions.find(qq => qq.id === r.question_id)
              if (!q) return null
              const borderColor = r.status === 'correct' ? 'rgba(34,197,94,0.3)' : r.status === 'unanswered' ? 'var(--border)' : 'rgba(239,68,68,0.3)'
              return (
                <div key={r.question_id} className="rounded-xl p-4 border" style={{ borderColor, background: 'var(--bg-card)' }}>
                  <p className="text-sm font-bold mb-1">{i + 1}. {GABARITO_LABEL[r.status]} {q.question}</p>
                  {r.correct_index >= 0 && (
                    <p className="text-sm mb-1" style={{ color: 'var(--accent)' }}>Correta: {q.options[r.correct_index]}</p>
                  )}
                  {r.explanation && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.explanation}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="text-center space-y-4">
          <p className="text-red-400">Algo deu errado com este simulado.</p>
          <button onClick={() => router.push('/estudo/simulados')} className="underline" style={{ color: 'var(--text-muted)' }}>
            Voltar aos simulados
          </button>
        </div>
      )}
    </main>
  )
}
