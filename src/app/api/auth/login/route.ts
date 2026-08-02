import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, createServiceClient } from '@/lib/supabase/server'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 })
  }

  const normalizedEmail = String(email).trim().toLowerCase()
  const db = createServiceClient()
  const now = new Date()

  const { data: attempt } = await db
    .from('login_attempts')
    .select('attempt_count, locked_until')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (attempt?.locked_until && new Date(attempt.locked_until) > now) {
    const remainingMin = Math.ceil((new Date(attempt.locked_until).getTime() - now.getTime()) / 60_000)
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${remainingMin} min.`, locked_until: attempt.locked_until },
      { status: 429 }
    )
  }

  const lockHadExpired = !!attempt?.locked_until && new Date(attempt.locked_until) <= now
  const baseCount = lockHadExpired ? 0 : (attempt?.attempt_count ?? 0)

  const { data, error } = await createAuthClient().auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (error || !data.session) {
    const newCount = baseCount + 1
    const lockedUntil = newCount >= MAX_ATTEMPTS
      ? new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString()
      : null

    await db.from('login_attempts').upsert({
      email: normalizedEmail,
      attempt_count: newCount,
      locked_until: lockedUntil,
      last_attempt_at: now.toISOString(),
    })

    return NextResponse.json(
      {
        error: lockedUntil
          ? `Muitas tentativas erradas. Login bloqueado por ${LOCK_MINUTES} min.`
          : `Email ou senha incorretos. ${MAX_ATTEMPTS - newCount} tentativa(s) restante(s).`,
        locked_until: lockedUntil,
      },
      { status: lockedUntil ? 429 : 401 }
    )
  }

  await db.from('login_attempts').delete().eq('email', normalizedEmail)

  return NextResponse.json({ session: data.session, user: data.user })
}
