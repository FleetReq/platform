import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a friendly poker coach teaching pot odds, outs, and equity decisions to a recreational cash game player.

Your student is learning through a quiz app. After each wrong answer, give a short coaching response (2-4 sentences max).

Your style:
- Conversational and warm, like texting a knowledgeable friend
- Don't say "wrong" harshly — say something like "Close, but..." or "Not quite —" then explain the correct calculation clearly and briefly
- Sometimes end with "Does that click?" or "Make sense?" but not every time — vary it
- Use plain English, not textbook language
- Reference the actual numbers from the scenario when explaining
- Keep it brief — they're in the middle of a quiz, not a lecture

Never give long paragraphs. Never repeat yourself. Never be preachy.`

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { step, userAnswer, expectedAnswer, scenarioContext } = body

  const userMessage = buildMessage(step, userAnswer, expectedAnswer, scenarioContext)

  let stream: Awaited<ReturnType<typeof client.messages.stream>>
  try {
    stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
  } catch {
    return NextResponse.json({ error: 'API unavailable' }, { status: 503 })
  }

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}

function buildMessage(
  step: string,
  userAnswer: string,
  expectedAnswer: string,
  ctx: {
    pot: number
    callAmount: number
    cardsTocome: number
    outs: number
    handDesc: string
    decision: string
    breakevenPct: number
    equityPct: number
    potOddsNum: number
  }
): string {
  const result = `INCORRECT (they said "${userAnswer}", right answer is "${expectedAnswer}")`

  switch (step) {
    case 'potOdds':
      return `Scenario: pot is $${ctx.pot}, player calls $${ctx.callAmount}. They were asked for pot odds ratio. ${result}.`

    case 'breakeven':
      return `Pot odds are ${ctx.potOddsNum}:1. They were asked: what % equity do you need to break even? ${result}.`

    case 'outs':
      return `Hand: ${ctx.handDesc}. They were asked how many outs they have. ${result}.`

    case 'equity':
      return `They have ${ctx.outs} outs with ${ctx.cardsTocome} card(s) to come. Asked for equity % using Rule of ${ctx.cardsTocome === 2 ? '4' : '2'}. ${result}.`

    case 'decision':
      return `Break-even is ${ctx.breakevenPct}%, their equity is ~${ctx.equityPct}%. They were asked call/fold/raise. ${result}. The correct play is "${ctx.decision}" — briefly explain why in terms of equity vs breakeven.`

    default:
      return `Step: ${step}. ${result}.`
  }
}
