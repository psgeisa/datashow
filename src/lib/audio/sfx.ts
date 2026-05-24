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

  // Torcida comemorando: ruído de multidão + palmas + "whooo" ascendente
  playCelebration() {
    try {
      const ctx = this.getCtx()
      ctx.resume()
      const t = ctx.currentTime
      const v = this.volume

      // ── Ruído de multidão: múltiplas camadas de largura de banda diferente ──
      const roarDuration = 2.2
      const freqBands = [
        { center: 400,  Q: 1.0, vol: 0.5 },
        { center: 900,  Q: 1.2, vol: 0.4 },
        { center: 1800, Q: 1.5, vol: 0.25 },
        { center: 3200, Q: 2.0, vol: 0.15 },
      ]

      for (const band of freqBands) {
        const bufSize = Math.floor(ctx.sampleRate * roarDuration)
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
        const src = ctx.createBufferSource()
        src.buffer = buf
        const bpf = ctx.createBiquadFilter()
        bpf.type = 'bandpass'
        bpf.frequency.value = band.center
        bpf.Q.value = band.Q
        const g = ctx.createGain()
        // Ataque rápido, sustain, decaimento lento
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(v * band.vol, t + 0.06)
        g.gain.setValueAtTime(v * band.vol * 0.85, t + 0.8)
        g.gain.exponentialRampToValueAtTime(0.001, t + roarDuration)
        src.connect(bpf); bpf.connect(g); g.connect(ctx.destination)
        src.start(t); src.stop(t + roarDuration)
      }

      // ── Palmas: rajadas de ruído curtas e repetidas ───────────────────────
      for (let i = 0; i < 8; i++) {
        const delay = i * 0.11 + (Math.random() * 0.04)
        const clapBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate)
        const cd = clapBuf.getChannelData(0)
        for (let j = 0; j < cd.length; j++) cd[j] = Math.random() * 2 - 1
        const cSrc = ctx.createBufferSource()
        cSrc.buffer = clapBuf
        const hpf = ctx.createBiquadFilter()
        hpf.type = 'highpass'; hpf.frequency.value = 1500
        const cg = ctx.createGain()
        cg.gain.setValueAtTime(v * 0.35, t + delay)
        cg.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.05)
        cSrc.connect(hpf); hpf.connect(cg); cg.connect(ctx.destination)
        cSrc.start(t + delay); cSrc.stop(t + delay + 0.05)
      }

      // ── "Whoooo" ascendente: coro de vozes subindo ───────────────────────
      const whooFreqs = [180, 220, 260, 310, 370]
      whooFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const og = ctx.createGain()
        osc.type = 'sine'
        const startTime = t + i * 0.03
        osc.frequency.setValueAtTime(freq, startTime)
        osc.frequency.linearRampToValueAtTime(freq * 1.5, startTime + 0.7)
        osc.frequency.setValueAtTime(freq * 1.5, startTime + 0.7)
        osc.frequency.linearRampToValueAtTime(freq * 1.3, startTime + 1.2)
        og.gain.setValueAtTime(0, startTime)
        og.gain.linearRampToValueAtTime(v * 0.12, startTime + 0.08)
        og.gain.setValueAtTime(v * 0.10, startTime + 0.9)
        og.gain.exponentialRampToValueAtTime(0.001, startTime + 1.4)
        osc.connect(og); og.connect(ctx.destination)
        osc.start(startTime); osc.stop(startTime + 1.4)
      })

      // ── Acorde de vitória: sino brilhante ────────────────────────────────
      const victoryNotes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
      victoryNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const og = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        const noteT = t + i * 0.06
        og.gain.setValueAtTime(0, noteT)
        og.gain.linearRampToValueAtTime(v * 0.18, noteT + 0.01)
        og.gain.exponentialRampToValueAtTime(0.001, noteT + 0.6)
        osc.connect(og); og.connect(ctx.destination)
        osc.start(noteT); osc.stop(noteT + 0.6)
      })
    } catch {}
  }

  // Plateia vaiando: rumor grave descendente + "boooo"
  playWrong() {
    try {
      const ctx = this.getCtx()
      ctx.resume()
      const t = ctx.currentTime
      const v = this.volume

      // Rumor grave
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

      // Vozes "boooo" descendentes
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
