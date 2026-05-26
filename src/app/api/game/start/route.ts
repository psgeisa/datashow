import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// As questões são gerenciadas via seed script (scripts/seed-questions.mjs)
// e ficam persistidas no Supabase. NÃO deletar/reinserir questões aqui.

export async function POST(req: NextRequest) {
  const { room_code, session_id } = await req.json()
  const supabase = createServiceClient()

  const { data: room } = await supabase
    .from('rooms').select().eq('code', room_code).single()

  if (!room) return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 })
  if (room.host_session_id !== session_id) return NextResponse.json({ error: 'Apenas o host pode iniciar' }, { status: 403 })
  if (room.status !== 'waiting') return NextResponse.json({ error: 'Jogo já iniciado' }, { status: 409 })

  // ── 1. Verificar se há questões no banco ────────────────────────────────
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_ai_generated', false)

  if (!count || count < 10) {
    return NextResponse.json(
      { error: 'Banco de questões vazio. Execute scripts/seed-questions.mjs primeiro.' },
      { status: 500 }
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
    total_phases: room.total_phases ?? 4,
  })
}
