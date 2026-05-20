import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a seasoned poker coach evaluating a student's decision in a pot odds practice scenario. Give honest, concise feedback — 1-3 sentences max. Speak directly, like a coach at the table.

Verdict rules:
- "correct": the student made the right play — either the mathematically correct decision, or a defensible alternative well-justified by the villain type, position, or table dynamics
- "borderline": the math supports one answer but villain type/position makes the other play legitimate, OR equity is within 5% of breakeven, OR both call and raise are reasonable
- "incorrect": the student chose a play that loses money given the math, without sufficient justification from villain type, position, or table dynamics

Evaluate in this order: math first, then villain type, then position and table dynamics.

Position rules:
- Acting last post-flop (BTN > CO > HJ > LJ > UTG+1 > UTG > BB > SB) = in position = stronger case for calling and semi-bluff raising (more implied odds, can control pot size)
- Out of position = weaker case, lean conservative — raises risk getting 3-bet with no position advantage
- Multiple players still in hand behind the raiser = significant re-raise risk, weakens raise EV

Never be harsh — this is practice.
Return ONLY valid JSON: { "verdict": "correct" | "borderline" | "incorrect", "feedback": "your 1-3 sentence feedback" }`

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API not configured' }, { status: 503 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const limited = rateLimit(`pokertrainer-eval:${ip}`, RATE_LIMITS.EXPENSIVE)
  if (!limited.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json()
  const {
    decision,
    correctDecision,
    equityPct,
    breakevenPct,
    villainName,
    villainPlayerType,
    villainDescription,
    handDesc,
    heroPosition,
    villainPosition,
    otherPlayers,
    street,
    pot,
    callAmount,
    cardsToCome,
  } = body

  const mathVerdict = equityPct >= breakevenPct ? 'call or raise (+EV)' : 'fold (–EV)'
  const others: string[] = Array.isArray(otherPlayers) ? otherPlayers : []
  const totalPlayers = 2 + others.length
  const othersStr = others.length > 0 ? `, others in hand: ${others.join(', ')}` : ''

  const prompt = `Scenario:
- Street: ${street}, ${cardsToCome} card(s) to come
- Hand: ${handDesc}
- Pot: $${pot}, Call: $${callAmount}
- Equity: ${equityPct}%, Breakeven: ${breakevenPct}% — math says ${mathVerdict}
- Positions: Hero at ${heroPosition}, Villain at ${villainPosition} (${totalPlayers}-handed${othersStr})
- Villain: ${villainName} (${villainPlayerType}) — "${villainDescription}"
- Correct answer: ${correctDecision}
- Student chose: ${decision}

Evaluate.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    let verdict = 'correct'
    let feedback = text
    try {
      const parsed = JSON.parse(text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim())
      verdict = parsed.verdict ?? 'correct'
      feedback = parsed.feedback ?? text
    } catch { /* fallback: use raw text */ }

    return NextResponse.json({ verdict, feedback })
  } catch (err) {
    console.error('[pokertrainer/evaluate] failed:', err)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 503 })
  }
}
