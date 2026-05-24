'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameState, Player, BroadcastPayload, QuestionPublic } from '@/types/game'

const DEFAULT_STATE: GameState = {
  room: null, players: [], currentQuestion: null, myPlayer: null,
  phase: 'lobby', timeLeft: 0, roundResult: null,
  answeredThisRound: false, playersAnswered: [],
  eliminatedOptions: [], peekData: {}, doubleActive: false,
}

export function useRoom(roomCode: string, sessionId: string) {
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [state, setState] = useState<GameState>(DEFAULT_STATE)

  const startCountdown = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setState(s => ({ ...s, timeLeft: seconds }))
    timerRef.current = setInterval(() => {
      setState(s => {
        if (s.timeLeft <= 1) {
          clearInterval(timerRef.current!)
          return { ...s, timeLeft: 0 }
        }
        return { ...s, timeLeft: s.timeLeft - 1 }
      })
    }, 1000)
  }, [])

  useEffect(() => {
    let playersSub: any

    async function init() {
      const { data: room } = await supabase.from('rooms').select().eq('code', roomCode).single()
      if (!room) return

      const { data: players } = await supabase
        .from('players').select().eq('room_id', room.id).order('score', { ascending: false })
      const myPlayer = players?.find((p: Player) => p.session_id === sessionId) ?? null

      // Se o jogo está em andamento, carregar a pergunta atual do banco
      let currentQuestion: QuestionPublic | null = null
      let initialTime = room.timer_seconds

      if (room.status === 'playing' && room.current_round > 0) {
        const { data: gq } = await supabase
          .from('game_questions')
          .select('questions(id, category, difficulty, type, question, options, explanation, code_snippet, meme_context)')
          .eq('room_id', room.id)
          .eq('round_number', room.current_round)
          .maybeSingle()

        if (gq?.questions) {
          currentQuestion = gq.questions as unknown as QuestionPublic

          // Calcular tempo restante baseado em quando a rodada começou
          if (room.round_started_at) {
            const elapsed = (Date.now() - new Date(room.round_started_at).getTime()) / 1000
            initialTime = Math.max(1, Math.floor(room.timer_seconds - elapsed))
          }
        }
      }

      setState(s => ({
        ...s, room, players: players ?? [], myPlayer, currentQuestion,
        phase: room.status === 'playing' ? 'question' : room.status === 'finished' ? 'finished' : 'lobby',
        timeLeft: currentQuestion ? initialTime : 0,
      }))

      // Iniciar countdown apenas para não-host (o host inicia via broadcast)
      if (room.status === 'playing' && currentQuestion && room.host_session_id !== sessionId) {
        startCountdown(initialTime)
      }

      // Escutar mudanças nos scores dos jogadores
      playersSub = supabase
        .channel(`players:${room.id}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'players',
          filter: `room_id=eq.${room.id}`,
        }, (payload) => {
          const updated = payload.new as Player
          setState(s => ({
            ...s,
            players: s.players.map(p => p.id === updated.id ? updated : p).sort((a, b) => b.score - a.score),
            myPlayer: s.myPlayer?.id === updated.id ? updated : s.myPlayer,
          }))
        })
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'players',
          filter: `room_id=eq.${room.id}`,
        }, (payload) => {
          setState(s => ({ ...s, players: [...s.players, payload.new as Player] }))
        })
        .subscribe()

      // Canal de broadcast para eventos do jogo
      const channel = supabase.channel(`game:${roomCode}`, {
        config: { broadcast: { self: true } },
      })
      channelRef.current = channel

      channel.on('broadcast', { event: 'GAME_EVENT' }, ({ payload }: { payload: BroadcastPayload }) => {
        handleEvent(payload)
      }).subscribe()
    }

    function handleEvent(event: BroadcastPayload) {
      switch (event.type) {
        case 'QUESTION_START':
          setState(s => ({
            ...s, phase: 'question',
            currentQuestion: event.data.question,
            roundResult: null, answeredThisRound: false,
            playersAnswered: [], eliminatedOptions: [], peekData: {},
            doubleActive: false,
          }))
          // Usar timer_seconds do evento (sem stale closure)
          startCountdown(event.data.timer_seconds)
          break

        case 'PLAYER_ANSWERED':
          setState(s => ({ ...s, playersAnswered: [...s.playersAnswered, event.data.player_id] }))
          break

        case 'ABILITY_USED':
          if (event.data.ability === 'eliminate' && event.data.eliminated) {
            setState(s => ({ ...s, eliminatedOptions: event.data.eliminated! }))
          }
          break

        case 'ROUND_REVEAL':
          if (timerRef.current) clearInterval(timerRef.current)
          setState(s => ({ ...s, phase: 'reveal', roundResult: event.data, timeLeft: 0 }))
          break

        case 'GAME_FINISHED':
          if (timerRef.current) clearInterval(timerRef.current)
          setState(s => ({ ...s, phase: 'finished' }))
          break
      }
    }

    init()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (playersSub) supabase.removeChannel(playersSub)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [roomCode, sessionId])

  async function broadcast(event: BroadcastPayload) {
    await channelRef.current?.send({ type: 'broadcast', event: 'GAME_EVENT', payload: event })
  }

  function markAnswered(ability_used?: string) {
    setState(s => ({
      ...s, answeredThisRound: true,
      doubleActive: ability_used === 'double' ? false : s.doubleActive,
    }))
  }

  function activateDouble() {
    setState(s => ({ ...s, doubleActive: true }))
  }

  return { state, broadcast, markAnswered, activateDouble }
}
