'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoom } from '@/hooks/useRoom'
import { useSettings } from '@/hooks/useSettings'
import { TelaoQuestion } from '@/components/game/TelaoQuestion'
import { Timer } from '@/components/game/Timer'
import { AbilityButton } from '@/components/game/AbilityButton'
import { ComboDisplay } from '@/components/game/ComboDisplay'
import { SettingsButton } from '@/components/ui/SettingsModal'
import { HostCharacter } from '@/components/game/HostCharacter'
import type { HostPose } from '@/components/game/HostCharacter'
import { AvatarSvg } from '@/components/game/AvatarSvg'
import { DEFAULT_AVATAR } from '@/components/game/AvatarCustomizer'
import { MusicEngine } from '@/lib/audio/music'
import { warmUpAudio } from '@/lib/audio/context'
import { SoundFX } from '@/lib/audio/sfx'
import { getCharacter } from '@/lib/game/characters'
import { CHOOSABLE_CATEGORIES } from '@/types/game'
import type { QuestionCategory } from '@/types/game'

// ── Spotlights decorativos ─────────────────────────────────────────────────
function StudioLights() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Beam esquerdo */}
      <div style={{
        position: 'absolute', top: 0, left: '10%',
        width: 3, height: '55vh',
        background: 'linear-gradient(to bottom, rgba(201,162,39,0.35), transparent)',
        transformOrigin: 'top center',
        animation: 'beam-sweep 6s ease-in-out infinite',
        filter: 'blur(2px)',
      }} />
      {/* Beam direito */}
      <div style={{
        position: 'absolute', top: 0, right: '10%',
        width: 3, height: '50vh',
        background: 'linear-gradient(to bottom, rgba(100,80,200,0.3), transparent)',
        transformOrigin: 'top center',
        animation: 'beam-sweep2 7s ease-in-out infinite',
        filter: 'blur(2px)',
      }} />
      {/* Glow de palco no chão */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30vh',
        background: 'radial-gradient(ellipse at 50% 100%, rgba(80,50,150,0.25) 0%, transparent 70%)',
      }} />
      {/* Stars */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${5 + (i * 7) % 40}%`,
          left: `${(i * 17 + 5) % 95}%`,
          width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1,
          borderRadius: '50%',
          background: 'white',
          opacity: 0.2 + (i % 4) * 0.1,
        }} />
      ))}
    </div>
  )
}

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

  const isHost    = room?.host_session_id === sessionId
  const myChar    = getCharacter(myPlayer?.character_slug)
  const isChooser = myPlayer?.id === chooserPlayerId
  const totalFases = room?.total_phases ?? 3
  const roundInPhase = room ? ((room.current_round - 1) % 10) + 1 : 1

  const { effectiveVolume } = useSettings()

  // ── Reações dos jogadores ──────────────────────────────────────────────────
  const [playerReactions, setPlayerReactions] = useState<Record<string, 'correct' | 'wrong' | 'thinking' | null>>({})
  const [myResult, setMyResult] = useState<'correct' | 'wrong' | null>(null)

  // ── Áudio ──────────────────────────────────────────────────────────────────
  const musicRef = useRef<MusicEngine | null>(null)
  const sfxRef   = useRef<SoundFX | null>(null)

  useEffect(() => { musicRef.current = new MusicEngine(); return () => { musicRef.current?.destroy(); musicRef.current = null } }, [])
  useEffect(() => { sfxRef.current = new SoundFX();   return () => { sfxRef.current?.destroy();   sfxRef.current   = null } }, [])
  useEffect(() => { musicRef.current?.setVolume(effectiveVolume) }, [effectiveVolume])
  useEffect(() => { sfxRef.current?.setVolume(effectiveVolume) },   [effectiveVolume])

  useEffect(() => {
    if (phase === 'question') { musicRef.current?.start() }
    else if (phase === 'reveal') { musicRef.current?.startReveal() }
    else { musicRef.current?.stop() }
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
    function pick() {
      const v = synth.getVoices()
      const pt = v.find(x => x.lang === 'pt-BR') ?? v.find(x => x.lang.startsWith('pt'))
      if (pt) utter.voice = pt
      synth.speak(utter)
    }
    const tid = setTimeout(() => synth.getVoices().length ? pick() : synth.addEventListener('voiceschanged', pick, { once: true }), 120)
    return () => { clearTimeout(tid); synth.cancel() }
  }, [currentQuestion?.id, phase])

  useEffect(() => {
    if (effectiveVolume === 0 && typeof window !== 'undefined' && window.speechSynthesis)
      window.speechSynthesis.cancel()
  }, [effectiveVolume])

  // SFX + reações
  const sfxRoundRef = useRef(-1)
  useEffect(() => {
    if (phase !== 'reveal' || !roundResult || !room) return
    if (sfxRoundRef.current === room.current_round) return
    sfxRoundRef.current = room.current_round

    const mine = roundResult.player_results.find(p => p.player_id === playerId)
    const isCorrect = mine?.is_correct ?? false
    if (isCorrect) sfxRef.current?.playCelebration()
    else sfxRef.current?.playWrong()

    setMyResult(isCorrect ? 'correct' : 'wrong')

    // Reações de todos os jogadores
    const reactions: Record<string, 'correct' | 'wrong'> = {}
    for (const pr of roundResult.player_results) {
      reactions[pr.player_id] = pr.is_correct ? 'correct' : 'wrong'
    }
    setPlayerReactions(reactions)
    setTimeout(() => setPlayerReactions({}), 2500)
  }, [phase, roundResult])

  // Reset reactions on new question
  useEffect(() => {
    if (phase === 'question') { setMyResult(null); setPlayerReactions({}) }
  }, [phase])

  // Thinking reaction when player answers but round not revealed
  useEffect(() => {
    if (phase === 'question' && answeredThisRound) {
      setPlayerReactions(r => ({ ...r, [playerId]: 'correct' })) // just show a "done" state
    }
  }, [answeredThisRound])

  // ── HOST: reagir ao CATEGORY_CHOSEN → chamar API ──────────────────────────
  const pendingSetupRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isHost || !pendingPhaseSetup || !room) return
    const key = `${pendingPhaseSetup.phase}:${pendingPhaseSetup.category}`
    if (pendingSetupRef.current === key) return
    pendingSetupRef.current = key
    ;(async () => {
      const res = await fetch('/api/game/choose-category', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: room.id, session_id: sessionId, category: pendingPhaseSetup.category, phase: pendingPhaseSetup.phase }),
      })
      const data = await res.json()
      if (data.success) {
        broadcast({ type: 'QUESTION_START', data: { round: data.round, question: data.question, started_at: new Date().toISOString(), timer_seconds: room.timer_seconds } })
      }
    })()
  }, [pendingPhaseSetup, isHost])

  // HOST: broadcast CHOOSING_CATEGORY fase 1
  const initBroadcastedRef = useRef(false)
  useEffect(() => {
    if (!isHost || phase !== 'choosing_category' || !room || initBroadcastedRef.current) return
    if (currentFase !== 1) return
    initBroadcastedRef.current = true
    const ordered = [...players].sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
    const chooser = ordered[(currentFase - 1) % Math.max(1, ordered.length)]
    if (!chooser) return
    broadcast({ type: 'CHOOSING_CATEGORY', data: { phase: 1, chooser_player_id: chooser.id, chooser_nickname: chooser.nickname } })
  }, [isHost, phase, players.length])

  // HOST: auto-avança
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

  useEffect(() => { if (phase === 'finished') router.push(`/results/${code}`) }, [phase])

  // ── Ações ──────────────────────────────────────────────────────────────────
  async function handleAnswer(index: number) {
    if (answeredThisRound || !room || !myPlayer) return
    const time_taken_ms = (room.timer_seconds - timeLeft) * 1000
    await fetch('/api/game/answer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: room.id, player_id: playerId, round_number: room.current_round, selected_index: index, time_taken_ms, ability_used: doubleActive ? 'double' : null }),
    })
    markAnswered(doubleActive ? 'double' : undefined)
    broadcast({ type: 'PLAYER_ANSWERED', data: { player_id: playerId, nickname: myPlayer.nickname } })
  }

  async function handleAbility() {
    if (!myPlayer || !room || myPlayer.ability_uses <= 0) return
    const ability = myChar?.ability_type
    if (ability === 'skip') {
      markAnswered()
      await fetch('/api/game/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room_id: room.id, player_id: playerId, round_number: room.current_round, selected_index: null, time_taken_ms: 0, ability_used: 'skip' }) })
    } else if (ability === 'double') {
      activateDouble()
    } else if (ability === 'eliminate' && currentQuestion) {
      const res = await fetch('/api/game/ability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room_id: room.id, player_id: playerId, round_number: room.current_round }) })
      const { eliminated } = await res.json()
      broadcast({ type: 'ABILITY_USED', data: { player_id: playerId, ability: 'eliminate', eliminated } })
    }
  }

  function handleChooseCategory(category: QuestionCategory) {
    if (!myPlayer || !room) return
    const cat = CHOOSABLE_CATEGORIES.find(c => c.id === category)
    broadcast({ type: 'CATEGORY_CHOSEN', data: { phase: currentFase, category, category_name: cat?.name ?? category } })
  }

  async function triggerReveal() {
    if (!room) return
    const res = await fetch('/api/game/reveal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room_id: room.id, round_number: room.current_round, session_id: sessionId }) })
    const data = await res.json()
    broadcast({ type: 'ROUND_REVEAL', data })

    setTimeout(async () => {
      const nextRes = await fetch('/api/game/next', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room_id: room.id, session_id: sessionId }) })
      const nextData = await nextRes.json()

      if (nextData.finished) {
        broadcast({ type: 'GAME_FINISHED', data: { final_scores: players } })
      } else if (nextData.phase_end) {
        broadcast({ type: 'PHASE_END', data: { completed_phase: nextData.completed_phase, player_scores: nextData.player_scores } })
        setTimeout(() => {
          if (nextData.next_phase > (room.total_phases ?? 3)) return
          const ordered = [...players].sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
          const chooser = ordered[(nextData.next_phase - 1) % Math.max(1, ordered.length)]
          if (!chooser) return
          broadcast({ type: 'CHOOSING_CATEGORY', data: { phase: nextData.next_phase, chooser_player_id: chooser.id, chooser_nickname: chooser.nickname } })
        }, 12000)
      } else {
        broadcast({ type: 'QUESTION_START', data: { round: nextData.round, question: nextData.question, started_at: new Date().toISOString(), timer_seconds: room.timer_seconds } })
      }
    }, 14000)
  }

  // ── Pose do host ───────────────────────────────────────────────────────────
  const hostPose: HostPose =
    phase === 'reveal' && myResult === 'correct'   ? 'celebrating' :
    phase === 'reveal' && myResult === 'wrong'      ? 'compassionate' :
    phase === 'question'                            ? 'presenting' :
    'idle'

  const hostSpeech =
    phase === 'choosing_category' ? (isChooser ? 'Você escolhe o tema!' : 'Aguardando escolha do tema...') :
    phase === 'question' ? `Pergunta ${roundInPhase} de 10` :
    phase === 'reveal' && myResult === 'correct' ? '🎉 Excelente!' :
    phase === 'reveal' && myResult === 'wrong'   ? 'Que pena! Vai na próxima!' :
    phase === 'phase_end' ? `Fase ${completedPhase} concluída!` :
    undefined

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!room || !myPlayer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="text-5xl animate-spin">⚙️</div>
          <p className="text-gray-400 animate-pulse">Carregando o estúdio...</p>
        </div>
      </div>
    )
  }

  // ── Background do estúdio ──────────────────────────────────────────────────
  const studioBg = { background: 'radial-gradient(ellipse at 50% -5%, #1a0f3e 0%, #0d0d1f 40%, #050510 100%)' }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESCOLHA DE CATEGORIA
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'choosing_category') {
    const chooserPlayer = players.find(p => p.id === chooserPlayerId)
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center p-4 text-white overflow-hidden" style={studioBg} onClick={warmUpAudio}>
        <StudioLights />
        <div className="relative z-10 max-w-lg w-full text-center space-y-6 animate-slide-up">
          {/* DataShow branding */}
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-yellow-500/70 mb-1">DataShow</p>
            <p className="text-gray-500 text-xs">
              Fase <span className="text-cyan-400 font-bold">{currentFase}</span> de {totalFases}
            </p>
          </div>

          {/* Host centralizado */}
          <div className="flex justify-center">
            <HostCharacter
              pose={isChooser ? 'presenting' : 'idle'}
              speech={isChooser ? 'Escolha o tema desta fase!' : `${chooserPlayer?.nickname ?? '...'} está escolhendo...`}
              size={80}
            />
          </div>

          {/* Título dramático */}
          <div>
            <h2 className="text-3xl font-black" style={{ textShadow: '0 0 20px rgba(201,162,39,0.5)' }}>
              {isChooser ? '🎯 Qual será o tema?' : '⏳ Aguardando...'}
            </h2>
          </div>

          {/* Grade de categorias (só para o chooser) */}
          {isChooser ? (
            <div className="space-y-2.5">
              {CHOOSABLE_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => handleChooseCategory(cat.id)}
                  className="animate-cat-reveal w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    background: `linear-gradient(90deg, ${cat.color}18 0%, rgba(0,0,0,0.3) 100%)`,
                    border: `1.5px solid ${cat.color}50`,
                    boxShadow: `0 0 15px ${cat.color}15`,
                  }}
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <div className="flex-1">
                    <p className="font-black text-base">{cat.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">10 perguntas</p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: `${cat.color}25`, color: cat.color }}>
                    Escolher →
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-4 py-2 rounded-full border" style={{ borderColor: 'rgba(255,255,255,0.1)', background: p.id === chooserPlayerId ? 'rgba(201,162,39,0.1)' : 'rgba(255,255,255,0.03)' }}>
                  <AvatarSvg config={p.avatar_config ?? DEFAULT_AVATAR} size={24} />
                  <span className={`text-sm font-semibold ${p.id === chooserPlayerId ? 'text-yellow-400 animate-pulse' : 'text-gray-400'}`}>
                    {p.nickname}
                  </span>
                  {p.id === chooserPlayerId && <span className="animate-ping inline-flex h-2 w-2 rounded-full bg-yellow-400 opacity-75" />}
                </div>
              ))}
            </div>
          )}
        </div>
        <SettingsButton />
      </main>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FIM DE FASE
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'phase_end') {
    const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣']
    const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#888']
    const sortedPhase = [...phaseScores].sort((a, b) => b.phase_score - a.phase_score)
    const sortedTotal = [...phaseScores].sort((a, b) => b.total_score - a.total_score)

    return (
      <main className="relative min-h-screen flex flex-col items-center p-6 text-white overflow-hidden" style={studioBg}>
        <StudioLights />
        <div className="relative z-10 w-full max-w-md mt-4 space-y-5 animate-slide-up">
          <div className="text-center">
            <HostCharacter pose="celebrating" speech="Fim de fase!" size={70} />
            <h2 className="text-2xl font-black mt-3" style={{ textShadow: '0 0 20px rgba(201,162,39,0.5)' }}>
              🏁 Fase {completedPhase} concluída!
            </h2>
            {completedPhase < totalFases && (
              <p className="text-gray-500 text-xs mt-1 animate-pulse">Próxima fase em breve...</p>
            )}
          </div>

          {/* Ranking desta fase */}
          <div>
            <p className="text-xs uppercase tracking-widest font-black mb-2" style={{ color: 'rgba(201,162,39,0.8)' }}>
              ⚡ Pontuação desta fase
            </p>
            <div className="space-y-2">
              {sortedPhase.map((ps, i) => (
                <div key={ps.player_id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${ps.player_id === playerId ? 'border-2' : 'border border-white/10'}`}
                  style={{ background: ps.player_id === playerId ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.03)', borderColor: ps.player_id === playerId ? '#00d4ff' : undefined }}>
                  <span className="text-xl w-7 text-center">{RANK_EMOJIS[i] ?? `${i+1}`}</span>
                  <span className="flex-1 font-semibold text-sm">{ps.nickname}{ps.player_id === playerId ? ' (você)' : ''}</span>
                  <span className="font-black text-lg" style={{ color: RANK_COLORS[i] ?? '#888' }}>+{ps.phase_score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Placar geral */}
          <div>
            <p className="text-xs uppercase tracking-widest font-black mb-2" style={{ color: 'rgba(168,85,247,0.8)' }}>
              🏆 Placar geral
            </p>
            <div className="space-y-2">
              {sortedTotal.map((ps, i) => (
                <div key={ps.player_id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${ps.player_id === playerId ? 'border-2' : 'border border-white/10'}`}
                  style={{ background: ps.player_id === playerId ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.03)', borderColor: ps.player_id === playerId ? '#a855f7' : undefined }}>
                  <span className="text-xl w-7 text-center">{RANK_EMOJIS[i] ?? `${i+1}`}</span>
                  <AvatarSvg config={players.find(p => p.id === ps.player_id)?.avatar_config ?? DEFAULT_AVATAR} size={28} />
                  <span className="flex-1 font-semibold text-sm">{ps.nickname}{ps.player_id === playerId ? ' (você)' : ''}</span>
                  <span className="font-black text-lg text-purple-300">{ps.total_score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <SettingsButton />
      </main>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOBBY
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'lobby') {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden" style={studioBg} onClick={warmUpAudio}>
        <StudioLights />
        <div className="relative z-10 text-center space-y-4">
          <HostCharacter pose="idle" speech="Bem-vindos ao DataShow!" size={80} />
          <p className="text-gray-400 animate-pulse text-sm cursor-pointer select-none mt-4">
            Aguardando o jogo iniciar...
          </p>
        </div>
        <SettingsButton />
      </main>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERGUNTA + REVEAL
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <main className="relative min-h-screen flex flex-col text-white overflow-hidden" style={studioBg}>
      <StudioLights />

      <div className="relative z-10 flex flex-col min-h-screen p-3 pb-2 max-w-2xl mx-auto w-full">

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-2xl mb-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Fase info */}
          <div className="text-xs font-black">
            <span style={{ color: 'rgba(201,162,39,0.9)' }}>DataShow</span>
            <span className="text-gray-600 mx-1.5">•</span>
            <span className="text-gray-400">Fase </span>
            <span className="text-cyan-400">{currentFase}</span>
            <span className="text-gray-600">/{totalFases}</span>
            <span className="text-gray-600 ml-1">— P{roundInPhase}/10</span>
          </div>

          {/* Timer */}
          {phase === 'question' && (
            <Timer timeLeft={timeLeft} totalTime={room.timer_seconds} />
          )}

          {/* Mini avatares */}
          <div className="flex gap-1.5">
            {players.map(p => (
              <div key={p.id} className="relative" title={p.nickname}>
                <div className={
                  playerReactions[p.id] === 'correct' ? 'animate-correct' :
                  playerReactions[p.id] === 'wrong'   ? 'animate-wrong'   :
                  playersAnswered.includes(p.id) && phase === 'question' ? 'opacity-100' : 'opacity-60'
                }>
                  <AvatarSvg config={p.avatar_config ?? DEFAULT_AVATAR} size={28} />
                </div>
                {playersAnswered.includes(p.id) && phase === 'question' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border border-black text-[6px] flex items-center justify-center">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Host + Combo row ─────────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-3">
          <HostCharacter pose={hostPose} speech={hostSpeech} size={60} />

          <div className="flex flex-col items-end gap-2">
            {myPlayer && <ComboDisplay combo={myPlayer.combo} multiplier={myPlayer.multiplier} />}
            {phase === 'question' && !answeredThisRound && myPlayer && myPlayer.ability_uses > 0 && (
              <AbilityButton character_slug={myPlayer.character_slug} uses={myPlayer.ability_uses} onUse={handleAbility} disabled={answeredThisRound} />
            )}
          </div>
        </div>

        {/* Double Down banner */}
        {doubleActive && phase === 'question' && (
          <div className="text-center text-sm text-green-400 font-bold animate-pulse mb-2 py-1.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            🤖 Double Down ativo — próxima resposta vale 2×!
          </div>
        )}

        {/* ── TELÃO (pergunta) ─────────────────────────────────────────────── */}
        {phase === 'question' && currentQuestion && (
          <>
            <TelaoQuestion
              question={currentQuestion}
              onAnswer={handleAnswer}
              answered={answeredThisRound}
              eliminatedOptions={eliminatedOptions}
              peekData={Object.keys(peekData).length > 0 ? peekData : undefined}
            />

            {answeredThisRound && (
              <div className="mt-3 space-y-2">
                <p className="text-center text-gray-500 text-xs font-bold tracking-widest uppercase">
                  Aguardando os outros...
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {players.map(p => {
                    const done = playersAnswered.includes(p.id)
                    return (
                      <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: done ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
                          color: done ? '#4ade80' : '#6b7280',
                        }}>
                        <AvatarSvg config={p.avatar_config ?? DEFAULT_AVATAR} size={20} />
                        <span className={done ? '' : 'animate-pulse'}>{done ? '✅' : '⏳'}</span>
                        <span className="truncate">{p.nickname}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── REVEAL ──────────────────────────────────────────────────────── */}
        {phase === 'reveal' && roundResult && currentQuestion && (
          <div className="space-y-4 animate-slide-up">

            {/* ── MURAL DE REAÇÕES: todos os personagens lado a lado ────────── */}
            <div
              className="rounded-2xl py-4 px-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex justify-center gap-4 flex-wrap">
                {players.map(p => {
                  const pr        = roundResult.player_results.find(r => r.player_id === p.id)
                  const isCorrect = pr?.is_correct ?? false
                  const pts       = pr?.points_earned ?? 0
                  const isMe      = p.id === playerId
                  return (
                    <div key={p.id} className="flex flex-col items-center gap-1" style={{ minWidth: 62 }}>
                      {/* Avatar com animação de reação */}
                      <div className={isCorrect ? 'animate-correct' : 'animate-wrong'}>
                        <AvatarSvg config={p.avatar_config ?? DEFAULT_AVATAR} size={52} />
                      </div>
                      {/* Emoji de reação */}
                      <span className="text-xl" style={{ lineHeight: 1 }}>
                        {isCorrect ? '😄' : '😢'}
                      </span>
                      {/* Nome */}
                      <span
                        className="text-xs font-bold text-center truncate"
                        style={{ maxWidth: 72, color: isMe ? '#00d4ff' : 'rgba(255,255,255,0.75)' }}
                      >
                        {p.nickname}{isMe ? ' ★' : ''}
                      </span>
                      {/* Pontos desta pergunta */}
                      <span className={`text-sm font-black ${pts > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pts > 0 ? `+${pts}` : '✗'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Resposta correta */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1.5px solid rgba(34,197,94,0.35)' }}>
              <p className="text-xs text-green-400 font-black mb-2 uppercase tracking-widest">Resposta correta</p>
              <p className="font-bold text-white">{currentQuestion.options[roundResult.correct_index]}</p>
              {currentQuestion.explanation && (
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{currentQuestion.explanation}</p>
              )}
            </div>

            {/* Pontos desta pergunta — todos os jogadores */}
            <div>
              <p className="text-xs uppercase tracking-widest font-black mb-2" style={{ color: 'rgba(201,162,39,0.75)' }}>
                📊 Pontos desta pergunta
              </p>
              <div className="space-y-1.5">
                {[...roundResult.player_results]
                  .sort((a, b) => b.points_earned - a.points_earned)
                  .map(pr => {
                    const p = players.find(pl => pl.id === pr.player_id)
                    return (
                      <div
                        key={pr.player_id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                        style={{
                          background:   pr.player_id === playerId ? 'rgba(0,212,255,0.07)' : 'rgba(255,255,255,0.03)',
                          border:       `1px solid ${pr.player_id === playerId ? '#00d4ff' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        <AvatarSvg config={p?.avatar_config ?? DEFAULT_AVATAR} size={22} />
                        <span className="flex-1 text-sm font-semibold truncate">
                          {pr.nickname}{pr.player_id === playerId ? ' (você)' : ''}
                        </span>
                        {pr.combo >= 2 && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,53,0.2)', color: '#ff6b35' }}>
                            🔥 Seq.{pr.combo}x
                          </span>
                        )}
                        <span className={`font-black text-lg ${pr.points_earned > 0 ? 'text-cyan-300' : 'text-red-400'}`}>
                          {pr.points_earned > 0 ? `+${pr.points_earned}` : pr.points_earned}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Placar geral acumulado */}
            <div>
              <p className="text-xs uppercase tracking-widest font-black mb-2" style={{ color: 'rgba(168,85,247,0.75)' }}>
                🏆 Placar geral
              </p>
              <div className="space-y-1.5">
                {[...players].sort((a, b) => b.score - a.score).map((p, i) => {
                  const EMOJIS = ['🥇', '🥈', '🥉', '4️⃣']
                  return (
                    <div key={p.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${p.id === playerId ? 'border-2' : 'border border-white/10'}`}
                      style={{ background: p.id === playerId ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.03)', borderColor: p.id === playerId ? '#a855f7' : undefined }}>
                      <span className="text-base w-6">{EMOJIS[i] ?? `${i+1}`}</span>
                      <AvatarSvg config={p.avatar_config ?? DEFAULT_AVATAR} size={24} />
                      <span className="flex-1 text-sm font-semibold">{p.nickname}</span>
                      <span className="font-black text-purple-300">{p.score.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-center text-gray-600 text-xs animate-pulse">Próxima pergunta em breve...</p>
          </div>
        )}
      </div>

      <SettingsButton />
    </main>
  )
}
