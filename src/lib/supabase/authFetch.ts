import { createClient } from '@/lib/supabase/client'

// fetch() que anexa "Authorization: Bearer <access_token>" quando há uma
// sessão Supabase ativa — deixa as rotas de API vincularem a chamada a uma
// conta sem precisar confiar num user_id mandado pelo próprio client.
export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(url, { ...init, headers })
}
