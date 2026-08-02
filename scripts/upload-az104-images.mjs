#!/usr/bin/env node
// ============================================================
// Faz upload das imagens extraídas do az104.docx (exhibits) para
// o bucket "question-images" do Supabase Storage, e grava um
// mapa { arquivo_original: public_url } em scratch/az104-image-urls.json
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs'
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
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const BUCKET = 'question-images'
const MEDIA_DIR = process.argv[2]
const OUT_FILE = process.argv[3]

if (!MEDIA_DIR || !OUT_FILE) {
  console.error('Uso: node scripts/upload-az104-images.mjs <pasta_com_imagens> <arquivo_saida.json>')
  process.exit(1)
}

const MIME = { '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif' }

async function main() {
  const files = readdirSync(MEDIA_DIR).filter(f => /\.(jpe?g|png|gif)$/i.test(f))
  console.log(`📂  ${files.length} imagens encontradas em ${MEDIA_DIR}`)

  const map = {}
  let ok = 0, fail = 0

  for (const file of files) {
    const ext = file.slice(file.lastIndexOf('.')).toLowerCase()
    const destPath = `az104/${file}`
    const buffer = readFileSync(join(MEDIA_DIR, file))

    const { error } = await supabase.storage.from(BUCKET).upload(destPath, buffer, {
      contentType: MIME[ext] || 'application/octet-stream',
      upsert: true,
    })

    if (error) {
      console.warn(`  ❌  ${file}: ${error.message}`)
      fail++
      continue
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(destPath)
    map[file] = pub.publicUrl
    ok++
  }

  writeFileSync(OUT_FILE, JSON.stringify(map, null, 2), 'utf-8')
  console.log(`\n✅  ${ok} enviadas, ${fail} falharam. Mapa salvo em ${OUT_FILE}`)
}

main()
