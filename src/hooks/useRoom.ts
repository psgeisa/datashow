'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameState, Player, BroadcastPayload, QuestionPublic } from '@/types/game'

const DEFAULT_STATE: GameState = {
  room: null, players: [], currentQuestion: null, myPlayer: null,
  phase: 'lobby', timeLeft: 0, roundResult: null,
  answeredThisRound: false, playersAnswered: [],
  eliminatedOptions: [], peekData: {}, doubleActive: false,
  currentFase: 1, chooserPlayerId: '', phaseScores: [],
  completedPhase: 0, pendingPhaseSetup: null,
  isPaused: false, pausedById: '', pausedByNickname: '',
}

export function useRoom(roomCode: string, sessionId: string) {
  const supabase = createClient()
  const channelRef      = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef       = useRef(false)           // sync ref for timer closure
  const autoResumeRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [state, setState] = useState<GameState>(DEFAULT_STATE)

  // ── Timer countdown (respects pause) ────────────────────────────────────
  const startCountdown = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setState(s => ({ ...s, timeLeft: seconds }))
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return   // do nothing while paused
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

      const { data: playersRaw } = await supabase
        .from('players').select().eq('room_id', room.id).order('score', { ascending: false })
      const players = playersRaw ?? []
      const myPlayer = players.find((p: Player) => p.session_id === sessionId) ?? null

      // Chooser determinístico: (phase-1) % players.length por ordem de entrada
      const { data: playersOrdered } = await supabase
        .from('players').select('id, nickname').eq('room_id', room.id).order('joined_at')
      const phase = room.current_phase ?? 1
      const chooserIdx = (phase - 1) % Math.max(1, playersOrdered?.length ?? 1)
      const chooser = playersOrdered?.[chooserIdx]

      let gamePhase: GameState['phase'] = 'lobby'
      let currentQuestion: QuestionPublic | null = null
      let initialTime = room.timer_seconds
      let answeredThisRound = false

      if (room.status === 'playing') {
        const gp = room.game_phase ?? 'choosing'
        if (gp === 'choosing') {
          gamePhase = 'choosing_category'
        } else if (gp === 'phase_end') {
          gamePhase = 'phase_end'
        } else if (gp === 'playing' && room.current_round > 0) {
          const { data: gq } = await supabase
            .from('game_questions')
            .select('questions(id, category, difficulty, type, question, options, explanation, code_snippet, meme_context)')
            .eq('room_id', room.id)
            .eq('round_number', room.current_round)
            .maybeSingle()

          if (gq?.questions) {
            currentQuestion = gq.questions as unknown as QuestionPublic
            if (room.round_started_at) {
              const elapsed = (Date.now() - new Date(room.round_started_at).getTime()) / 1000
              initialTime = Math.max(1, Math.floor(room.timer_seconds - elapsed))
            }
            gamePhase = 'question'

            // ── F5 protection: check if player already answered this round ──
            if (myPlayer) {
              const { data: existingAnswer } = await supabase
                .from('answers')
                .select('id')
                .eq('room_id', room.id)
                .eq('player_id', myPlayer.id)
                .eq('round_number', room.current_round)
                .maybeSingle()
              if (existingAnswer) answeredThisRound = true
            }
          }
        }
      } else if (room.status === 'finished') {
        gamePhase = 'finished'
      }

      setState(s => ({
        ...s, room, players, myPlayer, currentQuestion,
        phase: gamePhase,
        timeLeft: currentQuestion ? initialTime : 0,
        currentFase: phase,
        chooserPlayerId: chooser?.id ?? '',
        answeredThisRound,
      }))

      if (room.status === 'playing' && currentQuestion && room.host_session_id !== sessionId) {
        startCountdown(initialTime)
      }

      // ── Postgres realtime (player updates) ─────────────────────────────
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

      // ── Broadcast channel ───────────────────────────────────────────────
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
        case 'CHOOSING_CATEGORY':
          setState(s => ({
            ...s,
            phase: 'choosing_category',
            currentFase: event.data.phase,
            chooserPlayerId: event.data.chooser_player_id,
            pendingPhaseSetup: null,
            answeredThisRound: false,
            playersAnswered: [],
            room: s.room ? { ...s.room, current_phase: event.data.phase, game_phase: 'choosing' } : s.room,
          }))
          break

        case 'CATEGORY_CHOSEN':
          setState(s => ({
            ...s,
            pendingPhaseSetup: {
              phase: event.data.phase,
              super_topic: event.data.super_topic,
              category_name: event.data.category_name,
            },
          }))
          break

        case 'QUESTION_START':
          setState(s => ({
            ...s,
            room: s.room ? { ...s.room, current_round: event.data.round, game_phase: 'playing', timer_seconds: event.data.timer_seconds } : s.room,
            phase: 'question',
            currentQuestion: event.data.question,
            roundResult: null, answeredThisRound: false,
            playersAnswered: [], eliminatedOptions: [], peekData: {},
            doubleActive: false, pendingPhaseSetup: null,
            isPaused: false,
          }))
          pausedRef.current = false
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
          setState(s => ({ ...s, phase: 'reveal', roundResult: event.data, timeLeft: 0, isPaused: false }))
          pausedRef.current = false
          if (autoResumeRef.current) clearTimeout(autoResumeRef.current)
          break

        case 'PHASE_END':
          if (timerRef.current) clearInterval(timerRef.current)
          setState(s => ({
            ...s,
            phase: 'phase_end',
            phaseScores: event.data.player_scores,
            completedPhase: event.data.completed_phase,
            room: s.room ? { ...s.room, game_phase: 'phase_end' } : s.room,
          }))
          break

        case 'GAME_FINISHED':
          if (timerRef.current) clearInterval(timerRef.current)
          setState(s => ({ ...s, phase: 'finished' }))
          break

        case 'GAME_PAUSED':
          pausedRef.current = true
          setState(s => ({
            ...s,
            isPaused: true,
            pausedById: event.data.paused_by_id,
            pausedByNickname: event.data.paused_by_nickname,
          }))
          // Auto-resume after 2 minutes
          if (autoResumeRef.current) clearTimeout(autoResumeRef.current)
          autoResumeRef.current = setTimeout(() => {
            pausedRef.current = false
            setState(s => ({ ...s, isPaused: false, pausedById: '', pausedByNickname: '' }))
          }, 2 * 60 * 1000)
          break

        case 'GAME_RESUMED':
          pausedRef.current = false
          setState(s => ({ ...s, isPaused: false, pausedById: '', pausedByNickname: '' }))
          if (autoResumeRef.current) clearTimeout(autoResumeRef.current)
          break
      }
    }

    init()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (playersSub) supabase.removeChannel(playersSub)
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoResumeRef.current) clearTimeout(autoResumeRef.current)
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
