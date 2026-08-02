import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getUserIdFromRequest } from '@/lib/supabase/server'

const POINTS_PER_CORRECT = 100

export async function POST(req: NextRequest) {
  const {
    solo_player_id, super_topic, questions_answered, correct_count, ended_early, started_at,
  } = await req.json() as {
    solo_player_id: string
    super_topic: string
    questions_answered: number
    correct_count: number
    ended_early: boolean
    started_at: string
  }

  if (!solo_player_id || !super_topic || typeof questions_answered !== 'number' || typeof correct_count !== 'number') {
    return NextResponse.json({ error: 'solo_player_id, super_topic, questions_answered e correct_count são obrigatórios' }, { status: 400 })
  }

  const userId = await getUserIdFromRequest(req)
  const score = correct_count * POINTS_PER_CORRECT

  const { error } = await createServiceClient().from('solo_game_sessions').insert({
    solo_player_id,
    user_id: userId,
    super_topic,
    questions_answered,
    correct_count,
    score,
    ended_early: ended_early ?? false,
    started_at: started_at ?? new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ score })
}
