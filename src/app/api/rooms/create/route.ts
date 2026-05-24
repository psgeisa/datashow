import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateRoomCode } from '@/lib/game/scoring'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  const { nickname, character_slug } = await req.json()

  if (!nickname?.trim()) {
    return NextResponse.json({ error: 'Nickname obrigatório' }, { status: 400 })
  }

  const session_id = nanoid(21)
  const code = generateRoomCode()
  const supabase = createServiceClient()

  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .insert({ code, host_session_id: session_id, timer_seconds: 12 })
    .select()
    .single()

  if (roomErr) return NextResponse.json({ error: roomErr.message }, { status: 500 })

  const { data: player, error: playerErr } = await supabase
    .from('players')
    .insert({ room_id: room.id, session_id, nickname: nickname.trim(), character_slug: character_slug ?? null })
    .select()
    .single()

  if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 })

  return NextResponse.json({ room, player, session_id })
}
