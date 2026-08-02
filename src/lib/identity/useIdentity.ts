'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSoloPlayerId } from '@/lib/solo/identity'
import { getPlayerId } from '@/lib/deucert/identity'

type Kind = 'solo' | 'deucert'

/** ID usado pra gravar progresso: o user.id da sessão Supabase quando
 * logado (segue a conta entre dispositivos), senão o ID anônimo do
 * localStorage — mesmo comportamento de antes de existir login. */
export function useIdentity(kind: Kind): { playerId: string; ready: boolean } {
  const [supabase] = useState(() => createClient())
  const [playerId, setPlayerId] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const anonId = kind === 'solo' ? getSoloPlayerId() : getPlayerId()

    supabase.auth.getSession().then(({ data }) => {
      setPlayerId(data.session?.user?.id ?? anonId)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setPlayerId(session?.user?.id ?? anonId)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase, kind])

  return { playerId, ready }
}
