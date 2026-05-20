# Poker Trainer — Level Design Rules

Defines exactly what separates Rookie, Regular, and Shark scenarios. Applies to every static scenario, the AI prompt, validation logic, the hint system, and player-facing copy.

---

## Level Narratives

### Rookie — Learn the Loop
The goal at Rookie is to internalize the 3-step mechanical loop every serious player uses: count outs → estimate equity → compare to breakeven. Scenarios are designed to be forgiving — pot ratios hit the quick reference table exactly, draw types are single and clearly named, and gaps between equity and breakeven are wide enough that rough math still produces the right answer.

The hints walk you through every formula with numbers filled in. You will make mistakes, retry, and get it right before moving on. By the end, the loop should feel automatic.

**What you leave Rookie knowing:**
- How to read pot odds from any clean ratio
- How to apply Rule of 4 (flop) and Rule of 2 (turn) for equity estimates
- How to identify a flush draw, OESD, and gutshot by name and outs count
- How to make a correct call/fold decision when the gap between equity and breakeven is clear

### Regular — Sharpen the Math
Regular introduces real cognitive pressure. The 2.5:1 ratio requires actual division — you can't look it up on the quick table anymore. Board textures get harder: paired boards, three cards of a suit on the board, Turn scenarios where the Rule of 2 cuts your equity estimate in half. Gaps narrow to 5–10pp, meaning a small calculation error changes the answer.

The player type step appears here for the first time. Regular villain descriptions point toward a player type but require inference — you must read tendencies across hands, not react to a single obvious tell. Hints show you the formula name, but not the numbers.

**What you leave Regular knowing:**
- How to calculate breakeven % by division without a reference table
- How Turn scenarios (Rule of 2) change the pressure on marginal draws
- How to classify a villain from moderately suggestive table behavior
- How to make correct decisions in tight spots where a math mistake costs you

### Shark — Think Like a Pro
Shark tests whether you can operate without a safety net. Combo draws require careful outs counting — a card that completes both your flush and your straight only counts once. Equity gaps can be as thin as 2–5pp, so exact math is non-negotiable. Villain descriptions are deliberately ambiguous: a patient player who rarely enters pots but fires large bets when they do could be a NIT protecting a monster or a TAG picking a well-timed spot. Multiple reads are defensible.

For the first time, **raise** is a correct answer — not just "raise is viable," but the mathematically optimal play when equity is commanding and you still have cards to come. Semi-bluffing with a big draw builds the pot while keeping draw equity as your backup.

No hints are shown at any step. You either know it or you don't — and if you don't, you retry until you do.

**What you leave Shark knowing:**
- How to count outs on a combo draw without double-counting shared cards
- How to calculate breakeven % on a 2.5:1 ratio without assistance
- How to make a defensible villain read from genuinely ambiguous behavior
- When equity is commanding enough to semi-bluff raise instead of just calling

---

## Summary Table

| Dimension | Rookie (1) | Regular (2) | Shark (3) |
|---|---|---|---|
| **Pot odds ratio** | 2:1, 3:1, 4:1, 5:1 only | All 5 ratios incl. 2.5:1 | All 5 ratios incl. 2.5:1 |
| **Breakeven %** | Always hits quick table exactly | May require real division | Requires real division |
| **Draw type** | Single, named (flush/OESD/gutshot) | Single draw, harder board | Combo draws; double-count trap |
| **Outs count** | Obvious subtraction | Requires naming both ends | Must avoid double-counting |
| **Equity vs breakeven gap** | Large (≥ 10 pp) — clear decision | Medium (5–10 pp) | Thin (2–5 pp) |
| **Correct decision** | Call or Fold only | Call or Fold only | Call, Fold, or **Raise** |
| **Player type step** | ❌ Not included | ✅ Included | ✅ Included |
| **Villain description** | Not shown (no step) | Moderately suggestive | Genuinely ambiguous |
| **Street** | Flop preferred | Mix of Flop + Turn | Turn preferred |
| **Hints** | Formula + worked numbers + tip | Formula name only | No hints |

---

## Scoring Mechanics

**Intermediate steps** (pot odds, breakeven, outs, equity, player type) are **unscored**. You must answer correctly to advance — wrong answers trigger a retry — but they do not affect your score. They exist to build the inputs you need for the final decision.

**The decision step is the only grade.** The AI coach evaluates your choice and issues a verdict:

| Verdict | Meaning | Score |
|---|---|---|
| **Correct** | Mathematically right play, or a well-justified alternative | ✅ Pass |
| **Borderline** | Both call and raise are reasonable, or equity is within 5% of breakeven | ✅ Pass |
| **Incorrect** | A play that loses money given the math, without sufficient justification | ❌ Fail |

Session results use pass/fail per scenario. The session completion screen shows your pass rate across all scenarios at that level.

---

## Hint System

All levels share the same core mechanic: **you must answer correctly to advance.** Wrong answers shake the input and require a retry. The only difference between levels is how much guidance appears before you submit.

### Pot Odds

| Level | Pre-answer hint |
|---|---|
| Rookie | Formula + filled-in numbers (`$60 ÷ $20 = ?:1`) + quick reference tip |
| Regular | Formula only — `Pot ÷ Call Amount = X:1` |
| Shark | No hint |

### Breakeven %

| Level | Pre-answer hint |
|---|---|
| Rookie | Formula + filled-in numbers (`$20 ÷ ($60 + $20) = $20 ÷ $80 = ?%`) + quick table tip |
| Regular | Formula only — `Call ÷ (Pot + Call) × 100` |
| Shark | No hint |

### Count Your Outs

| Level | Pre-answer hint |
|---|---|
| Rookie | Draw-type conceptual hint — tells you *what* to count, never *how many*. Examples: "A flush needs 5 hearts. You have 4 visible — count the remaining hearts in the deck." / "An open-ended straight has 2 ranks that complete it, one on each end. How many of each are left?" |
| Regular | No pre-answer hint. Wrong answer reveals the full outDesc explanation. |
| Shark | No hint. Wrong answer reveals only the draw type name. |

The Rookie hint never states the answer. It names the mechanic and asks the question — the player still has to count.

### Equity %

| Level | Pre-answer hint |
|---|---|
| Rookie | Rule reference + outs from their own previous answer: "You found 9 outs. With 2 cards to come, Rule of 4: 9 × 4 = ?%" |
| Regular | Rule name only — "Outs × 4 (2 cards to come) or Outs × 2 (1 card to come)" |
| Shark | No hint |

The Rookie equity hint chains the steps together intentionally — the player sees their own outs count used in the formula, reinforcing the connection.

### Player Type

| Level | Pre-answer hint |
|---|---|
| Rookie | Step not included |
| Regular | No hint — read the villain description and classify |
| Shark | No hint — description is ambiguous; any well-reasoned read is accepted |

### Decision

| Level | Pre-answer hint |
|---|---|
| Rookie | Rule + both numbers filled in: "Your equity: 36% vs Break-even: 25%" |
| Regular | Rule only — "equity > breakeven → call or raise; equity < breakeven → fold" |
| Shark | No hint |

---

## Pot Odds Ratios

**Rookie** — only ratios whose breakeven falls exactly on the quick table:

| Ratio | Breakeven | Quick table? |
|---|---|---|
| 2:1 | 33% | ✅ |
| 3:1 | 25% | ✅ |
| 4:1 | 20% | ✅ |
| 5:1 | 17% | ✅ |
| **2.5:1** | **28.6%** | ❌ — requires `$call ÷ $(pot+call)` |

**Regular and Shark** may use all five ratios. 2.5:1 is intentionally harder because the player cannot look it up — they must divide.

---

## Draw Types and Outs Counting

### Rookie
- **Flush draw**: 13 [suit] − visible [suit] cards = outs. Always 9 on a standard flush draw. Pure subtraction.
- **OESD**: 4 cards on the high end + 4 cards on the low end = 8 outs. Both completing ranks are named.
- **Gutshot**: 1 specific rank fills the interior gap. 4 of that rank remain in the deck. One named card.
- No combo draws. No double-counting. Board texture makes the draw visually obvious.

### Regular
- Same draw types as Rookie, but board texture adds noise: paired boards, three cards of a suit already on the board, or Turn scenarios where one card to come halves the equity estimate
- OESD on the Turn requires the player to recognize they're using Rule of 2, not Rule of 4
- No combo draws yet

### Shark — The Double-Count Trap

Combo draws are the defining challenge at Shark. When you hold both a flush draw and a straight draw, some cards complete both — and they only count as one out.

**Example: Flush draw + gutshot**
- Hand: A♣K♣ · Board: Q♣J♣2♦ (Flop, 2 cards to come)
- Flush outs: 9 remaining clubs, including T♣
- Straight outs: T makes broadway (A K Q J T) — there are 4 Tens total
- But T♣ is already counted as a flush out
- **Unique outs: 9 clubs + T♦ T♥ T♠ = 12** (not 13)

**Example: Flush draw + OESD**
- Hand: 8♣9♣ · Board: 6♣7♦Q♠2♣ (Turn, 1 card to come)
- Flush outs: 9 remaining clubs, including 5♣ and T♣
- Straight outs: 5 or T completes the straight — 4 Fives + 4 Tens = 8 cards total
- But 5♣ and T♣ are already flush outs
- **Unique outs: 9 clubs + 5♦5♥5♠ + T♦T♥T♠ = 15** (not 17)

The `outDesc` on every Shark scenario must show the double-count check step explicitly — players need to see the reasoning, not just the final number.

---

## Equity vs Breakeven Gap

This controls whether the decision is obvious or genuinely close.

| Level | Gap (equity − breakeven) | Effect |
|---|---|---|
| Rookie | ≥ 10 percentage points | Even a rough calculation gives the right answer |
| Regular | 5–10 pp | Requires accurate math; a small mistake changes the decision |
| Shark | 2–5 pp | Exact calculation required; player type read can flip the call/fold |

**Rookie example** — 9 outs, flop, 3:1 odds: equity 36%, breakeven 25%, gap +11pp → clear call.

**Regular example** — 8 outs, turn, 2.5:1 odds: equity 16%, breakeven 29%, gap −13pp → requires real division to confirm.

**Shark example** — 12 outs (combo), flop, 3:1 odds: equity 48%, breakeven 25%, gap +23pp → raise territory.

---

## Correct Decision Rules

```
equity < breakeven                        → Fold
equity ≥ breakeven                        → Call
equity > breakeven × 1.5 AND equity ≥ 35%
  AND level = 3                           → Raise
```

- **Rookie**: Call or Fold only. Never raise.
- **Regular**: Call or Fold only. Raise sizing and semi-bluff concepts are Shark territory.
- **Shark**: Raise is correct when the equity advantage is commanding. On the Turn (1 card to come), raise only if equity is overwhelming — the semi-bluff window is narrow.

### Borderline raise (all levels)
When `decision = call AND cardsToCome = 2 AND equityPct ≥ 30`, both "call" and "raise" are accepted as correct. The explanation notes the minimum raise EV and the fold percentage the villain needs to reach for raising to beat calling.

---

## Player Type Step

**Rookie**: No `playerType` step. The villain profile is shown as flavour but the correct answer is pure math. The player type badge is revealed immediately.

**Regular**: `playerType` step included. Villain description is moderately suggestive — points toward the type but requires inference. Badge revealed after the step is answered.

**Shark**: `playerType` step included. Villain description is genuinely ambiguous — multiple types are defensible. Any reasonable read should be accepted by the coach. Badge revealed after the step is answered.

### Description calibration by player type

| Type | Regular hint (suggestive) | Shark hint (ambiguous) |
|---|---|---|
| NIT | "Very selective, only enters with strong holdings, raises big when in" | "Patient player, rarely involved, confident when they do commit" |
| TAG | "Plays solid ranges, bets strong hands hard, folds to 3-bets" | "Disciplined, watches before acting, occasionally applies pressure" |
| LAG | "Bets frequently with a wide range, applies constant pressure" | "Active and aggressive, hard to pin down, mixes bluffs with value" |
| STATION | "Tends to call rather than fold, even on bad boards" | "Calls large bets with marginal hands, rarely applies pressure themselves" |
| MANIAC | "Raises and re-raises constantly, almost never folds" | "Unpredictable, high variance, involved in many pots across the session" |

---

## Street Selection

**Flop** → `cardsToCome: 2`, Rule of 4. Equity estimates are generous; suits Rookie well.

**Turn** → `cardsToCome: 1`, Rule of 2. Margin for error is halved. Prefer Turn for Regular/Shark.

| Level | Flop | Turn |
|---|---|---|
| Rookie | 70% | 30% |
| Regular | 50% | 50% |
| Shark | 40% | 60% |

---

## Player-Facing Descriptions

Short copy for landing pages, onboarding, or the level picker UI.

### Rookie
**Learn the math that wins pots.**
Master the 3-step loop every serious player uses: count your outs, estimate your equity, compare it to the pot odds. Scenarios are clear, hints guide you through every formula, and decisions are never close. Build the habit before you face the pressure.

### Regular
**Apply the math under pressure.**
Tighter margins. Harder board textures. You can no longer look up the answer — you have to calculate it. Plus: start reading your opponent. Who is this person? How do their tendencies change the right play? Regular is where instinct and math start to merge.

### Shark
**Think like a professional.**
Combo draws with shared outs. Equity edges as thin as 2%. Villains who could be anyone at the table. And for the first time — semi-bluff raises that build the pot while your draw is still live. No hints. No safety net. Shark is for players who want to get decisions right even when they're hard.

---

## Quick Checklist — Adding a New Scenario

- [ ] Pot ratio matches the level's allowed set (Rookie: no 2.5:1)
- [ ] Breakeven % is on the quick table (Rookie) or calculable by division (Regular/Shark)
- [ ] Draw type matches the level's allowed complexity (no combo draws at Rookie/Regular)
- [ ] Outs count is accurate; `outDesc` shows the counting step-by-step
- [ ] Shark `outDesc` explicitly shows the double-count check
- [ ] Equity vs breakeven gap matches the level's range
- [ ] Decision type: raise only at Shark level
- [ ] Player type step present iff level ≥ 2
- [ ] Villain description calibrated to the level's ambiguity rule
- [ ] `villainResponses` (fold/call/reraise) present for level ≥ 2
- [ ] No duplicate cards across hand + board
- [ ] Street and `cardsToCome` agree (Flop = 2, Turn = 1)
