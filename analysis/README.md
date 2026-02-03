# F1 Picks 2026 - Analysis Notebook

Optimal driver pick allocation for the 2026 F1 season using historical data and the Hungarian algorithm.

## Quick Start

```bash
cd analysis
uv run jupyter notebook picks_analysis.ipynb
```

Then run all cells (Cell > Run All).

## How It Works

1. **Fetches 2026 calendar** from OpenF1 API (24 races, 6 sprints, 2 wild cards)
2. **Loads historical results** from FastF1 (2024-2025 + any 2026 data)
3. **Builds expected points matrix** (22 drivers × all circuits)
4. **Solves optimal allocation** using Hungarian algorithm
5. **Outputs pick recommendations** with form/consistency analysis

## Game Rules Implemented

| Rule                         | Implementation                              |
| ---------------------------- | ------------------------------------------- |
| R1-R22: Use each driver once | Hungarian algorithm ensures 22 unique picks |
| R23-R24: Wild cards          | Best available driver picked (can reuse)    |
| Sprint weekends (6)          | 30% bonus applied to expected points        |
| Pick deadline                | Re-run before qualifying for latest data    |

## When to Re-Run

**Re-run the notebook before each race weekend** to get updated picks based on:

- New 2026 race results (weighted highest at 1.0x)
- Form momentum (last 3 races hot/cold analysis)
- Updated consistency metrics

### Workflow

1. **Monday of race week**: Re-run notebook
2. **After practice sessions**: Check form recommendations
3. **Before qualifying**: Lock in your pick (deadline is 10 min before quali)

## Output Files

| File                     | Description                                  |
| ------------------------ | -------------------------------------------- |
| `optimal_picks_2026.csv` | Full season allocation with expected points  |
| `.fastf1_cache/`         | Cached race data (speeds up subsequent runs) |

## Data Sources

- **OpenF1 API**: 2026 calendar, current driver info
- **FastF1**: Historical race results (2024-2025-2026)

## Notebook Phases

1. **Setup**: Load libraries, enable cache
2. **Expected Points Matrix**: Driver × circuit historical averages
3. **Optimal Allocation**: Hungarian algorithm + wild card picks
4. **Form Momentum**: Hot/cold driver tracking
5. **Consistency Analysis**: Variance-based risk assessment
6. **ML Decision Point**: Evaluate if ML would add value

## Dependencies

Managed by uv (see `pyproject.toml`):

- fastf1
- pandas, numpy, scipy
- matplotlib
- jupyter

## 2026 Regulation Changes

Major car/rules overhaul means historical data is less predictive early in the season. The notebook handles this by:

- Weighting 2026 results highest (1.0x) as they become available
- Tracking form momentum to catch teams that adapted well/poorly
- Providing consistency analysis to manage risk
