import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { shuffleOptionsForQuestion } from '@/lib/game/shuffleOptions'

/** Returns a timer in seconds based on question length. */
function dynamicTimer(question: string, code_snippet?: string | null, base = 12): number {
  const len = question.length + (code_snippet?.length ?? 0)
  if (len > 200 || code_snippet) return base + 20
  if (len > 100) return base + 10
  return base
}

export async function POST(req: NextRequest) {
  const { room_id, session_id } = await req.json()
  const supabase = createServiceClient()

  const { data: room } = await supabase.from('rooms').select().eq('id', room_id).single()

  if (!room) return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 })
  if (room.host_session_id !== session_id) return NextResponse.json({ error: 'Apenas o host pode avançar' }, { status: 403 })

  const completed_round = room.current_round
  const total_phases    = room.total_phases ?? 4
  const total_rounds    = total_phases * 6

  // ── Fim de jogo ───────────────────────────────────────────────────────────
  if (completed_round >= total_rounds) {
    await supabase.from('rooms').update({ status: 'finished' }).eq('id', room_id)
    return NextResponse.json({ finished: true })
  }

  // ── Fim de fase (toda rodada múltipla de 6) ───────────────────────────────
  if (completed_round > 0 && completed_round % 6 === 0) {
    const completed_phase = Math.ceil(completed_round / 6)

    const phaseStart = (completed_phase - 1) * 6 + 1
    const phaseEnd   = completed_phase * 6

    const { data: answers } = await supabase
      .from('answers')
      .select('player_id, points_earned')
      .eq('room_id', room_id)
      .gte('round_number', phaseStart)
      .lte('round_number', phaseEnd)

    const phaseMap: Record<string, number> = {}
    for (const a of answers ?? []) {
      phaseMap[a.player_id] = (phaseMap[a.player_id] ?? 0) + a.points_earned
    }

    const { data: players } = await supabase
      .from('players').select('id, nickname, score').eq('room_id', room_id)

    const player_scores = (players ?? []).map(p => ({
      player_id:   p.id,
      nickname:    p.nickname,
      phase_score: phaseMap[p.id] ?? 0,
      total_score: p.score,
    })).sort((a, b) => b.phase_score - a.phase_score)

    await supabase.from('rooms').update({ game_phase: 'phase_end' }).eq('id', room_id)

    return NextResponse.json({ phase_end: true, completed_phase, next_phase: completed_phase + 1, player_scores })
  }

  // ── Próxima pergunta ──────────────────────────────────────────────────────
  const next_round = completed_round + 1

  const { data: gq } = await supabase
    .from('game_questions')
    .select('questions(id, category, difficulty, type, question, options, correct_index, explanation, code_snippet, meme_context, image_urls)')
    .eq('room_id', room_id)
    .eq('round_number', next_round)
    .single()

  if (!gq) return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })

  const q = gq.questions as any

  // Dynamic timer
  const timer_seconds = dynamicTimer(q.question, q.code_snippet, room.timer_seconds)

  // Update room
  await supabase.from('rooms').update({
    current_round: next_round,
    round_started_at: new Date().toISOString(),
    timer_seconds,
  }).eq('id', room_id)

  // Apply deterministic shuffle
  const { options: shuffledOpts } = shuffleOptionsForQuestion(q.id, q.options, q.correct_index)

  const question = {
    id: q.id, category: q.category, difficulty: q.difficulty,
    type: q.type, question: q.question, options: shuffledOpts,
    explanation: q.explanation, code_snippet: q.code_snippet, meme_context: q.meme_context,
    image_urls: q.image_urls,
  }

  return NextResponse.json({ finished: false, round: next_round, question, timer_seconds })
}
