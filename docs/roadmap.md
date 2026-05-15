# Hackathon Roadmap

> Hackathon deadline: **early July 2026**. Current date: 2026-05-15. ~6-8 weeks runway.
>
> See `docs/tech-stack.md` for current stack, `DEPLOY.md` for deploy strategy, `CLAUDE.md` for repo conventions.

## Priority Order (recommended)

1. **B — Dev environment setup** first (tight local dev loop, migrations applied, all services start)
2. **C — Seed data** next (so all features have realistic state to demo)
3. **A — CSV import** (multiplier for AI agents — richer data seed = better finance simulation forecasts)
4. **E — Export as PDF** (lightweight polish feature, makes simulations/reports shareable)
5. **D — Market scraper + analysis agents** (biggest feature, build last when foundation is solid)
6. **F — Production deploy** (Vercel + SumoPod, only after demo-ready features are stable)

---

## A · CSV Import for Transactions

**Why:** Manual form-entry doesn't scale for demo. UMKM target users have months of historical data in spreadsheets. CSV import means agents get a **richer data seed → better finance simulation forecasts** — direct multiplier on existing AI features.

**Scope:**

| Layer | Work |
|---|---|
| API | `POST /finance/transactions/import` accepting multipart CSV. Parse server-side via `papaparse` or `csv-parse`. Map rows → `NewTransaction[]`. Bulk insert via Drizzle. |
| Optional async path | If file > 1MB or > 1000 rows: enqueue `csv-import-queue`. New worker `apps/workers/src/queues/csv-import.worker.ts`. Track progress in new `import_jobs` table. |
| Frontend | "Import CSV" button on Finance page → modal with drag-drop → preview first 10 rows + column mapping UI → confirm → POST. Show import result (rows added / rejected). |
| Schema | (Optional) `import_jobs` table: id, workspaceId, status, totalRows, processedRows, errorMessage, createdAt. |

**File touchpoints:**
- `apps/api/src/finance/finance.controller.ts` — new endpoint
- `apps/api/src/finance/finance.service.ts` — CSV parsing + bulk insert
- `apps/web/src/features/finance/ImportTransactionsDialog.tsx` — new component
- `apps/web/src/app/(app)/dashboard/finance/page.tsx` — add Import button

**Time estimate:** 1-2 days

---

## B · Dev Environment Setup

**Why:** Hackathon iteration speed depends on a tight dev loop. Before adding features, make sure: env vars resolved, migrations applied to Supabase dev project, all 3 services start cleanly, hot reload works. Production deploy (Vercel + SumoPod) comes later as item **F**.

**Scope:**

| Step | What |
|---|---|
| 1 | Create Supabase dev project (or reuse existing). Get DATABASE_URL + anon key + URL. |
| 2 | Create Upstash Redis dev DB (free tier). Get REDIS_URL. |
| 3 | Get NVIDIA NIM API key from https://build.nvidia.com (free dev quota). |
| 4 | Copy `.env.example` to `.env` at repo root. Fill in all 5 vars. |
| 5 | Run `pnpm install` from repo root. |
| 6 | Run `pnpm db:generate` to create Drizzle migration SQL from current schema. |
| 7 | Run `pnpm db:migrate` to apply to Supabase dev project. |
| 8 | Run `pnpm dev` and verify all 3 services start: web :3000, api :3001, workers (no port). |
| 9 | Smoke test: open `http://localhost:3000/`, then `/dashboard/finance`, click Add Transaction, click Run Simulation, watch worker logs. |

**Common issues to verify:**
- `pnpm db:generate` creates `packages/db/drizzle/` migrations directory (doesn't exist yet — schema is defined but never generated).
- Python venv at `apps/workers/.venv/` must exist (run `cd apps/workers && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`) — only needed if testing Map scraper locally.
- Browser console: verify `fetch` to `localhost:3001` works (CORS already allows localhost).

**Optional: seed data alongside dev setup** — pairs naturally with item **C**.

**Time estimate:** 2-4 hours, depending on whether Supabase/Upstash accounts exist.

---

## C · Seed Data

**Why:** Empty dashboard = boring demo. Judges decide in the first 60 seconds whether the demo is interesting. Need realistic state across all features.

**Scope:**

| Table | Seed |
|---|---|
| `workspaces` | 1 demo workspace with id = `DEV_WORKSPACE_ID` |
| `transactions` | 30-50 rows spanning last 6 months. Mix of income (Sales Revenue, Service Fee), expense (Payroll, Raw Materials, Marketing, Tax), invoice. Realistic IDR amounts (UMKM scale: 500K-50M per transaction). |
| `simulations` | 2-3 completed simulations with varied scenarios (price hike, hiring expansion, pessimistic market) showing different risk levels |
| `agent_logs` | Auto-populated by simulation runs |
| `leads` | 10-15 leads from different categories (for Map Explorer demo) |

**File touchpoints:**
- `packages/db/src/seed/seed.ts` (file exists, needs filling out)
- Add `pnpm db:seed` script if not already present

**Important:** For simulations to actually have agent_logs + forecast, must either:
- Run real agents against seeded transactions (uses NIM quota — costs tokens)
- Hardcode synthesized output (faster, deterministic, no NIM call needed)

For hackathon: **hardcode 2 simulations, run 1 real one live during demo** for the "wow" moment.

**Time estimate:** 1 day

---

## D · Market Scraper + Market Analysis Multi-Agent Pipeline

**Why:** Differentiator from fiswarm — they have cashflow forecasting but limited external market awareness. Our scraper infrastructure already exists (Google Maps), reusable for market intel.

**Scope:**

### D.1 Market Scraper
- New Python script `apps/workers/src/python/market_scraper.py` (use scrapling)
- Target: competitor pricing, industry news, trending searches, social mentions
- New BullMQ queue `market-scrape-queue`
- New worker `apps/workers/src/queues/market-scrape.worker.ts` (mirror `scrape.worker.ts`)
- New schema `market_data` table: id, workspaceId, source, url, scrapedAt, dataType, payload jsonb

### D.2 Market Analysis Multi-Agent Pipeline (mirror finance-sim pattern)

```
Market data seed →
  ┌─ Competitor Agent  (pricing landscape, positioning)
  ├─ Trend Agent       (industry direction, search demand)  (parallel)
  ├─ Risk Agent        (regulatory, macro, supply chain)
  └─ Demand Agent      (consumer sentiment, search volume)
            ↓
        Synthesizer → market position report + opportunity score
```

- New agents in `packages/ai/src/agents/market-sim/{competitor,trend,risk,demand,synthesizer}.ts`
- New orchestrator `packages/ai/src/market-orchestrator.ts`
- New schema `market_analyses` table
- Reuse `agent_logs` (add nullable `marketAnalysisId` FK)
- New API endpoints under `/market/...`
- New UI route `/dashboard/market` with similar structure as `/dashboard/finance`

**Time estimate:** 4-6 days (largest item — do last)

---

## E · Export as PDF

**Why:** Polish feature. Judges + early users want to **share** simulation results & reports outside the app — email to investors, attach to board update, print for offline review. PDF export turns the in-app pages into portable artifacts.

**Scope (MVP — 1-2 days):**

Export the following pages as PDF:
1. **Simulation Detail** (`/dashboard/finance/simulations/[id]`) — primary target, has the most narrative content (scenario, forecast chart, 5-agent reasoning)
2. **Finance Dashboard summary** — KPIs + monthly chart + latest simulation summary
3. *(Later)* Market Analysis report, once item **D** lands
4. *(Later)* Lead pipeline reports

**Implementation choice — `@react-pdf/renderer` (recommended):**

| Approach | Pro | Con |
|---|---|---|
| **`@react-pdf/renderer`** ✅ recommended | Pure React. Works on Vercel serverless. Type-safe layout. Reusable PDF primitives. Brutalist style transfers cleanly. | ~140KB bundle (lazy-load on demand). Must re-implement layout in PDF primitives (View/Text/Image — no HTML). |
| `window.print()` + print CSS | Zero deps. Reuses existing UI 1:1. | Browser-dependent output. User must pick "Save as PDF" manually. Pagination quirks. |
| Puppeteer / Playwright on server | Pixel-perfect HTML → PDF. | Needs headless browser in container (~300MB). Not Vercel-serverless-friendly. Slow cold start. |

Picked `@react-pdf/renderer` because reusability & quality > 140KB cost.

### E.1 Setup
- Install `@react-pdf/renderer` in `apps/web`
- Lazy-load via dynamic import (only loaded when user clicks Export)

### E.2 PDF document components
Create `apps/web/src/features/finance/pdf/SimulationReportPDF.tsx`:
```tsx
<Document>
  <Page size="A4" style={pageStyle}>
    <Header title={sim.title} createdAt={sim.createdAt} />
    <ScenarioBlock scenario={sim.scenarioParams} />
    <ResultSummary risk={sim.riskLevel} summary={sim.summary} />
    <ForecastTable forecast={sim.cashflowForecast} />
    <AgentReasoningTrace logs={agentLogs} />
    <Footer />
  </Page>
</Document>
```

Plus `apps/web/src/features/finance/pdf/FinanceSummaryPDF.tsx` for the dashboard summary export.

### E.3 Trigger UX
Add **Export PDF** button next to status badge on the simulation detail page:

```tsx
import { pdf } from '@react-pdf/renderer';

async function onExport() {
  const blob = await pdf(<SimulationReportPDF sim={sim} logs={logs} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `simulation-${sim.id.slice(0,8)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
```

100% client-side — no backend, no API hit, no Vercel cost.

### E.4 Styling considerations
- Monochrome (brutalist) → translates well to print
- Charts: re-render forecast as a stripped-down SVG inside `<Svg>` from react-pdf primitives (~50 LOC port)
- Agent reasoning cards → flat View blocks with confidence badge
- Use `font-family: 'Helvetica'` (built-in) or embed a custom font

### E.5 What makes this demo-able
- Click button on simulation detail → file downloads in 1 second
- Open PDF → looks like a real "AI-generated finance report"
- Judges can keep the artifact, share it after the demo

**Time estimate:** 1-2 days (1 day for SimulationReportPDF, 0.5-1 day for FinanceSummaryPDF)

**Out of scope (deferred):** server-side PDF generation, PDF email delivery, scheduled report exports.

---

## F · Production Deploy (Vercel + SumoPod)

**Why:** After demo-ready features are stable, deploy to public URL so judges can poke from their own browser before / after live demo. See `DEPLOY.md` for full walkthrough.

**Steps:**
1. Vercel: connect repo, set root = `apps/web`, env vars (DATABASE_URL pooler, NEXT_PUBLIC_*)
2. SumoPod: connect repo, env vars (DATABASE_URL direct, REDIS_URL, NVIDIA_API_KEY, ALLOWED_ORIGINS)
3. Wire `NEXT_PUBLIC_API_URL` ↔ `ALLOWED_ORIGINS` between platforms
4. Smoke test full flow per `DEPLOY.md` § 3.1

**Time estimate:** Half day if smooth, 1-2 days if integration bugs surface.

---

## File touchpoints summary (new code by feature)

```
A · CSV Import
  apps/api/src/finance/finance.controller.ts    (modify)
  apps/api/src/finance/finance.service.ts       (modify)
  apps/web/src/features/finance/ImportTransactionsDialog.tsx
  apps/workers/src/queues/csv-import.worker.ts  (optional)
  packages/db/src/schema/import_jobs.ts         (optional)

B · Dev Environment Setup
  .env                                          (create from .env.example)
  packages/db/drizzle/                          (auto-generated by pnpm db:generate)

C · Seed Data
  packages/db/src/seed/seed.ts                  (fill out)

D · Market Scraper + Agents
  apps/workers/src/python/market_scraper.py
  apps/workers/src/queues/market-scrape.worker.ts
  packages/ai/src/agents/market-sim/{competitor,trend,risk,demand,synthesizer}.ts
  packages/ai/src/market-orchestrator.ts
  packages/db/src/schema/{market_data,market_analyses}.ts
  apps/api/src/market/{market.module,controller,service}.ts
  apps/web/src/app/(app)/dashboard/market/{page,[id]/page}.tsx
  apps/web/src/features/market/RunMarketAnalysisDialog.tsx

E · Export as PDF
  apps/web/package.json                         (add @react-pdf/renderer)
  apps/web/src/features/finance/pdf/SimulationReportPDF.tsx
  apps/web/src/features/finance/pdf/FinanceSummaryPDF.tsx
  apps/web/src/features/finance/ExportPdfButton.tsx
  apps/web/src/app/(app)/dashboard/finance/simulations/[id]/page.tsx  (add button)
  apps/web/src/app/(app)/dashboard/finance/page.tsx                   (add button)

F · Production Deploy
  (no new code — follow DEPLOY.md)
```

## Agent count after all features land

| Pipeline | Agents | Total |
|---|---|---|
| Lead-scoring (existing) | Extractor, Finance, Marketing, Strategy | 4 |
| Finance Simulation (existing) | Owner, Supplier, Customer, Bank, Synthesizer | 5 |
| Market Analysis (D) | Competitor, Trend, Risk, Demand, Synthesizer | 5 |
| **Total AI agents** | | **14 agents in 3 pipelines** |

(Export as PDF doesn't add agents — it's a deterministic renderer over existing data.)

That's a strong differentiator narrative for the hackathon pitch.
