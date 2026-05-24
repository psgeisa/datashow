'use client'
import { getCharacter } from '@/lib/game/characters'
import type { Player } from '@/types/game'

interface Props {
  player: Player
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
  answered?: boolean
}

export function PlayerAvatar({ player, showScore = true, size = 'md', answered = false }: Props) {
  const char = getCharacter(player.character_slug)

  const sizes = { sm: 'w-10 h-10 text-xl', md: 'w-14 h-14 text-2xl', lg: 'w-20 h-20 text-4xl' }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center relative transition-all duration-200`}
        style={{
          background: `${char?.color ?? '#888'}20`,
          border: `2px solid ${char?.color ?? '#888'}`,
          opacity: answered ? 0.6 : 1,
        }}
      >
        {char?.emoji ?? '❓'}
        {answered && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs">
            ✓
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs font-semibold truncate max-w-16">{player.nickname}</p>
        {showScore && (
          <p className="text-xs font-black" style={{ color: char?.color ?? '#888' }}>
            {player.score.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}
