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

**3. Multi-Agent AI**
Four specialized AI agents work in sequence — each building on the last's reasoning:
- **Extractor** → structures raw data
- **Finance Agent** → estimates budget capacity
- **Marketing Agent** → identifies pain points & messaging fit
- **Strategy Agent** → synthesizes all into a priority score + recommended action

Every decision is logged. No black box.

**Callout box:**
> `search → enrich → analyze → message → visit → close` — all on one map.

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
| Slide 6 (solution) | 3 min |
| Live demo | 5–7 min |
| Slides 7–8 (tech + design) | 4 min |
| **Total** | **~20–21 min** |
