import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Último supertópico treinado por esse jogador no modo solo, com o acerto
// geral acumulado nele — usado pra mostrar "Continuar: X" na home, sem
// inventar conceito de trilha/capítulo que o app não tem.
export async function GET(req: NextRequest) {
  const solo_player_id = req.nextUrl.searchParams.get('solo_player_id')
  if (!solo_player_id) {
    return NextResponse.json({ error: 'solo_player_id é obrigatório' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: last } = await supabase
    .from('solo_answers')
    .select('super_topic, answered_at')
    .eq('solo_player_id', solo_player_id)
    .order('answered_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!last) {
    return NextResponse.json({ has_activity: false })
  }

  const { data: rows } = await supabase
    .from('solo_answers')
    .select('is_correct')
    .eq('solo_player_id', solo_player_id)
    .eq('super_topic', last.super_topic)

  const total = rows?.length ?? 0
  const correct = rows?.filter(r => r.is_correct).length ?? 0

  return NextResponse.json({
    has_activity: true,
    super_topic: last.super_topic,
    correct,
    total,
    accuracy: total ? correct / total : 0,
  })
}
