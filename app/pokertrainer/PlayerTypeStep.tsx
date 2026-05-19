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
            className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl text-xs font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              disabled
                ? 'cursor-default opacity-80'
                : 'cursor-pointer'
            } ${
              selected === type.value
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-lg" aria-hidden="true">{type.emoji}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Tooltip / description */}
      <div className={`rounded-lg px-4 py-3 text-sm transition-all border min-h-[60px] ${
        activeInfo
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/40 text-blue-800 dark:text-blue-300'
          : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-400'
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
