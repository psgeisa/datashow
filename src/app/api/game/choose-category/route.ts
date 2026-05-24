import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { room_id, session_id, category, phase } = await req.json()
  const supabase = createServiceClient()

  const { data: room } = await supabase.from('rooms').select().eq('id', room_id).single()
  if (!room) return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 })
  if (room.host_session_id !== session_id) return NextResponse.json({ error: 'Apenas o host pode iniciar a fase' }, { status: 403 })

  const phaseNum: number = phase ?? room.current_phase ?? 1
  const roundStart = (phaseNum - 1) * 10 + 1
  const roundEnd   = phaseNum * 10

  // ── Buscar 10 perguntas da categoria e embaralhar ─────────────────────────
  const { data: pool } = await supabase
    .from('questions')
    .select('id, category, difficulty, type, question, options, correct_index, explanation, code_snippet, meme_context')
    .eq('category', category)
    .order('times_used', { ascending: true })
    .limit(50)

  if (!pool || pool.length < 10) {
    return NextResponse.json({ error: `Perguntas insuficientes na categoria "${category}"` }, { status: 500 })
  }

  // Fisher-Yates
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const selected = shuffled.slice(0, 10)

  // ── Remover perguntas antigas desta fase (re-escolha) ─────────────────────
  await supabase.from('game_questions')
    .delete()
    .eq('room_id', room_id)
    .gte('round_number', roundStart)
    .lte('round_number', roundEnd)

  // ── Inserir perguntas da fase ─────────────────────────────────────────────
  await supabase.from('game_questions').insert(
    selected.map((q, i) => ({
      room_id,
      question_id: q.id,
      round_number: roundStart + i,
    }))
  )

  // ── Incrementar times_used ────────────────────────────────────────────────
  const selectedIds = selected.map(q => q.id)
  await supabase.rpc('increment_questions_used', { question_ids: selectedIds })

  // ── Atualizar sala ────────────────────────────────────────────────────────
  await supabase.from('rooms').update({
    current_round: roundStart,
    current_phase: phaseNum,
    game_phase: 'playing',
    round_started_at: new Date().toISOString(),
  }).eq('id', room_id)

  // ── Retornar 1ª pergunta (sem correct_index) ──────────────────────────────
  const first = selected[0]
  return NextResponse.json({
    success: true,
    round: roundStart,
    question: {
      id: first.id,
      category: first.category,
      difficulty: first.difficulty,
      type: first.type,
      question: first.question,
      options: first.options,
      explanation: first.explanation,
      code_snippet: first.code_snippet,
      meme_context: first.meme_context,
    },
  })
}
