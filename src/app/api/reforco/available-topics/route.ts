import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CHOOSABLE_SUPERTOPICS } from '@/types/deucert'

const MIN_QUESTIONS = 1

export async function GET(req: NextRequest) {
  const player_id = req.nextUrl.searchParams.get('player_id')

  try {
    const supabase = createServiceClient()

    const results = await Promise.all(
      CHOOSABLE_SUPERTOPICS.map(async ({ id }) => {
        const { count, error } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('super_topic', id)
        return { id, count: error ? 0 : (count ?? 0) }
      })
    )

    let topics = results.filter(r => r.count >= MIN_QUESTIONS)

    // Reforço só faz sentido pra quem já tentou o tópico e ainda não
    // zerou os erros — sem player_id (ex.: chamada antiga) mantém o
    // catálogo completo.
    if (player_id) {
      const { data: answers } = await supabase
        .from('deucert_reforco_answers')
        .select('super_topic, is_correct')
        .eq('player_id', player_id)

      const bySuperTopic = new Map<string, { correct: number; total: number }>()
      for (const a of answers ?? []) {
        const cur = bySuperTopic.get(a.super_topic) ?? { correct: 0, total: 0 }
        cur.total += 1
        if (a.is_correct) cur.correct += 1
        bySuperTopic.set(a.super_topic, cur)
      }

      topics = topics.filter(t => {
        const stat = bySuperTopic.get(t.id)
        return !!stat && stat.total > 0 && stat.correct < stat.total
      })
    }

    return NextResponse.json({ topics })
  } catch (err) {
    console.error('[reforco/available-topics] erro:', err)
    return NextResponse.json({ topics: [], error: true }, { status: 500 })
  }
}
