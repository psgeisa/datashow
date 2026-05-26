#!/usr/bin/env node
// ============================================================
// DataShow — Seed Script de Questões
// ============================================================
// Uso:  node scripts/seed-questions.mjs
//
// Pré-requisitos:
//   1. Executar supabase/migration_001_new_questions.sql no Supabase SQL Editor
//   2. Copiar os arquivos JSON de questões para data/questions/
//   3. Ter .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Fix escapes LaTeX inválidos em JSON gerado por AI ─────────────────────
// Processa caracter por caracter para não quebrar escapes já válidos (\\n, \\\\, etc.)
function fixJsonEscapes(text) {
  // Chars válidos após \: ", \, /, b, f, n, r, t, u
  const VALID_ESCAPE = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'])
  let result = ''
  let i = 0
  while (i < text.length) {
    if (text[i] !== '\\') { result += text[i++]; continue }
    const next = text[i + 1]
    if (next === undefined) { result += '\\\\'; i++; continue }
    if (next === 'u') {
      // Verificar se \uXXXX tem 4 hex dígitos
      const hex = text.substring(i + 2, i + 6)
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        result += text.substring(i, i + 6); i += 6
      } else {
        result += '\\\\'; i++ // Escapa o \ mas não avança o u
      }
    } else if (VALID_ESCAPE.has(next)) {
      // Escape válido: copiar os dois chars
      result += text[i] + text[i + 1]; i += 2
    } else {
      // Escape inválido (ex: \m, \s, \%, \{): escapar o backslash
      result += '\\\\'; i++
    }
  }
  return result
}

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

// ── Validar env vars ───────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('\n❌  Variáveis de ambiente ausentes em .env.local:')
  if (!SUPABASE_URL)  console.error('    NEXT_PUBLIC_SUPABASE_URL não encontrada')
  if (!SERVICE_KEY)   console.error('    SUPABASE_SERVICE_ROLE_KEY não encontrada')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
})

// ── Supertópicos válidos ───────────────────────────────────────────────────
const VALID_SUPERTOPICS = new Set([
  'ciencia_de_dados',
  'machine_learning',
  'separacao_validacao_generalizacao',
  'classificacao',
  'clustering',
  'regressao',
  'estatistica',
  'algebra_linear',
  'programacao',
  'metricas_de_validacao',
  'data_preparation',
  'generative_ai',
])

// ── Validar um objeto de questão ───────────────────────────────────────────
function validate(q, fileName, idx) {
  const errors = []
  if (!q.question || typeof q.question !== 'string' || q.question.trim().length < 10)
    errors.push('question text ausente ou muito curta')
  if (!Array.isArray(q.options) || q.options.length !== 4)
    errors.push('options deve ser array de exatamente 4 itens')
  if (typeof q.correct_index !== 'number' || q.correct_index < 0 || q.correct_index > 3)
    errors.push('correct_index deve ser inteiro entre 0 e 3')
  if (!q.super_topic)
    errors.push('super_topic ausente')
  else if (!VALID_SUPERTOPICS.has(q.super_topic))
    errors.push(`super_topic inválido: "${q.super_topic}"`)
  if (!q.difficulty || !['easy', 'medium', 'hard'].includes(q.difficulty))
    errors.push(`difficulty inválida: "${q.difficulty}"`)
  if (q.type && q.type !== 'multiple_choice')
    errors.push(`type deve ser "multiple_choice", encontrado: "${q.type}"`)

  if (errors.length > 0) {
    console.warn(`  ⚠️  [${fileName}][${idx}]: ${errors.join(' | ')}`)
    return false
  }
  return true
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const questionsDir = join(ROOT, 'data', 'questions')

  if (!existsSync(questionsDir)) {
    console.error(`\n❌  Diretório não encontrado: ${questionsDir}`)
    console.error('    Crie data/questions/ e coloque os arquivos JSON lá.')
    process.exit(1)
  }

  const files = readdirSync(questionsDir)
    .filter(f => f.endsWith('.json'))
    .sort()

  if (files.length === 0) {
    console.error('\n❌  Nenhum arquivo .json encontrado em data/questions/')
    console.error('    Copie os arquivos gerados (ex: regressao_easy.json) para lá.')
    process.exit(1)
  }

  console.log(`\n📂  ${files.length} arquivo(s) JSON encontrado(s) em data/questions/\n`)

  // ── Carregar e validar todos os arquivos ─────────────────────────────────
  const allQuestions = []
  let totalSkipped = 0

  for (const file of files) {
    let raw
    try {
      const rawText = readFileSync(join(questionsDir, file), 'utf-8')
      // Fix escapes LaTeX inválidos gerados por AI (ex: \mathbb → \\mathbb)
      // sem quebrar escapes JSON já válidos (\\, \n, \uXXXX, etc.)
      const fixedText = fixJsonEscapes(rawText)
      raw = JSON.parse(fixedText)
    } catch (e) {
      console.warn(`  ❌  ${file}: JSON inválido — ${e.message}`)
      continue
    }

    const items = Array.isArray(raw) ? raw : [raw]
    let validCount = 0

    for (let i = 0; i < items.length; i++) {
      const q = items[i]
      if (!validate(q, file, i)) { totalSkipped++; continue }

      allQuestions.push({
        category:        q.category ?? 'data_science',
        super_topic:     q.super_topic,
        topic:           q.topic ?? null,
        difficulty:      q.difficulty,
        type:            'multiple_choice',
        question:        q.question.trim(),
        options:         q.options,
        correct_index:   q.correct_index,
        explanation:     q.explanation?.trim() ?? null,
        code_snippet:    null,
        meme_context:    null,
        is_ai_generated: false,
        times_used:      0,
      })
      validCount++
    }

    const tag = validCount === items.length ? '✓' : '⚠'
    const skipNote = validCount < items.length ? ` (${items.length - validCount} inválidas)` : ''
    console.log(`  ${tag}  ${file.padEnd(40)} ${String(validCount).padStart(3)} questões${skipNote}`)
  }

  console.log(`\n📊  Total carregado: ${allQuestions.length} válidas, ${totalSkipped} ignoradas\n`)

  if (allQuestions.length === 0) {
    console.error('❌  Nada para inserir. Verifique os arquivos.')
    process.exit(1)
  }

  // ── Resumo por super_topic antes de inserir ───────────────────────────────
  const bySuperTopic = {}
  for (const q of allQuestions) {
    if (!bySuperTopic[q.super_topic]) bySuperTopic[q.super_topic] = { easy: 0, medium: 0, hard: 0 }
    bySuperTopic[q.super_topic][q.difficulty]++
  }

  console.log('📋  Resumo por super_topic:')
  for (const [st, counts] of Object.entries(bySuperTopic)) {
    const total = counts.easy + counts.medium + counts.hard
    const status = total >= 75 ? '✅' : total >= 50 ? '⚠️ ' : '❌'
    console.log(`  ${status}  ${st.padEnd(38)} easy:${String(counts.easy).padStart(2)}  med:${String(counts.medium).padStart(2)}  hard:${String(counts.hard).padStart(2)}  total:${String(total).padStart(3)}`)
  }
  console.log()

  // ── Limpar questões existentes por super_topic (idempotente) ──────────────
  console.log('🗑️   Limpando questões existentes por super_topic...')
  for (const superTopic of Object.keys(bySuperTopic)) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('super_topic', superTopic)
      .eq('is_ai_generated', false)
    if (error) {
      console.warn(`  ⚠️  Erro ao limpar "${superTopic}": ${error.message}`)
    } else {
      console.log(`  ✓  Limpou: ${superTopic}`)
    }
  }
  console.log()

  // ── Detectar capabilities do schema atual ────────────────────────────────
  // (funciona com schema antigo E novo, sem exigir migration prévia)
  let schemaHasTopic = true
  let categoryFallback = null // null = usar 'data_science'; string = usar esse valor

  {
    // Probe: verificar se coluna topic existe
    const { error: probeErr } = await supabase
      .from('questions').select('topic').limit(1)
    if (probeErr && (probeErr.message.includes('topic') || probeErr.message.includes('column'))) {
      schemaHasTopic = false
      console.log('ℹ️   Coluna topic não existe ainda — será omitida neste seed.')
      console.log('    Rode supabase/migration_001_new_questions.sql para ativar o campo topic.\n')
    }

    // Probe: verificar se category constraint ainda aceita 'data_science'
    if (!schemaHasTopic) {
      const { error: catErr } = await supabase.from('questions').insert([{
        category: 'data_science', difficulty: 'easy', type: 'multiple_choice',
        question: '__probe__', options: ['a','b','c','d'], correct_index: 0,
        super_topic: '__probe__', is_ai_generated: false,
      }])
      if (catErr && catErr.message.toLowerCase().includes('category')) {
        categoryFallback = 'ml'
        console.log('ℹ️   Constraint antiga de category detectada — usando "ml" como placeholder.\n')
      } else {
        // Limpar a linha de teste se inseriu
        await supabase.from('questions').delete().eq('question', '__probe__')
      }
    }
  }

  // ── Adaptar payload conforme capabilities detectadas ──────────────────────
  function buildPayload(q) {
    const base = {
      category:        categoryFallback ?? q.category,
      super_topic:     q.super_topic,
      difficulty:      q.difficulty,
      type:            q.type,
      question:        q.question,
      options:         q.options,
      correct_index:   q.correct_index,
      explanation:     q.explanation,
      code_snippet:    q.code_snippet,
      meme_context:    q.meme_context,
      is_ai_generated: q.is_ai_generated,
      times_used:      q.times_used,
    }
    if (schemaHasTopic) base.topic = q.topic
    return base
  }

  // ── Inserir em lotes de 100 ───────────────────────────────────────────────
  const BATCH_SIZE = 100
  let inserted = 0
  let errors = 0

  console.log(`⬆️   Inserindo ${allQuestions.length} questões em lotes de ${BATCH_SIZE}...`)

  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const rawBatch = allQuestions.slice(i, i + BATCH_SIZE)
    const batch = rawBatch.map(buildPayload)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(allQuestions.length / BATCH_SIZE)

    const { error } = await supabase.from('questions').insert(batch)
    if (error) {
      console.error(`  ❌  Lote ${batchNum}/${totalBatches}: ${error.message}`)
      errors += batch.length
    } else {
      inserted += batch.length
      process.stdout.write(`  ✓  ${inserted}/${allQuestions.length} inseridas\r`)
    }
  }

  console.log(`\n\n${'='.repeat(55)}`)
  if (errors === 0) {
    console.log(`✅  SEED CONCLUÍDO — ${inserted} questões inseridas com sucesso!`)
  } else {
    console.log(`⚠️  SEED PARCIAL — ${inserted} inseridas, ${errors} com erro.`)
  }
  console.log('='.repeat(55))

  // ── Verificar contagem final no banco ─────────────────────────────────────
  console.log('\n🔍  Verificação final no Supabase:')
  for (const superTopic of Object.keys(bySuperTopic)) {
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('super_topic', superTopic)
    console.log(`  ${superTopic.padEnd(38)} ${String(count ?? '?').padStart(3)} no banco`)
  }
  console.log()
}

main().catch(err => {
  console.error('\n❌  Erro inesperado:', err.message)
  process.exit(1)
})
