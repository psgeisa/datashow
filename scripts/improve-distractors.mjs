#!/usr/bin/env node
// ============================================================
// DataShow — Melhoria de Distratores
// ============================================================
// Detecta questões onde a resposta correta é muito mais longa
// que os distratores e usa o Gemini para reescrevê-los.
//
// Uso:  node scripts/improve-distractors.mjs
//
// Após concluir, rode: npm run seed
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Carregar .env.local ────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(ROOT, '.env.local')
  if (!existsSync(envPath)) return
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}
loadEnv()

const GEMINI_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_KEY) {
  console.error('❌  GEMINI_API_KEY não encontrada em .env.local')
  process.exit(1)
}

const genAI  = new GoogleGenerativeAI(GEMINI_KEY)
const model  = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
})

// ── Detectar questão desequilibrada ───────────────────────────────────────
// Flageia quando a resposta correta é ≥50% mais longa que a média dos
// distratores E a diferença absoluta é maior que 20 caracteres.
function needsImprovement(q) {
  const correct     = q.options[q.correct_index] ?? ''
  const distractors = q.options.filter((_, i) => i !== q.correct_index)
  const avgLen      = distractors.reduce((s, d) => s + (d?.length ?? 0), 0) / distractors.length
  return correct.length > avgLen * 1.5 && (correct.length - avgLen) > 20
}

// ── Chamar Gemini para um lote de questões ────────────────────────────────
async function improveDistractors(batch) {
  // batch: [{ localIdx, question, correct, correctLen }]
  const prompt = `Você é especialista em criar questões de quiz equilibradas.

Para cada questão abaixo, reescreva os 3 distratores (alternativas incorretas).

REGRAS:
- Comprimento de cada distrator: entre ${0} e ∞ — mas próximo ao da resposta correta (campo "correctLen")
- Distratores devem ser plausíveis mas errados para quem conhece o assunto
- Mesmo nível de detalhe e estilo da resposta correta
- Sem prefixos (não use "a)", "1.", etc.)
- NÃO repita a resposta correta

Questões:
${JSON.stringify(batch.map(b => ({
  id:         b.localIdx,
  question:   b.question,
  correct:    b.correct,
  correctLen: b.correctLen,
})), null, 2)}

Responda APENAS com JSON puro (sem markdown, sem \`\`\`):
[
  { "id": 0, "distractors": ["dist1", "dist2", "dist3"] }
]`

  const result    = await model.generateContent(prompt)
  const text      = result.response.text()
  const jsonMatch = text.match(/\[[\s\S]*?\]/)
  if (!jsonMatch) throw new Error('JSON não encontrado na resposta do Gemini')
  return JSON.parse(jsonMatch[0])
}

// ── Processar um arquivo JSON ─────────────────────────────────────────────
async function processFile(filePath, fileName) {
  const questions = JSON.parse(readFileSync(filePath, 'utf-8'))

  // Identificar quais precisam de melhoria
  const toImprove = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => needsImprovement(q))

  if (toImprove.length === 0) {
    return { improved: 0, total: questions.length, skipped: 0 }
  }

  const CHUNK_SIZE = 10
  let improved = 0
  let errors   = 0

  for (let start = 0; start < toImprove.length; start += CHUNK_SIZE) {
    const chunk = toImprove.slice(start, start + CHUNK_SIZE)

    const batch = chunk.map((item, ci) => ({
      localIdx:   ci,              // índice dentro do batch (para o Gemini)
      arrayIdx:   item.i,          // índice no array original (para atualizar)
      question:   item.q.question,
      correct:    item.q.options[item.q.correct_index],
      correctLen: item.q.options[item.q.correct_index]?.length ?? 0,
    }))

    try {
      const results = await improveDistractors(batch)

      for (const r of results) {
        const batchItem = batch[r.id]
        if (!batchItem) continue
        if (!Array.isArray(r.distractors) || r.distractors.length !== 3) continue
        if (r.distractors.some(d => !d || d.trim().length === 0)) continue

        // Reconstruir options preservando a resposta correta na posição original
        const q          = questions[batchItem.arrayIdx]
        const newOptions = [...q.options]
        let di           = 0
        for (let oi = 0; oi < 4; oi++) {
          if (oi !== q.correct_index) newOptions[oi] = r.distractors[di++]
        }
        questions[batchItem.arrayIdx] = { ...q, options: newOptions }
        improved++
      }
    } catch (e) {
      console.error(`\n    ⚠️  Erro no lote (${fileName}): ${e.message}`)
      errors += chunk.length
    }

    // Delay entre lotes para respeitar rate limit (~15 RPM free tier)
    if (start + CHUNK_SIZE < toImprove.length) {
      await new Promise(r => setTimeout(r, 4200))
    }
  }

  // Salvar arquivo atualizado
  writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8')
  return { improved, total: questions.length, skipped: errors }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const questionsDir = join(ROOT, 'data', 'questions')
  if (!existsSync(questionsDir)) {
    console.error('\n❌  data/questions/ não encontrado.')
    process.exit(1)
  }

  const files = readdirSync(questionsDir)
    .filter(f => f.endsWith('.json'))
    .sort()

  console.log(`\n🔍  Analisando ${files.length} arquivos...\n`)

  let totalImproved = 0
  let totalSkipped  = 0
  let totalQ        = 0

  for (const file of files) {
    const filePath = join(questionsDir, file)
    process.stdout.write(`  ⏳  ${file.padEnd(42)}`)

    try {
      const { improved, total, skipped } = await processFile(filePath, file)
      totalImproved += improved
      totalSkipped  += skipped
      totalQ        += total

      if (improved > 0) {
        process.stdout.write(`✅  ${improved} melhoradas`)
      } else {
        process.stdout.write(`—  já equilibradas`)
      }
      if (skipped > 0) process.stdout.write(` (${skipped} com erro)`)
      console.log()
    } catch (e) {
      console.log(`❌  ${e.message}`)
    }

    // Pequeno delay entre arquivos
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`\n${'='.repeat(58)}`)
  console.log(`✅  CONCLUÍDO`)
  console.log(`   ${totalImproved} questões melhoradas de ${totalQ} no total`)
  if (totalSkipped > 0) console.log(`   ⚠️  ${totalSkipped} questões com erro (mantidas originais)`)
  console.log(`${'='.repeat(58)}`)
  console.log(`\nPróximo passo → npm run seed\n`)
}

main().catch(err => {
  console.error('\n❌  Erro inesperado:', err.message)
  process.exit(1)
})
