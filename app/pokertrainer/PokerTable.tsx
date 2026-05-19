'use client'

interface PokerTableProps {
  tableSize: number
  heroPosition: string
  villainPosition: string
  villainName: string
  activePositions: string[]
}

// Clockwise from BTN (right/3-o'clock), matching how action flows
const POSITIONS_BY_SIZE: Record<number, string[]> = {
  2: ['BTN', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  4: ['BTN', 'SB', 'BB', 'CO'],
  5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
  6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'],
  7: ['BTN', 'SB', 'BB', 'UTG', 'LJ', 'HJ', 'CO'],
  8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'LJ', 'HJ', 'CO'],
}

const CX = 200, CY = 105
const RX_SEAT = 155, RY_SEAT = 72  // seat circle positions
const R_SEAT = 16                   // seat circle radius

function seatCoord(i: number, n: number) {
  const angle = (i / n) * 2 * Math.PI
  return {
    x: CX + RX_SEAT * Math.cos(angle),
    y: CY + RY_SEAT * Math.sin(angle),
    angle,
  }
}

function labelPos(x: number, y: number) {
  // Labels appear outside the oval — below for bottom seats, above for top/sides
  const dy = y > CY + 10 ? 26 : -26
  return { lx: x, ly: y + dy }
}

export function PokerTable({ tableSize, heroPosition, villainPosition, villainName, activePositions }: PokerTableProps) {
  const clampedSize = Math.min(8, Math.max(2, tableSize))
  const positions = POSITIONS_BY_SIZE[clampedSize] ?? POSITIONS_BY_SIZE[6]

  return (
    <svg viewBox="0 0 400 210" className="w-full h-auto select-none" aria-label="Poker table diagram">

      {/* Rim */}
      <ellipse cx={CX} cy={CY} rx="186" ry="99" fill="#78350f" />
      {/* Felt */}
      <ellipse cx={CX} cy={CY} rx="173" ry="86" fill="#14532d" />
      {/* Inner felt highlight ring */}
      <ellipse cx={CX} cy={CY} rx="173" ry="86" fill="none" stroke="#166534" strokeWidth="4" />
      {/* Center line decoration */}
      <ellipse cx={CX} cy={CY} rx="60" ry="28" fill="none" stroke="#166534" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />

      {positions.map((pos, i) => {
        const { x, y } = seatCoord(i, positions.length)
        const { lx, ly } = labelPos(x, y)
        const isHero = pos === heroPosition
        const isVillain = pos === villainPosition
        const isActive = activePositions.includes(pos)
        const isDealer = pos === 'BTN'

        const fill = isHero ? '#2563eb' : isVillain ? '#d97706' : isActive ? '#374151' : '#1f2937'
        const stroke = isHero ? '#93c5fd' : isVillain ? '#fcd34d' : isActive ? '#6b7280' : '#374151'
        const opacity = isHero || isVillain || isActive ? 1 : 0.35

        return (
          <g key={pos} opacity={opacity}>
            {/* Seat */}
            <circle cx={x} cy={y} r={R_SEAT} fill={fill} stroke={stroke} strokeWidth="1.5" />

            {/* Position label inside seat */}
            <text
              x={x} y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={pos.length > 3 ? '6' : '7'}
              fontWeight="bold"
              fill={isHero || isVillain ? '#fff' : '#9ca3af'}
            >
              {pos}
            </text>

            {/* Dealer button */}
            {isDealer && (
              <g>
                <circle cx={x + 13} cy={y - 13} r="7" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1" />
                <text x={x + 13} y={y - 13} textAnchor="middle" dominantBaseline="middle" fontSize="6" fontWeight="bold" fill="#1f2937">D</text>
              </g>
            )}

            {/* Name label outside oval */}
            {(isHero || isVillain) && (
              <text
                x={lx} y={ly}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill={isHero ? '#93c5fd' : '#fcd34d'}
              >
                {isHero ? 'YOU' : villainName}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
