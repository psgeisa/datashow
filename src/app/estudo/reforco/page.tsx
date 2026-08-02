'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/deucert/ThemeToggle'
import { CHOOSABLE_SUPERTOPICS, type TopicAvailability } from '@/types/deucert'

export default function ReforcoPicker() {
  const router = useRouter()
  const [topics, setTopics] = useState<TopicAvailability[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/reforco/available-topics')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(true)
        setTopics(data.topics ?? [])
      })
      .catch(() => setError(true))
  }, [])

  const countById = new Map((topics ?? []).map(t => [t.id, t.count]))
  const available = CHOOSABLE_SUPERTOPICS.filter(s => countById.has(s.id))

  return (
    <main className="min-h-screen estudo-bg-dots p-4 pt-12 flex flex-col items-center">
      <ThemeToggle />
      <button onClick={() => router.push('/estudo')} className="self-start mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        ← Voltar
      </button>

      <h1 className="text-3xl font-black mb-1">🎯 Reforço</h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Responda tudo, erros voltam até você acertar</p>

      {topics === null && !error && <p style={{ color: 'var(--text-muted)' }}>Carregando tópicos...</p>}
      {error && <p className="text-red-400">Não foi possível carregar os tópicos disponíveis.</p>}
      {topics !== null && available.length === 0 && !error && (
        <p style={{ color: 'var(--text-muted)' }}>Nenhum tópico com perguntas disponível ainda.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {available.map(topic => (
          <button
            key={topic.id}
            onClick={() => router.push(`/estudo/reforco/${topic.id}`)}
            className="text-left p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">{topic.emoji}</span>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                {countById.get(topic.id)} perguntas
              </span>
            </div>
            <p className="font-black text-lg">{topic.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{topic.description}</p>
          </button>
        ))}
      </div>
    </main>
  )
}
