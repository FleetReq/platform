'use client'

import { useState, useEffect, useRef } from 'react'
import { PlayerTypeStep } from './PlayerTypeStep'

interface TipScenario {
  pot: number
  callAmount: number
  potOddsNum: number
  potOddsDen: number
}

interface Tip {
  emoji: string
  headline: string
  hook: (s?: TipScenario) => string
  body: string
  widget?: 'ratio' | 'rps' | 'villainTypes'
}

const TIPS: Tip[] = [
  {
    emoji: '🎰',
    headline: 'Pot Odds',
    hook: (s) =>
      s
        ? `The pot is $${s.pot}, you call $${s.callAmount}. That's ${s.potOddsNum}:${s.potOddsDen} — you risk $1 to win $${s.potOddsNum}.`
        : "Would you pay $1 for a 10% shot at $1,000,000? Of course. That's pot odds.",
    body: "Pot odds tell you whether a call is worth the price. If the reward outweighs the risk given your chances of winning, calling is profitable — even if you miss most of the time.",
    widget: 'ratio',
  },
  {
    emoji: '📐',
    headline: 'Break-Even %',
    hook: () => "The minimum win rate that makes calling profitable over time.",
    body: "Divide your call by the total pot after calling: Call ÷ (Pot + Call). If your equity is above this number, you profit in the long run. Below it, you lose money. This is your threshold.",
  },
  {
    emoji: '🃏',
    headline: 'Counting Outs',
    hook: () => "An out is any card left in the deck that completes your hand.",
    body: "Flush draw? Count remaining cards of your suit. Straight draw? Count the ranks that close the gap. Nine outs on a flush draw, eight on an open-ended straight. Every out is a card that turns a loser into a winner.",
  },
  {
    emoji: '📊',
    headline: 'Equity (Rule of 4 / 2)',
    hook: () => "A formula that's right 90% of the time — with zero math tools needed.",
    body: "Flop (2 cards to come): Outs × 4. Turn (1 card to come): Outs × 2. Nine flush outs on the flop? That's roughly 36% equity. Fast, simple, accurate enough to make the right call.",
  },
  {
    emoji: '⚖️',
    headline: 'The Decision',
    hook: () => "Equity above break-even → call. Below → fold. That's the whole game.",
    body: "Every street of poker reduces to this comparison. Call when your pot odds justify the risk given your equity. Fold when they don't. Raise when your edge is so large that building the pot adds more expected value than just calling.",
  },
  {
    emoji: '📈',
    headline: 'Law of Large Numbers',
    hook: () => "You can't win every hand. You don't need to.",
    body: "One bad beat doesn't mean you made the wrong play. Call with 36% equity into a 25% breakeven, and you'll lose that hand 64% of the time — and still profit over thousands of repetitions. GTO poker is a long-run strategy, not a hand-by-hand guarantee. Trust the math.",
  },
  {
    emoji: '🪨',
    headline: 'Exploitative Play',
    hook: () => "Rock-paper-scissors is 33/33/33. But if your opponent always picks rock…",
    body: "…you pick paper every time and win 100%. Opponents who always fold to pressure? Bluff more. Calling stations? Never bluff — value bet relentlessly. GTO protects you from being exploited. Knowing your opponent's tendencies is where the real money is.",
    widget: 'rps',
  },
  {
    emoji: '🎭',
    headline: 'Villain Types',
    hook: () => "Not all opponents play the same. Knowing who you're against changes everything.",
    body: "A nit only plays premium hands — their bets mean strength. A maniac raises constantly — their bets mean almost nothing. A calling station never folds — stop bluffing, value bet hard. GTO is the default. Exploitation is the profit.",
    widget: 'villainTypes',
  },
  {
    emoji: '💰',
    headline: 'Implied Odds',
    hook: () => "Pot odds say fold. But what if hitting your draw wins you their entire stack?",
    body: "Pot odds only count what's already in the pot. Implied odds factor in what you'll win on later streets after your draw completes — money that isn't there yet.\n\nQuick gut check: take YOUR call amount and multiply by 10. Both you AND the villain need at least that much left in your stacks. Example: the call is $20 → you both need $200+ behind. If either stack is shorter, the implied odds aren't there.\n\nThis matters most for speculative hands — holdings that only win by hitting a specific combination: small pocket pairs trying to flop a set, gutshots, suited connectors with no pair yet. These have low direct equity and need big implied odds to justify a call.\n\nNote: a nut flush draw isn't speculative — it already has ~35% direct equity. You don't need implied odds to call a flush draw; the pot odds math handles it. Implied odds are for the long shots that pot odds alone would reject.",
  },
  {
    emoji: '📍',
    headline: 'Position',
    hook: () => "The button isn't just a seat. It's the most profitable piece of real estate at the table.",
    body: "Acting last means you see what everyone does before you decide. They check — you learn they're weak. They bet — you know the size before choosing. Out of position, you're flying blind. In position, you have perfect information on every street. Over thousands of hands, position turns breakeven spots into profit and disasters into folds you never had to take.",
  },
  {
    emoji: '🎴',
    headline: 'Board Texture',
    hook: () => "K♠7♥2♣ and J♥T♥9♦ are both three-card flops. One is Fort Knox. One is a minefield.",
    body: "Dry boards (no draws, no connecting cards) favor strong made hands — your top pair is probably still best on the river, so you can bet smaller to extract value from weaker hands that will call. Wet boards are different: flush draws, straight draws, two-pair combos everywhere. Someone is chasing you down every street. Bet bigger to make their draw expensive. Read the board before you size your bet.",
  },
  {
    emoji: '✂️',
    headline: 'Fold Equity',
    hook: () => "Your draw doesn't just win by hitting. Sometimes it wins by making everyone else quit.",
    body: "When you raise on a draw, two things can happen: villain folds and you win the pot right now, or villain calls and you still have outs to hit. Fold equity is the bonus value from those instant wins. A semi-bluff raise with nine flush outs is more profitable than a passive call precisely because it gives you two ways to win — fold equity stacked on top of draw equity.",
  },
  {
    emoji: '⚡',
    headline: 'Expected Value',
    hook: () => "Every action at the table has a price tag. Some pay you. Some cost you. Only buy the positive ones.",
    body: "EV is the average outcome of a decision made infinitely. Folding is always 0. Calling is +EV when your equity exceeds the break-even percentage the pot demands. Raising is +EV when it earns more than calling — either by winning the pot immediately or by building it with strong equity. You won't win every hand. You will profit on every +EV decision over time. That's the whole game.",
  },
  {
    emoji: '🗂️',
    headline: 'Ranges, Not Hands',
    hook: () => "You have JJ. 'What if he has QQ?' is the wrong question. 'How often does he have QQ?' is the right one.",
    body: "A UTG raiser doesn't have QQ — they have a range: AA, KK, QQ, JJ, TT, AK, AQ. QQ appears in only 6 of those ~50 combos. The other 44 combos you're ahead or flipping. Against that full distribution, your JJ is close to a coin flip — AA, KK, and QQ drag the number down, but AK, AQ, and TT pull it back up. You don't need to beat every hand in their range — you need to be profitable against the whole thing. That's range thinking.",
  },
  {
    emoji: '🪤',
    headline: 'Reverse Implied Odds',
    hook: () => "Small pairs look cheap preflop. Against the wrong opponent, they're a trap you set for yourself.",
    body: "Implied odds work in your favor when hitting your draw wins a big pot. Reverse implied odds work against you when you hit a weak version and pay off a stronger one. Hit bottom set against top set on a dry board? You're a big underdog (~33% to improve) and still building the pot. Against a tight player who only bets monsters, the hand you hit can cost you your whole stack — because you'll never believe they have better.",
  },
  {
    emoji: '🎲',
    headline: 'Bluff-to-Value Ratio',
    hook: () => "Only bet strong hands? Good players fold every time. Always bluff? They always call. The answer is the right mix.",
    body: "Every bet size has an optimal bluff frequency. Half-pot bet: bluff about 33% of the time. Pot-sized bet: about 50%. Too few bluffs and opponents profit by folding. Too many and they profit by calling everything down. A balanced range mixes value hands and bluffs in exact ratios that make your opponent indifferent — they can't exploit you either way.",
  },
  {
    emoji: '🔺',
    headline: 'When to Raise',
    hook: () => "Raise for three reasons only: you have the best hand, you can make them believe you do, or you know they'll fold.",
    body: "Value raise when you're ahead and want their chips in — top pair or better against a calling station, raise every time. Semi-bluff raise when a strong draw gives you outs if called plus fold equity if not. Bluff raise when the board favors your range, the player folds to pressure, and your story is consistent from preflop. Any raise that doesn't fit one of these three is burning money.",
  },
  {
    emoji: '🤝',
    headline: 'When to Call',
    hook: () => "A call without a plan is just a donation. Know why you're calling before you reach for the chips.",
    body: "Call when pot odds justify your equity and raising would fold out worse hands. Call with draws when implied odds are strong against deep stacks. Call when you're trapping a bluffer and want them to keep firing. Against a nit who never bluffs, most calls are mistakes. Against a maniac, most folds are. The player type changes which calls are profitable — it's never just about the cards.",
  },
  {
    emoji: '🏳️',
    headline: 'When to Fold',
    hook: () => "The most profitable fold you'll ever make is the one that saves you from a hand you were going to lose anyway.",
    body: "Fold when the pot odds don't justify your equity — even with a decent hand. Fold when a tight player bets big on a blank turn; they're not bluffing. Fold when you're re-raised with no draw and no outs. The money you don't lose is as real as the money you win. Discipline folds are the difference between break-even and profitable players.",
  },
  {
    emoji: '💥',
    headline: 'When to Bet',
    hook: () => "Checking gives away information for free. Every bet should have a purpose — or it shouldn't happen.",
    body: "Bet for value when you want worse hands to call — if they can't call, you're not getting value. Bet to protect when draws need to pay to chase. Bet as a bluff when the board favors your range, villain can fold, and your line is consistent from the beginning. Never bet 'to see what they do.' You're either building a pot you plan to win or removing equity they haven't paid for.",
  },
  {
    emoji: '🔍',
    headline: 'Reading Bet Sizes',
    hook: () => "A min-bet and an overbet are both chips in the pot. They mean completely different things.",
    body: "Tiny bet (20–30% pot): villain usually wants a call — betting small to control pot size while getting thin value, or to stop you from betting bigger. Standard bet (50–75% pot): balanced, hard to read — could be value or bluff. Overbet (100%+): polarized — they either have the nuts or are bluffing with nothing; medium hands don't bet this big. Two streets of checks usually means weakness. Sudden aggression on the river after checking? The draw just got there, or they had it the whole time.",
  },
  {
    emoji: '🤺',
    headline: 'AK vs KK — You\'re Not Dead',
    hook: () => "You're holding AK and they have KK. KK is the 70% favorite — but AK wins 30% of the time. Not dead.",
    body: "These are preflop numbers — the probability of winning across every possible board runout. Once the flop is dealt, you switch tools: count your outs (three aces = 3 outs) and apply the Rule of 4/2. Flop misses everything? That's 3 outs × 4 = 12%. Against AA preflop, AK wins 12%. Against QQ, AK wins 46% — almost a coin flip. Dominated preflop doesn't mean dead — it just means use the math at every street.",
  },
  {
    emoji: '⛏️',
    headline: 'Set Mining',
    hook: () => "You limp with 66. The flop comes 9-6-2 rainbow. You just flopped a set — and you'll stack someone.",
    body: "Pocket pairs hit a set on the flop 11.8% of the time — roughly 1 in 8.5. The rule: you need at least 8.5x the call in implied odds to break even. Villain has $200 behind and it costs $10 to call? That's 20x implied odds — set mine every single time. Against a calling station who never folds, that number goes up even further.",
  },
  {
    emoji: '🏁',
    headline: 'The Classic Race',
    hook: () => "AK vs QQ: 46% vs 54%. You're behind — but barely. This is a coin flip, not a disaster.",
    body: "The most famous race in poker isn't as lopsided as it feels. JJ vs AK: 56/44. TT vs AK: 54/46. KK vs QQ: 82/18. The big pairs dominate each other, but big cards vs medium pairs is always close. If you're getting a big pot in with JJ vs AK, you're a slight favorite. That's a spot most players are terrified of — and shouldn't be.",
  },
  {
    emoji: '🛡️',
    headline: 'Protect Your Aces',
    hook: () => "AA is 85% heads up. Against 8 callers? 31%. Pocket aces lose to the field more than they beat it.",
    body: "Every extra caller chips away at your edge. One opponent: you win 85%. Two: 73%. Four: 50%. Eight: 31%. This is why you raise big preflop with aces — not to build the pot, but to reduce the number of opponents. Fewer players means each one needs to beat you individually. Let everyone limp in and the math turns against you.",
  },
  {
    emoji: '💪',
    headline: 'Even 7-2 Has Equity',
    hook: () => "7-2 offsuit — poker's worst starting hand. It still wins 33% of the time against a random hand.",
    body: "No hand is 0% equity. 72o vs AA: you win 13%. Against KK: 15%. Against QQ: 16%. What separates good starting hands from bad ones isn't zero vs one hundred — it's 45% vs 55%, compounded over thousands of decisions. The math adds up slowly. That's why discipline on starting hand selection matters more than any single hand.",
  },
  {
    emoji: '👥',
    headline: 'Who Can Use This Board?',
    hook: () => "2-3-4 looks dangerous. But if there was a preflop raise, nobody called with 5-6. That board is safer than it looks.",
    body: "A board is only as wet as the hands people actually hold. Low connected boards (2-3-4, 3-5-6) have plenty of straight draw combinations on paper — but in a raised pot the ranges are AA, KK, QQ, AK, AQ. None of those make straights on low boards. The overpair is almost certainly best. In a limped pot with six callers? Those same boards become minefields — players have 5-6, 7-8, A-2, and small pairs. Meanwhile K-Q-J looks tame but destroys raised-pot ranges: AK, AQ, KQ, JJ, QQ all hit it differently. Before reading the board, read the pot.",
  },
  {
    emoji: '🌊',
    headline: 'Set vs Flush Draw',
    hook: () => "You flopped a set. They're on a flush draw. You're winning — but you're not safe.",
    body: "Top set vs a flush draw on the flop: you're 65%, they're 35%. An open-ended straight draw: 69/31. A gutshot: 73/27. Strong made hands are favorites, but draws hit often enough to matter. A half-pot bet gives a flush draw 25% breakeven — but they have 35% equity, so calling is correct for them. To actually price them out, bet pot-sized or bigger. The larger the bet, the more expensive their chase — and the more mistakes they make.",
  },
]

interface TipModalProps {
  scenario: TipScenario
  onDismiss: () => void
}

export function TipModal({ scenario, onDismiss }: TipModalProps) {
  const [tipIdx, setTipIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('poker-tip-index')
      return saved ? parseInt(saved, 10) % TIPS.length : 0
    } catch {
      return 0
    }
  })

  const [displayedText, setDisplayedText] = useState('')
  const [typing, setTyping] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef<number | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    modalRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(tipIdx - 1) }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(tipIdx + 1) }
      if (e.key === 'Enter')      { e.preventDefault(); handleDismiss() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tipIdx])

  const tip = TIPS[tipIdx]
  const fullHook = tip.hook(tipIdx === 0 ? scenario : undefined)

  useEffect(() => {
    setDisplayedText('')
    setTyping(true)
    let i = 0
    intervalRef.current = setInterval(() => {
      i++
      setDisplayedText(fullHook.slice(0, i))
      if (i >= fullHook.length) {
        clearInterval(intervalRef.current!)
        setTyping(false)
      }
    }, 30)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [tipIdx, fullHook])

  function skipTyping() {
    if (!typing) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplayedText(fullHook)
    setTyping(false)
  }

  function goTo(idx: number) {
    setTipIdx(((idx % TIPS.length) + TIPS.length) % TIPS.length)
  }

  function handleDismiss() {
    try {
      localStorage.setItem('poker-tip-index', String((tipIdx + 1) % TIPS.length))
    } catch {}
    onDismiss()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#0c0e14]/80 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Poker concept tip"
      >
        <div
          ref={modalRef}
          tabIndex={-1}
          className="w-full max-w-[480px] lg:max-w-[640px] bg-[#13151f] border border-white/8 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto outline-none"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return
            const delta = e.changedTouches[0].clientX - touchStartX.current
            touchStartX.current = null
            if (Math.abs(delta) < 50) return
            goTo(delta > 0 ? tipIdx - 1 : tipIdx + 1)
          }}
        >
          <div className="p-6">

            {/* Category label */}
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">
              Concept {tipIdx + 1} of {TIPS.length}
            </p>

            {/* Headline */}
            <h2 className="text-2xl font-black text-white leading-tight mb-3">
              {tip.emoji} {tip.headline}
            </h2>

            {/* Typewriter hook — click to skip */}
            <button
              className="block w-full text-left text-sm text-white/55 italic mb-4 min-h-[2.5rem] focus:outline-none"
              onClick={skipTyping}
              aria-label={typing ? 'Click to skip animation' : undefined}
            >
              {displayedText}
              {typing && (
                <span className="inline-block w-0.5 h-3.5 bg-white/40 ml-0.5 animate-pulse align-middle" />
              )}
            </button>

            {/* Widget: ratio display (tip 1) */}
            {tip.widget === 'ratio' && (
              <div className="mb-4 flex items-center justify-center gap-4 bg-[#0c0e14] rounded-xl p-4 border border-white/8">
                <div className="text-center">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Pot</p>
                  <p className="text-2xl font-black tabular-nums text-white">${scenario.pot}</p>
                </div>
                <span className="text-white/20 text-xl">÷</span>
                <div className="text-center">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Call</p>
                  <p className="text-2xl font-black tabular-nums text-white">${scenario.callAmount}</p>
                </div>
                <span className="text-white/20 text-xl">=</span>
                <div className="text-center">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Odds</p>
                  <p className="text-2xl font-black tabular-nums text-blue-400">
                    {scenario.potOddsNum}:{scenario.potOddsDen}
                  </p>
                </div>
              </div>
            )}

            {/* Widget: rock-paper-scissors (tip 7) */}
            {tip.widget === 'rps' && (
              <div className="mb-4 bg-[#0c0e14] rounded-xl p-4 border border-white/8">
                <div className="flex items-center justify-between text-center">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Opponent always</p>
                    <div className="flex gap-2 justify-center">
                      {['✊', '✊', '✊'].map((e, i) => (
                        <span key={i} className="text-2xl opacity-50">{e}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-white/20 text-lg mx-2">→</span>
                  <div>
                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-2">You adapt</p>
                    <div className="flex gap-2 justify-center items-center">
                      <span className="text-2xl">✋</span>
                      <span className="text-xs text-emerald-400 font-bold">= Win every time</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Widget: villain types preview (tip 8) */}
            {tip.widget === 'villainTypes' && (
              <div className="mb-4">
                <PlayerTypeStep
                  selected=""
                  onSelect={() => {}}
                  disabled={false}
                  disabledOptions={[]}
                />
              </div>
            )}

            {/* Body text */}
            <p className="text-sm text-white/70 leading-relaxed mb-6 whitespace-pre-line">
              {tip.body}
            </p>

            {/* Pip navigation */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <button
                onClick={() => goTo(tipIdx - 1)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors w-6 text-center"
                aria-label="Previous tip"
              >
                ←
              </button>
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Tip navigation">
                {TIPS.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === tipIdx}
                    aria-label={`Tip ${i + 1}: ${TIPS[i].headline}`}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === tipIdx
                        ? 'w-5 h-1.5 bg-amber-500'
                        : i < tipIdx
                        ? 'w-1.5 h-1.5 bg-white/40'
                        : 'w-1.5 h-1.5 bg-white/15'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => goTo(tipIdx + 1)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors w-6 text-center"
                aria-label="Next tip"
              >
                →
              </button>
            </div>

            {/* CTA */}
            <button
              onClick={handleDismiss}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
            >
              Got it — Let's Play →
            </button>

          </div>
        </div>
      </div>
    </>
  )
}
