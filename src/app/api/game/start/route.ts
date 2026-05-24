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

  // ── 1. Auto-seed: inserir perguntas locais se o banco estiver vazio ──────
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })

  if (!count || count < 5) {
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

  // ── 2. Buscar pool de perguntas (locais + IA, priorizando menos usadas) ──
  const { data: pool } = await supabase
    .from('questions')
    .select('id, category, difficulty, type, question, options, correct_index, explanation, code_snippet, meme_context')
    .order('times_used', { ascending: true })
    .limit(60) // buscar bastante para embaralhar com variedade

  if (!pool || pool.length < room.total_rounds) {
    return NextResponse.json({ error: 'Perguntas insuficientes no banco' }, { status: 500 })
  }

  // Embaralhar no servidor e selecionar as necessárias
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
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
