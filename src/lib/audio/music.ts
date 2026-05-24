import { getAudioCtx } from './context'

const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.1

const KICK_PATTERN  = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
const HAT_PATTERN   = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0]
// Notas do baixo: Dó, Mi, Sol, Mi (arpejo simples de game show)
const BASS_PATTERN  = [130.81, 0, 0, 0, 164.81, 0, 0, 0, 196.00, 0, 0, 0, 164.81, 0, 0, 0]

export class MusicEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private schedulerTimer: ReturnType<typeof setInterval> | null = null
  private nextNoteTime = 0
  private currentStep = 0
  private bpm = 118
  private volume = 0.4

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
    return (60 / this.bpm) / 4 // semicolcheia
  }

  private scheduleStep(step: number, time: number) {
    const ctx = this.getCtx()
    if (!this.masterGain) return

    // Kick: bombo
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

    // Hi-hat: ruído filtrado
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

    // Baixo sintetizado
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

  private scheduler() {
    const ctx = this.getCtx()
    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      this.scheduleStep(this.currentStep, this.nextNoteTime)
      this.nextNoteTime += this.secondsPerStep()
      this.currentStep = (this.currentStep + 1) % 16
    }
  }

  async start() {
    if (this.schedulerTimer) return
    try {
      const ctx = this.getCtx()
      await ctx.resume()
      this.nextNoteTime = ctx.currentTime + 0.1
      this.currentStep = 0
      this.schedulerTimer = setInterval(() => this.scheduler(), LOOKAHEAD_MS)
    } catch {}
  }

  stop() {
    if (this.schedulerTimer) { clearInterval(this.schedulerTimer); this.schedulerTimer = null }
  }

  setVolume(vol: number) {
    this.volume = vol
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05)
    }
  }

  // Adapta BPM conforme urgência do timer
  setUrgency(timeLeft: number, totalTime: number) {
    if (timeLeft <= 5)  { this.bpm = 160; return }
    if (timeLeft <= 10) { this.bpm = 140; return }
    this.bpm = 118
  }

  destroy() {
    this.stop()
    this.masterGain?.disconnect()
    this.masterGain = null
    this.ctx = null  // não fechar — contexto é compartilhado
  }
}
