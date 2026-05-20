export function BottleSVG() {
  return (
    <svg className="bottle-svg" viewBox="0 0 800 760" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <linearGradient id="glass-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
          <stop offset="14%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="32%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="62%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="82%" stopColor="rgba(255,255,255,0.48)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
        </linearGradient>
        <linearGradient id="glass-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200,210,220,0)" />
          <stop offset="100%" stopColor="rgba(180,195,210,0.18)" />
        </linearGradient>
        <radialGradient id="bottle-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(180,160,140,0.30)" />
          <stop offset="100%" stopColor="rgba(180,160,140,0)" />
        </radialGradient>
        <linearGradient id="rim-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.40)" />
        </linearGradient>
      </defs>

      <ellipse cx="400" cy="710" rx="220" ry="20" fill="url(#bottle-shadow)" />

      <g id="bottle-group">
        <path
          id="bottle-shape"
          d="M 246 142 L 246 130 Q 246 118, 258 116 L 542 116 Q 554 118, 554 130 L 554 142 L 590 210 L 590 600 Q 590 686, 504 686 L 296 686 Q 210 686, 210 600 L 210 210 Z"
          fill="url(#glass-body)"
          stroke="#c8b8a8"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M 246 142 L 590 210 L 590 600 Q 590 686, 504 686 L 296 686 Q 210 686, 210 600 L 210 210 L 554 142 Z"
          fill="url(#glass-shade)"
          opacity="0.5"
        />
        <ellipse cx="400" cy="116" rx="148" ry="12" fill="url(#rim-grad)" stroke="#c8b8a8" strokeWidth="1.6" />
        <ellipse cx="400" cy="124" rx="148" ry="6" fill="none" stroke="rgba(200,180,160,0.45)" strokeWidth="1" />

        <path d="M 250 220 Q 245 420, 254 600" stroke="rgba(255,255,255,0.85)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 263 240 Q 258 420, 266 580" stroke="rgba(255,255,255,0.40)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 550 230 Q 558 420, 546 600" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        <g id="tag" transform="translate(564 150)">
          <path
            d="M -22 -34 Q -28 -28, -22 -22 Q -16 -28, -22 -34 Z M 22 -34 Q 28 -28, 22 -22 Q 16 -28, 22 -34 Z"
            fill="#ffd3dd"
            stroke="#e89aac"
            strokeWidth="1"
          />
          <circle cx="0" cy="-28" r="4" fill="#e89aac" />
          <line x1="0" y1="-24" x2="0" y2="-2" stroke="#b89880" strokeWidth="1" />
          <g transform="rotate(8)">
            <rect x="-22" y="-2" width="44" height="22" rx="3" fill="#fff9e8" stroke="#c8b090" strokeWidth="0.9" />
            <line x1="-16" y1="6" x2="16" y2="6" stroke="#d8c0a0" strokeWidth="0.6" />
            <line x1="-16" y1="12" x2="10" y2="12" stroke="#d8c0a0" strokeWidth="0.6" />
            <text x="0" y="16" textAnchor="middle" fontFamily="Long Cang, ZCOOL XiaoWei, serif" fontSize="11" fill="#a06848">願</text>
          </g>
        </g>
      </g>
    </svg>
  );
}
