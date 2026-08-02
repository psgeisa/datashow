import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { shuffleOptionsForQuestion } from '@/lib/game/shuffleOptions'
import { findOfficialExam, buildGenericExamConfig, GENERIC_QUESTION_COUNT_OPTIONS } from '@/lib/deucert/exams'
import { CHOOSABLE_SUPERTOPICS } from '@/types/deucert'

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function POST(req: NextRequest) {
  const { exam_key, question_count } = await req.json()
  if (!exam_key) return NextResponse.json({ error: 'exam_key é obrigatório' }, { status: 400 })

  const official = findOfficialExam(exam_key)
  let config = official
  let superTopic = official?.super_topic ?? exam_key

  if (!config) {
    const meta = CHOOSABLE_SUPERTOPICS.find(st => st.id === exam_key)
    if (!meta) return NextResponse.json({ error: `Simulado "${exam_key}" não encontrado` }, { status: 404 })
    const count = GENERIC_QUESTION_COUNT_OPTIONS.includes(question_count) ? question_count : GENERIC_QUESTION_COUNT_OPTIONS[0]
    config = buildGenericExamConfig(meta.id, meta.name, count)
    superTopic = meta.id
  }

  const supabase = createServiceClient()
  const { data: pool, error } = await supabase
    .from('questions')
    .select('id, category, super_topic, topic, difficulty, type, question, options, correct_index, code_snippet, meme_context, image_urls')
    .eq('super_topic', superTopic)

  if (error || !pool || pool.length === 0) {
    return NextResponse.json({ error: `Sem perguntas para "${superTopic}"` }, { status: 404 })
  }

  const actualCount = Math.min(config.questionCount, pool.length)
  const selected = fisherYates(pool).slice(0, actualCount)

  // Se teve que reduzir a quantidade (banco menor que o alvo), recalcula o
  // tempo pro genérico (proporcional). Pro oficial mantém o tempo real da
  // prova — a duração da prova não muda por causa do tamanho do banco.
  const timeLimitMinutes = config.official
    ? config.timeLimitMinutes
    : Math.ceil(actualCount * 1.5)

  const questions = selected.map(q => {
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

  return NextResponse.json({
    questions,
    exam: {
      key: config.key,
      super_topic: superTopic,
      name: config.name,
      official: config.official,
      passingScore: config.passingScore,
      disclaimer: config.disclaimer,
      questionCount: actualCount,
      requestedQuestionCount: config.questionCount,
      timeLimitMinutes,
    },
  })
}
