# Finetune Agent — Multi-Agent B2B Intelligence System

> **AI Agent Competition Submission**  
> A collaborative AI system where 4 specialized agents work together to qualify B2B leads, mimicking how real sales teams analyze prospects.

[![Architecture](https://img.shields.io/badge/Architecture-Multi--Agent-blue)](./ARCHITECTURE.md)
[![Competition](https://img.shields.io/badge/Competition-Ready-green)](./COMPETITION.md)

---

## 🎯 Problem

Sales teams waste 80% of their time chasing unqualified leads. Current tools either scrape data without intelligence or provide generic AI insights. **What if every lead was analyzed by a team of AI specialists who collaborate like humans?**

---

## 💡 Solution

**4 AI agents that pass context forward, reason transparently, and produce actionable scores:**

```
Lead scraped →
  [1] Extractor Agent → Extracts structured data
      ↓ (shares context)
  [2] Finance Agent → Analyzes budget capacity (uses extractor data)
      ↓ (shares context)
  [3] Marketing Agent → Determines messaging fit (uses extractor + finance)
      ↓ (shares context)
  [4] Strategy Agent → Synthesizes ALL agents → Final recommendation
      ↓
  Output: A-tier lead, 85/100 score, "immediate_outreach" action
```

**Every decision is logged with explicit reasoning** — no black box.

---

## 🏆 Why This Wins the Competition

### ✅ **Multi-Agent Communication**
- Agents explicitly pass `contextToShare` to next agent
- Finance Agent receives Extractor's output
- Marketing Agent receives Extractor + Finance
- Strategy Agent synthesizes ALL

### ✅ **Workflow & Orchestration**
- `orchestrator.ts` sequences agents: Step 1 → 2 → 3 → 4
- Each step waits for previous to complete
- Context accumulates as workflow progresses

### ✅ **Log Interaksi (Reasoning Transparency)**
- Every agent execution logged to `agent_logs` table
- Includes: input, output, reasoning, confidence, context passed, duration, tokens
- Full audit trail via `execution_id`

### ✅ **Sistem Modular**
- Each agent is a standalone function with typed interface
- Can swap LLM provider (NVIDIA NIM → OpenAI → Anthropic)
- Can add 5th agent without modifying existing ones

### ✅ **Business Impact (Measurable)**
- **Lead Quality Score** (0-100) → Prioritize outreach
- **Conversion Probability** (0.0-1.0) → Forecast revenue
- **Priority Tier** (A/B/C/D) → Auto-segment leads
- **Recommended Action** → Immediate / Nurture / Disqualify

---

## 🚀 Quick Start

### Prerequisites
```bash
# Node 22 LTS
nvm use 22

# pnpm package manager
npm install -g pnpm@9.15.0
```

### Setup
```bash
# 1. Clone repo
git clone [repo-url]
cd finetune-agent

# 2. Install dependencies
pnpm install

# 3. Environment variables
cp .env.example .env
# Fill: DATABASE_URL (Postgres), REDIS_URL, NVIDIA_API_KEY

# 4. Generate database tables
pnpm db:generate  # Creates agent_logs + lead_scores tables
pnpm db:migrate   # Applies migrations
```

### Run
```bash
# Start all services (web + API + workers)
pnpm dev

# Or run individually:
pnpm dev:web      # Next.js frontend (port 3000)
pnpm dev:api      # NestJS API (port 3001)
pnpm dev:workers  # BullMQ workers (orchestrator)
```

### Test the Workflow
```bash
# Trigger scrape job → AI agents will run automatically
curl -X POST http://localhost:3001/jobs/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "query": "coffee shops", 
    "limit": 3, 
    "workspaceId": "test-workspace-uuid"
  }'

# Watch logs to see agents running
tail -f apps/workers/logs/combined.log

# Query reasoning trail in database
psql $DATABASE_URL -c "
  SELECT step_number, agent_name, reasoning, confidence 
  FROM agent_logs 
  WHERE lead_id = 'some-lead-uuid' 
  ORDER BY step_number;
"

# Check final scores
psql $DATABASE_URL -c "
  SELECT l.name, ls.quality_score, ls.priority_tier, ls.recommended_action 
  FROM leads l 
  JOIN lead_scores ls ON l.id = ls.lead_id 
  LIMIT 5;
"
```

---

## 📂 Project Structure

```
finetune-agent/
├── apps/
│   ├── web/          Next.js 15 App Router (frontend)
│   ├── api/          NestJS 11 REST API
│   └── workers/      BullMQ workers (runs orchestrator)
│
├── packages/
│   ├── ai/           🤖 Multi-agent system
│   │   ├── orchestrator.ts         ← Coordinates all agents
│   │   ├── agents/
│   │   │   ├── extractor.ts        ← Step 1
│   │   │   ├── finance.ts          ← Step 2
│   │   │   ├── marketing.ts        ← Step 3
│   │   │   └── strategy.ts         ← Step 4 (synthesis)
│   │   └── types.ts                ← AgentContext, AgentResponse
│   │
│   ├── db/           Database schema + client
│   │   ├── schema/
│   │   │   ├── agent_logs.ts       ← Reasoning audit trail
│   │   │   ├── lead_scores.ts      ← Final scores
│   │   │   └── leads.ts            ← Business records
│   │
│   ├── shared/       Zod schemas, env validation
│   └── ui/           React components
│
├── COMPETITION.md    📄 Full competition submission doc
├── ARCHITECTURE.md   📐 Visual workflow diagram
└── CLAUDE.md         🤖 AI assistant guide
```

---

## 🧠 How It Works (30-second version)

1. **Scraper** extracts businesses from Google Maps
2. **Orchestrator** runs 4 agents in sequence for each lead:
   - **Extractor** → Parses raw data into structured fields
   - **Finance** → Receives extractor context, estimates budget capacity
   - **Marketing** → Receives extractor + finance context, determines messaging fit
   - **Strategy** → Receives ALL context, provides final recommendation
3. **Every step logged** to `agent_logs` with reasoning + confidence
4. **Final score written** to `lead_scores` (priority A/B/C/D + recommended action)
5. **Sales team sees**: Prioritized list with actionable next steps

---

## 🎥 Demo Video

[Link to video walkthrough showing:]
1. Triggering a scrape job
2. Watching orchestrator run agents in console
3. Querying `agent_logs` to see reasoning chain
4. Viewing final `lead_scores` with recommendations
5. Showing how Strategy Agent references Finance + Marketing insights in its reasoning

---

## 📊 Example Output

**Lead:** "Joe's Pizza" (restaurant)

**Agent Logs:**
```
Step 1 (Extractor):
  Output: { name: "Joe's Pizza", category: "Restaurant", ... }
  Reasoning: "Extracted from structured map data"
  Confidence: 95%

Step 2 (Finance):
  Output: { budget_probability: 60, financial_health_score: 65 }
  Reasoning: "Small restaurant, thin margins → 60% budget probability"
  Confidence: 80%

Step 3 (Marketing):
  Output: { messaging_fit_score: 75, pain_points: ["online ordering"] }
  Reasoning: "Given budget 60%, likely struggles with digital ops"
  Confidence: 78%

Step 4 (Strategy):
  Output: { priority_score: 72, tier: "B", action: "nurture" }
  Reasoning: "Finance 60% + Marketing 75% = B-tier. Qualified but not urgent."
  Confidence: 82%
```

**Final Score:**
- Quality: 72/100
- Tier: B
- Action: **Nurture (send case study next week)**

---

## 🔍 Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Sequential agents** (not parallel) | Finance needs category from Extractor, Marketing needs budget from Finance |
| **Context passing via types** | TypeScript `AgentContext` interface ensures type safety |
| **Database audit trail** | Postgres `agent_logs` table for full transparency (not ephemeral logs) |
| **NVIDIA NIM LLM** | OpenAI-compatible API, cost-effective for production |
| **BullMQ queue** | Scalable to 1000s of leads concurrently |
| **Drizzle ORM** | Type-safe SQL queries, schema-as-code |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind v4, MapLibre GL |
| **Backend** | NestJS 11 (REST API), BullMQ (queue orchestration) |
| **Database** | PostgreSQL (Supabase), Drizzle ORM |
| **AI/LLM** | NVIDIA NIM (Llama 3.1 70B + 8B), Vercel AI SDK |
| **Queue** | Redis + BullMQ |
| **Deployment** | Docker + PM2 (single container for all services) |

---

## 📚 Documentation

- **[COMPETITION.md](./COMPETITION.md)** — Full submission for judges (includes requirements checklist)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Visual workflow diagram + code walkthrough
- **[CLAUDE.md](./CLAUDE.md)** — AI assistant guide for contributors
- **[CONTEXT.md](./CONTEXT.md)** — Product vision and market positioning
- **[DEPLOY.md](./DEPLOY.md)** — Deployment instructions (SumoPod PaaS)

---

## 🤝 Contributing

This is a competition submission, but we welcome feedback! Open an issue or reach out via [contact method].

---

## 📄 License

[Your license here]

---

## 🙏 Acknowledgments

Built for the **AI Agent Competition** — demonstrating that AI agents can collaborate like human teams, with full reasoning transparency and measurable business impact.

**Questions for judges?** We're ready to demo live reasoning traces and answer technical deep-dives.

---

**TL;DR:** 4 AI agents → Context passing → Reasoning logs → Actionable lead scores → Production-ready.
