import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a poker coach evaluating a student's decision and reasoning at the end of a practice hand.

Your response should be 3-5 sentences max. Evaluate whether their logic is sound — not just whether the answer matches the math, but whether they accounted for the player read correctly.

Key principles:
- Folding despite +EV math because of a strong read IS valid reasoning (a nit's range may not include hands you beat)
- Calling despite marginal math because of a LAG/maniac read IS valid (implied odds, fold equity)
- If they got the math right AND the player read right: enthusiastic confirmation
- If they got the math right but ignored the player read: note that the read should have influenced the decision
- If their reasoning is incoherent or self-contradictory: gently point out the issue
- If voice transcription errors seem present (gibberish words): interpret generously and note what you understood
- Never be harsh. This is learning, not a test.
- End with one concrete takeaway they can apply next time.`

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
    reasoning,
    usedMic,
    playerTypeAnswer,
    correctPlayerType,
    equityPct,
    breakevenPct,
    correctDecision,
    villainDescription,
    street,
    pot,
    callAmount,
  } = body

  const mathResult = equityPct >= breakevenPct ? 'call/raise (positive EV)' : 'fold (negative EV)'
  const playerTypeCorrect = playerTypeAnswer === correctPlayerType
  const decisionCorrect = decision === correctDecision

  const prompt = `
Hand context:
- Street: ${street}
- Pot: $${pot}, Call: $${callAmount}
- Equity: ~${equityPct}%, Breakeven: ${breakevenPct}%
- Math says: ${mathResult}
- Villain: "${villainDescription}"
- Correct player type: ${correctPlayerType} (student answered: ${playerTypeAnswer}, ${playerTypeCorrect ? 'CORRECT' : 'INCORRECT'})
- Correct decision: ${correctDecision} (student chose: ${decision}, ${decisionCorrect ? 'CORRECT' : 'INCORRECT'})
${usedMic ? '- Note: student used voice input — transcription may have minor errors' : ''}

Student's reasoning: "${reasoning}"

Evaluate their reasoning. Is the logic sound given both the math and the player read?`.trim()

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ evaluation: text })
  } catch (err) {
    console.error('[pokertrainer/evaluate] failed:', err)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 503 })
  }
}
