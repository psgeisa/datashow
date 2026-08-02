'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { LogIn, UserPlus, LogOut, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

const MIGRATION_FLAG_PREFIX = 'progress_migrated_'

async function migrateProgress(accessToken: string, userId: string) {
  const flagKey = `${MIGRATION_FLAG_PREFIX}${userId}`
  if (localStorage.getItem(flagKey)) return

  const solo_player_id = localStorage.getItem('datashow_solo_player_id') ?? undefined
  const deucert_player_id = localStorage.getItem('deucert_player_id') ?? undefined
  if (!solo_player_id && !deucert_player_id) {
    localStorage.setItem(flagKey, '1')
    return
  }

  try {
    await fetch('/api/auth/migrate-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ solo_player_id, deucert_player_id }),
    })
    localStorage.setItem(flagKey, '1')
  } catch {
    // sem flag gravada — tenta de novo na próxima vez que a sessão for detectada
  }
}

export function AuthPanel() {
  const [supabase] = useState(() => createClient())
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<string | null>(null)
  const [remainingSec, setRemainingSec] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null)
      setCheckingSession(false)
      if (data.session) migrateProgress(data.session.access_token, data.session.user.id)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
      if (session) migrateProgress(session.access_token, session.user.id)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!lockedUntil) return
    const tick = () => {
      const diff = Math.max(0, Math.round((new Date(lockedUntil).getTime() - Date.now()) / 1000))
      setRemainingSec(diff)
      if (diff <= 0) setLockedUntil(null)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lockedUntil])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.trim() || !password) {
      setError('Preencha email e senha.')
      return
    }
    if (mode === 'signup' && !nickname.trim()) {
      setError('Escolha um nickname.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(mode === 'signup' ? { nickname: nickname.trim() } : {}),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Algo deu errado.')
        if (data.locked_until) setLockedUntil(data.locked_until)
        return
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
      } else if (mode === 'signup') {
        setInfo('Conta criada! Confira seu email para confirmar antes de entrar.')
      }
      setPassword('')
      setNickname('')
    } catch {
      setError('Não foi possível conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (checkingSession) return null

  if (userEmail) {
    return (
      <div
        className="w-full max-w-2xl mt-6 rounded-3xl p-5 border flex items-center justify-between gap-3"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-emerald-400" />
          <div>
            <p className="text-sm font-bold">Conectado</p>
            <p className="text-xs text-gray-400">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border border-white/20 hover:bg-white/10 transition-all"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>
    )
  }

  const disabled = loading || remainingSec > 0

  return (
    <div
      className="w-full max-w-2xl mt-6 rounded-3xl p-5 border"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
    >
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setMode('login'); setError(null); setInfo(null) }}
          className="flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"
          style={mode === 'login'
            ? { background: 'linear-gradient(135deg, #00d4ff, #0066cc)', color: 'white' }
            : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}
        >
          <LogIn size={16} /> Entrar
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(null); setInfo(null) }}
          className="flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5"
          style={mode === 'signup'
            ? { background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: 'white' }
            : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}
        >
          <UserPlus size={16} /> Cadastrar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {mode === 'signup' && (
          <input
            type="text"
            autoComplete="nickname"
            value={nickname}
            onChange={e => setNickname(e.target.value.slice(0, 20))}
            placeholder="Nickname (aparece no ranking)"
            disabled={disabled}
            className="py-3 px-4 rounded-2xl bg-white/10 border border-white/20 text-sm focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
          />
        )}
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com"
          disabled={disabled}
          className="py-3 px-4 rounded-2xl bg-white/10 border border-white/20 text-sm focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
        />
        <input
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? 'Crie uma senha (mín. 6 caracteres)' : 'Senha'}
          disabled={disabled}
          className="py-3 px-4 rounded-2xl bg-white/10 border border-white/20 text-sm focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
        />

        {error && (
          <p className="text-xs text-red-400 px-1">
            {error}
            {remainingSec > 0 && ` (${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, '0')})`}
          </p>
        )}
        {info && <p className="text-xs text-emerald-400 px-1">{info}</p>}

        <button
          type="submit"
          disabled={disabled}
          className="w-full py-3 px-4 rounded-2xl font-black text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: mode === 'login' ? 'linear-gradient(135deg, #00d4ff, #0066cc)' : 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
        >
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3 text-center">
        💾 Salve seu progresso para usar o app de qualquer dispositivo.
      </p>
    </div>
  )
}
