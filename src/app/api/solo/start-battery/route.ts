import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { shuffleOptionsForQuestion } from '@/lib/game/shuffleOptions'

export async function GET(req: NextRequest) {
  const super_topic = req.nextUrl.searchParams.get('super_topic')
  if (!super_topic) {
    return NextResponse.json({ error: 'super_topic é obrigatório' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: pool, error } = await supabase
    .from('questions')
    .select('id, category, super_topic, topic, difficulty, type, question, options, correct_index, code_snippet, meme_context, image_urls')
    .eq('super_topic', super_topic)

  if (error || !pool || pool.length === 0) {
    return NextResponse.json({ error: `Sem perguntas para "${super_topic}"` }, { status: 404 })
  }

  // correct_index e explanation ficam de fora deliberadamente — explanation
  // só é revelada pela rota check-answer, depois que a pergunta é respondida.
  const questions = pool.map(q => {
    const { options } = shuffleOptionsForQuestion(q.id, q.options, q.correct_index)
    return {
      id: q.id,
      category: q.category,
      super_topic: q.super_topic,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      question: q.question,
      options,
      code_snippet: q.code_snippet,
      meme_context: q.meme_context,
      image_urls: q.image_urls,
    }
  })

  return NextResponse.json({ questions, total: questions.length })
}
