# Hackathon Pitch Deck — Finetune Agent

---

## Slide 1 — Cover Slide

**Title:** Finetune Agent
**Tagline:** Find. Analyze. Close. — AI-native B2B sales intelligence, built for Southeast Asia.
**Visual:** Full-bleed screenshot of the map dashboard with lead pins scattered across an Indonesian city
**Bottom bar:** Team name · Hackathon name · Date

---

## Slide 2 — Personal Anecdote / Introduce the Problem

**Narrative (story format):**
> "Meet Raka. He's an SDR at a Jakarta SaaS startup. His Monday task: find 50 dentist clinics across Surabaya to pitch their booking software. He opens Google Maps. Searches. Scrolls. Copies names, addresses, and phone numbers one by one into a spreadsheet. Three hours later — 23 leads, zero idea which ones can afford the product, and a generic email template that will land in every spam folder."

**Visual suggestions:**
- Screenshot of Google Maps + spreadsheet side-by-side (a "before" moment)
- OR a photo/illustration of a field rep in a car with a clipboard and phone
- News article angle: "Indonesian SMBs lose billions yearly due to poor sales targeting"

**One-liner below the image:**
*This is how B2B prospecting still works in 2026 across Southeast Asia.*

---

## Slide 3 — Problem Statement

**Headline:** B2B Lead Generation is Manual, Fragmented, and Intelligence-Free

**Three problem pillars (icon + one line each):**

| Icon | Problem |
|------|---------|
| 📋 | Data without intelligence — scrapers give you lists, not insight |
| 🗺️ | CRMs without geography — Pipedrive/HubSpot are list views; field reps drive blind |
| ✉️ | Outreach without personalization — generic cold emails get <1% reply rate |

**One synthesizing statement at bottom:**
> Sales teams waste 65% of their time on non-selling activities — researching, data-entering, and guessing which leads are worth chasing.

---

## Slide 4 — Statistics / Research Validating the Problem

**Layout:** 4 big-number stat cards + 1 supporting quote

| Stat | Source |
|------|--------|
| **65M+** SMBs in Indonesia alone — the addressable prospect universe | BPS / World Bank |
| **65%** of a sales rep's day is non-selling work | McKinsey State of Sales |
| **<1%** average reply rate on generic cold email | Salesforce Research |
| **3–5 hrs** per day spent on manual prospect research & data entry | HubSpot Sales Report |

**Supporting quote (blockquote style):**
> *"The biggest problem isn't finding leads — it's knowing which ones are worth calling."*
> — Common pain from 12 discovery interviews with SEA SDRs

---

## Slide 5 — The Pivot Question

**Full-slide, centered, large type:**

> **What if every lead came pre-analyzed by a team of AI specialists — a financial analyst, a marketing strategist, and a sales advisor — all collaborating in under 10 seconds?**

**Visual:** Animated arrow from "messy Google Maps + spreadsheet" → "clean map with scored, AI-enriched leads"

---

## Slide 6 — Showcase the Solution

**Headline:** Finetune Agent — Map-First B2B Intelligence Platform

**Three-pillar layout:**

**1. Business Finder**
Search millions of companies by industry + geography. Draw a polygon on a map, pick a category, get 1,000 verified leads — instantly.

**2. Mapped CRM**
Every lead is a pin. Manage your pipeline geographically — assign territories, plan routes, filter by stage or rating. No more list-view blindness.

**3. Multi-Agent AI — 20 Specialized AI Agents**
Three distinct pipelines, one unified Swarm runtime. Every agent decision is logged to `agent_logs` — full reasoning transparency, no black box.

**Callout box:**
> `search → enrich → analyze → message → visit → close` — all on one map.

---

## Slide 6.5 — The AI Engine: 20 Agents Across 3 Pipelines

**Headline:** Not one AI. A full team of specialists — orchestrated, logged, observable.

---

### Pipeline A — Lead Scoring (Sequential, 4 steps)
*Each agent receives the accumulated context of all previous agents.*

| # | Agent | Role |
|---|-------|------|
| 1 | **Extractor** | Parses raw scraped data → structured business profile (name, category, size signals) |
| 2 | **Finance Agent** | Estimates budget capacity, cash health, revenue potential |
| 3 | **Marketing Agent** | Identifies pain points, messaging fit, channel recommendations |
| 4 | **Strategy Agent** | Synthesizes all 3 → priority tier (A/B/C/D) + conversion probability + recommended action |

```
Lead scraped → Extractor → Finance → Marketing → Strategy → lead_scores table
```

---

### Pipeline B — Finance Simulation (Parallel fan-out, 5 agents)
*4 stakeholder perspectives run concurrently, then a synthesizer reconciles disagreements.*

| Agent | Perspective |
|-------|------------|
| **Owner Agent** | Revenue strategy, margin targets, hiring, growth |
| **Supplier Agent** | Supply chain cost pressure, lead time, inventory |
| **Customer Agent** | Price sensitivity, demand elasticity, churn risk |
| **Bank Agent** | Runway analysis, debt service, credit recommendation |
| **Synthesizer** | Reconciles all 4 → monthly cashflow forecast + risk level (low/medium/high/critical) |

```
          ┌── Owner ────┐
          ├── Supplier ─┤  (parallel, ~4× faster)
          ├── Customer ─┤
          └── Bank ─────┘
                  │
             Synthesizer  → cashflow forecast
```

---

### Pipeline C — Market Analysis (Parallel fan-out, 5 agents)
*4 market lenses run concurrently, synthesizer produces opportunity score + positioning.*

| Agent | Lens |
|-------|------|
| **Competitor Agent** | Competitor mapping, market share, positioning gaps |
| **Trend Agent** | Industry trends, seasonal patterns, growth vectors |
| **Risk Agent** | Market entry risks, regulatory flags, threat signals |
| **Demand Agent** | Demand elasticity, customer willingness to pay, TAM |
| **Synthesizer** | → opportunity score + risk level + go-to-market positioning |

---

### Standalone Agents

| Agent | Purpose |
|-------|---------|
| **Smart Sales Agent** | Personalized sales strategy recommendations per lead |
| **Cold Email Agent** | Generates hyper-personalized cold outreach based on AI analysis |
| **SQL Search Agent** | Translates natural language → PostgreSQL SELECT (Llama 3.1 8B, fast) |

---

### Swarm Runtime (Dynamic Orchestration Layer)
*Replaces hardcoded orchestrators with a dynamic handoff architecture.*

| Component | Role |
|-----------|------|
| **Lead Scoring Coordinator** | Entry point for Pipeline A, routes to Extractor |
| **FinSim Coordinator** | Emits parallel fan-out for `[Owner, Supplier, Customer, Bank]` |
| **Market Coordinator** | Emits parallel fan-out for `[Competitor, Trend, Risk, Demand]` |
| **Swarm Run-loop** | Handles sequential handoff, parallel fan-out, and tool sub-loops |

**Models:** Llama 3.1 70B (analysis agents) · Llama 3.1 8B (fast extraction, SQL)
**Observability:** Every agent step → `agent_logs` table with `handoffFrom`, `parallelGroup`, reasoning trace

> **Total: 20 AI agents · 3 pipelines · 1 Swarm runtime · 5 async BullMQ queues**

---

## [LIVE DEMO]

**Demo flow script:**
1. Open dashboard map — show leads as pins across Jakarta
2. Trigger a new Business Finder search ("dentists in Surabaya")
3. Show leads populating on the map in real-time
4. Click a lead pin → detail panel slides open (name, address, reviews, pipeline stage)
5. Show AI score panel — priority tier A/B/C/D, conversion probability, recommended action
6. Open agent_logs trace — show Finance Agent's reasoning, Marketing Agent's pain points, Strategy Agent's final call
7. Show AI-generated personalized cold email drafted for that specific lead

---

## Slide 7 — Tech Stack

**Layout:** Layer diagram (top → bottom)

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
│  Python (Scrapling/Playwright) scraper       │
│  Node.js BullMQ workers                      │
│  5 AI queues (lead-score, finance, market…)  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  AI LAYER                                    │
│  NVIDIA NIM (Llama 3.1 70B + 8B)            │
│  Vercel AI SDK · Custom Swarm runtime        │
│  Sequential + Parallel agent pipelines       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  DATA                                        │
│  Supabase PostgreSQL · Drizzle ORM           │
│  agent_logs · lead_scores · swarm_runs       │
└─────────────────────────────────────────────┘
```

**Deployment:** PM2 multi-process container on SumoPod PaaS — web, api, and workers in one image.

**Why these choices:**
- MapLibre → zero Google Maps API cost at scale
- BullMQ → scrapes and AI pipelines run async, never block the API
- NVIDIA NIM → OpenAI-compatible, model-agnostic, fast inference

---

## Slide 8 — Design System

**Layout:** Two-column — component gallery on left, specs on right

**Typography:**
- `Inter` — UI labels, body, dashboard data
- `JetBrains Mono` — code snippets, agent reasoning traces, IDs
- `Lora` — editorial headers on the marketing/landing pages

**Color & Theming:**
- Dashboard: **Brutalist theme** — high contrast, no decorative gradients, dense data-forward layout (`.brutalist` CSS class scoped to the app shell)
- Marketing landing (`/` + `/start`): Sky-to-gradient scenes, cinematic scroll via Lenis
- Two visual worlds intentionally separated — the product feels serious; the landing feels aspirational

**Component Library (`@repo/ui`):**
- Built with `class-variance-authority` (CVA) + `clsx` + `tailwind-merge`
- Shared across web + any future apps in the monorepo
- Variant-driven: one Button component, N visual variants — no duplication

**Map UI:**
- Custom lead pins with stage-color coding
- Cluster view for dense areas
- Slide-over detail panel — no page navigation, context stays on the map

**Key design principle:**
> The map is never hidden. Every interaction happens *on* or *around* the map — it is the product, not a widget.

---

## Timing Guide

| Section | Duration |
|---------|----------|
| Slides 1–2 (cover + anecdote) | 3 min |
| Slides 3–4 (problem + stats) | 3 min |
| Slide 5 (pivot question) | 1 min |
| Slide 6 (solution overview) | 2 min |
| Slide 6.5 (20 AI agents deep-dive) | 3 min |
| Live demo | 5–7 min |
| Slides 7–8 (tech + design) | 4 min |
| **Total** | **~21–23 min** |
