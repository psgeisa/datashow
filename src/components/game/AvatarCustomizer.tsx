'use client'
import { AvatarSvg } from './AvatarSvg'
import type { AvatarConfig } from '@/types/game'

export const SKIN_TONES   = ['#FFE0C0', '#F5C5A3', '#E8A87C', '#C68642', '#8D5524', '#4A2412']
export const HAIR_COLORS  = ['#1a1a1a', '#6B3A2A', '#D4A017', '#9B2335', '#9E9E9E', '#1565C0']
export const SHIRT_COLORS = ['#0097A7', '#7B1FA2', '#D32F2F', '#388E3C', '#F57C00', '#455A64']
export const PANTS_COLORS = ['#1A237E', '#212121', '#4E342E', '#556B2F', '#37474F', '#0D47A1']

export const HAIR_STYLES = [
  { id: 'bald',   label: 'Careca'   },
  { id: 'short',  label: 'Curto'    },
  { id: 'long',   label: 'Longo'    },
  { id: 'curly',  label: 'Cacheado' },
] as const

export const DEFAULT_AVATAR: AvatarConfig = {
  skinTone:   '#F5C5A3',
  hairStyle:  'short',
  hairColor:  '#1a1a1a',
  shirtColor: '#0097A7',
  pantsColor: '#1A237E',
}

function Swatches({ colors, value, onSelect }: { colors: string[]; value: string; onSelect: (c: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onSelect(c)}
          className="w-7 h-7 rounded-full transition-all"
          style={{
            background: c,
            outline: value === c ? '3px solid #00d4ff' : '2px solid rgba(255,255,255,0.18)',
            outlineOffset: '2px',
            transform: value === c ? 'scale(1.2)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  )
}

interface Props {
  value: AvatarConfig
  onChange: (config: AvatarConfig) => void
}

export function AvatarCustomizer({ value, onChange }: Props) {
  const set = (patch: Partial<AvatarConfig>) => onChange({ ...value, ...patch })

  return (
    <div className="flex gap-4 items-start">
      {/* Preview */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
        <div className="w-20 h-[7.5rem] flex items-center justify-center rounded-2xl bg-white/5 border border-white/10">
          <AvatarSvg config={value} size={60} />
        </div>
        <p className="text-xs text-gray-600">Preview</p>
      </div>

      {/* Controles */}
      <div className="flex-1 space-y-3 min-w-0">

        <div>
          <p className="text-xs text-gray-400 font-medium mb-1.5">Pele</p>
          <Swatches colors={SKIN_TONES} value={value.skinTone} onSelect={c => set({ skinTone: c })} />
        </div>

        <div>
          <p className="text-xs text-gray-400 font-medium mb-1.5">Cabelo</p>
          <div className="flex gap-1.5 flex-wrap">
            {HAIR_STYLES.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => set({ hairStyle: s.id })}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background:   value.hairStyle === s.id ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.05)',
                  border:       `1px solid ${value.hairStyle === s.id ? '#00d4ff' : 'rgba(255,255,255,0.1)'}`,
                  color:        value.hairStyle === s.id ? '#00d4ff' : '#9ca3af',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {value.hairStyle !== 'bald' && (
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1.5">Cor do Cabelo</p>
            <Swatches colors={HAIR_COLORS} value={value.hairColor} onSelect={c => set({ hairColor: c })} />
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 font-medium mb-1.5">Camiseta</p>
          <Swatches colors={SHIRT_COLORS} value={value.shirtColor} onSelect={c => set({ shirtColor: c })} />
        </div>

        <div>
          <p className="text-xs text-gray-400 font-medium mb-1.5">Calça</p>
          <Swatches colors={PANTS_COLORS} value={value.pantsColor} onSelect={c => set({ pantsColor: c })} />
        </div>
      </div>
    </div>
  )
}
