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
import { warmUpAudio } from '@/lib/audio/context'
import { SoundFX } from '@/lib/audio/sfx'
import { getCharacter } from '@/lib/game/characters'
import { CHOOSABLE_CATEGORIES } from '@/types/game'
import type { QuestionCategory } from '@/types/game'

export default function PlayPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()

  const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('session_id') ?? '' : ''
  const playerId  = typeof window !== 'undefined' ? sessionStorage.getItem('player_id') ?? '' : ''

  const { state, broadcast, markAnswered, activateDouble } = useRoom(code, sessionId)
  const {
    room, players, currentQuestion, myPlayer, phase, timeLeft,
    roundResult, answeredThisRound, playersAnswered, eliminatedOptions,
    peekData, doubleActive, currentFase, chooserPlayerId, phaseScores,
    completedPhase, pendingPhaseSetup,
  } = state

  const isHost   = room?.host_session_id === sessionId
  const myChar   = getCharacter(myPlayer?.character_slug)
  const isChooser = myPlayer?.id === chooserPlayerId
  const totalFases = room?.total_phases ?? 3

  // Round dentro da fase: 1..10
  const roundInPhase = room ? ((room.current_round - 1) % 10) + 1 : 1

  const { effectiveVolume } = useSettings()

  // ── Áudio ──────────────────────────────────────────────────────────────────
  const musicRef = useRef<MusicEngine | null>(null)
  const sfxRef   = useRef<SoundFX | null>(null)

  useEffect(() => {
    musicRef.current = new MusicEngine()
    return () => { musicRef.current?.destroy(); musicRef.current = null }
  }, [])
  useEffect(() => {
    sfxRef.current = new SoundFX()
    return () => { sfxRef.current?.destroy(); sfxRef.current = null }
  }, [])

  useEffect(() => { musicRef.current?.setVolume(effectiveVolume) }, [effectiveVolume])
  useEffect(() => { sfxRef.current?.setVolume(effectiveVolume) }, [effectiveVolume])

  useEffect(() => {
    if (phase === 'question') musicRef.current?.start()
    else if (phase === 'reveal') musicRef.current?.startReveal()
    else musicRef.current?.stop()
  }, [phase])

  useEffect(() => {
    if (room && phase === 'question') musicRef.current?.setUrgency(timeLeft, room.timer_seconds)
  }, [timeLeft])

  const timeUpPlayedRef = useRef(false)
  useEffect(() => {
    if (phase !== 'question') { timeUpPlayedRef.current = false; return }
    if (timeLeft === 0 && !timeUpPlayedRef.current) {
      timeUpPlayedRef.current = true
      sfxRef.current?.playTimeUp()
    }
  }, [timeLeft, phase])

  // Narrador
  useEffect(() => {
    if (phase !== 'question' || !currentQuestion || effectiveVolume === 0) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const synth = window.speechSynthesis
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(currentQuestion.question)
    utter.rate = 1.25; utter.pitch = 1.05; utter.volume = 1
    function pickVoiceAndSpeak() {
      const voices = synth.getVoices()
      const pt = voices.find(v => v.lang === 'pt-BR') ?? voices.find(v => v.lang.startsWith('pt'))
      if (pt) utter.voice = pt
      synth.speak(utter)
    }
    const tid = setTimeout(() => {
      if (synth.getVoices().length) pickVoiceAndSpeak()
      else synth.addEventListener('voiceschanged', pickVoiceAndSpeak, { once: true })
    }, 120)
    return () => { clearTimeout(tid); synth.cancel() }
  }, [currentQuestion?.id, phase])

  useEffect(() => {
    if (effectiveVolume === 0 && typeof window !== 'undefined' && window.speechSynthesis)
      window.speechSynthesis.cancel()
  }, [effectiveVolume])

  // SFX acerto / erro
  const sfxRoundRef = useRef(-1)
  useEffect(() => {
    if (phase !== 'reveal' || !roundResult || !room) return
    if (sfxRoundRef.current === room.current_round) return
    sfxRoundRef.current = room.current_round
    const mine = roundResult.player_results.find(p => p.player_id === playerId)
    if (mine?.is_correct) sfxRef.current?.playCelebration()
    else sfxRef.current?.playWrong()
  }, [phase, roundResult])

  // ── HOST: escolha de categoria recebida → chamar API ──────────────────────
  const pendingSetupRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isHost || !pendingPhaseSetup || !room) return
    const key = `${pendingPhaseSetup.phase}:${pendingPhaseSetup.category}`
    if (pendingSetupRef.current === key) return
    pendingSetupRef.current = key

    ;(async () => {
      const res = await fetch('/api/game/choose-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id,
          session_id: sessionId,
          category: pendingPhaseSetup.category,
          phase: pendingPhaseSetup.phase,
        }),
      })
      const data = await res.json()
      if (data.success) {
        broadcast({
          type: 'QUESTION_START',
          data: {
            round: data.round,
            question: data.question,
            started_at: new Date().toISOString(),
            timer_seconds: room.timer_seconds,
          },
        })
      }
    })()
  }, [pendingPhaseSetup, isHost])

  // ── HOST: início do jogo → broadcast CHOOSING_CATEGORY fase 1 ─────────────
  const initBroadcastedRef = useRef(false)
  useEffect(() => {
    if (!isHost || phase !== 'choosing_category' || !room || initBroadcastedRef.current) return
    if (currentFase !== 1) return // fases 2+ são disparadas por triggerReveal
    initBroadcastedRef.current = true
    const orderedByJoin = [...players].sort((a, b) =>
      new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
    )
    const chooser = orderedByJoin[(currentFase - 1) % Math.max(1, orderedByJoin.length)]
    if (!chooser) return
    broadcast({
      type: 'CHOOSING_CATEGORY',
      data: { phase: 1, chooser_player_id: chooser.id, chooser_nickname: chooser.nickname },
    })
  }, [isHost, phase, players.length])

  // ── HOST: auto-avança quando todos responderam ou timer zerou ─────────────
  const revealTriggeredRef = useRef<number>(-1)
  useEffect(() => {
    if (!isHost || phase !== 'question' || !room) return
    if (revealTriggeredRef.current === room.current_round) return
    const allAnswered = players.length > 0 && playersAnswered.length >= players.length
    if (allAnswered || timeLeft === 0) {
      revealTriggeredRef.current = room.current_round
      triggerReveal()
    }
  }, [playersAnswered.length, timeLeft, phase])

  useEffect(() => {
    if (phase === 'finished') router.push(`/results/${code}`)
  }, [phase])

  // ── Ações do jogador ───────────────────────────────────────────────────────
  async function handleAnswer(index: number) {
    if (answeredThisRound || !room || !myPlayer) return
    const time_taken_ms = (room.timer_seconds - timeLeft) * 1000
    await fetch('/api/game/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: room.id, player_id: playerId,
        round_number: room.current_round,
        selected_index: index, time_taken_ms,
        ability_used: doubleActive ? 'double' : null,
      }),
    })
    markAnswered(doubleActive ? 'double' : undefined)
    broadcast({ type: 'PLAYER_ANSWERED', data: { player_id: playerId, nickname: myPlayer.nickname } })
  }

  async function handleAbility() {
    if (!myPlayer || !room || myPlayer.ability_uses <= 0) return
    const ability = myChar?.ability_type
    if (ability === 'skip') {
      markAnswered()
      await fetch('/api/game/answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: room.id, player_id: playerId,
          round_number: room.current_round, selected_index: null,
          time_taken_ms: 0, ability_used: 'skip',
        }),
      })
    } else if (ability === 'double') {
      activateDouble()
    } else if (ability === 'eliminate' && currentQuestion) {
      const res = await fetch('/api/game/ability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: room.id, player_id: playerId, round_number: room.current_round }),
      })
      const { eliminated } = await res.json()
      broadcast({ type: 'ABILITY_USED', data: { player_id: playerId, ability: 'eliminate', eliminated } })
    }
  }

  function handleChooseCategory(category: QuestionCategory) {
    if (!myPlayer || !room) return
    const cat = CHOOSABLE_CATEGORIES.find(c => c.id === category)
    broadcast({
      type: 'CATEGORY_CHOSEN',
      data: { phase: currentFase, category, category_name: cat?.name ?? category },
    })
  }

  async function triggerReveal() {
    if (!room) return
    const res = await fetch('/api/game/reveal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: room.id, round_number: room.current_round, session_id: sessionId }),
    })
    const data = await res.json()
    broadcast({ type: 'ROUND_REVEAL', data })

    setTimeout(async () => {
      const nextRes = await fetch('/api/game/next', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: room.id, session_id: sessionId }),
      })
      const nextData = await nextRes.json()

      if (nextData.finished) {
        broadcast({ type: 'GAME_FINISHED', data: { final_scores: players } })

      } else if (nextData.phase_end) {
        broadcast({ type: 'PHASE_END', data: { completed_phase: nextData.completed_phase, player_scores: nextData.player_scores } })

        // Após 12s, iniciar escolha da próxima fase
        setTimeout(() => {
          if (nextData.next_phase > (room.total_phases ?? 3)) return
          const orderedByJoin = [...players].sort((a, b) =>
            new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
          )
          const chooserIdx = (nextData.next_phase - 1) % Math.max(1, orderedByJoin.length)
          const chooser = orderedByJoin[chooserIdx]
          if (!chooser) return
          broadcast({
            type: 'CHOOSING_CATEGORY',
            data: { phase: nextData.next_phase, chooser_player_id: chooser.id, chooser_nickname: chooser.nickname },
          })
        }, 12000)

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

  // ── Loading ────────────────────────────────────────────────────────────────
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

  // ── FASE: ESCOLHA DE CATEGORIA ─────────────────────────────────────────────
  if (phase === 'choosing_category') {
    const chooserPlayer = players.find(p => p.id === chooserPlayerId)
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-4 text-white"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
        onClick={warmUpAudio}
      >
        <div className="max-w-lg w-full text-center space-y-6 animate-slide-up">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              Fase {currentFase} de {totalFases}
            </p>
            <h2 className="text-3xl font-black">
              {isChooser ? '🎯 Você escolhe o tema!' : `⏳ Aguardando escolha...`}
            </h2>
            {!isChooser && chooserPlayer && (
              <p className="text-gray-400 mt-2 text-lg">
                <span className="text-cyan-400 font-bold">{chooserPlayer.nickname}</span> está escolhendo o tema desta fase
              </p>
            )}
          </div>

          {isChooser ? (
            <div className="grid grid-cols-1 gap-3">
              {CHOOSABLE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleChooseCategory(cat.id)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: `${cat.color}12`, borderColor: `${cat.color}40` }}
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <div>
                    <p className="font-bold text-lg">{cat.name}</p>
                    <p className="text-xs text-gray-500">10 perguntas</p>
                  </div>
                  <div className="ml-auto">
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: `${cat.color}25`, color: cat.color }}
                    >
                      Escolher →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                  <span className={p.id === chooserPlayerId ? 'animate-pulse' : ''}>
                    {p.id === chooserPlayerId ? '🎯' : '⏳'}
                  </span>
                  <span className="text-sm font-medium">{p.nickname}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <SettingsButton />
      </main>
    )
  }

  // ── FASE: FIM DE FASE ──────────────────────────────────────────────────────
  if (phase === 'phase_end') {
    const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣']
    const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#888']
    const sorted = [...phaseScores].sort((a, b) => b.phase_score - a.phase_score)
    const totalSorted = [...phaseScores].sort((a, b) => b.total_score - a.total_score)
    const isLastPhase = completedPhase >= totalFases

    return (
      <main
        className="min-h-screen flex flex-col items-center p-6 text-white"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
      >
        <div className="w-full max-w-md mt-4 space-y-5 animate-slide-up">
          <div className="text-center">
            <div className="text-5xl mb-2">🏁</div>
            <h2 className="text-2xl font-black">Fase {completedPhase} concluída!</h2>
            {!isLastPhase && (
              <p className="text-gray-500 text-sm mt-1 animate-pulse">Próxima fase em breve...</p>
            )}
          </div>

          {/* Ranking desta fase */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Pontuação desta fase</p>
            <div className="space-y-2">
              {sorted.map((ps, i) => {
                const isMe = ps.player_id === playerId
                return (
                  <div
                    key={ps.player_id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'border-2' : 'border border-white/10'}`}
                    style={{
                      background: isMe ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.03)',
                      borderColor: isMe ? '#00d4ff' : undefined,
                    }}
                  >
                    <span className="text-xl w-7 text-center">{RANK_EMOJIS[i] ?? `${i+1}`}</span>
                    <span className="flex-1 font-semibold">{ps.nickname}{isMe ? ' (você)' : ''}</span>
                    <span className="font-black text-lg" style={{ color: RANK_COLORS[i] ?? '#888' }}>
                      +{ps.phase_score}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Placar geral */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Placar geral</p>
            <div className="space-y-2">
              {totalSorted.map((ps, i) => {
                const isMe = ps.player_id === playerId
                return (
                  <div
                    key={ps.player_id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? 'border-2' : 'border border-white/10'}`}
                    style={{
                      background: isMe ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)',
                      borderColor: isMe ? '#a855f7' : undefined,
                    }}
                  >
                    <span className="text-xl w-7 text-center">{RANK_EMOJIS[i] ?? `${i+1}`}</span>
                    <span className="flex-1 font-semibold">{ps.nickname}{isMe ? ' (você)' : ''}</span>
                    <span className="font-black text-lg text-purple-300">
                      {ps.total_score.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <SettingsButton />
      </main>
    )
  }

  // ── FASE: PERGUNTA ─────────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen flex flex-col text-white p-4"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #0d0d3a 0%, #000000 65%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 max-w-2xl mx-auto w-full">
        <div className="text-sm text-gray-400 font-bold">
          <div>
            FASE <span className="text-cyan-400 text-base">{currentFase}</span>
            <span className="text-gray-600">/{totalFases}</span>
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            Pergunta <span className="text-white">{roundInPhase}</span>/10
          </div>
        </div>

        {phase === 'question' && (
          <Timer timeLeft={timeLeft} totalTime={room.timer_seconds} />
        )}

        <div className="flex gap-2">
          {players.map(p => (
            <PlayerAvatar
              key={p.id} player={p} size="sm" showScore={false}
              answered={playersAnswered.includes(p.id)}
            />
          ))}
        </div>
      </div>

      {/* Pergunta */}
      {phase === 'question' && currentQuestion && (
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-4">
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

      {/* Reveal */}
      {phase === 'reveal' && roundResult && currentQuestion && (
        <div className="max-w-2xl mx-auto w-full space-y-5 animate-slide-up">
          <h3 className="text-2xl font-black text-center">
            {roundResult.player_results.find(p => p.player_id === playerId)?.is_correct
              ? '✅ Correto!'
              : '❌ Errou!'}
          </h3>

          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <p className="text-sm text-green-400 font-bold mb-2">Resposta correta</p>
            <p className="font-semibold">{currentQuestion.options[roundResult.correct_index]}</p>
            {currentQuestion.explanation && (
              <p className="text-sm text-gray-400 mt-2">{currentQuestion.explanation}</p>
            )}
          </div>

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

      {/* Lobby (aguardando início) */}
      {phase === 'lobby' && (
        <div className="flex-1 flex items-center justify-center" onClick={warmUpAudio}>
          <p className="text-gray-400 animate-pulse cursor-pointer select-none">
            Aguardando o jogo iniciar...
          </p>
        </div>
      )}

      <SettingsButton />
    </main>
  )
}
