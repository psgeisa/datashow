export type HostPose = 'idle' | 'presenting' | 'celebrating' | 'compassionate'

interface Props {
  pose?: HostPose
  speech?: string
  size?: number
}

export function HostCharacter({ pose = 'idle', speech, size = 72 }: Props) {
  const height = Math.round(size * 2.2)

  // Right arm transforms per pose
  const rightArmStyle: React.CSSProperties =
    pose === 'presenting'    ? { transform: 'rotate(-60deg)', transformOrigin: '38px 50px' } :
    pose === 'celebrating'   ? { transform: 'rotate(-80deg) translateY(-4px)', transformOrigin: '38px 50px' } :
    pose === 'compassionate' ? { transform: 'rotate(15deg)', transformOrigin: '38px 50px' } :
    {}

  // Left arm transforms
  const leftArmStyle: React.CSSProperties =
    pose === 'celebrating' ? { transform: 'rotate(80deg) translateY(-4px)', transformOrigin: '12px 50px' } :
    {}

  // Head tilt
  const headStyle: React.CSSProperties =
    pose === 'compassionate' ? { transform: 'rotate(8deg)', transformOrigin: '25px 24px' } : {}

  return (
    <div className="flex flex-col items-center gap-1.5 select-none" style={{ width: size }}>
      {/* Speech bubble */}
      {speech && (
        <div
          className="relative text-center text-xs font-semibold leading-snug px-3 py-2 rounded-2xl max-w-[180px]"
          style={{
            background: 'rgba(255,255,255,0.92)',
            color: '#1a1a2e',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          }}
        >
          {speech}
          {/* Bubble tail */}
          <div
            className="absolute left-1/2 -bottom-2.5"
            style={{
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid rgba(255,255,255,0.92)',
            }}
          />
        </div>
      )}

      {/* SVG Host */}
      <svg
        viewBox="0 0 50 110"
        width={size}
        height={height}
        className={`animate-host-float`}
        style={{ filter: 'drop-shadow(0 4px 12px rgba(201,162,39,0.35))' }}
      >
        {/* Stage glow */}
        <ellipse cx="25" cy="107" rx="18" ry="3.5" fill="rgba(201,162,39,0.2)" />

        {/* Pants */}
        <rect x="15" y="70" width="9" height="32" rx="4.5" fill="#16213e" />
        <rect x="26" y="70" width="9" height="32" rx="4.5" fill="#16213e" />

        {/* Shoes */}
        <ellipse cx="19.5" cy="103" rx="8"  ry="3.5" fill="#0d0d1a" />
        <ellipse cx="30.5" cy="103" rx="8"  ry="3.5" fill="#0d0d1a" />
        <ellipse cx="19.5" cy="101" rx="6"  ry="2"   fill="#1a1a3a" />
        <ellipse cx="30.5" cy="101" rx="6"  ry="2"   fill="#1a1a3a" />

        {/* Jacket body */}
        <rect x="11" y="43" width="28" height="30" rx="6" fill="#16213e" />

        {/* Shirt */}
        <rect x="22" y="43" width="6" height="30" fill="#f5f5f0" />

        {/* Tie */}
        <polygon points="25,45 23,60 25,66 27,60" fill="#c9a227" />
        {/* Tie knot */}
        <rect x="23.5" y="43" width="3" height="3" rx="1" fill="#b8911e" />

        {/* Lapels */}
        <polygon points="11,43 22,43 17,60" fill="#0f1729" />
        <polygon points="39,43 28,43 33,60" fill="#0f1729" />

        {/* Jacket buttons */}
        <circle cx="25" cy="68" r="1.2" fill="#0f1729" />
        <circle cx="25" cy="63" r="1.2" fill="#0f1729" />

        {/* Left arm + hand + mic */}
        <g style={leftArmStyle}>
          <rect x="2" y="46" width="10" height="6" rx="3" fill="#16213e" />
          <circle cx="2" cy="49" r="4.5" fill="#c8855a" />
          {/* Mic stand */}
          <rect x="-2" y="40" width="4" height="10" rx="2" fill="#999" />
          {/* Mic head */}
          <ellipse cx="0" cy="39" rx="4" ry="5" fill="#555" />
          <ellipse cx="0" cy="38" rx="3" ry="3" fill="#444" />
        </g>

        {/* Right arm */}
        <g style={rightArmStyle}>
          <rect x="38" y="46" width="10" height="6" rx="3" fill="#16213e" />
          <circle cx="48" cy="49" r="4.5" fill="#c8855a" />
        </g>

        {/* Neck */}
        <rect x="21" y="32" width="8" height="14" rx="4" fill="#c8855a" />

        {/* Head */}
        <g style={headStyle}>
          <circle cx="25" cy="22" r="17" fill="#c8855a" />

          {/* Hair */}
          <path d="M8,19 Q9,5 25,5 Q41,5 42,19 Q37,12 25,11 Q13,12 8,19" fill="#2c1a0a" />
          {/* Hair side */}
          <rect x="8" y="15" width="3" height="8" rx="1.5" fill="#2c1a0a" />
          <rect x="39" y="15" width="3" height="8" rx="1.5" fill="#2c1a0a" />

          {/* Ears */}
          <ellipse cx="8"  cy="22" rx="3.5" ry="5" fill="#c8855a" />
          <ellipse cx="42" cy="22" rx="3.5" ry="5" fill="#c8855a" />
          <ellipse cx="8"  cy="22" rx="2"   ry="3" fill="#b87045" />
          <ellipse cx="42" cy="22" rx="2"   ry="3" fill="#b87045" />

          {/* Eyes */}
          <ellipse cx="18" cy="20" rx="4" ry="4.2" fill="white" />
          <ellipse cx="32" cy="20" rx="4" ry="4.2" fill="white" />
          <circle cx="19" cy="21" r="2.5" fill="#1a1010" />
          <circle cx="33" cy="21" r="2.5" fill="#1a1010" />
          {/* Eye shine */}
          <circle cx="20" cy="20" r="1"   fill="white" />
          <circle cx="34" cy="20" r="1"   fill="white" />

          {/* Eyebrows */}
          <path d="M13,14 Q18,12 23,14" stroke="#2c1a0a" strokeWidth="1.8" fill="none" strokeLinecap="round"
            style={pose === 'celebrating' ? { transform: 'translateY(-1px)' } :
                   pose === 'compassionate' ? { transform: 'rotate(5deg)' } : {}}
          />
          <path d="M27,14 Q32,12 37,14" stroke="#2c1a0a" strokeWidth="1.8" fill="none" strokeLinecap="round"
            style={pose === 'celebrating' ? { transform: 'translateY(-1px)' } :
                   pose === 'compassionate' ? { transform: 'rotate(-5deg)' } : {}}
          />

          {/* Mouth */}
          {pose === 'celebrating' ? (
            // Big grin
            <>
              <path d="M16,29 Q25,38 34,29" stroke="#2c1a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M17,29 Q25,36 33,29 Q25,33 17,29" fill="white" />
            </>
          ) : pose === 'compassionate' ? (
            // Sympathetic smile (slightly down)
            <path d="M18,31 Q25,29 32,31" stroke="#2c1a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          ) : (
            // Normal smile
            <>
              <path d="M17,30 Q25,37 33,30" stroke="#2c1a0a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M18,30 Q25,35 32,30 Q25,32 18,30" fill="white" opacity="0.8" />
            </>
          )}

          {/* Cheek blush */}
          <ellipse cx="13" cy="26" rx="3.5" ry="2.5" fill="rgba(210,100,80,0.25)" />
          <ellipse cx="37" cy="26" rx="3.5" ry="2.5" fill="rgba(210,100,80,0.25)" />

          {/* Star sparkles when celebrating */}
          {pose === 'celebrating' && (
            <>
              <text x="43" y="10" fontSize="8" fill="#c9a227">✦</text>
              <text x="2"  y="8"  fontSize="6" fill="#c9a227">✦</text>
            </>
          )}
        </g>

        {/* Name badge */}
        <rect x="11" y="55" width="12" height="7" rx="2" fill="rgba(201,162,39,0.9)" />
        <text x="17" y="60.5" textAnchor="middle" fontSize="3.5" fill="#1a1a2e" fontWeight="bold">HOST</text>
      </svg>
    </div>
  )
}
