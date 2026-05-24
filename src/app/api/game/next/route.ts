import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { room_id, session_id } = await req.json()
  const supabase = createServiceClient()

  const { data: room } = await supabase.from('rooms').select().eq('id', room_id).single()

  if (!room) return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 })
  if (room.host_session_id !== session_id) return NextResponse.json({ error: 'Apenas o host pode avançar' }, { status: 403 })

  const next_round = room.current_round + 1
  const is_finished = next_round > room.total_rounds

  if (is_finished) {
    await supabase.from('rooms').update({ status: 'finished' }).eq('id', room_id)
    return NextResponse.json({ finished: true })
  }

  // Buscar próxima pergunta (sem correct_index)
  const { data: gq } = await supabase
    .from('game_questions')
    .select('questions(id, category, difficulty, type, question, options, explanation, code_snippet, meme_context)')
    .eq('room_id', room_id)
    .eq('round_number', next_round)
    .single()

  if (!gq) return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })

  const q = gq.questions as any
  const question = {
    id: q.id, category: q.category, difficulty: q.difficulty,
    type: q.type, question: q.question, options: q.options,
    explanation: q.explanation, code_snippet: q.code_snippet, meme_context: q.meme_context,
  }

  await supabase.from('rooms').update({
    current_round: next_round,
    round_started_at: new Date().toISOString(),
  }).eq('id', room_id)

  return NextResponse.json({ finished: false, round: next_round, question })
}
