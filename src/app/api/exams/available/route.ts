import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CHOOSABLE_SUPERTOPICS } from '@/types/deucert'
import { OFFICIAL_EXAMS } from '@/lib/deucert/exams'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const counts = await Promise.all(
      CHOOSABLE_SUPERTOPICS.map(async ({ id }) => {
        const { count, error } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('super_topic', id)
        return { id, count: error ? 0 : (count ?? 0) }
      })
    )
    const countMap = new Map<string, number>(counts.map(c => [c.id, c.count]))
    const officialKeys = new Set(OFFICIAL_EXAMS.map(e => e.super_topic))

    const official = OFFICIAL_EXAMS
      .map(exam => ({ ...exam, available_count: countMap.get(exam.super_topic) ?? 0 }))
      .filter(exam => exam.available_count > 0)

    const generic = CHOOSABLE_SUPERTOPICS
      .filter(st => !officialKeys.has(st.id) && (countMap.get(st.id) ?? 0) > 0)
      .map(st => ({ id: st.id, name: st.name, emoji: st.emoji, description: st.description, count: countMap.get(st.id) ?? 0 }))

    return NextResponse.json({ official, generic })
  } catch (err) {
    console.error('[exams/available] erro:', err)
    return NextResponse.json({ official: [], generic: [], error: true }, { status: 500 })
  }
}
