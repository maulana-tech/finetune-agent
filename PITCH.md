# Hackathon Pitch Deck — Finetune Agent / uTune AI

> **10 slides · ~16–18 menit · Target: hackathon judges (technical + business)**

---

## Slide 1 — Cover

**Title:** uTune AI
**Tagline:** Find. Analyze. Close. — AI-native B2B sales intelligence for Southeast Asia.
**Visual:** Full-bleed screenshot of the map dashboard — lead pins scattered across an Indonesian city, detail panel open on the right
**Bottom bar:** Team name · Hackathon name · Date · `utune-ai.vercel.app`

---

## Slide 2 — The Problem (Story)

**Headline:** This is how B2B prospecting still works in 2026.

**Narrative:**
> "Meet Raka. He's an SDR at a Jakarta SaaS startup. His Monday task: find 50 dentist clinics across Surabaya to pitch their booking software.
>
> He opens Google Maps. Searches. Scrolls. Copies names, addresses, phone numbers — one by one — into a spreadsheet.
>
> Three hours later: 23 leads, zero idea which ones can afford the product, and a generic email template about to land in every spam folder."

**Visual:** Google Maps + spreadsheet side-by-side ("before" moment)

**Punchline below image:**
> *Sales teams in SEA spend 65% of their day on non-selling work. Raka is not the exception — he's the rule.*

---

## Slide 3 — Problem at Scale

**Headline:** B2B Lead Gen is Manual, Fragmented, and Intelligence-Free

**Three pillars:**

| | Problem | Impact |
|--|---------|--------|
| 📋 | Scrapers give you lists, not intelligence | No idea which leads are worth calling |
| 🗺️ | CRMs are list views — field reps drive blind | Missed territory coverage, wasted visits |
| ✉️ | Generic cold outreach gets <1% reply rate | Pipeline stalls, quota missed |

**4 stats (big numbers):**

| Stat | Source |
|------|--------|
| **65M+** SMBs in Indonesia — the addressable prospect universe | BPS / World Bank |
| **65%** of a rep's day is non-selling work | McKinsey |
| **<1%** average cold email reply rate | Salesforce Research |
| **3–5 hrs/day** lost to manual research & data entry | HubSpot |

---

## Slide 4 — The Pivot Question

**Full-slide, large centered type:**

> **What if every lead came pre-analyzed by a team of AI specialists —**
> **a financial analyst, a market strategist, and a sales advisor —**
> **all working in parallel, in under 10 seconds?**

**Visual:** Arrow from "messy spreadsheet + Google Maps" → "clean map with AI-scored, enriched leads"

---

## Slide 5 — Solution Overview

**Headline:** uTune AI — Map-First B2B Intelligence Platform

**Three pillars (icon + 2-line description each):**

**🔍 Business Finder**
Search by industry + geography. Draw a polygon, pick a category, get hundreds of verified leads with contacts — automatically scraped from Google Maps.

**🗺️ Mapped CRM**
Every lead is a pin. Manage your pipeline geographically — filter by stage, score, or territory. The map is never hidden; it's the product.

**🤖 Multi-Agent AI**
20 specialized AI agents across 3 pipelines — lead scoring, financial simulation, market analysis. Every decision is logged. No black box.

**Flow callout:**
```
search → scrape → enrich → AI analyze → personalized email → visit → close
```

---

## Slide 6 — The AI Engine

**Headline:** Not one AI. A coordinated team of 20 specialists.

**Visual: Three pipeline boxes side by side**

```
┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  LEAD SCORING        │  │  FINANCE SIMULATION   │  │  MARKET ANALYSIS     │
│  (Sequential)        │  │  (Parallel)           │  │  (Parallel)          │
│                      │  │                       │  │                      │
│  1. Extractor        │  │  ┌ Owner   ┐           │  │  ┌ Competitor ┐      │
│       ↓              │  │  ├ Supplier┤ → Synth   │  │  ├ Trend      ┤→Synth│
│  2. Finance          │  │  ├ Customer┤           │  │  ├ Risk       ┤      │
│       ↓              │  │  └ Bank    ┘           │  │  └ Demand     ┘      │
│  3. Marketing        │  │                       │  │                      │
│       ↓              │  │  Cashflow forecast     │  │  Opportunity score   │
│  4. Strategy         │  │  + risk level          │  │  + positioning       │
└─────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

**Plus standalone agents:**
- **SQL Search Agent** — natural language → PostgreSQL (ask your database in Bahasa Indonesia)
- **Smart Sales Agent** — personalized sales strategy per lead
- **Cold Email Agent** — hyper-personalized outreach generated from AI analysis

**Bottom callout:**
> **20 agents · 3 pipelines · Swarm runtime with dynamic handoff · Every step logged to `agent_logs`**
> Models: Llama 3.1 70B (analysis) · Llama 3.1 8B (fast/SQL) via NVIDIA NIM

---

## [LIVE DEMO — 5–7 min]

**Script:**
1. Open dashboard map — lead pins across Jakarta
2. Trigger a new scrape: type "dentists in Surabaya" → show real-time scraping progress
3. Leads populate on the map with pins
4. Click a pin → detail panel opens (name, address, phone, email, WhatsApp, pipeline stage)
5. Open AI Score panel → priority tier A/B/C/D, conversion probability, recommended action
6. Show `agent_logs` reasoning trace — Finance Agent's analysis, Marketing Agent's pain points, Strategy Agent's final call
7. Show AI-generated cold email drafted for that specific business
8. Open AI Query tab → type "semua klinik yang punya email" → AI generates SQL → results table
9. Open Scrape History → show job list with leads found per scrape

---

## Slide 7 — Tech Stack

**Layer diagram:**

```
┌─────────────────────────────────────────────┐
│  FRONTEND                                    │
│  Next.js 15 (App Router) · React 19          │
│  MapLibre GL JS · OpenFreeMap tiles           │
│  Tailwind v4 · Zustand                       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  BACKEND                                     │
│  NestJS 11 — thin REST API (queue bridge)    │
│  BullMQ + Redis — async job orchestration    │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  WORKERS                                     │
│  Python (Playwright) scraper — parallel      │
│  5 BullMQ queues (scrape, score, finance…)   │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  AI LAYER                                    │
│  NVIDIA NIM · Llama 3.1 70B + 8B            │
│  Vercel AI SDK · Custom Swarm runtime        │
│  Sequential + Parallel fan-out pipelines     │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  DATA                                        │
│  Supabase PostgreSQL · Drizzle ORM           │
│  agent_logs · lead_scores · swarm_runs       │
└─────────────────────────────────────────────┘
```

**3 key choices:**
- **MapLibre** → zero Google Maps API cost at scale
- **BullMQ** → scrapes + AI pipelines async, never block the API
- **NVIDIA NIM** → OpenAI-compatible, model-agnostic, fast inference

**Deploy:** Single Docker container · PM2 multi-process · SumoPod PaaS + Vercel

---

## Slide 8 — Business Model + Traction

**Headline:** Built for the Indonesian SMB market. Priced for scale.

### Pricing Tiers

| Tier | Price | Leads/mo | Features |
|------|-------|----------|----------|
| **Free** | Rp 0 | 50 leads | Map view, basic scrape |
| **Growth** | Rp 299k/mo | 500 leads | AI scoring, pipeline CRM, email outreach |
| **Scale** | Rp 999k/mo | Unlimited | All AI pipelines, finance sim, market analysis, API access |

### Early Traction (Hackathon Build)

| Metric | Value |
|--------|-------|
| Leads scraped & enriched | **50+ across 8+ categories** |
| AI agents built & wired | **20 agents, 3 pipelines** |
| Scrape speed (10 leads) | **~45 seconds** (was 5 minutes) |
| Email enrichment | **Parallel, 6× faster** |

### Why Now
> Indonesia has **65M+ SMBs** — yet no local B2B intelligence platform built natively for this market. Apollo.io costs $99/mo in USD, has no Indonesian language support, and zero geographic CRM. We're building the SEA-native version.

---

## Slide 9 — Design System

**Two-column: component gallery left, specs right**

**Typography:**
- `Inter` — dashboard data, UI labels
- `JetBrains Mono` — agent reasoning traces, SQL output, IDs
- `Lora` — editorial headers on marketing landing pages

**Two visual worlds (intentional):**
- **Dashboard** → Brutalist theme. High contrast, no decorative gradients, dense data-forward. The data is the design.
- **Landing page (`/`)** → Sky-gradient cinematic scroll via Lenis. Aspirational, story-driven.

**Map UI principles:**
- The map is never hidden — every interaction happens *on* or *around* it
- Lead pins color-coded by pipeline stage
- Cluster view for dense areas
- Slide-over detail panel — context stays on the map, no page navigation

---

## Slide 10 — CTA + Q&A

**Full slide, minimal, centered:**

```
Try it live:
utune-ai.vercel.app

AI Query demo:
→ "Semua klinik di Jakarta yang punya email"

Built with:
NVIDIA NIM · Next.js · NestJS · MapLibre · Supabase

[Team names]
[QR code to live app]
```

**Tagline:**
> *Find. Analyze. Close. — The AI sales team that never sleeps.*

---

## Timing Guide

| Slide | Content | Duration |
|-------|---------|----------|
| 1 | Cover | 30s |
| 2 | Problem story (Raka) | 2m |
| 3 | Problem at scale (stats) | 1m |
| 4 | Pivot question | 30s |
| 5 | Solution overview | 1.5m |
| 6 | AI engine (20 agents) | 2m |
| — | **Live Demo** | **5–7m** |
| 7 | Tech stack | 1.5m |
| 8 | Business model + traction | 1.5m |
| 9 | Design system | 1m |
| 10 | CTA + Q&A | 30s |
| **Total** | | **~17–19 menit** |

---

## Backup Slides (siapkan jika ada pertanyaan)

### B1 — Agent Detail Table (lengkap)

| Pipeline | Agent | Role |
|----------|-------|------|
| Lead Scoring | Extractor | Structured business profile dari raw data |
| Lead Scoring | Finance Agent | Budget capacity, revenue potential |
| Lead Scoring | Marketing Agent | Pain points, messaging fit, channel |
| Lead Scoring | Strategy Agent | Priority tier A-D + recommended action |
| Finance Sim | Owner Agent | Revenue strategy, margin, growth |
| Finance Sim | Supplier Agent | Supply chain cost, lead time |
| Finance Sim | Customer Agent | Price sensitivity, demand elasticity |
| Finance Sim | Bank Agent | Runway, debt service, credit |
| Finance Sim | Synthesizer | Monthly cashflow forecast + risk level |
| Market Analysis | Competitor Agent | Market share, positioning gaps |
| Market Analysis | Trend Agent | Industry trends, growth vectors |
| Market Analysis | Risk Agent | Entry risks, regulatory flags |
| Market Analysis | Demand Agent | TAM, willingness to pay |
| Market Analysis | Synthesizer | Opportunity score + go-to-market |
| Standalone | Smart Sales | Personalized sales strategy per lead |
| Standalone | Cold Email | Hyper-personalized outreach |
| Standalone | SQL Search | Natural language → PostgreSQL |
| Swarm | Lead Coordinator | Entry point for scoring pipeline |
| Swarm | FinSim Coordinator | Parallel fan-out for finance agents |
| Swarm | Market Coordinator | Parallel fan-out for market agents |

### B2 — Scraper Architecture
- Phase 1: Google Maps parallel card scraping (Playwright headless)
- Phase 2: Website enrichment via ThreadPoolExecutor (6 workers, email + WhatsApp)
- Speed: 10 leads in ~45s (down from ~5 minutes)
- Deduplication: name + workspaceId check before insert

### B3 — Competitive Landscape

| | uTune AI | Apollo.io | HubSpot | Google Maps |
|--|----------|-----------|---------|-------------|
| Geographic CRM | ✅ | ❌ | ❌ | ❌ |
| AI scoring | ✅ | ✅ | ❌ | ❌ |
| Bahasa Indonesia | ✅ | ❌ | ❌ | ✅ |
| Local scraping | ✅ | ❌ | ❌ | ❌ |
| Price (IDR) | 299k/mo | ~1.5jt/mo | ~2jt/mo | API credits |
