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

  // Plateia comemorando: ruído de torcida + tons ascendentes
  playCelebration() {
    try {
      const ctx = this.getCtx()
      ctx.resume()
      const t = ctx.currentTime
      const v = this.volume

      // Ruído de torcida (band-pass centrado na frequência de voz humana)
      const bufSize = Math.floor(ctx.sampleRate * 1.4)
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buf
      const bpf = ctx.createBiquadFilter()
      bpf.type = 'bandpass'
      bpf.frequency.setValueAtTime(300, t)
      bpf.frequency.linearRampToValueAtTime(600, t + 0.2)
      bpf.Q.value = 1.2
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(v * 0.55, t + 0.08)
      g.gain.setValueAtTime(v * 0.45, t + 0.9)
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
      src.connect(bpf); bpf.connect(g); g.connect(ctx.destination)
      src.start(t); src.stop(t + 1.4)

      // Burst agudo de excitação (assobios e gritos altos)
      const bufH = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate)
      const dh = bufH.getChannelData(0)
      for (let i = 0; i < dh.length; i++) dh[i] = Math.random() * 2 - 1
      const srcH = ctx.createBufferSource()
      srcH.buffer = bufH
      const hpf = ctx.createBiquadFilter()
      hpf.type = 'highpass'; hpf.frequency.value = 2500
      const gH = ctx.createGain()
      gH.gain.setValueAtTime(v * 0.2, t)
      gH.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      srcH.connect(hpf); hpf.connect(gH); gH.connect(ctx.destination)
      srcH.start(t); srcH.stop(t + 0.25)

      // "Whoooo" — múltiplas vozes ascendentes em coro
      ;[200, 250, 310, 390].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const og = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t + i * 0.04)
        osc.frequency.linearRampToValueAtTime(freq * 1.2, t + 0.6)
        og.gain.setValueAtTime(0, t + i * 0.04)
        og.gain.linearRampToValueAtTime(v * 0.1, t + i * 0.04 + 0.06)
        og.gain.setValueAtTime(v * 0.1, t + 0.7)
        og.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
        osc.connect(og); og.connect(ctx.destination)
        osc.start(t + i * 0.04); osc.stop(t + 1.1)
      })
    } catch {}
  }

  // Plateia vaiando: ruído grave descendente + múltiplos "boooo"
  playWrong() {
    try {
      const ctx = this.getCtx()
      ctx.resume()
      const t = ctx.currentTime
      const v = this.volume

      // Rumor grave da plateia
      const bufSize = Math.floor(ctx.sampleRate * 1.0)
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
      const src = ctx.createBufferSource()
      src.buffer = buf
      const bpf = ctx.createBiquadFilter()
      bpf.type = 'bandpass'
      bpf.frequency.setValueAtTime(220, t)
      bpf.frequency.exponentialRampToValueAtTime(110, t + 0.9)
      bpf.Q.value = 2.5
      const g = ctx.createGain()
      g.gain.setValueAtTime(v * 0.45, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.0)
      src.connect(bpf); bpf.connect(g); g.connect(ctx.destination)
      src.start(t); src.stop(t + 1.0)

      // Vozes "boooo" descendentes em uníssono
      ;[120, 100, 140, 90].forEach((pitch, i) => {
        const osc = ctx.createOscillator()
        const lp = ctx.createBiquadFilter()
        const og = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(pitch, t + i * 0.03)
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.55, t + 0.9)
        lp.type = 'lowpass'; lp.frequency.value = 600
        og.gain.setValueAtTime(v * 0.1, t + i * 0.03)
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
        osc.connect(lp); lp.connect(og); og.connect(ctx.destination)
        osc.start(t + i * 0.03); osc.stop(t + 0.9)
      })
    } catch {}
  }

  // Dois buzzes de "tempo esgotado"
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
    this.ctx = null
  }
}
