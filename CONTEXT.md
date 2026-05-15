# CONTEXT.md

> Product context for the B2B Business Finder & Mapped CRM
> Inspired by [Vonsel](https://vonsel.com/business-finder) — adapted for our stack and market.

---

## 1. What we're building

A **B2B lead generation platform** that combines:

1. A **business finder** — search millions of companies by industry + location (Google Maps-grade data) and import them as leads.
2. A **map-first CRM** — every lead is a pin on a real map; manage pipelines, areas, routes, and field reps visually.
3. **AI sales layer** — review analysis, weakness detection, personalized cold-email generation, voice-note transcription, and an assistant that knows your database.

Think "Google Maps + Apollo.io + HubSpot, but mapped and AI-native."

## 2. Why this exists

Most B2B prospecting today is fragmented:

- People scrape leads from Google Maps manually.
- Contacts get pasted into HubSpot/Pipedrive (list view) and lose geographic context.
- Field reps drive blind — no zone optimization, no route planning, no real-time supervision.
- Cold emails are generic because researching each prospect costs hours.

We collapse this into one workflow: **search → enrich → analyze → message → visit → close**, all on a map.

## 3. Target users

| Persona | Use case |
|---|---|
| **Field sales rep** | Daily route planning, lead-on-map visibility, voice-to-report after each visit |
| **Inside sales / SDR** | Bulk prospecting by zone, AI-personalized cold emails, review-based pitch prep |
| **Sales manager** | Team supervision, territory assignment, real-time activity feed, performance ranking |
| **Agency / freelancer** | One-off campaigns per client — extract 500 dentists in Bali, hand off the list |
| **SMB owner** | Build a verified contact list in their own city without hiring a sales ops person |

Primary geo focus at launch: **Indonesia + SEA**, then expanding to wherever Google Maps coverage is dense.

## 4. Core feature pillars

### 4.1 Business Finder
- Search by **country → region → province → city**, or by **custom drawn polygon** on the map.
- Multi-keyword business types (e.g. `dentists, lawyers, restaurants`) per job.
- Output language selector (28+ languages) — results translated/normalized to chosen locale.
- Tiered enrichment toggles:
  - **Business data** (name, address, phone, website, hours) — base
  - **Enriched data** (emails, mobile, social, WhatsApp) — paid
  - **Smart reviews** (10/20/40 reviews per lead by tier, AI summary)
  - **Smart sales** (weaknesses, strengths, opportunities — cross-referenced with *your* business context)
  - **Smart emails** (1/2/4 personalized cold emails per lead by tier)
  - **Restaurant menus** (specialized extractor for F&B verticals)
- Result cap per job: 1,000 businesses (configurable per plan).
- Free tier: 15–50 leads per feature, no credit card.

### 4.2 Mapped CRM
- Every imported lead is a pin with full profile + direct actions (call, schedule, note, mark stage).
- Pipeline stages customizable per workspace.
- Filters: by rating (★1–★5), by reply status, by tag, by area, by assigned rep, by date.
- Cluster view in dense areas.
- Lead detail panel slides over the map — no context switch.

### 4.3 Smart Reviews (AI)
- Pull Google reviews (10/20/40 per lead by plan tier).
- Sort: lowest rating / highest / recent / most relevant.
- AI summary in chosen language.
- Detect: recurring complaints, owner responsiveness, sentiment indicators.

### 4.4 Smart Sales (AI)
- Takes the user's own business context (up to 800 chars) — e.g. "We sell appointment-booking software for clinics."
- For each lead, generates: weaknesses, strengths, key indicators, sales opportunities.
- Output is the foundation for the cold email.

### 4.5 Smart Emails (AI)
- Personalized cold emails per lead, written from real review-derived pain points.
- Configurable: goal, tone, CTA, language, length, signature, subject, context.
- Send directly from CRM (mailbox integration).

### 4.6 Smart Territories
- Draw zones on the map, assign to specific reps.
- Prevent overlap; rep-scoped CRM view (a rep only sees their zone).

### 4.7 Smart Routes
- Select N leads → generate optimal multi-stop route (Uber-grade routing).
- Driving or walking mode.
- One-click export to Google Maps / Apple Maps / Waze.

### 4.8 Smart Transcription
- Voice notes → structured field reports.
- Auto-linked to the lead the rep was visiting.

### 4.9 Smart Calendar
- Sync Google Calendar + Outlook.
- Schedule from the map; events linked to leads.

### 4.10 Smart Supervision
- Real-time team activity feed.
- Per-rep metrics, ranking, pipeline movement.
- Manager-only view.

### 4.11 AI Assistant
- Chat that has read the entire CRM.
- "Who has the worst reviews in Yogyakarta?" / "Draft a follow-up to the 5 leads I visited yesterday."
- Backed by an LLM (Claude or GPT — model-agnostic, server-routed).

## 5. Data model — high level

Workspaces own everything. Inside a workspace:

```
Workspace
├── Users (with roles: owner, manager, rep)
├── BusinessContext (string, used by AI for personalization)
├── Areas (polygons, assigned to reps)
├── Leads (Business records)
│   ├── Profile (name, address, phone, website, hours, lat/lng, category)
│   ├── EnrichedContacts (emails[], phones[], socials{})
│   ├── Reviews[] (rating, text, author, date, replied?)
│   ├── AIInsights (weaknesses, strengths, opportunities, summary)
│   ├── PipelineStage (custom per workspace)
│   ├── AssignedRep (User ref)
│   ├── Notes[]
│   ├── Activities[] (calls, visits, emails, transcriptions)
│   └── Tags[]
├── Jobs (search runs — query + filters + status + result count)
├── Routes (ordered list of leads + travel mode + assigned rep + date)
├── Emails (drafts + sent log)
└── CalendarEvents (synced + native)
```

## 6. Tech stack (target)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **Next.js 15 (App Router)** + TypeScript + Tailwind | App lives at `app.<domain>` |
| Map | **MapLibre GL JS** + OpenFreeMap / MapTiler tiles | Avoid Google Maps JS API costs at scale |
| Backend | **NestJS** (REST + WebSockets) | Modular, fits our agency conventions |
| DB | **Supabase PostgreSQL** + **PostGIS** | Geo queries are first-class |
| ORM | **Drizzle** | Schema-as-code, migrations checked in |
| Cache / queue | **Redis** + **BullMQ** | Search jobs, enrichment jobs, email sends |
| Search ingestion | Headless scraping workers (Playwright-based) + Google Places API fallback | Hybrid for cost + coverage |
| AI | **Claude API** (primary) + provider-agnostic abstraction | Reviews summary, sales insights, email gen, assistant |
| Voice | OpenAI Whisper (self-hosted) for transcription | |
| Email send | Postmark / Resend (transactional) + user mailbox OAuth (Gmail/Outlook) for cold sends | |
| Auth | Supabase Auth (Email, Magic Link, OAuth) | |
| Deployment | PM2 + Nginx on Hostinger VPS (AlmaLinux) | Standard agency stack |
| Monitoring | Telegram bot alerts + Uptime Kuma | Continues the pattern from srv965095 / srv788461 |

## 7. Pricing model (planning target)

Mirror Vonsel's three-tier shape, adapted to IDR/USD:

| Plan | Lead cap | Monthly fresh leads | Reviews/lead | Emails/lead | Reps |
|---|---|---|---|---|---|
| **Starter** | 200 | 25 | 10 | 1 | 1 |
| **Pro** | 800 | 100 | 20 | 2 | 2 |
| **Business** | 2,000 | 200 | 40 | 4 | 8 |

Free trial: **50 leads, no card**.

## 8. MVP scope (Phase 1)

Ship the **smallest end-to-end loop** first. Order:

1. Auth (email + password, magic link optional later).
2. Business Finder — country/region/city search, base business data only.
3. Lead import to CRM (DB write + map pin).
4. Map view with filters + lead detail panel.
5. Manual lead editing, notes, simple pipeline stages.
6. Stripe / Midtrans billing with one plan (Starter).

**Out of scope for MVP** — keep them in the backlog:
- Smart Reviews, Smart Sales, Smart Emails (Phase 2 — AI layer)
- Smart Routes, Smart Territories (Phase 3 — team)
- Smart Transcription, Smart Calendar, Supervision (Phase 4 — field ops)
- Restaurant Menus extractor (vertical-specific, defer)

## 9. Differentiators vs. Vonsel

What we should do *differently* to win our market:

- **Indonesia/SEA first** — local payment rails (Midtrans, QRIS), Bahasa output, local business categories.
- **WhatsApp-native** — enrich WhatsApp numbers as a first-class contact, not a side feature.
- **Cheaper Starter tier** — sub-USD-10 entry to capture freelancers and small studios.
- **MCP-compatible** — expose the lead database via MCP so agencies can query it from Claude / Cursor / ChatGPT directly. This is the "Indonesia's first MCP-native CRM" angle that ties back to the KonaKorp positioning.
- **Self-serve area templates** — pre-drawn polygons for common Indonesian cities (Jabodetabek, Jogja, Bali zones).

## 10. Non-goals

- Not an outbound *email automation* tool (no warm-up, no domain rotation — those are Lemlist/Smartlead territory).
- Not a *consumer* directory (B2B only, no end-user reviews of businesses).
- Not a *replacement* for Salesforce/HubSpot for enterprise pipeline management — we are the prospecting + field-sales layer.

## 11. Open questions

- Data sourcing — Google Places API costs at scale vs. headless scraping risk. Likely hybrid; benchmark needed in Phase 1.
- Email verification provider (NeverBounce / ZeroBounce / self-hosted?).
- Phone enrichment — which provider in SEA gives the best WhatsApp validity rate?
- GDPR / Indonesian PDP Law (UU PDP) compliance posture — needs lawyer review before launch.
- Multi-tenancy — single DB with `workspace_id` everywhere (simpler) vs. DB-per-customer (overkill for now). Going with single DB.

## 12. Reference

Vonsel pages analyzed for this context:
- https://vonsel.com/business-finder
- https://vonsel.com/ (landing)

Last reviewed: 2026-05-13.
