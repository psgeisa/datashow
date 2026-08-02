import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const solo_player_id = req.nextUrl.searchParams.get('solo_player_id')
  const super_topic = req.nextUrl.searchParams.get('super_topic')

  if (!solo_player_id || !super_topic) {
    return NextResponse.json({ error: 'solo_player_id e super_topic são obrigatórios' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: rows, error } = await supabase
    .from('solo_answers')
    .select('topic, is_correct')
    .eq('solo_player_id', solo_player_id)
    .eq('super_topic', super_topic)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const byTopic = new Map<string, { correct: number; total: number }>()
  let overallCorrect = 0
  let untrackedTotal = 0
  let untrackedCorrect = 0

  for (const r of rows ?? []) {
    if (r.is_correct) overallCorrect++
    if (!r.topic) {
      untrackedTotal++
      if (r.is_correct) untrackedCorrect++
      continue
    }
    const cur = byTopic.get(r.topic) ?? { correct: 0, total: 0 }
    cur.total += 1
    if (r.is_correct) cur.correct += 1
    byTopic.set(r.topic, cur)
  }

  const topics = [...byTopic.entries()]
    .map(([topic, { correct, total }]) => ({ topic, correct, total, accuracy: correct / total }))
    .sort((a, b) => a.accuracy - b.accuracy) // pior primeiro

  const total = rows?.length ?? 0

  return NextResponse.json({
    super_topic,
    overall: { correct: overallCorrect, total, accuracy: total ? overallCorrect / total : 0 },
    topics,
    has_topic_data: topics.length > 0,
    untracked: untrackedTotal > 0 ? { correct: untrackedCorrect, total: untrackedTotal } : null,
  })
}
