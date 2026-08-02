import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { shuffleOptionsForQuestion } from '@/lib/game/shuffleOptions'

export async function POST(req: NextRequest) {
  const { solo_player_id, question_id, super_topic, selected_index } = await req.json()

  if (!solo_player_id || !question_id) {
    return NextResponse.json({ error: 'solo_player_id e question_id são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: q } = await supabase
    .from('questions')
    .select('id, options, correct_index, explanation, topic, difficulty, super_topic')
    .eq('id', question_id)
    .single()

  if (!q) return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })

  // Mesma rotação determinística aplicada em start-battery, pra achar qual
  // posição embaralhada corresponde à resposta certa.
  const { correct_index: shuffledCorrectIndex } = shuffleOptionsForQuestion(q.id, q.options, q.correct_index)
  const is_correct = typeof selected_index === 'number' && selected_index === shuffledCorrectIndex

  const { error: insertError } = await supabase.from('solo_answers').insert({
    solo_player_id,
    question_id: q.id,
    super_topic: super_topic ?? q.super_topic,
    topic: q.topic,
    difficulty: q.difficulty,
    selected_index: selected_index ?? null,
    is_correct,
  })

  if (insertError) {
    console.error('[solo/check-answer] falha ao gravar log:', insertError.message)
  }

  return NextResponse.json({
    is_correct,
    correct_index: shuffledCorrectIndex,
    explanation: q.explanation ?? null,
  })
}
