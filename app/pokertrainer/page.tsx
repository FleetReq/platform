'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { PokerTable } from './PokerTable'
import { PlayerTypeStep, type PlayerType } from './PlayerTypeStep'
import { InstallButton } from './InstallButton'
import { TipModal } from './TipModal'

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
  villainResponses?: { fold: string; call: string; reraise: string }
}

interface StepResult {
  correct: boolean
  given: string
  revealed?: boolean
}

const STATIC_SCENARIOS: Scenario[] = [
  {
    id: 1,
    level: 1,
    levelName: 'Fish',
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
      decision: 'Call. 36% equity beats the 25% breakeven — profitable in the long run. Old Timer likely has a strong made hand, so don\'t expect fold equity if you raise. You\'re calling for the pot odds, not implied odds. If you miss on the turn, let it go.',
    },
  },
  {
    id: 2,
    level: 1,
    levelName: 'Fish',
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
      decision: 'Fold. 16% equity falls well short of the 33% breakeven — this call loses money over time. The Caller won\'t fold anyway, so there\'s no bluff equity to factor in. The math just doesn\'t support calling here.',
    },
  },
  {
    id: 3,
    level: 2,
    levelName: 'Reg',
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
    villainResponses: {
      fold: 'Hoodie Guy exhales sharply and mucks his cards.',
      call: 'Hoodie Guy calls instantly, barely flinching.',
      reraise: 'Hoodie Guy makes it three-times your bet — pressure right back at you.',
    },
  },
  {
    id: 4,
    level: 2,
    levelName: 'Reg',
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
    villainResponses: {
      fold: 'The Regular pauses, nods once, and folds face-up — top pair, no kicker.',
      call: 'The Regular calls deliberately and stacks his remaining chips.',
      reraise: 'The Regular raises back — a precise, measured three-bet.',
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
    villainResponses: {
      fold: 'Wild Card groans loudly and throws his hand away.',
      call: 'Wild Card snap-calls and slaps the felt.',
      reraise: 'Wild Card immediately re-raises — zero hesitation.',
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
    villainResponses: {
      fold: 'The Thinker tanks for 30 seconds, then folds face-down.',
      call: 'The Thinker calls after a long think, expression unreadable.',
      reraise: 'The Thinker three-bets back — surgical and deliberate.',
    },
  },
  // ── Additional static scenarios (7–12) ──────────────────────────────────
  {
    id: 7,
    level: 1,
    levelName: 'Fish',
    street: 'Flop',
    hand: ['K♠', 'T♥'],
    board: ['Q♦', '9♣', '3♥'],
    handDesc: 'Gutshot straight draw — only a Jack fills the gap (K Q J T 9)',
    pot: 80,
    callAmount: 20,
    cardsToCome: 2,
    outs: 4,
    outDesc: '4 Jacks in the deck — each one completes K Q J T 9',
    tableSize: 6,
    heroPosition: 'HJ',
    villainPosition: 'BTN',
    otherPlayers: ['SB', 'BB'],
    villainName: 'Big Stack Billy',
    villainDescription: "An aggressive player with a mountain of chips who has raised almost every hand tonight. He's openly laughed off two bluffs already.",
    villainPlayerType: 'maniac',
    potOddsNum: 4,
    potOddsDen: 1,
    breakevenPct: 20,
    equityPct: 16,
    decision: 'fold',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'decision'],
    explanations: {
      potOdds: 'Pot is $80, you call $20. Divide: 80 ÷ 20 = 4. Your pot odds are 4:1.',
      breakeven: 'Your 4:1 pot odds = risking $20 for a $100 pot. $20 ÷ $100 = 20%. You need at least 20% equity to break even — now go find out if you have it.',
      outs: 'Only a Jack saves you — it makes the K Q J T 9 straight. There are exactly 4 Jacks in the deck.',
      equity: 'Two cards to come → Rule of 4: 4 × 4 = 16%. Your equity (16%) falls short of the 20% you need. Fold.',
      decision: 'Fold. 16% equity misses the 20% breakeven — gutshots need better odds. Even with Big Stack Billy\'s wide range, the raw math doesn\'t change. If you hit, his implied odds are massive, but you can\'t get there at this price.',
    },
  },
  {
    id: 8,
    level: 1,
    levelName: 'Fish',
    street: 'Flop',
    hand: ['6♥', '7♥'],
    board: ['T♥', '4♥', 'K♦'],
    handDesc: 'Flush draw — four hearts already; any heart on the turn or river makes the flush',
    pot: 60,
    callAmount: 20,
    cardsToCome: 2,
    outs: 9,
    outDesc: '13 hearts total − 4 visible (6♥ 7♥ T♥ 4♥) = 9 outs remaining',
    tableSize: 5,
    heroPosition: 'BB',
    villainPosition: 'CO',
    otherPlayers: ['SB'],
    villainName: 'Careful Carl',
    villainDescription: 'An older gentleman who folded hand after hand for over an hour. He only entered this pot with a big preflop raise and double-checked his cards before betting.',
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
      outs: '13 hearts in the deck. You can see 4 of them (6♥ 7♥ T♥ 4♥). That leaves 9 unseen hearts that complete your flush.',
      equity: 'Two cards to come → Rule of 4: 9 × 4 = 36%. Your equity (36%) beats the 25% needed — profitable call.',
      decision: 'Call. 36% equity beats the 25% breakeven — profitable in the long run. Careful Carl likely has a strong made hand, so don\'t expect fold equity. You\'re calling for the pot odds, not implied odds. If you miss on the turn, let it go.',
    },
  },
  {
    id: 9,
    level: 2,
    levelName: 'Reg',
    street: 'Flop',
    hand: ['A♠', 'T♠'],
    board: ['K♠', '6♠', '3♣'],
    handDesc: 'Nut flush draw — any spade gives you the ace-high flush, the best possible',
    pot: 60,
    callAmount: 15,
    cardsToCome: 2,
    outs: 9,
    outDesc: '13 spades total − 4 visible (A♠ T♠ K♠ 6♠) = 9 outs remaining',
    tableSize: 6,
    heroPosition: 'UTG',
    villainPosition: 'BTN',
    otherPlayers: ['SB', 'BB', 'HJ'],
    villainName: 'Coach',
    villainDescription: "A focused player who watches the action carefully before committing chips. He skips most pots but when he's in, he usually has something real — though he's been known to fire one continuation bet.",
    villainPlayerType: 'tag',
    potOddsNum: 4,
    potOddsDen: 1,
    breakevenPct: 20,
    equityPct: 36,
    decision: 'call',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
    explanations: {
      potOdds: 'Pot is $60, you call $15. Divide: 60 ÷ 15 = 4. Your pot odds are 4:1.',
      breakeven: 'Your 4:1 pot odds = risking $15 for a $75 pot. $15 ÷ $75 = 20%. You only need 20% equity — a very cheap price.',
      outs: '13 spades in the deck. You can see 4 (A♠ T♠ K♠ 6♠). That leaves 9 outs — any spade makes the nut flush.',
      equity: 'Two cards to come → Rule of 4: 9 × 4 = 36%. Your equity (36%) nearly doubles the 20% needed.',
      playerType: 'Coach is a TAG. TAGs bet for value with strong holdings and fold to serious pressure. Their range here is likely strong — but your 36% equity is more than enough to call at this price.',
      decision: 'Call. 36% equity vs 20% breakeven is a huge edge. Coach is disciplined — when you hit and bet, he\'ll fold weaker pairs and pay off with strong hands. Play your made hand straightforwardly.',
    },
    villainResponses: {
      fold: 'Coach nods respectfully and folds, flashing top pair.',
      call: 'Coach calls and settles in — he\'s seeing this to showdown.',
      reraise: 'Coach three-bets. He came prepared.',
    },
  },
  {
    id: 10,
    level: 2,
    levelName: 'Reg',
    street: 'Turn',
    hand: ['9♥', 'J♣'],
    board: ['T♦', 'Q♠', '2♥', '7♣'],
    handDesc: 'Gutshot straight draw — only an 8 fills the gap (Q J T 9 8)',
    pot: 80,
    callAmount: 40,
    cardsToCome: 1,
    outs: 4,
    outDesc: '4 Eights in the deck — each completes Q J T 9 8',
    tableSize: 6,
    heroPosition: 'SB',
    villainPosition: 'HJ',
    otherPlayers: ['BB', 'CO'],
    villainName: 'The Kid',
    villainDescription: "A young, restless player who hates sitting out. He's entered a lot of pots and keeps firing on multiple streets — though you caught one of his bluffs earlier.",
    villainPlayerType: 'lag',
    potOddsNum: 2,
    potOddsDen: 1,
    breakevenPct: 33,
    equityPct: 8,
    decision: 'fold',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
    explanations: {
      potOdds: 'Pot is $80, you call $40. Divide: 80 ÷ 40 = 2. Your pot odds are 2:1.',
      breakeven: 'Your 2:1 pot odds = risking $40 for a $120 pot. $40 ÷ $120 ≈ 33%. You need 33% equity to break even — that\'s a steep price with one card left.',
      outs: 'Only an 8 makes your straight (Q J T 9 8). There are 4 Eights in the deck.',
      equity: 'One card to come → Rule of 2: 4 × 2 = 8%. Your equity (8%) is barely a quarter of the 33% needed.',
      playerType: 'The Kid is a LAG — wide range, lots of bluffs. But even knowing he bluffs frequently, the math is brutal: 8% equity vs 33% breakeven means calling is -EV regardless.',
      decision: 'Fold. 8% equity vs 33% breakeven — even knowing The Kid bluffs frequently, the math is brutal. Their wide range doesn\'t change the price enough to justify calling.',
    },
    villainResponses: {
      fold: 'The Kid mutters and sends his cards in. Frustrated.',
      call: 'The Kid calls with a grin. \'Let\'s gamble.\'',
      reraise: 'The Kid shoves without hesitation — he lives for this.',
    },
  },
  {
    id: 11,
    level: 3,
    levelName: 'Shark',
    street: 'Flop',
    hand: ['J♠', 'Q♦'],
    board: ['K♣', 'T♥', '5♦'],
    handDesc: 'Open-ended straight draw — an Ace completes broadway (A K Q J T), a Nine completes from below (K Q J T 9)',
    pot: 100,
    callAmount: 40,
    cardsToCome: 2,
    outs: 8,
    outDesc: '4 Aces (A K Q J T straight) + 4 Nines (K Q J T 9 straight) = 8 outs',
    tableSize: 7,
    heroPosition: 'CO',
    villainPosition: 'LJ',
    otherPlayers: ['SB', 'BB', 'UTG', 'HJ'],
    villainName: 'Brick Wall',
    villainDescription: "A stoic, expressionless player who's passed on most hands tonight. He raised preflop without hesitation, then checked the flop before leading out firmly on the turn. Hard to tell if he's protecting a made hand or finding a spot.",
    villainPlayerType: 'nit',
    potOddsNum: 2.5,
    potOddsDen: 1,
    breakevenPct: 29,
    equityPct: 32,
    decision: 'call',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
    explanations: {
      potOdds: 'Pot is $100, you call $40. Divide: 100 ÷ 40 = 2.5. Your pot odds are 2.5:1.',
      breakeven: 'Your 2.5:1 pot odds = risking $40 for a $140 pot. $40 ÷ $140 ≈ 29%. You need 29% equity to break even.',
      outs: '4 Aces make the broadway straight (A K Q J T). 4 Nines make the king-high straight (K Q J T 9). Total: 8 outs.',
      equity: 'Two cards to come → Rule of 4: 8 × 4 = 32%. Your equity (32%) clears the 29% needed.',
      playerType: 'Brick Wall could be a NIT defending a big hand, or a TAG picking a spot. Either way, your 32% equity justifies calling — there\'s no shame in folding if the price gets worse on the turn.',
      decision: 'Call. 32% equity vs 29% breakeven is thin but correct. Brick Wall likely has a strong made hand — don\'t expect them to fold to aggression. If the price gets worse on the turn, be ready to let it go.',
    },
    villainResponses: {
      fold: 'Brick Wall\'s face stays blank — then he folds, showing two pair.',
      call: 'Brick Wall calls stoically. He\'s going to showdown.',
      reraise: 'Brick Wall slowly, silently raises. He has you crushed.',
    },
  },
  {
    id: 12,
    level: 3,
    levelName: 'Shark',
    street: 'Flop',
    hand: ['A♦', '5♦'],
    board: ['2♦', '3♦', 'K♣'],
    handDesc: 'Flush draw + gutshot to the wheel — a 4 makes the A-2-3-4-5 straight; any diamond makes the nut flush',
    pot: 120,
    callAmount: 40,
    cardsToCome: 2,
    outs: 12,
    outDesc: '9 remaining diamonds (flush) + 3 non-diamond Fours (4♠ 4♥ 4♣) for the wheel straight = 12 unique outs. 4♦ is already counted as a flush out.',
    tableSize: 6,
    heroPosition: 'BTN',
    villainPosition: 'BB',
    otherPlayers: ['SB', 'UTG', 'HJ'],
    villainName: 'The Host',
    villainDescription: "A well-known regular who greets everyone warmly. He's played plenty of hands tonight — calling some large bets, raising others. You saw him win a big pot with top pair and once call off a huge bet with just second pair.",
    villainPlayerType: 'station',
    potOddsNum: 3,
    potOddsDen: 1,
    breakevenPct: 25,
    equityPct: 48,
    decision: 'raise',
    steps: ['potOdds', 'breakeven', 'outs', 'equity', 'playerType', 'decision'],
    explanations: {
      potOdds: 'Pot is $120, you call $40. Divide: 120 ÷ 40 = 3. Your pot odds are 3:1.',
      breakeven: 'Your 3:1 pot odds = risking $40 for a $160 pot. $40 ÷ $160 = 25%. You need 25% equity to break even.',
      outs: '13 diamonds minus 4 visible (A♦ 5♦ 2♦ 3♦) = 9 flush outs. A 4 makes the wheel straight — the 4♦ is already counted, so add only 4♠ 4♥ 4♣ = 3 more. Total: 12 unique outs.',
      equity: 'Two cards to come → Rule of 4: 12 × 4 = 48%. Nearly a coin flip — almost double the breakeven.',
      playerType: 'The Host leans calling station — wide range, hard to fold. That\'s great news: when you make the nut flush or wheel, you\'ll get paid off. Raising semi-bluffs work poorly against stations, but value-raising your equity here is strong.',
      decision: 'Raise. With 48% equity vs a 25% breakeven you have a massive edge. Raising builds the pot for when you hit and may fold out marginal hands — even a calling station has a folding threshold.',
    },
    villainResponses: {
      fold: 'The Host chuckles softly. \'Nice hand.\' He folds.',
      call: 'The Host calls cheerfully. \'I like my hand too.\'',
      reraise: 'The Host raises back, smiling. He almost never folds.',
    },
  },
]

function shuffleStatic(): Scenario[] {
  const arr = [...STATIC_SCENARIOS]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

type RaiseSize = 'min' | 'half' | 'pot' | 'allin'
type VillainOutcome = 'fold' | 'call' | 'reraise'

// Probability that villain folds to each raise size, by player type
const FOLD_PROB: Record<PlayerType, Record<RaiseSize, number>> = {
  nit:     { min: 0.55, half: 0.70, pot: 0.82, allin: 0.88 },
  tag:     { min: 0.35, half: 0.50, pot: 0.65, allin: 0.75 },
  lag:     { min: 0.15, half: 0.25, pot: 0.40, allin: 0.50 },
  station: { min: 0.05, half: 0.10, pot: 0.15, allin: 0.08 },
  maniac:  { min: 0.10, half: 0.20, pot: 0.30, allin: 0.15 },
}

// Maniac re-raises instead of calling (on non-all-in sizes)
const RERAISE_PROB: Partial<Record<PlayerType, Record<RaiseSize, number>>> = {
  maniac: { min: 0.50, half: 0.35, pot: 0.15, allin: 0 },
}

function rollVillainOutcome(playerType: PlayerType, size: RaiseSize): VillainOutcome {
  const fold = FOLD_PROB[playerType][size]
  const reraise = RERAISE_PROB[playerType]?.[size] ?? 0
  const r = Math.random()
  if (r < fold) return 'fold'
  if (r < fold + reraise) return 'reraise'
  return 'call'
}

function getRaiseAmounts(s: Scenario): Record<RaiseSize, number | null> {
  return {
    min:   s.callAmount * 2,
    half:  Math.round(s.callAmount * 1.5 + s.pot / 2),
    pot:   s.callAmount * 2 + s.pot,
    allin: null,
  }
}

function getVillainResponse(s: Scenario, outcome: VillainOutcome): string {
  if (s.villainResponses) return s.villainResponses[outcome]
  const n = s.villainName
  if (outcome === 'fold') return `${n} thinks for a moment and folds.`
  if (outcome === 'reraise') return `${n} stares you down and re-raises.`
  return `${n} calls without hesitation.`
}

const SUIT_AMBIENT: Record<string, string> = {
  '♥': 'rgba(220,38,38,0.07)',
  '♦': 'rgba(180,83,9,0.07)',
  '♣': 'rgba(30,64,175,0.07)',
  '♠': 'rgba(99,102,241,0.06)',
}

function getSuitAmbient(hand: string[]): string {
  const suit = hand[0]?.slice(-1) ?? ''
  return SUIT_AMBIENT[suit] ?? 'transparent'
}

function playDing() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch { /* silently skip if audio unavailable */ }
}

function getRookieNudge(step: Step, s: Scenario): string | null {
  switch (step) {
    case 'potOdds':
      return 'Divide the pot by the call amount — both numbers are shown above.'
    case 'breakeven':
      return 'Divide the call amount by the total if you call: call ÷ (pot + call).'
    case 'outs': {
      const desc = s.handDesc.toLowerCase()
      if (desc.includes('flush') && !desc.includes('straight') && !desc.includes('gutshot'))
        return 'There are 13 of each suit in a full deck — subtract the ones already visible.'
      if (s.outs === 8)
        return 'Two ranks complete this straight, one on each end. Each rank has 4 cards in the deck.'
      if (s.outs === 4)
        return 'One rank fills the gap. Every rank has exactly 4 cards in a full deck.'
      return 'Work through the equation shown above step by step.'
    }
    case 'equity':
      return `Multiply outs × ${s.cardsToCome === 2 ? '4 — there are two cards still to come.' : '2 — there is one card still to come.'}`
    default:
      return null
  }
}

function getOutsConceptualHint(s: Scenario): string {
  const desc = s.handDesc.toLowerCase()

  // Flush draw: build "13 hearts − 4 visible (cards) = ?" from the actual cards
  if (desc.includes('flush') && !desc.includes('straight') && !desc.includes('gutshot')) {
    const allCards = [...s.hand, ...s.board]
    const suitCounts: Record<string, number> = {}
    for (const c of allCards) suitCounts[c.slice(-1)] = (suitCounts[c.slice(-1)] ?? 0) + 1
    const drawSuit = Object.entries(suitCounts).find(([, n]) => n >= 3)?.[0] ?? ''
    const SUIT_NAMES: Record<string, string> = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' }
    const suitName = SUIT_NAMES[drawSuit] ?? 'suited cards'
    const visible = allCards.filter(c => c.slice(-1) === drawSuit)
    return `13 ${suitName} total − ${visible.length} visible (${visible.join(' ')}) = ?`
  }

  // OESD (8 outs): strip "= 8 straight outs" → "4 Kings + 4 Eights = ?"
  if (s.outs === 8) {
    return s.outDesc.replace(/\s*=\s*\d+.*$/, ' = ?').trim()
  }

  // Gutshot (4 outs): the answer is always 4, but make them identify the rank
  if (s.outs === 4) {
    const rankMatch = s.outDesc.match(/^4\s+(\w+)/)
    const rank = rankMatch?.[1] ?? 'that rank'
    return `${rank} fill the gap — how many ${rank} are in a full deck?`
  }

  // Fallback: strip the answer from outDesc
  return s.outDesc.replace(/\s*=\s*\d+.*$/, ' = ?').trim()
}

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
  GTO:          'bg-teal-500/15 text-teal-400',
  Exploitative: 'bg-amber-500/15 text-amber-400',
  Decision:     'bg-blue-500/15 text-blue-400',
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

function isRaiseBorderline(s: Scenario): boolean {
  return s.decision === 'call' && s.cardsToCome === 2 && s.equityPct >= 30
}

function borderlineRaiseNote(s: Scenario): string {
  const callEv = (s.equityPct / 100) * (s.pot + s.callAmount) - s.callAmount
  const minRaise = s.callAmount * 2
  const newPotIfCalled = s.pot + minRaise + (minRaise - s.callAmount)
  const evRaiseCalled = Math.round((s.equityPct / 100) * newPotIfCalled - minRaise)
  const evRaiseFold = s.pot - minRaise
  const foldPctNeeded = Math.round(((callEv - evRaiseCalled) / (evRaiseFold - evRaiseCalled)) * 100)
  return ` A minimum raise to $${minRaise} is also viable: if villain calls, pot becomes $${newPotIfCalled} and your ${s.equityPct}% equity still gives +$${evRaiseCalled} EV — profitable but less than calling (+$${Math.round(callEv)}). Raising beats calling if villain folds more than ${foldPctNeeded}% of the time, so it's worth considering against a tight player.`
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
      const ans = v.toLowerCase()
      if (ans === s.decision) return true
      if (ans === 'raise' && isRaiseBorderline(s)) return true
      return false
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
    case 'decision': return isRaiseBorderline(s) ? `${s.decision} (raise also viable)` : s.decision
  }
}

function getStepGuide(step: Step, s: Scenario, prevResults: (StepResult | undefined)[]): { formula: string; worked?: string; tip?: string } | null {
  if (s.level === 3) return null

  const totalIfCall = s.pot + s.callAmount
  switch (step) {
    case 'potOdds':
      if (s.level === 1) {
        return {
          formula: 'Pot ÷ Call Amount = X:1',
          worked: `$${s.pot} ÷ $${s.callAmount} = ?:1`,
          tip: 'Quick table: 2:1 · 3:1 · 4:1 · 5:1',
        }
      }
      return { formula: 'Pot ÷ Call Amount = X:1' }

    case 'breakeven':
      if (s.level === 1) {
        return {
          formula: 'Call ÷ (Pot + Call) × 100 = %',
          worked: `$${s.callAmount} ÷ $${totalIfCall} = ?%`,
          tip: '2:1 → 33% · 3:1 → 25% · 4:1 → 20% · 5:1 → 17%',
        }
      }
      return { formula: 'Call ÷ (Pot + Call) × 100 = %' }

    case 'outs':
      if (s.level === 1) {
        return {
          formula: 'Count every card left in the deck that completes your hand',
          worked: getOutsConceptualHint(s),
        }
      }
      return null

    case 'equity': {
      const rule = s.cardsToCome === 2 ? 4 : 2
      if (s.level === 1) {
        const outsIdx = s.steps.indexOf('outs')
        const outsCorrect = outsIdx >= 0 && prevResults[outsIdx]?.correct
        return {
          formula: `Rule of ${rule}: Outs × ${rule} = equity %`,
          worked: outsCorrect ? `${s.outs} outs × ${rule} = ?%` : undefined,
        }
      }
      return { formula: `Outs × ${rule} (${s.cardsToCome === 2 ? 'flop' : 'turn'}) = equity %` }
    }

    case 'playerType':
      return null

    case 'decision': {
      if (s.level === 1) {
        const equityIdx = s.steps.indexOf('equity')
        const breakevenIdx = s.steps.indexOf('breakeven')
        const equityKnown = equityIdx >= 0 && prevResults[equityIdx]?.correct
        const breakevenKnown = breakevenIdx >= 0 && prevResults[breakevenIdx]?.correct
        return {
          formula: 'equity % > break-even % → call or raise   |   lower → fold',
          worked: equityKnown && breakevenKnown
            ? `Your equity: ~${s.equityPct}%   vs   Break-even: ${s.breakevenPct}%`
            : undefined,
        }
      }
      if (s.level === 2) {
        return null
      }
      return null
    }
  }
}


const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-emerald-500/15 text-emerald-400',
  2: 'bg-amber-500/15 text-amber-400',
  3: 'bg-red-500/15 text-red-400',
}

const PLAYER_TYPE_BADGE: Record<string, { style: string; label: string }> = {
  nit:     { style: 'bg-red-500/20 text-red-400 border border-red-500/40',         label: 'NIT'     },
  tag:     { style: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',       label: 'TAG'     },
  lag:     { style: 'bg-orange-500/20 text-orange-400 border border-orange-500/40', label: 'LAG'     },
  station: { style: 'bg-teal-500/20 text-teal-400 border border-teal-500/40',       label: 'STATION' },
  maniac:  { style: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40', label: 'MANIAC'  },
}

function ExplanationBody({ text, correct }: { text: string | undefined; correct: boolean }) {
  return (
    <p className={`text-sm leading-relaxed ${correct ? 'text-emerald-300' : 'text-red-400'}`}>
      {text || (correct ? 'Correct!' : '')}
    </p>
  )
}

function ThinkingDots() {
  const [dots, setDots] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setDots(d => (d % 3) + 1), 400)
    return () => clearInterval(id)
  }, [])
  return <span>Reading the hand{'.'.repeat(dots)}</span>
}

// Fetch a single AI scenario — server handles internal retry until valid
async function fetchOneScenario(level: 1 | 2 | 3, idx: number): Promise<Scenario> {
  const controller = new AbortController()
  // 45s: server may retry up to 5x with ~2-3s Haiku latency each
  const timeout = setTimeout(() => controller.abort(), 45000)
  try {
    const res = await fetch(`/api/pokertrainer/scenarios?level=${level}&idx=${idx}`, { signal: controller.signal })
    if (!res.ok) {
      let detail = ''
      try { const body = await res.json(); detail = body.error ?? '' } catch { /* ignore */ }
      throw new Error(detail ? `${detail} (${res.status})` : `HTTP ${res.status}`)
    }
    const data = await res.json()
    if (!data.scenario) throw new Error('bad shape')
    return data.scenario as Scenario
  } finally {
    clearTimeout(timeout)
  }
}

export default function PokerTrainer() {
  const [scenarios, setScenarios] = useState<Scenario[]>(shuffleStatic)
  const [filterLevel, setFilterLevel] = useState<1 | 2 | 3>(() => {
    try {
      const saved = localStorage.getItem('poker-filter-level')
      const n = saved ? parseInt(saved, 10) : 1
      return (n === 1 || n === 2 || n === 3) ? n : 1
    } catch { return 1 }
  })
  const [sIdx, setSIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState<(StepResult | undefined)[]>([])
  const [explanations, setExplanations] = useState<(string | undefined)[]>([])
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState('')
  const [done, setDone] = useState(false)

  const [showTip, setShowTip] = useState(true)
  const [flashCorrect, setFlashCorrect] = useState(false)
  const [aiFailed, setAiFailed] = useState(false)
  const [aiFailReason, setAiFailReason] = useState<string | null>(null)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [evaluation, setEvaluation] = useState<{ verdict: 'correct' | 'borderline' | 'incorrect'; feedback: string } | null>(null)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [raiseSizeChosen, setRaiseSizeChosen] = useState<RaiseSize | null>(null)
  const [villainOutcome, setVillainOutcome] = useState<VillainOutcome | null>(null)
  const [shaking, setShaking] = useState(false)
  const [attempts, setAttempts] = useState<number[]>([])
  const [disabledOptions, setDisabledOptions] = useState<string[]>([])
  const [scenarioPass, setScenarioPass] = useState<(boolean | null)[]>([])
  // Snapshot count at session start so mid-session AI loads don't add new pips
  const [sessionScenarioCount, setSessionScenarioCount] = useState(
    () => STATIC_SCENARIOS.filter(s => s.level === 1).length
  )
  const activeRef = useRef<HTMLDivElement>(null)
  const mobileActiveRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const decisionRef = useRef<HTMLDivElement>(null)
  const mobileDecisionRef = useRef<HTMLDivElement>(null)
  const fetchToken = useRef(0)

  useEffect(() => {
    const token = ++fetchToken.current

    // Fetch 2 AI scenarios per level in parallel — each call has server-side retry until valid
    const AI_FETCHES: [1 | 2 | 3, number][] = [
      [1, 100], [1, 101],
      [2, 200], [2, 201],
      [3, 300], [3, 301],
    ]
    const TOTAL = AI_FETCHES.length
    let loadedCount = 0
    let failedCount = 0

    function onLoad(s: Scenario) {
      if (fetchToken.current !== token) return
      loadedCount++
      setScenarios(prev => [...prev, s])
      if (loadedCount + failedCount === TOTAL && loadedCount > 0) {
        setAiLoaded(true)
        setTimeout(() => setAiLoaded(false), 3000)
      }
    }

    function onFail(err: unknown) {
      if (fetchToken.current !== token) return
      failedCount++
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[PokerTrainer] scenario fetch failed:`, msg)
      if (loadedCount === 0 && loadedCount + failedCount === TOTAL) {
        setAiFailed(true)
        setAiFailReason(msg)
      }
    }

    for (const [level, idx] of AI_FETCHES) {
      fetchOneScenario(level, idx).then(onLoad).catch(onFail)
    }
  }, [])

  const activeScenarios = scenarios.filter(s => s.level === filterLevel)
  // Stable pip list — frozen at session start so AI loading mid-session doesn't add circles
  const pipScenarios = activeScenarios.slice(0, sessionScenarioCount)
  const scenario = activeScenarios[sIdx]

  if (!scenario) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0c0e14]">
        <div className="text-center">
          <p className="text-white/40 font-medium mb-3">No scenarios for this difficulty level.</p>
          <button onClick={() => changeFilter(1)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            Show Fish
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
  const borderline = isChecked && !!currentResult?.correct && currentStep === 'decision' && isRaiseBorderline(scenario)

  const villainPtIdx = scenario.steps.indexOf('playerType')
  const villainTypeRevealed = scenario.level === 1 || (villainPtIdx >= 0 && !!results[villainPtIdx])
  const showRaiseInteraction = isChecked && currentStep === 'decision' && currentResult?.given === 'raise' && scenario.level >= 2
  const villainBadge = villainTypeRevealed ? PLAYER_TYPE_BADGE[scenario.villainPlayerType] : null

  const suitAmbient = getSuitAmbient(scenario.hand)

  // Hoisted so mobile bottom bar and desktop step card share the same values
  const guide = !isChecked ? getStepGuide(currentStep, scenario, results) : null
  const escapeThreshold = scenario.level === 1 ? 2 : scenario.level === 2 ? 4 : 6
  const showEscapeHatch = (attempts[stepIdx] ?? 0) >= escapeThreshold && currentStep !== 'decision'
  const rookieNudge = scenario.level === 1 && (attempts[stepIdx] ?? 0) >= 1 && currentStep !== 'decision'
    ? getRookieNudge(currentStep, scenario)
    : null

  useLayoutEffect(() => {
    if (!isChecked) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
      const scrollTarget = isMobile ? mobileActiveRef : activeRef
      scrollTarget.current?.scrollIntoView({ behavior: 'smooth', block: isMobile ? 'end' : 'nearest' })
      if (currentStep === 'decision') {
        if (isMobile) mobileDecisionRef.current?.focus()
        else decisionRef.current?.focus()
      } else {
        if (isMobile) mobileInputRef.current?.focus()
        else inputRef.current?.focus()
      }
    }
  }, [stepIdx, sIdx, isChecked])

  // Keyboard navigation: Enter or → advances after an answer is checked
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter' && e.key !== 'ArrowRight') return
      if (isChecked && !scenarioDone) { e.preventDefault(); nextStep() }
      else if (scenarioDone) { e.preventDefault(); nextScenario() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecked, scenarioDone])


  async function submit(value: string) {
    const correct = checkAnswer(currentStep, value, scenario)
    const idx = stepIdx
    const isDecision = currentStep === 'decision'

    // Intermediate step wrong → shake and require retry
    if (!correct && !isDecision) {
      setAttempts(prev => {
        const next = [...prev]
        next[idx] = (next[idx] ?? 0) + 1
        return next
      })
      if (config.inputType === 'playerType') {
        setDisabledOptions(prev => [...prev, value])
      }
      setInput('')
      setSelected('')
      setShaking(true)
      setTimeout(() => setShaking(false), 460)
      return
    }

    // Correct answer (any step) or decision step (always final) — record result
    setResults(prev => {
      const next = [...prev]
      next[idx] = { correct, given: value }
      return next
    })
    setExplanations(prev => {
      const next = [...prev]
      let expl = scenario.explanations[currentStep] ?? expectedAnswer(currentStep, scenario)
      if (scenario.level >= 2 && (currentStep === 'equity' || currentStep === 'breakeven')) {
        const cut = expl.indexOf('%. ')
        if (cut !== -1) expl = expl.slice(0, cut + 1)
      }
      if (isDecision && isRaiseBorderline(scenario)) expl += borderlineRaiseNote(scenario)
      next[idx] = expl
      return next
    })

    if (correct) {
      playDing()
      setFlashCorrect(true)
      setTimeout(() => setFlashCorrect(false), 700)
    }

    // Fire AI evaluation for decision step
    if (isDecision) {
      const sIdxAtSubmit = sIdx
      setLoadingEvaluation(true)
      try {
        const res = await fetch('/api/pokertrainer/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: value,
            correctDecision: scenario.decision,
            equityPct: scenario.equityPct,
            breakevenPct: scenario.breakevenPct,
            villainName: scenario.villainName,
            villainPlayerType: scenario.villainPlayerType,
            villainDescription: scenario.villainDescription,
            handDesc: scenario.handDesc,
            heroPosition: scenario.heroPosition,
            villainPosition: scenario.villainPosition,
            otherPlayers: scenario.otherPlayers,
            street: scenario.street,
            pot: scenario.pot,
            callAmount: scenario.callAmount,
            cardsToCome: scenario.cardsToCome,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.verdict) {
            setEvaluation({ verdict: data.verdict, feedback: data.feedback })
            const passed = data.verdict === 'correct' || data.verdict === 'borderline'
            setScenarioPass(prev => {
              const next = [...prev]
              next[sIdxAtSubmit] = passed
              return next
            })
          }
        }
      } catch {
        // Coach unavailable — static explanation still shown
      } finally {
        setLoadingEvaluation(false)
      }
    }
  }

  function revealCurrentAnswer() {
    const idx = stepIdx
    const answer = expectedAnswer(currentStep, scenario)
    setResults(prev => {
      const next = [...prev]
      next[idx] = { correct: true, given: answer, revealed: true }
      return next
    })
    setExplanations(prev => {
      const next = [...prev]
      next[idx] = scenario.explanations[currentStep] ?? answer
      return next
    })
    // No ding — they didn't earn it
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
    setDisabledOptions([])
  }

  function nextScenario() {
    if (sIdx + 1 >= activeScenarios.length) {
      setDone(true)
    } else {
      setSIdx(i => i + 1)
      setStepIdx(0)
      setResults([])
      setExplanations([])
      setInput('')
      setSelected('')
      setEvaluation(null)
      setRaiseSizeChosen(null)
      setVillainOutcome(null)
      setAttempts([])
      setDisabledOptions([])
    }
  }

  function resetSession() {
    setSIdx(0)
    setStepIdx(0)
    setResults([])
    setExplanations([])
    setInput('')
    setSelected('')
    setDone(false)
    setEvaluation(null)
    setLoadingEvaluation(false)
    setRaiseSizeChosen(null)
    setVillainOutcome(null)
    setAttempts([])
    setDisabledOptions([])
    setScenarioPass([])
    setShaking(false)
  }

  function changeFilter(lvl: 1 | 2 | 3) {
    setSessionScenarioCount(STATIC_SCENARIOS.filter(s => s.level === lvl).length)
    setFilterLevel(lvl)
    try { localStorage.setItem('poker-filter-level', String(lvl)) } catch {}
    resetSession()
  }

  function handleRaisePick(size: RaiseSize) {
    setRaiseSizeChosen(size)
    setVillainOutcome(rollVillainOutcome(scenario.villainPlayerType, size))
  }

  function restart() {
    resetSession()
    setFilterLevel(1)
    setSessionScenarioCount(STATIC_SCENARIOS.filter(s => s.level === 1).length)
    setScenarios(shuffleStatic())
    setAiFailed(false)
    setAiFailReason(null)
    setAiLoaded(false)
    const token = ++fetchToken.current
    const AI_FETCHES: [1 | 2 | 3, number][] = [
      [1, 100], [1, 101],
      [2, 200], [2, 201],
      [3, 300], [3, 301],
    ]
    const TOTAL = AI_FETCHES.length
    let loadedCount = 0
    let failedCount = 0

    function onLoad(s: Scenario) {
      if (fetchToken.current !== token) return
      loadedCount++
      setScenarios(prev => [...prev, s])
      if (loadedCount + failedCount === TOTAL && loadedCount > 0) {
        setAiLoaded(true)
        setTimeout(() => setAiLoaded(false), 3000)
      }
    }

    function onFail(err: unknown) {
      if (fetchToken.current !== token) return
      failedCount++
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[PokerTrainer] scenario fetch failed:`, msg)
      if (loadedCount === 0 && loadedCount + failedCount === TOTAL) {
        setAiFailed(true)
        setAiFailReason(msg)
      }
    }

    for (const [level, idx] of AI_FETCHES) {
      fetchOneScenario(level, idx).then(onLoad).catch(onFail)
    }
  }

  if (done) {
    const passCount = scenarioPass.filter(p => p === true).length
    const total = scenarioPass.filter(p => p !== null).length
    const pct = total > 0 ? Math.round((passCount / total) * 100) : 0
    const nextLevel = filterLevel < 3 ? (filterLevel + 1) as 2 | 3 : null
    const LEVEL_NAMES_DONE: Record<2 | 3, string> = { 2: 'Reg', 3: 'Shark' }
    const readyForNext = pct >= 60
    const doneCard = scenario?.hand?.[0] ?? 'A♠'
    const doneSuit = doneCard.slice(-1)
    const doneRank = doneCard.slice(0, -1)
    const DONE_SUIT_COLOR: Record<string, string> = { '♥': '#dc2626', '♦': '#b45309', '♣': '#1e40af', '♠': '#6366f1' }
    const doneSuitColor = DONE_SUIT_COLOR[doneSuit] ?? '#6366f1'
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0c0e14]">
        <div className="bg-[#13151f] border border-white/8 rounded-2xl shadow-2xl max-w-sm w-full text-center p-8">
          <svg width="56" height="76" viewBox="0 0 56 76" className="mx-auto mb-5" aria-hidden="true">
            <defs>
              <filter id="done-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={doneSuitColor} floodOpacity="0.35" />
              </filter>
            </defs>
            <rect x="2" y="2" width="52" height="72" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1" filter="url(#done-shadow)" />
            <text x="8" y="21" fontSize="14" fontWeight="900" fill={doneSuitColor}>{doneRank}</text>
            <text x="28" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="26" fill={doneSuitColor}>{doneSuit}</text>
          </svg>
          <h1 className="text-2xl font-bold mb-1 text-white">
            {filterLevel === 1 ? 'Fish' : filterLevel === 2 ? 'Reg' : 'Shark'} Complete
          </h1>
          <p className="text-white/40 text-sm mb-4">
            {passCount} / {total > 0 ? total : activeScenarios.length} scenarios passed
          </p>
          <div className={`text-3xl font-bold mb-2 ${pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            {pct >= 80 ? 'Sharp' : pct >= 60 ? 'Improving' : 'Keep Studying'}
          </div>
          <p className="text-sm text-white/40 mb-8">
            {pct >= 80
              ? 'Clean math, good reads. You\'re ready for the next level.'
              : pct >= 60
              ? 'Solid foundation. A few more reps and you\'ll have it locked.'
              : 'Review the Rule of 2/4 and pot odds math before moving on.'}
          </p>
          <div className="flex flex-col gap-3">
            {nextLevel && readyForNext && (
              <button
                onClick={() => changeFilter(nextLevel)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Next Level: {LEVEL_NAMES_DONE[nextLevel]} →
              </button>
            )}
            {nextLevel && !readyForNext && (
              <p className="text-xs text-amber-400/80 -mb-1">Score 60%+ to unlock {LEVEL_NAMES_DONE[nextLevel]}</p>
            )}
            <button
              onClick={() => changeFilter(filterLevel)}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 ${
                nextLevel && readyForNext
                  ? 'bg-white/8 hover:bg-white/12 text-white/60 hover:text-white/80'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {`Replay ${filterLevel === 1 ? 'Fish' : filterLevel === 2 ? 'Reg' : 'Shark'}`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0c0e14]">
      {/* Accessible live region for step feedback */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {currentResult
          ? currentResult.correct
            ? `Correct. ${currentExplanation ?? ''}`
            : `Incorrect. Correct answer: ${expectedAnswer(currentStep, scenario)}.`
          : ''}
      </div>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-white/8 bg-[#0c0e14]">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="3" width="20" height="18" rx="3" fill="#1e2238" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
              <text x="12" y="16" textAnchor="middle" fontSize="13" fill="#dc2626" fontFamily="serif">♥</text>
            </svg>
            <h1 className="text-base font-black tracking-tight text-white hidden sm:block leading-none">
              Raise the <span className="text-emerald-400">Shark</span>
            </h1>
          </div>

          {/* Progress pips */}
          <div className="flex gap-1.5 items-center flex-shrink-0" role="list" aria-label={`Scenario progress: ${sIdx + 1} of ${pipScenarios.length}`}>
            {pipScenarios.map((s, i) => {
              const pass = scenarioPass[i]
              let pipClass: string
              if (i < sIdx) {
                if (pass === true)  pipClass = 'w-2.5 h-2.5 bg-emerald-500'
                else if (pass === false) pipClass = 'w-2.5 h-2.5 bg-red-400'
                else pipClass = 'w-2.5 h-2.5 bg-white/25'
              } else if (i === sIdx) {
                pipClass = 'w-3 h-3 bg-blue-500 ring-2 ring-blue-500/40'
              } else {
                pipClass = 'w-2 h-2 bg-white/15'
              }
              const status = i < sIdx
                ? pass === true ? 'passed' : pass === false ? 'failed' : 'complete'
                : i === sIdx ? 'current' : 'upcoming'
              return (
                <div
                  key={s.id}
                  role="listitem"
                  aria-label={`Scenario ${i + 1}: ${status}`}
                  className={`rounded-full transition-all duration-300 ${pipClass}`}
                />
              )
            })}
          </div>

          {/* Difficulty tabs — inline center */}
          <div className="flex gap-1.5 flex-1 justify-center mx-1 min-w-0" role="tablist" aria-label="Difficulty level">
            {([1, 2, 3] as (1 | 2 | 3)[]).map(lvl => (
              <button
                key={lvl}
                id={`tab-${lvl}`}
                role="tab"
                aria-selected={filterLevel === lvl}
                aria-controls="main-tabpanel"
                onClick={() => changeFilter(lvl)}
                className={`px-3 py-1.5 rounded-full font-bold text-xs tracking-wide transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0c0e14] ${
                  filterLevel === lvl
                    ? lvl === 1 ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : lvl === 2 ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-red-500 text-white shadow-md shadow-red-500/30'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                {lvl === 1 ? (
                  <><span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">F</span><span className="hidden sm:inline ml-1.5">Fish</span></>
                ) : lvl === 2 ? (
                  <><span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">R</span><span className="hidden sm:inline ml-1.5">Reg</span></>
                ) : (
                  <><span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/40">S</span><span className="hidden sm:inline ml-1.5">Shark</span></>
                )}
              </button>
            ))}
          </div>

          {/* Install + Score */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowTip(true)}
              aria-label="Show poker concept tip"
              className="p-1.5 rounded-md text-white/35 hover:text-white/70 hover:bg-white/8 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17H8v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7z"/>
              </svg>
            </button>
            <InstallButton />
            {scenarioPass.some(p => p !== null) && (() => {
              const passed = scenarioPass.filter(p => p === true).length
              const graded = scenarioPass.filter(p => p !== null).length
              return (
                <div
                  className="text-right pl-2 border-l border-white/8 bg-white/5 rounded-lg px-2.5 py-1"
                  aria-label={`Score: ${passed} of ${graded} scenarios passed`}
                >
                  <div className="text-base font-black text-blue-400 tabular-nums leading-none">{passed}/{graded}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 leading-none mt-0.5" aria-hidden="true">passed</div>
                </div>
              )
            })()}
          </div>
        </div>
      </header>

      {/* ── Body: scrollable zone + fixed bottom bar on mobile | 2-col on desktop ── */}
      <div id="main-tabpanel" role="tabpanel" aria-labelledby={`tab-${filterLevel}`} className="flex-1 overflow-hidden flex flex-col lg:flex-row">

        {/* Scrollable zone — mobile: context + completed steps + step prompt. Desktop: context column. */}
        <div className="flex-1 overflow-y-auto lg:flex-none lg:w-[42%] lg:overflow-y-auto p-4 lg:p-6 lg:border-r border-white/8 bg-[#0c0e14]">

          {/* Level + meta */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${LEVEL_COLORS[scenario.level]}`}>
              {scenario.levelName}
            </span>
            <span className="text-xs text-white/60 font-semibold">Scenario {sIdx + 1}/{activeScenarios.length}</span>
            <span className="text-xs text-white/60 font-semibold">· {scenario.street}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ×<strong>{scenario.cardsToCome === 2 ? '4' : '2'}</strong> rule
            </span>
          </div>

          {/* Poker Table — atmospheric container with felt ambient + suit glow */}
          <div className="mb-4 mx-auto rounded-2xl overflow-hidden bg-[#080f0b] relative">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(30,122,80,0.18) 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 50%, ${suitAmbient} 0%, transparent 65%)` }}
              aria-hidden="true"
            />
            <PokerTable
              heroPosition={scenario.heroPosition}
              villainPosition={scenario.villainPosition}
              villainName={scenario.villainName}
              activePositions={[scenario.heroPosition, scenario.villainPosition, ...scenario.otherPlayers]}
              heroCards={scenario.hand}
              boardCards={scenario.board}
              tableSize={scenario.tableSize}
              pot={scenario.pot}
              callAmount={scenario.callAmount}
            />
            <p className="text-[10px] text-white/25 text-center pb-1.5">{scenario.tableSize}-handed</p>
          </div>

          {/* Hand description — tight with table, separated from villain */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-widest mb-1">Your Hand</p>
            <p className="text-sm text-white font-semibold leading-snug">{scenario.handDesc}</p>
          </div>

          {/* Villain profile — dossier style */}
          <div className="mb-3 border-t border-white/6 pt-3 border-l-2 border-amber-500/60 pl-3">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest">{scenario.villainName}</p>
              {villainBadge && (
                <span className={`text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${villainBadge.style}`}>
                  {villainBadge.label}
                </span>
              )}
            </div>
            <p className="text-sm text-white/80 leading-snug">{scenario.villainDescription}</p>
          </div>

          {/* ── Mobile-only: completed steps + active step context ── */}
          <div className="lg:hidden mt-4 pt-4 border-t border-white/8">
            {stepIdx > 0 && (
              <div className="border-l-2 border-white/20 pl-3 mb-4 space-y-2">
                {steps.slice(0, stepIdx).map((step, i) => {
                  const r = results[i]
                  if (!r) return null
                  const bl = step === 'decision' && r.correct && isRaiseBorderline(scenario)
                  const dotColor = !r.correct ? 'bg-red-500' : (bl || r.revealed) ? 'bg-amber-500' : 'bg-emerald-500'
                  const labelColor = !r.correct ? 'text-red-400' : (bl || r.revealed) ? 'text-amber-400' : 'text-emerald-400'
                  return (
                    <div key={step} className="step-enter relative flex items-start gap-2.5 py-1">
                      <span className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 -ml-[21px] border-2 border-[#0c0e14] ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold ${labelColor}`}>{STEP_CONFIG[step].label}</span>
                          {!r.correct && (
                            <span className="text-xs text-white/50">· was <strong className="text-white/75">{expectedAnswer(step, scenario)}</strong></span>
                          )}
                        </div>
                        <p className="text-xs text-white/55 leading-relaxed mt-0.5">{explanations[i] || scenario.explanations[step]}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Active step context card — header + prompt or explanation */}
            <div ref={mobileActiveRef}>
              <div className={`rounded-xl border p-4 transition-shadow ${
                !isChecked
                  ? 'bg-[#1c2035] border-blue-500/60 shadow-xl shadow-blue-950/60'
                  : !currentResult!.correct
                    ? 'bg-[#1c2035] border-red-500/40'
                    : borderline
                      ? 'bg-[#1c2035] border-amber-500/40'
                      : `bg-[#1c2035] border-emerald-500/40 ${flashCorrect ? 'flash-correct' : ''}`
              }`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black flex-shrink-0 text-sm ${
                    isChecked
                      ? !currentResult!.correct ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                        : borderline ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/40'
                        : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                      : 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                  }`}>
                    {isChecked ? (currentResult!.correct ? '✓' : '✗') : stepIdx + 1}
                  </span>
                  <div>
                    <p className="text-[10px] text-white/30 leading-none mb-0.5 uppercase tracking-wider">Step {stepIdx + 1} of {steps.length}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm leading-tight text-white">{config.label}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLE[config.category]}`}>{config.category}</span>
                    </div>
                  </div>
                </div>
                {isChecked ? (
                  <div className={`rounded-lg px-3 py-2.5 ${!currentResult!.correct ? 'bg-red-500/10' : borderline ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                    {currentResult!.revealed && (
                      <div className="mb-2.5 pb-2.5 border-b border-white/10">
                        <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-1">You were solving</p>
                        <p className="text-sm text-white/45 leading-snug">{getPrompt(currentStep, scenario, results)}</p>
                      </div>
                    )}
                    {currentResult!.revealed && (
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Answer</p>
                    )}
                    {!currentResult!.correct && (
                      <p className="text-xs font-semibold text-red-400 mb-1">Correct answer: {expectedAnswer(currentStep, scenario)}</p>
                    )}
                    <ExplanationBody text={currentExplanation} correct={currentResult!.correct} />
                  </div>
                ) : (
                  <p className="text-sm text-white/80">{getPrompt(currentStep, scenario, results)}</p>
                )}
              </div>

              {/* Coach panel (mobile — shown after decision is evaluated) */}
              {currentStep === 'decision' && isChecked && (() => {
                const isLoading  = loadingEvaluation
                const isResolved = !!evaluation
                const isFailed   = !loadingEvaluation && !evaluation
                const VERDICT_STYLE = {
                  correct:    { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', label: 'text-emerald-400', text: 'text-emerald-200', chip: '#10b981', dot: '🟢' },
                  borderline: { border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   label: 'text-amber-400',   text: 'text-amber-200',   chip: '#f59e0b', dot: '🟡' },
                  incorrect:  { border: 'border-red-500/40',     bg: 'bg-red-500/10',     label: 'text-red-400',     text: 'text-red-200',     chip: '#ef4444', dot: '🔴' },
                }
                const style = isResolved && evaluation ? (VERDICT_STYLE[evaluation.verdict] ?? VERDICT_STYLE.correct) : null
                return (
                  <div className={`mt-3 rounded-xl px-4 py-3 border transition-all duration-500 ${isResolved && style ? `${style.bg} ${style.border}` : 'bg-white/[0.03] border-white/[0.08]'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <circle cx="8" cy="8" r="7.5" stroke={style ? style.chip : 'rgba(255,255,255,0.2)'} strokeWidth="1" fill={style ? style.chip + '22' : 'rgba(255,255,255,0.04)'} style={{ transition: 'stroke 0.5s, fill 0.5s' }} />
                        <circle cx="8" cy="8" r="4" stroke={style ? style.chip : 'rgba(255,255,255,0.2)'} strokeWidth="1" fill="none" style={{ transition: 'stroke 0.5s' }} />
                      </svg>
                      <p className={`text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-500 ${style ? style.label : 'text-white/25'}`}>
                        Coach
                      </p>
                    </div>
                    {isLoading && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <div className="h-2.5 rounded-full bg-white/10 animate-pulse w-full" />
                        <div className="h-2.5 rounded-full bg-white/10 animate-pulse w-4/5" />
                      </div>
                    )}
                    {isResolved && evaluation && style && (
                      <p className={`text-sm leading-relaxed ${style.text}`}>{evaluation.feedback}</p>
                    )}
                    {isFailed && <p className="text-sm text-white/20 italic">Coach feedback unavailable.</p>}
                  </div>
                )
              })()}

              {/* Raise interaction (mobile) */}
              {showRaiseInteraction && (() => {
                const amounts = getRaiseAmounts(scenario)
                const SIZES: { key: RaiseSize; label: string; amount: number | null }[] = [
                  { key: 'min',   label: 'Min raise', amount: amounts.min },
                  { key: 'half',  label: '½ Pot',     amount: amounts.half },
                  { key: 'pot',   label: 'Pot raise',  amount: amounts.pot },
                  { key: 'allin', label: 'All-in',     amount: null },
                ]
                const OUTCOME_STYLE: Record<VillainOutcome, { border: string; bg: string; badge: string; label: string }> = {
                  fold:    { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: 'FOLDS' },
                  call:    { border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',   label: 'CALLS' },
                  reraise: { border: 'border-red-500/40',     bg: 'bg-red-500/10',     badge: 'bg-red-500/20 text-red-300 border-red-500/40',     label: 'RE-RAISES' },
                }
                if (!raiseSizeChosen) {
                  return (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-[0.15em] mb-0.5">🔺 You raised — pick your size</p>
                      <p className="text-xs text-white/40 mb-2.5">Villain reacts based on their player type</p>
                      <div className="grid grid-cols-2 gap-2">
                        {SIZES.map(({ key, label, amount }) => (
                          <button key={key} onClick={() => handleRaisePick(key)}
                            className="py-3 px-3 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-white/70 hover:text-amber-300 transition-all text-center">
                            <div className="text-sm font-bold leading-tight">{label}</div>
                            <div className="text-xs text-white/65 mt-0.5">{amount !== null ? `$${amount}` : 'All chips'}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }
                if (!villainOutcome) return null
                const st = OUTCOME_STYLE[villainOutcome]
                const chosenAmt = SIZES.find(s => s.key === raiseSizeChosen)!
                const outcomeNote: Record<VillainOutcome, string> = {
                  fold: `You take down the $${scenario.pot + (chosenAmt.amount ?? scenario.callAmount * 4)} pot.`,
                  call: `Pot grows to $${scenario.pot + (chosenAmt.amount ?? scenario.callAmount * 2) * 2}. Your ${scenario.equityPct}% equity still applies.`,
                  reraise: 'Villain comes back over the top. Reassess your equity vs the new price.',
                }
                return (
                  <div className={`mt-3 rounded-xl border ${st.border} ${st.bg} px-4 py-3`}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-[0.15em]">🔺 Villain Reaction</p>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${st.badge}`}>{st.label}</span>
                      <span className="text-xs text-white/30 ml-auto">{chosenAmt.label}{chosenAmt.amount !== null ? ` $${chosenAmt.amount}` : ''}</span>
                    </div>
                    <p className="text-sm text-white/80 italic mb-2">&ldquo;{getVillainResponse(scenario, villainOutcome)}&rdquo;</p>
                    <p className="text-xs text-white/60">{outcomeNote[villainOutcome]}</p>
                    <button onClick={() => { setRaiseSizeChosen(null); setVillainOutcome(null) }}
                      className="mt-2 text-xs text-white/50 hover:text-white/70 transition-colors">
                      Try a different size ↺
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>

        </div>{/* end scrollable zone */}

        {/* ── Desktop-only: right quiz column (felt texture, full step card) ── */}
        <div className="hidden lg:flex flex-col flex-1 overflow-y-auto p-5 sm:p-6 felt-panel lg:bg-[#0c0e14]" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>

          {/* Completed steps — compact timeline */}
          {stepIdx > 0 && (
            <div className="border-l-2 border-white/20 pl-3 mb-5 space-y-2">
              {steps.slice(0, stepIdx).map((step, i) => {
                const r = results[i]
                if (!r) return null
                const borderline = step === 'decision' && r.correct && isRaiseBorderline(scenario)
                const dotColor = !r.correct ? 'bg-red-500' : (borderline || r.revealed) ? 'bg-amber-500' : 'bg-emerald-500'
                const labelColor = !r.correct ? 'text-red-400' : (borderline || r.revealed) ? 'text-amber-400' : 'text-emerald-400'
                return (
                  <div key={step} className="step-enter relative flex items-start gap-2.5 py-1">
                    <span className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 -ml-[21px] border-2 border-[#1c2035] ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold ${labelColor}`}>{STEP_CONFIG[step].label}</span>
                        {!r.correct && (
                          <span className="text-xs text-white/50">· was <strong className="text-white/75">{expectedAnswer(step, scenario)}</strong></span>
                        )}
                      </div>
                      <p className="text-xs text-white/55 leading-relaxed mt-0.5">{explanations[i] || scenario.explanations[step]}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Active step */}
          <div ref={activeRef} className={shaking ? 'shake' : ''}>
            <div className={`rounded-xl border p-5 transition-shadow ${
              !isChecked
                ? 'bg-[#1c2035] border-blue-500/60 shadow-xl shadow-blue-950/60'
                : !currentResult!.correct
                  ? 'bg-[#1c2035] border-red-500/40'
                  : borderline
                    ? 'bg-[#1c2035] border-amber-500/40'
                    : `bg-[#1c2035] border-emerald-500/40 ${flashCorrect ? 'flash-correct' : ''}`
            }`}>
              {/* Step header */}
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center font-black flex-shrink-0 ${
                  isChecked
                    ? !currentResult!.correct
                      ? 'bg-red-500 text-white text-sm shadow-lg shadow-red-500/40'
                      : borderline
                        ? 'bg-amber-500 text-white text-sm shadow-lg shadow-amber-500/40'
                        : 'bg-emerald-500 text-white text-sm shadow-lg shadow-emerald-500/40'
                    : 'bg-blue-500 text-white text-base shadow-lg shadow-blue-500/40'
                }`}>
                  {isChecked ? (currentResult!.correct ? '✓' : '✗') : stepIdx + 1}
                </span>
                <div>
                  <p className="text-xs text-white/30 leading-none mb-0.5 uppercase tracking-wider">Step {stepIdx + 1} of {steps.length}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm leading-tight text-white">{config.label}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLE[config.category]}`}>
                      {config.category}
                    </span>
                  </div>
                </div>
              </div>

              {isChecked ? (
                <div className={`rounded-lg px-4 py-3 ${
                  !currentResult!.correct ? 'bg-red-500/10' : borderline ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                }`}>
                  {currentResult!.revealed && (
                    <div className="mb-3 pb-3 border-b border-white/10">
                      <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-1">You were solving</p>
                      <p className="text-sm text-white/45 leading-snug">{getPrompt(currentStep, scenario, results)}</p>
                    </div>
                  )}
                  {currentResult!.revealed && (
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Answer</p>
                  )}
                  {!currentResult!.correct && (
                    <p className="text-xs font-semibold text-red-400 mb-1.5">
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
                  <p className="text-sm text-white/80 mb-3">{getPrompt(currentStep, scenario, results)}</p>

                  {/* Formula guide */}
                  {(() => {
                    const guide = getStepGuide(currentStep, scenario, results)
                    return guide ? (
                      <div className="rounded-lg px-4 py-3 mb-4 border-l-2 border-teal-500 bg-teal-500/5 shadow-[inset_0_0_20px_rgba(20,184,166,0.06)] border border-teal-500/20">
                        <p className="text-xs text-teal-300 font-black uppercase tracking-[0.15em] mb-1.5">{guide.formula}</p>
                        {guide.worked && (
                          <p className="text-xl font-mono font-bold text-white tabular-nums">{guide.worked}</p>
                        )}
                        {guide.tip && (
                          <p className="text-xs text-white/50 mt-1.5 pt-1.5 border-t border-teal-500/15">{guide.tip}</p>
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
                        disabledOptions={disabledOptions as PlayerType[]}
                      />
                      <button
                        onClick={handleCheck}
                        disabled={!selected}
                        className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2238]"
                      >
                        Confirm Read
                      </button>
                      {(attempts[stepIdx] ?? 0) >= (scenario.level === 1 ? 2 : scenario.level === 2 ? 4 : 6) && (
                        <button
                          onClick={revealCurrentAnswer}
                          className="mt-2 w-full py-2 text-xs text-white/35 hover:text-white/55 transition-colors"
                        >
                          Show answer ↓
                        </button>
                      )}
                    </div>
                  ) : config.inputType === 'decision' ? (
                    <div
                      ref={decisionRef}
                      tabIndex={0}
                      className="space-y-2.5 focus:outline-none"
                      aria-label="Decision — use arrow keys or tap a button"
                      onKeyDown={(e) => {
                        if (isChecked || loadingEvaluation) return
                        if (e.key === 'ArrowLeft')  { e.preventDefault(); e.stopPropagation(); submit('fold') }
                        if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); submit('call') }
                        if (e.key === 'ArrowUp')    { e.preventDefault(); e.stopPropagation(); submit('raise') }
                      }}
                    >
                      {/* Raise — top center */}
                      <div className="flex justify-center">
                        <button
                          disabled={isChecked || loadingEvaluation}
                          onClick={() => submit('raise')}
                          className="w-1/2 h-14 rounded-2xl font-black text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1e2238] flex items-center justify-center bg-purple-600/30 border border-purple-500/50 text-purple-200 hover:bg-purple-600/50 hover:border-purple-400/70 hover:text-white shadow-[0_0_16px_rgba(168,85,247,0.2)] hover:shadow-[0_0_24px_rgba(168,85,247,0.4)] disabled:pointer-events-none disabled:opacity-50"
                        >
                          Raise
                        </button>
                      </div>
                      {/* Fold + Call — bottom row */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          disabled={isChecked || loadingEvaluation}
                          onClick={() => submit('fold')}
                          className="h-14 rounded-2xl font-black text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1e2238] flex items-center justify-center bg-red-600/25 border border-red-500/45 text-red-200 hover:bg-red-600/45 hover:border-red-400/65 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                        >
                          Fold
                        </button>
                        <button
                          disabled={isChecked || loadingEvaluation}
                          onClick={() => submit('call')}
                          className="h-14 rounded-2xl font-black text-base transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1e2238] flex flex-col items-center justify-center gap-0.5 bg-emerald-600/30 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-600/50 hover:border-emerald-400/70 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                        >
                          <span className="leading-none">Call</span>
                          <span className="text-xs font-bold text-emerald-300/80">${scenario.callAmount}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-white/20 text-center tracking-wide hidden sm:block">← fold &nbsp;&nbsp; ↑ raise &nbsp;&nbsp; call →</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={inputRef}
                          type="text"
                          inputMode={currentStep === 'potOdds' ? 'decimal' : 'numeric'}
                          aria-label={config.label}
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleCheck()}
                          placeholder={currentStep === 'potOdds' ? 'e.g. 3' : 'e.g. 25'}
                          autoComplete="off"
                          className="flex-1 px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {currentStep === 'potOdds' && <span className="text-sm text-white/35 font-medium select-none" aria-hidden="true">: 1</span>}
                        {(currentStep === 'breakeven' || currentStep === 'equity') && <span className="text-sm text-white/30 font-medium" aria-hidden="true">%</span>}
                        <button
                          onClick={handleCheck}
                          disabled={!input.trim()}
                          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                          Check ↵
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rookie nudge — appears after first wrong attempt, directly below input */}
                  {scenario.level === 1 && (attempts[stepIdx] ?? 0) >= 1 && currentStep !== 'decision' && (() => {
                    const nudge = getRookieNudge(currentStep, scenario)
                    return nudge ? (
                      <p className="mt-2 text-xs text-amber-400/75 leading-relaxed">↑ {nudge}</p>
                    ) : null
                  })()}

                  {/* Escape hatch — after nudge so it doesn't create visual gap above hint */}
                  {(attempts[stepIdx] ?? 0) >= (scenario.level === 1 ? 2 : scenario.level === 2 ? 4 : 6) && currentStep !== 'decision' && (
                    <button
                      onClick={revealCurrentAnswer}
                      className="mt-1 w-full py-1.5 text-xs text-white/35 hover:text-white/55 transition-colors"
                    >
                      Show answer ↓
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* AI coach evaluation — always reserves space once on decision step */}
            {currentStep === 'decision' && (() => {
              const isIdle     = !isChecked && !loadingEvaluation && !evaluation
              const isLoading  = loadingEvaluation
              const isResolved = isChecked && !!evaluation
              const isFailed   = isChecked && !loadingEvaluation && !evaluation

              const VERDICT_STYLE = {
                correct:    { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', label: 'text-emerald-400', text: 'text-emerald-200', chip: '#10b981', dot: '🟢' },
                borderline: { border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   label: 'text-amber-400',   text: 'text-amber-200',   chip: '#f59e0b', dot: '🟡' },
                incorrect:  { border: 'border-red-500/40',     bg: 'bg-red-500/10',     label: 'text-red-400',     text: 'text-red-200',     chip: '#ef4444', dot: '🔴' },
              }
              const style = isResolved && evaluation
                ? (VERDICT_STYLE[evaluation.verdict] ?? VERDICT_STYLE.correct)
                : null

              return (
                <div className={`mt-3 rounded-xl px-4 py-3 border transition-all duration-500 ease-out ${
                  isResolved && style
                    ? `${style.bg} ${style.border}`
                    : 'bg-white/[0.03] border-white/[0.08]'
                }`}>
                  {/* Header row: chip icon + label */}
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="7.5" stroke={isResolved && style ? style.chip : 'rgba(255,255,255,0.2)'} strokeWidth="1" fill={isResolved && style ? style.chip + '22' : 'rgba(255,255,255,0.04)'} style={{ transition: 'stroke 0.5s, fill 0.5s' }} />
                      <circle cx="8" cy="8" r="4" stroke={isResolved && style ? style.chip : 'rgba(255,255,255,0.2)'} strokeWidth="1" fill="none" style={{ transition: 'stroke 0.5s' }} />
                    </svg>
                    <p className={`text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-500 ${
                      isResolved && style ? style.label : 'text-white/25'
                    }`}>
                      Coach
                    </p>
                  </div>

                  {/* Body */}
                  {isIdle && (
                    <p className="text-sm text-white/20 italic">Waiting for your decision…</p>
                  )}
                  {isLoading && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <div className="h-2.5 rounded-full bg-white/10 animate-pulse w-full" />
                      <div className="h-2.5 rounded-full bg-white/10 animate-pulse w-4/5" />
                      <div className="h-2.5 rounded-full bg-white/10 animate-pulse w-3/5" />
                    </div>
                  )}
                  {isResolved && evaluation && style && (
                    <p className={`text-sm leading-relaxed transition-opacity duration-300 ${style.text}`}>
                      {evaluation.feedback}
                    </p>
                  )}
                  {isFailed && (
                    <p className="text-sm text-white/20 italic">Coach feedback unavailable.</p>
                  )}
                </div>
              )
            })()}

            {/* Villain reaction — shown when player raises on Regular/Shark */}
            {showRaiseInteraction && (() => {
              const amounts = getRaiseAmounts(scenario)
              const SIZES: { key: RaiseSize; label: string; amount: number | null }[] = [
                { key: 'min',   label: 'Min raise', amount: amounts.min },
                { key: 'half',  label: '½ Pot',     amount: amounts.half },
                { key: 'pot',   label: 'Pot raise',  amount: amounts.pot },
                { key: 'allin', label: 'All-in',     amount: null },
              ]
              const OUTCOME_STYLE: Record<VillainOutcome, { border: string; bg: string; badge: string; label: string }> = {
                fold:    { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: 'FOLDS' },
                call:    { border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',   label: 'CALLS' },
                reraise: { border: 'border-red-500/40',     bg: 'bg-red-500/10',     badge: 'bg-red-500/20 text-red-300 border-red-500/40',     label: 'RE-RAISES' },
              }
              const outcomeNote: Record<VillainOutcome, (s: Scenario, size: RaiseSize, amt: number | null) => string> = {
                fold:    (s, _sz, amt) => `You take down the $${s.pot + (amt ?? s.callAmount * 4)} pot.`,
                call:    (s, _sz, amt) => {
                  const newPot = s.pot + (amt ?? s.callAmount * 2) * 2
                  return `Pot grows to $${newPot}. Your ${s.equityPct}% equity still applies — you're getting paid if you hit.`
                },
                reraise: (_s, _sz, _amt) => `Villain comes back over the top. Reassess your equity vs the new price.`,
              }
              if (!raiseSizeChosen) {
                return (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-[0.15em] mb-0.5">
                      🔺 You chose to raise — pick your size
                    </p>
                    <p className="text-xs text-white/40 mb-2.5">The villain will react based on their player type</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SIZES.map(({ key, label, amount }) => (
                        <button
                          key={key}
                          onClick={() => handleRaisePick(key)}
                          className="py-3.5 px-3 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-white/70 hover:text-amber-300 transition-all text-center"
                        >
                          <div className="text-sm font-bold leading-tight">{label}</div>
                          <div className="text-xs text-white/65 mt-0.5">
                            {amount !== null ? `$${amount}` : 'All chips'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              }
              if (!villainOutcome) return null
              const style = OUTCOME_STYLE[villainOutcome]
              const chosenAmt = SIZES.find(s => s.key === raiseSizeChosen)!
              return (
                <div className={`mt-3 rounded-xl border ${style.border} ${style.bg} px-4 py-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-[0.15em]">
                      🔺 Villain Reaction
                    </p>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${style.badge}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-white/30 ml-auto">
                      {chosenAmt.label}{chosenAmt.amount !== null ? ` $${chosenAmt.amount}` : ''}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 italic mb-2">
                    &ldquo;{getVillainResponse(scenario, villainOutcome)}&rdquo;
                  </p>
                  <p className="text-xs text-white/60">
                    {outcomeNote[villainOutcome](scenario, raiseSizeChosen, chosenAmt.amount)}
                  </p>
                  <button
                    onClick={() => { setRaiseSizeChosen(null); setVillainOutcome(null) }}
                    className="mt-2 text-xs text-white/50 hover:text-white/70 transition-colors"
                  >
                    Try a different size ↺
                  </button>
                </div>
              )
            })()}
          </div>

          {/* Navigation buttons */}
          {isChecked && !scenarioDone && (
            <button
              onClick={nextStep}
              aria-label={`Next step: ${steps[stepIdx + 1] ? STEP_CONFIG[steps[stepIdx + 1]].label : ''} (step ${stepIdx + 2} of ${steps.length})`}
              className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
            >
              <span>Next Step</span>
              <span className="opacity-60 text-xs font-normal" aria-hidden="true">↵ or →</span>
            </button>
          )}
          {scenarioDone && (
            <button
              onClick={nextScenario}
              aria-label={sIdx + 1 >= activeScenarios.length ? 'See final results' : `Next scenario (${sIdx + 2} of ${activeScenarios.length})`}
              className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
            >
              <span>{sIdx + 1 >= activeScenarios.length ? 'See Results 🏆' : 'Next Scenario'}</span>
              {sIdx + 1 < activeScenarios.length && <span className="opacity-60 text-xs font-normal" aria-hidden="true">↵ or →</span>}
            </button>
          )}
        </div>

        {/* ── Mobile-only: fixed bottom input bar ── */}
        <div className="lg:hidden flex-shrink-0 bg-[#13151f] border-t border-white/10"
             style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {/* Stats strip */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/8 text-xs">
            <span className="text-white/40 font-semibold">Pot</span>
            <span className="text-white font-black">${scenario.pot}</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40 font-semibold">Call</span>
            <span className="text-white font-black">${scenario.callAmount}</span>
            <span className="text-white/20">·</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
              ×{scenario.cardsToCome === 2 ? '4' : '2'} rule
            </span>
          </div>
          {/* Input / navigation area */}
          <div className={`px-4 py-3 ${shaking ? 'shake' : ''}`}>
            {!isChecked ? (
              <div className="space-y-2.5">
                {/* Formula guide — compact */}
                {guide && (
                  <div className="rounded-lg px-3 py-2 border-l-2 border-teal-500 bg-teal-500/5 border border-teal-500/20">
                    <p className="text-xs text-teal-300 font-black uppercase tracking-[0.15em]">{guide.formula}</p>
                    {guide.worked && (
                      <p className="text-base font-mono font-bold text-white tabular-nums mt-0.5">{guide.worked}</p>
                    )}
                    {guide.tip && (
                      <p className="text-xs text-white/50 mt-1 pt-1 border-t border-teal-500/15">{guide.tip}</p>
                    )}
                  </div>
                )}
                {/* Input controls */}
                {config.inputType === 'playerType' ? (
                  <div>
                    <PlayerTypeStep
                      selected={selected as PlayerType | ''}
                      onSelect={(type) => setSelected(type)}
                      disabled={false}
                      disabledOptions={disabledOptions as PlayerType[]}
                    />
                    <button
                      onClick={handleCheck}
                      disabled={!selected}
                      className="mt-2.5 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors"
                    >
                      Confirm Read
                    </button>
                    {showEscapeHatch && (
                      <button
                        onClick={revealCurrentAnswer}
                        className="mt-1.5 w-full py-1.5 text-xs text-white/35 hover:text-white/55 transition-colors"
                      >
                        Show answer ↓
                      </button>
                    )}
                  </div>
                ) : config.inputType === 'decision' ? (
                  <div
                    ref={mobileDecisionRef}
                    tabIndex={0}
                    className="space-y-2 focus:outline-none"
                    aria-label="Decision — use arrow keys or tap a button"
                    onKeyDown={(e) => {
                      if (isChecked || loadingEvaluation) return
                      if (e.key === 'ArrowLeft')  { e.preventDefault(); e.stopPropagation(); submit('fold') }
                      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); submit('call') }
                      if (e.key === 'ArrowUp')    { e.preventDefault(); e.stopPropagation(); submit('raise') }
                    }}
                  >
                    <div className="flex justify-center">
                      <button
                        disabled={isChecked || loadingEvaluation}
                        onClick={() => submit('raise')}
                        className="w-1/2 h-14 rounded-2xl font-black text-base transition-all flex items-center justify-center bg-purple-600/30 border border-purple-500/50 text-purple-200 hover:bg-purple-600/50 hover:border-purple-400/70 hover:text-white shadow-[0_0_16px_rgba(168,85,247,0.2)] hover:shadow-[0_0_24px_rgba(168,85,247,0.4)] disabled:pointer-events-none disabled:opacity-50"
                      >
                        Raise
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={isChecked || loadingEvaluation}
                        onClick={() => submit('fold')}
                        className="h-14 rounded-2xl font-black text-base transition-all flex items-center justify-center bg-red-600/25 border border-red-500/45 text-red-200 hover:bg-red-600/45 hover:border-red-400/65 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                      >
                        Fold
                      </button>
                      <button
                        disabled={isChecked || loadingEvaluation}
                        onClick={() => submit('call')}
                        className="h-14 rounded-2xl font-black text-base transition-all flex flex-col items-center justify-center gap-0.5 bg-emerald-600/30 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-600/50 hover:border-emerald-400/70 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span className="leading-none">Call</span>
                        <span className="text-xs font-bold text-emerald-300/80">${scenario.callAmount}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={mobileInputRef}
                        type="text"
                        inputMode={currentStep === 'potOdds' ? 'decimal' : 'numeric'}
                        aria-label={config.label}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCheck()}
                        placeholder={currentStep === 'potOdds' ? 'e.g. 3' : 'e.g. 25'}
                        autoComplete="off"
                        className="flex-1 px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {currentStep === 'potOdds' && (
                        <span className="text-sm text-white/35 font-medium select-none" aria-hidden="true">: 1</span>
                      )}
                      {(currentStep === 'breakeven' || currentStep === 'equity') && (
                        <span className="text-sm text-white/30 font-medium" aria-hidden="true">%</span>
                      )}
                      <button
                        onClick={handleCheck}
                        disabled={!input.trim()}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors"
                      >
                        Check ↵
                      </button>
                    </div>
                  </div>
                )}
                {rookieNudge && (
                  <p className="text-xs text-amber-400/75 leading-relaxed">↑ {rookieNudge}</p>
                )}
                {showEscapeHatch && (
                  <button
                    onClick={revealCurrentAnswer}
                    className="mt-1 w-full py-1.5 text-xs text-white/35 hover:text-white/55 transition-colors"
                  >
                    Show answer ↓
                  </button>
                )}
              </div>
            ) : !scenarioDone ? (
              <button
                onClick={nextStep}
                aria-label={`Next step: ${steps[stepIdx + 1] ? STEP_CONFIG[steps[stepIdx + 1]].label : ''}`}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Next Step</span>
                <span className="opacity-60 text-xs font-normal" aria-hidden="true">↵ or →</span>
              </button>
            ) : (
              <button
                onClick={nextScenario}
                aria-label={sIdx + 1 >= activeScenarios.length ? 'See final results' : `Next scenario (${sIdx + 2} of ${activeScenarios.length})`}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <span>{sIdx + 1 >= activeScenarios.length ? 'See Results 🏆' : 'Next Scenario'}</span>
                {sIdx + 1 < activeScenarios.length && (
                  <span className="opacity-60 text-xs font-normal" aria-hidden="true">↵ or →</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showTip && activeScenarios.length > 0 && (
        <TipModal scenario={activeScenarios[0]} onDismiss={() => setShowTip(false)} />
      )}

      {aiLoaded && (
        <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center px-4 py-1.5 bg-emerald-950/90 border-t border-emerald-500/30 backdrop-blur-sm pointer-events-none">
          <span className="text-xs text-emerald-400 font-medium">✓ AI scenarios ready — more variety unlocked</span>
        </div>
      )}

      {aiFailed && (
        <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between px-4 py-1.5 bg-amber-950/90 border-t border-amber-500/30 backdrop-blur-sm">
          <span className="text-xs text-amber-400 font-medium">⚠ AI unavailable · static scenarios only</span>
          {aiFailReason && <span className="text-xs text-amber-500/60 truncate ml-4 max-w-xs">{aiFailReason}</span>}
          <button
            onClick={() => setAiFailed(false)}
            className="ml-4 text-amber-500/60 hover:text-amber-300 text-xs shrink-0"
            aria-label="Dismiss"
          >✕</button>
        </div>
      )}
    </div>
  )
}
