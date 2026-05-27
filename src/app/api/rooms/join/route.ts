import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  const { code, nickname, character_slug, avatar_config } = await req.json()

  if (!code?.trim() || !nickname?.trim()) {
    return NextResponse.json({ error: 'Código e nickname obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .select()
    .eq('code', code.toUpperCase())
    .single()

  if (roomErr || !room) {
    return NextResponse.json({ error: 'Sala não encontrada' }, { status: 404 })
  }

  if (room.status !== 'waiting') {
    return NextResponse.json({ error: 'Jogo já em andamento' }, { status: 409 })
  }

  const { count } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id)

  if ((count ?? 0) >= 8) {
    return NextResponse.json({ error: 'Sala cheia (máx. 8 jogadores)' }, { status: 409 })
  }

  const session_id = nanoid(21)

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({ room_id: room.id, session_id, nickname: nickname.trim(), character_slug: character_slug ?? null, avatar_config: avatar_config ?? null })
    .select()
    .single()

  if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 })

  return NextResponse.json({ room, player, session_id })
}
