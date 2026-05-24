import { NextRequest, NextResponse } from 'next/server'
import { generateQuestions } from '@/lib/ai/gemini'
import { createServiceClient } from '@/lib/supabase/server'
import type { QuestionCategory } from '@/types/game'

// Rate limit simples em memória (substitua por KV/Redis em produção)
const lastGenAt: Record<string, number> = {}
const COOLDOWN_MS = 30_000 // 30s por categoria

export async function POST(req: NextRequest) {
  const { category, count = 5 } = await req.json() as { category: QuestionCategory; count?: number }

  if (!category) return NextResponse.json({ error: 'Categoria obrigatória' }, { status: 400 })

  const now = Date.now()
  if (lastGenAt[category] && now - lastGenAt[category] < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - lastGenAt[category])) / 1000)
    return NextResponse.json({ error: `Rate limited. Aguarde ${wait}s` }, { status: 429 })
  }

  const questions = await generateQuestions(category, Math.min(count, 10))
  if (!questions.length) {
    return NextResponse.json({ error: 'Geração falhou' }, { status: 500 })
  }

  lastGenAt[category] = now

  // Salvar no banco para cache e reutilização futura
  const supabase = createServiceClient()
  const toInsert = questions.map((q: any) => ({
    category,
    difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
    type: ['multiple_choice', 'code', 'debug', 'meme'].includes(q.type) ? q.type : 'multiple_choice',
    question: String(q.question),
    options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
    correct_index: Number(q.correct_index) ?? 0,
    explanation: q.explanation ?? null,
    code_snippet: q.code_snippet ?? null,
    meme_context: q.meme_context ?? null,
    is_ai_generated: true,
  })).filter(q => q.options.length === 4) // descartar perguntas malformadas

  const { data } = await supabase.from('questions').insert(toInsert).select('id')

  return NextResponse.json({ generated: data?.length ?? 0 })
}
