'use client'
import type { AvatarConfig } from '@/types/game'

export type AvatarPose = 'idle' | 'correct' | 'wrong' | 'answering' | 'clown'

interface Props {
  config: AvatarConfig
  size?: number
  pose?: AvatarPose
}

/**
 * Personagem chibi (cabeça grande, corpo pequeno) com expressões por pose:
 *   idle     – olhos grandes azuis, sorriso fofo, braços laterais
 *   correct  – olhos brilhantes verdes, gargalhada, braços levantados, sparkles
 *   wrong    – olhos tristes com lágrima, boca trêmula, braços caídos, sweat drop
 *   answering– olhos meio fechados / pensando
 *   clown    – rosto triste igual a wrong + nariz vermelho de palhaço
 */
export function AvatarSvg({ config, size = 64, pose = 'idle' }: Props) {
  const { skinTone, hairStyle, hairColor, shirtColor, pantsColor } = config
  const ok      = pose === 'correct'
  const bad     = pose === 'wrong' || pose === 'clown'
  const thinking = pose === 'answering'
  const clown   = pose === 'clown'

  return (
    <svg
      viewBox="0 0 80 108"
      width={size}
      height={size * 1.35}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Sombra no chão */}
      <ellipse cx="40" cy="106" rx="18" ry="3" fill="rgba(0,0,0,0.12)" />

      {/* ─── Pernas ─── */}
      <rect x="27" y="78" width="11" height="24" rx="5.5" fill={pantsColor} />
      <rect x="42" y="78" width="11" height="24" rx="5.5" fill={pantsColor} />
      {/* Tênis */}
      <ellipse cx="32.5" cy="103" rx="9"   ry="4.5" fill="#222" />
      <ellipse cx="47.5" cy="103" rx="9"   ry="4.5" fill="#222" />
      <ellipse cx="32.5" cy="101" rx="6.5" ry="3"   fill="#3a3a3a" />
      <ellipse cx="47.5" cy="101" rx="6.5" ry="3"   fill="#3a3a3a" />

      {/* ─── Corpo ─── */}
      <rect x="23" y="50" width="34" height="28" rx="9" fill={shirtColor} />
      {/* Decote V */}
      <path d="M35,50 L40,57 L45,50" fill="rgba(0,0,0,0.10)" />
      {/* Linha de botões */}
      <line x1="40" y1="57" x2="40" y2="76" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />

      {/* ─── Braços (variam por pose) ─── */}
      {ok ? (
        /* Braços levantados comemorando */
        <>
          <g transform="rotate(-55, 27, 52)">
            <rect x="14" y="40" width="14" height="24" rx="7" fill={shirtColor} />
            <ellipse cx="21" cy="40" rx="7" ry="5.5" fill={skinTone} />
          </g>
          <g transform="rotate(55, 53, 52)">
            <rect x="52" y="40" width="14" height="24" rx="7" fill={shirtColor} />
            <ellipse cx="59" cy="40" rx="7" ry="5.5" fill={skinTone} />
          </g>
        </>
      ) : bad ? (
        /* Braços caídos, desanimados */
        <>
          <g transform="rotate(20, 27, 52)">
            <rect x="10" y="50" width="14" height="24" rx="7" fill={shirtColor} />
            <ellipse cx="17" cy="76" rx="7" ry="5.5" fill={skinTone} />
          </g>
          <g transform="rotate(-20, 53, 52)">
            <rect x="56" y="50" width="14" height="24" rx="7" fill={shirtColor} />
            <ellipse cx="63" cy="76" rx="7" ry="5.5" fill={skinTone} />
          </g>
        </>
      ) : thinking ? (
        /* Um braço no queixo (pensando) */
        <>
          <g transform="rotate(-8, 27, 52)">
            <rect x="10" y="50" width="14" height="18" rx="7" fill={shirtColor} />
            <ellipse cx="17" cy="68" rx="7" ry="5.5" fill={skinTone} />
          </g>
          <g transform="rotate(-30, 53, 52)">
            <rect x="56" y="44" width="14" height="20" rx="7" fill={shirtColor} />
            <ellipse cx="63" cy="44" rx="7" ry="5.5" fill={skinTone} />
          </g>
        </>
      ) : (
        /* Normal: levemente abertos para os lados */
        <>
          <g transform="rotate(-8, 27, 52)">
            <rect x="10" y="50" width="14" height="24" rx="7" fill={shirtColor} />
            <ellipse cx="17" cy="76" rx="7" ry="5.5" fill={skinTone} />
          </g>
          <g transform="rotate(8, 53, 52)">
            <rect x="56" y="50" width="14" height="24" rx="7" fill={shirtColor} />
            <ellipse cx="63" cy="76" rx="7" ry="5.5" fill={skinTone} />
          </g>
        </>
      )}

      {/* ─── Pescoço ─── */}
      <rect x="35" y="46" width="10" height="7" rx="3" fill={skinTone} />

      {/* ─── Cabeça ─── */}
      {/* Cabelo de trás (longo) */}
      {hairStyle === 'long' && (
        <>
          <rect x="18" y="20" width="7" height="30" rx="4" fill={hairColor} />
          <rect x="55" y="20" width="7" height="30" rx="4" fill={hairColor} />
        </>
      )}
      {/* Cabelo cacheado */}
      {hairStyle === 'curly' && (
        <>
          <circle cx="40" cy="8"  r="13" fill={hairColor} />
          <circle cx="26" cy="14" r="10" fill={hairColor} />
          <circle cx="54" cy="14" r="10" fill={hairColor} />
          <circle cx="20" cy="25" r="8"  fill={hairColor} />
          <circle cx="60" cy="25" r="8"  fill={hairColor} />
        </>
      )}
      {/* Orelhas (antes da cabeça) */}
      <ellipse cx="17" cy="27" rx="5"   ry="7"   fill={skinTone} />
      <ellipse cx="63" cy="27" rx="5"   ry="7"   fill={skinTone} />
      <ellipse cx="17" cy="27" rx="2.8" ry="4.5" fill="rgba(0,0,0,0.08)" />
      <ellipse cx="63" cy="27" rx="2.8" ry="4.5" fill="rgba(0,0,0,0.08)" />
      {/* Cabeça chibi (proporção grande) */}
      <circle cx="40" cy="26" r="23" fill={skinTone} />
      {/* Cabelo frente (curto/longo) */}
      {(hairStyle === 'short' || hairStyle === 'long') && (
        <path d="M17,24 Q17,3 40,3 Q63,3 63,24 Q56,12 40,12 Q24,12 17,24 Z" fill={hairColor} />
      )}

      {/* ─── Rosto ─── */}

      {/* Sobrancelhas */}
      {bad ? (
        /* Preocupadas (centro levantado) */
        <>
          <path d="M24,14 Q30,17 34,14" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M46,14 Q50,17 56,14" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : ok ? (
        /* Levantadas, felizes */
        <>
          <path d="M24,12 Q30,8 36,11" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M44,11 Q50,8 56,12" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : thinking ? (
        /* Uma sobrancelha levantada */
        <>
          <path d="M24,14 Q30,11 36,14" stroke={hairColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M44,12 Q50,9  56,12" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        /* Normal */
        <>
          <path d="M24,14 Q30,11 36,14" stroke={hairColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M44,14 Q50,11 56,14" stroke={hairColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Olhos */}
      {ok ? (
        /* Olhos brilhantes de alegria */
        <>
          <ellipse cx="30" cy="23" rx="6.5" ry="7.5" fill="white" />
          <ellipse cx="50" cy="23" rx="6.5" ry="7.5" fill="white" />
          <circle  cx="30" cy="24" r="5"    fill="#22c55e" />
          <circle  cx="50" cy="24" r="5"    fill="#22c55e" />
          <circle  cx="30" cy="24" r="3"    fill="#16a34a" />
          <circle  cx="50" cy="24" r="3"    fill="#16a34a" />
          <circle  cx="33" cy="20.5" r="2.2" fill="white" />
          <circle  cx="53" cy="20.5" r="2.2" fill="white" />
          <circle  cx="28" cy="26"   r="1.2" fill="rgba(255,255,255,0.6)" />
          <circle  cx="48" cy="26"   r="1.2" fill="rgba(255,255,255,0.6)" />
        </>
      ) : bad ? (
        /* Olhos tristes com lágrima */
        <>
          <ellipse cx="30" cy="24" rx="5.5" ry="6.5" fill="white" />
          <ellipse cx="50" cy="24" rx="5.5" ry="6.5" fill="white" />
          <circle  cx="30" cy="25" r="3.8"  fill="#6366f1" />
          <circle  cx="50" cy="25" r="3.8"  fill="#6366f1" />
          <circle  cx="30" cy="25" r="2.2"  fill="#12122a" />
          <circle  cx="50" cy="25" r="2.2"  fill="#12122a" />
          <circle  cx="31.5" cy="22.5" r="1.4" fill="white" />
          <circle  cx="51.5" cy="22.5" r="1.4" fill="white" />
          {/* Lágrimas */}
          <path d="M29,32 Q27,37 29,40 Q31,40 31,37 Q31,32 29,32 Z" fill="rgba(120,190,255,0.82)" />
          <path d="M51,32 Q49,37 51,40 Q53,40 53,37 Q53,32 51,32 Z" fill="rgba(120,190,255,0.82)" />
        </>
      ) : thinking ? (
        /* Olhos meio-fechados pensando */
        <>
          <ellipse cx="30" cy="24" rx="6" ry="5"   fill="white" />
          <ellipse cx="50" cy="24" rx="6" ry="5"   fill="white" />
          {/* Pálpebra caída */}
          <rect x="24" y="19" width="12" height="4" rx="2" fill={skinTone} />
          <rect x="44" y="19" width="12" height="4" rx="2" fill={skinTone} />
          <circle  cx="30" cy="25" r="3.5" fill="#5b6ef5" />
          <circle  cx="50" cy="25" r="3.5" fill="#5b6ef5" />
          <circle  cx="30" cy="25" r="2"   fill="#12122a" />
          <circle  cx="50" cy="25" r="2"   fill="#12122a" />
          <circle  cx="32" cy="23" r="1.2" fill="white" />
          <circle  cx="52" cy="23" r="1.2" fill="white" />
        </>
      ) : (
        /* Normal: olhos grandes fofinhos */
        <>
          <ellipse cx="30" cy="23" rx="6"   ry="7"   fill="white" />
          <ellipse cx="50" cy="23" rx="6"   ry="7"   fill="white" />
          <circle  cx="30" cy="24" r="4.5"  fill="#5b6ef5" />
          <circle  cx="50" cy="24" r="4.5"  fill="#5b6ef5" />
          <circle  cx="30" cy="24" r="2.8"  fill="#12122a" />
          <circle  cx="50" cy="24" r="2.8"  fill="#12122a" />
          <circle  cx="32.5" cy="21"  r="1.8" fill="white" />
          <circle  cx="52.5" cy="21"  r="1.8" fill="white" />
          <circle  cx="28"   cy="26.5" r="1"  fill="rgba(255,255,255,0.55)" />
          <circle  cx="48"   cy="26.5" r="1"  fill="rgba(255,255,255,0.55)" />
        </>
      )}

      {/* Bochecha (corada) */}
      <ellipse cx="19" cy="33" rx="6" ry="4" fill={ok ? 'rgba(255,100,130,0.35)' : 'rgba(255,100,130,0.18)'} />
      <ellipse cx="61" cy="33" rx="6" ry="4" fill={ok ? 'rgba(255,100,130,0.35)' : 'rgba(255,100,130,0.18)'} />

      {/* Nariz de palhaço 🔴 */}
      {clown && (
        <>
          <circle cx="40" cy="35" r="5.5" fill="#ef4444" />
          <circle cx="38.5" cy="33.5" r="1.8" fill="rgba(255,255,255,0.45)" />
        </>
      )}

      {/* Boca */}
      {ok ? (
        /* Gargalhada */
        <>
          <path d="M26,38 Q40,50 54,38" stroke="#2c1a0a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M27,38 Q40,48 53,38 Q40,43 27,38" fill="white" opacity="0.88" />
        </>
      ) : bad ? (
        /* Boca trêmula / franzida */
        <path d="M29,41 Q34,37 40,39 Q46,37 51,41" stroke="#2c1a0a" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : thinking ? (
        /* Boca de lado (hmm...) */
        <path d="M31,38 Q36,37 42,38 Q44,39 42,40 Q36,40 31,40 Q29,39 31,38" fill="#2c1a0a" opacity="0.25" />
      ) : (
        /* Sorriso fofinho */
        <>
          <path d="M29,37 Q40,46 51,37" stroke="#2c1a0a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M30,37 Q40,44 50,37 Q40,41 30,37" fill="white" opacity="0.7" />
        </>
      )}

      {/* ─── Efeitos extras ─── */}
      {ok && (
        /* Sparkles de celebração */
        <>
          {/* Sparkle 4-pontas esquerda */}
          <path d="M8,10 L9.5,7 L11,10 L9.5,13 Z" fill="#FFD700" opacity="0.9" />
          <line x1="6"  y1="10" x2="13" y2="10" stroke="#FFD700" strokeWidth="1" opacity="0.7" />
          <line x1="9.5" y1="6" x2="9.5" y2="14" stroke="#FFD700" strokeWidth="1" opacity="0.7" />
          {/* Sparkle 4-pontas direita */}
          <path d="M68,12 L70,9 L72,12 L70,15 Z" fill="#FFD700" opacity="0.85" />
          <line x1="65" y1="12" x2="75" y2="12" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
          <line x1="70" y1="7"  x2="70" y2="17" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
          {/* Bolhas pequenas */}
          <circle cx="5"  cy="22" r="1.8" fill="#ff6b35" opacity="0.85" />
          <circle cx="75" cy="18" r="1.8" fill="#a855f7" opacity="0.85" />
          <circle cx="4"  cy="32" r="1.2" fill="#22c55e" opacity="0.7" />
        </>
      )}
      {bad && (
        /* Gota de suor */
        <path d="M61,6 Q63,1 65,6 Q65,12 63,12 Q61,12 61,6 Z" fill="rgba(120,190,255,0.82)" />
      )}
    </svg>
  )
}
