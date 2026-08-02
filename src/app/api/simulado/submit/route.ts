import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { shuffleOptionsForQuestion } from '@/lib/game/shuffleOptions'
import { findOfficialExam } from '@/lib/deucert/exams'

// Cada pergunta já foi checada (e logada) em tempo real durante o simulado,
// via /api/simulado/check (respondida) ou /api/simulado/reveal (invalidada).
// Esta rota só fecha a tentativa: loga como erro qualquer pergunta que
// ficou sem nenhuma das duas coisas (tempo esgotou antes de chegar nela) e
// grava o resumo final em deucert_simulado_results.
export async function POST(req: NextRequest) {
  const {
    player_id, exam_key, question_count, correct_count, time_taken_seconds, unresolved_question_ids,
  } = await req.json() as {
    player_id: string
    exam_key: string
    question_count: number
    correct_count: number
    time_taken_seconds?: number
    unresolved_question_ids?: string[]
  }

  if (!player_id || !exam_key || typeof question_count !== 'number' || typeof correct_count !== 'number') {
    return NextResponse.json({ error: 'player_id, exam_key, question_count e correct_count são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const unresolvedIds = unresolved_question_ids ?? []
  const unresolvedReview: { question_id: string; correct_index: number; explanation: string | null }[] = []

  if (unresolvedIds.length > 0) {
    const { data: questionRows } = await supabase
      .from('questions')
      .select('id, options, correct_index, explanation, topic, difficulty, super_topic')
      .in('id', unresolvedIds)

    const logRows = (questionRows ?? []).map(q => {
      const { correct_index: shuffledCorrectIndex } = shuffleOptionsForQuestion(q.id, q.options, q.correct_index)
      unresolvedReview.push({ question_id: q.id, correct_index: shuffledCorrectIndex, explanation: q.explanation ?? null })
      return {
        player_id,
        question_id: q.id,
        super_topic: q.super_topic,
        topic: q.topic,
        difficulty: q.difficulty,
        source: 'simulado',
        selected_index: null,
        is_correct: false,
      }
    })

    if (logRows.length > 0) {
      const { error: logError } = await supabase.from('deucert_reforco_answers').insert(logRows)
      if (logError) console.error('[simulado/submit] falha ao gravar não respondidas:', logError.message)
    }
  }

  const official = findOfficialExam(exam_key)
  const passingScore = official?.passingScore ?? 70
  const scoreScale = official ? 1000 : 100
  const scoreRaw = Math.round((correct_count / question_count) * scoreScale)
  const passed = scoreRaw >= passingScore

  const { error: resultError } = await supabase.from('deucert_simulado_results').insert({
    player_id,
    exam_key,
    question_count,
    correct_count,
    score_raw: scoreRaw,
    passing_score: passingScore,
    passed,
    time_taken_seconds: time_taken_seconds ?? null,
  })
  if (resultError) console.error('[simulado/submit] falha ao gravar resultado:', resultError.message)

  return NextResponse.json({
    question_count,
    correct_count,
    score_raw: scoreRaw,
    passing_score: passingScore,
    score_scale: scoreScale,
    passed,
    unresolved_review: unresolvedReview,
  })
}
