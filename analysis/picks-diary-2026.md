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
**Actual points: 26** — Sprint P1 (8pts) + Race P2 (18pts). Fastest lap went to Antonelli (no bonus).

Russell won the sprint comfortably, holding off Leclerc by 0.6s after an entertaining battle. In the main race, Antonelli took his maiden F1 victory from pole, with Russell completing another Mercedes 1-2 — the second consecutive of the season. Russell led early but Antonelli was the quicker Mercedes on Sunday, pulling a 5.5s gap.

**Sprint top 8:** RUS P1, LEC P2, HAM P3, NOR P4, ANT P5, PIA P6, LAW P7, BEA P8.

**Race top 10:** ANT P1, RUS P2, HAM P3, LEC P4, BEA P5, GAS P6, LAW P7, HAD P8, SAI P9, COL P10.

**DNFs:** Verstappen (engine failure, 11 laps from end), Alonso (retired), Stroll (retired).
**DNS:** Norris & Piastri (both electrical failures — McLaren disaster), Bortoleto (Audi), Albon (Williams).

### Learnings for future rounds

**Model calibration:**
- Predicted 25.9 pts for RUS; actual 26. Near-perfect prediction. The FP1-adjusted model (+7.6 uplift) was accurate for a frontrunning team at a sprint weekend.
- The override decision to pick RUS over the optimizer's OCO recommendation gained us ~7 points vs the likely OCO outcome (OCO didn't score — Ocon's Haas teammate Bearman got P5 in the race but Ocon likely would have been further back or DNF given the attrition).
- Key insight: **model predictions for Tier 1 teams are reliable; practice uplifts for backmarkers are not** (R1 Williams lesson confirmed by Albon DNS here).

**2026 pecking order (R2 update):**
- **Tier 1:** Mercedes (RUS, ANT) — dominant. Two consecutive 1-2 finishes. Russell leads championship. The clear benchmark team.
- **Tier 2:** Ferrari (HAM, LEC) — consistent P3-P4 finishers in both races. Hamilton's first podium for Ferrari. Solid but ~25s off Mercedes pace.
- **Tier 2.5:** Haas (BEA) — Bearman P8 sprint, P5 race is very impressive. Best of the rest in the race. Haas are punching well above weight.
- **Tier 3:** Racing Bulls (LAW) — Lawson scored in both sprint (P7) and race (P7). Consistent points scorer.
- **Tier 3:** Red Bull (HAD, VER) — Hadjar P8 race, but Verstappen DNF (engine). Red Bull unreliable and off the pace when running.
- **Midfield:** Alpine (GAS P6 race), Williams (SAI P9 race)
- **Backmarkers/Unreliable:** McLaren (double DNS), Audi (BOR DNS), Aston Martin (both retired)

**Reliability flags:**
- **RED FLAG — Red Bull:** Verstappen engine failure R2 + Hadjar engine failure R1. Two engine-related DNFs in two races. Avoid RBR picks until proven reliable.
- **RED FLAG — McLaren:** Double DNS at Shanghai (both cars electrical). Combined with Piastri DNS at Melbourne, that's 3 non-starts in 4 car-races. Very risky.
- **AMBER — Aston Martin:** Both Alonso and Stroll retired. Alonso also retired R1. Unreliable.
- **AMBER — Audi:** Bortoleto DNS (after Hulkenberg DNS R1). Two DNS in two races.
- **CLEAR — Mercedes:** Perfect reliability. Two 1-2 finishes.
- **CLEAR — Ferrari:** Perfect reliability. Four points finishes from four starts.
- **CLEAR — Haas:** Bearman scored in both races. Reliable midfield option.

**Strategic takeaways:**
- **Override strategy validated:** Picking RUS over the optimizer's OCO gained ~7pts. When the model undervalues a dominant team, human override is correct. Continue to weigh Mercedes picks heavily while their advantage holds.
- **Sprint weekends + dominant car = maximum value.** RUS at a sprint weekend delivered 26pts. Prioritise remaining sprint weekends for strong picks (Miami R6, Canada R7, British R11, Dutch R14, Singapore R18).
- **Haas is undervalued.** Bearman consistently in P5-P8 range. The optimizer has BEA for Mexico R20 (12.0 pts) — may be worth more now.
- **Avoid Red Bull and McLaren** for the near term. Reliability is too poor. The optimizer has VER for Suzuka R3 (25.4 pts) — this is now risky given two engine failures. Consider whether to override.
- **Next round (R3 Suzuka):** Optimizer recommends VER (25.4 pts). Given Red Bull's reliability issues, this needs careful evaluation with practice data. If VER shows pace but we're worried about DNF risk, may need to override.

**Season tracker:**
- Points scored: 26 / Expected: 36.2 (cumulative) / Delta: -10.2
- Drivers used: ALB, RUS
- Drivers remaining: 20

## Round 3 — Japanese Grand Prix (Suzuka, March 27)

**Pick: BOR (Gabriel Bortoleto) — Audi**

**Expected points:** 13.6 (FP1+FP2+FP3 adjusted) | **Profile:** BOOM-BUST (CV 2.32)

### Reasoning

**What the optimizer said:** With all three FP sessions loaded (1512 laps), the optimizer moved VER off Suzuka (base 25.4 dropped to 12.9 after poor practice, -12.5) and reassigned him to Canada R7 (26.9, sprint). The optimizer picked BOR at 13.6 — a midfield value play that saves all top drivers for higher-value races.

**FP data story (FP1+FP2+FP3):** Piastri and Norris tied at the top (20.7 pts each) — McLaren looked strong across all three sessions, with PIA gaining the most from FP3. Lindblad emerged at 16.2 (+12.4) after a strong FP3 showing from Racing Bulls. Russell (16.0) and Hamilton (15.9) rounded out the top five. Bortoleto held steady at 13.6 (+13.6 from a ~0 base) — Audi's practice pace was consistent across all sessions. Verstappen continued to struggle, dropping further to 12.9 (-12.5). Leclerc also faded in FP3, down to 12.7. Antonelli dropped from 16.5 (FP1+FP2) to 13.4 after a weaker FP3.

**Why trust the optimizer over an override:** The season-long math favours saving PIA for Miami R6 (32.5, sprint), NOR for Singapore R18 (24.5, sprint), and LEC for Austin R19 (18.8). BOR at 13.6 is the optimizer's best remaining option that doesn't cannibalise a bigger future pick. The closest override would be HAM (15.9 pts) at a season cost of only -2.6 pts vs his Spa R12 allocation (13.3), but the optimizer still prefers preserving the full allocation.

**Risk acknowledged:** BOR is BOOM-BUST with all value from FP uplift — the same profile as ALB at R1 (which scored 0). Audi also has AMBER reliability (HUL DNS R1, BOR DNS R2). This is a known risk we're accepting to preserve the season-long allocation.

### Alternatives considered
- **PIA** (20.7 pts) — tied top after FP3, VARIABLE, but saved for Miami R6 (32.5 sprint). Override costs 11.8 pts season-long. McLaren reliability RED FLAG (3 non-starts in 4 car-races).
- **NOR** (20.7 pts) — tied top, VARIABLE, but saved for Singapore R18 (24.5 sprint). Override costs 3.8 pts season-long.
- **LIN** (16.2 pts) — strong FP3 debut pace, UNKNOWN profile. Optimizer has him at Monza R15 (3.8 pts) so cheap override, but untested consistency.
- **HAM** (15.9 pts) — VARIABLE, Ferrari Tier 2 reliable. Cheapest meaningful override (-2.6 cost vs Spa R12). Strongest safe alternative.
- **VER** (12.9 pts) — historically strong at Suzuka but terrible FP pace (-12.5) and Red Bull reliability RED FLAG (two engine failures in two races).

### Result
_TBD — update after race_

### Learnings for future rounds
_TBD — update after race_

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
