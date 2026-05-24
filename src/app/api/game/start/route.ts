import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { LOCAL_QUESTIONS } from '@/lib/game/questions'

export async function POST(req: NextRequest) {
  const { room_code, session_id } = await req.json()
  const supabase = createServiceClient()

  const { data: room } = await supabase
    .from('rooms').select().eq('code', room_code).single()

  if (!room) return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 })
  if (room.host_session_id !== session_id) return NextResponse.json({ error: 'Apenas o host pode iniciar' }, { status: 403 })
  if (room.status !== 'waiting') return NextResponse.json({ error: 'Jogo já iniciado' }, { status: 409 })

  // ── 1. Sync perguntas locais: re-seed sempre que o total não bater ──────────
  const { count: manualCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_ai_generated', false)

  if (!manualCount || manualCount !== LOCAL_QUESTIONS.length) {
    await supabase.from('questions').delete().eq('is_ai_generated', false)
    await supabase.from('questions').insert(
      LOCAL_QUESTIONS.map(q => ({
        category: q.category,
        difficulty: q.difficulty,
        type: q.type,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation ?? null,
        code_snippet: q.code_snippet ?? null,
        meme_context: q.meme_context ?? null,
        is_ai_generated: false,
      }))
    )
  }

  // ── 2. Buscar pool amplo e embaralhar aleatoriamente ────────────────────────
  const { data: pool } = await supabase
    .from('questions')
    .select('id, category, difficulty, type, question, options, correct_index, explanation, code_snippet, meme_context')
    .order('times_used', { ascending: true })
    .limit(Math.max(150, room.total_rounds * 5))

  if (!pool || pool.length < room.total_rounds) {
    return NextResponse.json({ error: 'Perguntas insuficientes no banco' }, { status: 500 })
  }

  // Fisher-Yates shuffle para garantir aleatoriedade real
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const selected = shuffled.slice(0, room.total_rounds)

  // ── 3. Registrar quais perguntas serão usadas nesta sala ─────────────────
  const gameQuestions = selected.map((q, i) => ({
    room_id: room.id,
    question_id: q.id,
    round_number: i + 1,
  }))

  await supabase.from('game_questions').insert(gameQuestions)

  // ── 4. Incrementar times_used das perguntas selecionadas ─────────────────
  // Feito de forma individual para compatibilidade com o cliente Supabase
  const selectedIds = selected.map(q => q.id)
  await supabase.rpc('increment_questions_used', { question_ids: selectedIds })

  // ── 5. Atualizar sala para playing ────────────────────────────────────────
  await supabase.from('rooms').update({
    status: 'playing',
    current_round: 1,
    round_started_at: new Date().toISOString(),
  }).eq('id', room.id)

  // ── 6. Retornar primeira pergunta (sem correct_index) ────────────────────
  const first = selected[0]
  return NextResponse.json({
    success: true,
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
