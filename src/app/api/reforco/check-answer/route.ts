import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { shuffleOptionsForQuestion } from '@/lib/game/shuffleOptions'

export async function POST(req: NextRequest) {
  const { player_id, question_id, super_topic, selected_index } = await req.json()

  if (!player_id || !question_id) {
    return NextResponse.json({ error: 'player_id e question_id são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: q } = await supabase
    .from('questions')
    .select('id, options, correct_index, explanation, topic, difficulty, super_topic')
    .eq('id', question_id)
    .single()

  if (!q) return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })

  const { correct_index: shuffledCorrectIndex } = shuffleOptionsForQuestion(q.id, q.options, q.correct_index)
  const is_correct = typeof selected_index === 'number' && selected_index === shuffledCorrectIndex

  const { error: insertError } = await supabase.from('deucert_reforco_answers').insert({
    player_id,
    question_id: q.id,
    super_topic: super_topic ?? q.super_topic,
    topic: q.topic,
    difficulty: q.difficulty,
    source: 'reforco',
    selected_index: selected_index ?? null,
    is_correct,
  })

  if (insertError) {
    console.error('[reforco/check-answer] falha ao gravar log:', insertError.message)
  }

  return NextResponse.json({
    is_correct,
    correct_index: shuffledCorrectIndex,
    explanation: q.explanation ?? null,
  })
}
