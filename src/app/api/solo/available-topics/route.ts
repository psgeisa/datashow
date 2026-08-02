import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CHOOSABLE_SUPERTOPICS } from '@/types/game'

// Treino solo não exige 6 perguntas por fase como o multiplayer — qualquer
// tópico com pelo menos 1 pergunta já é treinável.
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
    console.error('[solo/available-topics] erro:', err)
    // Ao contrário do multiplayer, aqui não fazemos fallback pra "todos os
    // tópicos" — isso listaria tópicos sem nenhuma pergunta de verdade.
    return NextResponse.json({ topics: [], error: true }, { status: 500 })
  }
}
