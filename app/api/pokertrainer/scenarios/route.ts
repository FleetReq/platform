import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const client = new Anthropic()

type Step = 'potOdds' | 'breakeven' | 'outs' | 'equity' | 'decision'
type Decision = 'call' | 'fold' | 'raise'

interface RawScenario {
  level: 1 | 2 | 3
  street: string
  hand: string[]
  board: string[]
  handDesc: string
  pot: number
  callAmount: number
  cardsToCome: 1 | 2
  outs: number
  outDesc: string
}

const STEPS_BY_LEVEL: Record<1 | 2 | 3, Step[]> = {
  1: ['potOdds', 'breakeven'],
  2: ['potOdds', 'breakeven', 'outs', 'equity'],
  3: ['potOdds', 'breakeven', 'outs', 'equity', 'decision'],
}

const LEVEL_NAMES: Record<1 | 2 | 3, string> = {
  1: 'Rookie',
  2: 'Regular',
  3: 'Shark',
}

const CLEAN_RATIOS = [2, 2.5, 3, 4, 5]
const CARD_RE = /^[2-9TJQKA][♠♥♦♣]$/

function computeDecision(level: 1 | 2 | 3, equityPct: number, breakevenPct: number): Decision {
  if (equityPct < breakevenPct) return 'fold'
  if (level === 3 && equityPct > breakevenPct * 1.5 && equityPct >= 35) return 'raise'
  return 'call'
}

function buildExplanations(
  raw: RawScenario,
  potOddsNum: number,
  breakevenPct: number,
  equityPct: number,
  decision: Decision,
): Partial<Record<Step, string>> {
  const total = raw.pot + raw.callAmount
  const rule = raw.cardsToCome === 2 ? 4 : 2
  const cardsStr = raw.cardsToCome === 2 ? 'Two cards to come' : 'One card to come'
  const compareStr = equityPct >= breakevenPct
    ? `beats the ${breakevenPct}% needed`
    : `falls short of the ${breakevenPct}% needed`

  const decisionText: Record<Decision, string> = {
    fold: `Fold. Your ${equityPct}% equity falls short of the ${breakevenPct}% needed to break even. Calling here loses money over time.`,
    call: `Call. Your ${equityPct}% equity beats the ${breakevenPct}% breakeven — this is a profitable call in the long run.`,
    raise: `Raise. With ${equityPct}% equity vs a ${breakevenPct}% breakeven you have a commanding edge. Raising builds the pot for when you hit and gives you fold equity to win immediately.`,
  }

  return {
    potOdds: `Pot is $${raw.pot}, you call $${raw.callAmount}. Divide: ${raw.pot} ÷ ${raw.callAmount} = ${potOddsNum}. Your pot odds are ${potOddsNum}:1.`,
    breakeven: `You risk $${raw.callAmount} to win $${total} total ($${raw.pot} + $${raw.callAmount}). ${raw.callAmount} ÷ ${total} ≈ ${breakevenPct}%. You need ${breakevenPct}% equity to break even.`,
    outs: raw.outDesc,
    equity: `${cardsStr} → Rule of ${rule}: ${raw.outs} × ${rule} = ${equityPct}%. Your equity (${equityPct}%) ${compareStr}.${equityPct < breakevenPct ? ' Fold.' : ''}`.trimEnd(),
    decision: decisionText[decision],
  }
}

function processScenario(raw: RawScenario, idx: number) {
  const potOddsNum = Math.round((raw.pot / raw.callAmount) * 10) / 10
  const total = raw.pot + raw.callAmount
  const breakevenPct = Math.round((raw.callAmount / total) * 100)
  const rule = raw.cardsToCome === 2 ? 4 : 2
  const equityPct = raw.outs * rule
  const decision = computeDecision(raw.level, equityPct, breakevenPct)

  return {
    id: idx + 1,
    level: raw.level,
    levelName: LEVEL_NAMES[raw.level],
    street: raw.street,
    hand: raw.hand,
    board: raw.board,
    handDesc: raw.handDesc,
    pot: raw.pot,
    callAmount: raw.callAmount,
    cardsToCome: raw.cardsToCome,
    outs: raw.outs,
    outDesc: raw.outDesc,
    potOddsNum,
    potOddsDen: 1,
    breakevenPct,
    equityPct,
    decision,
    steps: STEPS_BY_LEVEL[raw.level],
    explanations: buildExplanations(raw, potOddsNum, breakevenPct, equityPct, decision),
  }
}

function validate(s: unknown): s is RawScenario {
  if (!s || typeof s !== 'object') return false
  const r = s as Record<string, unknown>
  if (![1, 2, 3].includes(r.level as number)) return false
  if (!['Flop', 'Turn'].includes(r.street as string)) return false  // River unsupported (0 cards to come)
  if (!Array.isArray(r.hand) || r.hand.length !== 2) return false
  if (!Array.isArray(r.board)) return false
  if (typeof r.pot !== 'number' || r.pot <= 0) return false
  if (typeof r.callAmount !== 'number' || r.callAmount <= 0 || r.callAmount >= r.pot) return false
  if (![1, 2].includes(r.cardsToCome as number)) return false
  if (typeof r.outs !== 'number' || r.outs < 1 || r.outs > 20) return false
  if (typeof r.outDesc !== 'string' || !r.outDesc) return false
  if (typeof r.handDesc !== 'string' || !r.handDesc) return false

  // Street ↔ board length ↔ cardsToCome must all agree
  if (r.street === 'Flop' && ((r.board as string[]).length !== 3 || r.cardsToCome !== 2)) return false
  if (r.street === 'Turn' && ((r.board as string[]).length !== 4 || r.cardsToCome !== 1)) return false

  // Card format and uniqueness
  const allCards = [...(r.hand as string[]), ...(r.board as string[])]
  if (!allCards.every(c => typeof c === 'string' && CARD_RE.test(c))) return false
  if (new Set(allCards).size !== allCards.length) return false

  // pot/callAmount must give a clean ratio
  const ratio = (r.pot as number) / (r.callAmount as number)
  if (!CLEAN_RATIOS.some(cr => Math.abs(ratio - cr) < 0.1)) return false

  return true
}

const SYSTEM_PROMPT = `You are a poker scenario generator for a pot odds training app.

STRICT RULES:
1. Use Unicode suit symbols only: ♠ ♥ ♦ ♣
2. No card may appear twice within the same scenario (hand + board combined)
3. pot ÷ callAmount must equal exactly one of: 2, 2.5, 3, 4, or 5
4. Only Flop and Turn scenarios (no River — there must always be cards to come)
5. cardsToCome: always 2 for Flop, always 1 for Turn
6. Flop board has exactly 3 cards, Turn board has exactly 4 cards
7. outs must be accurate (flush draw = 9, OESD = 8, gutshot = 4, combo draw varies)
8. outDesc must show the counting step-by-step
9. Return ONLY raw JSON — no markdown, no code blocks, no explanation`

const USER_PROMPT = `Generate exactly 6 Texas Hold'em scenarios.

Level assignment:
- scenarios[0] and [1]: level 1 (Rookie)
- scenarios[2] and [3]: level 2 (Regular)
- scenarios[4] and [5]: level 3 (Shark)

Variety requirements:
- Include flush draws, open-ended straight draws, gutshots, and at least one combo draw
- Mix Flop and Turn scenarios
- At least 2 scenarios result in fold decisions (equity < breakeven) and at least 2 in call/raise

Return this exact structure:
{
  "scenarios": [
    {
      "level": 1,
      "street": "Flop",
      "hand": ["A♥", "7♥"],
      "board": ["K♥", "9♥", "2♣"],
      "handDesc": "Nut flush draw — any heart gives you the best possible flush",
      "pot": 60,
      "callAmount": 20,
      "cardsToCome": 2,
      "outs": 9,
      "outDesc": "13 hearts total − 4 visible (A♥ 7♥ K♥ 9♥) = 9 outs remaining"
    }
  ]
}`

export async function GET(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API not configured' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const limited = rateLimit(`pokertrainer:${ip}`, RATE_LIMITS.EXPENSIVE)
  if (!limited.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let raw: unknown
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    raw = JSON.parse(cleaned)
  } catch (err) {
    console.error('[pokertrainer/scenarios] generation failed:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 503 })
  }

  const rawScenarios = (raw as { scenarios?: unknown[] })?.scenarios
  if (!Array.isArray(rawScenarios) || rawScenarios.length !== 6) {
    return NextResponse.json({ error: 'Invalid response shape' }, { status: 503 })
  }

  const valid = rawScenarios.every(validate)
  if (!valid) {
    console.warn('[pokertrainer/scenarios] validation failed for one or more scenarios')
    return NextResponse.json({ error: 'Scenario validation failed' }, { status: 503 })
  }

  const scenarios = rawScenarios.map((s, i) => processScenario(s as RawScenario, i))
  return NextResponse.json({ scenarios })
}
