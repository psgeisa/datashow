'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/deucert/ThemeToggle'

interface OfficialExam {
  key: string
  name: string
  questionCount: number
  timeLimitMinutes: number
  passingScore: number
  available_count: number
}
interface GenericTopic {
  id: string
  name: string
  emoji: string
  description: string
  count: number
}

export default function SimuladosPicker() {
  const router = useRouter()
  const [official, setOfficial] = useState<OfficialExam[] | null>(null)
  const [generic, setGeneric] = useState<GenericTopic[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/exams/available')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(true)
        setOfficial(data.official ?? [])
        setGeneric(data.generic ?? [])
      })
      .catch(() => setError(true))
  }, [])

  return (
    <main className="min-h-screen estudo-bg-dots p-4 pt-12 flex flex-col items-center">
      <ThemeToggle />
      <button onClick={() => router.push('/estudo')} className="self-start mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        ← Voltar
      </button>

      <h1 className="text-3xl font-black mb-1">📝 Simulados</h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Prova cronometrada, sem parar no meio</p>

      {error && <p className="text-red-400">Não foi possível carregar os simulados disponíveis.</p>}

      {official && official.length > 0 && (
        <section className="w-full max-w-2xl mb-10">
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Certificações oficiais</p>
          <div className="space-y-3">
            {official.map(exam => (
              <button
                key={exam.key}
                onClick={() => router.push(`/estudo/simulados/${exam.key}`)}
                className="w-full text-left p-5 rounded-2xl border-2 transition-all hover:scale-[1.01] active:scale-95"
                style={{ borderColor: 'var(--accent)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-lg">{exam.name}</span>
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    PROVA OFICIAL
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {Math.min(exam.questionCount, exam.available_count)} perguntas · {exam.timeLimitMinutes} min · nota de corte {exam.passingScore}/1000
                  {exam.available_count < exam.questionCount && ` (banco tem só ${exam.available_count} hoje)`}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {generic && generic.length > 0 && (
        <section className="w-full max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Simulados genéricos (sem certificação oficial)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {generic.map(topic => (
              <button
                key={topic.id}
                onClick={() => router.push(`/estudo/simulados/${topic.id}`)}
                className="text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{topic.emoji}</span>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                    {topic.count} perguntas
                  </span>
                </div>
                <p className="font-black">{topic.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{topic.description}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
