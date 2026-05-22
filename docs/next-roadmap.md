# Next Roadmap — Finetune B2B

> Written: 2026-05-22. Deadline: early July 2026 (~6 weeks).  
> Continuing from where the previous sprint ended. All infrastructure, AI pipelines, and core dashboard UI are done.

---

## What's Already Done

| Area | Status |
|---|---|
| Monorepo (pnpm + Turborepo) | ✅ |
| DB schema — all tables | ✅ |
| Seed data (12 UMKM categories + leads + transactions + simulations) | ✅ |
| Python maps scraper + `maps_url` extraction | ✅ |
| Cron scheduler (node-cron, reads scrape_schedules from DB) | ✅ |
| BullMQ queues (6 queues + workers) | ✅ |
| AI pipelines — Lead scoring, Finance sim, Market analysis | ✅ |
| Swarm runtime (dynamic handoff, parallel fan-out, tool sub-loop) | ✅ |
| SQL search agent (NL → PostgreSQL via 8B model) | ✅ |
| Multi-model tiers (8B fast, 70B standard, claude-sonnet-4-6 heavy) | ✅ |
| CSV import (transactions) | ✅ |
| PDF export (finance simulation + dashboard summary) | ✅ |
| Map Explorer (MapLibre + lead pins from DB) | ✅ |
| LeadsPanel with search (calls `/leads/search`) | ✅ |
| Pipeline kanban (7 stages, drag-free MoveStageButton) | ✅ |
| Finance page (transactions, simulations, PDF) | ✅ |
| Market Analysis page | ✅ |
| Reports page (market analyses + lead count KPIs) | ✅ |
| Scrape Schedules UI (table + run now + pause/resume) | ✅ |
| Scrape Schedules CRUD API | ✅ |

---

## Phase 2A — Core Product Stability
**Timeline: Week 1–2 (by 2026-06-05)**  
Focus: things that make the demo real, not a prototype

---

### 2A-1. Supabase Auth Integration

**Why:** Every page still uses `DEV_WORKSPACE_ID = '00000000-...'` hardcoded. No login = can't demo to real judges with separate sessions. This is the biggest credibility gap.

**Scope:**

| Layer | Work |
|---|---|
| Middleware | `apps/web/src/middleware.ts` — Supabase SSR session check. Redirect unauthenticated to `/login`. Allow `(marketing)` routes through. |
| Login page | `apps/web/src/app/(auth)/login/page.tsx` — Supabase email+password form. Use `@supabase/ssr` `createBrowserClient`. |
| Session provider | `apps/web/src/app/(app)/dashboard/layout.tsx` — pass `workspaceId` from session to all children via context or RSC props. |
| Auth callbacks | `apps/web/src/app/auth/callback/route.ts` — Supabase OAuth callback handler (magic link / OAuth). |
| Replace DEV_WORKSPACE_ID | All API calls → read `workspaceId` from session. All DB queries in server components already use the param. |
| API auth guard | `apps/api/src/main.ts` — add basic bearer token check or use Supabase JWT verification. All controllers already accept `workspaceId` in query/body. |

**File touchpoints:**
- `apps/web/src/middleware.ts` (new)
- `apps/web/src/app/(auth)/login/page.tsx` (new)
- `apps/web/src/app/(auth)/layout.tsx` (new — no sidebar/topbar)
- `apps/web/src/app/auth/callback/route.ts` (new)
- `apps/web/src/lib/workspace.ts` — replace `DEV_WORKSPACE_ID` constant with `getWorkspaceId(session)` helper
- `apps/web/src/app/(app)/dashboard/layout.tsx` — read session, pass workspaceId down

**Auth flow:**
```
User visits /dashboard
  → middleware.ts: no session → redirect /login
  → Login page: email + password → Supabase signIn
  → Supabase callback: set session cookie → redirect /dashboard
  → Dashboard layout: read session → pass workspaceId = user.user_metadata.workspaceId
```

**Workspace provisioning:** On first login, if user has no workspace row, auto-create one and write `workspace_id` into `user_metadata`. Keep it simple — no invite flow yet.

**Time estimate:** 1 day

---

### 2A-2. Lead CRUD — Manual Add / Edit / Delete

**Why:** Scraper is the only way to get leads in. Judges will want to add a test lead manually during demo. Users need to fix bad data from the scraper.

**Scope:**

**Add lead (modal):**
- Button "Add Lead" in LeadsPanel header
- Modal: name, address, category, phone, website — all optional except name
- POST `/leads` → create lead with current workspaceId

**Edit lead (inline in detail view):**
- Edit button in selectedLead detail panel
- Toggle to editable form fields (name, address, phone, website, category, pipeline stage)
- PATCH `/leads/:id`

**Delete lead:**
- Delete button with confirm dialog
- DELETE `/leads/:id`

**File touchpoints:**
- `apps/api/src/leads/leads.controller.ts` — add `POST /`, `PATCH /:id`, `DELETE /:id`
- `apps/api/src/leads/leads.service.ts` — add `create`, `update`, `delete` methods
- `apps/web/src/features/leads/LeadsPanel.tsx` — add "Add Lead" button
- `apps/web/src/features/leads/AddLeadModal.tsx` (new)
- `apps/web/src/features/leads/EditLeadForm.tsx` (new — replaces detail view's static fields)
- `apps/web/src/app/api/leads/route.ts` (new — Next.js API route for POST)
- `apps/web/src/app/api/leads/[id]/route.ts` (new — PATCH + DELETE)

**Time estimate:** 0.5 day

---

### 2A-3. AI Insights Display — Real Data

**Why:** The lead detail panel shows a pulsing skeleton with "NVIDIA Llama 3.1 analyzing..." forever. This is the centerpiece AI feature — it needs to show real data.

**Current state:** `ai_insights` table has `extractedData`, `coldEmail`, `marketReport` jsonb columns. `lead_scores` has `totalScore`, `financialScore`, `marketScore`, `strategyScore`. Workers populate these after scraping.

**Scope:**

In the lead detail view (LeadsPanel.tsx selectedLead panel):

1. **Fetch AI data** on lead selection: `GET /leads/:id/insights` (new endpoint) returns `ai_insights + lead_scores` for that lead.
2. **Insights card** — if data exists, show:
   - Lead score badge (0–100, color-coded by range)
   - Extracted data summary (name, category, size estimate)
   - Market position card (from `marketReport`)
3. **Score breakdown** — `financialScore / marketScore / strategyScore` as three mini-bars
4. **Loading state** — show skeleton only when score is genuinely null (job pending)
5. **"Run AI Analysis" button** — if no score yet, POST to `/workflows/lead-scoring` to trigger on-demand

**File touchpoints:**
- `apps/api/src/leads/leads.controller.ts` — add `GET /:id/insights`
- `apps/api/src/leads/leads.service.ts` — add `getInsights(leadId, workspaceId)`
- `apps/web/src/features/leads/LeadsPanel.tsx` — replace skeleton with real data render
- `apps/web/src/features/leads/LeadInsightsCard.tsx` (new — isolated component for reuse)

**Time estimate:** 0.5 day

---

### 2A-4. Map Filters

**Why:** With 100+ leads on the map, users can't find anything without filters. Category + stage filters are the two most-used (filter by "Coffee Shop" to see all cafes; filter by "Qualified" to plan calls).

**Scope:**

Floating filter bar above the map (or sidebar panel):
- **Category** — multiselect dropdown populated from distinct `category` values in DB
- **Pipeline stage** — multiselect (7 stages)
- **Has email** — toggle (show only leads with emails populated)

Filter state lives in `features/map/store.ts` (Zustand). `MapContainer` and `LeadsPanel` both read from the store and filter clientside (no additional API calls — initial load already fetches all workspace leads).

**File touchpoints:**
- `apps/web/src/features/map/store.ts` — add `filters` slice
- `apps/web/src/features/map/MapFilters.tsx` (new — floating filter bar)
- `apps/web/src/features/map/MapContainer.tsx` — apply filters to markers
- `apps/web/src/features/leads/LeadsPanel.tsx` — apply same filters to list

**Time estimate:** 0.5 day

---

### 2A-5. MapLibre Cluster Layer

**Why:** Jakarta alone has 500+ coffee shops. Individual pins overlap into an unreadable blob. Clusters are standard UX and required for Google Maps-grade credibility.

**Scope:**

Use MapLibre's built-in GeoJSON source with `cluster: true`:
```js
map.addSource('leads', {
  type: 'geojson',
  data: leadsGeoJson,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50,
});
```

Add two layers:
- `clusters` — circle with count label (size scales with point_count)
- `unclustered-point` — individual pin at zoom ≥ 14

Click on cluster → zoom in. Click on individual pin → `setSelectedLeadId`.

**File touchpoints:**
- `apps/web/src/features/map/MapContainer.tsx` — replace individual marker approach with GeoJSON source + layers

**Note:** This replaces the current `MapMarker` component approach. The `MapMarker.tsx` file becomes unused.

**Time estimate:** 0.5 day

---

### 2A-6. Notes & Activity Log on Leads

**Why:** CRM without notes is not a CRM. The schema for activities/notes is not yet in DB. Without this, pipeline stages are just labels with no history.

**Scope (MVP):**

New DB table `lead_notes`:
```
id, leadId, workspaceId, content (text), createdAt
```

UI: in lead detail view, below the AI insights card:
- Notes section — textarea + "Add Note" button
- List of past notes (newest first), each with timestamp
- No edit/delete on notes (append-only is fine for MVP)

**File touchpoints:**
- `packages/db/src/schema/lead_notes.ts` (new)
- `packages/db/src/schema/all.ts` — export
- `apps/api/src/leads/leads.controller.ts` — `POST /:id/notes`, `GET /:id/notes`
- `apps/api/src/leads/leads.service.ts` — `addNote`, `getNotes`
- `apps/web/src/features/leads/LeadNotesPanel.tsx` (new)
- `apps/web/src/features/leads/LeadsPanel.tsx` — mount `LeadNotesPanel` in detail view

**Time estimate:** 0.5 day

---

## Phase 2B — AI Sales Layer
**Timeline: Week 2–3 (by 2026-06-12)**  
Focus: the differentiating AI features that win the hackathon

---

### 2B-1. Smart Sales (AI Analysis per Lead)

**Why:** This is the "wow" moment in the pitch. Given user's business context ("We sell appointment software for clinics"), generate weakness/strength/opportunity analysis *per lead* using that lead's review data + category.

**Current state:** `ai_insights.extractedData` has some raw extracted data. The extractor agent in the pipeline runs but output isn't shown anywhere.

**Scope:**

1. **Business context setting** — workspace-level text field (up to 800 chars). Saved in `workspaces` table (add `businessContext text` column). User sets once in Settings.

2. **Trigger per lead** — "Analyze for My Business" button in lead detail panel. Calls `POST /leads/:id/analyze` with the workspace's `businessContext`.

3. **AI agent** — new agent in `packages/ai/src/agents/smart-sales.ts`:
   - Input: lead data (name, category, reviews, address) + businessContext
   - Output: `{ weaknesses: string[], strengths: string[], opportunities: string[], pitch: string }`
   - Model: 70B standard (not heavy — runs per lead, needs to be cheap)

4. **Display** — results stored in `ai_insights.salesAnalysis` (add jsonb column), shown in lead detail panel with labeled sections.

**File touchpoints:**
- `packages/db/src/schema/workspaces.ts` — add `businessContext text`
- `packages/db/src/schema/ai_insights.ts` — add `salesAnalysis jsonb`
- `packages/ai/src/agents/smart-sales.ts` (new)
- `packages/ai/src/index.ts` — export
- `apps/api/src/leads/leads.controller.ts` — `POST /:id/analyze`
- `apps/api/src/leads/leads.service.ts` — `analyzeForBusiness`
- `apps/web/src/features/leads/SmartSalesCard.tsx` (new)
- `apps/web/src/app/(app)/dashboard/settings/page.tsx` — add business context textarea

**Time estimate:** 1 day

---

### 2B-2. Smart Emails (Cold Email Generation)

**Why:** Personalized cold emails are the direct monetizable output. Judges see this → "ok this is actually useful, not just a demo."

**Current state:** `ai_insights.coldEmail` column exists but is never populated from the UI. The orchestrator pipeline runs but the email content goes nowhere useful.

**Scope:**

1. **"Generate Email" button** in lead detail panel
2. **API endpoint** `POST /leads/:id/email` — runs cold email agent, saves to `ai_insights.coldEmail`
3. **Email agent** in `packages/ai/src/agents/cold-email.ts`:
   - Input: lead data + salesAnalysis (if exists) + businessContext
   - Output: `{ subject: string, body: string, tone: string }`
4. **Display** — modal overlay showing generated email with:
   - Subject + body, pre-formatted
   - "Copy" button
   - "Regenerate" button (reruns agent)
   - (Future: "Send" via Postmark/Resend)

**File touchpoints:**
- `packages/ai/src/agents/cold-email.ts` (new)
- `packages/ai/src/index.ts` — export
- `apps/api/src/leads/leads.controller.ts` — `POST /:id/email`
- `apps/web/src/features/leads/GenerateEmailModal.tsx` (new)
- `apps/web/src/features/leads/LeadsPanel.tsx` — wire "Generate Outreach Draft" button (currently a stub)

**Time estimate:** 0.5 day

---

### 2B-3. AI Assistant (Chat with CRM)

**Why:** "Talk to your CRM" is the MCP-adjacent feature that gets the hackathon crowd excited. "How many leads do I have in Jakarta Selatan with no email?" → instant answer. Differentiator: most CRMs don't have this.

**Architecture:**

```
User types query
  → POST /assistant/chat { message, workspaceId, history[] }
  → AssistantService:
      1. SQL Agent (8B) → generate SELECT scoped to workspaceId
      2. Execute query → get results
      3. Summary Agent (70B) → format results as natural language
  → Stream response back to client via SSE or return JSON
```

Re-use `generateLeadsSearchSql` from `@repo/ai` for step 1. Step 3 is a simple `generateText` call.

**Scope:**

- New API module `apps/api/src/assistant/`
- Endpoint: `POST /assistant/chat`
- New UI: chat panel accessible from Sidebar as "AI Assistant" (or floating button on every page)
- Chat history kept in React state (no DB persistence for MVP — session-only)
- Streaming response if time allows; JSON is fine for MVP

**File touchpoints:**
- `apps/api/src/assistant/assistant.module.ts` (new)
- `apps/api/src/assistant/assistant.controller.ts` (new) — `POST /chat`
- `apps/api/src/assistant/assistant.service.ts` (new)
- `apps/api/src/app.module.ts` — import AssistantModule
- `apps/web/src/features/assistant/ChatPanel.tsx` (new)
- `apps/web/src/app/(app)/dashboard/assistant/page.tsx` (new)
- `apps/web/src/components/layout/Sidebar.tsx` — add "AI Assistant" link with Bot icon

**Time estimate:** 1 day

---

### 2B-4. Lead Score Leaderboard

**Why:** `lead_scores` table exists and is populated by the swarm pipeline. No UI shows this data. A simple sorted list of top-scored leads gives users an immediate "who to call today" answer.

**Scope:**

- New page `apps/web/src/app/(app)/dashboard/pipelines/page.tsx` extension, or new tab in LeadsPanel:
  - Table sorted by `totalScore DESC`
  - Columns: rank, name, score badge (color-coded), financialScore, marketScore, strategyScore, category, pipeline stage
  - Click row → open lead detail panel

Alternatively: floating leaderboard icon in LeadsPanel that toggles between list view and score view.

**File touchpoints:**
- `apps/api/src/leads/leads.controller.ts` — `GET /leads/scores?workspaceId=`
- `apps/api/src/leads/leads.service.ts` — join leads + lead_scores, sort by totalScore
- `apps/web/src/features/leads/LeadScoreView.tsx` (new)
- `apps/web/src/features/leads/LeadsPanel.tsx` — toggle between list / score view

**Time estimate:** 0.5 day

---

## Phase 2C — Business Finder Enhancement
**Timeline: Week 3–4 (by 2026-06-19)**  
Focus: making the core search/import workflow production-grade

---

### 2C-1. Polygon Search — Draw Area on Map

**Why:** Vonsel's biggest differentiator is "search within drawn polygon." Without it, users must type area names manually. With it, they draw a circle around their territory and say "find all dentists here."

**Scope:**

MapLibre draw tool (`@mapbox/mapbox-gl-draw` adapted for MapLibre, or `maplibre-gl-draw`):
- Toolbar with polygon/rectangle/circle mode
- On complete: extract bounding box (for scraper — PostGIS not yet live) or polygon coords
- Trigger scrape job with `bbox` payload
- POST `/jobs/scrape` extended: accept `{ bbox: { north, south, east, west }, query, limit }`
- Python scraper: pass bbox as location constraint to Google Maps search

**File touchpoints:**
- `apps/web/src/features/map/MapDrawTool.tsx` (new)
- `apps/web/src/features/map/MapContainer.tsx` — mount draw tool
- `packages/shared/src/jobs.ts` — add `bbox` to `ScrapeJobPayloadSchema`
- `apps/workers/src/python/maps_scraper.py` — accept bbox param
- `apps/workers/src/queues/scrape.worker.ts` — pass bbox to Python

**Time estimate:** 1 day

---

### 2C-2. Smart Reviews — Pull & Summarize Google Reviews

**Why:** Reviews are the raw material for Smart Sales and Cold Emails. Real reviews = real insights. Currently the scraper doesn't pull reviews.

**Scope:**

1. Extend `maps_scraper.py` to optionally pull N reviews per business (flag `--reviews 10`)
2. New DB table `lead_reviews`: `id, leadId, rating, text, author, date, replied`
3. New agent `packages/ai/src/agents/review-summary.ts` — summarizes reviews, detects recurring complaints, sentiment
4. Store output in `ai_insights.reviewSummary` (add column)
5. Display in lead detail panel: star distribution, AI summary card, top complaints list

**File touchpoints:**
- `packages/db/src/schema/lead_reviews.ts` (new)
- `packages/db/src/schema/ai_insights.ts` — add `reviewSummary jsonb`
- `apps/workers/src/python/maps_scraper.py` — `--reviews` flag
- `apps/workers/src/queues/scrape.worker.ts` — pass reviews to DB
- `packages/ai/src/agents/review-summary.ts` (new)
- `apps/web/src/features/leads/ReviewSummaryCard.tsx` (new)

**Time estimate:** 1.5 days

---

### 2C-3. Lead Deduplication

**Why:** Scraper running on the same city twice creates duplicate leads. DB currently has no unique constraint on (workspaceId, name, address).

**Scope:**

- Add `UNIQUE (workspace_id, name, address)` constraint to `leads` table (via DB push)
- In scrape worker: use `ON CONFLICT (workspace_id, name, address) DO UPDATE SET updated_at = NOW()` (upsert pattern with Drizzle `onConflictDoUpdate`)
- Show "Updated N existing / Added M new" in schedule status

**File touchpoints:**
- `packages/db/src/schema/leads.ts` — add `uniqueIndex`
- `apps/workers/src/queues/scrape.worker.ts` — switch to upsert

**Time estimate:** 0.5 day

---

### 2C-4. Lead Import from CSV (Leads, not Transactions)

**Why:** Users have existing lead lists in Excel/CSV from their own research. Need a way to bulk-import these as leads (different from the transaction CSV import already built).

**Scope:**

- Modal: "Import Leads CSV" button in LeadsPanel header
- Accept columns: name (required), address, phone, website, category, email (→ emails array)
- Preview 10 rows + column mapping UI (same UX pattern as `ImportTransactionsDialog`)
- POST `/leads/import` with CSV
- Map to `NewLead[]`, bulk insert with upsert (dedup by name+address)

**File touchpoints:**
- `apps/api/src/leads/leads.controller.ts` — `POST /import`
- `apps/api/src/leads/leads.service.ts` — `importCsv`
- `apps/web/src/features/leads/ImportLeadsDialog.tsx` (new — mirrors `ImportTransactionsDialog`)
- `apps/web/src/features/leads/LeadsPanel.tsx` — add Import button

**Time estimate:** 0.5 day

---

## Phase 3 — Team & Monetization
**Timeline: Week 4–5 (by 2026-06-26)**  
Focus: multi-user features + billing foundation

---

### 3-1. Smart Routes

**Why:** Field reps need to optimize visit order. "I have 8 leads in Bandung today — give me the shortest route" is a daily use case. Maps.co or OpenRouteService API is free tier viable.

**Scope:**

- Route builder UI: select N leads from LeadsPanel by checkbox → "Build Route" button
- POST `/routes/optimize` → call OpenRouteService (or OSRM self-hosted) with lead lat/lngs
- Return ordered waypoints
- Display on map as a line layer + numbered pins
- Export button: opens Google Maps with waypoints URL

**File touchpoints:**
- `packages/db/src/schema/routes.ts` (new)
- `apps/api/src/routes/` (new module)
- `apps/web/src/features/routes/RouteBuilder.tsx` (new)
- `apps/web/src/features/map/MapContainer.tsx` — route line layer

**Time estimate:** 1.5 days

---

### 3-2. Territory Zones

**Why:** Managers assign specific zones to reps. Prevents overlap, enables accountability.

**Scope:**

- Draw polygon on map → name it → assign to user
- Store in `areas` table: `id, workspaceId, userId, name, polygon jsonb, color`
- Display as semi-transparent polygon overlays on map
- Filter leads by zone (spatial containment — simple bbox check without PostGIS for now)

**File touchpoints:**
- `packages/db/src/schema/areas.ts` (new)
- `apps/api/src/areas/` (new module)
- `apps/web/src/features/map/TerritoryLayer.tsx` (new)

**Time estimate:** 1 day

---

### 3-3. Team Management (Invite, Roles)

**Why:** Workspace currently has no real users — just one hardcoded user. For demo: show that a manager can invite a rep.

**Scope (MVP):**
- Invite by email → Supabase Auth invite
- Roles: `owner`, `manager`, `rep`
- Reps see only leads assigned to them (filter by `assignedRep` column — add to leads schema)
- `users` table already exists

**File touchpoints:**
- `packages/db/src/schema/leads.ts` — add `assignedRepId uuid` FK to users
- `apps/api/src/workspace/` (new module — invite, list members, update role)
- `apps/web/src/app/(app)/dashboard/settings/page.tsx` — team management section

**Time estimate:** 1 day

---

### 3-4. Billing — Stripe + Midtrans

**Why:** Without billing, the product isn't a business. MVP needs one payable plan (Starter) to demo to investors.

**Scope:**

- Stripe for USD customers (international)
- Midtrans for IDR customers (Indonesia)
- New `subscriptions` table: `workspaceId, plan, status, stripeCustomerId, stripeSubId, currentPeriodEnd`
- Plan limits enforced: lead cap, scrape job limit
- Upgrade modal when user hits plan limit
- Webhook handlers: `customer.subscription.updated`, `invoice.payment_failed`

**This is the most complex item in Phase 3. Do last.**

**File touchpoints:**
- `packages/db/src/schema/subscriptions.ts` (new)
- `apps/api/src/billing/` (new module)
- `apps/web/src/app/(app)/dashboard/settings/billing/page.tsx` (new)
- `apps/web/src/features/billing/UpgradeModal.tsx` (new)

**Time estimate:** 2–3 days

---

## Phase 4 — Field Ops & Advanced
**Timeline: Week 5–6 (by 2026-07-03)**  
These are differentiators if time allows. Not blocking for hackathon demo.

---

### 4-1. MCP Server Exposure

**Why:** "Indonesia's first MCP-native CRM" — from CONTEXT.md. Plugging this into Claude/Cursor would let agencies query their lead database conversationally without opening the browser. Strong demo angle.

**Scope:**

- `apps/mcp/` new app (or add to `apps/api/src/mcp/`)
- Expose tools: `search_leads(q, workspaceId)`, `get_lead(id)`, `update_pipeline_stage(id, stage)`, `add_note(id, content)`
- Use MCP SDK (Anthropic official)
- Auth via API key (not Supabase session — MCP clients use API keys)

**File touchpoints:**
- `apps/mcp/` (new app or `apps/api/src/mcp/`)
- `CLAUDE.md` — document MCP server URL

**Time estimate:** 1 day

---

### 4-2. WhatsApp Enrichment

**Why:** CONTEXT.md identifies WhatsApp numbers as a first-class differentiator for SEA market.

**Scope:**

- Add `whatsapp text` to leads schema
- Enrich via scraping: check if `phone` is a registered WA number (use whapi.cloud or WA Business API)
- Display "Open in WhatsApp" link in lead detail panel

**Time estimate:** 1 day (depends on API access)

---

### 4-3. Voice Transcription

**Why:** Field reps dictate notes after a visit. Whisper-powered transcription → structured note auto-linked to lead.

**Scope:**

- Record button in lead detail panel (browser MediaRecorder API)
- Upload audio blob → POST `/leads/:id/transcribe`
- Server: OpenAI Whisper API → text → save as note
- Display transcription in notes section

**Time estimate:** 1 day

---

### 4-4. PostGIS Migration

**Why:** All geo queries currently use bounding boxes with lat/lng doubles. PostGIS enables: proper radius search, polygon containment, distance queries, nearest-neighbor.

**Scope:**

- Enable PostGIS extension on Supabase: `CREATE EXTENSION postgis`
- Add `geom geometry(Point, 4326)` column to leads
- Migrate existing lat/lng to `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`
- New query: `ST_DWithin(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :meters)` for radius search

**File touchpoints:**
- `packages/db/src/schema/leads.ts` — add geometry column
- `apps/workers/src/queues/scrape.worker.ts` — populate geom on insert
- `apps/api/src/leads/leads.service.ts` — use ST_DWithin for location queries

**Time estimate:** 1 day

---

### 4-5. Smart Calendar

**Why:** Schedule visits from within the CRM. Events auto-linked to leads.

**Scope:** Google Calendar OAuth + event creation. Not blocking for hackathon — defer to post-launch.

---

## Production Deploy (F)

Previously deferred by user request. Do this when demo features are stable.

**Steps:**
1. Vercel: connect `apps/web`, env vars (`DATABASE_URL` pooler, `NEXT_PUBLIC_*`)
2. SumoPod: connect repo, env vars (`DATABASE_URL` direct, `REDIS_URL`, `NVIDIA_API_KEY`, `ALLOWED_ORIGINS`)
3. Wire `NEXT_PUBLIC_API_URL` ↔ SumoPod URL in both dashboards
4. Smoke test: full scrape → AI → map flow

**Estimate:** Half day if smooth.

---

## Priority Order for Hackathon (6 weeks)

```
Week 1   2A-1 Auth + 2A-2 Lead CRUD + 2A-3 AI Insights display
Week 2   2A-4 Map filters + 2A-5 Cluster + 2A-6 Notes + 2B-1 Smart Sales
Week 3   2B-2 Cold emails + 2B-3 AI Assistant + 2B-4 Leaderboard
Week 4   2C-1 Polygon search + 2C-3 Dedup + 2C-4 Lead CSV import
Week 5   3-1 Smart Routes + 3-3 Team management + Deploy (F)
Week 6   4-1 MCP Server + 2C-2 Smart Reviews + polish/buffer
```

**Billing (3-4) and PostGIS (4-4)** — only if timeline permits. Not required for hackathon demo.

---

## Demo Script (target state at end of sprint)

1. **Login** with email+password → workspace loads with real leads on map
2. **Filter by category** "Coffee Shop" → 30+ pins appear in Jakarta area
3. **Click a lead** → detail panel shows address, phone, Maps link, AI score badge, notes
4. **Smart Sales** → click "Analyze for My Business" → AI returns weaknesses/opportunities in 3s
5. **Generate Email** → AI writes personalized cold email → copy to clipboard
6. **Move to Pipeline** → drag to "Qualified" stage → shows in kanban
7. **AI Assistant** → type "Which leads have the highest score in Kemang?" → instant answer
8. **Finance Simulation** → runs 5-agent cashflow forecast → download PDF report
9. **Market Analysis** → 4-agent analysis → opportunity score + risk level
10. **Scrape Schedule** → add new category, set interval → cron picks it up

That's a 10-minute demo that covers 14 AI agents, geo CRM, and autonomous scraping.

---

## File Count Summary (new code needed)

| Phase | New files | Modified files |
|---|---|---|
| 2A Auth | 4 new | 3 modified |
| 2A Lead CRUD | 4 new | 2 modified |
| 2A AI Insights | 2 new | 2 modified |
| 2A Map filters | 2 new | 2 modified |
| 2A Cluster | 0 new | 1 modified |
| 2A Notes | 3 new | 2 modified |
| 2B Smart Sales | 4 new | 4 modified |
| 2B Cold Email | 3 new | 2 modified |
| 2B AI Assistant | 5 new | 2 modified |
| 2B Leaderboard | 2 new | 2 modified |
| 2C Polygon search | 3 new | 3 modified |
| 2C Smart Reviews | 5 new | 3 modified |
| 2C Dedup | 0 new | 2 modified |
| 2C Lead CSV import | 2 new | 2 modified |
| 3 Routes | 4 new | 1 modified |
| 3 Territories | 3 new | 1 modified |
| 3 Team mgmt | 3 new | 1 modified |
| 3 Billing | 5 new | 1 modified |
| 4 MCP | 3 new | 1 modified |
| **Total** | **~57 new** | **~35 modified** |
