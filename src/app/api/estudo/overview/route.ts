import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CHOOSABLE_SUPERTOPICS } from '@/types/deucert'

const MIN_ANSWERS_FOR_LEVEL = 5

function levelFor(total: number, accuracy: number): string {
  if (total < MIN_ANSWERS_FOR_LEVEL) return 'Sem dados'
  if (accuracy < 0.5) return 'Iniciante'
  if (accuracy < 0.8) return 'Intermediário'
  return 'Avançado'
}

export async function GET(req: NextRequest) {
  const player_id = req.nextUrl.searchParams.get('player_id')
  if (!player_id) {
    return NextResponse.json({ error: 'player_id é obrigatório' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data: rows, error } = await supabase
    .from('deucert_reforco_answers')
    .select('super_topic, is_correct')
    .eq('player_id', player_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const bySuperTopic = new Map<string, { correct: number; total: number }>()
  for (const r of rows ?? []) {
    const cur = bySuperTopic.get(r.super_topic) ?? { correct: 0, total: 0 }
    cur.total += 1
    if (r.is_correct) cur.correct += 1
    bySuperTopic.set(r.super_topic, cur)
  }

  const topics = CHOOSABLE_SUPERTOPICS.map(meta => {
    const { correct, total } = bySuperTopic.get(meta.id) ?? { correct: 0, total: 0 }
    const accuracy = total ? correct / total : 0
    return {
      id: meta.id,
      name: meta.name,
      emoji: meta.emoji,
      correct,
      total,
      accuracy,
      level: levelFor(total, accuracy),
    }
  })

  return NextResponse.json({ topics })
}
