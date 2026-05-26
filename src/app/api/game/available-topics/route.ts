import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CHOOSABLE_SUPERTOPICS } from '@/types/game'

// Mínimo de questões para um supertópico aparecer na seleção
const MIN_QUESTIONS = 10

export async function GET() {
  try {
    const supabase = createServiceClient()

    // 12 contagens paralelas — cada uma é só um COUNT(*) sem dados
    const results = await Promise.all(
      CHOOSABLE_SUPERTOPICS.map(async ({ id }) => {
        const { count, error } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('super_topic', id)
          .eq('is_ai_generated', false)
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
