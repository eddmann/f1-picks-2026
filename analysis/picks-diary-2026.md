# F1 Picks Diary — 2026 Season

## Round 1 — Australian Grand Prix (Melbourne, March 6-8)

**Pick: ALB (Alexander Albon) — Williams**

**Expected points:** 10.3 | **Profile:** BOOM-BUST

### Reasoning

The optimizer assigned Albon to Melbourne as the best FP3 value pick. Here's why:

**Practice pace uplift:** Albon's baseline expected points at Melbourne were ~6.1, but FP3 data showed strong pace from Williams around Albert Park, pushing him up to 10.3 expected points (+4.2 gain). This was a meaningful uplift relative to his season-long baseline.

**Why not a top driver?** The adjusted Melbourne standings had VER (20.8), LEC (20.4), NOR (16.3), and RUS (15.4) all scoring higher. But the optimizer reserves these drivers for races where they score even more — Verstappen at Suzuka (25.4), Norris at Spielberg (25.0), Hamilton at Spa (25.0), Russell at Singapore (26.0). Using a top driver at Melbourne would waste their allocation on a race where the relative gain over a midfield pick is smaller than at their optimal circuit.

**Melbourne as a good ALB circuit:** Historical data (blended 50/50 with Bahrain Test 2 testing) showed Williams performing respectably at Melbourne. Albon scored 6.2 baseline expected points there — one of his stronger circuits along with Imola (6.2). The FP3 data confirmed this wasn't a fluke.

**The value calculus:** At 10.3 expected points, Albon at Melbourne is a solid midfield pick that "frees up" elite drivers for their peak races. The season-long optimizer maximises total points across all 22 non-wildcard rounds, not just any single race. Spending Albon here (rather than a top driver) costs ~10 points at Melbourne but saves ~10+ points elsewhere.

**Risk acknowledged:** Albon is classified BOOM-BUST (CV 1.87, 66.7% zero-score rate historically). This is a swing pick — he either scores well or blanks. But the optimizer accounts for this variance and still prefers him here over alternatives.

### Alternatives considered
- **VER** (20.8 pts) — saved for Suzuka R3 (25.4 pts)
- **LEC** (20.4 pts) — saved for Monza R15 (17.0 pts) and other strong circuits
- **NOR** (16.3 pts) — saved for Spielberg R10 (25.0 pts)
- **SAI** (5.3 pts) — similar tier but worse Melbourne practice pace
- **HAD** (14.9 pts) — strong FP3 showing but saved for Zandvoort R14 (19.5 pts)

### Result
**Actual points: 0** — Albon finished P12, one lap down.

A disappointing BUST outcome, but not unexpected given the 66.7% zero-score rate baked into the model. Mercedes dominated with a 1-2 (Russell P1, Antonelli P2), followed by both Ferraris (Leclerc P3, Hamilton P4). The midfield was spread out with Norris P5 and Verstappen P6. Williams struggled for race pace despite promising practice sessions — Albon finished behind both Haas (Bearman P7), Lindblad (P8), Bortoleto (P9), and Gasly (P10). Sainz in the other Williams also had a poor race (P15, 2 laps down).

Notable DNFs: Piastri (DNS — locked rear axle on formation lap), Hulkenberg (DNS), Hadjar (retired — engine), Alonso (retired), Bottas (retired — fuel system).

### Learnings for future rounds

**Model calibration:**
- FP3 practice pace did not translate to race pace for Williams — the +4.2 uplift was misleading. Consider discounting practice adjustments for backmarker teams whose race-day degradation/strategy is worse than FP pace suggests.
- The model predicted 10.3 pts; actual was 0. One data point, but worth tracking whether practice boosts for midfield/backmarker teams are systematically overfit.

**2026 pecking order (R1 snapshot):**
- **Tier 1:** Mercedes (RUS, ANT) — dominant, clear fastest team. Russell and Antonelli both delivered. Model had RUS at 15.4 for Melbourne — he scored 25. Mercedes looks undervalued.
- **Tier 2:** Ferrari (LEC, HAM) — solid P3-P4, competitive but not challenging Mercedes.
- **Tier 3:** McLaren (NOR) / Red Bull (VER) — P5-P6, surprisingly far off the lead (~50s). Piastri DNS so can't judge his pace. Verstappen had fastest lap but lacked race pace.
- **Midfield:** Haas (BEA P7), Racing Bulls (LIN P8), Audi (BOR P9), Alpine (GAS P10) — the points-scoring cutoff.
- **Backmarkers:** Williams (ALB P12, SAI P15) — race pace significantly worse than practice suggested.

**Reliability flags:**
- Hadjar (Red Bull) — engine failure. Watch for RBR reliability if considering HAD later.
- Piastri (McLaren) — mechanical DNS. Freak incident, probably not recurring.
- Hulkenberg (Audi) — DNS. Audi reliability is a concern.
- Bottas (Cadillac) — fuel system retirement. Cadillac still fragile.
- Alonso (Aston Martin) — retired after 15 laps.

**Strategic takeaways:**
- Williams FP pace is a trap — don't trust practice uplifts for this team until proven otherwise.
- Mercedes may be the team to target where the model undervalues them (ANT already allocated to R7 Canada at 19.5 expected — might actually be worth more).
- Bearman (Haas) P7 is interesting — if Haas are genuinely best-of-the-rest, BEA could be undervalued in the optimizer.
- Lindblad P8 on debut is notable — his "UNKNOWN" consistency profile may be better than assumed.

**Season tracker:**
- Points scored: 0 / Expected: 10.3 / Delta: -10.3
- Drivers used: ALB
- Drivers remaining: 21

## Round 2 — Chinese Grand Prix (Shanghai, March 13-15) — Sprint Weekend

**Pick: RUS (George Russell) — Mercedes**

**Expected points:** 25.9 (FP1-adjusted) | **Profile:** VARIABLE

### Reasoning

**Bug fix context:** Before this round, we discovered a bug in the notebook — the `EventFormat` filter used `sprint_shootout` instead of `sprint_qualifying`, which meant **all sprint weekend races were missing from historical data** across 2024, 2025, and 2026. This affected Shanghai, Miami, Austin, São Paulo, Qatar, and others. Fixing this expanded the circuit matrix from 19 to 25 circuits and significantly changed the optimizer's allocation.

**What the optimizer said:** With the fix applied and FP1 data loaded, the optimizer recommended **OCO (Ocon) at 19.1 pts** — a BOOM-BUST midfield pick that saves top drivers for their peak circuits. The close calls showed PIA (27.1), RUS (25.9), and ANT (24.9) as alternatives.

**Why we overrode the optimizer with RUS:** Three reasons:

1. **Mercedes early-season dominance:** R1 showed Mercedes are clearly the fastest team — RUS won with a dominant performance, and the model *undervalued* him (predicted 15.4, scored 25). The model assumes static team performance across the season, but in reality Mercedes' advantage will likely shrink as other teams bring upgrades. Using RUS early maximises the value of Mercedes' current edge.

2. **Sprint weekend maximises points ceiling:** Sprint weekends offer points from both the sprint race and the main race. Pairing a dominant car with a sprint weekend gives the best chance of a big haul. RUS at a sprint round while Mercedes are untouchable is the highest-EV play the model can't see.

3. **Acceptable opportunity cost:** The optimizer had RUS saved for Canada R7 (27.5 pts, also a sprint weekend). The paper cost is only 1.6 pts — and if Mercedes' advantage erodes by R7 (likely with development race), the true cost is zero or negative. Canada R7 can be reassigned (e.g. ANT at 19.5 there).

**FP1 data:** RUS showed +7.6 uplift at Shanghai, ranking 2nd behind PIA (20.9). The Mercedes FP1 pace corroborates the R1 dominance story.

**Risk profile:** RUS is VARIABLE (CV 0.50, 10.8% zero-score rate) — far safer than OCO's BOOM-BUST (CV 2.65, ~69% zero-score rate). This is a high-floor, high-ceiling pick.

### Alternatives considered
- **OCO** (19.1 pts) — optimizer's pick, but BOOM-BUST profile (CV 2.65) makes it a coin flip. Haas had good R1 pace (BEA P7) but trusting Ocon to deliver 19 pts at Shanghai is a big ask.
- **ANT** (24.9 pts) — other Mercedes driver, +6.9 net gain vs his allocated race (São Paulo R21, 18.0 pts). Strong option but BOOM-BUST profile (42% zero-score rate). Less proven than RUS.
- **PIA** (27.1 pts) — highest adjusted points at Shanghai, but saved for Miami R6 (32.5 pts). Spending him here costs 5.4 pts season-long.
- **NOR** (17.3 pts) — CONSISTENT but lower ceiling. Saved for Singapore R18 (24.5 pts).

### Result
_TBD — update after race_

### Learnings for future rounds
_TBD — update after race_

**Season tracker:**
- Points scored: 0 / Expected: 36.2 (cumulative) / Delta: -10.3
- Drivers used: ALB, RUS
- Drivers remaining: 20

---

## Template

```
## Round N — Race Name (Circuit, Date)

**Pick: XXX (Driver Name) — Team**

**Expected points:** X.X | **Profile:** CONSISTENT/VARIABLE/BOOM-BUST

### Reasoning
Why this driver, why this race, what the optimizer said, what the FP data showed.

### Alternatives considered
- **XXX** (X.X pts) — why not chosen

### Result
Actual points scored. What happened in the race?

### Learnings for future rounds
Model calibration notes, pecking order updates, reliability flags, strategic takeaways.
```
