# Tech Stack

> Authoritative reference of every library, service, and tool used in this monorepo. Update this when adding/removing a major dependency or platform.

## 1. Monorepo & Build Tooling

| Tool | Version | Purpose |
|---|---|---|
| **pnpm** | 9.15.0 (locked) | Package manager — never use npm/yarn |
| **Turborepo** | latest | Task orchestration (`build`, `lint`, `typecheck`, `test`, `dev`) |
| **TypeScript** | 5.7 | Strict mode across all workspace packages |
| **Docker** | — | Container build for SumoPod deploy |
| **PM2** | — | Process manager inside the SumoPod container (`pm2-runtime`) |

Workspace structure: `apps/*` + `packages/*`. The Cofounder marketing site lives at `apps/web/src/app/(marketing)/` — folded in from the previous standalone `landing/` directory.

## 2. Frontend — `apps/web`

| Layer | Library |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **UI** | React 19 + Tailwind CSS v4 |
| **State** | Zustand (`apps/web/src/features/map/store.ts`) |
| **Map** | MapLibre GL JS + `react-map-gl` + OpenFreeMap tiles |
| **Auth client** | `@supabase/supabase-js` + `@supabase/ssr` (installed, not yet wired) |
| **Icons** | Lucide React |
| **Smooth scroll** | Lenis (marketing pages only, mounted via `(marketing)/layout.tsx`) |
| **DB access** | `@repo/db` directly in server components (Drizzle ORM) |
| **Fonts** | Google Fonts: Inter, JetBrains Mono, Lora (loaded only on marketing routes) |

**Routes:**
- `(marketing)/` → `/`, `/start`
- `(app)/dashboard/` → `/dashboard`, `/dashboard/pipelines`, `/dashboard/reports`, `/dashboard/finance`, `/dashboard/finance/simulations/[id]`, `/dashboard/market`, `/dashboard/market/analyses/[id]`

**Frontend additions:** `@react-pdf/renderer` (lazy-loaded for export PDF on finance page + simulation detail). `papaparse` is server-side only in `apps/api`.

**Dashboard scoping:** `.brutalist` class on `(app)/dashboard/` layout disables gradients globally for the dashboard tree. Marketing pages are unaffected.

## 3. Backend API — `apps/api`

| Layer | Library |
|---|---|
| **Framework** | NestJS 11 |
| **HTTP** | Express (via `@nestjs/platform-express`) |
| **Queue client** | `@nestjs/bullmq` + BullMQ 5 |
| **DB** | drizzle-orm via `@repo/db` |
| **CORS** | env-driven (`ALLOWED_ORIGINS`, `ALLOW_VERCEL_PREVIEWS`) in `main.ts` |

**Modules:** `JobsModule`, `WorkflowsModule`, `FinanceModule`.

**Endpoints:**
- `POST /jobs/scrape`
- `POST /finance/transactions`, `GET /finance/transactions`, `DELETE /finance/transactions/:id`
- `POST /finance/simulations`, `GET /finance/simulations`, `GET /finance/simulations/:id`

## 4. Background Workers — `apps/workers`

| Layer | Tool / Library |
|---|---|
| **Queue worker** | BullMQ 5 + ioredis |
| **Dev runtime** | tsx (watch mode) |
| **Build** | tsc → `dist/` |
| **Python scraper** | venv at `.venv/` + `scrapling` (Playwright-based) |

**6 worker processes started by `apps/workers/src/index.ts`:**

| Worker | Queue | What it does |
|---|---|---|
| `startScrapeWorker` | `scrape-map` | Spawns Python `maps_scraper.py` for Google Maps lead extraction |
| `startOrchestratedAiWorker` | `orchestrated-ai-queue` | Runs lead-scoring 4-agent pipeline |
| `startFinanceSimulationWorker` | `finance-simulation-queue` | Runs finance-sim 5-agent pipeline |
| `startMarketAnalysisWorker` | `market-analysis-queue` | Runs market-analysis 5-agent pipeline |
| `startMarketScrapeWorker` | `market-scrape-queue` | Spawns Python `market_scraper.py` for competitor + trend signals |
| `startAiWorker` | `ai-agent-queue` | Legacy (kept for backward compat) |

## 5. Shared Packages — `packages/`

| Package | Contents |
|---|---|
| **`@repo/db`** | Drizzle ORM + node-postgres + 10 schema files |
| **`@repo/ai`** | Vercel AI SDK + 9 agents + 2 orchestrators + Zod output schemas |
| **`@repo/shared`** | Zod schemas for job payloads + env validation |
| **`@repo/ui`** | cva + clsx + tailwind-merge (mostly empty, not yet adopted) |
| **`@repo/typescript-config`** | Strict TS base, extended by every app |
| **`@repo/eslint-config`** | Empty shell |

## 6. Database — Supabase Postgres

| Component | Detail |
|---|---|
| **DB** | PostgreSQL (Supabase managed) |
| **ORM** | Drizzle ORM (`drizzle-orm/node-postgres` adapter) |
| **Connection** | `pg.Pool` — direct URL for SumoPod (long-running), Transaction Pooler URL for Vercel (serverless) |
| **Migrations** | Drizzle Kit (`pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`) |
| **Column types in use** | uuid v4, text, timestamp, numeric(15,2), date, integer, jsonb, doublePrecision |
| **Enum support** | `pgEnum` (`transaction_type`, `simulation_status`, `simulation_risk_level`) |

**13 tables:**

| Tenant / Identity | Lead pipeline | Lead-scoring AI | Finance | Market |
|---|---|---|---|---|
| workspaces | leads | agent_logs (shared) | transactions | market_data |
| users | jobs | lead_scores | simulations | market_analyses |
|  | ai_insights (legacy) |  |  |  |
|  | market_reports (legacy) |  |  |  |

`agent_logs` is shared across all 3 AI pipelines (nullable `leadId`, `simulationId`, and `marketAnalysisId` FKs).

## 7. AI / LLM — `@repo/ai`

| Component | Detail |
|---|---|
| **Provider** | NVIDIA NIM (OpenAI-compatible) |
| **Base URL** | `https://integrate.api.nvidia.com/v1` |
| **SDK** | Vercel AI SDK (`ai` package, `generateObject`) |
| **Adapter** | `@ai-sdk/openai` (used for NIM compatibility) |
| **Output schemas** | Zod — type-safe structured generation |

**Models:**
- `meta/llama-3.1-70b-instruct` — default for most agents
- `meta/llama-3.1-8b-instruct` — fast, used by Extractor

**14 agents · 3 pipelines:**

| Pipeline | Topology | Agents |
|---|---|---|
| Lead-scoring | Sequential, context-passing | Extractor → Finance → Marketing → Strategy |
| Finance Simulation | Parallel + Synthesizer | (Owner ∥ Supplier ∥ Customer ∥ Bank) → Synthesizer |
| Market Analysis | Parallel + Synthesizer | (Competitor ∥ Trend ∥ Risk ∥ Demand) → Synthesizer |

## 8. Queue & Messaging — Upstash Redis

| Component | Detail |
|---|---|
| **Broker** | Redis (Upstash managed, free tier) |
| **Library** | BullMQ 5 — producer in `apps/api`, consumer in `apps/workers` |
| **Client** | ioredis |

**5 active queues** (+ 1 legacy):
- `scrape-map` — Google Maps lead scraper
- `orchestrated-ai-queue` — lead-scoring multi-agent
- `finance-simulation-queue` — finance multi-agent
- `market-analysis-queue` — market analysis multi-agent
- `market-scrape-queue` — market intelligence scraper
- `ai-agent-queue` (legacy)

## 9. Infrastructure / Deploy

| Layer | Platform | Cost |
|---|---|---|
| **Frontend** | Vercel Hobby | Free (non-commercial / hackathon) |
| **Backend container** | SumoPod | 150K IDR voucher (hackathon) |
| **DB + Auth** | Supabase | Free tier (500MB DB) |
| **Queue** | Upstash Redis | Free tier (10k cmd/day) |
| **LLM inference** | NVIDIA NIM | Free dev quota |
| **Map tiles** | OpenFreeMap | Free public tile server |

See `DEPLOY.md` for the split-deploy walkthrough.

## 10. Dev Tooling

| Tool | Purpose |
|---|---|
| `dotenv-cli` | Load `.env` from repo root in API/workers dev scripts (`dotenv -e ../../.env`) |
| `tsx` | Workers dev runtime + db seed runner |
| `drizzle-kit` | Schema migration generator |
| `prettier` | (Bundled with NestJS scaffolding, optional) |

## What's NOT Yet Implemented

For awareness — do not assume these exist:

- ❌ Tests (Vitest / Playwright / Supertest)
- ❌ GitHub Actions CI
- ❌ NestJS auth guards / `@Public()` decorator
- ❌ `nestjs-zod` for DTO validation
- ❌ `@nestjs/throttler` rate limiting
- ❌ `next-intl` i18n
- ❌ `react-hook-form` (forms use raw `useState`)
- ❌ TanStack Query (fetches use raw `fetch`)
- ❌ PostGIS geometry columns (lat/lng stored as `doublePrecision`)
- ❌ Soft-delete columns
- ❌ Auth wiring (using dummy `DEV_WORKSPACE_ID` constant)
- ❌ Drizzle migrations directory (schema defined but `pnpm db:generate` not run yet)

## TL;DR

**TypeScript everywhere** · **pnpm + Turborepo monorepo** · **Next.js 15 + React 19 + Tailwind v4** (frontend) · **NestJS 11 + BullMQ + Drizzle** (backend) · **NVIDIA NIM via Vercel AI SDK + 9 agents** (AI) · **Supabase Postgres + Upstash Redis + Vercel + SumoPod** (infra) · **Python + scrapling** (scraper).
