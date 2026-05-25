'use client'
import type { AvatarConfig } from '@/types/game'

export type AvatarPose =
  | 'idle'       // normal, braços levemente abertos
  | 'correct'    // braços levantados, olhos brilhantes
  | 'wrong'      // braços caídos, triste
  | 'clown'      // igual wrong + nariz vermelho
  | 'answering'  // pensativo (braço no queixo)
  | 'doubt'      // igual answering + balão "?"
  | 'satisfied'  // satisfeito, braços cruzados levemente
  | 'figuinha'   // um braço levantado comemorando

interface Props {
  config: AvatarConfig
  size?: number
  pose?: AvatarPose
  donkeyStage?: 0 | 1 | 2 | 3 | 4
}

/**
 * Personagem chibi com sistema de degradação por erros consecutivos:
 *   donkeyStage 0 → personagem normal
 *   donkeyStage 1 → + nariz vermelho
 *   donkeyStage 2 → + orelhas de burro (cinza de burro)
 *   donkeyStage 3+ → vira o burro completo (mantém cores do avatar)
 *
 * Poses extras:
 *   doubt     → olhos pensativos + balão "?" (enquanto não respondeu)
 *   satisfied → sorriso satisfeito, braços cruzados (resposta enviada)
 *   figuinha  → braço levantado, expressão animada (resposta enviada)
 */
export function AvatarSvg({ config, size = 64, pose = 'idle', donkeyStage = 0 }: Props) {
  const { skinTone, hairStyle, hairColor, shirtColor, pantsColor } = config

  // ─── Stage 3+: transforma em burro completo ────────────────────────────────
  if (donkeyStage >= 3) {
    return <DonkeyAvatar config={config} size={size} />
  }

  // ─── Derivações de estado ───────────────────────────────────────────────────
  const ok        = pose === 'correct'
  const bad       = pose === 'wrong' || pose === 'clown'
  const thinking  = pose === 'answering' || pose === 'doubt'
  const joyful    = pose === 'figuinha'     // braço levantado
  // satisfied e idle usam expressão base normal

  const showClownNose  = donkeyStage >= 1 || pose === 'clown'
  const showDonkeyEars = donkeyStage >= 2

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
      <path d="M35,50 L40,57 L45,50" fill="rgba(0,0,0,0.10)" />
      <line x1="40" y1="57" x2="40" y2="76" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />

      {/* ─── Braços (variam por pose) ───────────────────────────────────────── */}
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
      ) : joyful ? (
        /* Figuinha: um braço levantado comemorando, outro na cintura */
        <>
          <g transform="rotate(-45, 27, 52)">
            <rect x="12" y="40" width="14" height="22" rx="7" fill={shirtColor} />
            <ellipse cx="19" cy="40" rx="7" ry="5.5" fill={skinTone} />
          </g>
          <g transform="rotate(12, 53, 52)">
            <rect x="56" y="50" width="14" height="20" rx="7" fill={shirtColor} />
            <ellipse cx="63" cy="70" rx="7" ry="5.5" fill={skinTone} />
          </g>
        </>
      ) : pose === 'satisfied' ? (
        /* Satisfied: braços semi-cruzados, postura confiante */
        <>
          <g transform="rotate(-18, 27, 52)">
            <rect x="10" y="48" width="14" height="20" rx="7" fill={shirtColor} />
            <ellipse cx="17" cy="68" rx="7" ry="5.5" fill={skinTone} />
          </g>
          <g transform="rotate(18, 53, 52)">
            <rect x="56" y="48" width="14" height="20" rx="7" fill={shirtColor} />
            <ellipse cx="63" cy="68" rx="7" ry="5.5" fill={skinTone} />
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

      {/* ─── Cabeça (camadas em ordem) ─── */}

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

      {/* Orelhas humanas (antes da cabeça) */}
      <ellipse cx="17" cy="27" rx="5"   ry="7"   fill={skinTone} />
      <ellipse cx="63" cy="27" rx="5"   ry="7"   fill={skinTone} />
      <ellipse cx="17" cy="27" rx="2.8" ry="4.5" fill="rgba(0,0,0,0.08)" />
      <ellipse cx="63" cy="27" rx="2.8" ry="4.5" fill="rgba(0,0,0,0.08)" />

      {/* ─── Orelhas de burro (Stage 2+, desenhadas antes da cabeça) ──────────── */}
      {showDonkeyEars && (
        <>
          {/* Orelha esquerda — longa e pontuda, cinza de burro */}
          <path d="M 18,22 Q 12,7 14,-3 Q 19,-10 25,-3 Q 28,7 27,20" fill="#8a8fa8" />
          <path d="M 19,20 Q 14,8 16,0 Q 20,-6 23,0 Q 25,9 24,19" fill="#c4a0a8" opacity="0.85" />
          {/* Orelha direita — espelho */}
          <path d="M 62,22 Q 68,7 66,-3 Q 61,-10 55,-3 Q 52,7 53,20" fill="#8a8fa8" />
          <path d="M 61,20 Q 66,8 64,0 Q 60,-6 57,0 Q 55,9 56,19" fill="#c4a0a8" opacity="0.85" />
        </>
      )}

      {/* Cabeça chibi (proporção grande) */}
      <circle cx="40" cy="26" r="23" fill={skinTone} />

      {/* Cabelo frente (curto/longo) */}
      {(hairStyle === 'short' || hairStyle === 'long') && (
        <path d="M17,24 Q17,3 40,3 Q63,3 63,24 Q56,12 40,12 Q24,12 17,24 Z" fill={hairColor} />
      )}

      {/* ─── Rosto ─── */}

      {/* Sobrancelhas */}
      {bad ? (
        <>
          <path d="M24,14 Q30,17 34,14" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M46,14 Q50,17 56,14" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : ok ? (
        <>
          <path d="M24,12 Q30,8 36,11" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M44,11 Q50,8 56,12" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : thinking ? (
        /* Uma sobrancelha levantada (dúvida) */
        <>
          <path d="M24,14 Q30,11 36,14" stroke={hairColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M44,12 Q50,9  56,12" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : joyful ? (
        /* Sobrancelhas arqueadas animadas */
        <>
          <path d="M24,11 Q30,7 36,10" stroke={hairColor} strokeWidth="2.3" fill="none" strokeLinecap="round" />
          <path d="M44,10 Q50,7 56,11" stroke={hairColor} strokeWidth="2.3" fill="none" strokeLinecap="round" />
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
          <path d="M29,32 Q27,37 29,40 Q31,40 31,37 Q31,32 29,32 Z" fill="rgba(120,190,255,0.82)" />
          <path d="M51,32 Q49,37 51,40 Q53,40 53,37 Q53,32 51,32 Z" fill="rgba(120,190,255,0.82)" />
        </>
      ) : thinking ? (
        /* Olhos meio-fechados pensando */
        <>
          <ellipse cx="30" cy="24" rx="6" ry="5"   fill="white" />
          <ellipse cx="50" cy="24" rx="6" ry="5"   fill="white" />
          <rect x="24" y="19" width="12" height="4" rx="2" fill={skinTone} />
          <rect x="44" y="19" width="12" height="4" rx="2" fill={skinTone} />
          <circle  cx="30" cy="25" r="3.5" fill="#5b6ef5" />
          <circle  cx="50" cy="25" r="3.5" fill="#5b6ef5" />
          <circle  cx="30" cy="25" r="2"   fill="#12122a" />
          <circle  cx="50" cy="25" r="2"   fill="#12122a" />
          <circle  cx="32" cy="23" r="1.2" fill="white" />
          <circle  cx="52" cy="23" r="1.2" fill="white" />
        </>
      ) : joyful ? (
        /* Olhos meio fechados, expressão animada/confiante */
        <>
          <ellipse cx="30" cy="24" rx="6" ry="5.5" fill="white" />
          <ellipse cx="50" cy="24" rx="6" ry="5.5" fill="white" />
          <circle  cx="30" cy="25" r="4"  fill="#5b6ef5" />
          <circle  cx="50" cy="25" r="4"  fill="#5b6ef5" />
          <circle  cx="30" cy="25" r="2.4" fill="#12122a" />
          <circle  cx="50" cy="25" r="2.4" fill="#12122a" />
          <circle  cx="32" cy="22.5" r="1.6" fill="white" />
          <circle  cx="52" cy="22.5" r="1.6" fill="white" />
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

      {/* Bochecha */}
      <ellipse cx="19" cy="33" rx="6" ry="4" fill={ok || joyful ? 'rgba(255,100,130,0.35)' : 'rgba(255,100,130,0.18)'} />
      <ellipse cx="61" cy="33" rx="6" ry="4" fill={ok || joyful ? 'rgba(255,100,130,0.35)' : 'rgba(255,100,130,0.18)'} />

      {/* Nariz de palhaço (Stage 1+ OU pose clown) */}
      {showClownNose && (
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
        /* Franzida / trêmula */
        <path d="M29,41 Q34,37 40,39 Q46,37 51,41" stroke="#2c1a0a" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : thinking ? (
        /* Boca de lado (hmm...) */
        <path d="M31,38 Q36,37 42,38 Q44,39 42,40 Q36,40 31,40 Q29,39 31,38" fill="#2c1a0a" opacity="0.25" />
      ) : joyful ? (
        /* Sorriso animado meio aberto */
        <>
          <path d="M28,38 Q40,48 52,38" stroke="#2c1a0a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M29,38 Q40,46 51,38 Q40,42 29,38" fill="white" opacity="0.7" />
        </>
      ) : pose === 'satisfied' ? (
        /* Sorriso de canto satisfeito */
        <path d="M31,38 Q36,43 43,40 Q47,38 49,37" stroke="#2c1a0a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : (
        /* Sorriso fofinho (idle) */
        <>
          <path d="M29,37 Q40,46 51,37" stroke="#2c1a0a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M30,37 Q40,44 50,37 Q40,41 30,37" fill="white" opacity="0.7" />
        </>
      )}

      {/* ─── Efeitos extras ─── */}
      {ok && (
        <>
          <path d="M8,10 L9.5,7 L11,10 L9.5,13 Z" fill="#FFD700" opacity="0.9" />
          <line x1="6"  y1="10" x2="13" y2="10" stroke="#FFD700" strokeWidth="1" opacity="0.7" />
          <line x1="9.5" y1="6" x2="9.5" y2="14" stroke="#FFD700" strokeWidth="1" opacity="0.7" />
          <path d="M68,12 L70,9 L72,12 L70,15 Z" fill="#FFD700" opacity="0.85" />
          <line x1="65" y1="12" x2="75" y2="12" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
          <line x1="70" y1="7"  x2="70" y2="17" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
          <circle cx="5"  cy="22" r="1.8" fill="#ff6b35" opacity="0.85" />
          <circle cx="75" cy="18" r="1.8" fill="#a855f7" opacity="0.85" />
          <circle cx="4"  cy="32" r="1.2" fill="#22c55e" opacity="0.7" />
        </>
      )}
      {bad && (
        <path d="M61,6 Q63,1 65,6 Q65,12 63,12 Q61,12 61,6 Z" fill="rgba(120,190,255,0.82)" />
      )}
      {joyful && (
        /* Estrelinhas de animação */
        <>
          <circle cx="8"  cy="14" r="2"   fill="#FFD700" opacity="0.85" />
          <circle cx="5"  cy="22" r="1.5" fill="#ff6b35" opacity="0.75" />
          <circle cx="12" cy="8"  r="1.2" fill="#a855f7" opacity="0.8" />
        </>
      )}

      {/* Balão de dúvida "?" para pose doubt */}
      {pose === 'doubt' && (
        <>
          {/* Bolha */}
          <ellipse cx="62" cy="7" rx="10" ry="8" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <polygon points="55,12 52,18 58,14" fill="rgba(255,255,255,0.13)" />
          {/* Ponto de interrogação */}
          <text x="62" y="12" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="11" fontWeight="bold" fontFamily="Arial">?</text>
        </>
      )}
    </svg>
  )
}

// ─── Burro completo (Stage 4) ────────────────────────────────────────────────
function DonkeyAvatar({ config, size }: { config: AvatarConfig; size: number }) {
  const { skinTone, hairColor, shirtColor, pantsColor } = config

  return (
    <svg
      viewBox="0 0 80 108"
      width={size}
      height={size * 1.35}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Sombra */}
      <ellipse cx="40" cy="106" rx="18" ry="3" fill="rgba(0,0,0,0.12)" />

      {/* Rabo (antes do corpo) */}
      <path
        d="M 60,62 C 70,55 76,62 73,72 C 70,82 62,88 58,80"
        stroke={hairColor} strokeWidth="5" strokeLinecap="round" fill="none"
      />
      <ellipse cx="57.5" cy="80" rx="5.5" ry="4" fill={hairColor} />

      {/* Pernas */}
      <rect x="27" y="78" width="11" height="24" rx="5.5" fill={pantsColor} />
      <rect x="42" y="78" width="11" height="24" rx="5.5" fill={pantsColor} />
      {/* Cascos */}
      <ellipse cx="32.5" cy="103" rx="9"   ry="4.5" fill="#1a1a1a" />
      <ellipse cx="47.5" cy="103" rx="9"   ry="4.5" fill="#1a1a1a" />
      <ellipse cx="32.5" cy="101" rx="6.5" ry="3"   fill="#2e2e2e" />
      <ellipse cx="47.5" cy="101" rx="6.5" ry="3"   fill="#2e2e2e" />

      {/* Corpo */}
      <rect x="23" y="50" width="34" height="28" rx="9" fill={shirtColor} />
      <path d="M35,50 L40,57 L45,50" fill="rgba(0,0,0,0.10)" />
      <line x1="40" y1="57" x2="40" y2="76" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />

      {/* Braços caídos (triste) */}
      <g transform="rotate(20, 27, 52)">
        <rect x="10" y="50" width="14" height="24" rx="7" fill={shirtColor} />
        <ellipse cx="17" cy="76" rx="7" ry="5.5" fill={skinTone} />
      </g>
      <g transform="rotate(-20, 53, 52)">
        <rect x="56" y="50" width="14" height="24" rx="7" fill={shirtColor} />
        <ellipse cx="63" cy="76" rx="7" ry="5.5" fill={skinTone} />
      </g>

      {/* Pescoço */}
      <rect x="35" y="46" width="10" height="7" rx="3" fill={skinTone} />

      {/* ── Orelhas de burro longas (desenhadas ANTES da cabeça) ────────────── */}
      {/* Esquerda — cinza de burro */}
      <path d="M 18,22 Q 12,7 14,-3 Q 19,-10 25,-3 Q 28,7 27,20" fill="#8a8fa8" />
      <path d="M 19,20 Q 14,8 16,0 Q 20,-6 23,0 Q 25,9 24,19"    fill="#c4a0a8" opacity="0.85" />
      {/* Direita */}
      <path d="M 62,22 Q 68,7 66,-3 Q 61,-10 55,-3 Q 52,7 53,20" fill="#8a8fa8" />
      <path d="M 61,20 Q 66,8 64,0 Q 60,-6 57,0 Q 55,9 56,19"    fill="#c4a0a8" opacity="0.85" />

      {/* Cabeça */}
      <circle cx="40" cy="26" r="23" fill={skinTone} />

      {/* Juba / crina no topo (hairColor) */}
      <path
        d="M 23,14 Q 28,7 32,10 Q 36,4 40,7 Q 44,4 48,10 Q 52,7 57,14"
        stroke={hairColor} strokeWidth="5.5" strokeLinecap="round" fill="none"
      />

      {/* Focinho / foçinho arredondado */}
      <ellipse cx="40" cy="37" rx="10" ry="7" fill={skinTone} />
      <ellipse cx="40" cy="37" rx="10" ry="7" fill="rgba(255,210,190,0.35)" />

      {/* Sobrancelhas preocupadas */}
      <path d="M24,14 Q30,17 34,14" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M46,14 Q50,17 56,14" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Olhos tristes com lágrimas */}
      <ellipse cx="30" cy="24" rx="5.5" ry="6.5" fill="white" />
      <ellipse cx="50" cy="24" rx="5.5" ry="6.5" fill="white" />
      <circle  cx="30" cy="25" r="3.8"  fill="#6366f1" />
      <circle  cx="50" cy="25" r="3.8"  fill="#6366f1" />
      <circle  cx="30" cy="25" r="2.2"  fill="#12122a" />
      <circle  cx="50" cy="25" r="2.2"  fill="#12122a" />
      <circle  cx="31.5" cy="22.5" r="1.4" fill="white" />
      <circle  cx="51.5" cy="22.5" r="1.4" fill="white" />
      <path d="M29,32 Q27,37 29,40 Q31,40 31,37 Q31,32 29,32 Z" fill="rgba(120,190,255,0.82)" />
      <path d="M51,32 Q49,37 51,40 Q53,40 53,37 Q53,32 51,32 Z" fill="rgba(120,190,255,0.82)" />

      {/* Bochechas */}
      <ellipse cx="19" cy="33" rx="6" ry="4" fill="rgba(255,100,130,0.18)" />
      <ellipse cx="61" cy="33" rx="6" ry="4" fill="rgba(255,100,130,0.18)" />

      {/* Narinas no focinho */}
      <ellipse cx="36.5" cy="39" rx="2.2" ry="1.8" fill="rgba(0,0,0,0.22)" />
      <ellipse cx="43.5" cy="39" rx="2.2" ry="1.8" fill="rgba(0,0,0,0.22)" />

      {/* Boca triste */}
      <path d="M33,44 Q40,40 47,44" stroke="#2c1a0a" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Nariz de palhaço (SEMPRE no stage 4) */}
      <circle cx="40" cy="35" r="5.5" fill="#ef4444" />
      <circle cx="38.5" cy="33.5" r="1.8" fill="rgba(255,255,255,0.45)" />

      {/* Gota de suor */}
      <path d="M61,6 Q63,1 65,6 Q65,12 63,12 Q61,12 61,6 Z" fill="rgba(120,190,255,0.82)" />
    </svg>
  )
}
