'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Step = 'potOdds' | 'breakeven' | 'outs' | 'equity' | 'decision'
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
  cardsTocome: 1 | 2
  outs: number
  outDesc: string
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

const SCENARIOS: Scenario[] = [
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
    cardsTocome: 2,
    outs: 9,
    outDesc: '13 hearts total − 4 visible (A♥ 7♥ K♥ 9♥) = 9 outs remaining',
    potOddsNum: 3,
    potOddsDen: 1,
    breakevenPct: 25,
    equityPct: 36,
    decision: 'call',
    steps: ['potOdds', 'breakeven'],
    explanations: {
      potOdds: 'Pot is $60, you call $20. Divide: 60 ÷ 20 = 3. Your pot odds are 3:1.',
      breakeven: 'You risk $20 to win $80 total ($60 pot + $20 call). 20 ÷ 80 = 25%. You need 25% equity to break even — and your flush draw has ~36%, so this is a clear call.',
      outs: '',
      equity: '',
      decision: '',
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
    cardsTocome: 1,
    outs: 8,
    outDesc: '4 Kings + 4 Eights = 8 straight outs',
    potOddsNum: 2,
    potOddsDen: 1,
    breakevenPct: 33,
    equityPct: 16,
    decision: 'fold',
    steps: ['potOdds', 'breakeven'],
    explanations: {
      potOdds: 'Pot is $90, you call $45. Divide: 90 ÷ 45 = 2. Your pot odds are 2:1.',
      breakeven: 'You risk $45 to win $135 total ($90 + $45). 45 ÷ 135 ≈ 33%. You need 33% equity — but with one card to come and 8 outs, you only have ~16%. Fold.',
      outs: '',
      equity: '',
      decision: '',
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
    cardsTocome: 1,
    outs: 9,
    outDesc: '13 spades − 4 visible (8♠ 7♠ 6♠ J♠) = 9 remaining spade outs',
    potOddsNum: 2,
    potOddsDen: 1,
    breakevenPct: 33,
    equityPct: 18,
    decision: 'fold',
    steps: ['potOdds', 'breakeven', 'outs', 'equity'],
    explanations: {
      potOdds: 'Pot is $120, you call $60. Divide: 120 ÷ 60 = 2. Your pot odds are 2:1.',
      breakeven: 'You risk $60 to win $180 total ($120 + $60). 60 ÷ 180 ≈ 33%. You need 33% equity to break even.',
      outs: '13 spades in the deck. You can see 4 (8♠ 7♠ 6♠ J♠). That leaves 9 outs.',
      equity: 'One card to come → Rule of 2: 9 × 2 = 18%. Your equity (18%) falls well short of 33%. Fold — the price is too high.',
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
    cardsTocome: 2,
    outs: 8,
    outDesc: '4 Jacks + 4 Sixes = 8 straight outs',
    potOddsNum: 5,
    potOddsDen: 1,
    breakevenPct: 17,
    equityPct: 32,
    decision: 'call',
    steps: ['potOdds', 'breakeven', 'outs', 'equity'],
    explanations: {
      potOdds: 'Pot is $50, you call $10. Divide: 50 ÷ 10 = 5. Your pot odds are 5:1.',
      breakeven: 'You risk $10 to win $60 total ($50 + $10). 10 ÷ 60 ≈ 17%. You only need 17% equity — a very cheap price.',
      outs: '4 Jacks (J T 9 8 7 straight) + 4 Sixes (T 9 8 7 6 straight) = 8 outs. Either card makes you a straight.',
      equity: 'Two cards to come → Rule of 4: 8 × 4 = 32%. Your equity (32%) nearly doubles the 17% needed. Easy call!',
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
    cardsTocome: 1,
    outs: 15,
    outDesc: '9 remaining clubs (flush) + 3 non-club Fives (5♠ 5♥ 5♦) + 3 non-club Tens (T♠ T♥ T♦) = 15 unique outs. 5♣ and T♣ are already in the flush count.',
    potOddsNum: 3,
    potOddsDen: 1,
    breakevenPct: 25,
    equityPct: 30,
    decision: 'call',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'decision'],
    explanations: {
      potOdds: 'Pot is $90, you call $30. Divide: 90 ÷ 30 = 3. Your pot odds are 3:1.',
      breakeven: 'You risk $30 to win $120 total ($90 + $30). 30 ÷ 120 = 25%. You need 25% equity to break even.',
      outs: '9 clubs remaining for the flush draw. The straight needs 5 or T — but 5♣ and T♣ are already counted as flush outs. Add 3 non-club Fives + 3 non-club Tens = 15 total unique outs.',
      equity: 'One card to come → Rule of 2: 15 × 2 = 30%. Your equity (30%) exceeds the 25% breakeven.',
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
    cardsTocome: 2,
    outs: 12,
    outDesc: '9 remaining clubs for the nut flush (T♣ already counted below) + T♦ T♥ T♠ for the broadway straight = 12 unique outs',
    potOddsNum: 3,
    potOddsDen: 1,
    breakevenPct: 25,
    equityPct: 48,
    decision: 'raise',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'decision'],
    explanations: {
      potOdds: 'Pot is $120, you call $40. Divide: 120 ÷ 40 = 3. Your pot odds are 3:1.',
      breakeven: 'You risk $40 to win $160 total ($120 + $40). 40 ÷ 160 = 25%. You need 25% equity to break even.',
      outs: '9 clubs remaining for nut flush (T♣ completes both flush and straight, counted once). Three non-club Tens (T♦ T♥ T♠) complete the gutshot broadway straight. Total: 12 unique outs.',
      equity: 'Two cards to come → Rule of 4: 12 × 4 = 48%. You have nearly a coin-flip edge — nearly double the breakeven!',
      decision: 'Raise! With 48% equity vs 25% breakeven you have a commanding advantage. Raising: (1) builds the pot for when you hit your nut draw, (2) gives you fold equity to win immediately, (3) with the nuts on any club or Ten, you never fear being re-raised off your hand.',
    },
  },
]

const STEP_CONFIG: Record<Step, { label: string; prompt: string; inputType: 'ratio' | 'number' | 'decision' }> = {
  potOdds: {
    label: 'Pot Odds',
    prompt: 'What are your pot odds? Enter as a ratio — e.g. "3:1"',
    inputType: 'ratio',
  },
  breakeven: {
    label: 'Break-Even %',
    prompt: 'What % equity do you need to break even? (whole number)',
    inputType: 'number',
  },
  outs: {
    label: 'Count Your Outs',
    prompt: 'How many outs do you have?',
    inputType: 'number',
  },
  equity: {
    label: 'Equity % (Rule of 2/4)',
    prompt: 'Using the Rule of 2 or 4, what is your approximate equity %? (whole number)',
    inputType: 'number',
  },
  decision: {
    label: 'The Decision',
    prompt: 'Based on your equity vs. break-even — call, fold, or raise?',
    inputType: 'decision',
  },
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
    case 'decision': return s.decision
  }
}

function getStepGuide(step: Step, s: Scenario, prevResults: (StepResult | undefined)[]): { formula: string; worked: string } | null {
  const totalIfCall = s.pot + s.callAmount
  switch (step) {
    case 'potOdds':
      return {
        formula: 'Pot ÷ Call Amount = X:1',
        worked: `$${s.pot} ÷ $${s.callAmount} = ?:1`,
      }
    case 'breakeven':
      return {
        formula: 'Call ÷ (Pot + Call) × 100 = %',
        worked: `$${s.callAmount} ÷ ($${s.pot} + $${s.callAmount}) = $${s.callAmount} ÷ $${totalIfCall} = ?%`,
      }
    case 'outs':
      return {
        formula: 'Count every card left in the deck that completes your hand',
        worked: s.outDesc,
      }
    case 'equity': {
      const rule = s.cardsTocome === 2 ? 4 : 2
      return {
        formula: `Rule of ${rule}: Outs × ${rule} = equity %`,
        worked: `${s.outs} outs × ${rule} = ?%`,
      }
    }
    case 'decision': {
      const equityResult = prevResults[3] // equity is step index 3
      const breakevenResult = prevResults[1] // breakeven is step index 1
      const equity = equityResult ? s.equityPct : '?'
      const breakeven = breakevenResult ? s.breakevenPct : '?'
      return {
        formula: 'If equity % > break-even % → call or raise   |   If lower → fold',
        worked: `Your equity: ~${equity}%   vs   Break-even: ${breakeven}%`,
      }
    }
  }
}

function PokerCard({ value }: { value: string }) {
  const red = value.includes('♥') || value.includes('♦')
  return (
    <span className={`inline-flex items-center justify-center w-11 h-16 rounded-lg border-2 shadow font-bold text-sm select-none
      ${red
        ? 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
      }`}
    >
      {value}
    </span>
  )
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  3: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function PokerTrainer() {
  const [sIdx, setSIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState<(StepResult | undefined)[]>([])
  const [explanations, setExplanations] = useState<(string | undefined)[]>([])
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState<Decision | ''>('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [done, setDone] = useState(false)
  const activeRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scenario = SCENARIOS[sIdx]
  const steps = scenario.steps
  const currentStep = steps[stepIdx]
  const currentResult = results[stepIdx]
  const currentExplanation = explanations[stepIdx]
  const isChecked = !!currentResult
  const isLastStep = stepIdx === steps.length - 1
  const scenarioDone = isChecked && isLastStep
  const config = STEP_CONFIG[currentStep]

  useEffect(() => {
    if (!isChecked) {
      setTimeout(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        inputRef.current?.focus()
      }, 80)
    }
  }, [stepIdx, sIdx, isChecked])

  const streamExplanation = useCallback(async (
    step: Step,
    correct: boolean,
    userAnswer: string,
    expected: string,
    idx: number
  ) => {
    setLoadingExplanation(true)
    setExplanations(prev => {
      const next = [...prev]
      next[idx] = ''
      return next
    })

    try {
      const res = await fetch('/api/pokertrainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          correct,
          userAnswer,
          expectedAnswer: expected,
          scenarioContext: {
            pot: scenario.pot,
            callAmount: scenario.callAmount,
            cardsTocome: scenario.cardsTocome,
            outs: scenario.outs,
            handDesc: scenario.handDesc,
            decision: scenario.decision,
            breakevenPct: scenario.breakevenPct,
            equityPct: scenario.equityPct,
            potOddsNum: scenario.potOddsNum,
          },
        }),
      })

      if (!res.ok || !res.body) throw new Error('API error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setExplanations(prev => {
          const next = [...prev]
          next[idx] = (next[idx] ?? '') + chunk
          return next
        })
      }
    } catch {
      setExplanations(prev => {
        const next = [...prev]
        next[idx] = scenario.explanations[step]
        return next
      })
    } finally {
      setLoadingExplanation(false)
    }
  }, [scenario])

  function submit(value: string) {
    const correct = checkAnswer(currentStep, value, scenario)
    const expected = expectedAnswer(currentStep, scenario)
    const idx = stepIdx

    setResults(prev => {
      const next = [...prev]
      next[idx] = { correct, given: value }
      return next
    })
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }))
    streamExplanation(currentStep, correct, value, expected, idx)
  }

  function handleCheck() {
    const value = config.inputType === 'decision' ? selected : input
    if (!value) return
    submit(value)
  }

  function nextStep() {
    setStepIdx(i => i + 1)
    setInput('')
    setSelected('')
  }

  function nextScenario() {
    if (sIdx + 1 >= SCENARIOS.length) {
      setDone(true)
    } else {
      setSIdx(i => i + 1)
      setStepIdx(0)
      setResults([])
      setExplanations([])
      setInput('')
      setSelected('')
    }
  }

  function restart() {
    setSIdx(0)
    setStepIdx(0)
    setResults([])
    setExplanations([])
    setInput('')
    setSelected('')
    setScore({ correct: 0, total: 0 })
    setDone(false)
  }

  if (done) {
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card-professional max-w-sm w-full text-center p-8">
          <div className="text-5xl mb-4">🃏</div>
          <h1 className="text-2xl font-bold mb-1">Session Complete</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {score.correct} / {score.total} correct ({pct}%)
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

  /* ── shared sub-sections ─────────────────────────────────────── */
  const scenarioPanel = (
    <>
      {/* Level + scenario label */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[scenario.level]}`}>
          {scenario.levelName}
        </span>
        <span className="text-xs text-gray-400">Scenario {sIdx + 1} of {SCENARIOS.length}</span>
        <span className="text-xs text-gray-400">· {scenario.street}</span>
      </div>

      {/* Scenario card */}
      <div className="card-professional p-5 mb-4">
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Hand</p>
          <div className="flex gap-2">
            {scenario.hand.map((c, i) => <PokerCard key={i} value={c} />)}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Board</p>
          <div className="flex gap-2">
            {scenario.board.map((c, i) => <PokerCard key={i} value={c} />)}
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 text-sm text-blue-800 dark:text-blue-300 mb-4">
          {scenario.handDesc}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg py-3">
            <div className="text-xs text-gray-400 mb-0.5">Pot</div>
            <div className="font-bold text-lg text-green-600 dark:text-green-400">${scenario.pot}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg py-3">
            <div className="text-xs text-gray-400 mb-0.5">To Call</div>
            <div className="font-bold text-lg text-orange-600 dark:text-orange-400">${scenario.callAmount}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg py-3">
            <div className="text-xs text-gray-400 mb-0.5">Cards Left</div>
            <div className="font-bold text-lg">{scenario.cardsTocome}</div>
          </div>
        </div>
      </div>

      {/* Rule of 2/4 reference */}
      <div className="text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
        <p>💡 <strong>Rule of 4:</strong> outs × 4 when 2 cards to come</p>
        <p>💡 <strong>Rule of 2:</strong> outs × 2 when 1 card to come</p>
      </div>
    </>
  )

  const stepsPanel = (
    <>
      {/* Completed steps */}
      <div className="space-y-2 mb-3">
        {steps.slice(0, stepIdx).map((step, i) => {
          const r = results[i]
          if (!r) return null
          return (
            <div
              key={step}
              className={`rounded-lg border px-4 py-3 text-sm ${
                r.correct
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${r.correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {r.correct ? '✓' : '✗'} {STEP_CONFIG[step].label}
                </span>
                {!r.correct && (
                  <span className="text-xs text-gray-400">
                    answer: <strong>{expectedAnswer(step, scenario)}</strong>
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                {explanations[i] ?? scenario.explanations[step]}
              </p>
            </div>
          )
        })}
      </div>

      {/* Active step */}
      <div ref={activeRef}>
        <div className={`card-professional p-5 ${!isChecked ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
              isChecked
                ? currentResult!.correct ? 'bg-green-500' : 'bg-red-500'
                : 'bg-blue-500'
            }`}>
              {isChecked ? (currentResult!.correct ? '✓' : '✗') : stepIdx + 1}
            </span>
            <span className="font-semibold text-sm">Step {stepIdx + 1}: {config.label}</span>
          </div>

          {isChecked ? (
            <div className={`rounded-lg px-3 py-2.5 text-sm ${
              currentResult!.correct ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              {!currentResult!.correct && (
                <p className="font-semibold text-red-700 dark:text-red-400 mb-1 text-xs">
                  Answer: {expectedAnswer(currentStep, scenario)}
                </p>
              )}
              {loadingExplanation && !currentExplanation ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <span className="inline-block w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="inline-block w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="inline-block w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${
                  currentResult!.correct ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}>
                  {currentExplanation ?? scenario.explanations[currentStep]}
                </p>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{config.prompt}</p>

              {(() => {
                const guide = getStepGuide(currentStep, scenario, results)
                return guide ? (
                  <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2.5 mb-3 space-y-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Formula</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{guide.formula}</p>
                    <p className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-200">{guide.worked}</p>
                  </div>
                ) : null
              })()}

              {config.inputType === 'decision' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(['call', 'fold', 'raise'] as Decision[]).map(d => (
                      <button
                        key={d}
                        onClick={() => setSelected(d)}
                        className={`flex-1 py-2.5 rounded-lg font-semibold text-sm capitalize transition-all ${
                          selected === d
                            ? d === 'call' ? 'bg-green-600 text-white shadow'
                              : d === 'fold' ? 'bg-red-600 text-white shadow'
                              : 'bg-purple-600 text-white shadow'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {d === 'call' ? '📞 Call' : d === 'fold' ? '🗑️ Fold' : '⬆️ Raise'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleCheck}
                    disabled={!selected}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type={config.inputType === 'number' ? 'number' : 'text'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCheck()}
                    placeholder={config.inputType === 'ratio' ? 'e.g. 3:1' : 'e.g. 25'}
                    min={0}
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {config.inputType === 'number' && <span className="text-sm text-gray-400">%</span>}
                  <button
                    onClick={handleCheck}
                    disabled={!input.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Check ↵
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Next buttons */}
      {isChecked && !scenarioDone && (
        <button onClick={nextStep} className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors">
          Next Step →
        </button>
      )}
      {scenarioDone && (
        <button onClick={nextScenario} className="mt-3 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors">
          {sIdx + 1 >= SCENARIOS.length ? 'See Results 🏆' : 'Next Scenario →'}
        </button>
      )}
    </>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-200/60 dark:border-gray-700/40">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight">🃏 Poker Trainer</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pot odds · Outs · Equity decisions</p>
        </div>
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{score.correct}/{score.total}</div>
          <div className="text-xs text-gray-400">correct</div>
        </div>
      </div>

      {/* Scenario progress bar */}
      <div className="flex gap-1 px-4 sm:px-8 py-2">
        {SCENARIOS.map((s, i) => (
          <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < sIdx ? 'bg-green-500' : i === sIdx ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
          }`} />
        ))}
      </div>

      {/* Main content — 2 columns on lg+, stacked on mobile */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-8 max-w-6xl w-full mx-auto">
        {/* Left: scenario */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {scenarioPanel}
        </div>
        {/* Right: steps */}
        <div>
          {stepsPanel}
        </div>
      </div>
    </div>
  )
}
