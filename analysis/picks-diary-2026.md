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
