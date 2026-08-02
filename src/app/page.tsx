'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket, Gamepad2, Target, BookOpenText, GraduationCap, ArrowRight } from 'lucide-react'
import { getSoloPlayerId } from '@/lib/solo/identity'
import { CHOOSABLE_SUPERTOPICS } from '@/types/game'
import { AuthPanel } from '@/components/auth/AuthPanel'

interface LastActivity {
  has_activity: boolean
  super_topic?: string
  correct?: number
  total?: number
  accuracy?: number
}

export default function Home() {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [code, setCode] = useState('')
  const [lastActivity, setLastActivity] = useState<LastActivity | null>(null)

  const techStack = ['SQL', 'Python', 'ML', 'Estatística', 'Power BI', 'Azure', 'Databricks', 'Data Eng']

  useEffect(() => {
    const id = getSoloPlayerId()
    if (!id) return
    fetch(`/api/solo/last-activity?solo_player_id=${id}`)
      .then(r => r.json())
      .then(setLastActivity)
      .catch(() => {})
  }, [])

  const lastTopicMeta = lastActivity?.has_activity
    ? CHOOSABLE_SUPERTOPICS.find(t => t.id === lastActivity.super_topic)
    : null

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-7xl mb-4 animate-bounce-in">📊</div>
        <h1
          className="text-6xl font-black tracking-tight mb-2"
          style={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          KnowHow
        </h1>
        <p className="text-gray-400 text-lg">
          Treine sozinho. Desafie em grupo.
        </p>
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">✦ Escolha seu modo ✦</p>

      {/* Dois modos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {/* Modo Estudo — gateway pro deuCert */}
        <div
          className="rounded-3xl p-5 border flex flex-col gap-3"
          style={{ background: 'rgba(0,212,255,0.06)', borderColor: 'rgba(0,212,255,0.25)' }}
        >
          <BookOpenText size={36} strokeWidth={1.5} className="text-cyan-400" />
          <div>
            <p className="font-black text-lg">Modo Estudo</p>
            <p className="text-gray-400 text-sm">Simulados cronometrados e reforço por tópico, no deuCert</p>
          </div>
          <button
            onClick={() => router.push('/estudo')}
            className="w-full py-3 px-4 rounded-2xl font-black transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #0066cc)' }}
          >
            <GraduationCap size={20} strokeWidth={2} />
            Estudar sozinho
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Modo Jogo (multiplayer + solo) */}
        <div
          className="rounded-3xl p-5 border flex flex-col gap-3"
          style={{ background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.25)' }}
        >
          <Gamepad2 size={36} strokeWidth={1.5} className="text-purple-400" />
          <div>
            <p className="font-black text-lg">Modo Jogo</p>
            <p className="text-gray-400 text-sm">Crie uma sala, entre com amigos ou jogue sozinho</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => router.push('/lobby?mode=create')}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-2xl font-bold text-xs transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
            >
              <Rocket size={20} strokeWidth={1.75} />
              Criar Sala
            </button>
            <button
              onClick={() => setJoining(j => !j)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-2xl font-bold text-xs border border-white/20 hover:bg-white/10 transition-all duration-200"
            >
              <Gamepad2 size={20} strokeWidth={1.75} />
              Entrar na Sala
            </button>
            <button
              onClick={() => router.push('/treino')}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-2xl font-bold text-xs border border-white/20 hover:bg-white/10 transition-all duration-200"
            >
              <Target size={20} strokeWidth={1.75} />
              Jogar Sozinho
            </button>
          </div>

          {joining && (
            <div className="flex gap-2 animate-slide-up">
              <input
                autoFocus
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onKeyDown={e => e.key === 'Enter' && code.length === 6 && router.push(`/lobby?mode=join&code=${code}`)}
                maxLength={6}
                placeholder="ABC123"
                className="flex-1 py-3 px-3 rounded-2xl bg-white/10 border border-white/20 text-center text-xl font-black font-mono tracking-[0.3em] focus:outline-none focus:border-purple-400 transition-colors"
              />
              <button
                onClick={() => router.push(`/lobby?mode=join&code=${code}`)}
                disabled={code.length !== 6}
                className="px-4 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
              >
                →
              </button>
            </div>
          )}

          {lastActivity?.has_activity && lastTopicMeta && (
            <button
              onClick={() => router.push(`/treino/${lastActivity.super_topic}`)}
              className="w-full text-left py-2.5 px-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
            >
              <p className="text-xs text-gray-400">Continuar</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{lastTopicMeta.emoji} {lastTopicMeta.name}</span>
                <span className="text-xs text-purple-400 font-bold">{Math.round((lastActivity.accuracy ?? 0) * 100)}%</span>
              </div>
            </button>
          )}
        </div>
      </div>

      <AuthPanel />

      {/* Tech tags */}
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mt-10 mb-3">✦ Opções de Temas ✦</p>
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {techStack.map(tech => (
          <span
            key={tech}
            className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-500"
          >
            {tech}
          </span>
        ))}
      </div>
    </main>
  )
}
