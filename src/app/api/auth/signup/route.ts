import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password, nickname } = await req.json()

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 })
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })
  }
  if (!nickname?.trim()) {
    return NextResponse.json({ error: 'Escolha um nickname.' }, { status: 400 })
  }

  const { data, error } = await createAuthClient().auth.signUp({
    email: String(email).trim().toLowerCase(),
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.user) {
    const { error: profileError } = await createServiceClient()
      .from('user_profiles')
      .insert({ user_id: data.user.id, nickname: String(nickname).trim().slice(0, 20) })
    if (profileError) console.error('[auth/signup] falha ao gravar user_profiles:', profileError.message)
  }

  return NextResponse.json({ user: data.user, session: data.session })
}
