import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Habilidade "Hipótese" do Data Scientist: elimina 2 alternativas erradas
export async function POST(req: NextRequest) {
  const { room_id, player_id, round_number } = await req.json()
  const supabase = createServiceClient()

  const { data: gq } = await supabase
    .from('game_questions')
    .select('questions(correct_index)')
    .eq('room_id', room_id)
    .eq('round_number', round_number)
    .single()

  const correct_index = (gq?.questions as any)?.correct_index ?? 0

  // Pegar 2 índices errados aleatórios para eliminar
  const wrong = [0, 1, 2, 3].filter(i => i !== correct_index)
  const shuffle = wrong.sort(() => Math.random() - 0.5)
  const eliminated = shuffle.slice(0, 2)

  // Decrementar ability_uses do jogador
  await supabase.rpc('decrement_ability_uses', { p_player_id: player_id })

  return NextResponse.json({ eliminated })
}
