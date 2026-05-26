import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CHOOSABLE_SUPERTOPICS } from '@/types/game'

// Mínimo de questões — mesma lógica do choose-category (exige >= 10)
const MIN_QUESTIONS = 10

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Usa a MESMA lógica do choose-category: filtra só por super_topic,
    // sem filtrar is_ai_generated (para contar exatamente o que será usado)
    const results = await Promise.all(
      CHOOSABLE_SUPERTOPICS.map(async ({ id }) => {
        const { count, error } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('super_topic', id)
        return { id, count: error ? 0 : (count ?? 0) }
      })
    )

    const available = results
      .filter(r => r.count >= MIN_QUESTIONS)
      .map(r => r.id)

    return NextResponse.json({ available })
  } catch (err) {
    console.error('[available-topics] erro:', err)
    // Em caso de erro, retorna todos para não bloquear o jogo
    return NextResponse.json({ available: CHOOSABLE_SUPERTOPICS.map(s => s.id) })
  }
}
