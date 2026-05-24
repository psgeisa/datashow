'use client'

interface Props {
  combo: number
  multiplier: number
}

export function ComboDisplay({ combo, multiplier }: Props) {
  if (combo < 2) return null

  const color =
    combo >= 7 ? '#ff6b35' :
    combo >= 5 ? '#a855f7' :
    combo >= 3 ? '#00d4ff' :
    '#22c55e'

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm animate-bounce-in"
      style={{ background: `${color}20`, border: `1px solid ${color}`, color }}
    >
      <span>🔥</span>
      <span>COMBO {combo}x</span>
      {multiplier > 1 && <span className="text-xs opacity-80">×{multiplier}</span>}
    </div>
  )
}
