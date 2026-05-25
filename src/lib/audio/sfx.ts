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

  // Risos de alegria: "ha ha ha" + palmas + sino de vitória
  playCelebration() {
    try {
      const ctx = this.getCtx()
      ctx.resume()
      const t = ctx.currentTime
      const v = this.volume

      // ── "Ha ha ha" — ruído periódico imitando gargalhadas ────────────────
      // 6 "ha"s a cada 130ms em 4 camadas de formantes diferentes
      const laughCount  = 6
      const laughGap    = 0.13
      const laughTotal  = laughCount * laughGap + 0.12
      const laughVoices = [
        { freq: 700,  Q: 3.5, vol: 0.55 },
        { freq: 1050, Q: 3.0, vol: 0.40 },
        { freq: 1400, Q: 2.5, vol: 0.28 },
        { freq: 2200, Q: 2.0, vol: 0.18 },
      ]
      for (const voice of laughVoices) {
        const bufSize = Math.floor(ctx.sampleRate * laughTotal)
        const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate)
        const data    = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
        const src = ctx.createBufferSource()
        src.buffer = buf
        const bpf = ctx.createBiquadFilter()
        bpf.type = 'bandpass'; bpf.frequency.value = voice.freq; bpf.Q.value = voice.Q
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, t)
        for (let i = 0; i < laughCount; i++) {
          const ht = t + i * laughGap
          g.gain.setValueAtTime(0,            ht)
          g.gain.linearRampToValueAtTime(v * voice.vol, ht + 0.018) // ataque rápido
          g.gain.exponentialRampToValueAtTime(0.001,    ht + 0.105) // decaimento
        }
        src.connect(bpf); bpf.connect(g); g.connect(ctx.destination)
        src.start(t); src.stop(t + laughTotal)
      }

      // ── Palmas leves em cima das gargalhadas ─────────────────────────────
      for (let i = 0; i < 7; i++) {
        const delay    = i * 0.125 + (i % 2 === 0 ? 0 : 0.03)
        const clapBuf  = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.055), ctx.sampleRate)
        const cd       = clapBuf.getChannelData(0)
        for (let j = 0; j < cd.length; j++) cd[j] = Math.random() * 2 - 1
        const cSrc     = ctx.createBufferSource()
        cSrc.buffer    = clapBuf
        const hpf      = ctx.createBiquadFilter()
        hpf.type       = 'highpass'; hpf.frequency.value = 1800
        const cg       = ctx.createGain()
        cg.gain.setValueAtTime(v * 0.28, t + delay)
        cg.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.055)
        cSrc.connect(hpf); hpf.connect(cg); cg.connect(ctx.destination)
        cSrc.start(t + delay); cSrc.stop(t + delay + 0.06)
      }

      // ── "Ahhhh!" ascendente depois das gargalhadas ───────────────────────
      ;[200, 260, 320, 390].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const og  = ctx.createGain()
        osc.type  = 'sine'
        const st  = t + laughCount * laughGap - 0.05 + i * 0.04
        osc.frequency.setValueAtTime(freq,        st)
        osc.frequency.linearRampToValueAtTime(freq * 1.45, st + 0.55)
        og.gain.setValueAtTime(0,          st)
        og.gain.linearRampToValueAtTime(v * 0.13, st + 0.09)
        og.gain.exponentialRampToValueAtTime(0.001, st + 0.75)
        osc.connect(og); og.connect(ctx.destination)
        osc.start(st); osc.stop(st + 0.75)
      })

      // ── Sino de vitória ───────────────────────────────────────────────────
      ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc  = ctx.createOscillator()
        const og   = ctx.createGain()
        osc.type   = 'sine'
        osc.frequency.value = freq
        const noteT = t + i * 0.07
        og.gain.setValueAtTime(0,          noteT)
        og.gain.linearRampToValueAtTime(v * 0.20, noteT + 0.01)
        og.gain.exponentialRampToValueAtTime(0.001, noteT + 0.65)
        osc.connect(og); og.connect(ctx.destination)
        osc.start(noteT); osc.stop(noteT + 0.65)
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
