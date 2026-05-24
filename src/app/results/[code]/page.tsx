'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCharacter } from '@/lib/game/characters'
import type { Player } from '@/types/game'

const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣']
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#888']
const FUN_TITLES = [
  'O Grande Oráculo dos Dados',
  'Senior Data Scientist Honorário',
  'Mestre do DataFrame',
  'Aprendiz Dedicado do Excel',
]

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loaded, setLoaded] = useState(false)
  const playerId = typeof window !== 'undefined' ? sessionStorage.getItem('player_id') ?? '' : ''
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: room } = await supabase.from('rooms').select().eq('code', code).single()
      if (!room) return
      const { data: p } = await supabase.from('players').select().eq('room_id', room.id).order('score', { ascending: false })
      setPlayers(p ?? [])
      setLoaded(true)
    }
    load()
  }, [code])

  const myRank = players.findIndex(p => p.id === playerId)

  if (!loaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p className="text-gray-400 animate-pulse">Carregando resultados...</p>
      </div>
    )
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center p-6 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      <div className="w-full max-w-md mt-8 space-y-6 animate-slide-up">
        {/* Título */}
        <div className="text-center">
          <div className="text-6xl mb-3">{RANK_EMOJIS[myRank] ?? '🎮'}</div>
          <h2 className="text-3xl font-black">Fim de Jogo!</h2>
          {myRank >= 0 && (
            <p className="text-gray-400 mt-1 text-sm italic">"{FUN_TITLES[myRank]}"</p>
          )}
        </div>

        {/* Pódio */}
        <div className="space-y-3">
          {players.map((player, i) => {
            const char = getCharacter(player.character_slug)
            const isMe = player.id === playerId

            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  isMe ? 'border-2 scale-[1.02]' : 'border border-white/10'
                }`}
                style={{
                  background: isMe ? `${char?.color ?? '#00d4ff'}10` : 'rgba(255,255,255,0.03)',
                  borderColor: isMe ? char?.color ?? '#00d4ff' : undefined,
                }}
              >
                <span className="text-2xl w-8 text-center">{RANK_EMOJIS[i] ?? `${i+1}`}</span>
                <span className="text-3xl">{char?.emoji ?? '❓'}</span>
                <div className="flex-1">
                  <p className="font-bold">{player.nickname}{isMe ? ' (você)' : ''}</p>
                  <p className="text-xs text-gray-500">{char?.name ?? ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black" style={{ color: RANK_COLORS[i] ?? '#888' }}>
                    {player.score.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">pts</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={() => router.push('/lobby?mode=create')}
            className="w-full py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)' }}
          >
            🚀 Nova Partida
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-2xl font-bold text-gray-400 border border-white/10 hover:bg-white/5 transition-all"
          >
            ← Voltar ao Início
          </button>
        </div>
      </div>
    </main>
  )
}
