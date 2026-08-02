import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface RankingRow {
  user_id: string
  name: string
  solo_score: number
  group_score: number
  total_score: number
}

export async function GET() {
  const db = createServiceClient()

  const [{ data: soloRows }, { data: groupRows }, { data: profiles }, { data: emails }] = await Promise.all([
    db.from('solo_game_sessions').select('user_id, score').not('user_id', 'is', null),
    db.from('players').select('user_id, score').not('user_id', 'is', null),
    db.from('user_profiles').select('user_id, nickname'),
    db.from('leaderboard_profiles').select('id, email'),
  ])

  const soloMap = new Map<string, number>()
  for (const r of soloRows ?? []) soloMap.set(r.user_id, (soloMap.get(r.user_id) ?? 0) + r.score)

  const groupMap = new Map<string, number>()
  for (const r of groupRows ?? []) {
    if (!r.user_id) continue
    groupMap.set(r.user_id, (groupMap.get(r.user_id) ?? 0) + r.score)
  }

  const nicknameMap = new Map((profiles ?? []).map(p => [p.user_id, p.nickname]))
  const emailMap = new Map((emails ?? []).map(u => [u.id, u.email as string]))

  const userIds = new Set([...soloMap.keys(), ...groupMap.keys()])

  const rows: RankingRow[] = [...userIds].map(user_id => {
    const solo_score = soloMap.get(user_id) ?? 0
    const group_score = groupMap.get(user_id) ?? 0
    const name = nicknameMap.get(user_id) ?? emailMap.get(user_id)?.split('@')[0] ?? 'Jogador'
    return { user_id, name, solo_score, group_score, total_score: solo_score + group_score }
  })

  return NextResponse.json({
    overall: [...rows].sort((a, b) => b.total_score - a.total_score),
    solo: rows.filter(r => r.solo_score > 0).sort((a, b) => b.solo_score - a.solo_score),
    group: rows.filter(r => r.group_score > 0).sort((a, b) => b.group_score - a.group_score),
  })
}
