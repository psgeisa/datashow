'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoom } from '@/hooks/useRoom'
import { useSettings } from '@/hooks/useSettings'
import { QuestionCard } from '@/components/game/QuestionCard'
import { Timer } from '@/components/game/Timer'
import { Scoreboard } from '@/components/game/Scoreboard'
import { PlayerAvatar } from '@/components/game/PlayerAvatar'
import { AbilityButton } from '@/components/game/AbilityButton'
import { ComboDisplay } from '@/components/game/ComboDisplay'
import { SettingsButton } from '@/components/ui/SettingsModal'
import { MusicEngine } from '@/lib/audio/music'
import { SoundFX } from '@/lib/audio/sfx'
import { getCharacter } from '@/lib/game/characters'

export default function PlayPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()

  const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('session_id') ?? '' : ''
  const playerId = typeof window !== 'undefined' ? sessionStorage.getItem('player_id') ?? '' : ''

  const { state, broadcast, markAnswered, activateDouble } = useRoom(code, sessionId)
  const { room, players, currentQuestion, myPlayer, phase, timeLeft, roundResult, answeredThisRound, playersAnswered, eliminatedOptions, peekData, doubleActive } = state

  const isHost = room?.host_session_id === sessionId
  const myChar = getCharacter(myPlayer?.character_slug)
  const { effectiveVolume } = useSettings()

  const musicRef = useRef<MusicEngine | null>(null)
  useEffect(() => {
    musicRef.current = new MusicEngine()
    return () => { musicRef.current?.destroy(); musicRef.current = null }
  }, [])

  const sfxRef = useRef<SoundFX | null>(null)
  useEffect(() => {
    sfxRef.current = new SoundFX()
    return () => { sfxRef.current?.destroy(); sfxRef.current = null }
  }, [])

  useEffect(() => { musicRef.current?.setVolume(effectiveVolume) }, [effectiveVolume])
  useEffect(() => { sfxRef.current?.setVolume(effectiveVolume) }, [effectiveVolume])

  // Música toca apenas durante a pergunta
  useEffect(() => {
    if (phase === 'question') musicRef.current?.start()
    else musicRef.current?.stop()
  }, [phase])

  // Urgência do BPM conforme timer
  useEffect(() => {
    if (room) musicRef.current?.setUrgency(timeLeft, room.timer_seconds)
  }, [timeLeft])

  // SFX: tempo esgotado
  const timeUpPlayedRef = useRef(false)
  useEffect(() => {
    if (phase !== 'question') { timeUpPlayedRef.current = false; return }
    if (timeLeft === 0 && !timeUpPlayedRef.current) {
      timeUpPlayedRef.current = true
      sfxRef.current?.playTimeUp()
    }
  }, [timeLeft, phase])

  // SFX: correto / errado (dispara uma vez por rodada)
  const sfxRoundRef = useRef(-1)
  useEffect(() => {
    if (phase !== 'reveal' || !roundResult || !room) return
    if (sfxRoundRef.current === room.current_round) return
    sfxRoundRef.current = room.current_round
    const mine = roundResult.player_results.find(p => p.player_id === playerId)
    if (mine?.is_correct) sfxRef.current?.playCelebration()
    else sfxRef.current?.playWrong()
  }, [phase, roundResult])

  // Guards para evitar disparos duplos
  const hostBroadcastedRef = useRef(false)
  const revealTriggeredRef = useRef<number>(-1) // guarda o round em que o reveal já foi disparado
  useEffect(() => {
    if (!isHost || !currentQuestion || !room || hostBroadcastedRef.current) return
    hostBroadcastedRef.current = true
    broadcast({
      type: 'QUESTION_START',
      data: {
        round: room.current_round,
        question: currentQuestion,
        started_at: new Date().toISOString(),
        timer_seconds: room.timer_seconds,
      },
    })
  }, [isHost, currentQuestion?.id, room?.id])

  // Host auto-avança: quando todos responderam ou timer zera
  useEffect(() => {
    if (!isHost || phase !== 'question' || !room) return
    if (revealTriggeredRef.current === room.current_round) return // já disparou nesta rodada
    const allAnswered = players.length > 0 && playersAnswered.length >= players.length
    if (allAnswered || timeLeft === 0) {
      revealTriggeredRef.current = room.current_round
      triggerReveal()
    }
  }, [playersAnswered.length, timeLeft, phase])

  useEffect(() => {
    if (phase === 'finished') router.push(`/results/${code}`)
  }, [phase])

  async function handleAnswer(index: number) {
    if (answeredThisRound || !room || !myPlayer) return

    const time_taken_ms = (room.timer_seconds - timeLeft) * 1000

    await fetch('/api/game/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: room.id,
        player_id: playerId,
        round_number: room.current_round,
        selected_index: index,
        time_taken_ms,
        ability_used: doubleActive ? 'double' : null,
      }),
    })

    markAnswered(doubleActive ? 'double' : undefined)

    broadcast({
      type: 'PLAYER_ANSWERED',
      data: { player_id: playerId, nickname: myPlayer.nickname },
    })
  }

  async function handleAbility() {
    if (!myPlayer || !room || myPlayer.ability_uses <= 0) return
    const ability = myChar?.ability_type

    if (ability === 'skip') {
      markAnswered()
      await fetch('/api/game/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id, player_id: playerId,
          round_number: room.current_round, selected_index: null,
          time_taken_ms: 0, ability_used: 'skip',
        }),
      })
    } else if (ability === 'double') {
      activateDouble()
    } else if (ability === 'eliminate' && currentQuestion) {
      // Eliminar 2 alternativas erradas aleatoriamente
      const wrongIndices = [0, 1, 2, 3].filter(i =>
        i !== (currentQuestion as any).correct_index
      )
      // Pegamos 2 aleatórios das erradas (não temos correct_index no client,
      // então pedimos ao servidor via API — simplificado aqui: mandamos ao servidor
      // e o servidor responde com os índices a eliminar)
      const res = await fetch('/api/game/ability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: room.id, player_id: playerId, round_number: room.current_round }),
      })
      const { eliminated } = await res.json()
      broadcast({ type: 'ABILITY_USED', data: { player_id: playerId, ability: 'eliminate', eliminated } })
    } else if (ability === 'peek') {
      // Dados de peek vêm da contagem de respostas dos outros jogadores
      // Simplificado: servidor conta as respostas atuais
    }
  }

  async function triggerReveal() {
    if (!room) return
    // Buscar resultado da rodada
    const res = await fetch('/api/game/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: room.id, round_number: room.current_round, session_id: sessionId }),
    })
    const data = await res.json()
    broadcast({ type: 'ROUND_REVEAL', data })

    // Após 4s, ir para próxima ou terminar
    setTimeout(async () => {
      const nextRes = await fetch('/api/game/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: room.id, session_id: sessionId }),
      })
      const nextData = await nextRes.json()
      if (nextData.finished) {
        broadcast({ type: 'GAME_FINISHED', data: { final_scores: players } })
      } else {
        broadcast({
          type: 'QUESTION_START',
          data: {
            round: nextData.round,
            question: nextData.question,
            started_at: new Date().toISOString(),
            timer_seconds: room.timer_seconds,
          },
        })
      }
    }, 14000)
  }

  if (!room || !myPlayer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-gray-400">Carregando jogo...</p>
        </div>
      </div>
    )
  }

  return (
    <main
      className="min-h-screen flex flex-col text-white p-4"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      {/* Header: round + timer + players */}
      <div className="flex items-center justify-between mb-6 max-w-2xl mx-auto w-full">
        <div className="text-sm text-gray-400 font-bold">
          RODADA <span className="text-white text-lg">{room.current_round}</span>
          <span className="text-gray-600">/{room.total_rounds}</span>
        </div>

        {phase === 'question' && (
          <Timer timeLeft={timeLeft} totalTime={room.timer_seconds} />
        )}

        {/* Mini avatares com indicador de quem respondeu */}
        <div className="flex gap-2">
          {players.map(p => (
            <PlayerAvatar
              key={p.id}
              player={p}
              size="sm"
              showScore={false}
              answered={playersAnswered.includes(p.id)}
            />
          ))}
        </div>
      </div>

      {/* Fase: PERGUNTA */}
      {phase === 'question' && currentQuestion && (
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-4">
          {/* Combo + habilidade */}
          <div className="flex items-center justify-between">
            <ComboDisplay combo={myPlayer.combo} multiplier={myPlayer.multiplier} />
            {!answeredThisRound && myPlayer.ability_uses > 0 && (
              <AbilityButton
                character_slug={myPlayer.character_slug}
                uses={myPlayer.ability_uses}
                onUse={handleAbility}
                disabled={answeredThisRound}
              />
            )}
          </div>

          {doubleActive && (
            <div className="text-center text-sm text-green-400 font-bold animate-pulse">
              🤖 Double Down ativo — próxima resposta vale 2×!
            </div>
          )}

          <QuestionCard
            question={currentQuestion}
            onAnswer={handleAnswer}
            answered={answeredThisRound}
            eliminatedOptions={eliminatedOptions}
            peekData={Object.keys(peekData).length > 0 ? peekData : undefined}
          />

          {answeredThisRound && (
            <div className="space-y-3">
              <p className="text-center text-gray-500 text-xs font-medium tracking-widest uppercase">
                Aguardando
              </p>
              <div className="grid grid-cols-2 gap-2">
                {players.map(p => {
                  const done = playersAnswered.includes(p.id)
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-500"
                      style={{
                        background: done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${done ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        color: done ? '#4ade80' : '#6b7280',
                      }}
                    >
                      <span className={done ? '' : 'animate-pulse'}>{done ? '✅' : '⏳'}</span>
                      <span className="truncate">{p.nickname}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fase: REVEAL */}
      {phase === 'reveal' && roundResult && currentQuestion && (
        <div className="max-w-2xl mx-auto w-full space-y-5 animate-slide-up">
          <h3 className="text-2xl font-black text-center">
            {roundResult.player_results.find(p => p.player_id === playerId)?.is_correct
              ? '✅ Correto!'
              : '❌ Errou!'}
          </h3>

          {/* Alternativa correta */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <p className="text-sm text-green-400 font-bold mb-2">Resposta correta</p>
            <p className="font-semibold">{currentQuestion.options[roundResult.correct_index]}</p>
            {currentQuestion.explanation && (
              <p className="text-sm text-gray-400 mt-2">{currentQuestion.explanation}</p>
            )}
          </div>

          {/* Pontos ganhos */}
          {roundResult.player_results.map(pr => {
            if (pr.player_id !== playerId) return null
            return (
              <div key={pr.player_id} className="text-center">
                <p className={`text-4xl font-black ${pr.points_earned > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                  {pr.points_earned > 0 ? `+${pr.points_earned}` : pr.points_earned}
                </p>
                <p className="text-gray-400 text-sm">Combo: {pr.combo}x</p>
              </div>
            )
          })}

          <Scoreboard players={players} myPlayerId={playerId} />
          <p className="text-center text-gray-600 text-xs animate-pulse">Próxima pergunta em breve...</p>
        </div>
      )}

      {/* Fase: LOBBY (aguardando jogo começar) */}
      {phase === 'lobby' && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 animate-pulse">Aguardando o jogo iniciar...</p>
        </div>
      )}

      <SettingsButton />
    </main>
  )
}
