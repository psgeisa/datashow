import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Usar apenas em API routes (server-side) — nunca expor ao browser
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
