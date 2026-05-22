# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

B2B business finder and mapped CRM platform. Combines Google Maps-grade lead search with AI-powered sales intelligence and geographic CRM visualization. See `CONTEXT.md` for full product context.

## Architecture

**Monorepo structure** (pnpm workspaces + Turborepo):

```
apps/
  web/          Next.js 15 App Router + MapLibre GL + Zustand
  api/          NestJS 11 REST API + BullMQ queue bridge
  workers/      BullMQ workers + Python scraper (Playwright-based)
packages/
  db/           Drizzle ORM + node-postgres pool
  shared/       Zod schemas, env validation, shared types
  ai/           NVIDIA NIM provider (via Vercel AI SDK)
  ui/           React components (cva + tailwind-merge)
  eslint-config/     (shell package)
  typescript-config/ Strict TypeScript base config
```

**Key architectural decisions:**
- API is a thin queue bridge — controllers validate and push jobs to BullMQ, no long-running work in request handlers
- Workers run in separate process from API, spawn Python scraper via child_process
- All tenant data scoped to `workspaceId` — multi-tenant via single Postgres DB with row-level isolation
- AI agents run in workers, triggered per-lead after scrape jobs complete
- Map uses MapLibre GL JS (OpenFreeMap tiles) to avoid Google Maps API costs at scale

## Commands

**Package manager:** pnpm only (locked to 9.15.0). Never use npm/yarn.

```bash
# Development
pnpm install                # Install all workspace deps
pnpm dev                    # Run all 3 apps concurrently (Turbo)
pnpm dev:web                # Next.js dev server only
pnpm dev:api                # NestJS with watch mode
pnpm dev:workers            # Worker with tsx watch mode

# Build & validation
pnpm build                  # Build all apps (Turbo)
pnpm typecheck              # TypeScript validation across workspaces
pnpm lint                   # ESLint across workspaces

# Database (all via --filter @repo/db)
pnpm db:generate            # Generate Drizzle migrations
pnpm db:migrate             # Apply migrations
pnpm db:studio              # Launch Drizzle Studio
pnpm db:seed                # Run seed script
```

**Pre-commit checklist:** `pnpm typecheck && pnpm lint && pnpm build`

## Environment Setup

1. Copy `.env.example` to `.env` at repo root
2. Required variables:
   - `DATABASE_URL` — Supabase Postgres connection string
   - `REDIS_URL` — Upstash Redis URL (or local Redis)
   - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NVIDIA_API_KEY` — for AI agents

Dev commands for API and workers load `.env` via `dotenv -e ../../.env`.

Env validation schema exists in `packages/shared/src/env.ts` but is not yet wired into app startup.

## Database & Schema

**Stack:** PostgreSQL (Supabase) + Drizzle ORM (`drizzle-orm/node-postgres`)

**Connection:** Pooled via `pg.Pool` in `packages/db/src/index.ts`

**Schema location:** `packages/db/src/schema/`

Current tables:
- `workspaces` — tenant container
- `users` — workspace members with roles
- `leads` — business records (name, address, lat/lng, category, pipeline stage)
- `jobs` — scrape job queue metadata
- `ai_insights` — AI-generated sales analysis per lead
- `lead_scores` — final aggregated scores from lead-scoring pipeline
- `agent_logs` — reasoning trace for all agent pipelines (shared; nullable FKs to leadId/simulationId/marketAnalysisId; `handoffFrom` + `parallelGroup` for swarm observability)
- `simulations` — finance simulation rows (scenarioParams, cashflowForecast, riskLevel, status)
- `transactions` — bookkeeping rows that seed finance simulations
- `market_analyses` — market analysis runs (status enum: pending/running/completed/failed; riskLevel enum: low/medium/high/critical)
- `market_data` — scraped market data points (source enum: google_maps/web_scrape/manual/news_feed/social; type enum tags each record)
- `market_reports` — aggregated market insights
- `swarm_runs` — 1 row per swarm workflow execution (executionId, workflowName, entryAgent, totalSteps, status; nullable FKs to leadId/simulationId/marketAnalysisId)

**Important:** All UUIDs use `uuid().defaultRandom()` (UUID v4). Foreign keys enforce referential integrity. Every tenant table has `workspaceId` column.

**PostGIS note:** Lat/lng currently stored as `doublePrecision` — PostGIS geometry columns not yet implemented.

## AI Layer (Multi-Agent Architecture)

**Provider:** NVIDIA NIM (OpenAI-compatible API) via Vercel AI SDK

**Models:**
- Default: `meta/llama-3.1-70b-instruct` (finance, marketing, strategy)
- Fast: `meta/llama-3.1-8b-instruct` (extractor)

**Three multi-agent pipelines plus a Swarm runtime — all share the `agent_logs` table for reasoning transparency.**

### A. Lead-scoring pipeline — sequential, context-passing

4 agents work in sequence, each receiving the accumulated context from previous steps:

1. **Extractor Agent** → Extracts structured business data
2. **Finance Agent** → Receives extractor context, analyzes financial health
3. **Marketing Agent** → Receives extractor + finance context, determines messaging fit
4. **Strategy Agent** → Synthesizes ALL previous agents, provides final recommendation

Key files:
- `packages/ai/src/orchestrator.ts` — `runMultiAgentWorkflow(input)`
- `packages/ai/src/agents/{extractor,finance,marketing,strategy}.ts`
- `packages/db/src/schema/lead_scores.ts` — final aggregated scores per lead

Workflow:
```
Lead scraped → orchestrated-ai-queue → Orchestrator:
  Step 1: Extractor → Step 2: Finance → Step 3: Marketing → Step 4: Strategy
→ Logs to agent_logs → Writes to lead_scores
```

### B. Finance simulation pipeline — parallel stakeholders + synthesizer

Inspired by fiswarm's swarm-intelligence cashflow forecasting. 4 stakeholder agents run **in parallel** (independent perspectives on the same scenario), then a synthesizer reconciles them into a unified forecast:

```
      ┌── Owner ────┐
      ├── Supplier ─┤  (parallel)
      ├── Customer ─┤
      └── Bank ─────┘
              │
              ▼
         Synthesizer  → cashflow forecast + risk level
```

1. **Owner Agent** — revenue strategy, margin, hiring, growth ambition
2. **Supplier Agent** — supply chain cost pressure, lead time, inventory adequacy
3. **Customer Agent** — price sensitivity, demand elasticity, churn
4. **Bank Agent** — runway, debt service, credit recommendation
5. **Synthesizer** — reconciles all 4 → produces monthly forecast + `risk_level` (low/medium/high/critical)

Why parallel (vs the lead-scoring sequential pattern)? Finance perspectives are independent lenses on the same scenario — they reason better standalone, then the synthesizer reconciles disagreements. Parallel is also ~4× faster.

Key files:
- `packages/ai/src/finance-orchestrator.ts` — `runFinanceSimulation(input)` (Promise.all over 4 stakeholders, then synthesizer)
- `packages/ai/src/agents/finance-sim/{owner,supplier,customer,bank,synthesizer}.ts`
- `packages/ai/src/agents/finance-sim/_shared.ts` — common scenario-block renderer + rules
- `packages/db/src/schema/simulations.ts` — simulation row (scenarioParams, cashflowForecast, riskLevel, status)
- `packages/db/src/schema/transactions.ts` — bookkeeping rows that feed the data seed
- `agent_logs.simulationId` (nullable FK to simulations) — same log table reused for both pipelines

Workflow:
```
User triggers via POST /finance/simulations (NestJS)
→ FinanceService creates simulations row (status=pending)
→ JobsService.queueFinanceSimulation → finance-simulation-queue
→ Worker (apps/workers/src/queues/finance-simulation.worker.ts):
    1. Marks row 'running'
    2. Builds FinanceDataSeed from recent transactions (last N months)
    3. runFinanceSimulation(...)  — 4 parallel + 1 synthesizer
    4. Logs each agent step to agent_logs
    5. Writes monthly forecast + riskLevel back to simulations row, status='completed'
```

API surface (`apps/api/src/finance/finance.controller.ts`):
- `POST /finance/transactions`, `GET /finance/transactions`, `DELETE /finance/transactions/:id`
- `POST /finance/simulations` (triggers run), `GET /finance/simulations`, `GET /finance/simulations/:id` (returns simulation + full agent reasoning trace)

### C. Market Analysis pipeline — parallel perspectives + synthesizer

4 perspective agents run **in parallel**, then a synthesizer produces an opportunity score + positioning recommendation:

```
      ┌── Competitor ─┐
      ├── Trend ──────┤  (parallel)
      ├── Risk ───────┤
      └── Demand ─────┘
              │
              ▼
         Synthesizer  → opportunity score + risk level + positioning
```

Key files:
- `packages/ai/src/market-orchestrator.ts` — `runMarketAnalysis(input)` (Promise.all over 4 agents, then synthesizer)
- `packages/ai/src/agents/market-sim/{competitor,trend,risk,demand,synthesizer}.ts`
- `packages/db/src/schema/market_analyses.ts` — analysis row (scenarioParams, opportunityScore, riskLevel, status)
- `packages/db/src/schema/market_data.ts` — scraped market data that feeds the analysis

API surface (`apps/api/src/market/market.controller.ts`):
- `POST /market/data`, `GET /market/data`, `DELETE /market/data/:id`
- `POST /market/scrape` — triggers market scrape worker
- `POST /market/analyses`, `GET /market/analyses`, `GET /market/analyses/:id`

### D. Swarm runtime — dynamic handoff architecture

`packages/ai/src/swarm/` replaces the three hardcoded orchestrators above. It enables dynamic routing (agents decide who runs next), parallel fan-out, per-agent tool use, and per-agent model selection.

Key abstractions:
- `Swarm` class (`run-loop.ts`) — main execution loop; calls `generateObject`, reads `_handoff`/`_parallel`/`_toolCall` control fields, routes accordingly
- `AgentRegistry` (`registry.ts`) — global registry; agents self-register with name, instructions, Zod schema, handoff targets, tools, and model
- `withHandoff` (`handoff.ts`) — injects `_handoff: { nextAgent, contextToPass, reason } | null` into any Zod schema for routing
- `withToolCall` (`run-loop.ts`) — injects `_toolCall: { toolName, params } | null`; only added when agent declares tools and tool budget not exhausted
- `SwarmContext` (`types.ts`) — shared mutable context (executionId, agentOutputs Map, tokenUsage, iterationCount)

**Routing modes (run-loop handles all three):**
1. **Sequential handoff** — agent emits `_handoff.nextAgent`; run-loop routes there, passing optional `contextToPass`
2. **Parallel fan-out** — coordinator emits `_parallel: { agents, groupKey, nextAfterAll }`; run-loop executes all agents via `Promise.all`, stores results under `groupKey` in accumulated context, then routes to `nextAfterAll`
3. **Tool sub-loop** — agent emits `_toolCall`; run-loop executes the tool, merges result into `_tool_results`, re-runs the agent (up to `agent.maxIterations ?? 3` times), then proceeds

**Observability fields on every step:**
- `handoffFrom` — which agent handed off to this one (enables full trace reconstruction)
- `parallelGroup` — set for agents run inside a parallel fan-out group

Swarm agents live in `packages/ai/src/swarm/agents/*.swarm.ts`. Coordinator agents for parallel workflows:
- `coordinator.swarm.ts` — lead-scoring coordinator (routes to extractor entry)
- `finsim-coordinator.swarm.ts` — emits `_parallel` for `[owner, supplier, customer, bank]`
- `market-coordinator.swarm.ts` — emits `_parallel` for `[competitor, trend, risk, demand]`

Swarm workflows in `packages/ai/src/swarm/workflows/*.workflow.ts`:
- `lead-scoring.workflow.ts` → `runLeadScoringSwarm(input)`
- `finance-simulation.workflow.ts` → `runFinanceSimulationSwarm(input)` — entry: `finsim-coordinator`
- `market-analysis.workflow.ts` → `runMarketAnalysisSwarm(input)` — entry: `market-coordinator`

`MAX_SWARM_ITERATIONS` in `types.ts` guards against infinite loops.

Toggle via `USE_SWARM_AGENTS=true` env var — all 3 workers fall back to legacy orchestrators when unset.

**DB observability (written per-run when swarm is active):**
- `swarm_runs` table — 1 row per workflow run (executionId, workflowName, entryAgent, totalSteps, status, nullable FKs to leadId/simulationId/marketAnalysisId)
- `agent_logs.handoffFrom` — which agent handed off to this one
- `agent_logs.parallelGroup` — set for parallel fan-out agents

See `docs/swarm-ai-plan.md` for full migration plan and multi-model strategy (8B/70B/405B tiers).

See `COMPETITION.md` for the lead-scoring architecture explanation.

## Queue Architecture

**Stack:** BullMQ + Redis (ioredis)

**Queues:**
- `scrape-map` — triggers Python scraper for lead extraction
- `orchestrated-ai-queue` — runs lead-scoring multi-agent pipeline
- `finance-simulation-queue` — runs finance multi-agent simulation pipeline
- `market-analysis-queue` — runs market analysis multi-agent pipeline
- `market-scrape-queue` — triggers market data scraping

**Workers** (`apps/workers/src/queues/`):
- `scrape.worker.ts` — spawns Python scraper, writes leads to DB
- `ai.worker.ts` — runs AI agents per lead, writes `ai_insights`
- `orchestrated-ai.worker.ts` — runs lead-scoring pipeline
- `finance-simulation.worker.ts` — runs finance simulation pipeline
- `market-analysis.worker.ts` — runs market analysis pipeline
- `market-scrape.worker.ts` — runs market data scraping

**Flow:**
1. `POST /jobs/scrape` → API validates + pushes to `scrape-map`
2. Worker spawns Python script (`apps/workers/src/python/maps_scraper.py`) via child_process
3. Scraper writes leads to DB
4. Each lead triggers `ai-agent-queue` job
5. Worker runs AI agents and writes `ai_insights`

**Python setup:** Virtual env at `apps/workers/.venv/` with `scrapling` library. Worker calls `.venv/bin/python` directly.

## Frontend (Next.js)

**Framework:** Next.js 15 App Router, React 19, Tailwind v4

**State:** Zustand for client state (map store at `apps/web/src/features/map/store.ts`)

**Routes:**
- Marketing landing: `/` and `/start` — route group `(marketing)` (Cofounder brand, smooth-scroll via Lenis)
- Dashboard app: `/dashboard`, `/dashboard/pipelines`, `/dashboard/reports`, `/dashboard/finance`, `/dashboard/market` — route group `(app)`

**Map:** MapLibre GL JS (`maplibre-gl` + `react-map-gl` wrapper)

**Auth:** Supabase Auth via `@supabase/supabase-js` + `@supabase/ssr`

## Code Conventions

- **Files:** kebab-case
- **Components:** PascalCase filename matches export name
- **Imports:** node built-ins → external → workspace packages → relative
- **Workspace packages:** Reference as `workspace:*` (e.g., `@repo/db`, `@repo/shared`)
- **No `any`** — use `unknown` and narrow with type guards
- **No default exports** in packages; apps use them where frameworks require (Next.js pages, NestJS modules)
- **No lodash** — use native JS/TS methods
- **No moment** — use native `Intl` for date formatting
- **UI components:** Use `class-variance-authority` + `clsx` + `tailwind-merge` (from `@repo/ui`)

## Deployment (SumoPod PaaS)

Single Docker container runs all 3 apps via PM2 (`ecosystem.config.js`):
- `web` — Next.js on port 3000
- `api` — NestJS on port 3001
- `workers` — BullMQ worker (no port)

Dockerfile installs Node 22 + Python 3 + venv for scraper. See `DEPLOY.md` for platform-specific instructions.

## Not Yet Implemented

**Do not assume these exist:**
- Tests (no Vitest/Playwright/Supertest files)
- GitHub Actions CI
- NestJS auth guards or `@Public()` decorator
- `nestjs-zod` for DTO validation
- `@nestjs/throttler` rate limiting
- `next-intl` i18n
- `react-hook-form`
- TanStack Query
- PostGIS geometry columns
- Soft-delete (`deletedAt` columns)
- Shared ESLint config (package is empty)
- AI provider abstraction methods (`generateText`, `generateStructured`)
- Drizzle migrations directory (not yet generated)
- RSC/CSR separation patterns
- E2E tests

## Common Pitfalls

- When adding a BullMQ queue, register it in **both** NestJS module (`@nestjs/bullmq`) and add worker in `apps/workers/`
- Python scraper path resolved at runtime — don't move `apps/workers/src/python/` without updating worker spawn call
- Workspace package imports must use `exports` map — e.g., `@repo/shared`, `@repo/shared/env`, `@repo/shared/errors` (no deep path imports)
- `.env` loaded from repo root for API/workers — verify `dotenv -e ../../.env` wrapper exists in package.json scripts

## Marketing Landing (Cofounder brand)

The Cofounder marketing site is folded into `apps/web` under the `(marketing)` route group:

- `apps/web/src/app/(marketing)/page.tsx` — home (`/`)
- `apps/web/src/app/(marketing)/start/page.tsx` — `/start` long-form chapter page
- `apps/web/src/app/(marketing)/layout.tsx` — mounts `LenisProvider` and preconnects to Google Fonts (Inter, JetBrains Mono, Lora)
- `apps/web/src/components/landing/` — `HeroScene`, `SkyScene`, `RocketScene`, `TopNav`, `LenisProvider`

`TopNav.tsx` references `/build`, `/sell`, `/scale` which are not yet implemented (404s by design — placeholders for future chapters).

**Styling note:** landing relies heavily on CSS gradients (sky scenes, chapter covers). The dashboard's "ban all gradients" rule from `globals.css` is scoped to the `.brutalist` class, which is applied on the `(app)/dashboard/` wrapper. Do not remove the `brutalist` class on the dashboard layout, and do not re-globalize the gradient ban.

## Related Docs

- `docs/tech-stack.md` — authoritative tech-stack reference (libraries, services, tools by layer)
- `docs/roadmap.md` — hackathon roadmap (5 features A-E with file touchpoints + time estimates)
- `docs/swarm-ai-plan.md` — full Swarm migration plan: multi-model strategy, per-phase implementation steps, risk/mitigation
- `CONTEXT.md` — full product vision and feature roadmap
- `AGENTS.md` — detailed technical guidance for AI agents (overlaps with this file, but includes more granular notes)
- `DEPLOY.md` — Vercel + SumoPod split deploy walkthrough (Indonesian)
