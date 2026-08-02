import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Usar apenas em API routes (server-side) — nunca expor ao browser
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Cliente com a chave anônima, usado em rotas de API para chamadas de auth
// (signIn/signUp) — sem persistir sessão no servidor, o token volta na
// resposta e quem persiste é o browser client.
export function createAuthClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
