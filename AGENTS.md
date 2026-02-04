# AGENTS.md

## Project Overview

F1 Picks 2026 - a seasonal Formula 1 driver picking game built with React 19 (Vite) frontend and Cloudflare Workers (Hono) backend. TypeScript throughout, D1 SQLite database, Bun as runtime/test runner.

## Setup

```bash
make start
```

## Common Commands

```bash
make start         # Install deps, migrate, run dev server
make test          # Run all tests
make lint          # Run all linters
make can-release   # CI gate (lint + test)
make ship          # Full deploy pipeline
```

Run `make` to see all available targets.

## Code Conventions

**Directory Structure:**
- `src/` - React SPA (components, pages, lib, store)
- `worker/` - Cloudflare Workers API (routes, usecases, repositories, services)
- `shared/` - Types shared between client and worker
- `migrations/` - D1 SQL migration files
- `analysis/` - Python Jupyter notebook for picks optimization

**Architecture Pattern:**
- Routes (`worker/routes/`) - HTTP handlers with Zod validation
- Use-cases (`worker/usecases/`) - Business logic with injected repositories
- Repositories (`worker/repositories/`) - Data access via interfaces (D1 impl + memory for tests)

**Naming:**
- Test files: `*.test.ts` or `*.test.tsx`
- D1 repository tests: `*.d1.test.ts`
- HTTP tests: `*.http.test.ts`
- Use-case files: `*.usecase.ts`
- Repository interfaces: `worker/repositories/interfaces/`
- Repository D1 impls: `worker/repositories/d1/`

**TypeScript:**
- Strict mode enabled
- No explicit `any` (enforced by ESLint)
- ES2022 target

## Tests & CI

**Test Framework:** Bun's native test runner

**Client Testing Stack:**
- Testing Library (`@testing-library/react`, `@testing-library/user-event`)
- MSW v2 for API mocking (`src/test/mocks/`)
- JSDOM for DOM environment
- Fixtures in `src/test/fixtures.ts`

**Worker Testing Stack:**
- Layered: use-cases (unit) → repositories (D1 integration) → HTTP (e2e)
- In-memory repositories for use-case tests
- Real D1 instances for repository tests
- Fixtures in `worker/test/fixtures/`

**No CI pipeline configured.** Run `make can-release` locally before deploying.

**Zero warnings policy:** ESLint runs with `--max-warnings 0`

## PR & Workflow Rules

**Commit Format:** Conventional Commits
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `refactor:` - Code refactoring

**Branch:** All work on `main` (no PR templates or branch naming conventions enforced)

**Deploy Pipeline:**
```bash
make ship  # typecheck → build → db:migrate:remote → deploy
```

## Security & Gotchas

**Never commit:**
- `.env*` files
- `.wrangler/` directory
- `node_modules/`
- Any API keys or credentials (none required - uses Cloudflare bindings)

**Authentication:**
- Passwords hashed with PBKDF2 (100k iterations, SHA-256)
- Session tokens: 32 random bytes, stored in DB with expiry
- Client stores token in `localStorage` under key `f1_picks_2026_token`

**Input validation:** All API routes use Zod schemas via `@hono/zod-validator`

**Database:** All queries use parameterized `.bind()` calls (no SQL injection)

**Protected routes:**
- `authMiddleware` - Requires valid bearer token
- `adminMiddleware` - Requires `is_admin = true`

**Gotchas:**
- Pick deadline: 10 minutes before qualifying (or sprint qualifying for sprint weekends)
- Wild card races (23-24): drivers can be reused; races 1-22: each driver only once
- Scheduled crons (every 2 hours on Fri/Sat/Sun) sync race results from OpenF1 API
- Python analysis in `analysis/` uses `uv` package manager, not Bun
