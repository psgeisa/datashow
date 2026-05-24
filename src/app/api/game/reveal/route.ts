import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { room_id, round_number, session_id } = await req.json()
  const supabase = createServiceClient()

  // Verificar host
  const { data: room } = await supabase.from('rooms').select().eq('id', room_id).single()
  if (!room || room.host_session_id !== session_id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  // Buscar pergunta com correct_index
  const { data: gq } = await supabase
    .from('game_questions')
    .select('questions(correct_index, explanation)')
    .eq('room_id', room_id)
    .eq('round_number', round_number)
    .single()

  const correct_index = (gq?.questions as any)?.correct_index ?? 0
  const explanation = (gq?.questions as any)?.explanation ?? ''

  // Buscar respostas desta rodada com dados dos jogadores
  const { data: answers } = await supabase
    .from('answers')
    .select('player_id, is_correct, points_earned, combo_at_time')
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
      player_id: p.id,
      nickname: p.nickname,
      character_slug: p.character_slug,
      is_correct: answer?.is_correct ?? false,
      points_earned: answer?.points_earned ?? 0,
      new_score: p.score,
      combo: answer?.combo_at_time ?? 0,
      multiplier: p.multiplier,
    }
  })

  return NextResponse.json({ round_number, correct_index, explanation, player_results })
}
