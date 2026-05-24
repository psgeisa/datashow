'use client'
import { useEffect, useRef } from 'react'

interface Props {
  timeLeft: number
  totalTime: number
}

function playTick(timeLeft: number) {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Pitch sobe conforme o tempo diminui: 10s → 660Hz, 5s → 880Hz, 3s → 1100Hz
    osc.frequency.value = timeLeft <= 3 ? 1100 : timeLeft <= 5 ? 880 : 660
    osc.type = 'sine'

    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
    osc.onended = () => ctx.close()
  } catch {
    // AudioContext indisponível (ex: SSR) — falha silenciosa
  }
}

export function Timer({ timeLeft, totalTime }: Props) {
  const prevTimeLeft = useRef(timeLeft)

  useEffect(() => {
    // Tocar apenas quando o valor realmente decrementar (evita re-renders duplos)
    if (timeLeft < prevTimeLeft.current && timeLeft <= 10 && timeLeft > 0) {
      playTick(timeLeft)
    }
    prevTimeLeft.current = timeLeft
  }, [timeLeft])

  const percent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0
  const isUrgent = timeLeft <= 10
  const isCritical = timeLeft <= 5

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`text-5xl font-black tabular-nums transition-colors duration-300 ${
          isCritical ? 'text-red-400 animate-pulse' : isUrgent ? 'text-yellow-400' : 'text-white'
        }`}
      >
        {timeLeft}
      </div>
      <div className="w-56 h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{
            width: `${percent}%`,
            background: isCritical
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : isUrgent
              ? 'linear-gradient(90deg, #eab308, #f59e0b)'
              : 'linear-gradient(90deg, #00d4ff, #0080ff)',
          }}
        />
      </div>
    </div>
  )
}
