---
name: pre-quali
description: "Pre-qualifying pick analysis for the current F1 round. Re-runs the optimizer notebook with latest practice data, recommends a pick, and writes a diary entry. Use before qualifying each race weekend."
argument-hint: "[round-number]"
---

Prepare the pick for Round $ARGUMENTS before the qualifying deadline.

All paths below are relative to the project root.

## Steps

1. **Read the picks diary** (`analysis/picks-diary-2026.md`) — review all previous learnings, pecking order observations, reliability flags, and model calibration notes. These MUST inform your recommendation.

2. **Check the notebook state** — read the `CURRENT_ROUND`, `MY_PICKS`, and `ACTUAL_POINTS` in the notebook (`analysis/picks_analysis.ipynb`) to confirm season progress.

3. **Update `CURRENT_ROUND`** in the notebook to round $ARGUMENTS if it isn't already set.

4. **Re-execute the notebook in-place** from the `analysis/` directory:
   ```bash
   cd analysis && uv run jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.allow_errors=True picks_analysis.ipynb
   ```

5. **Read the optimizer output** from `analysis/optimal_picks_2026.csv` to see the recommended pick for this round.

6. **Search the notebook output** for the FP-adjusted expected points for the current round (grep for "Adjusted expected points for R$ARGUMENTS") to see how practice data shifted the rankings.

7. **Formulate a recommendation** considering:
   - The optimizer's pick and expected points
   - Practice session adjustments (FP1/FP2/FP3 or FP1-only for sprint rounds)
   - Learnings from previous rounds in the diary (team performance vs model, reliability, practice-to-race translation)
   - Whether the optimizer's pick is a BOOM-BUST driver and if there's a safer alternative nearby
   - Which top drivers are still available and whether this is a good round to spend them

8. **Present the pick summary** to the user:
   - Recommended driver, expected points, consistency profile
   - Why this driver at this circuit
   - Top 3 alternatives with expected points
   - Any relevant diary learnings that influenced the recommendation
   - Risk assessment

9. **Write the diary entry** — append a new round section to `analysis/picks-diary-2026.md` (before the `---` separator and Template section) using the template format. Include:
   - Pick and reasoning
   - Alternatives considered
   - Leave the Result and Learnings sections as `_TBD — update after race_`

10. **Update `MY_PICKS`** in the notebook with the chosen driver for this round (but do NOT re-execute — that happens post-race).

## Important notes

- Sprint weekends (R2, R6, R7, R11, R14, R18) only have FP1 data before the pick deadline
- Normal weekends have FP1, FP2, FP3 data available
- The pick deadline is 10 minutes before qualifying (or sprint qualifying for sprint weekends)
- Always ask the user to confirm the pick before writing it to the notebook
- If the user provides no round number, check the notebook's CURRENT_ROUND or infer from the season calendar
