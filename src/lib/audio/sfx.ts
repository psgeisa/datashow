import { getAudioCtx } from './context'

export class SoundFX {
  private ctx: AudioContext | null = null
  private volume = 0.5

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = getAudioCtx()
    return this.ctx
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
  }

  // Arpejo ascendente + acorde sustentado + brilhos aleatórios
  playCelebration() {
    try {
      const ctx = this.getCtx()
      ctx.resume()
      const t = ctx.currentTime
      const v = this.volume

      // C5 → E5 → G5 → C6
      ;[523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        const s = t + i * 0.09
        g.gain.setValueAtTime(0, s)
        g.gain.linearRampToValueAtTime(v * 0.45, s + 0.02)
        g.gain.exponentialRampToValueAtTime(0.001, s + 0.28)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(s); osc.stop(s + 0.28)
      })

      // Acorde C major sustentado
      ;[523.25, 659.25, 783.99].forEach(freq => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        const s = t + 0.38
        g.gain.setValueAtTime(0, s)
        g.gain.linearRampToValueAtTime(v * 0.25, s + 0.05)
        g.gain.setValueAtTime(v * 0.25, s + 0.45)
        g.gain.exponentialRampToValueAtTime(0.001, s + 0.9)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(s); osc.stop(s + 0.9)
      })

      // Sparkle — notas altas aleatórias
      for (let i = 0; i < 5; i++) {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 1800 + Math.random() * 2400
        const s = t + 0.25 + Math.random() * 0.6
        g.gain.setValueAtTime(v * 0.15, s)
        g.gain.exponentialRampToValueAtTime(0.001, s + 0.08)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(s); osc.stop(s + 0.08)
      }
    } catch {}
  }

  // "Wah" descendente (trombone sintético) + ruído de plateia ("uuuh")
  playWrong() {
    try {
      const ctx = this.getCtx()
      ctx.resume()
      const t = ctx.currentTime
      const v = this.volume

      const osc = ctx.createOscillator()
      const filt = ctx.createBiquadFilter()
      const g = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(320, t)
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.75)
      filt.type = 'lowpass'
      filt.frequency.setValueAtTime(700, t)
      filt.frequency.exponentialRampToValueAtTime(180, t + 0.75)
      g.gain.setValueAtTime(v * 0.38, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.75)
      osc.connect(filt); filt.connect(g); g.connect(ctx.destination)
      osc.start(t); osc.stop(t + 0.75)

      // Ruído bandpass — murmúrio de plateia
      const bufSize = Math.floor(ctx.sampleRate * 0.55)
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buf
      const nf = ctx.createBiquadFilter()
      nf.type = 'bandpass'; nf.frequency.value = 280; nf.Q.value = 1.8
      const ng = ctx.createGain()
      ng.gain.setValueAtTime(v * 0.12, t)
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      src.connect(nf); nf.connect(ng); ng.connect(ctx.destination)
      src.start(t); src.stop(t + 0.55)
    } catch {}
  }

  // Dois buzzes curtos de "tempo esgotado"
  playTimeUp() {
    try {
      const ctx = this.getCtx()
      ctx.resume()
      const t = ctx.currentTime
      const v = this.volume

      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = 190
        const s = t + i * 0.22
        g.gain.setValueAtTime(v * 0.3, s)
        g.gain.setValueAtTime(v * 0.3, s + 0.14)
        g.gain.exponentialRampToValueAtTime(0.001, s + 0.17)
        osc.connect(g); g.connect(ctx.destination)
        osc.start(s); osc.stop(s + 0.17)
      }
    } catch {}
  }

  destroy() {
    this.ctx = null  // não fechar — contexto é compartilhado
  }
}
