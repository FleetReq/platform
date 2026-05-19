import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'


const client = new Anthropic()

type Step = 'potOdds' | 'breakeven' | 'outs' | 'equity' | 'playerType' | 'decision'
type Decision = 'call' | 'fold' | 'raise'
type PlayerType = 'nit' | 'tag' | 'lag' | 'station' | 'maniac'

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
  // Villain/table fields — optional; defaults applied in processScenario
  tableSize?: number
  heroPosition?: string
  villainPosition?: string
  otherPlayers?: string[]
  villainName?: string
  villainDescription?: string
  villainPlayerType?: PlayerType
}

const STEPS_BY_LEVEL: Record<1 | 2 | 3, Step[]> = {
  1: ['potOdds', 'breakeven', 'outs', 'equity', 'decision'],
  2: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
  3: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
}

const LEVEL_NAMES: Record<1 | 2 | 3, string> = {
  1: 'Rookie',
  2: 'Regular',
  3: 'Shark',
}

const CLEAN_RATIOS = [2, 2.5, 3, 4, 5]
const CARD_RE = /^[2-9TJQKA][♠♥♦♣]$/
const VALID_POSITIONS = new Set(['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'LJ', 'HJ', 'CO'])
const VALID_PLAYER_TYPES = new Set<PlayerType>(['nit', 'tag', 'lag', 'station', 'maniac'])

const PLAYER_TYPE_EXPLAINS: Record<PlayerType, string> = {
  nit: 'Nits play very few hands. When they bet big, their range is narrow and strong.',
  tag: 'TAGs play solid ranges and apply pressure with good hands. Disciplined but bluff occasionally.',
  lag: 'LAGs play many hands with lots of aggression. Their wide range makes their bets harder to read.',
  station: 'Calling stations rarely fold. Bluffing is pointless — value bet heavily when you hit.',
  maniac: 'Maniacs raise and re-raise with nearly anything. Massive implied odds when you hit.',
}

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
  villainName: string,
  villainPlayerType: PlayerType,
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
    breakeven: `Your ${potOddsNum}:1 pot odds = risking $${raw.callAmount} for a $${total} pot. $${raw.callAmount} ÷ $${total} ≈ ${breakevenPct}%. You need at least ${breakevenPct}% equity to break even — now go find out if you have it.`,
    outs: raw.outDesc,
    equity: `${cardsStr} → Rule of ${rule}: ${raw.outs} × ${rule} = ${equityPct}%. Your equity (${equityPct}%) ${compareStr}.${equityPct < breakevenPct ? ' Fold.' : ''}`.trimEnd(),
    playerType: `${villainName} is a ${villainPlayerType.toUpperCase()}. ${PLAYER_TYPE_EXPLAINS[villainPlayerType]}`,
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

  // Villain/table fields — fill in sensible defaults if Haiku omitted them
  const tableSize       = (typeof raw.tableSize === 'number' && raw.tableSize >= 2 && raw.tableSize <= 8) ? raw.tableSize : 6
  const heroPosition    = (typeof raw.heroPosition === 'string' && VALID_POSITIONS.has(raw.heroPosition)) ? raw.heroPosition : 'CO'
  const villainPosition = (typeof raw.villainPosition === 'string' && VALID_POSITIONS.has(raw.villainPosition) && raw.villainPosition !== heroPosition) ? raw.villainPosition : 'BTN'
  const otherPlayers    = Array.isArray(raw.otherPlayers) ? raw.otherPlayers.filter((p): p is string => typeof p === 'string' && VALID_POSITIONS.has(p)) : []
  const villainName     = (typeof raw.villainName === 'string' && raw.villainName) ? raw.villainName : 'Villain'
  const villainDescription = (typeof raw.villainDescription === 'string' && raw.villainDescription.length > 5) ? raw.villainDescription : 'Your opponent at the table.'
  const villainPlayerType  = VALID_PLAYER_TYPES.has(raw.villainPlayerType as PlayerType) ? raw.villainPlayerType as PlayerType : 'tag'

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
    tableSize,
    heroPosition,
    villainPosition,
    otherPlayers,
    villainName,
    villainDescription,
    villainPlayerType,
    potOddsNum,
    potOddsDen: 1,
    breakevenPct,
    equityPct,
    decision,
    steps: STEPS_BY_LEVEL[raw.level],
    explanations: buildExplanations(raw, potOddsNum, breakevenPct, equityPct, decision, villainName, villainPlayerType),
  }
}

function validate(s: unknown, idx?: number): s is RawScenario {
  const tag = idx !== undefined ? `[scenario ${idx}]` : ''
  const fail = (reason: string) => { console.warn(`[pokertrainer/scenarios] validation${tag}: ${reason}`); return false }

  if (!s || typeof s !== 'object') return fail('not an object')
  const r = s as Record<string, unknown>
  if (![1, 2, 3].includes(r.level as number)) return fail(`bad level: ${r.level}`)
  if (!['Flop', 'Turn'].includes(r.street as string)) return fail(`bad street: ${r.street}`)
  if (!Array.isArray(r.hand) || r.hand.length !== 2) return fail(`bad hand: ${JSON.stringify(r.hand)}`)
  if (!Array.isArray(r.board)) return fail('board not array')
  if (typeof r.pot !== 'number' || r.pot <= 0) return fail(`bad pot: ${r.pot}`)
  if (typeof r.callAmount !== 'number' || r.callAmount <= 0 || r.callAmount >= r.pot) return fail(`bad callAmount: ${r.callAmount}`)
  if (![1, 2].includes(r.cardsToCome as number)) return fail(`bad cardsToCome: ${r.cardsToCome}`)
  if (typeof r.outs !== 'number' || r.outs < 1 || r.outs > 20) return fail(`bad outs: ${r.outs}`)
  if (typeof r.outDesc !== 'string' || !r.outDesc) return fail('missing outDesc')
  if (typeof r.handDesc !== 'string' || !r.handDesc) return fail('missing handDesc')

  // Street ↔ board length ↔ cardsToCome must all agree
  if (r.street === 'Flop' && ((r.board as string[]).length !== 3 || r.cardsToCome !== 2))
    return fail(`Flop board length ${(r.board as string[]).length} or cardsToCome ${r.cardsToCome}`)
  if (r.street === 'Turn' && ((r.board as string[]).length !== 4 || r.cardsToCome !== 1))
    return fail(`Turn board length ${(r.board as string[]).length} or cardsToCome ${r.cardsToCome}`)

  // Card format and uniqueness
  const allCards = [...(r.hand as string[]), ...(r.board as string[])]
  const badCard = allCards.find(c => typeof c !== 'string' || !CARD_RE.test(c))
  if (badCard !== undefined) return fail(`bad card format: ${badCard}`)
  if (new Set(allCards).size !== allCards.length) return fail(`duplicate cards: ${allCards.join(' ')}`)

  // pot/callAmount must give a clean ratio
  const ratio = (r.pot as number) / (r.callAmount as number)
  if (!CLEAN_RATIOS.some(cr => Math.abs(ratio - cr) < 0.1)) return fail(`bad ratio: ${ratio.toFixed(2)} (pot ${r.pot} call ${r.callAmount})`)
  if (r.level === 1 && Math.abs(ratio - 2.5) < 0.1) return fail('level 1 cannot use 2.5:1')

  // Villain/table fields are optional — missing or invalid values get defaults in processScenario

  return true
}

const SYSTEM_PROMPT = `You are a poker scenario generator for a pot odds training app.

STRICT RULES:
1. Use Unicode suit symbols only: ♠ ♥ ♦ ♣
2. No card may appear twice within the same scenario (hand + board combined)
3. pot ÷ callAmount must equal exactly one of: 2, 2.5, 3, 4, or 5
   Level 1 ONLY: never use 2.5 — it gives 2/7 ≈ 28.6% which requires real division and is not in the quick table. Level 1 must use 2, 3, 4, or 5 only.
4. Only Flop and Turn scenarios (no River — there must always be cards to come)
5. cardsToCome: always 2 for Flop, always 1 for Turn
6. Flop board has exactly 3 cards, Turn board has exactly 4 cards
7. outs must be accurate (flush draw = 9, OESD = 8, gutshot = 4, combo draw varies)
8. outDesc must show the counting step-by-step
9. heroPosition and villainPosition must be different valid positions: BTN SB BB UTG UTG+1 LJ HJ CO
10. villainPlayerType must be exactly one of: nit tag lag station maniac
11. Villain description calibration by level:
    - Level 1: clearly and obviously implies the player type (learning hint for new players)
    - Level 2: moderately suggestive but not obvious — player can figure it out with thought
    - Level 3: genuinely ambiguous — multiple types are plausible, any reasonable read is defensible
12. Return ONLY raw JSON — no markdown, no code blocks, no explanation`

const EXAMPLE_SCENARIO = `{
  "level": 1,
  "street": "Flop",
  "hand": ["A♥", "7♥"],
  "board": ["K♥", "9♥", "2♣"],
  "handDesc": "Nut flush draw — any heart gives you the best possible flush",
  "pot": 60,
  "callAmount": 20,
  "cardsToCome": 2,
  "outs": 9,
  "outDesc": "13 hearts total − 4 visible (A♥ 7♥ K♥ 9♥) = 9 outs remaining",
  "tableSize": 6,
  "heroPosition": "CO",
  "villainPosition": "BTN",
  "otherPlayers": ["SB", "BB"],
  "villainName": "Old Timer",
  "villainDescription": "An older gentleman who has folded almost every hand tonight. He finally raised big preflop for the first time and seems very sure of himself.",
  "villainPlayerType": "nit"
}`

// Batch 1: 1 scenario — smallest possible payload, loading screen gone in ~1.5s
// Batch 2: 5 scenarios — loads in background while user plays scenario 1
const BATCH_PROMPTS: Record<1 | 2, string> = {
  1: `Generate exactly 1 Texas Hold'em scenario at level 1 (Rookie).

Use a flush draw or open-ended straight draw on the Flop. Include a fold or call decision.

Return this exact structure: { "scenarios": [ ${EXAMPLE_SCENARIO} ] }`,

  2: `Generate exactly 5 Texas Hold'em scenarios.

Level assignment:
- scenarios[0]: level 1 (Rookie)
- scenarios[1]: level 2 (Regular)
- scenarios[2]: level 2 (Regular)
- scenarios[3]: level 3 (Shark)
- scenarios[4]: level 3 (Shark)

Variety: include flush draws, straight draws, at least 1 combo draw, mix Flop and Turn, at least 2 fold decisions, at least 1 raise decision.

Return this exact structure: { "scenarios": [ ${EXAMPLE_SCENARIO}, ... ] }`,
}

const BATCH_SIZE: Record<1 | 2, number> = { 1: 1, 2: 5 }
const BATCH_MAX_TOKENS: Record<1 | 2, number> = { 1: 400, 2: 1800 }

export async function GET(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API not configured' }, { status: 503 })
  }

  const batchParam = request.nextUrl.searchParams.get('batch')
  const batch = batchParam === '2' ? 2 : 1
  const idxOffset = batch === 2 ? BATCH_SIZE[1] : 0

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const limited = rateLimit(`pokertrainer:${ip}`, RATE_LIMITS.EXPENSIVE)
  if (!limited.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let raw: unknown
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: BATCH_MAX_TOKENS[batch],
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: BATCH_PROMPTS[batch] }],
    })

    if (!response.content.length) {
      console.error('[pokertrainer/scenarios] empty content, stop_reason:', response.stop_reason)
      throw new Error(`empty content (stop_reason: ${response.stop_reason})`)
    }
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    raw = JSON.parse(cleaned)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[pokertrainer/scenarios] batch ${batch} generation error: ${msg}`)
    return NextResponse.json({ error: 'Generation failed' }, { status: 503 })
  }

  const rawScenarios = (raw as { scenarios?: unknown[] })?.scenarios
  if (!Array.isArray(rawScenarios) || rawScenarios.length !== BATCH_SIZE[batch]) {
    console.warn(`[pokertrainer/scenarios] batch ${batch} bad shape: got ${Array.isArray(rawScenarios) ? rawScenarios.length : typeof rawScenarios} scenarios`)
    return NextResponse.json({ error: 'Invalid response shape' }, { status: 503 })
  }

  const valid = rawScenarios.every((s, i) => validate(s, i))
  if (!valid) {
    return NextResponse.json({ error: 'Scenario validation failed' }, { status: 503 })
  }

  const scenarios = rawScenarios.map((s, i) => processScenario(s as RawScenario, idxOffset + i))
  return NextResponse.json({ scenarios })
}
