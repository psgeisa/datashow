#!/usr/bin/env node
// ============================================================
// Cria o bucket público "question-images" no Supabase Storage,
// usado para hospedar os exhibits (prints) referenciados nas
// perguntas (campo image_urls).
//
// Uso: node scripts/create-images-bucket.mjs
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Variáveis de ambiente ausentes em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const BUCKET = 'question-images'

async function main() {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) {
    console.error('❌  Erro ao listar buckets:', listErr.message)
    process.exit(1)
  }

  const exists = buckets.some(b => b.name === BUCKET)
  if (exists) {
    console.log(`✓  Bucket "${BUCKET}" já existe.`)
    return
  }

  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  })

  if (createErr) {
    console.error('❌  Erro ao criar bucket:', createErr.message)
    process.exit(1)
  }

  console.log(`✅  Bucket "${BUCKET}" criado com sucesso (público).`)
}

main()
