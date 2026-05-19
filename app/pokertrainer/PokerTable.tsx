'use client'

interface PokerTableProps {
  tableSize: number
  heroPosition: string
  villainPosition: string
  villainName: string
  activePositions: string[]
  heroCards: string[]
  boardCards: string[]
}

const POSITIONS_BY_SIZE: Record<number, string[]> = {
  2: ['BTN', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  4: ['BTN', 'SB', 'BB', 'CO'],
  5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
  6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'],
  7: ['BTN', 'SB', 'BB', 'UTG', 'LJ', 'HJ', 'CO'],
  8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'LJ', 'HJ', 'CO'],
}

const SUIT_COLOR: Record<string, string> = {
  '♥': '#dc2626', '♦': '#d97706', '♣': '#2563eb', '♠': '#374151',
}

const CX = 200, CY = 108
const RX_SEAT = 156, RY_SEAT = 71
const R_SEAT = 19

function seatCoord(i: number, n: number) {
  const angle = (i / n) * 2 * Math.PI
  return { x: CX + RX_SEAT * Math.cos(angle), y: CY + RY_SEAT * Math.sin(angle) }
}

function labelPos(x: number, y: number) {
  const dy = y > CY + 10 ? 30 : -30
  return { lx: x, ly: y + dy }
}

// Two-card positions centered at the 50% inward point, spread perpendicularly
function cardPair(sx: number, sy: number): [{ cx: number; cy: number }, { cx: number; cy: number }] {
  const midX = sx + (CX - sx) * 0.5
  const midY = sy + (CY - sy) * 0.5
  const dx = CX - sx, dy = CY - sy
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const px = -dy / dist, py = dx / dist
  const off = 11
  return [
    { cx: midX - px * off, cy: midY - py * off },
    { cx: midX + px * off, cy: midY + py * off },
  ]
}

function SvgCardFace({ card, cx, cy }: { card: string; cx: number; cy: number }) {
  const suit = card.slice(-1)
  const rank = card.slice(0, -1)
  const color = SUIT_COLOR[suit] ?? '#374151'
  const w = 18, h = 25
  return (
    <g filter="url(#pt-cshadow)">
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={2} fill="white" stroke="#bbbbbb" strokeWidth="0.8" />
      <text x={cx - w / 2 + 2.5} y={cy - h / 2 + 9} fontSize="7.5" fontWeight="800" fill={color}>{rank}</text>
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill={color}>{suit}</text>
    </g>
  )
}

function SvgCardBack({ cx, cy }: { cx: number; cy: number }) {
  const w = 17, h = 24
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={2} fill="#1a6b45" stroke="#0d4a2a" strokeWidth="0.8" />
      <rect x={cx - w / 2 + 2} y={cy - h / 2 + 2} width={w - 4} height={h - 4} rx={1} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
    </g>
  )
}

export function PokerTable({ tableSize, heroPosition, villainPosition, villainName, activePositions, heroCards, boardCards }: PokerTableProps) {
  const clampedSize = Math.min(8, Math.max(2, tableSize))
  const positions = POSITIONS_BY_SIZE[clampedSize] ?? POSITIONS_BY_SIZE[6]

  // Board card positions — centered on the felt
  const boardSpacing = 22
  const boardCount = boardCards.length
  const boardOffsets = Array.from({ length: boardCount }, (_, i) =>
    (i - (boardCount - 1) / 2) * boardSpacing
  )

  // Hero / villain seat indices for card placement
  const heroIdx    = positions.indexOf(heroPosition)
  const villainIdx = positions.indexOf(villainPosition)

  return (
    <svg viewBox="0 0 400 218" className="w-full h-auto select-none" aria-label="Poker table diagram">
      <defs>
        <radialGradient id="pt-felt" cx="50%" cy="42%" r="58%">
          <stop offset="0%"   stopColor="#1e7a50" />
          <stop offset="60%"  stopColor="#155e3b" />
          <stop offset="100%" stopColor="#0b3d25" />
        </radialGradient>
        <radialGradient id="pt-rim" cx="50%" cy="22%" r="65%">
          <stop offset="0%"   stopColor="#b97836" />
          <stop offset="50%"  stopColor="#8a5a1e" />
          <stop offset="100%" stopColor="#3d1a04" />
        </radialGradient>
        <radialGradient id="pt-hero-fill" cx="38%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1e40af" />
        </radialGradient>
        <radialGradient id="pt-villain-fill" cx="38%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <radialGradient id="pt-active-fill" cx="38%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#6b7280" />
          <stop offset="100%" stopColor="#1f2937" />
        </radialGradient>
        <filter id="pt-glow-hero"    x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feFlood floodColor="#3b82f6" floodOpacity="0.65" result="c" />
          <feComposite in="c" in2="b" operator="in" result="g" />
          <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="pt-glow-villain" x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feFlood floodColor="#f59e0b" floodOpacity="0.65" result="c" />
          <feComposite in="c" in2="b" operator="in" result="g" />
          <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="pt-btn" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d1d5db" />
        </radialGradient>
        <filter id="pt-cshadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0.5" dy="1" stdDeviation="1.2" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── Table shadow ── */}
      <ellipse cx={CX} cy={CY + 8} rx="189" ry="102" fill="black" opacity="0.30" />

      {/* ── Rim ── */}
      <ellipse cx={CX} cy={CY} rx="190" ry="100" fill="url(#pt-rim)" />
      <ellipse cx={CX} cy={CY} rx="181" ry="91"  fill="#3d1a04" />
      <ellipse cx={CX} cy={CY} rx="179" ry="89"  fill="#5a2d0a" />
      <path d={`M ${CX - 183} ${CY} A 183 97 0 0 1 ${CX + 183} ${CY}`}
        fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Felt ── */}
      <ellipse cx={CX} cy={CY} rx="175" ry="84" fill="url(#pt-felt)" />
      <ellipse cx={CX} cy={CY} rx="175" ry="84" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />

      {/* ── Center board area ── */}
      <ellipse cx={CX} cy={CY} rx="62" ry="28" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5" />
      <ellipse cx={CX} cy={CY} rx="54" ry="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* ── Seats ── */}
      {positions.map((pos, i) => {
        const { x, y } = seatCoord(i, positions.length)
        const { lx, ly } = labelPos(x, y)
        const isHero    = pos === heroPosition
        const isVillain = pos === villainPosition
        const isActive  = activePositions.includes(pos)
        const isDealer  = pos === 'BTN'
        const isFeatured = isHero || isVillain

        const opacity  = isFeatured || isActive ? 1 : 0.25
        const fillId   = isHero ? 'url(#pt-hero-fill)' : isVillain ? 'url(#pt-villain-fill)' : isActive ? 'url(#pt-active-fill)' : '#111827'
        const stroke   = isHero ? '#93c5fd' : isVillain ? '#fde68a' : isActive ? '#4b5563' : '#374151'
        const glowId   = isHero ? 'url(#pt-glow-hero)' : isVillain ? 'url(#pt-glow-villain)' : undefined

        return (
          <g key={pos} opacity={opacity}>
            {isFeatured && (
              <circle cx={x} cy={y} r={R_SEAT + 5} fill="none"
                stroke={isHero ? 'rgba(96,165,250,0.35)' : 'rgba(252,211,77,0.35)'} strokeWidth="2" />
            )}
            <circle cx={x} cy={y} r={R_SEAT} fill={fillId} stroke={stroke}
              strokeWidth={isFeatured ? 2 : 1.5} filter={glowId} />
            {isFeatured && (
              <circle cx={x} cy={y} r={R_SEAT - 4} fill="none"
                stroke={isHero ? 'rgba(147,197,253,0.25)' : 'rgba(253,230,138,0.25)'}
                strokeWidth="1" strokeDasharray="3 3" />
            )}
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fontSize={pos.length > 3 ? '5.5' : '6.5'} fontWeight="700"
              fill={isHero ? '#dbeafe' : isVillain ? '#fef3c7' : '#9ca3af'} letterSpacing="0.3">
              {pos}
            </text>
            {isDealer && (
              <g>
                <circle cx={x + 16} cy={y - 16} r="8.5" fill="url(#pt-btn)" stroke="#9ca3af" strokeWidth="1" />
                <text x={x + 16} y={y - 16} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fontWeight="800" fill="#374151">D</text>
              </g>
            )}
            {isFeatured && (
              <text x={lx} y={ly} textAnchor="middle" fontSize="9" fontWeight="700"
                fill={isHero ? '#93c5fd' : '#fde68a'} letterSpacing="0.5">
                {isHero ? 'YOU' : villainName}
              </text>
            )}
          </g>
        )
      })}

      {/* ── Villain face-down cards ── */}
      {villainIdx >= 0 && (() => {
        const { x, y } = seatCoord(villainIdx, positions.length)
        const [p1, p2] = cardPair(x, y)
        return (
          <g>
            <SvgCardBack cx={p1.cx} cy={p1.cy} />
            <SvgCardBack cx={p2.cx} cy={p2.cy} />
          </g>
        )
      })()}

      {/* ── Hero face-up cards ── */}
      {heroIdx >= 0 && heroCards.length >= 2 && (() => {
        const { x, y } = seatCoord(heroIdx, positions.length)
        const [p1, p2] = cardPair(x, y)
        return (
          <g>
            <SvgCardFace card={heroCards[0]} cx={p1.cx} cy={p1.cy} />
            <SvgCardFace card={heroCards[1]} cx={p2.cx} cy={p2.cy} />
          </g>
        )
      })()}

      {/* ── Board cards (rendered last = on top) ── */}
      {boardCards.map((card, i) => (
        <SvgCardFace key={i} card={card} cx={CX + boardOffsets[i]} cy={CY} />
      ))}
    </svg>
  )
}
