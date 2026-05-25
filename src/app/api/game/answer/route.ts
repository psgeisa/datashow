import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculatePoints } from '@/lib/game/scoring'
import { shuffleOptionsForQuestion } from '@/lib/game/shuffleOptions'

export async function POST(req: NextRequest) {
  const { room_id, player_id, round_number, selected_index, time_taken_ms, ability_used } = await req.json()
  const supabase = createServiceClient()

  // Verificar resposta duplicada
  const { data: existing } = await supabase
    .from('answers')
    .select('id')
    .eq('room_id', room_id)
    .eq('player_id', player_id)
    .eq('round_number', round_number)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Já respondeu nesta rodada' }, { status: 409 })

  // Buscar pergunta — nunca exposta ao client
  const { data: gq } = await supabase
    .from('game_questions')
    .select('questions(id, options, correct_index)')
    .eq('room_id', room_id)
    .eq('round_number', round_number)
    .single()

  if (!gq) return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })

  const q = gq.questions as any
  // Apply the same deterministic shuffle as when the question was served to the client
  const { correct_index: shuffledCorrectIndex } = shuffleOptionsForQuestion(q.id, q.options, q.correct_index)

  const is_correct = typeof selected_index === 'number' && selected_index === shuffledCorrectIndex

  // Buscar estado do jogador
  const { data: player } = await supabase
    .from('players')
    .select('score, combo, multiplier, ability_uses')
    .eq('id', player_id)
    .single()

  if (!player) return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 })

  // Verificar uso de habilidade
  if (ability_used && player.ability_uses <= 0) {
    return NextResponse.json({ error: 'Sem usos de habilidade restantes' }, { status: 400 })
  }

  // Buscar timer da sala
  const { data: room } = await supabase
    .from('rooms')
    .select('timer_seconds')
    .eq('id', room_id)
    .single()

  const result = calculatePoints({
    is_correct,
    time_taken_ms: time_taken_ms ?? (room?.timer_seconds ?? 30) * 1000,
    timer_limit_ms: (room?.timer_seconds ?? 30) * 1000,
    current_score: player.score,
    current_combo: player.combo,
    current_multiplier: player.multiplier,
    double_active: ability_used === 'double',
  })

  // Salvar resposta
  await supabase.from('answers').insert({
    room_id, player_id, round_number,
    selected_index: selected_index ?? null,
    is_correct,
    time_taken_ms: time_taken_ms ?? null,
    points_earned: result.points,
    combo_at_time: result.new_combo,
    ability_used: ability_used ?? null,
  })

  // Atualizar jogador (score, combo, multiplier, ability_uses)
  const updateData: any = {
    score: result.new_score,
    combo: result.new_combo,
    multiplier: result.new_multiplier,
  }
  if (ability_used) updateData.ability_uses = player.ability_uses - 1

  await supabase.from('players').update(updateData).eq('id', player_id)

  return NextResponse.json({ is_correct, result })
}
