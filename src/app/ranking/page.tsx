'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Target, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface RankingRow {
  user_id: string
  name: string
  solo_score: number
  group_score: number
  total_score: number
}

interface RankingData {
  overall: RankingRow[]
  solo: RankingRow[]
  group: RankingRow[]
}

const RANK_EMOJIS = ['🥇', '🥈', '🥉']

function Board({ title, icon, rows, scoreKey, myUserId }: {
  title: string
  icon: React.ReactNode
  rows: RankingRow[]
  scoreKey: 'total_score' | 'solo_score' | 'group_score'
  myUserId: string | null
}) {
  return (
    <div className="w-full rounded-3xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
      <p className="font-black text-lg mb-3 flex items-center gap-2">{icon} {title}</p>
      {rows.length === 0 && <p className="text-sm text-gray-500">Ninguém pontuou aqui ainda.</p>}
      <div className="space-y-2">
        {rows.slice(0, 20).map((row, i) => {
          const isMe = row.user_id === myUserId
          return (
            <div
              key={row.user_id}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: isMe ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)' }}
            >
              <span className="w-6 text-center text-sm font-bold text-gray-400">{RANK_EMOJIS[i] ?? i + 1}</span>
              <span className="flex-1 text-sm font-bold">{row.name}{isMe ? ' (você)' : ''}</span>
              <span className="text-sm font-black text-cyan-400">{row[scoreKey].toLocaleString()} pts</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RankingPage() {
  const router = useRouter()
  const [data, setData] = useState<RankingData | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setMyUserId(data.session?.user?.id ?? null)
      setCheckingSession(false)
    })
  }, [])

  useEffect(() => {
    fetch('/api/ranking').then(r => r.json()).then(setData).catch(() => {})
  }, [])

  return (
    <main
      className="min-h-screen flex flex-col items-center p-4 pt-12 text-white"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      <button onClick={() => router.push('/')} className="self-start mb-6 text-gray-400 hover:text-white transition-colors text-sm">
        ← Voltar
      </button>

      <div className="text-center mb-8">
        <div className="text-6xl mb-3">🏆</div>
        <h1
          className="text-4xl font-black tracking-tight mb-2"
          style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Classificação Geral
        </h1>
        <p className="text-gray-400">Solo e em grupo, tudo somado</p>
      </div>

      {!checkingSession && !myUserId && (
        <div className="w-full max-w-md mb-6 p-4 rounded-2xl border border-white/10 bg-white/5 text-center text-sm text-gray-400">
          Faça login na tela inicial pra entrar no ranking e acompanhar sua posição.
        </div>
      )}

      {!data && <p className="text-gray-400">Carregando ranking...</p>}

      {data && (
        <div className="w-full max-w-md flex flex-col gap-4">
          <Board title="Classificação Geral" icon={<Trophy size={20} className="text-yellow-400" />} rows={data.overall} scoreKey="total_score" myUserId={myUserId} />
          <Board title="Modo Solo" icon={<Target size={20} className="text-cyan-400" />} rows={data.solo} scoreKey="solo_score" myUserId={myUserId} />
          <Board title="Modo em Grupo" icon={<Users size={20} className="text-purple-400" />} rows={data.group} scoreKey="group_score" myUserId={myUserId} />
        </div>
      )}
    </main>
  )
}
