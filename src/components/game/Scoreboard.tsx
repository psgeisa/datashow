'use client'
import { getCharacter } from '@/lib/game/characters'
import type { Player } from '@/types/game'

interface Props {
  players: Player[]
  myPlayerId?: string
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#888888']
const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣']

export function Scoreboard({ players, myPlayerId }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-2 w-full">
      {sorted.map((player, i) => {
        const char = getCharacter(player.character_slug)
        const isMe = player.id === myPlayerId

        return (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isMe ? 'border-2' : 'border border-white/10'
            }`}
            style={{
              background: isMe ? `${char?.color ?? '#00d4ff'}10` : 'rgba(255,255,255,0.03)',
              borderColor: isMe ? (char?.color ?? '#00d4ff') : undefined,
            }}
          >
            <span className="text-xl w-8 text-center">{RANK_EMOJIS[i] ?? `${i+1}`}</span>
            <span className="text-xl">{char?.emoji ?? '❓'}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold truncate ${isMe ? 'text-white' : 'text-gray-300'}`}>
                {player.nickname}{isMe && ' (você)'}
              </p>
              {player.combo >= 2 && (
                <p className="text-xs text-orange-400">🔥 Combo {player.combo}x</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-black text-lg" style={{ color: RANK_COLORS[i] ?? '#888' }}>
                {player.score.toLocaleString()}
              </p>
              {player.multiplier > 1 && (
                <p className="text-xs text-gray-400">×{player.multiplier}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
