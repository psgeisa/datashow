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

  // ── 1. Sync perguntas locais ──────────────────────────────────────────────
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

  // ── 2. Buscar 1º jogador (será o chooser da fase 1) ──────────────────────
  const { data: players } = await supabase
    .from('players').select('id, nickname').eq('room_id', room.id).order('joined_at')

  const chooser = players?.[0]
  if (!chooser) return NextResponse.json({ error: 'Nenhum jogador na sala' }, { status: 400 })

  // ── 3. Iniciar jogo em modo de escolha ────────────────────────────────────
  await supabase.from('rooms').update({
    status: 'playing',
    current_round: 0,
    current_phase: 1,
    game_phase: 'choosing',
  }).eq('id', room.id)

  return NextResponse.json({
    success: true,
    chooser: { player_id: chooser.id, nickname: chooser.nickname },
    phase: 1,
    total_phases: room.total_phases ?? 3,
  })
}
