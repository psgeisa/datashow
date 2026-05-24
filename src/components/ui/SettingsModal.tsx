'use client'
import { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'

export function SettingsButton() {
  const [open, setOpen] = useState(false)
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
            className="w-full max-w-xs rounded-2xl p-6 space-y-5 animate-slide-up"
            style={{ background: '#0d0d2e', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-white">⚙️ Configurações</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
              >×</button>
            </div>

            {/* Volume */}
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

            {/* Mute */}
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
        </div>
      )}
    </>
  )
}
