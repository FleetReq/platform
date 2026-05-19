'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { PokerTable } from './PokerTable'
import { PlayerTypeStep, type PlayerType } from './PlayerTypeStep'

type Step = 'potOdds' | 'breakeven' | 'outs' | 'equity' | 'playerType' | 'decision'
type Decision = 'call' | 'fold' | 'raise'

interface Scenario {
  id: number
  level: 1 | 2 | 3
  levelName: string
  street: string
  hand: string[]
  board: string[]
  handDesc: string
  pot: number
  callAmount: number
  cardsToCome: 1 | 2
  outs: number
  outDesc: string
  tableSize: number
  heroPosition: string
  villainPosition: string
  otherPlayers: string[]
  villainName: string
  villainDescription: string
  villainPlayerType: PlayerType
  potOddsNum: number
  potOddsDen: number
  breakevenPct: number
  equityPct: number
  decision: Decision
  steps: Step[]
  explanations: Partial<Record<Step, string>>
}

interface StepResult {
  correct: boolean
  given: string
}

const STATIC_SCENARIOS: Scenario[] = [
  {
    id: 1,
    level: 1,
    levelName: 'Rookie',
    street: 'Flop',
    hand: ['A♥', '7♥'],
    board: ['K♥', '9♥', '2♣'],
    handDesc: 'Nut flush draw — any heart gives you the best possible flush',
    pot: 60,
    callAmount: 20,
    cardsToCome: 2,
    outs: 9,
    outDesc: '13 hearts total − 4 visible (A♥ 7♥ K♥ 9♥) = 9 outs remaining',
    tableSize: 6,
    heroPosition: 'CO',
    villainPosition: 'BTN',
    otherPlayers: ['SB', 'BB'],
    villainName: 'Old Timer',
    villainDescription: 'An older gentleman who has folded almost every hand tonight. He finally raised big preflop for the first time — and he looks calm and confident doing it.',
    villainPlayerType: 'nit',
    potOddsNum: 3,
    potOddsDen: 1,
    breakevenPct: 25,
    equityPct: 36,
    decision: 'call',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'decision'],
    explanations: {
      potOdds: 'Pot is $60, you call $20. Divide: 60 ÷ 20 = 3. Your pot odds are 3:1.',
      breakeven: 'Your 3:1 pot odds = risking $20 for an $80 pot. $20 ÷ $80 = 25%. You need at least 25% equity to break even — now go find out if you have it.',
      outs: '13 hearts total. You can see 4 of them (A♥ 7♥ K♥ 9♥). That leaves 9 unseen hearts that complete your flush.',
      equity: 'Two cards to come → Rule of 4: 9 × 4 = 36%. Your equity (36%) beats the 25% breakeven — profitable call.',
      decision: 'Call. 36% equity vs 25% breakeven. Your flush draw is a clear +EV call. Over time this hand prints money.',
    },
  },
  {
    id: 2,
    level: 1,
    levelName: 'Rookie',
    street: 'Turn',
    hand: ['J♣', 'T♣'],
    board: ['Q♥', '9♦', '2♠', '3♣'],
    handDesc: 'Open-ended straight draw — K completes from above (K Q J T 9), 8 completes from below (Q J T 9 8)',
    pot: 90,
    callAmount: 45,
    cardsToCome: 1,
    outs: 8,
    outDesc: '4 Kings + 4 Eights = 8 straight outs',
    tableSize: 5,
    heroPosition: 'SB',
    villainPosition: 'CO',
    otherPlayers: ['BB'],
    villainName: 'The Caller',
    villainDescription: "A friendly player who has called every single bet all night. You've never once seen him fold to any bet on any street.",
    villainPlayerType: 'station',
    potOddsNum: 2,
    potOddsDen: 1,
    breakevenPct: 33,
    equityPct: 16,
    decision: 'fold',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'decision'],
    explanations: {
      potOdds: 'Pot is $90, you call $45. Divide: 90 ÷ 45 = 2. Your pot odds are 2:1.',
      breakeven: 'Your 2:1 pot odds = risking $45 for a $135 pot. $45 ÷ $135 ≈ 33%. You need at least 33% equity — that\'s a steep price.',
      outs: '4 Kings complete the K-high straight + 4 Eights complete the 8-high straight. Any of those 8 cards make your hand.',
      equity: 'One card to come → Rule of 2: 8 × 2 = 16%. Your equity (16%) is less than half the 33% you need.',
      decision: 'Fold. 16% equity vs 33% breakeven — calling here loses money over time. The pot odds are just too expensive for this draw.',
    },
  },
  {
    id: 3,
    level: 2,
    levelName: 'Regular',
    street: 'Turn',
    hand: ['8♠', '7♠'],
    board: ['6♠', '5♣', '2♦', 'J♠'],
    handDesc: 'Flush draw (spades) — one card to come on the river',
    pot: 120,
    callAmount: 60,
    cardsToCome: 1,
    outs: 9,
    outDesc: '13 spades − 4 visible (8♠ 7♠ 6♠ J♠) = 9 remaining spade outs',
    tableSize: 6,
    heroPosition: 'BB',
    villainPosition: 'CO',
    otherPlayers: ['SB', 'UTG'],
    villainName: 'Hoodie Guy',
    villainDescription: "A 30-something player in a hoodie who's been raising and re-raising frequently. He bets almost every street and seems to enjoy applying pressure, even with questionable holdings.",
    villainPlayerType: 'lag',
    potOddsNum: 2,
    potOddsDen: 1,
    breakevenPct: 33,
    equityPct: 18,
    decision: 'fold',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
    explanations: {
      potOdds: 'Pot is $120, you call $60. Divide: 120 ÷ 60 = 2. Your pot odds are 2:1.',
      breakeven: 'Your 2:1 pot odds = risking $60 for a $180 pot. $60 ÷ $180 ≈ 33%. You need 33% equity to break even — now go find out if you have it.',
      outs: '13 spades in the deck. You can see 4 (8♠ 7♠ 6♠ J♠). That leaves 9 outs.',
      equity: 'One card to come → Rule of 2: 9 × 2 = 18%. Your equity (18%) falls well short of 33%.',
      playerType: 'Hoodie Guy is a LAG (Loose-Aggressive). LAGs play many hands and apply constant pressure. Their wide range means they bluff frequently — but the math still says fold here regardless.',
      decision: 'Fold. Your 18% equity falls well short of the 33% breakeven. Even knowing a LAG is betting wide, calling is –EV when the gap is this large.',
    },
  },
  {
    id: 4,
    level: 2,
    levelName: 'Regular',
    street: 'Flop',
    hand: ['7♦', '8♦'],
    board: ['9♦', 'T♣', 'A♠'],
    handDesc: 'Open-ended straight draw — J completes from above (J T 9 8 7), 6 completes from below (T 9 8 7 6)',
    pot: 50,
    callAmount: 10,
    cardsToCome: 2,
    outs: 8,
    outDesc: '4 Jacks + 4 Sixes = 8 straight outs',
    tableSize: 6,
    heroPosition: 'UTG',
    villainPosition: 'BTN',
    otherPlayers: ['SB', 'BB', 'HJ'],
    villainName: 'The Regular',
    villainDescription: 'An experienced-looking player who plays a selective, solid style. He raises with good hands, folds marginal ones, and occasionally fires a well-timed continuation bet.',
    villainPlayerType: 'tag',
    potOddsNum: 5,
    potOddsDen: 1,
    breakevenPct: 17,
    equityPct: 32,
    decision: 'call',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
    explanations: {
      potOdds: 'Pot is $50, you call $10. Divide: 50 ÷ 10 = 5. Your pot odds are 5:1.',
      breakeven: 'Your 5:1 pot odds = risking $10 for a $60 pot. $10 ÷ $60 ≈ 17%. You only need 17% equity — a very cheap price.',
      outs: '4 Jacks (J T 9 8 7 straight) + 4 Sixes (T 9 8 7 6 straight) = 8 outs. Either card makes you a straight.',
      equity: 'Two cards to come → Rule of 4: 8 × 4 = 32%. Your equity (32%) nearly doubles the 17% needed.',
      playerType: "The Regular is a TAG (Tight-Aggressive). TAGs play solid ranges and bet strong hands hard. Disciplined players who bluff occasionally but aren't loose.",
      decision: "Call. Your 32% equity nearly doubles the 17% breakeven — this is a slam dunk. Even against a TAG who has a real hand, the pot is giving you great value for your draw.",
    },
  },
  {
    id: 5,
    level: 3,
    levelName: 'Shark',
    street: 'Turn',
    hand: ['8♣', '9♣'],
    board: ['6♣', '7♦', 'Q♠', '2♣'],
    handDesc: 'Flush draw (clubs) + open-ended straight draw — a monster combo draw with one card to come',
    pot: 90,
    callAmount: 30,
    cardsToCome: 1,
    outs: 15,
    outDesc: '9 remaining clubs (flush) + 3 non-club Fives (5♠ 5♥ 5♦) + 3 non-club Tens (T♠ T♥ T♦) = 15 unique outs. 5♣ and T♣ are already counted as flush outs.',
    tableSize: 8,
    heroPosition: 'HJ',
    villainPosition: 'BTN',
    otherPlayers: ['SB', 'BB', 'UTG', 'UTG+1', 'CO'],
    villainName: 'Wild Card',
    villainDescription: "A very active player who's been involved in many pots. You saw him raise and take down a pot with what looked like a bluff, but later he laid down a hand when facing heavy pressure. Hard to pin down.",
    villainPlayerType: 'maniac',
    potOddsNum: 3,
    potOddsDen: 1,
    breakevenPct: 25,
    equityPct: 30,
    decision: 'call',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
    explanations: {
      potOdds: 'Pot is $90, you call $30. Divide: 90 ÷ 30 = 3. Your pot odds are 3:1.',
      breakeven: 'You risk $30 to win $120 total ($90 + $30). 30 ÷ 120 = 25%. You need 25% equity to break even.',
      outs: '9 clubs remaining for the flush draw. The straight needs 5 or T — but 5♣ and T♣ are already counted as flush outs. Add 3 non-club Fives + 3 non-club Tens = 15 total unique outs.',
      equity: 'One card to come → Rule of 2: 15 × 2 = 30%. Your equity (30%) exceeds the 25% breakeven.',
      playerType: 'Wild Card leans Maniac — raises constantly, mixes bluffs with strong hands. With a big draw and positive EV, calling (or semi-bluffing) is strong. Against a maniac, implied odds when you hit are enormous.',
      decision: 'Call. Your 30% equity beats the 25% breakeven. With a combo draw this large, calling is clearly +EV. Raising as a semi-bluff is also strong here — if they fold, you win immediately.',
    },
  },
  {
    id: 6,
    level: 3,
    levelName: 'Shark',
    street: 'Flop',
    hand: ['A♣', 'K♣'],
    board: ['Q♣', 'J♣', '2♦'],
    handDesc: 'Nut flush draw + gutshot to broadway — A♣K♣ on a two-club board is an elite semi-bluff hand',
    pot: 120,
    callAmount: 40,
    cardsToCome: 2,
    outs: 12,
    outDesc: '9 remaining clubs for the nut flush (T♣ already counted below) + T♦ T♥ T♠ for the broadway straight = 12 unique outs',
    tableSize: 7,
    heroPosition: 'SB',
    villainPosition: 'CO',
    otherPlayers: ['BB', 'UTG', 'LJ', 'HJ'],
    villainName: 'The Thinker',
    villainDescription: "A quiet, focused player who's been at the table for 3 hours. You've seen them show down strong hands, but also attempt a few well-timed bluffs. Their bet sizing is inconsistent — sometimes conservative, sometimes pot-sized.",
    villainPlayerType: 'tag',
    potOddsNum: 3,
    potOddsDen: 1,
    breakevenPct: 25,
    equityPct: 48,
    decision: 'raise',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
    explanations: {
      potOdds: 'Pot is $120, you call $40. Divide: 120 ÷ 40 = 3. Your pot odds are 3:1.',
      breakeven: 'You risk $40 to win $160 total ($120 + $40). 40 ÷ 160 = 25%. You need 25% equity to break even.',
      outs: '9 clubs remaining for nut flush (T♣ completes both flush and straight, counted once). Three non-club Tens (T♦ T♥ T♠) complete the gutshot broadway straight. Total: 12 unique outs.',
      equity: 'Two cards to come → Rule of 4: 12 × 4 = 48%. You have nearly a coin-flip edge — nearly double the breakeven!',
      playerType: 'The Thinker shows TAG tendencies — selective but capable of aggression. The ambiguous sizing suggests range balancing. Against a TAG, your 48% equity and the nut draw make raising very attractive.',
      decision: 'Raise! With 48% equity vs 25% breakeven you have a commanding advantage. Raising builds the pot, gives fold equity, and when you hit the nuts (club or Ten), you\'re never afraid of being re-raised off your hand.',
    },
  },
]

type StepCategory = 'GTO' | 'Exploitative' | 'Decision'

const STEP_CONFIG: Record<Step, { label: string; prompt: string; inputType: 'ratio' | 'number' | 'decision' | 'playerType'; category: StepCategory }> = {
  potOdds: {
    label: 'Pot Odds',
    prompt: 'What are your pot odds? Enter as a ratio — e.g. "3:1"',
    inputType: 'ratio',
    category: 'GTO',
  },
  breakeven: {
    label: 'Break-Even %',
    prompt: 'What % equity do you need to break even? (whole number, ±2 counts)',
    inputType: 'number',
    category: 'GTO',
  },
  outs: {
    label: 'Count Your Outs',
    prompt: 'How many outs do you have? (exact number)',
    inputType: 'number',
    category: 'GTO',
  },
  equity: {
    label: 'Equity %',
    prompt: 'Using the Rule of 2 or 4, what is your approximate equity %? (±2 counts)',
    inputType: 'number',
    category: 'GTO',
  },
  playerType: {
    label: 'Read the Villain',
    prompt: 'Based on the description, what type of player is the villain?',
    inputType: 'playerType',
    category: 'Exploitative',
  },
  decision: {
    label: 'The Decision',
    prompt: 'Based on your equity vs. break-even — call, fold, or raise?',
    inputType: 'decision',
    category: 'Decision',
  },
}

const CATEGORY_STYLE: Record<StepCategory, string> = {
  GTO:          'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Exploitative: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Decision:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

function getPrompt(step: Step, s: Scenario, results: (StepResult | undefined)[]): string {
  if (step === 'breakeven') {
    const potOddsIdx = s.steps.indexOf('potOdds')
    if (potOddsIdx >= 0 && results[potOddsIdx]) {
      return `You found ${s.potOddsNum}:1 pot odds — what % equity do you need to break even? (whole number, ±2 counts)`
    }
  }
  return STEP_CONFIG[step].prompt
}

function checkAnswer(step: Step, raw: string, s: Scenario): boolean {
  const v = raw.trim()
  if (!v) return false
  switch (step) {
    case 'potOdds': {
      const parts = v.split(':')
      const num = parseFloat(parts[0])
      const den = parts.length > 1 ? parseFloat(parts[1]) : 1
      if (isNaN(num) || isNaN(den) || den === 0) return false
      return Math.abs(num / den - s.potOddsNum / s.potOddsDen) < 0.15
    }
    case 'breakeven': {
      const n = parseFloat(v.replace('%', ''))
      return !isNaN(n) && Math.abs(n - s.breakevenPct) <= 2
    }
    case 'outs': {
      return parseInt(v, 10) === s.outs
    }
    case 'equity': {
      const n = parseFloat(v.replace('%', ''))
      return !isNaN(n) && Math.abs(n - s.equityPct) <= 2
    }
    case 'playerType': {
      return v.toLowerCase() === s.villainPlayerType
    }
    case 'decision': {
      return v.toLowerCase() === s.decision
    }
  }
}

function expectedAnswer(step: Step, s: Scenario): string {
  switch (step) {
    case 'potOdds': return `${s.potOddsNum}:${s.potOddsDen}`
    case 'breakeven': return `${s.breakevenPct}%`
    case 'outs': return `${s.outs}`
    case 'equity': return `${s.equityPct}%`
    case 'playerType': return s.villainPlayerType
    case 'decision': return s.decision
  }
}

function getStepGuide(step: Step, s: Scenario, prevResults: (StepResult | undefined)[]): { formula: string; worked: string; tip?: string } | null {
  const totalIfCall = s.pot + s.callAmount
  switch (step) {
    case 'potOdds':
      return {
        formula: 'Pot ÷ Call Amount = X:1',
        worked: `$${s.pot} ÷ $${s.callAmount} = ?:1`,
        tip: 'Common ratios: $60/$20 = 3:1 · $90/$30 = 3:1 · $100/$25 = 4:1',
      }
    case 'breakeven':
      return {
        formula: 'Call ÷ (Pot + Call) × 100 = %',
        worked: `$${s.callAmount} ÷ ($${s.pot} + $${s.callAmount}) = $${s.callAmount} ÷ $${totalIfCall} = ?%`,
        tip: 'Quick table: 2:1 → 33% · 3:1 → 25% · 4:1 → 20% · 5:1 → 17%',
      }
    case 'outs':
      return {
        formula: 'Count every card left in the deck that completes your hand',
        worked: s.outDesc,
      }
    case 'equity': {
      const rule = s.cardsToCome === 2 ? 4 : 2
      return {
        formula: `Rule of ${rule}: Outs × ${rule} = equity %`,
        worked: `${s.outs} outs × ${rule} = ?%`,
      }
    }
    case 'playerType':
      return null
    case 'decision': {
      const equityIdx = s.steps.indexOf('equity')
      const breakevenIdx = s.steps.indexOf('breakeven')
      const equity = equityIdx >= 0 && prevResults[equityIdx] ? s.equityPct : '?'
      const breakeven = breakevenIdx >= 0 && prevResults[breakevenIdx] ? s.breakevenPct : '?'
      return {
        formula: 'If equity % > break-even % → call or raise   |   If lower → fold',
        worked: `Your equity: ~${equity}%   vs   Break-even: ${breakeven}%`,
      }
    }
  }
}

function PokerCard({ value }: { value: string }) {
  const suit = value.slice(-1)
  let colorClass: string
  if (suit === '♥') colorClass = 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
  else if (suit === '♦') colorClass = 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700'
  else if (suit === '♣') colorClass = 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
  else colorClass = 'text-gray-900 dark:text-white border-gray-300 dark:border-gray-600'
  return (
    <span className={`inline-flex items-center justify-center w-11 h-16 rounded-lg border-2 shadow font-bold text-sm select-none bg-white dark:bg-gray-800 ${colorClass}`}>
      {value}
    </span>
  )
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  3: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function ExplanationBody({ text, correct }: { text: string | undefined; correct: boolean }) {
  return (
    <p className={`text-sm leading-relaxed ${correct ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
      {text || (correct ? 'Correct!' : '')}
    </p>
  )
}

const SHUFFLE_CARDS = [
  { rank: 'A', suit: '♥' }, { rank: 'K', suit: '♦' },
  { rank: 'Q', suit: '♣' }, { rank: 'J', suit: '♠' },
  { rank: 'T', suit: '♥' }, { rank: '9', suit: '♦' },
  { rank: '8', suit: '♣' }, { rank: '7', suit: '♠' },
  { rank: '6', suit: '♥' }, { rank: '5', suit: '♦' },
  { rank: '4', suit: '♣' }, { rank: '3', suit: '♠' },
  { rank: '2', suit: '♥' }, { rank: 'A', suit: '♣' },
  { rank: 'K', suit: '♠' }, { rank: 'Q', suit: '♦' },
  { rank: 'J', suit: '♥' }, { rank: 'T', suit: '♠' },
] as const

// Fan spread positions for 5 cards (transform-origin: bottom center)
const FAN_TRANSFORMS = [
  'rotate(-28deg) translateX(-38px) translateY(5px)',
  'rotate(-14deg) translateX(-19px) translateY(1px)',
  'rotate(0deg)   translateX(0px)   translateY(0px)',
  'rotate(14deg)  translateX(19px)  translateY(1px)',
  'rotate(28deg)  translateX(38px)  translateY(5px)',
]

const SUIT_COLORS: Record<string, string> = {
  '♥': '#dc2626', '♦': '#b45309', '♣': '#1d4ed8', '♠': '#111827',
}

function CardBack() {
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 8,
      border: '1.5px solid #0e4d2a',
      background: 'linear-gradient(145deg, #1e7a50 0%, #0f4a2c 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
    }}>
      <div style={{
        width: '72%', height: '80%',
        border: '1.5px solid rgba(255,255,255,0.22)',
        borderRadius: 4,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.055) 0, rgba(255,255,255,0.055) 1px, transparent 0, transparent 50%)',
        backgroundSize: '7px 7px',
      }} />
    </div>
  )
}

function CardFace({ rank, suit }: { rank: string; suit: string }) {
  const color = SUIT_COLORS[suit] ?? '#111827'
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 8,
      border: '1.5px solid #d1d5db', background: '#ffffff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '3px 5px', boxSizing: 'border-box',
      boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
    }}>
      <div style={{ color, fontSize: 12, fontWeight: 800, lineHeight: 1 }}>{rank}</div>
      <div style={{ color, fontSize: 22, lineHeight: 1, alignSelf: 'center' }}>{suit}</div>
      <div style={{ color, fontSize: 12, fontWeight: 800, lineHeight: 1, transform: 'rotate(180deg)' }}>{rank}</div>
    </div>
  )
}

function ShuffleAnimation() {
  const [phase, setPhase] = useState<'stacked' | 'fanning' | 'fanned' | 'collapsing' | 'flipping'>('stacked')
  const [showFaces, setShowFaces] = useState(false)
  const [cardOffset, setCardOffset] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    let alive = true

    function go(ms: number, fn: () => void) {
      const id = setTimeout(() => { if (alive) fn() }, ms)
      timers.push(id)
    }

    function runCycle() {
      if (!alive) return
      go(650, () => {                          // pause — backs showing
        setShowFaces(true)
        setPhase('fanning')
        go(580, () => {                        // fanning complete
          setPhase('fanned')
          go(1400, () => {                     // hold fanned
            setPhase('collapsing')
            go(480, () => {                    // collapse complete
              setPhase('flipping')             // scaleX → 0
              go(270, () => {                  // mid-flip: swap content
                setShowFaces(false)
                setCardOffset(o => (o + 5) % SHUFFLE_CARDS.length)
                go(270, () => {               // scaleX → 1
                  setPhase('stacked')
                  runCycle()
                })
              })
            })
          })
        })
      })
    }

    runCycle()
    return () => { alive = false; timers.forEach(clearTimeout) }
  }, [])

  const cards = Array.from({ length: 5 }, (_, i) =>
    SHUFFLE_CARDS[(cardOffset + i) % SHUFFLE_CARDS.length]
  )

  const isFanning    = phase === 'fanning'
  const isFanned     = phase === 'fanned'
  const isCollapsing = phase === 'collapsing'
  const isFlipping   = phase === 'flipping'

  return (
    <div
      style={{
        transform: isFlipping ? 'scaleX(0)' : 'scaleX(1)',
        transition: isFlipping
          ? 'transform 0.27s ease-in'
          : phase === 'stacked' ? 'transform 0.27s ease-out' : 'none',
        width: 56, height: 78, position: 'relative', margin: '0 auto',
      }}
      aria-hidden="true"
    >
      {cards.map((card, i) => {
        let transform = 'rotate(0deg) translateX(0px) translateY(0px)'
        let transition = 'none'

        if (isFanned) {
          transform = FAN_TRANSFORMS[i]
        } else if (isFanning) {
          transform = FAN_TRANSFORMS[i]
          // Stagger fan-out: leftmost card leads slightly
          transition = `transform 0.38s ease-out ${i * 0.05}s`
        } else if (isCollapsing) {
          // Reverse stagger: rightmost card collapses first
          transition = `transform 0.34s ease-in ${(4 - i) * 0.04}s`
        }

        return (
          <div
            key={i}
            style={{
              position: 'absolute', inset: 0,
              transform, transition,
              zIndex: i,
              transformOrigin: 'bottom center',
            }}
          >
            {showFaces
              ? <CardFace rank={card.rank} suit={card.suit} />
              : <CardBack />
            }
          </div>
        )
      })}
    </div>
  )
}

async function fetchBatch(batch: 1 | 2): Promise<Scenario[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`/api/pokertrainer/scenarios?batch=${batch}`, { signal: controller.signal })
    if (!res.ok) {
      let detail = ''
      try { const body = await res.json(); detail = body.error ?? '' } catch { /* ignore */ }
      throw new Error(detail ? `${detail} (${res.status})` : `HTTP ${res.status}`)
    }
    const data = await res.json()
    if (!Array.isArray(data.scenarios) || data.scenarios.length !== 3) throw new Error('bad shape')
    return data.scenarios as Scenario[]
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchScenarios(): Promise<Scenario[]> {
  const [batch1, batch2] = await Promise.all([fetchBatch(1), fetchBatch(2)])
  return [...batch1, ...batch2]
}

export default function PokerTrainer() {
  const [scenarios, setScenarios] = useState<Scenario[]>(STATIC_SCENARIOS)
  const [loadingScenarios, setLoadingScenarios] = useState(true)
  const [usedFallback, setUsedFallback] = useState(false)
  const [filterLevel, setFilterLevel] = useState<1 | 2 | 3 | null>(null)
  const [sIdx, setSIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState<(StepResult | undefined)[]>([])
  const [explanations, setExplanations] = useState<(string | undefined)[]>([])
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [scenarioResults, setScenarioResults] = useState<{ correct: number; total: number }[]>([])
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [reasoning, setReasoning] = useState('')
  const [usedMic, setUsedMic] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [evaluation, setEvaluation] = useState<string | null>(null)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [micSupported, setMicSupported] = useState(false)
  const activeRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fetchToken = useRef(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    setMicSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition))
  }, [])

  useEffect(() => {
    const token = ++fetchToken.current
    fetchScenarios()
      .then(s => { if (fetchToken.current === token) setScenarios(s) })
      .catch((err: unknown) => {
        if (fetchToken.current === token) {
          const msg = err instanceof Error ? err.message : 'unknown error'
          console.error('[PokerTrainer] scenario fetch failed:', msg)
          setUsedFallback(true)
          setFallbackReason(msg)
        }
      })
      .finally(() => { if (fetchToken.current === token) setLoadingScenarios(false) })
  }, [])

  const activeScenarios = filterLevel ? scenarios.filter(s => s.level === filterLevel) : scenarios
  const scenario = activeScenarios[sIdx]

  if (!scenario) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">No scenarios for this difficulty level.</p>
          <button onClick={() => changeFilter(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
            Show All
          </button>
        </div>
      </div>
    )
  }

  const steps = scenario.steps
  const currentStep = steps[stepIdx]
  const currentResult = results[stepIdx]
  const currentExplanation = explanations[stepIdx]
  const isChecked = !!currentResult
  const isLastStep = stepIdx === steps.length - 1
  const scenarioDone = isChecked && isLastStep
  const config = STEP_CONFIG[currentStep]

  useLayoutEffect(() => {
    if (!isChecked) {
      activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      inputRef.current?.focus()
    }
  }, [stepIdx, sIdx, isChecked])

  // Keyboard navigation: Enter or → advances after an answer is checked
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement) return  // let reasoning field type normally
      if (e.key !== 'Enter' && e.key !== 'ArrowRight') return
      if (isChecked && !scenarioDone) { e.preventDefault(); nextStep() }
      else if (scenarioDone) { e.preventDefault(); nextScenario() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecked, scenarioDone])

  function startMic() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript
      setReasoning(prev => prev + (prev ? ' ' : '') + transcript)
      setUsedMic(true)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    setIsListening(true)
    recognition.start()
  }

  function stopMic() {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  async function submit(value: string) {
    const correct = checkAnswer(currentStep, value, scenario)
    const idx = stepIdx

    setResults(prev => {
      const next = [...prev]
      next[idx] = { correct, given: value }
      return next
    })
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }))
    setExplanations(prev => {
      const next = [...prev]
      next[idx] = scenario.explanations[currentStep] ?? expectedAnswer(currentStep, scenario)
      return next
    })

    // Fire evaluation for level 3 decision step with reasoning
    if (currentStep === 'decision' && scenario.level === 3 && reasoning.trim()) {
      const playerTypeStepIdx = scenario.steps.indexOf('playerType')
      const playerTypeResult = playerTypeStepIdx >= 0 ? results[playerTypeStepIdx] : undefined
      const playerTypeGiven = playerTypeResult ? playerTypeResult.given : ''
      setLoadingEvaluation(true)
      try {
        const res = await fetch('/api/pokertrainer/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: value,
            reasoning: reasoning.trim(),
            usedMic,
            playerTypeAnswer: playerTypeGiven,
            correctPlayerType: scenario.villainPlayerType,
            equityPct: scenario.equityPct,
            breakevenPct: scenario.breakevenPct,
            correctDecision: scenario.decision,
            villainDescription: scenario.villainDescription,
            street: scenario.street,
            pot: scenario.pot,
            callAmount: scenario.callAmount,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setEvaluation(data.evaluation ?? null)
        }
      } catch {
        setEvaluation('Coach feedback unavailable — try again.')
      } finally {
        setLoadingEvaluation(false)
      }
    }
  }

  function handleCheck() {
    const value = config.inputType === 'decision' || config.inputType === 'playerType' ? selected : input
    if (!value) return
    submit(value)
  }

  function nextStep() {
    setStepIdx(i => i + 1)
    setInput('')
    setSelected('')
  }

  function nextScenario() {
    const stepCorrect = results.filter(r => r?.correct).length
    const stepTotal = results.filter(r => r !== undefined).length
    setScenarioResults(prev => [...prev, { correct: stepCorrect, total: stepTotal }])

    if (sIdx + 1 >= activeScenarios.length) {
      setDone(true)
    } else {
      setSIdx(i => i + 1)
      setStepIdx(0)
      setResults([])
      setExplanations([])
      setInput('')
      setSelected('')
      setReasoning('')
      setUsedMic(false)
      setEvaluation(null)
    }
  }

  function resetSession() {
    setSIdx(0)
    setStepIdx(0)
    setResults([])
    setExplanations([])
    setInput('')
    setSelected('')
    setScore({ correct: 0, total: 0 })
    setScenarioResults([])
    setDone(false)
    setReasoning('')
    setUsedMic(false)
    setEvaluation(null)
    setLoadingEvaluation(false)
  }

  function changeFilter(lvl: 1 | 2 | 3 | null) {
    setFilterLevel(lvl)
    resetSession()
  }

  function restart() {
    resetSession()
    setFilterLevel(null)
    setUsedFallback(false)
    setLoadingScenarios(true)
    const token = ++fetchToken.current
    fetchScenarios()
      .then(s => { if (fetchToken.current === token) setScenarios(s) })
      .catch((err: unknown) => {
        if (fetchToken.current === token) {
          const msg = err instanceof Error ? err.message : 'unknown error'
          console.error('[PokerTrainer] scenario fetch failed:', msg)
          setUsedFallback(true)
          setFallbackReason(msg)
        }
      })
      .finally(() => { if (fetchToken.current === token) setLoadingScenarios(false) })
  }

  if (loadingScenarios) {
    return (
      <div
        className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
        role="status"
        aria-live="polite"
        aria-label="Loading scenarios"
      >
        <div className="text-center">
          <div className="mx-auto mb-10">
            <ShuffleAnimation />
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Shuffling the deck...</p>
          <p className="text-sm text-gray-400 mt-1">Generating fresh scenarios</p>
        </div>
      </div>
    )
  }

  if (done) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card-professional max-w-sm w-full text-center p-8">
          <div className="text-5xl mb-4">🃏</div>
          <h1 className="text-2xl font-bold mb-1">Session Complete</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {score.correct} / {score.total} steps correct ({pct}%)
          </p>
          <div className={`text-3xl font-bold mb-2 ${pct >= 80 ? 'text-green-500' : pct >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
            {pct >= 80 ? '🏆 Shark' : pct >= 60 ? '📈 Improving' : '📚 Keep Studying'}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {pct >= 80
              ? 'You make +EV decisions. Table image: dangerous.'
              : pct >= 60
              ? 'Solid foundation. Work on the tricky spots.'
              : 'Review the Rule of 2/4 and pot odds math.'}
          </p>
          <button onClick={restart} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors">
            Play Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4 px-5 sm:px-8 py-3">
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl" aria-hidden="true">🃏</span>
              <div>
                <h1 className="text-base sm:text-lg font-bold leading-tight">Poker Trainer</h1>
                <p className="text-xs text-gray-400 hidden sm:block">Pot odds · Outs · Equity</p>
              </div>
            </div>
          </div>

          {/* Progress pips */}
          <div className="flex gap-1.5 items-center" role="list" aria-label="Scenario progress">
            {activeScenarios.map((s, i) => {
              const sr = scenarioResults[i]
              let pipClass: string
              if (i < sIdx) {
                if (!sr) pipClass = 'w-2.5 h-2.5 bg-green-500'
                else if (sr.correct === sr.total) pipClass = 'w-2.5 h-2.5 bg-green-500'
                else if (sr.correct === 0) pipClass = 'w-2.5 h-2.5 bg-red-400'
                else pipClass = 'w-2.5 h-2.5 bg-yellow-400'
              } else if (i === sIdx) {
                pipClass = 'w-3 h-3 bg-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
              } else {
                pipClass = 'w-2 h-2 bg-gray-200 dark:bg-gray-700'
              }
              const status = i < sIdx
                ? sr ? (sr.correct === sr.total ? 'perfect' : `${sr.correct}/${sr.total} correct`) : 'complete'
                : i === sIdx ? 'current' : 'upcoming'
              return (
                <div
                  key={s.id}
                  role="listitem"
                  aria-label={`Scenario ${i + 1}: ${status}`}
                  className={`rounded-full transition-all ${pipClass}`}
                />
              )
            })}
          </div>

          <div
            className="text-right pl-2 border-l border-gray-200 dark:border-gray-700"
            aria-label={`Score: ${score.correct} of ${score.total} steps correct`}
          >
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">{score.correct}/{score.total}</div>
            <div className="text-xs text-gray-400 leading-none" aria-hidden="true">steps</div>
          </div>
        </div>

        {/* Difficulty tabs */}
        <div className="flex gap-1 px-5 sm:px-8 pb-2.5" role="tablist" aria-label="Difficulty level">
          {([null, 1, 2, 3] as (1 | 2 | 3 | null)[]).map(lvl => (
            <button
              key={lvl ?? 'all'}
              role="tab"
              aria-selected={filterLevel === lvl}
              onClick={() => changeFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                filterLevel === lvl
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {lvl === null ? 'All' : lvl === 1 ? 'Rookie' : lvl === 2 ? 'Regular' : 'Shark'}
            </button>
          ))}
        </div>

        {usedFallback && (
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center py-1 px-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800/30">
            Using practice scenarios — live generation unavailable
            {fallbackReason && <span className="ml-1 opacity-70">· {fallbackReason}</span>}
          </p>
        )}
      </header>

      {/* ── Body: 2-col on lg, stacked on mobile ────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT — scenario context */}
        <div className="lg:w-[42%] lg:flex-shrink-0 overflow-y-auto p-5 sm:p-7 lg:border-r border-gray-200 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-800/30">

          {/* Level + meta */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${LEVEL_COLORS[scenario.level]}`}>
              {scenario.levelName}
            </span>
            <span className="text-xs text-gray-400">Scenario {sIdx + 1}/{activeScenarios.length}</span>
            <span className="text-xs text-gray-400">· {scenario.street}</span>
          </div>

          {/* Quick Reference */}
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 px-4 py-3 space-y-1 mb-4">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Quick Reference</p>
            <p className="text-xs text-amber-800 dark:text-amber-300">Rule of 4 — outs × 4 when <strong>2 cards</strong> to come (Flop)</p>
            <p className="text-xs text-amber-800 dark:text-amber-300">Rule of 2 — outs × 2 when <strong>1 card</strong> to come (Turn)</p>
            <p className="text-xs text-amber-800 dark:text-amber-300 pt-0.5 border-t border-amber-100 dark:border-amber-800/30 mt-0.5">Breakeven: 2:1 → 33% · 3:1 → 25% · 4:1 → 20% · 5:1 → 17%</p>
          </div>

          {/* Poker Table */}
          <div className="mb-3">
            <PokerTable
              tableSize={scenario.tableSize}
              heroPosition={scenario.heroPosition}
              villainPosition={scenario.villainPosition}
              villainName={scenario.villainName}
              activePositions={[scenario.heroPosition, scenario.villainPosition, ...scenario.otherPlayers]}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1.5">
              You: <strong className="text-blue-500">{scenario.heroPosition}</strong>
              {' · '}
              {scenario.villainName}: <strong className="text-amber-500">{scenario.villainPosition}</strong>
              {' · '}
              <span className="text-gray-400">{scenario.tableSize}-handed</span>
            </p>
          </div>

          {/* Villain Profile */}
          <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-1">
              Villain: {scenario.villainName}
            </p>
            <p className="text-sm text-orange-800 dark:text-orange-300 leading-snug">{scenario.villainDescription}</p>
          </div>

          {/* Cards */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Your Hand</p>
            <div className="flex gap-2.5">
              {scenario.hand.map((c, i) => <PokerCard key={i} value={c} />)}
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Board ({scenario.street})</p>
            <div className="flex gap-2.5">
              {scenario.board.map((c, i) => <PokerCard key={i} value={c} />)}
            </div>
          </div>

          {/* Hand description */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl px-4 py-3 text-sm text-blue-800 dark:text-blue-300 mb-4 leading-snug">
            {scenario.handDesc}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Pot', value: `$${scenario.pot}`, color: 'text-green-600 dark:text-green-400' },
              { label: 'To Call', value: `$${scenario.callAmount}`, color: 'text-orange-500 dark:text-orange-400' },
              { label: 'Cards Left', value: `${scenario.cardsToCome}`, color: 'text-gray-800 dark:text-gray-100' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-3 text-center shadow-sm">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                <div className={`text-xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT — steps */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">

          {/* Completed steps */}
          {stepIdx > 0 && (
            <div className="space-y-2 mb-4">
              {steps.slice(0, stepIdx).map((step, i) => {
                const r = results[i]
                if (!r) return null
                return (
                  <div key={step} className={`rounded-xl border px-4 py-3 ${
                    r.correct
                      ? 'border-green-200 dark:border-green-800/60 bg-green-50 dark:bg-green-900/10'
                      : 'border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${r.correct ? 'bg-green-500' : 'bg-red-500'}`}>
                        {r.correct ? '✓' : '✗'}
                      </span>
                      <span className={`text-xs font-semibold ${r.correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                        {STEP_CONFIG[step].label}
                      </span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_STYLE[STEP_CONFIG[step].category]}`}>
                        {STEP_CONFIG[step].category}
                      </span>
                      {!r.correct && (
                        <span className="text-xs text-gray-400 ml-auto">
                          was <strong>{expectedAnswer(step, scenario)}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-6">
                      {explanations[i] || scenario.explanations[step]}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Active step */}
          <div ref={activeRef}>
            <div className={`rounded-xl border bg-white dark:bg-gray-800/60 shadow-sm p-5 ${
              !isChecked
                ? 'border-blue-400 dark:border-blue-500 shadow-blue-100 dark:shadow-none ring-1 ring-blue-300 dark:ring-blue-700'
                : currentResult!.correct
                  ? 'border-green-300 dark:border-green-700'
                  : 'border-red-300 dark:border-red-700'
            }`}>
              {/* Step header */}
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                  isChecked ? (currentResult!.correct ? 'bg-green-500' : 'bg-red-500') : 'bg-blue-500'
                }`}>
                  {isChecked ? (currentResult!.correct ? '✓' : '✗') : stepIdx + 1}
                </span>
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Step {stepIdx + 1} of {steps.length}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm leading-tight">{config.label}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLE[config.category]}`}>
                      {config.category}
                    </span>
                  </div>
                </div>
              </div>

              {isChecked ? (
                <div className={`rounded-lg px-4 py-3 ${
                  currentResult!.correct ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  {!currentResult!.correct && (
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">
                      Correct answer: {expectedAnswer(currentStep, scenario)}
                    </p>
                  )}
                  <ExplanationBody
                    text={currentExplanation}
                    correct={currentResult!.correct}
                  />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{getPrompt(currentStep, scenario, results)}</p>

                  {/* Formula guide */}
                  {(() => {
                    const guide = getStepGuide(currentStep, scenario, results)
                    return guide ? (
                      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-4 py-3 mb-4 border border-gray-200 dark:border-gray-600/50">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">{guide.formula}</p>
                        <p className="text-base font-mono font-bold text-gray-800 dark:text-gray-100">{guide.worked}</p>
                        {guide.tip && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-600/50">{guide.tip}</p>
                        )}
                      </div>
                    ) : null
                  })()}

                  {config.inputType === 'playerType' ? (
                    <div>
                      <PlayerTypeStep
                        selected={selected as PlayerType | ''}
                        onSelect={(type) => setSelected(type)}
                        disabled={false}
                      />
                      <button
                        onClick={handleCheck}
                        disabled={!selected}
                        className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Confirm Read
                      </button>
                    </div>
                  ) : config.inputType === 'decision' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Decision">
                        {(['call', 'fold', 'raise'] as Decision[]).map(d => (
                          <button
                            key={d}
                            role="radio"
                            aria-checked={selected === d}
                            onClick={() => setSelected(d)}
                            className={`py-3 rounded-xl font-semibold text-sm capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                              selected === d
                                ? d === 'call' ? 'bg-green-600 text-white shadow-md'
                                  : d === 'fold' ? 'bg-red-600 text-white shadow-md'
                                  : 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <span aria-hidden="true">{d === 'call' ? '📞 ' : d === 'fold' ? '🗑️ ' : '⬆️ '}</span>
                            {d === 'call' ? 'Call' : d === 'fold' ? 'Fold' : 'Raise'}
                          </button>
                        ))}
                      </div>
                      {/* Reasoning textarea — shown for all decision steps */}
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1.5">
                          {scenario.level === 3 ? 'Optional: explain your reasoning — AI coach will evaluate it' : 'Optional: explain your thinking'}
                        </p>
                        <div className="relative">
                          <textarea
                            value={reasoning}
                            onChange={e => setReasoning(e.target.value)}
                            placeholder="e.g. I'm calling because my equity beats the breakeven, and this player bets wide..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none pr-12"
                          />
                          {micSupported && (
                            <button
                              onClick={isListening ? stopMic : startMic}
                              type="button"
                              aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                              className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all text-base ${
                                isListening
                                  ? 'bg-red-500 text-white shadow-md ring-2 ring-red-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              🎙️
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleCheck}
                        disabled={!selected}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Confirm Decision
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type={config.inputType === 'number' ? 'number' : 'text'}
                        aria-label={config.label}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCheck()}
                        placeholder={config.inputType === 'ratio' ? 'e.g. 3:1' : 'e.g. 25'}
                        min={0}
                        autoFocus
                        autoComplete="off"
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {config.inputType === 'number' && <span className="text-sm text-gray-400 font-medium" aria-hidden="true">%</span>}
                      <button
                        onClick={handleCheck}
                        disabled={!input.trim()}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Check ↵
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI evaluation (level 3 decision step after checking) */}
            {isChecked && currentStep === 'decision' && (loadingEvaluation || evaluation) && (
              <div className={`mt-3 rounded-xl px-4 py-3 border ${
                loadingEvaluation
                  ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'
                  : 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/40'
              }`}>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1.5">
                  Coach Evaluation
                </p>
                {loadingEvaluation ? (
                  <p className="text-sm text-gray-400 italic">Analyzing your reasoning...</p>
                ) : (
                  <p className="text-sm text-purple-800 dark:text-purple-300 leading-relaxed">{evaluation}</p>
                )}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          {isChecked && !scenarioDone && (
            <button onClick={nextStep} className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2">
              <span>Next Step</span>
              <span className="opacity-60 text-xs font-normal">↵ or →</span>
            </button>
          )}
          {scenarioDone && (
            <button onClick={nextScenario} className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2">
              <span>{sIdx + 1 >= activeScenarios.length ? 'See Results 🏆' : 'Next Scenario'}</span>
              {sIdx + 1 < activeScenarios.length && <span className="opacity-60 text-xs font-normal">↵ or →</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
