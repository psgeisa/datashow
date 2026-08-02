# KnowHow 📊

Quiz show multiplayer de Data Science — SQL, Python, ML, BI, Azure, Databricks e mais.

## Setup rápido

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
# Preencher com suas credenciais do Supabase e Gemini
```

### 3. Criar banco no Supabase
- Acesse https://supabase.com → seu projeto → SQL Editor
- Cole e execute o conteúdo de `supabase/schema.sql`

### 4. Rodar localmente
```bash
npm run dev
```

Acesse http://localhost:3000

## Credenciais necessárias

| Variável | Onde obter |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.com → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase.com → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → Project Settings → API |
| `GEMINI_API_KEY` | aistudio.google.com → Get API Key |

## Estrutura do projeto

```
src/
  app/              # Páginas e API routes (Next.js App Router)
  components/game/  # Componentes do jogo
  hooks/            # useRoom (realtime)
  lib/              # Supabase, scoring, personagens, perguntas, IA
  types/            # TypeScript types
supabase/
  schema.sql        # Schema completo do banco
```

## Deploy

```bash
# Vercel (recomendado)
npx vercel --prod

# Configurar variáveis de ambiente no painel da Vercel
```
