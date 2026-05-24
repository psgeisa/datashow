'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CHARACTERS } from '@/lib/game/characters'
import type { CharacterSlug } from '@/types/game'

function LobbyContent() {
  const router = useRouter()
  const params = useSearchParams()
  const mode = params.get('mode') as 'create' | 'join'
  const codeParam = params.get('code') ?? ''

  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState(codeParam)
  const [selectedChar, setSelectedChar] = useState<CharacterSlug | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!nickname.trim()) { setError('Insira um nickname'); return }
    if (mode === 'join' && code.length !== 6) { setError('Código inválido'); return }
    setLoading(true)
    setError('')

    try {
      const endpoint = mode === 'create' ? '/api/rooms/create' : '/api/rooms/join'
      const body = mode === 'create'
        ? { nickname, character_slug: selectedChar }
        : { code, nickname, character_slug: selectedChar }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro'); setLoading(false); return }

      // Salvar session_id localmente
      sessionStorage.setItem('session_id', data.session_id)
      sessionStorage.setItem('player_id', data.player.id)
      sessionStorage.setItem('room_code', data.room.code)

      router.push(`/room/${data.room.code}`)
    } catch (e) {
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Título */}
        <div className="text-center">
          <button onClick={() => router.push('/')} className="text-gray-500 text-sm mb-4 hover:text-gray-300 transition-colors">
            ← Voltar
          </button>
          <h2 className="text-3xl font-black">
            {mode === 'create' ? '🚀 Nova Sala' : '🎮 Entrar na Sala'}
          </h2>
        </div>

        {/* Código da sala (apenas no modo join) */}
        {mode === 'join' && (
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Código da Sala</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              placeholder="ABC123"
              className="w-full py-4 px-4 rounded-2xl bg-white/10 border border-white/20 text-center text-3xl font-black font-mono tracking-[0.3em] focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        )}

        {/* Nickname */}
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Seu Nickname</label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value.slice(0, 20))}
            placeholder="DataNinja, SQLKing..."
            className="w-full py-4 px-5 rounded-2xl bg-white/10 border border-white/20 text-lg font-bold focus:outline-none focus:border-cyan-400 transition-colors placeholder:text-gray-600"
          />
        </div>

        {/* Seleção de personagem */}
        <div>
          <label className="text-sm text-gray-400 mb-3 block">Escolha seu Personagem</label>
          <div className="grid grid-cols-2 gap-3">
            {CHARACTERS.map(char => (
              <button
                key={char.slug}
                onClick={() => setSelectedChar(char.slug)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] ${
                  selectedChar === char.slug ? 'border-2 scale-[1.02]' : 'border-white/10 hover:border-white/30'
                }`}
                style={selectedChar === char.slug ? {
                  borderColor: char.color,
                  background: `${char.color}15`,
                } : { background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="text-3xl mb-1">{char.emoji}</div>
                <div className="font-bold text-sm" style={{ color: selectedChar === char.slug ? char.color : 'white' }}>
                  {char.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{char.role}</div>
                <div
                  className="text-xs mt-2 px-2 py-1 rounded-full inline-block font-medium"
                  style={{ background: `${char.color}15`, color: char.color }}
                >
                  ⚡ {char.ability_name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !nickname.trim()}
          className="w-full py-4 rounded-2xl font-black text-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)' }}
        >
          {loading ? '⏳ Aguarde...' : mode === 'create' ? '🚀 Criar Sala' : '🎮 Entrar'}
        </button>
      </div>
    </main>
  )
}

export default function LobbyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>}>
      <LobbyContent />
    </Suspense>
  )
}
