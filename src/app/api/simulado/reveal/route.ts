import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { shuffleOptionsForQuestion } from '@/lib/game/shuffleOptions'

// "Revisar" — espiar a resposta ANTES de ter respondido. Só faz sentido
// chamar essa rota quando a pergunta ainda não foi respondida (o front só
// mostra o botão nesse caso). Isso invalida a pergunta: não é nem certo nem
// errado, é "não tentado de verdade" — mas pra fins de pontuação e de
// alimentar o reforço, conta como uma lacuna (is_correct = false).
export async function POST(req: NextRequest) {
  const { player_id, question_id, super_topic } = await req.json()

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

  const { error: insertError } = await supabase.from('deucert_reforco_answers').insert({
    player_id,
    question_id: q.id,
    super_topic: super_topic ?? q.super_topic,
    topic: q.topic,
    difficulty: q.difficulty,
    source: 'simulado_invalid',
    selected_index: null,
    is_correct: false,
  })

  if (insertError) {
    console.error('[simulado/reveal] falha ao gravar log:', insertError.message)
  }

  return NextResponse.json({
    correct_index: shuffledCorrectIndex,
    explanation: q.explanation ?? null,
  })
}
