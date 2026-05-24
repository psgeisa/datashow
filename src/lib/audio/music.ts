import { getAudioCtx } from './context'

const LOOKAHEAD_MS    = 25
const SCHEDULE_AHEAD_S = 0.1

// ── Faixa de pergunta (tensa, crescente) ────────────────────────────────────
const KICK_PATTERN  = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
const HAT_PATTERN   = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
const BASS_PATTERN  = [130.81, 0, 0, 0, 164.81, 0, 0, 0, 196.00, 0, 0, 0, 164.81, 0, 0, 0]

// ── Faixa de reveal (alegre, arpejo maior) ───────────────────────────────────
// C5=523 E5=659 G5=784 A5=880 C6=1047 | baixo C3=131 G3=196 F3=175 G3=196
const REVEAL_MELODY  = [523.25, 659.25, 783.99, 880.00, 783.99, 1046.50, 783.99, 659.25,
                        523.25, 659.25, 880.00, 1046.50, 880.00, 783.99, 659.25, 523.25]
const REVEAL_BASS    = [130.81, 0, 0, 0, 196.00, 0, 0, 0, 174.61, 0, 0, 0, 196.00, 0, 0, 0]
const REVEAL_CHORDS  = [
  [523.25, 659.25, 783.99],  // C E G (Dó maior)
  null, null, null,
  [392.00, 493.88, 587.33],  // G B D (Sol maior)
  null, null, null,
  [349.23, 440.00, 523.25],  // F A C (Fá maior)
  null, null, null,
  [392.00, 493.88, 587.33],
  null, null, null,
]

type Track = 'question' | 'reveal' | 'none'

export class MusicEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private schedulerTimer: ReturnType<typeof setInterval> | null = null
  private nextNoteTime = 0
  private currentStep = 0
  private bpm = 118
  private volume = 0.4
  private activeTrack: Track = 'none'

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = getAudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.ctx.destination)
    }
    return this.ctx
  }

  private secondsPerStep() {
    return (60 / this.bpm) / 4
  }

  // ── Passo da faixa de pergunta ───────────────────────────────────────────
  private scheduleQuestion(step: number, time: number) {
    const ctx = this.getCtx()
    if (!this.masterGain) return

    if (KICK_PATTERN[step]) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.frequency.setValueAtTime(160, time)
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.4)
      g.gain.setValueAtTime(1.2, time)
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.4)
      osc.connect(g); g.connect(this.masterGain)
      osc.start(time); osc.stop(time + 0.4)
    }

    if (HAT_PATTERN[step]) {
      const bufSize = Math.floor(ctx.sampleRate * 0.04)
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buf
      const filt = ctx.createBiquadFilter()
      filt.type = 'highpass'; filt.frequency.value = 7000
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.25, time)
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.04)
      src.connect(filt); filt.connect(g); g.connect(this.masterGain)
      src.start(time); src.stop(time + 0.04)
    }

    const bassFreq = BASS_PATTERN[step]
    if (bassFreq) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = bassFreq
      const filt = ctx.createBiquadFilter()
      filt.type = 'lowpass'; filt.frequency.value = 800
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.5, time)
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.18)
      osc.connect(filt); filt.connect(g); g.connect(this.masterGain)
      osc.start(time); osc.stop(time + 0.18)
    }
  }

  // ── Passo da faixa de reveal (alegre) ────────────────────────────────────
  private scheduleReveal(step: number, time: number) {
    const ctx = this.getCtx()
    if (!this.masterGain) return

    // Kick leve na 1ª semicolcheia de cada tempo
    if (step % 4 === 0) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.frequency.setValueAtTime(130, time)
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.25)
      g.gain.setValueAtTime(0.7, time)
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.25)
      osc.connect(g); g.connect(this.masterGain)
      osc.start(time); osc.stop(time + 0.25)
    }

    // Hi-hat em todos os passos
    {
      const bufSize = Math.floor(ctx.sampleRate * 0.02)
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buf
      const filt = ctx.createBiquadFilter()
      filt.type = 'highpass'; filt.frequency.value = 8000
      const g = ctx.createGain()
      g.gain.setValueAtTime(step % 2 === 0 ? 0.3 : 0.15, time)
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.02)
      src.connect(filt); filt.connect(g); g.connect(this.masterGain)
      src.start(time); src.stop(time + 0.02)
    }

    // Melodia (bell-like: sine com envelope rápido)
    const melFreq = REVEAL_MELODY[step]
    if (melFreq) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = melFreq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, time)
      g.gain.linearRampToValueAtTime(0.35, time + 0.008)
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.22)
      osc.connect(g); g.connect(this.masterGain)
      osc.start(time); osc.stop(time + 0.22)

      // Harmônico (oitava acima, suave)
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = melFreq * 2
      const g2 = ctx.createGain()
      g2.gain.setValueAtTime(0, time)
      g2.gain.linearRampToValueAtTime(0.08, time + 0.008)
      g2.gain.exponentialRampToValueAtTime(0.001, time + 0.12)
      osc2.connect(g2); g2.connect(this.masterGain)
      osc2.start(time); osc2.stop(time + 0.12)
    }

    // Baixo
    const bassFreq = REVEAL_BASS[step]
    if (bassFreq) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = bassFreq
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.4, time)
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.2)
      osc.connect(g); g.connect(this.masterGain)
      osc.start(time); osc.stop(time + 0.2)
    }

    // Acordes (pad suave nos tempos fortes)
    const chord = REVEAL_CHORDS[step]
    if (chord) {
      chord.forEach(freq => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, time)
        g.gain.linearRampToValueAtTime(0.06, time + 0.02)
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.45)
        osc.connect(g); g.connect(this.masterGain)
        osc.start(time); osc.stop(time + 0.45)
      })
    }
  }

  private scheduler() {
    const ctx = this.getCtx()
    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      if (this.activeTrack === 'question') this.scheduleQuestion(this.currentStep, this.nextNoteTime)
      else if (this.activeTrack === 'reveal') this.scheduleReveal(this.currentStep, this.nextNoteTime)
      this.nextNoteTime += this.secondsPerStep()
      this.currentStep = (this.currentStep + 1) % 16
    }
  }

  private startTrack(track: Track) {
    if (this.activeTrack === track && this.schedulerTimer) return
    this.stop()
    this.activeTrack = track
    try {
      const ctx = this.getCtx()
      ctx.resume().then(() => {
        this.nextNoteTime = ctx.currentTime + 0.1
        this.currentStep = 0
        this.schedulerTimer = setInterval(() => this.scheduler(), LOOKAHEAD_MS)
      })
    } catch {}
  }

  async start() {
    this.bpm = 118
    this.startTrack('question')
  }

  startReveal() {
    this.bpm = 132
    this.startTrack('reveal')
  }

  stop() {
    if (this.schedulerTimer) { clearInterval(this.schedulerTimer); this.schedulerTimer = null }
    this.activeTrack = 'none'
  }

  setVolume(vol: number) {
    this.volume = vol
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05)
    }
  }

  setUrgency(timeLeft: number, totalTime: number) {
    if (this.activeTrack !== 'question') return
    if (timeLeft <= 5)  { this.bpm = 160; return }
    if (timeLeft <= 10) { this.bpm = 140; return }
    this.bpm = 118
  }

  destroy() {
    this.stop()
    this.masterGain?.disconnect()
    this.masterGain = null
    this.ctx = null
  }
}
