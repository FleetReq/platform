# Poker Trainer — Level Design Rules

Defines exactly what separates Rookie, Regular, and Shark scenarios. Apply these rules to every static scenario added and enforce them in the AI prompt and validation logic.

---

## Summary Table

| Dimension | Rookie (1) | Regular (2) | Shark (3) |
|---|---|---|---|
| **Pot odds ratio** | 2:1, 3:1, 4:1, 5:1 only | All 5 ratios incl. 2.5:1 | All 5 ratios incl. 2.5:1 |
| **Breakeven %** | Always hits quick table exactly | May require real division | May require real division |
| **Draw type** | Single, named (flush/OESD/gutshot) | Single draw, harder board | Combo draws; double-count trap |
| **Outs count** | Obvious subtraction | Requires naming both ends | Requires avoiding double-counts |
| **Equity vs breakeven gap** | Large (≥ 10 pp) — clear decision | Medium (5–10 pp) | Can be thin (2–5 pp) |
| **Correct decision** | Call or Fold only | Call or Fold only | Call, Fold, or **Raise** |
| **Player type step** | ❌ Not included | ✅ Included | ✅ Included |
| **Villain description** | Not shown (no step) | Moderately suggestive | Genuinely ambiguous |
| **Street** | Flop preferred | Mix of Flop + Turn | Mix of Flop + Turn |

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

**Regular and Shark** may use all five ratios. 2.5:1 is intentionally harder because the player can't just look up the answer — they have to do the division.

---

## Draw Types and Outs Counting

### Rookie
- **Flush draw**: "13 [suit] − 4 visible = 9 outs" — pure subtraction, always 9
- **OESD**: "4 [high card] + 4 [low card] = 8 outs" — two named cards, straightforward
- **Gutshot**: "4 [card] = 4 outs" — one named card
- No combo draws. No double-counting. Board texture should make the draw obvious.

### Regular
- Same draw types as Rookie, but board texture may be more complex (e.g., paired board, three to a suit on the board)
- OESD on Turn (Rule of 2 makes the margin tighter and less forgiving)
- No combo draws yet

### Shark
- **Combo draws**: flush draw + OESD, flush draw + gutshot, etc.
- Outs require careful counting to avoid double-counting (e.g., "9 clubs for flush + 3 non-club Kings + 3 non-club Eights = 15 — don't count K♣ or 8♣ twice")
- `outDesc` must show the double-count check explicitly

---

## Equity vs Breakeven Gap

This controls whether the decision is obvious or genuinely close.

| Level | Gap (equity − breakeven) | Effect |
|---|---|---|
| Rookie | ≥ 10 percentage points | Even a rough calculation gives the right answer |
| Regular | 5–10 pp | Requires accurate math; a mistake changes the decision |
| Shark | 2–5 pp (can be tight) | Player type read can flip the call/fold; raise decisions live here |

**Example** — 9 outs, flop, 3:1 pot odds: equity = 36%, breakeven = 25%, gap = +11pp → Rookie territory.

**Example** — 9 outs, turn, 2:1 pot odds: equity = 18%, breakeven = 33%, gap = −15pp → still Rookie (large clear fold).

**Example** — 8 outs, turn, 2.5:1 pot odds: equity = 16%, breakeven = 29%, gap = −13pp → Regular or Shark (requires real division for breakeven).

---

## Correct Decision Rules

```
equity < breakeven              → Fold
equity ≥ breakeven              → Call
equity > breakeven × 1.5
  AND equity ≥ 35%
  AND level = 3                 → Raise
```

- **Rookie**: Call or Fold only — no raises, ever.
- **Regular**: Call or Fold only — raise sizing and semi-bluff concepts are Shark territory.
- **Shark**: Raise is allowed when the equity advantage is commanding *and* there are still 2 cards to come (semi-bluff has value). Never raise on the Turn with one card left unless equity is overwhelming.

---

## Player Type Step

**Rookie**: No `playerType` step. The villain profile is shown for flavour but the correct answer is pure math. The player type badge is revealed immediately after the scenario loads.

**Regular**: `playerType` step included. Villain description is *moderately* suggestive — it points toward the type but requires inference. Badge revealed after the step is answered.

**Shark**: `playerType` step included. Villain description is *genuinely ambiguous* — multiple types are defensible, any reasonable read should be accepted. The step tests whether the player understands that ambiguity. Badge revealed after the step is answered.

### Description calibration examples

| Type | Rookie hint (not used) | Regular hint | Shark hint |
|---|---|---|---|
| NIT | "Folded every hand, big raise = big hand" | "Very selective, only plays strong holdings" | "Patient, rarely involved, confident when in" |
| LAG | "Raises constantly, plays every hand" | "Bets frequently, wide range" | "Active and aggressive, hard to read" |
| STATION | "Called every single bet, never folded" | "Tends to call rather than fold" | "Calls large bets with marginal hands sometimes" |

---

## Street Selection

**Flop** → `cardsToCome: 2`, Rule of 4. Equity estimates are generous; suits Rookie well.

**Turn** → `cardsToCome: 1`, Rule of 2. Margin for error is halved. Prefer Turn for Regular/Shark scenarios where a tight miss would make a big difference.

Recommended distribution:

| Level | Flop | Turn |
|---|---|---|
| Rookie | 70% | 30% |
| Regular | 50% | 50% |
| Shark | 40% | 60% |

---

## Quick Checklist — Adding a New Scenario

Before adding a static scenario or accepting an AI-generated one:

- [ ] Pot ratio matches level's allowed set
- [ ] Breakeven % is on the quick table (Rookie) or clearly calculable (Regular/Shark)
- [ ] Outs counting matches complexity allowed for level
- [ ] Equity vs breakeven gap matches level's range
- [ ] Decision type (raise) only appears at Shark
- [ ] Player type step present iff level ≥ 2
- [ ] Villain description calibrated to level's ambiguity rule
- [ ] No duplicate cards across hand + board
- [ ] Street and `cardsToCome` agree
