'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CHARACTERS } from '@/lib/game/characters'
import { AvatarCustomizer, DEFAULT_AVATAR } from '@/components/game/AvatarCustomizer'
import { warmUpAudio } from '@/lib/audio/context'
import { authFetch } from '@/lib/supabase/authFetch'
import type { CharacterSlug, AvatarConfig } from '@/types/game'

function LobbyContent() {
  const router = useRouter()
  const params = useSearchParams()
  const mode = params.get('mode') as 'create' | 'join'
  const codeParam = params.get('code') ?? ''

  const [nickname, setNickname]     = useState('')
  const [code, setCode]             = useState(codeParam)
  const [selectedChar, setSelectedChar] = useState<CharacterSlug | null>(null)
  const [avatar, setAvatar]         = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [soundReady, setSoundReady] = useState(false)

  async function handleSubmit() {
    if (!nickname.trim()) { setError('Insira um nickname'); return }
    if (mode === 'join' && code.length !== 6) { setError('Código inválido'); return }
    warmUpAudio()
    setLoading(true)
    setError('')

    try {
      const endpoint = mode === 'create' ? '/api/rooms/create' : '/api/rooms/join'
      const body = mode === 'create'
        ? { nickname, character_slug: selectedChar, avatar_config: avatar }
        : { code, nickname, character_slug: selectedChar, avatar_config: avatar }

      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro'); setLoading(false); return }

      sessionStorage.setItem('session_id', data.session_id)
      sessionStorage.setItem('player_id', data.player.id)
      sessionStorage.setItem('room_code', data.room.code)

      router.push(`/room/${data.room.code}`)
    } catch {
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      <div className="w-full max-w-md space-y-5 animate-slide-up">
        {/* Título */}
        <div className="text-center">
          <button onClick={() => router.push('/')} className="text-gray-500 text-sm mb-4 hover:text-gray-300 transition-colors">
            ← Voltar
          </button>
          <h2 className="text-3xl font-black">
            {mode === 'create' ? '🚀 Nova Sala' : '🎮 Entrar na Sala'}
          </h2>
        </div>

        {/* Código da sala (join) */}
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

        {/* Avatar */}
        <div
          className="p-4 rounded-2xl border border-white/10"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <label className="text-sm text-gray-400 mb-3 block font-medium">🎨 Seu Personagem</label>
          <AvatarCustomizer value={avatar} onChange={setAvatar} />
        </div>

        {/* Habilidade */}
        <div>
          <label className="text-sm text-gray-400 mb-3 block">⚡ Escolha sua Habilidade</label>
          <div className="grid grid-cols-2 gap-2">
            {CHARACTERS.map(char => (
              <button
                key={char.slug}
                onClick={() => setSelectedChar(char.slug)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] ${
                  selectedChar === char.slug ? 'border-2 scale-[1.02]' : 'border-white/10 hover:border-white/30'
                }`}
                style={selectedChar === char.slug ? {
                  borderColor: char.color,
                  background: `${char.color}15`,
                } : { background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="font-bold text-sm mb-0.5" style={{ color: selectedChar === char.slug ? char.color : 'white' }}>
                  {char.name}
                </div>
                <div
                  className="text-xs px-2 py-0.5 rounded-full inline-block font-medium"
                  style={{ background: `${char.color}18`, color: char.color }}
                >
                  ⚡ {char.ability_name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ativar som */}
        <button
          type="button"
          onClick={() => { warmUpAudio(); setSoundReady(true) }}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-all duration-300"
          style={{
            background: soundReady ? 'rgba(34,197,94,0.15)' : 'rgba(0,212,255,0.08)',
            border: `1px solid ${soundReady ? 'rgba(34,197,94,0.5)' : 'rgba(0,212,255,0.35)'}`,
            color: soundReady ? '#4ade80' : '#00d4ff',
          }}
        >
          {soundReady ? '✅ Som ativado — música e voz prontas!' : '🔊 Toque aqui para ativar som e voz'}
        </button>

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
