# uTune AI — Product Documentation

> B2B Business Finder + Map-first CRM + Multi-Agent AI  
> Built by **Team FTune** for the AI Agent Hackathon 2026

---

## What is uTune AI?

uTune AI is a **B2B lead generation platform** that collapses the entire sales prospecting workflow into one tool. Instead of jumping between Google Maps, a spreadsheet, a CRM, and an email tool — everything happens in one place, on a map, powered by AI.

> "Google Maps + Apollo.io + HubSpot, but mapped and AI-native."

---

## The Problem

B2B prospecting today is fragmented and manual:

- Sales reps scrape Google Maps by hand, copy-pasting into spreadsheets
- Leads get imported into CRMs (HubSpot, Pipedrive) and **lose their geographic context**
- Cold emails are generic because researching each prospect takes hours
- Field reps drive blind — no zone optimization, no route planning
- AI tools exist, but they're black boxes with no reasoning transparency

**The result:** Sales teams waste 60–80% of their time on low-quality leads and manual research.

---

## The Solution

uTune AI gives sales teams one workflow:

```
Search → Enrich → Analyze → Message → Visit → Close
```

All on a map. All powered by AI. All with full reasoning transparency.

---

## Core Features

### 1. Business Finder
Search millions of businesses by industry and location — no manual scraping required.

- Search by **country → region → province → city**, or draw a **custom polygon** on the map
- Multi-keyword support per job (e.g. `dentists, clinics, hospitals`)
- Output in **28+ languages** — results normalized to your chosen locale
- Up to **1,000 leads per job**
- Returns: name, address, phone, website, hours, coordinates, category

**Example:** Draw a polygon around South Jakarta → search "dental clinic" → get 184 verified leads in 12 seconds.

---

### 2. Map-first CRM
Every lead is a pin on a real interactive map.

- Import leads directly from Business Finder to the map
- Filter by: rating (★1–★5), pipeline stage, assigned rep, area, tags, date
- Cluster view in dense areas
- Lead detail panel slides over the map — no context switch
- Pipeline stages fully customizable per workspace
- Direct actions from the map: call, schedule, note, mark stage

---

### 3. Smart Reviews (AI)
Know your prospect before you reach out.

- Pull **10–40 Google reviews per lead** (by plan tier)
- AI summary in your chosen language
- Detects: recurring complaints, owner responsiveness, sentiment patterns
- Sort by: lowest rating, most recent, most relevant
- Output: pain points list, strengths list, opportunity signals

---

### 4. Smart Sales (AI)
Personalized sales intelligence per lead.

- You provide your **business context** (up to 800 chars): e.g. *"We sell appointment-booking software for clinics"*
- For each lead, AI generates: weaknesses, strengths, key indicators, sales opportunities
- Cross-references your product with the lead's real pain points
- Output becomes the foundation for Smart Emails

---

### 5. Smart Emails (AI)
Personalized cold emails written from real pain points — not templates.

- One email per lead, drafted from review-derived insights
- Configurable: goal, tone, CTA, language, length, signature, subject
- Send directly from the CRM (mailbox integration)
- Not bulk email — each email is genuinely personalized

---

### 6. AI Assistant
Chat that has read your entire CRM.

- Ask anything: *"Who has the worst reviews in Yogyakarta?"*
- *"Draft a follow-up for the 5 leads I visited yesterday"*
- *"Which dental clinics in Bandung haven't been contacted yet?"*
- Backed by Llama 3.1 70B via NVIDIA NIM

---

### 7. Smart Territories *(planned)*
- Draw zones on the map, assign to specific reps
- Rep-scoped CRM view — a rep only sees their zone
- Prevent territory overlap

### 8. Smart Routes *(planned)*
- Select N leads → generate optimal multi-stop route
- Driving or walking mode
- One-click export to Google Maps / Waze

### 9. Smart Transcription *(planned)*
- Voice notes → structured field reports
- Auto-linked to the lead the rep was visiting

---

## User Workflow (End-to-End)

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1 — SEARCH                                            │
│  User opens Business Finder                                 │
│  → Selects city or draws polygon on map                     │
│  → Types keyword: "dental clinic"                           │
│  → Sets limit: 200 leads                                    │
│  → Clicks Run                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2 — SCRAPE (background)                               │
│  Python worker (Playwright) scrapes Google Maps             │
│  → Extracts: name, address, phone, website, hours, rating   │
│  → Saves each lead to database                              │
│  → Each lead triggers AI agent queue                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3 — AI ANALYSIS (multi-agent, per lead)               │
│                                                             │
│  [Agent 1] Extractor  → structured business data           │
│  [Agent 2] Finance    → budget probability, company size    │
│  [Agent 3] Marketing  → pain points, messaging fit score    │
│  [Agent 4] Strategy   → priority tier (A/B/C/D), action    │
│                                                             │
│  Each agent passes context to the next.                     │
│  All reasoning logged to database.                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4 — ENRICH                                            │
│  User opens lead in CRM                                     │
│  → Sees AI score (e.g. 85/100, Priority A)                  │
│  → Reads AI reasoning: "High budget probability + strong    │
│    messaging fit — recommend immediate outreach"            │
│  → Pulls Google reviews (Smart Reviews)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5 — MESSAGE                                           │
│  User clicks "Generate Email"                               │
│  → Smart Emails drafts personalized cold email              │
│  → Based on: review pain points + user's business context   │
│  → User edits, approves, sends from CRM                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6 — CLOSE                                             │
│  Lead moves through pipeline stages on the map              │
│  → New → Contacted → Interested → Proposal → Closed        │
│  → Field rep visits, logs voice note → auto-transcribed     │
│  → Manager sees real-time activity feed                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Agent AI Architecture

The core technical innovation is a **4-agent sequential reasoning chain** that runs automatically for every lead.

### Why Multi-Agent?

A single LLM prompt produces generic output. Our system mimics how a real sales team works — each specialist focuses on their domain, then passes findings to the next person.

### The 4 Agents

| # | Agent | Model | Role | Output |
|---|-------|-------|------|--------|
| 1 | **Extractor** | Llama 3.1 8B | Data extraction specialist | Structured business data: name, category, services, contacts |
| 2 | **Finance** | Llama 3.1 70B | Financial analyst | Revenue range, company size, budget probability (0–100), financial health score |
| 3 | **Marketing** | Llama 3.1 70B | Messaging strategist | Target persona, pain points, messaging fit score (0–100) |
| 4 | **Strategy** | Llama 3.1 70B | Strategic advisor (synthesis) | Priority score (0–100), conversion probability, estimated deal value, recommended action |

### Context Passing

Each agent receives all previous agents' outputs:

```
Extractor output
    ↓
Finance receives: { extractedData }
    ↓
Marketing receives: { extractedData, financialAnalysis }
    ↓
Strategy receives: { extractedData, financialAnalysis, marketingInsights }
```

### Reasoning Transparency

Every agent returns explicit reasoning — no black box:

```typescript
{
  output: { priority_score: 85, priority_tier: "A", recommended_action: "immediate_outreach" },
  reasoning: "Finance shows 75% budget probability. Marketing fit score 80%. Category (dental clinic) aligns with our product. Combined signals → Priority A.",
  confidence: 87,
  durationMs: 1240,
  tokensUsed: 892
}
```

All reasoning is persisted to PostgreSQL — fully auditable per lead.

### System Flow Diagram

```
User (Next.js 15)
    │
    ▼ POST /jobs/scrape
API (NestJS 11)
    │
    ▼ push job
Queue (BullMQ + Redis)
    │
    ├──▶ Scrape Worker → Python + Playwright → Google Maps data → DB
    │
    └──▶ AI Worker → Orchestrator → 4 Agents → lead_scores + agent_logs → DB
                                                                            │
                                                                            ▼
                                                              Dashboard (Next.js 15)
                                                              Map + CRM + AI insights
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | React framework, SSR, routing |
| React 19 | UI library |
| Tailwind CSS v4 | Utility-first styling |
| MapLibre GL JS | Interactive map rendering |
| Zustand | Client state management |

### Backend
| Technology | Purpose |
|---|---|
| NestJS 11 | REST API, modular architecture |
| BullMQ + Redis | Async job queue (scrape + AI jobs) |
| Python + Playwright | Google Maps scraper |
| Supabase Auth | Authentication & session management |

### Data & AI
| Technology | Purpose |
|---|---|
| PostgreSQL | Primary database |
| Drizzle ORM | Type-safe schema & migrations |
| NVIDIA NIM | LLM inference (Llama 3.1 8B + 70B) |
| Vercel AI SDK | Structured output generation |

### Infrastructure
| Technology | Purpose |
|---|---|
| pnpm Workspaces | Monorepo package management |
| Turborepo | Build orchestration & caching |
| Docker + PM2 | Single-container deployment |
| TypeScript strict | End-to-end type safety |

### Key Design Decisions

**Queue-first API** — NestJS controllers only validate and enqueue. No long-running work in request handlers. Everything async via BullMQ.

**Full audit trail** — Every AI agent logs reasoning, confidence score, and token usage to PostgreSQL. Full traceability per lead, per execution.

**Typed end-to-end** — Drizzle schema → shared Zod types → NestJS DTOs → React components. One source of truth.

**Sequential orchestration** — Agents run in order because each depends on previous context. Finance must wait for Extractor. Strategy must wait for all three.

---

## Database Schema (Key Tables)

```
workspaces          — Multi-tenant root
users               — Workspace members with roles
leads               — Business records (name, address, lat/lng, rating, etc.)
jobs                — Scrape job runs (query, status, result count)
ai_insights         — AI-generated insights per lead
market_reports      — Market analysis reports
agent_logs          — Full reasoning audit trail (one row per agent per lead)
lead_scores         — Final aggregated AI scores per lead
```

### agent_logs (reasoning transparency)
```sql
execution_id        — Groups all 4 agents in one workflow run
agent_name          — extractor | finance | marketing | strategy
step_number         — 1, 2, 3, 4
reasoning           — Explicit chain-of-thought text
confidence          — 0–100 confidence score
context_from_previous_agent  — What was passed in
context_shared_to_next_agent — What was passed forward
duration_ms         — Execution time
tokens_used         — LLM token consumption
```

### lead_scores (final output)
```sql
quality_score           — 0–100 overall lead quality
conversion_probability  — 0.0–1.0 predicted conversion rate
estimated_value         — USD deal size prediction
priority_tier           — A | B | C | D
financial_health        — From Finance Agent (0–100)
messaging_fit           — From Marketing Agent (0–100)
strategic_alignment     — From Strategy Agent (0–100)
recommended_action      — immediate_outreach | nurture | disqualify
reasoning               — Why this score?
```

---

## Monorepo Structure

```
apps/
  web/          # Next.js 15 — landing page + dashboard + map CRM
  api/          # NestJS 11 — REST API + BullMQ queue bridge
  workers/      # BullMQ workers + Python scraper

packages/
  db/           # Drizzle schema + PostgreSQL client
  shared/       # Zod schemas, env validation, shared types
  ai/           # Multi-agent orchestrator + 4 agent implementations
  ui/           # React component primitives
  typescript-config/  # Strict TypeScript base config
```

### AI Package Structure
```
packages/ai/src/
  orchestrator.ts       — Main workflow coordinator (sequences 4 agents)
  types.ts              — AgentContext, AgentResponse interfaces
  provider.ts           — NVIDIA NIM LLM provider (OpenAI-compatible)
  agents/
    extractor.ts        — Step 1: data extraction (Llama 3.1 8B)
    finance.ts          — Step 2: financial analysis (Llama 3.1 70B)
    marketing.ts        — Step 3: messaging strategy (Llama 3.1 70B)
    strategy.ts         — Step 4: synthesis + final recommendation (Llama 3.1 70B)
```

---

## Target Market

| Persona | Use Case |
|---|---|
| **Field sales rep** | Daily route planning, lead visibility on map, voice-to-report after visits |
| **Inside sales / SDR** | Bulk prospecting by zone, AI-personalized cold emails, review-based pitch prep |
| **Sales manager** | Territory assignment, real-time activity feed, performance ranking |
| **Agency / freelancer** | One-off campaigns — extract 500 dentists in Bali, hand off the list |
| **SMB owner** | Build a verified contact list in their city without hiring sales ops |

**Primary market:** Indonesia + Southeast Asia (local payment rails, Bahasa output, WhatsApp-native enrichment)

---

## Competitive Advantages

| Traditional Tools | uTune AI |
|---|---|
| Scraping tools — data without intelligence | Data + 4-agent AI scoring |
| CRMs — list view, no geography | Map-first, every lead is a pin |
| Generic cold emails | Personalized from real review pain points |
| Single LLM prompt | 4 specialized agents with explicit context passing |
| Black box AI | Full reasoning audit trail in database |
| Separate tools for each step | One workflow: Search → Enrich → Analyze → Close |

---

## Business Metrics Output

Every lead processed by the AI system produces:

| Metric | Range | Business Use |
|---|---|---|
| Lead Quality Score | 0–100 | Prioritize sales outreach |
| Conversion Probability | 0.0–1.0 | Forecast pipeline value |
| Estimated Deal Value | $USD | ROI prediction per lead |
| Priority Tier | A / B / C / D | Automated lead segmentation |
| Recommended Action | immediate_outreach / nurture / disqualify | Actionable next step |

**ROI Example:**
- Before: Sales rep manually researches 100 leads, contacts 50 (50 wasted)
- After: AI scores 100 leads → 15 A-tier (immediate), 30 B-tier (nurture), 55 C/D (skip)
- Result: Rep focuses on 15 A-tier → **3× higher conversion rate, 80% time saved**

---

## The Team

**Team FTune**

| Name | Role |
|---|---|
| Muhammad Maulana Firdaussyah | Lead Developer & Fullstack Engineer |
| Fitri Ayu R | Product Designer |

**Maulana** built the entire technical stack: NestJS API, BullMQ pipeline, Python scraper, multi-agent AI orchestration, Next.js frontend, and MapLibre map integration.

**Fitri** led product vision, UX flow, UI design system, and user research.

---

## Running Locally

```bash
# 1. Clone and install
git clone <repo>
pnpm install

# 2. Set up environment
cp .env.example .env
# Fill: DATABASE_URL, REDIS_URL, NVIDIA_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

# 3. Set up database
pnpm db:generate
pnpm db:migrate

# 4. Start all services
pnpm dev
# Runs: web (3000) + api (3001) + workers (background)

# 5. Test the AI pipeline
curl -X POST http://localhost:3001/jobs/scrape \
  -H "Content-Type: application/json" \
  -d '{"query": "dental clinic", "limit": 5, "workspaceId": "your-workspace-id"}'

# 6. Query reasoning trail
psql $DATABASE_URL -c "
  SELECT step_number, agent_name, reasoning, confidence
  FROM agent_logs
  ORDER BY step_number;
"
```

---

*Last updated: May 2026 — Team FTune*
