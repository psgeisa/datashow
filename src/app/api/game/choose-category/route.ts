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
  // Accepts super_topic (new) — category kept for backward compat
  const { room_id, session_id, super_topic, category, phase } = await req.json()
  const supabase = createServiceClient()

  const { data: room } = await supabase.from('rooms').select().eq('id', room_id).single()
  if (!room) return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 })
  if (room.host_session_id !== session_id) return NextResponse.json({ error: 'Apenas o host pode iniciar a fase' }, { status: 403 })

  const phaseNum: number = phase ?? room.current_phase ?? 1
  const roundStart = (phaseNum - 1) * 10 + 1
  const roundEnd   = phaseNum * 10

  // ── IDs já usados neste jogo (outras fases) — não podem repetir ──────────
  const { data: usedGQs } = await supabase
    .from('game_questions')
    .select('question_id')
    .eq('room_id', room_id)
    .lt('round_number', roundStart)   // fases anteriores a esta

  const usedIds = new Set((usedGQs ?? []).map((gq: any) => gq.question_id))

  // ── Buscar pool filtrando por super_topic (ou category como fallback) ──────
  let pool: any[] | null = null

  if (super_topic) {
    const { data } = await supabase
      .from('questions')
      .select('id, category, difficulty, type, question, options, correct_index, explanation, code_snippet, meme_context')
      .eq('super_topic', super_topic)
      .order('times_used', { ascending: true })
      .limit(120)
    pool = data
  }

  // Fallback para categoria
  if ((!pool || pool.length < 10) && category) {
    const { data } = await supabase
      .from('questions')
      .select('id, category, difficulty, type, question, options, correct_index, explanation, code_snippet, meme_context')
      .eq('category', category)
      .order('times_used', { ascending: true })
      .limit(120)
    pool = data
  }

  if (!pool || pool.length === 0) {
    return NextResponse.json({ error: `Sem perguntas para o supertópico "${super_topic ?? category}"` }, { status: 500 })
  }

  // ── Separar frescas (não usadas neste jogo) das já usadas ─────────────────
  const fresh = pool.filter(q => !usedIds.has(q.id))
  const reuse = pool.filter(q =>  usedIds.has(q.id))

  // Prioriza frescas; completa com reuso se necessário
  const candidates = fresh.length >= 10 ? fresh : [...fresh, ...reuse]

  // Fisher-Yates shuffle nos candidatos
  const shuffled = [...candidates]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const selected = shuffled.slice(0, Math.min(10, shuffled.length))

  if (selected.length < 10) {
    return NextResponse.json({ error: `Perguntas insuficientes para o supertópico "${super_topic ?? category}" (${selected.length} disponíveis, precisam 10)` }, { status: 500 })
  }

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

  // ── Calcular timer dinâmico para a 1ª pergunta ────────────────────────────
  const first = selected[0]
  const timer_seconds = dynamicTimer(first.question, first.code_snippet, room.timer_seconds)

  // ── Atualizar sala ────────────────────────────────────────────────────────
  await supabase.from('rooms').update({
    current_round: roundStart,
    current_phase: phaseNum,
    game_phase: 'playing',
    round_started_at: new Date().toISOString(),
    timer_seconds,
  }).eq('id', room_id)

  // ── Aplicar shuffle determinístico nas opções ─────────────────────────────
  const { options: shuffledOpts } = shuffleOptionsForQuestion(first.id, first.options, first.correct_index)

  return NextResponse.json({
    success: true,
    round: roundStart,
    timer_seconds,
    question: {
      id: first.id,
      category: first.category,
      super_topic: first.super_topic,
      difficulty: first.difficulty,
      type: first.type,
      question: first.question,
      options: shuffledOpts,  // shuffled — correct_index NOT included
      explanation: first.explanation,
      code_snippet: first.code_snippet,
      meme_context: first.meme_context,
    },
  })
}
