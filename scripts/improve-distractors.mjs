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

// ── Chamar Gemini via REST (v1) — sem depender do SDK ─────────────────────
// O SDK @google/generative-ai v0.21 usa v1beta que não suporta modelos novos.
// Usando fetch direto na v1 funciona com gemini-1.5-flash no free tier.
async function callGeminiRaw(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    const err  = new Error(`HTTP ${res.status}: ${body}`)
    err.status = res.status
    err.body   = body
    throw err
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ── Fix escapes LaTeX inválidos em JSON gerado por AI ─────────────────────
// Igual ao seed-questions.mjs — necessário para ler os arquivos corretamente
function fixJsonEscapes(text) {
  const VALID_ESCAPE = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'])
  let result = ''
  let i = 0
  while (i < text.length) {
    if (text[i] !== '\\') { result += text[i++]; continue }
    const next = text[i + 1]
    if (next === undefined) { result += '\\\\'; i++; continue }
    if (next === 'u') {
      const hex = text.substring(i + 2, i + 6)
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        result += text.substring(i, i + 6); i += 6
      } else {
        result += '\\\\'; i++
      }
    } else if (VALID_ESCAPE.has(next)) {
      result += text[i] + text[i + 1]; i += 2
    } else {
      result += '\\\\'; i++
    }
  }
  return result
}

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

  // Retry até 3x com espera automática em caso de 429
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const text      = await callGeminiRaw(prompt)
      const jsonMatch = text.match(/\[[\s\S]*?\]/)
      if (!jsonMatch) throw new Error('JSON não encontrado na resposta do Gemini')
      return JSON.parse(jsonMatch[0])
    } catch (err) {
      const is429   = err?.status === 429 || err?.message?.includes('429')
      const retryMs = (() => {
        const match = (err?.body ?? err?.message ?? '').match(/"retryDelay"\s*:\s*"([0-9.]+)s"/)
        return match ? Math.ceil(parseFloat(match[1])) * 1000 + 2000 : 65000
      })()
      if (is429 && attempt < 3) {
        const waitSec = Math.round(retryMs / 1000)
        process.stdout.write(`\n    ⏳  Rate limit — aguardando ${waitSec}s (tentativa ${attempt}/3)...`)
        await new Promise(r => setTimeout(r, retryMs))
        process.stdout.write('\r    ↺  Tentando novamente...                              ')
      } else {
        throw err
      }
    }
  }
}

// ── Processar um arquivo JSON ─────────────────────────────────────────────
async function processFile(filePath, fileName) {
  const rawText   = readFileSync(filePath, 'utf-8')
  const fixedText = fixJsonEscapes(rawText)
  const questions = JSON.parse(fixedText)

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
