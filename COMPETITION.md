# AI Agent Competition - Multi-Agent Architecture

> **Submission for AI Agent Competition**  
> Theme: Multi-Agent AI systems that think, collaborate, and make decisions

---

## 🎯 Problem Statement

B2B lead generation is broken. Sales teams waste hours manually researching prospects, only to chase low-quality leads. Current tools either:
- Extract data without intelligence (scraping tools)
- Provide generic insights (CRMs with basic scoring)
- Require manual analysis across multiple platforms

**What if every lead was automatically analyzed by a team of AI specialists who collaborate like human analysts?**

---

## 🏗️ Solution: Multi-Agent B2B Intelligence System

We built a **collaborative AI agent system** where 4 specialized agents work together to qualify leads, mimicking how a real sales team operates:

1. **Extractor Agent** (Data Specialist) — Extracts structured business information
2. **Finance Agent** (Financial Analyst) — Assesses budget capacity and financial health
3. **Marketing Agent** (Messaging Strategist) — Determines product-market fit and pain points
4. **Strategy Agent** (Strategic Advisor) — Synthesizes all insights and provides final recommendation

### Key Innovation: **Context Passing & Reasoning Transparency**

Unlike typical AI systems where agents run independently, our agents **explicitly share context**:
- Finance Agent receives Extractor's output and reasons about budget based on business size/category
- Marketing Agent receives both Extractor + Finance context to determine messaging fit
- Strategy Agent synthesizes ALL previous agents to make the final call

Every decision is logged with explicit reasoning — **no black box**.

---

## 🧠 Multi-Agent Architecture

### Workflow Orchestration

```
Scraper extracts raw data
    ↓
┌─────────────────────────────────────────┐
│    ORCHESTRATOR (Sequence Controller)    │
└─────────────────────────────────────────┘
    ↓
[1] Extractor Agent
    - Input: Raw text from scraper
    - Output: Structured business data (name, category, services, contacts)
    - Reasoning: "Extracted based on explicit signals in raw text"
    - Context shared: { extractedData }
    ↓
[2] Finance Agent
    - Input: { extractedData } from Step 1
    - Output: Revenue estimate, company size, budget probability (0-100)
    - Reasoning: "Based on category X and services Y, estimated as small business..."
    - Context shared: { extractedData, financialAnalysis }
    ↓
[3] Marketing Agent
    - Input: { extractedData, financialAnalysis } from Steps 1-2
    - Output: Target persona, pain points, messaging fit score (0-100)
    - Reasoning: "Given their category and budget, they likely struggle with X..."
    - Context shared: { extractedData, financialAnalysis, marketingInsights }
    ↓
[4] Strategy Agent (Final Synthesis)
    - Input: ALL previous context (Steps 1-3)
    - Output: Priority score (0-100), conversion probability, recommended action
    - Reasoning: "Finance shows 75% budget probability + Marketing fit 80% → Priority A lead"
    - Decision: IMMEDIATE_OUTREACH / NURTURE / DISQUALIFY
    ↓
Final output: Lead score + actionable recommendation
All reasoning logged to database
```

### Agent Communication Protocol

Each agent returns:
```typescript
{
  output: { /* structured data */ },
  reasoning: "Explicit chain-of-thought explanation",
  confidence: 85, // 0-100 confidence score
  contextToShare: { /* data for next agent */ },
  durationMs: 1234,
  tokensUsed: 567
}
```

Context flows forward — **later agents see earlier agents' outputs + reasoning**.

---

## 📊 Technical Implementation

### Stack
- **LLM Provider**: NVIDIA NIM (Llama 3.1 70B for analysis, 8B for extraction)
- **Framework**: Vercel AI SDK for structured generation
- **Queue**: BullMQ for workflow orchestration
- **Database**: PostgreSQL with dedicated tables for agent logs + lead scores
- **Deployment**: Single Node.js container (PM2-managed)

### Key Files

| File | Purpose |
|------|---------|
| `packages/ai/src/orchestrator.ts` | Main workflow coordinator — sequences all 4 agents |
| `packages/ai/src/agents/*.ts` | Individual agent implementations with context passing |
| `packages/ai/src/types.ts` | Shared interfaces for AgentContext and AgentResponse |
| `packages/db/src/schema/agent_logs.ts` | Stores every agent execution with reasoning |
| `packages/db/src/schema/lead_scores.ts` | Final aggregated scores per lead |
| `apps/workers/src/queues/orchestrated-ai.worker.ts` | BullMQ worker that runs orchestrator + logs results |

### Database Schema (Multi-Agent Specific)

**agent_logs** — Full audit trail
```sql
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL,       -- Groups all agents in one run
  agent_name TEXT NOT NULL,          -- extractor, finance, marketing, strategy
  step_number INT NOT NULL,          -- 1, 2, 3, 4
  input JSONB NOT NULL,
  output JSONB NOT NULL,
  reasoning TEXT NOT NULL,           -- Explicit chain-of-thought
  confidence INT,                     -- 0-100
  context_from_previous_agent JSONB, -- What was passed in
  context_shared_to_next_agent JSONB, -- What was passed forward
  duration_ms INT,
  tokens_used INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**lead_scores** — Final synthesis
```sql
CREATE TABLE lead_scores (
  id UUID PRIMARY KEY,
  lead_id UUID UNIQUE NOT NULL,
  quality_score INT NOT NULL,         -- 0-100 (from Strategy Agent)
  conversion_probability FLOAT NOT NULL, -- 0.0 - 1.0
  estimated_value INT,                 -- USD deal size prediction
  priority_tier TEXT NOT NULL,        -- A, B, C, D
  financial_health INT,               -- From Finance Agent
  messaging_fit INT,                  -- From Marketing Agent
  strategic_alignment INT,            -- From Strategy Agent
  recommended_action TEXT NOT NULL,   -- immediate_outreach / nurture / disqualify
  reasoning TEXT NOT NULL             -- Why this score?
);
```

---

## ✅ Competition Requirements Met

### 1. **Multi-Agent Communication** ✅
- Agents explicitly pass `contextToShare` to next agent
- Each agent receives `AgentContext` with accumulated data from previous steps
- Context flow: Extractor → Finance (receives extractor) → Marketing (receives extractor + finance) → Strategy (receives ALL)

### 2. **Workflow & Orchestration** ✅
- `orchestrator.ts` coordinates sequence: Step 1 → Step 2 → Step 3 → Step 4
- Each agent runs only after previous completes
- Orchestrator merges context after each step

### 3. **Log Interaksi** ✅
- Every agent execution logged to `agent_logs` table
- Logs include: input, output, reasoning, confidence, context passed, duration, tokens
- Traceable via `execution_id` — see full workflow in one query

### 4. **Sistem Modular** ✅
- Each agent is a standalone function with clear interface
- Can swap LLM provider (NVIDIA NIM → OpenAI → Anthropic) by changing `provider.ts`
- Can add new agents to pipeline without modifying existing ones

---

## 📈 Business Impact Metrics

Our system produces **measurable outcomes**:

| Metric | Value | Impact |
|--------|-------|--------|
| **Lead Quality Score** | 0-100 | Prioritize sales outreach |
| **Conversion Probability** | 0.0 - 1.0 | Forecast pipeline value |
| **Estimated Deal Value** | $USD | ROI prediction per lead |
| **Priority Tier** | A/B/C/D | Automated lead segmentation |
| **Recommended Action** | immediate_outreach / nurture / disqualify | Actionable next step |

Sales teams can:
- Focus on A-tier leads (predicted high-value, high-conversion)
- Auto-disqualify D-tier leads (save wasted time)
- Track agent reasoning ("Why is this lead scored 85/100?")

---

## 🚀 Running the System

### Prerequisites
```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Fill: DATABASE_URL, REDIS_URL, NVIDIA_API_KEY
```

### Generate database tables
```bash
pnpm db:generate  # Generate agent_logs + lead_scores migrations
pnpm db:migrate   # Apply to database
```

### Start all services
```bash
pnpm dev  # Runs web + API + workers concurrently
```

### Test the workflow
```bash
# 1. Trigger scrape job (extracts leads)
curl -X POST http://localhost:3001/jobs/scrape \
  -H "Content-Type: application/json" \
  -d '{"query": "coffee shops", "limit": 5, "workspaceId": "xxx"}'

# 2. Worker automatically triggers orchestrated-ai-queue for each lead
# 3. Check agent_logs table to see reasoning chain
# 4. Check lead_scores table to see final recommendation
```

### Query agent reasoning
```sql
-- See full workflow for a lead
SELECT 
  step_number,
  agent_name,
  reasoning,
  confidence,
  duration_ms
FROM agent_logs
WHERE lead_id = 'some-lead-uuid'
ORDER BY step_number;

-- See final score
SELECT 
  priority_tier,
  quality_score,
  recommended_action,
  reasoning
FROM lead_scores
WHERE lead_id = 'some-lead-uuid';
```

---

## 🔍 Why This Wins

### 1. **Real Collaboration, Not Prompts**
- Agents don't just run in parallel — they **build on each other's work**
- Strategy Agent references Finance's "75% budget probability" in its reasoning
- Marketing Agent adjusts messaging based on Finance's "small business" classification

### 2. **Transparent Reasoning**
- Every decision is logged with explicit "why"
- No black box — trace exactly how the final score was computed
- Auditable for compliance (GDPR, PDP Law)

### 3. **Production-Ready**
- Modular architecture — easy to add 5th agent (e.g., Legal Compliance Agent)
- Scalable — BullMQ handles 1000s of leads concurrently
- Reproducible — same input → same output (no hidden state)

### 4. **Measurable Business Impact**
- Not just "AI-powered" — generates **actionable scores and recommendations**
- Sales teams see immediate ROI (stop chasing bad leads)
- Metrics directly tie to revenue (conversion probability × deal value)

---

## 📚 Code Walkthrough for Judges

**Start here:**
1. `packages/ai/src/orchestrator.ts` — See how agents are sequenced
2. `packages/ai/src/agents/strategy.ts` — See how final agent synthesizes all context
3. `packages/db/src/schema/agent_logs.ts` — See reasoning transparency schema
4. `apps/workers/src/queues/orchestrated-ai.worker.ts` — See logging implementation

**Key proof points:**
- Search for `contextFromPreviousAgent` in logs — shows context passing
- Search for `reasoning:` in agent outputs — shows chain-of-thought
- Run `SELECT * FROM agent_logs WHERE execution_id = 'xxx'` — shows full workflow trace

---

## 👥 Team & Contact

**Project:** Finetune Agent (B2B Business Finder + Multi-Agent CRM)  
**Repository:** [Link to repo]  
**Demo:** [Link to deployed demo]  
**Presentation Deck:** [Link to slides explaining architecture]

Built with ❤️ for the AI Agent Competition.

**Questions?** Open an issue or reach out via [contact method].

---

**TL;DR for Judges:**
This is not a chatbot with a long prompt. This is 4 specialized AI agents that:
- Share context explicitly (logged in DB)
- Reason transparently (every decision explained)
- Produce measurable business outcomes (lead scores → revenue impact)
- Scale to production (modular, reproducible, queue-based)

We're ready to demo live reasoning traces and answer technical questions.
