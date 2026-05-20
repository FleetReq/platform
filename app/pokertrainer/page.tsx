'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { PokerTable } from './PokerTable'
import { PlayerTypeStep, type PlayerType } from './PlayerTypeStep'
import { InstallButton } from './InstallButton'

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
      decision: 'Call. 36% equity beats the 25% breakeven — profitable in the long run. Old Timer likely has a strong made hand, so don\'t expect fold equity if you raise. You\'re calling for the pot odds, not implied odds. If you miss on the turn, let it go.',
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
      decision: 'Fold. 16% equity falls well short of the 33% breakeven — this call loses money over time. The Caller won\'t fold anyway, so there\'s no bluff equity to factor in. The math just doesn\'t support calling here.',
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
    villainResponses: {
      fold: 'Hoodie Guy exhales sharply and mucks his cards.',
      call: 'Hoodie Guy calls instantly, barely flinching.',
      reraise: 'Hoodie Guy makes it three-times your bet — pressure right back at you.',
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
    levelName: 'Rookie',
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
    levelName: 'Rookie',
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
    levelName: 'Regular',
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
    levelName: 'Regular',
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
  return <span>Thinking{'.'.repeat(dots)}</span>
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
  const [filterLevel, setFilterLevel] = useState<1 | 2 | 3>(1)
  const [sIdx, setSIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [results, setResults] = useState<(StepResult | undefined)[]>([])
  const [explanations, setExplanations] = useState<(string | undefined)[]>([])
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [scenarioResults, setScenarioResults] = useState<{ correct: number; total: number }[]>([])
  const [done, setDone] = useState(false)

  const [aiFailed, setAiFailed] = useState(false)
  const [aiFailReason, setAiFailReason] = useState<string | null>(null)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [evaluation, setEvaluation] = useState<{ verdict: 'correct' | 'borderline' | 'incorrect'; feedback: string } | null>(null)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [raiseSizeChosen, setRaiseSizeChosen] = useState<RaiseSize | null>(null)
  const [villainOutcome, setVillainOutcome] = useState<VillainOutcome | null>(null)
  // Snapshot count at session start so mid-session AI loads don't add new pips
  const [sessionScenarioCount, setSessionScenarioCount] = useState(
    () => STATIC_SCENARIOS.filter(s => s.level === 1).length
  )
  const activeRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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
            Show Rookie
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

  useLayoutEffect(() => {
    if (!isChecked) {
      activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      inputRef.current?.focus()
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

    setResults(prev => {
      const next = [...prev]
      next[idx] = { correct, given: value }
      return next
    })
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }))
    setExplanations(prev => {
      const next = [...prev]
      let expl = scenario.explanations[currentStep] ?? expectedAnswer(currentStep, scenario)
      if (currentStep === 'decision' && isRaiseBorderline(scenario)) expl += borderlineRaiseNote(scenario)
      next[idx] = expl
      return next
    })

    // Fire AI evaluation for every decision step
    if (currentStep === 'decision') {
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
          setEvaluation(data.verdict ? { verdict: data.verdict, feedback: data.feedback } : null)
        }
      } catch {
        // Silently skip — static explanation is still shown
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
      setEvaluation(null)
      setRaiseSizeChosen(null)
      setVillainOutcome(null)
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
    setEvaluation(null)
    setLoadingEvaluation(false)
    setRaiseSizeChosen(null)
    setVillainOutcome(null)
  }

  function changeFilter(lvl: 1 | 2 | 3) {
    setSessionScenarioCount(STATIC_SCENARIOS.filter(s => s.level === lvl).length)
    setFilterLevel(lvl)
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
    const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
    const nextLevel = filterLevel < 3 ? (filterLevel + 1) as 2 | 3 : null
    const LEVEL_NAMES_DONE: Record<2 | 3, string> = { 2: 'Regular', 3: 'Shark' }
    const readyForNext = pct >= 60
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0c0e14]">
        <div className="bg-[#13151f] border border-white/8 rounded-2xl shadow-2xl max-w-sm w-full text-center p-8">
          <div className="text-5xl mb-4">🃏</div>
          <h1 className="text-2xl font-bold mb-1 text-white">
            {filterLevel === 1 ? 'Rookie' : filterLevel === 2 ? 'Regular' : 'Shark'} Complete
          </h1>
          <p className="text-white/40 text-sm mb-4">
            {score.correct} / {score.total} steps correct ({pct}%)
          </p>
          <div className={`text-3xl font-bold mb-2 ${pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            {pct >= 80 ? '🏆 Sharp' : pct >= 60 ? '📈 Improving' : '📚 Keep Studying'}
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
              {`Replay ${filterLevel === 1 ? 'Rookie' : filterLevel === 2 ? 'Regular' : 'Shark'}`}
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
        <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl" aria-hidden="true">🃏</span>
            <h1 className="text-sm font-bold text-white hidden sm:block leading-none">Poker Trainer</h1>
          </div>

          {/* Progress pips */}
          <div className="flex gap-1.5 items-center flex-shrink-0" role="list" aria-label={`Scenario progress: ${sIdx + 1} of ${pipScenarios.length}`}>
            {pipScenarios.map((s, i) => {
              const sr = scenarioResults[i]
              let pipClass: string
              if (i < sIdx) {
                if (!sr) pipClass = 'w-2.5 h-2.5 bg-green-500'
                else if (sr.correct === sr.total) pipClass = 'w-2.5 h-2.5 bg-green-500'
                else if (sr.correct === 0) pipClass = 'w-2.5 h-2.5 bg-red-400'
                else pipClass = 'w-2.5 h-2.5 bg-yellow-400'
              } else if (i === sIdx) {
                pipClass = 'w-3 h-3 bg-blue-500 ring-2 ring-blue-500/40'
              } else {
                pipClass = 'w-2 h-2 bg-white/15'
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
                {lvl === 1 ? <><span>●</span><span className="hidden sm:inline"> Rookie</span></> : lvl === 2 ? <><span>●●</span><span className="hidden sm:inline"> Regular</span></> : <><span>●●●</span><span className="hidden sm:inline"> Shark</span></>}
              </button>
            ))}
          </div>

          {/* Install + Score */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <InstallButton />
            <div
              className="text-right pl-2 border-l border-white/8"
              aria-label={`Score: ${score.correct} of ${score.total} steps correct`}
            >
              <div className="text-base font-bold text-blue-400 tabular-nums">{score.correct}/{score.total}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-white/30 leading-none" aria-hidden="true">steps</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body: 2-col on lg, stacked on mobile ────────────────── */}
      <div id="main-tabpanel" role="tabpanel" aria-labelledby={`tab-${filterLevel}`} className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-[#0c0e14]">

        {/* LEFT — scenario context */}
        <div className="lg:w-[42%] lg:flex-shrink-0 overflow-y-auto p-4 sm:p-6 lg:border-r border-b lg:border-b-0 border-white/8 bg-[#0c0e14] max-h-[54vh] lg:max-h-none">

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

          {/* Poker Table — dominant, width-capped on mobile to keep hand/villain visible */}
          <div className="mb-3 max-w-[64vw] sm:max-w-none mx-auto">
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
            <p className="text-xs text-white/30 text-center mt-1">{scenario.tableSize}-handed</p>
          </div>

          {/* Hand description — plain typography */}
          <div className="mb-3">
            <p className="text-xs font-bold text-blue-400/70 uppercase tracking-widest mb-1">Your Hand</p>
            <p className="text-sm text-white font-semibold leading-snug">{scenario.handDesc}</p>
          </div>

          {/* Villain profile — plain typography */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-amber-400/70 uppercase tracking-widest">{scenario.villainName}</p>
              {villainBadge && (
                <span className={`text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${villainBadge.style}`}>
                  {villainBadge.label}
                </span>
              )}
            </div>
            <p className="text-sm text-white/65 leading-snug">{scenario.villainDescription}</p>
          </div>


        </div>

        {/* RIGHT — steps */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 bg-[#0c0e14]" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>

          {/* Completed steps */}
          {stepIdx > 0 && (
            <div className="space-y-2 mb-4">
              {steps.slice(0, stepIdx).map((step, i) => {
                const r = results[i]
                if (!r) return null
                const borderline = step === 'decision' && r.correct && isRaiseBorderline(scenario)
                return (
                  <div key={step} className={`rounded-xl border px-4 py-3 ${
                    !r.correct
                      ? 'border-red-500/30 bg-red-500/10'
                      : borderline
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-emerald-500/30 bg-emerald-500/10'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${!r.correct ? 'bg-red-500' : borderline ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                        {r.correct ? '✓' : '✗'}
                      </span>
                      <span className={`text-xs font-semibold ${!r.correct ? 'text-red-400' : borderline ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {STEP_CONFIG[step].label}
                      </span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_STYLE[STEP_CONFIG[step].category]}`}>
                        {STEP_CONFIG[step].category}
                      </span>
                      {!r.correct && (
                        <span className="text-xs text-white/30 ml-auto">
                          was <strong className="text-white/60">{expectedAnswer(step, scenario)}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/65 leading-relaxed pl-6">
                      {explanations[i] || scenario.explanations[step]}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Active step */}
          <div ref={activeRef}>
            <div className={`rounded-xl border p-5 ${
              !isChecked
                ? 'bg-[#13151f] border-blue-500/60 shadow-xl shadow-blue-500/10'
                : !currentResult!.correct
                  ? 'bg-[#13151f] border-red-500/40'
                  : borderline
                    ? 'bg-[#13151f] border-amber-500/40'
                    : 'bg-[#13151f] border-emerald-500/40'
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
                  <p className="text-sm text-white/60 mb-3">{getPrompt(currentStep, scenario, results)}</p>

                  {/* Formula guide */}
                  {(() => {
                    const guide = getStepGuide(currentStep, scenario, results)
                    return guide ? (
                      <div className="bg-[#0a0c10] rounded-lg px-4 py-3 mb-4 border border-white/15">
                        <p className="text-xs text-teal-400 font-bold uppercase tracking-[0.15em] mb-1.5">{guide.formula}</p>
                        <p className="text-xl font-mono font-bold text-white tabular-nums">{guide.worked}</p>
                        {guide.tip && (
                          <p className="text-xs text-white/40 mt-1.5 pt-1.5 border-t border-white/8">{guide.tip}</p>
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
                        className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#13151f]"
                      >
                        Confirm Read
                      </button>
                    </div>
                  ) : config.inputType === 'decision' ? (
                    <div className="space-y-3">
                      <div
                        className="grid grid-cols-3 gap-2"
                        role="radiogroup"
                        aria-label="Decision"
                        onKeyDown={(e) => {
                          const options: Decision[] = ['call', 'fold', 'raise']
                          if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
                          e.preventDefault()
                          e.stopPropagation()
                          const currentIdx = selected ? options.indexOf(selected as Decision) : 0
                          const nextIdx = (e.key === 'ArrowRight' || e.key === 'ArrowDown')
                            ? (currentIdx + 1) % options.length
                            : (currentIdx - 1 + options.length) % options.length
                          setSelected(options[nextIdx])
                          const buttons = (e.currentTarget as HTMLDivElement).querySelectorAll('[role="radio"]')
                          ;(buttons[nextIdx] as HTMLElement)?.focus()
                        }}
                      >
                        {(['call', 'fold', 'raise'] as Decision[]).map(d => (
                          <button
                            key={d}
                            role="radio"
                            aria-checked={selected === d}
                            tabIndex={selected === d || (!selected && d === 'call') ? 0 : -1}
                            onClick={() => setSelected(d)}
                            className={`py-3 rounded-xl font-bold text-sm capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#13151f] ${
                              selected === d
                                ? d === 'call' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                  : d === 'fold' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                  : 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/10'
                            }`}
                          >
                            <span aria-hidden="true" className="mr-1 font-mono">{d === 'call' ? '↵' : d === 'fold' ? '✕' : '↑'}</span>
                            {d === 'call' ? 'Call' : d === 'fold' ? 'Fold' : 'Raise'}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleCheck}
                        disabled={!selected || loadingEvaluation}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        {loadingEvaluation ? <ThinkingDots /> : 'Confirm Decision'}
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
                        autoComplete="off"
                        className="flex-1 px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {(currentStep === 'breakeven' || currentStep === 'equity') && <span className="text-sm text-white/30 font-medium" aria-hidden="true">%</span>}
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

            {/* AI coach evaluation — fires on every decision step */}
            {isChecked && currentStep === 'decision' && evaluation && (() => {
              const VERDICT_STYLE = {
                correct:    { border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', label: 'text-emerald-400', text: 'text-emerald-200', dot: '🟢' },
                borderline: { border: 'border-amber-500/40',   bg: 'bg-amber-500/10',   label: 'text-amber-400',   text: 'text-amber-200',   dot: '🟡' },
                incorrect:  { border: 'border-red-500/40',     bg: 'bg-red-500/10',     label: 'text-red-400',     text: 'text-red-200',     dot: '🔴' },
              }
              const style = VERDICT_STYLE[evaluation.verdict] ?? VERDICT_STYLE.correct
              return (
                <div className={`mt-3 rounded-xl px-4 py-3 border ${style.bg} ${style.border}`}>
                  <p className={`text-xs font-bold uppercase tracking-[0.15em] mb-1.5 ${style.label}`}>
                    {style.dot} Coach
                  </p>
                  <p className={`text-sm leading-relaxed ${style.text}`}>{evaluation.feedback}</p>
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
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-[0.15em] mb-2.5">
                      🔺 Villain Reaction — How Much Do You Raise?
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SIZES.map(({ key, label, amount }) => (
                        <button
                          key={key}
                          onClick={() => handleRaisePick(key)}
                          className="py-2.5 px-2 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 text-white/70 hover:text-amber-300 transition-all text-center"
                        >
                          <div className="text-xs font-bold leading-tight">{label}</div>
                          <div className="text-xs text-white/40 mt-0.5">
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
                  <p className="text-xs text-white/40">
                    {outcomeNote[villainOutcome](scenario, raiseSizeChosen, chosenAmt.amount)}
                  </p>
                  <button
                    onClick={() => { setRaiseSizeChosen(null); setVillainOutcome(null) }}
                    className="mt-2 text-xs text-white/30 hover:text-white/60 transition-colors"
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
      </div>

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
