'use client'
import { getCharacter } from '@/lib/game/characters'
import type { CharacterSlug } from '@/types/game'

interface Props {
  character_slug: CharacterSlug | null
  uses: number
  onUse: () => void
  disabled?: boolean
}

export function AbilityButton({ character_slug, uses, onUse, disabled }: Props) {
  const char = getCharacter(character_slug)
  if (!char || uses <= 0) return null

  return (
    <button
      onClick={onUse}
      disabled={disabled || uses <= 0}
      className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: `${char.color}20`,
        border: `2px solid ${char.color}`,
        color: char.color,
      }}
    >
      <span>⚡</span>
      <div className="text-left">
        <div>{char.ability_name}</div>
        <div className="text-xs opacity-70">{char.ability_description}</div>
      </div>
      <span className="ml-2 text-xs opacity-60">{uses}x</span>
    </button>
  )
}
