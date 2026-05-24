// Singleton compartilhado entre páginas (persiste em navegação SPA do Next.js)
let _ctx: AudioContext | null = null

export function getAudioCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  return _ctx
}

// Chame em um gesto do usuário para desbloquear áudio e pré-carregar vozes
export function warmUpAudio(): void {
  if (typeof window === 'undefined') return
  try {
    const ctx = getAudioCtx()
    ctx.resume().then(() => {
      const buf = ctx.createBuffer(1, 1, ctx.sampleRate)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      src.start(0)
    })
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      u.rate = 10
      window.speechSynthesis.speak(u)
    }
  } catch {}
}
