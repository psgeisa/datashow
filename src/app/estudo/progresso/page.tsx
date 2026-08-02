'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/deucert/ThemeToggle'
import { useIdentity } from '@/lib/identity/useIdentity'

interface TopicOverview {
  id: string
  name: string
  emoji: string
  correct: number
  total: number
  accuracy: number
  level: string
}

const LEVEL_COLOR: Record<string, string> = {
  'Sem dados': 'var(--text-muted)',
  'Iniciante': '#ef4444',
  'Intermediário': '#f59e0b',
  'Avançado': '#22c55e',
}

export default function EstudoProgresso() {
  const router = useRouter()
  const { playerId, ready } = useIdentity('deucert')
  const [topics, setTopics] = useState<TopicOverview[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!ready) return
    fetch(`/api/estudo/overview?player_id=${playerId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(true); return }
        setTopics(data.topics ?? [])
      })
      .catch(() => setError(true))
  }, [ready, playerId])

  return (
    <main className="min-h-screen estudo-bg-dots p-4 pt-12 flex flex-col items-center">
      <ThemeToggle />
      <button onClick={() => router.push('/estudo')} className="self-start mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        ← Voltar
      </button>

      <h1 className="text-3xl font-black mb-1">📈 Meu Progresso</h1>
      <p className="mb-8 text-center max-w-md" style={{ color: 'var(--text-muted)' }}>
        Seu nível em cada supertópico, com base nas respostas do reforço e dos simulados
      </p>

      {topics === null && !error && <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>}
      {error && <p className="text-red-400">Não foi possível carregar seu progresso.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {topics?.map(topic => (
          <div
            key={topic.id}
            className="text-left p-5 rounded-2xl border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">{topic.emoji}</span>
              <span
                className="text-xs px-2 py-1 rounded-full font-bold"
                style={{ background: `${LEVEL_COLOR[topic.level]}18`, color: LEVEL_COLOR[topic.level] }}
              >
                {topic.level}
              </span>
            </div>
            <p className="font-black text-lg">{topic.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {topic.total > 0
                ? `${topic.correct}/${topic.total} corretas · ${Math.round(topic.accuracy * 100)}%`
                : 'Nenhuma resposta ainda'}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}
