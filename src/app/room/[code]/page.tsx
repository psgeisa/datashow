'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CHARACTERS, getCharacter } from '@/lib/game/characters'
import { warmUpAudio } from '@/lib/audio/context'
import { AvatarSvg } from '@/components/game/AvatarSvg'
import { DEFAULT_AVATAR } from '@/components/game/AvatarCustomizer'
import type { Player, Room } from '@/types/game'

export default function WaitingRoom() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [starting, setStarting] = useState(false)
  const supabase = createClient()

  const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('session_id') ?? '' : ''
  const isHost = room?.host_session_id === sessionId

  useEffect(() => {
    const sub = supabase
      .channel(`waiting-room:${code}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players' }, () => loadData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, ({ new: r }) => {
        const updated = r as Room
        setRoom(updated)
        if (updated.status === 'playing') router.push(`/play/${code}`)
      })
      .subscribe()

    loadData()
    return () => { supabase.removeChannel(sub) }
  }, [code])

  async function loadData() {
    const { data: r } = await supabase.from('rooms').select().eq('code', code).single()
    if (r) setRoom(r)
    if (r?.status === 'playing') { router.push(`/play/${code}`); return }

    const { data: p } = await supabase.from('players').select().eq('room_id', r?.id).order('joined_at')
    setPlayers(p ?? [])
  }

  async function startGame() {
    warmUpAudio()
    setStarting(true)
    const res = await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_code: code, session_id: sessionId }),
    })
    if (!res.ok) setStarting(false)
    // A mudança de status vai triggar o realtime e redirecionar
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center p-6 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      <div className="w-full max-w-md mt-8">
        {/* Código da sala */}
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Código da Sala</p>
          <div
            className="text-6xl font-black font-mono tracking-widest animate-glow"
            style={{ color: '#00d4ff' }}
          >
            {code}
          </div>
          <p className="text-gray-600 text-sm mt-2">Compartilhe com seus amigos</p>
        </div>

        {/* Jogadores */}
        <div className="space-y-3 mb-8">
          {players.map(player => {
            const char   = getCharacter(player.character_slug)
            const config = player.avatar_config ?? DEFAULT_AVATAR
            return (
              <div
                key={player.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 animate-slide-up"
              >
                <div className="w-12 flex items-end justify-center">
                  <AvatarSvg config={config} size={44} />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{player.nickname}</p>
                  <p className="text-sm" style={{ color: char?.color ?? '#888' }}>
                    {char?.name ?? 'Sem habilidade'}
                  </p>
                </div>
                {player.session_id === room?.host_session_id && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-bold">
                    HOST
                  </span>
                )}
              </div>
            )
          })}

          {/* Slots vazios */}
          {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-dashed border-white/10 text-center text-gray-600 text-sm"
            >
              Aguardando jogador {players.length + i + 1}...
            </div>
          ))}
        </div>

        {/* Ações */}
        {isHost ? (
          <button
            onClick={startGame}
            disabled={players.length < 1 || starting}
            className="w-full py-4 rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: !starting ? 'linear-gradient(135deg, #00d4ff, #a855f7)' : 'rgba(255,255,255,0.1)',
            }}
          >
            {starting ? '🎬 Iniciando...' : `🚀 Iniciar Jogo! (${players.length}/4)`}
          </button>
        ) : (
          <div className="text-center">
            <div
              onClick={warmUpAudio}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-gray-400 cursor-pointer select-none"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Aguardando o host iniciar...
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
