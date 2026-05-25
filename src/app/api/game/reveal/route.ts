import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { shuffleOptionsForQuestion } from '@/lib/game/shuffleOptions'

export async function POST(req: NextRequest) {
  const { room_id, round_number, session_id } = await req.json()
  const supabase = createServiceClient()

  // Verificar host
  const { data: room } = await supabase.from('rooms').select().eq('id', room_id).single()
  if (!room || room.host_session_id !== session_id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  // Buscar pergunta com correct_index (e options para re-aplicar o shuffle)
  const { data: gq } = await supabase
    .from('game_questions')
    .select('questions(id, options, correct_index, explanation)')
    .eq('room_id', room_id)
    .eq('round_number', round_number)
    .single()

  const rawQ = gq?.questions as any
  const rawCorrect: number = rawQ?.correct_index ?? 0
  const explanation: string = rawQ?.explanation ?? ''

  // Apply the same deterministic shuffle to get the index clients see
  const { correct_index } = rawQ
    ? shuffleOptionsForQuestion(rawQ.id, rawQ.options, rawQ.correct_index)
    : { correct_index: rawCorrect }

  // Buscar respostas desta rodada (including selected_index for clown display)
  const { data: answers } = await supabase
    .from('answers')
    .select('player_id, is_correct, points_earned, combo_at_time, selected_index')
    .eq('room_id', room_id)
    .eq('round_number', round_number)

  // Buscar estado atualizado dos jogadores
  const { data: players } = await supabase
    .from('players')
    .select('id, nickname, character_slug, score, combo, multiplier')
    .eq('room_id', room_id)

  const player_results = (players ?? []).map(p => {
    const answer = answers?.find(a => a.player_id === p.id)
    return {
      player_id:      p.id,
      nickname:       p.nickname,
      character_slug: p.character_slug,
      is_correct:     answer?.is_correct ?? false,
      points_earned:  answer?.points_earned ?? 0,
      new_score:      p.score,
      combo:          answer?.combo_at_time ?? 0,
      multiplier:     p.multiplier,
      selected_index: answer?.selected_index ?? null,
    }
  })

  return NextResponse.json({ round_number, correct_index, explanation, player_results })
}
