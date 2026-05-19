'use client'

interface PokerTableProps {
  heroPosition: string
  villainPosition: string
  villainName: string
  activePositions: string[]
  heroCards: string[]
  boardCards: string[]   // 3 cards = Flop, 4 = Turn; river slot always ghost
}

// Fixed 9-max layout, evenly spaced. Inactive seats show dimmed.
const NINE_MAX: string[] = ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO']

const SUIT_COLOR: Record<string, string> = {
  '♥': '#dc2626', '♦': '#d97706', '♣': '#2563eb', '♠': '#374151',
}

const CX = 200, CY = 108
const RX_SEAT = 156, RY_SEAT = 71
const R_SEAT = 18
const BOARD_SLOTS = 5
const BOARD_SPACING = 20   // px between card centers
const CW = 18, CH = 25     // card face dimensions

function seatCoord(i: number) {
  const angle = (i / NINE_MAX.length) * 2 * Math.PI
  return { x: CX + RX_SEAT * Math.cos(angle), y: CY + RY_SEAT * Math.sin(angle) }
}

function labelPos(x: number, y: number) {
  const dy = y > CY + 10 ? 26 : -26
  return { lx: x, ly: y + dy }
}

// Top half of table → cards south (below seat, toward center).
// Bottom half → cards north. Pure left/right → east/west.
function cardPair(sx: number, sy: number): [{ cx: number; cy: number }, { cx: number; cy: number }] {
  const GAP = 4
  if (sy < CY) {
    const cy = sy + R_SEAT + GAP + CH / 2
    return [{ cx: sx - 11, cy }, { cx: sx + 11, cy }]   // south
  }
  if (sy > CY) {
    const cy = sy - R_SEAT - GAP - CH / 2
    return [{ cx: sx - 11, cy }, { cx: sx + 11, cy }]   // north
  }
  // exactly at CY (BTN, UTG+1)
  if (sx < CX) {
    const cx = sx + R_SEAT + GAP + CW / 2
    return [{ cx, cy: sy - 14 }, { cx, cy: sy + 14 }]   // east
  }
  const cx = sx - R_SEAT - GAP - CW / 2
  return [{ cx, cy: sy - 14 }, { cx, cy: sy + 14 }]     // west
}

function SvgCardFace({ card, cx, cy }: { card: string; cx: number; cy: number }) {
  const suit = card.slice(-1)
  const rank = card.slice(0, -1)
  const color = SUIT_COLOR[suit] ?? '#374151'
  return (
    <g filter="url(#pt-cshadow)">
      <rect x={cx - CW / 2} y={cy - CH / 2} width={CW} height={CH} rx={2} fill="white" stroke="#bbb" strokeWidth="0.8" />
      <text x={cx - CW / 2 + 2.5} y={cy - CH / 2 + 9} fontSize="7.5" fontWeight="800" fill={color}>{rank}</text>
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill={color}>{suit}</text>
    </g>
  )
}

function SvgCardBack({ cx, cy }: { cx: number; cy: number }) {
  const w = CW - 1, h = CH - 1
  return (
    <g filter="url(#pt-cshadow)">
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={2} fill="#1e3a5f" stroke="#0f2240" strokeWidth="0.8" />
      <rect x={cx - w / 2 + 2} y={cy - h / 2 + 2} width={w - 4} height={h - 4} rx={1}
        fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.7" />
    </g>
  )
}

function SvgCardSlot({ cx, cy }: { cx: number; cy: number }) {
  return (
    <rect x={cx - CW / 2} y={cy - CH / 2} width={CW} height={CH} rx={2}
      fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.28)" strokeWidth="1" strokeDasharray="3 2" />
  )
}

export function PokerTable({ heroPosition, villainPosition, villainName, activePositions, heroCards, boardCards }: PokerTableProps) {
  const heroIdx    = NINE_MAX.indexOf(heroPosition)
  const villainIdx = NINE_MAX.indexOf(villainPosition)

  // Board: always 5 slots; boardCards fills left-to-right, rest are ghost slots
  const boardOffsets = Array.from({ length: BOARD_SLOTS }, (_, i) =>
    (i - (BOARD_SLOTS - 1) / 2) * BOARD_SPACING   // -40, -20, 0, +20, +40
  )

  return (
    <svg viewBox="0 0 400 220" className="w-full h-auto select-none" aria-label="Poker table diagram">
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
        <radialGradient id="pt-hero" cx="38%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1e40af" />
        </radialGradient>
        <radialGradient id="pt-villain" cx="38%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <radialGradient id="pt-active" cx="38%" cy="30%" r="70%">
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

      {/* Table shadow */}
      <ellipse cx={CX} cy={CY + 8} rx="189" ry="102" fill="black" opacity="0.30" />

      {/* Rim */}
      <ellipse cx={CX} cy={CY} rx="190" ry="100" fill="url(#pt-rim)" />
      <ellipse cx={CX} cy={CY} rx="181" ry="91"  fill="#3d1a04" />
      <ellipse cx={CX} cy={CY} rx="179" ry="89"  fill="#5a2d0a" />
      <path d={`M ${CX - 183} ${CY} A 183 97 0 0 1 ${CX + 183} ${CY}`}
        fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Felt */}
      <ellipse cx={CX} cy={CY} rx="175" ry="84" fill="url(#pt-felt)" />
      <ellipse cx={CX} cy={CY} rx="175" ry="84" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />

      {/* Board area oval hints */}
      <ellipse cx={CX} cy={CY} rx="56" ry="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

      {/* All 9 seats */}
      {NINE_MAX.map((pos, i) => {
        const { x, y } = seatCoord(i)
        const { lx, ly } = labelPos(x, y)
        const isHero    = pos === heroPosition
        const isVillain = pos === villainPosition
        const isActive  = activePositions.includes(pos)
        const isEmpty   = !isHero && !isVillain && !isActive
        const isFeatured = isHero || isVillain
        const isDealer  = pos === 'BTN'

        const opacity = isEmpty ? 0.18 : 1
        const fill    = isHero ? 'url(#pt-hero)' : isVillain ? 'url(#pt-villain)' : isActive ? 'url(#pt-active)' : '#0f1923'
        const stroke  = isHero ? '#93c5fd' : isVillain ? '#fde68a' : isActive ? '#4b5563' : '#2a3a4a'
        const glow    = isHero ? 'url(#pt-glow-hero)' : isVillain ? 'url(#pt-glow-villain)' : undefined

        return (
          <g key={pos} opacity={opacity}>
            {isFeatured && (
              <circle cx={x} cy={y} r={R_SEAT + 5} fill="none"
                stroke={isHero ? 'rgba(96,165,250,0.35)' : 'rgba(252,211,77,0.35)'} strokeWidth="2" />
            )}
            <circle cx={x} cy={y} r={R_SEAT} fill={fill} stroke={stroke}
              strokeWidth={isFeatured ? 2 : 1.5} filter={glow} />
            {isFeatured && (
              <circle cx={x} cy={y} r={R_SEAT - 4} fill="none"
                stroke={isHero ? 'rgba(147,197,253,0.25)' : 'rgba(253,230,138,0.25)'}
                strokeWidth="1" strokeDasharray="3 3" />
            )}
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fontSize={pos.length > 3 ? '5' : '6'} fontWeight="700"
              fill={isHero ? '#dbeafe' : isVillain ? '#fef3c7' : '#9ca3af'} letterSpacing="0.2">
              {isEmpty ? '—' : pos}
            </text>
            {isDealer && !isEmpty && (
              <g>
                <circle cx={x + 15} cy={y - 15} r="8" fill="url(#pt-btn)" stroke="#9ca3af" strokeWidth="1" />
                <text x={x + 15} y={y - 15} textAnchor="middle" dominantBaseline="middle" fontSize="6" fontWeight="800" fill="#374151">D</text>
              </g>
            )}
            {isFeatured && (
              <text x={lx} y={ly} textAnchor="middle" fontSize="8.5" fontWeight="700"
                fill={isHero ? '#93c5fd' : '#fde68a'} letterSpacing="0.5">
                {isHero ? 'YOU' : villainName}
              </text>
            )}
          </g>
        )
      })}

      {/* Villain face-down cards — rendered before hero so hero cards sit on top if they overlap */}
      {villainIdx >= 0 && (() => {
        const { x, y } = seatCoord(villainIdx)
        const [p1, p2] = cardPair(x, y)
        return <g><SvgCardBack cx={p1.cx} cy={p1.cy} /><SvgCardBack cx={p2.cx} cy={p2.cy} /></g>
      })()}

      {/* Hero face-up cards */}
      {heroIdx >= 0 && heroCards.length >= 2 && (() => {
        const { x, y } = seatCoord(heroIdx)
        const [p1, p2] = cardPair(x, y)
        return (
          <g>
            <SvgCardFace card={heroCards[0]} cx={p1.cx} cy={p1.cy} />
            <SvgCardFace card={heroCards[1]} cx={p2.cx} cy={p2.cy} />
          </g>
        )
      })()}

      {/* Board: 5 fixed slots — filled or ghost */}
      {boardOffsets.map((offset, i) => {
        const cx = CX + offset
        return boardCards[i]
          ? <SvgCardFace key={i} card={boardCards[i]} cx={cx} cy={CY} />
          : <SvgCardSlot  key={i} cx={cx} cy={CY} />
      })}
    </svg>
  )
}
