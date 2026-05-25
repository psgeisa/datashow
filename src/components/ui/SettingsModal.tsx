'use client'
import { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'

export function SettingsButton() {
  const [open, setOpen] = useState(false)
  const [tab, setTab]   = useState<'audio' | 'scoring'>('audio')
  const { volume, muted, setVolume, toggleMute } = useSettings()

  return (
    <>
      {/* Botão flutuante fixo */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        title="Configurações"
      >
        ⚙️
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-4 animate-slide-up"
            style={{ background: '#0d0d2e', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white">⚙️ Configurações</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
              >×</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {(['audio', 'scoring'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: tab === t ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${tab === t ? '#00d4ff' : 'rgba(255,255,255,0.08)'}`,
                    color: tab === t ? '#00d4ff' : '#9ca3af',
                  }}
                >
                  {t === 'audio' ? '🎵 Áudio' : '🏆 Pontuação'}
                </button>
              ))}
            </div>

            {/* ── Áudio tab ────────────────────────────────────────────── */}
            {tab === 'audio' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-400 font-medium">🎵 Volume da Música</label>
                    <span className="text-sm font-black" style={{ color: '#00d4ff' }}>
                      {muted ? '🔇' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0} max={1} step={0.01}
                    value={volume}
                    onChange={e => setVolume(parseFloat(e.target.value))}
                    disabled={muted}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-30"
                    style={{ accentColor: '#00d4ff' }}
                  />
                </div>
                <button
                  onClick={toggleMute}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: muted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${muted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: muted ? '#ef4444' : '#9ca3af',
                  }}
                >
                  {muted ? '🔇 Ativar Som' : '🔊 Silenciar'}
                </button>
              </div>
            )}

            {/* ── Pontuação tab ─────────────────────────────────────────── */}
            {tab === 'scoring' && (
              <div className="space-y-3 text-sm">
                {/* Base */}
                <div className="p-3 rounded-xl space-y-1" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <p className="font-black text-cyan-300">⚡ Pontos Base</p>
                  <p className="text-gray-400">Resposta correta = <span className="text-white font-bold">100 pts</span></p>
                  <p className="text-gray-400">Resposta errada = <span className="text-red-400 font-bold">0 pts</span></p>
                </div>

                {/* Bônus de velocidade */}
                <div className="p-3 rounded-xl space-y-1" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <p className="font-black text-green-400">🚀 Bônus de Velocidade</p>
                  <p className="text-gray-400">Quanto mais rápido, mais pontos extras.</p>
                  <p className="text-gray-400 text-xs">Calculado pelo tempo restante ao responder.</p>
                </div>

                {/* Sequência */}
                <div className="p-3 rounded-xl space-y-1" style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)' }}>
                  <p className="font-black text-orange-400">🔥 Multiplicador de Sequência</p>
                  <div className="space-y-0.5 text-gray-400">
                    <p>2-4 acertos seguidos → <span className="text-white font-bold">×1.5</span></p>
                    <p>5-9 acertos seguidos → <span className="text-white font-bold">×2.0</span></p>
                    <p>10+ acertos seguidos → <span className="text-white font-bold">×3.0</span></p>
                  </div>
                  <p className="text-xs text-gray-500">Errar a sequência reseta o multiplicador.</p>
                </div>

                {/* Estrutura */}
                <div className="p-3 rounded-xl space-y-1" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <p className="font-black text-purple-400">🎮 Estrutura do Jogo</p>
                  <p className="text-gray-400">4 fases × 10 perguntas = <span className="text-white font-bold">40 perguntas</span></p>
                  <p className="text-gray-400">Cada fase tem tema escolhido por um jogador.</p>
                  <p className="text-gray-400">Ranking da fase + placar geral ao final de cada fase.</p>
                </div>

                {/* Timer dinâmico */}
                <div className="p-3 rounded-xl space-y-1" style={{ background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.2)' }}>
                  <p className="font-black text-yellow-400">⏱️ Timer Dinâmico</p>
                  <p className="text-gray-400">Perguntas curtas → <span className="text-white font-bold">12s</span></p>
                  <p className="text-gray-400">Perguntas longas → <span className="text-white font-bold">22s</span></p>
                  <p className="text-gray-400">Com código → <span className="text-white font-bold">32s</span></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
