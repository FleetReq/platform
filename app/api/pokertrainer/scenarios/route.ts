import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const maxDuration = 55

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
  tableSize?: number
  heroPosition?: string
  villainPosition?: string
  otherPlayers?: string[]
  villainName?: string
  villainDescription?: string
  villainPlayerType?: PlayerType
  villainResponses?: {
    fold: string
    call: string
    reraise: string
  }
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

const RANK_MAP: Record<string, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14,
}

function validateDrawConsistency(hand: string[], board: string[], handDesc: string, outs: number): string | null {
  const desc = handDesc.toLowerCase()
  const handSuits = hand.map(c => c.slice(-1))
  const boardSuits = board.map(c => c.slice(-1))

  if (desc.includes('flush') && !desc.match(/made flush|complete/)) {
    const flushSuit = handSuits.find(s => handSuits.filter(x => x === s).length === 2)
    if (!flushSuit)
      return 'flush draw claimed but hole cards are not both the same suit'
    const boardCount = boardSuits.filter(s => s === flushSuit).length
    if (boardCount < 2)
      return `flush draw claimed but only ${boardCount} board card(s) share suit ${flushSuit} — need at least 2`
  }

  if (desc.includes('straight')) {
    const allCards = [...hand, ...board]
    const rankNums = allCards.map(c => RANK_MAP[c[0]] ?? 0).filter(n => n > 0)
    const rankSet = new Set(rankNums)
    const withLowAce = rankSet.has(14) ? new Set([...rankSet, 1]) : rankSet

    if (outs === 8) {
      const hasOESD = [rankSet, withLowAce].some(set => {
        const arr = [...set].sort((a, b) => a - b)
        return arr.some((_, i) =>
          i + 3 < arr.length &&
          arr[i+1] === arr[i]+1 && arr[i+2] === arr[i]+2 && arr[i+3] === arr[i]+3
        )
      })
      if (!hasOESD)
        return `OESD (8 outs) claimed but cards don't contain 4 consecutive ranks: ${[...rankSet].sort((a,b)=>a-b).join(',')}`
    }

    if (outs === 4) {
      let hasGutshot = false
      for (let start = 1; start <= 10 && !hasGutshot; start++) {
        const window = [start, start+1, start+2, start+3, start+4]
        if (window.filter(r => withLowAce.has(r)).length === 4) hasGutshot = true
      }
      if (!hasGutshot)
        return `gutshot (4 outs) claimed but cards don't form 4-of-5 consecutive ranks: ${[...rankSet].sort((a,b)=>a-b).join(',')}`
    }
  }

  return null
}

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

  const villainNote: Record<PlayerType, Record<Decision, string>> = {
    nit: {
      call:  `${villainName} likely has a strong made hand — don't expect them to fold to aggression. You're calling for the pot odds, not implied odds. If you miss on the turn, let it go.`,
      fold:  `Against ${villainName} this is especially clear — Nits don't bet big without the goods.`,
      raise: `${villainName} will usually call or 3-bet with a premium — treat this as a semi-bluff. Your draw is the backup plan if they continue.`,
    },
    tag: {
      call:  `${villainName} is disciplined — when you hit and bet, they'll fold weaker pairs and pay off with strong hands. Play your made hand straightforwardly.`,
      fold:  `${villainName}'s range here is solid and balanced. The math reflects reality.`,
      raise: `${villainName} folds weak holdings to pressure — this semi-bluff has two ways to win: fold equity now, draw equity if called.`,
    },
    lag: {
      call:  `${villainName} bets wide, so you may already be winning even without completing the draw. Let the pot odds do the work.`,
      fold:  `${villainName} bets wide enough that folding is close — but the math says the price still isn't right even against their range.`,
      raise: `${villainName} may fold to resistance since they bluff frequently. If they continue, your draw keeps you live with plenty of outs.`,
    },
    station: {
      call:  `When you hit, bet every street against ${villainName} — they won't fold anything. Don't slow-play; extract maximum value.`,
      fold:  `${villainName} won't fold anyway, so there's no bluff equity to factor in. The math just doesn't support calling.`,
      raise: `${villainName} will call the raise, which is fine — you're building the pot for when you hit. Skip any bluffs on the river if you miss.`,
    },
    maniac: {
      call:  `${villainName} will fire again on future streets, so your implied odds are much better than the raw math shows. If you hit, you could win a massive pot.`,
      fold:  `Even ${villainName}'s loose range includes enough strong hands to make this fold correct at this price.`,
      raise: `${villainName} might 3-bet and turn this into a huge pot. Your equity can handle it — but be ready for a sweat.`,
    },
  }

  const decisionText: Record<Decision, string> = {
    fold:  `Fold. Your ${equityPct}% equity falls short of the ${breakevenPct}% needed to break even. ${villainNote[villainPlayerType].fold}`,
    call:  `Call. Your ${equityPct}% equity beats the ${breakevenPct}% breakeven — profitable in the long run. ${villainNote[villainPlayerType].call}`,
    raise: `Raise. With ${equityPct}% equity vs ${breakevenPct}% breakeven you have a commanding edge — raising builds the pot and gives you fold equity. ${villainNote[villainPlayerType].raise}`,
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

function validateVillainResponses(r: unknown): { fold: string; call: string; reraise: string } | undefined {
  if (!r || typeof r !== 'object') return undefined
  const o = r as Record<string, unknown>
  if (typeof o.fold !== 'string' || typeof o.call !== 'string' || typeof o.reraise !== 'string') return undefined
  if (!o.fold || !o.call || !o.reraise) return undefined
  return { fold: o.fold, call: o.call, reraise: o.reraise }
}

function processScenario(raw: RawScenario, idx: number) {
  const potOddsNum = Math.round((raw.pot / raw.callAmount) * 10) / 10
  const total = raw.pot + raw.callAmount
  const breakevenPct = Math.round((raw.callAmount / total) * 100)
  const rule = raw.cardsToCome === 2 ? 4 : 2
  const equityPct = raw.outs * rule
  const decision = computeDecision(raw.level, equityPct, breakevenPct)

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
    villainResponses: validateVillainResponses(raw.villainResponses),
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

  if (r.street === 'Flop' && ((r.board as string[]).length !== 3 || r.cardsToCome !== 2))
    return fail(`Flop board length ${(r.board as string[]).length} or cardsToCome ${r.cardsToCome}`)
  if (r.street === 'Turn' && ((r.board as string[]).length !== 4 || r.cardsToCome !== 1))
    return fail(`Turn board length ${(r.board as string[]).length} or cardsToCome ${r.cardsToCome}`)

  const allCards = [...(r.hand as string[]), ...(r.board as string[])]
  const badCard = allCards.find(c => typeof c !== 'string' || !CARD_RE.test(c))
  if (badCard !== undefined) return fail(`bad card format: ${badCard}`)
  if (new Set(allCards).size !== allCards.length) return fail(`duplicate cards: ${allCards.join(' ')}`)

  const drawError = validateDrawConsistency(r.hand as string[], r.board as string[], r.handDesc as string, r.outs as number)
  if (drawError) return fail(drawError)

  const ratio = (r.pot as number) / (r.callAmount as number)
  if (!CLEAN_RATIOS.some(cr => Math.abs(ratio - cr) < 0.1)) return fail(`bad ratio: ${ratio.toFixed(2)} (pot ${r.pot} call ${r.callAmount})`)
  if (r.level === 1 && Math.abs(ratio - 2.5) < 0.1) return fail('level 1 cannot use 2.5:1')

  return true
}

const SYSTEM_PROMPT = `You are a poker scenario generator for a pot odds training app.

DRAW CONSTRUCTION GUIDE — build the cards FIRST, then name the draw:

Flush draw on the FLOP (9 outs):
  A flush draw requires 4 cards of the same suit already visible.
  WRONG: hand A♦K♦ + flop Q♦7♣2♠ → only 3 diamonds total → this is a BACKDOOR flush draw, NOT a flush draw
  RIGHT: hand A♦K♦ + flop Q♦J♦2♠ → 4 diamonds total → outs = 13 − 4 = 9 → this IS a flush draw
  Rule: both hole cards share a suit AND the flop contains AT LEAST 2 cards of that same suit.
  Vary the suits and ranks each time — do not repeat the same cards.

OESD — open-ended straight draw (8 outs):
  Pick any 4 strictly consecutive ranks and distribute them across hole + board.
  Two different ranks (one lower, one higher) each have 4 cards that complete it = 8 outs total.
  NEVER claim OESD unless 4 consecutive ranks appear across hand+board combined.
  Vary the ranks each time.

Gutshot straight draw (4 outs):
  Pick 5 consecutive ranks, remove exactly one from the interior (not the ends).
  Distribute the 4 present ranks across hole + board.
  Only the one missing interior rank completes it = 4 outs.
  NEVER claim gutshot unless 4-of-5 consecutive ranks with one interior gap are present.

Combo flush+straight draw (15 outs typical):
  Satisfy BOTH the flush draw rule AND the OESD rule simultaneously.

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
12. Return ONLY raw JSON — no markdown, no code blocks, no explanation
13. For Level 2 and 3 scenarios ONLY: include a "villainResponses" object with "fold", "call", and "reraise" keys. Each value is one short sentence describing the villain's reaction when the hero raises — use the villain's name and match their personality. Example: { "fold": "Old Timer sighs and folds face-up.", "call": "Old Timer calls without hesitation.", "reraise": "Old Timer stares you down and ships it in." }
    Level 1 scenarios must NOT include villainResponses.
14. villainDescription must describe general table tendencies observed across multiple hands — NOT actions in the current hand. Never reference this hand's bet size, pot, or raise. Write observations like "has been folding to 3-bets all night" or "keeps buying in after busting". No specific hand actions.`

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

// Rotate draw type and street on each attempt so retries don't hit the same failure mode
const DRAW_HINTS = [
  'flush draw',
  'open-ended straight draw (OESD)',
  'gutshot straight draw',
  'combo flush+straight draw',
]

const DECISION_HINTS: Record<1 | 2 | 3, string> = {
  1: 'Decision should be call or fold (avoid raise at Rookie level — it confuses beginners)',
  2: 'Decision can be call, fold, or raise',
  3: 'Decision can be call, fold, or raise — raise is appropriate when equity strongly exceeds breakeven',
}

const VILLAIN_HINTS: Record<1 | 2 | 3, string> = {
  1: 'Villain description must clearly and obviously imply the player type (a helpful hint for beginners)',
  2: 'Villain description should be moderately suggestive — not obvious, but deducible with thought',
  3: 'Villain description should be genuinely ambiguous — multiple player types should be plausible',
}

function buildPrompt(level: 1 | 2 | 3, idx: number, attempt: number): string {
  const drawHint = DRAW_HINTS[(idx + attempt) % DRAW_HINTS.length]
  const streetHint = (idx + attempt) % 2 === 0 ? 'Flop' : 'Turn'
  const villainRespHint = level >= 2
    ? 'Include "villainResponses" with fold/call/reraise strings matching the villain\'s personality.'
    : 'Do NOT include villainResponses (Level 1 only).'

  return `Generate exactly 1 Texas Hold'em scenario at level ${level} (${LEVEL_NAMES[level]}).

Requirements:
- Draw type: ${drawHint} on the ${streetHint}
- ${DECISION_HINTS[level]}
- ${VILLAIN_HINTS[level]}
- ${villainRespHint}

Return this exact structure: { "scenarios": [ ${EXAMPLE_SCENARIO} ] }`
}

// Per-scenario generation with internal retry until valid — guarantees accuracy
const MAX_ATTEMPTS = 5
const RETRY_DELAY_MS = 600
const SINGLE_MAX_TOKENS = 700

export async function GET(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API not configured' }, { status: 503 })
  }

  const levelParam = request.nextUrl.searchParams.get('level')
  const idxParam = request.nextUrl.searchParams.get('idx')
  const level = (['1', '2', '3'].includes(levelParam ?? '')) ? parseInt(levelParam!) as 1 | 2 | 3 : 1
  const idx = Math.max(0, parseInt(idxParam ?? '0') || 0)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const limited = rateLimit(`pokertrainer:${ip}`, RATE_LIMITS.EXPENSIVE)
  if (!limited.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, RETRY_DELAY_MS))

    let raw: unknown
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: SINGLE_MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(level, idx, attempt) }],
      })

      if (!response.content.length) {
        console.warn(`[pokertrainer/scenarios] lvl${level}/idx${idx} attempt ${attempt + 1}: empty content`)
        continue
      }
      if (response.stop_reason === 'max_tokens') {
        console.warn(`[pokertrainer/scenarios] lvl${level}/idx${idx} attempt ${attempt + 1}: truncated`)
        continue
      }

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      raw = JSON.parse(cleaned)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[pokertrainer/scenarios] lvl${level}/idx${idx} attempt ${attempt + 1}: API/parse error: ${msg}`)
      continue
    }

    const rawArr = (raw as { scenarios?: unknown[] })?.scenarios
    if (!Array.isArray(rawArr) || rawArr.length < 1) {
      console.warn(`[pokertrainer/scenarios] lvl${level}/idx${idx} attempt ${attempt + 1}: bad shape`)
      continue
    }

    const rawScenario = rawArr[0]
    if (!validate(rawScenario, 0)) {
      // validate() already logs the reason — retry with shifted draw type
      continue
    }

    // Valid scenario — return immediately
    if (attempt > 0) {
      console.log(`[pokertrainer/scenarios] lvl${level}/idx${idx} succeeded on attempt ${attempt + 1}`)
    }
    return NextResponse.json({ scenario: processScenario(rawScenario as RawScenario, idx) })
  }

  console.error(`[pokertrainer/scenarios] lvl${level}/idx${idx} all ${MAX_ATTEMPTS} attempts exhausted`)
  return NextResponse.json({ error: 'Could not generate valid scenario' }, { status: 503 })
}
