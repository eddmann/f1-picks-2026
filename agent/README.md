# Gravel

Autonomous F1 picks agent built with the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk). Researches race weekends, makes driver picks, and reflects on results — all documented in a running diary.

## Setup

```bash
cd agent
bun install
```

Set credentials in your environment (see `.env.example`):

```bash
cp .env.example .env  # then fill in real values
```

## Run

```bash
bun run start
```

Gravel figures out the current game state (pick window open? results to process?) and acts accordingly. The only human gate is pick submission — the terminal prompts for confirmation before any pick goes through.

Each run is logged to `runs/` as a timestamped JSONL file for replay and debugging.
