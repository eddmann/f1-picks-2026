---
name: post-race
description: "Post-race results update for the current F1 round. Looks up actual race results, updates the notebook and diary with points scored and learnings. Use after each race finishes."
argument-hint: "[round-number]"
---

Record the results for Round $ARGUMENTS after the race.

All paths below are relative to the project root.

## Steps

1. **Read the picks diary** (`analysis/picks-diary-2026.md`) to find the pick that was made for this round and the pre-race reasoning.

2. **Check the notebook** (`analysis/picks_analysis.ipynb`) to confirm `MY_PICKS` has an entry for round $ARGUMENTS and see who was picked.

3. **Look up the actual race results** — use web search to find the full race classification for this round:
   - Search for "F1 2026 [Race Name] Grand Prix results classification"
   - Find the full finishing order (all 20 drivers), DNFs, DNS
   - Determine how many points our picked driver scored
   - Note the fastest lap holder (bonus point if in top 10)

4. **Update `ACTUAL_POINTS`** in the notebook — add the entry `$ARGUMENTS: <points>` with a comment showing position and context.

5. **Re-execute the notebook in-place** from the `analysis/` directory:
   ```bash
   cd analysis && uv run jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.allow_errors=True picks_analysis.ipynb
   ```

6. **Update the diary entry** for this round in `analysis/picks-diary-2026.md`. Replace the `_TBD_` placeholders in the Result and Learnings sections with:

   **Result section:**
   - Actual points scored and finishing position
   - Brief race narrative relevant to our pick (what happened to our driver)
   - How the top 10 finished
   - Notable DNFs/DNS

   **Learnings for future rounds section** — this is the most important part. Capture:

   - **Model calibration:** How did predicted vs actual compare? Was the model overconfident/underconfident for any teams? Are practice boosts trustworthy for this tier of team?
   - **Pecking order update:** Tier the teams based on cumulative results so far (Tier 1/2/3/midfield/backmarker). Note any teams that moved tiers vs last round.
   - **Reliability flags:** Any new DNFs/mechanical issues to watch. Update or clear previous flags if teams proved reliable.
   - **Strategic takeaways:** Concrete observations that should influence future picks — which teams/drivers are undervalued or overvalued by the model? Any drivers to avoid?
   - **Season tracker:** Running points total, delta vs model prediction, drivers used, drivers remaining.

7. **Update the optimizer CSV** — run `cat analysis/optimal_picks_2026.csv` and check whether the completed round's status is now marked as COMPLETED.

8. **Present a summary** to the user:
   - What our pick scored vs expected
   - Key takeaways for future rounds
   - Running season score vs model projection
   - Any flags for the next round's pick

## Important notes

- Points system: P1=25, P2=18, P3=15, P4=12, P5=10, P6=8, P7=6, P8=4, P9=2, P10=1, P11+=0. Fastest lap = +1 if in top 10.
- Sprint race points (if applicable): P1=8, P2=7, P3=6, P4=5, P5=4, P6=3, P7=2, P8=1. Add to race points for total.
- Be honest in the learnings — if the pick was bad, say so and explain what we'd do differently
- The diary learnings are the primary mechanism for improving picks round-over-round — be thorough
- If the user provides no round number, infer from the last entry in MY_PICKS
