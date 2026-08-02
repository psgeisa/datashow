'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Status = 'checking' | 'ready' | 'invalid' | 'success'

export default function RedefinirSenha() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // O link do email traz um token na URL — o browser client detecta e
    // cria uma sessão de recuperação automaticamente ao carregar a página.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus('ready')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setStatus('ready')
    })
    const timeout = setTimeout(() => {
      setStatus(s => (s === 'checking' ? 'invalid' : s))
    }, 4000)
    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    setStatus('success')
    setTimeout(() => router.push('/'), 2000)
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      <div className="w-full max-w-md rounded-3xl p-6 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <p className="text-lg font-black flex items-center gap-2 mb-6">
          <KeyRound size={20} /> Redefinir senha
        </p>

        {status === 'checking' && <p className="text-sm text-gray-400">Verificando o link...</p>}

        {status === 'invalid' && (
          <div className="space-y-3">
            <p className="text-sm text-red-400">Esse link é inválido ou expirou.</p>
            <button onClick={() => router.push('/')} className="text-sm text-gray-400 hover:text-white underline">
              ← Voltar ao início
            </button>
          </div>
        )}

        {status === 'success' && (
          <p className="text-sm text-emerald-400">Senha redefinida! Redirecionando...</p>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              disabled={loading}
              className="py-3 px-4 rounded-2xl bg-white/10 border border-white/20 text-sm focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
            />
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              disabled={loading}
              className="py-3 px-4 rounded-2xl bg-white/10 border border-white/20 text-sm focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
            />

            {error && <p className="text-xs text-red-400 px-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl font-black text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0066cc)' }}
            >
              {loading ? 'Aguarde...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
