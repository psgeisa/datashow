import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CHOOSABLE_SUPERTOPICS } from '@/types/deucert'

const MIN_QUESTIONS = 1

export async function GET() {
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

    const topics = results.filter(r => r.count >= MIN_QUESTIONS)

    return NextResponse.json({ topics })
  } catch (err) {
    console.error('[reforco/available-topics] erro:', err)
    return NextResponse.json({ topics: [], error: true }, { status: 500 })
  }
}
