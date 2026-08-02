'use client'
import { useRouter } from 'next/navigation'
import { Quote } from 'lucide-react'
import { ThemeToggle } from '@/components/deucert/ThemeToggle'

export default function EstudoHome() {
  const router = useRouter()

  return (
    <main className="min-h-screen estudo-bg-dots flex flex-col items-center justify-center p-4 text-center">
      <ThemeToggle />

      <p className="text-sm mb-3">
        <span style={{ color: 'var(--accent)' }}>$</span>{' '}
        <span style={{ color: 'var(--text-muted)' }}>certifica</span>
        <span className="estudo-blinking-cursor" style={{ color: 'var(--accent)' }}>_</span>
      </p>
      <h1 className="text-6xl font-black tracking-tight mb-3 flex items-center justify-center gap-1">
        deuCert
        <Quote size={28} strokeWidth={1.75} style={{ color: 'var(--accent)' }} className="mb-6" />
      </h1>
      <p className="mb-12 max-w-md" style={{ color: 'var(--text-muted)' }}>
        Simulados no formato da prova real e reforço de erros por tópico.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        <button
          onClick={() => router.push('/estudo/simulados')}
          className="flex-1 p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95"
          style={{ borderColor: 'var(--accent)', background: 'var(--bg-card)' }}
        >
          <div className="text-3xl mb-2">📝</div>
          <p className="font-black text-lg">Simulados</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Prova cronometrada, formato oficial</p>
        </button>

        <button
          onClick={() => router.push('/estudo/reforco')}
          className="flex-1 p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-95"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
        >
          <div className="text-3xl mb-2">🎯</div>
          <p className="font-black text-lg">Reforço</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Treine até zerar os erros</p>
        </button>
      </div>
    </main>
  )
}
