'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [code, setCode] = useState('')

  const techStack = ['SQL', 'Python', 'ML', 'Estatística', 'Power BI', 'Azure', 'Databricks', 'Data Eng']

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="text-7xl mb-4 animate-bounce-in">📊</div>
        <h1
          className="text-6xl font-black tracking-tight mb-2"
          style={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          DataShow
        </h1>
        <p className="text-gray-400 text-lg">
          O quiz show de dados mais caótico do universo
        </p>
      </div>

      {/* Botões de ação */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => router.push('/lobby?mode=create')}
          className="w-full py-4 px-6 rounded-2xl font-black text-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #0066cc)' }}
        >
          🚀 Criar Sala
        </button>

        {!joining ? (
          <button
            onClick={() => setJoining(true)}
            className="w-full py-4 px-6 rounded-2xl font-black text-xl border border-white/20 hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            🎮 Entrar na Sala
          </button>
        ) : (
          <div className="flex gap-2 animate-slide-up">
            <input
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && code.length === 6 && router.push(`/lobby?mode=join&code=${code}`)}
              maxLength={6}
              placeholder="ABC123"
              className="flex-1 py-4 px-4 rounded-2xl bg-white/10 border border-white/20 text-center text-3xl font-black font-mono tracking-[0.3em] focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <button
              onClick={() => router.push(`/lobby?mode=join&code=${code}`)}
              disabled={code.length !== 6}
              className="px-5 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Tech tags */}
      <div className="mt-16 flex flex-wrap gap-2 justify-center max-w-sm">
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
