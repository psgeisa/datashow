'use client'
import type { AvatarConfig } from '@/types/game'

interface Props {
  config: AvatarConfig
  size?: number
}

export function AvatarSvg({ config, size = 64 }: Props) {
  const { skinTone, hairStyle, hairColor, shirtColor, pantsColor } = config

  return (
    <svg viewBox="0 0 80 120" width={size} height={size * 1.5} style={{ display: 'block', overflow: 'visible' }}>

      {/* Cabelo traseiro — longo desce pelos lados */}
      {hairStyle === 'long' && <>
        <rect x="21" y="19" width="6" height="32" rx="4" fill={hairColor} />
        <rect x="53" y="19" width="6" height="32" rx="4" fill={hairColor} />
      </>}

      {/* Cabelo cacheado — círculos atrás da cabeça */}
      {hairStyle === 'curly' && <>
        <circle cx="40" cy="9"  r="11" fill={hairColor} />
        <circle cx="27" cy="13" r="9"  fill={hairColor} />
        <circle cx="53" cy="13" r="9"  fill={hairColor} />
        <circle cx="22" cy="23" r="7"  fill={hairColor} />
        <circle cx="58" cy="23" r="7"  fill={hairColor} />
      </>}

      {/* Pernas */}
      <rect x="27" y="83" width="11" height="33" rx="5" fill={pantsColor} />
      <rect x="42" y="83" width="11" height="33" rx="5" fill={pantsColor} />

      {/* Corpo */}
      <path d="M22,51 L27,47 L53,47 L58,51 L55,83 L25,83 Z" fill={shirtColor} />

      {/* Braços */}
      <rect x="10" y="49" width="13" height="28" rx="6" fill={shirtColor} />
      <rect x="57" y="49" width="13" height="28" rx="6" fill={shirtColor} />

      {/* Mãos */}
      <ellipse cx="16.5" cy="79" rx="6"   ry="5.5" fill={skinTone} />
      <ellipse cx="63.5" cy="79" rx="6"   ry="5.5" fill={skinTone} />

      {/* Pescoço */}
      <rect x="36" y="40" width="8" height="9" fill={skinTone} />

      {/* Cabeça */}
      <circle cx="40" cy="24" r="18" fill={skinTone} />

      {/* Cabelo dianteiro — curto e longo */}
      {(hairStyle === 'short' || hairStyle === 'long') && (
        <path d="M22,22 Q22,6 40,6 Q58,6 58,22 Q52,12 40,12 Q28,12 22,22 Z" fill={hairColor} />
      )}

      {/* Rosto */}
      {/* Olhos brancos */}
      <ellipse cx="33" cy="22" rx="3"   ry="3.2" fill="white" />
      <ellipse cx="47" cy="22" rx="3"   ry="3.2" fill="white" />
      {/* Pupilas */}
      <circle  cx="33.5" cy="22.5" r="1.9" fill="#12122a" />
      <circle  cx="47.5" cy="22.5" r="1.9" fill="#12122a" />
      {/* Brilho */}
      <circle  cx="34.3" cy="21.4" r="0.75" fill="white" />
      <circle  cx="48.3" cy="21.4" r="0.75" fill="white" />
      {/* Boca */}
      <path d="M34,32 Q40,37 46,32" stroke="rgba(0,0,0,0.28)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}
