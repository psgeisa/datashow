'use client'
import { getCharacter } from '@/lib/game/characters'
import { AvatarSvg } from './AvatarSvg'
import { DEFAULT_AVATAR } from './AvatarCustomizer'
import type { Player } from '@/types/game'

interface Props {
  player: Player
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
  answered?: boolean
}

const SVG_SIZES = { sm: 32, md: 44, lg: 60 }
const WRAP_SIZES = { sm: 'w-10 h-16', md: 'w-14 h-[5.25rem]', lg: 'w-20 h-[7.5rem]' }

export function PlayerAvatar({ player, showScore = true, size = 'md', answered = false }: Props) {
  const char = getCharacter(player.character_slug)
  const config = player.avatar_config ?? DEFAULT_AVATAR

  return (
    <div className="flex flex-col items-center gap-1" style={{ opacity: answered ? 0.55 : 1 }}>
      <div className={`${WRAP_SIZES[size]} flex items-end justify-center relative`}>
        <AvatarSvg config={config} size={SVG_SIZES[size]} />
        {answered && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs font-black">
            ✓
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold truncate max-w-16">{player.nickname}</p>
        {showScore && (
          <p className="text-xs font-black" style={{ color: char?.color ?? '#00d4ff' }}>
            {player.score.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}
