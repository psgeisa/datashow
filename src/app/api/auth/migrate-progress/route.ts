import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getUserIdFromRequest } from '@/lib/supabase/server'

// Repointing: solo_player_id / deucert player_id são só TEXT, então "mover
// progresso pro Supabase" é trocar esse texto pelo user.id da conta — todo
// o histórico anônimo (inclusive de sessões antigas, em qualquer
// dispositivo) passa a contar pra conta a partir daqui.
export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { solo_player_id, deucert_player_id } = await req.json() as {
    solo_player_id?: string
    deucert_player_id?: string
  }

  const db = createServiceClient()

  if (solo_player_id && solo_player_id !== userId) {
    await db.from('solo_answers').update({ solo_player_id: userId }).eq('solo_player_id', solo_player_id)
    await db.from('solo_game_sessions').update({ solo_player_id: userId, user_id: userId }).eq('solo_player_id', solo_player_id)
  }

  if (deucert_player_id && deucert_player_id !== userId) {
    await db.from('deucert_reforco_answers').update({ player_id: userId }).eq('player_id', deucert_player_id)
    await db.from('deucert_simulado_results').update({ player_id: userId }).eq('player_id', deucert_player_id)
  }

  return NextResponse.json({ migrated: true })
}
