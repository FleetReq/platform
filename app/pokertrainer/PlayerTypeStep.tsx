'use client'

import { useState } from 'react'

export type PlayerType = 'nit' | 'tag' | 'lag' | 'station' | 'maniac'

interface PlayerTypeOption {
  value: PlayerType
  label: string
  emoji: string
  short: string
  description: string
}

const PLAYER_TYPES: PlayerTypeOption[] = [
  {
    value: 'nit',
    label: 'Nit',
    emoji: '🧱',
    short: 'Very tight, rarely plays',
    description: 'Only plays premium hands (AA, KK, QQ, AK). When they bet big, they almost always have it. The math might say call, but their range can crush yours.',
  },
  {
    value: 'tag',
    label: 'TAG',
    emoji: '📐',
    short: 'Tight-Aggressive',
    description: 'Tight Aggressive — plays a solid range of hands and bets them hard. The most common "regular" player type. Respect their bets but they do bluff occasionally.',
  },
  {
    value: 'lag',
    label: 'LAG',
    emoji: '🔥',
    short: 'Loose-Aggressive',
    description: 'Loose Aggressive — plays many hands and applies pressure constantly. Hard to put on a hand. Bluffs frequently. Implied odds improve greatly against them when you hit.',
  },
  {
    value: 'station',
    label: 'Station',
    emoji: '📞',
    short: 'Calling Station',
    description: 'Calls too much, rarely folds. Good news: your draws get paid off when you hit. Bad news: bluffing is pointless. Value bet relentlessly against them.',
  },
  {
    value: 'maniac',
    label: 'Maniac',
    emoji: '🌪️',
    short: 'Raises everything',
    description: 'Raises and re-raises with nearly any two cards. Pots get huge fast. Your draws have massive implied odds but they can make big hands too. Tread carefully.',
  },
]

const TYPE_SELECTED: Record<PlayerType, string> = {
  nit:     'bg-red-500/25 border-red-500/60 text-red-300 shadow-lg shadow-red-500/20',
  tag:     'bg-blue-500/25 border-blue-500/60 text-blue-300 shadow-lg shadow-blue-500/20',
  lag:     'bg-orange-500/25 border-orange-500/60 text-orange-300 shadow-lg shadow-orange-500/20',
  station: 'bg-teal-500/25 border-teal-500/60 text-teal-300 shadow-lg shadow-teal-500/20',
  maniac:  'bg-yellow-500/25 border-yellow-500/60 text-yellow-300 shadow-lg shadow-yellow-500/20',
}

const TYPE_DESC_BG: Record<PlayerType, string> = {
  nit:     'bg-red-500/10 border-red-500/30 text-red-200',
  tag:     'bg-blue-500/10 border-blue-500/30 text-blue-200',
  lag:     'bg-orange-500/10 border-orange-500/30 text-orange-200',
  station: 'bg-teal-500/10 border-teal-500/30 text-teal-200',
  maniac:  'bg-yellow-500/10 border-yellow-500/30 text-yellow-200',
}

interface PlayerTypeStepProps {
  selected: PlayerType | ''
  onSelect: (type: PlayerType) => void
  disabled: boolean
}

export function PlayerTypeStep({ selected, onSelect, disabled }: PlayerTypeStepProps) {
  const [hovered, setHovered] = useState<PlayerType | null>(null)
  const active = hovered ?? (selected || null)
  const activeInfo = active ? PLAYER_TYPES.find(t => t.value === active) : null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {PLAYER_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => !disabled && onSelect(type.value)}
            onMouseEnter={() => setHovered(type.value)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(type.value)}
            onBlur={() => setHovered(null)}
            disabled={disabled}
            aria-pressed={selected === type.value}
            aria-label={`${type.label}: ${type.short}`}
            className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl text-xs font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#13151f] ${
              disabled ? 'cursor-default opacity-80' : 'cursor-pointer'
            } ${
              selected === type.value
                ? TYPE_SELECTED[type.value]
                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80 hover:border-white/20'
            }`}
          >
            <span className="text-lg" aria-hidden="true">{type.emoji}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      <div className={`rounded-lg px-4 py-3 text-sm transition-all border min-h-[60px] ${
        activeInfo
          ? TYPE_DESC_BG[activeInfo.value]
          : 'bg-white/5 border-white/10 text-white/30'
      }`}>
        {activeInfo ? (
          <>
            <span className="font-semibold">{activeInfo.emoji} {activeInfo.label}</span>
            {' — '}
            {activeInfo.description}
          </>
        ) : (
          <span className="italic">Hover over a type to learn what it means</span>
        )}
      </div>
    </div>
  )
}
