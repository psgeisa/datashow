'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CHOOSABLE_SUPERTOPICS } from '@/types/game'
import type { SoloTopicAvailability } from '@/types/solo'

export default function TreinoPicker() {
  const router = useRouter()
  const [topics, setTopics] = useState<SoloTopicAvailability[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/solo/available-topics')
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
    <main
      className="min-h-screen flex flex-col items-center p-4 pt-12 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🎯</div>
        <h1
          className="text-4xl font-black tracking-tight mb-2"
          style={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Treinar Sozinho
        </h1>
        <p className="text-gray-400">Escolha um supertópico para responder todas as perguntas dele</p>
      </div>

      {topics === null && !error && (
        <p className="text-gray-400">Carregando tópicos...</p>
      )}

      {error && (
        <p className="text-red-400">Não foi possível carregar os tópicos disponíveis. Tente recarregar a página.</p>
      )}

      {topics !== null && available.length === 0 && !error && (
        <p className="text-gray-400">Nenhum tópico com perguntas disponível ainda.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {available.map(topic => (
          <button
            key={topic.id}
            onClick={() => router.push(`/treino/${topic.id}`)}
            className="text-left p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            style={{ borderLeft: `4px solid ${topic.color}` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">{topic.emoji}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
                {countById.get(topic.id)} perguntas
              </span>
            </div>
            <p className="font-black text-lg">{topic.name}</p>
            <p className="text-sm text-gray-400">{topic.description}</p>
          </button>
        ))}
      </div>

      <button
        onClick={() => router.push('/')}
        className="mt-10 text-gray-400 hover:text-white transition-colors"
      >
        ← Voltar
      </button>
    </main>
  )
}
