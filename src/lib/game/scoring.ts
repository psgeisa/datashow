import type { ScoreResult } from '@/types/game'

const BASE_POINTS = 100
const MAX_SPEED_BONUS = 50
const WRONG_PENALTY = 25

export function calculatePoints(params: {
  is_correct: boolean
  time_taken_ms: number
  timer_limit_ms: number
  current_score: number
  current_combo: number
  current_multiplier: number
  double_active?: boolean
}): ScoreResult {
  const { is_correct, time_taken_ms, timer_limit_ms, current_score, current_combo, current_multiplier, double_active } = params
  const breakdown: string[] = []

  if (!is_correct) {
    const penalty = current_combo > 0 ? WRONG_PENALTY : 0
    breakdown.push('Errou 💀 — combo perdido')
    if (penalty) breakdown.push(`Penalidade: -${penalty}`)
    return {
      points: -penalty,
      new_score: Math.max(0, current_score - penalty),
      new_combo: 0,
      new_multiplier: 1.0,
      breakdown,
    }
  }

  // Bônus de velocidade: linear, mais rápido = mais pontos
  const speed_ratio = Math.max(0, 1 - time_taken_ms / timer_limit_ms)
  const speed_bonus = Math.floor(speed_ratio * MAX_SPEED_BONUS)
  breakdown.push(`Base: +${BASE_POINTS}`)
  if (speed_bonus > 0) breakdown.push(`Velocidade: +${speed_bonus}`)

  const new_combo = current_combo + 1
  const new_multiplier = getMultiplier(new_combo)

  let total = BASE_POINTS + speed_bonus
  total = Math.floor(total * new_multiplier)

  if (new_multiplier > 1) {
    breakdown.push(`Combo ${new_combo}x (×${new_multiplier}) 🔥`)
  }

  // Streak bonus a cada 3 acertos consecutivos
  if (new_combo % 3 === 0) {
    const streak_bonus = 50
    total += streak_bonus
    breakdown.push(`Streak ${new_combo}! +${streak_bonus} ⚡`)
  }

  // Habilidade Double Down do ML Engineer
  if (double_active) {
    total = total * 2
    breakdown.push(`Double Down! ×2 🤖`)
  }

  return {
    points: total,
    new_score: current_score + total,
    new_combo,
    new_multiplier,
    breakdown,
  }
}

function getMultiplier(combo: number): number {
  if (combo >= 7) return 3.0
  if (combo >= 5) return 2.5
  if (combo >= 3) return 2.0
  if (combo >= 2) return 1.5
  return 1.0
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
