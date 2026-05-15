# Deployment Strategy (Vercel + SumoPod Split)

Untuk hackathon ini kita pakai **2-platform split deployment** — frontend di Vercel (gratis), backend di SumoPod (pakai voucher). Ini memisahkan workload sesuai karakteristiknya: static-ish Next.js cocok di edge serverless, sementara API + AI worker butuh container long-running.

## Arsitektur

```
┌──────────── Vercel (Hobby, free) ────────────┐
│  apps/web (Next.js 15)                       │
│   • Landing: /  /start                       │
│   • Dashboard: /dashboard/...                │
│   • /dashboard/finance + /simulations/[id]   │
│                                              │
│  Server Components → Supabase Pooler         │
│  Client Components → SumoPod API (CORS)      │
└──────────────────────────────────────────────┘
        │                              │
        │ pg pooler :6543              │ HTTPS
        ▼                              ▼
┌─────────────┐                ┌─────────────────────────┐
│  Supabase   │                │  SumoPod (1 container)  │
│  Postgres   │◄───────────────┤  • apps/api  :3001      │
│  + Auth     │                │  • apps/workers (BullMQ)│
└─────────────┘                │    - scrape-map (Python)│
                               │    - orchestrated-ai    │
                               │    - finance-simulation │
                               └─────────┬───────────────┘
                                         │ outbound HTTPS
                          ┌──────────────┼──────────────┐
                          ▼              ▼              ▼
                     Upstash Redis   NVIDIA NIM   OpenFreeMap
                     (BullMQ)        (9 agents)   (map tiles)
```

**Workload per platform:**
| Platform | Berisi | Kenapa di sini |
|---|---|---|
| Vercel | Next.js web only | Gratis Hobby, edge cache, CDN otomatis, deploy from git instan |
| SumoPod | NestJS API + BullMQ workers + Python scraper | Butuh long-running process untuk worker AI + Playwright scraper |
| Supabase | Postgres + Auth | Sudah managed, free tier 500MB |
| Upstash | Redis (BullMQ queue) | Free tier 10k commands/day |
| NVIDIA NIM | LLM inference (9 agents) | External API, gratis untuk dev quota |

---

## Bagian 1 — Deploy Frontend ke Vercel

### 1.1 Connect repo

1. Buka https://vercel.com → Sign in dengan GitHub.
2. **Add New** → **Project** → pilih repo `finetune-agent` kamu.
3. Di **Configure Project**:
   - **Framework Preset**: Next.js (auto-detect)
   - **Root Directory**: klik **Edit** → pilih `apps/web` ⚠️ wajib
   - **Build Command**: biarkan default (Vercel detect Turborepo otomatis dan jalankan `pnpm turbo build --filter=web...`)
   - **Output Directory**: default (`apps/web/.next`)
   - **Install Command**: `pnpm install` di root (default)

### 1.2 Environment Variables di Vercel

Tambahkan via **Settings → Environment Variables** (apply ke Production + Preview + Development):

| Variable | Value | Catatan |
|---|---|---|
| `DATABASE_URL` | `postgresql://...pooler.supabase.co:6543/postgres?pgbouncer=true` | ⚠️ **Wajib pakai Pooler URL port 6543**, bukan direct 5432. Lihat catatan di bawah. |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | dari Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | dari Supabase dashboard (anon public key) |
| `NEXT_PUBLIC_API_URL` | `https://api-your-app.sumopod.io` | URL publik SumoPod app kamu (isi setelah Bagian 2 selesai) |

#### Kenapa Pooler URL?
Vercel functions = serverless (Lambda). Tiap function instance punya pg pool sendiri. Tanpa pooler, ratusan concurrent Lambda → ribuan koneksi Postgres → Supabase reject. **Supabase Transaction Pooler** (pgBouncer port 6543) handle ini natively.

Cara dapat Pooler URL:
1. Supabase dashboard → project → **Settings → Database**
2. Cari **Connection pooling** → mode **Transaction**
3. Copy URL — bentuknya `postgresql://postgres.xxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres`
4. Tambahkan `?pgbouncer=true` di akhir

### 1.3 Deploy

Klik **Deploy**. First build ~3-5 menit (Vercel install full monorepo, lalu build cuma `apps/web`).

Hasil: URL `https://your-app.vercel.app` (atau custom domain).

### 1.4 Custom Domain (opsional)

**Settings → Domains** → tambahkan domain → ikut instruksi DNS-nya. Free SSL otomatis.

---

## Bagian 2 — Deploy Backend ke SumoPod

### 2.1 Persiapan

File yang sudah disesuaikan untuk split deploy:
- `Dockerfile` — hanya build `apps/api` + `apps/workers` (skip `apps/web`, lebih cepat ~50%)
- `ecosystem.config.js` — PM2 cuma jalankan `api` (port 3001) + `workers` (no port)
- `apps/api/src/main.ts` — CORS sudah env-driven via `ALLOWED_ORIGINS`

### 2.2 Buat App di SumoPod

1. Dashboard SumoPod → **Create App** → connect GitHub → pilih repo.
2. SumoPod auto-detect `Dockerfile` di root.
3. **Pilih tier**:
   - Rekomendasi: **1 vCPU, 1 GB RAM** (cukup untuk api + workers + scrape sesekali)
   - Jangan paling kecil (512MB) — worker AI bisa OOM saat finance simulation paralel
4. **Port mapping**: expose `3001` publik (atau pakai feature SumoPod routing).
5. **Tidak perlu expose port 3000** — Vercel handle web.

### 2.3 Environment Variables di SumoPod

| Variable | Value | Catatan |
|---|---|---|
| `DATABASE_URL` | `postgresql://...5432/postgres` | Bisa pakai **direct URL port 5432** karena container long-running — tidak butuh pooler. (Tapi pooler URL juga fine.) |
| `REDIS_URL` | `rediss://default:xxx@xxx.upstash.io:6379` | Dari Upstash dashboard |
| `NVIDIA_API_KEY` | `nvapi-...` | Dari https://build.nvidia.com dashboard. **Wajib** — tanpa ini worker AI crash. |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app,https://your-app-staging.vercel.app` | ⚠️ **Wajib** untuk Vercel domain bisa call API. Comma-separated. Isi setelah Bagian 1 selesai. |
| `ALLOW_VERCEL_PREVIEWS` | `true` | Opsional — bolehkan semua `*.vercel.app` preview URL (deploy preview otomatis berfungsi). Set `false` di production untuk lebih ketat. |

### 2.4 Deploy

Klik **Deploy**. Build pertama ~5-8 menit (install Node deps + Python venv + scrapling). 

Setelah jalan, kamu dapat URL `https://api-your-app.sumopod.io`.

### 2.5 Kembali ke Vercel untuk wire-up

1. Copy URL SumoPod (`https://api-your-app.sumopod.io`)
2. Vercel **Settings → Environment Variables** → update `NEXT_PUBLIC_API_URL` ke URL SumoPod
3. Vercel **Deployments** → **Redeploy** latest deployment (env var baru effective setelah redeploy)

---

## Bagian 3 — Verifikasi Akhir

### 3.1 Smoke test full flow
1. Buka `https://your-app.vercel.app/` → landing page render ✓
2. Buka `https://your-app.vercel.app/dashboard/finance` → finance dashboard render (data kosong wajar) ✓
3. Klik **Add Transaction** → submit → cek di Supabase Studio tabel `transactions` ada row baru ✓
4. Klik **Run Simulation** → wizard 3 step → submit → otomatis redirect ke `/dashboard/finance/simulations/[id]` ✓
5. Poller jalan, status `pending` → `running` → `completed` dalam ~30-60 detik ✓
6. Cek SumoPod **Logs** — harus muncul:
   ```
   [FinanceSim] Picked up simulation xxx
   [FinanceOrchestrator] Running Owner/Supplier/Customer/Bank in parallel
   [FinanceOrchestrator]   ✓ owner confidence=82% in 12340ms
   ...
   [FinanceSim] Completed xxx risk=medium
   ```

### 3.2 Jika ada error CORS
- Lihat browser console di Vercel app
- Pastikan domain Vercel ada di `ALLOWED_ORIGINS` SumoPod env (case-sensitive, include `https://`)
- Restart SumoPod app setelah update env var

### 3.3 Jika ada error DB connection di Vercel
- `Too many connections` → ganti `DATABASE_URL` Vercel ke pooler URL (port 6543), bukan direct 5432
- `getaddrinfo ENOTFOUND` → Supabase project mungkin paused (free tier auto-pause 1 minggu idle), buka dashboard untuk wake-up

---

## Tips Hackathon

### Seed data sebelum demo
Demo dengan dashboard kosong = boring di mata juri. Sebelum demo:
1. Run `pnpm db:seed` (kalau seed script sudah ada) — atau insert manual:
2. Bikin 30-50 transactions realistic (mix income/expense/invoice, span 3-6 bulan terakhir)
3. Jalankan 1-2 simulations preset (price increase, hiring expansion) supaya history-nya terisi

### Iterasi cepat
- Vercel deploy preview otomatis per PR — manfaatkan untuk demo iterasi
- SumoPod re-deploy ~5-8 menit — minimize redeploy dengan iterasi lokal dulu

### Cost monitor
- SumoPod dashboard → cek **Billing/Usage** weekly. Voucher 150K cukup untuk ~2-3 bulan tier 1GB (verify pricing di panel).
- Vercel: Hobby tier 100 GB-hours / 1M req/bulan — lebih dari cukup untuk hackathon traffic.
- NVIDIA NIM: ada quota gratis untuk dev. Bisa habis kalau spam simulation. Cek dashboard NVIDIA Build.

### Yang sengaja TIDAK kita lakukan untuk hackathon
- ❌ Migrate ke Fly.io / Hetzner — voucher SumoPod cukup
- ❌ Auth Supabase wiring — dummy `DEV_WORKSPACE_ID` cukup untuk demo
- ❌ Worker concurrency tuning — default 1 OK untuk demo (judge biasanya trigger 1 simulation, bukan 100)
- ❌ Caching layer — Next.js edge cache + Supabase query cache sudah cukup

---

## Detail Teknis

### Apa yang ada di SumoPod container?

Setelah `Dockerfile` di-update, container berisi:

```
/app/
├── node_modules/           ← shared workspace deps
├── packages/               ← @repo/db, @repo/ai, @repo/shared
├── apps/
│   ├── api/dist/           ← NestJS compiled (port 3001)
│   ├── workers/
│   │   ├── dist/           ← BullMQ workers compiled
│   │   └── .venv/          ← Python venv (scrapling + Playwright deps)
│   └── web/                ← source ada tapi NOT BUILT (Vercel handle)
└── ecosystem.config.js     ← PM2 starts api + workers only
```

Saving dari skip web build:
- Build time: ~50% lebih cepat (Next.js build adalah step terpanjang)
- Image size: ~150-200MB lebih kecil
- Iterasi deploy lebih lancar

### Apa yang dijalankan workers?

`apps/workers/src/index.ts` start 4 worker pararel:

```ts
startScrapeWorker();           // scrape-map (Python scraper)
startAiWorker();               // legacy (kept for backward compat)
startOrchestratedAiWorker();   // Lead-scoring: Extractor→Finance→Marketing→Strategy
startFinanceSimulationWorker();// Finance sim: Owner∥Supplier∥Customer∥Bank → Synthesizer
```

Total 9 AI agents bisa di-orchestrate, plus scraper Google Maps. Semua jalan dalam 1 process node.js.

### Network egress yang harus diizinkan dari SumoPod
- `https://integrate.api.nvidia.com` (LLM inference)
- `https://*.supabase.co` (DB + Auth)
- `https://*.upstash.io` (Redis BullMQ)
- `https://www.google.com/maps/*` (scraper — Playwright via scrapling)

Default SumoPod biasanya allow outbound HTTPS. Verify di panel jika ada egress policy.

### Monitoring AI Agents

Selain log PM2 standar, app punya **observability lapisan database** built-in:

#### `agent_logs` — chain-of-thought transparency
Setiap eksekusi 9 agent di-log dengan: `agentName`, `executionId`, `stepNumber`, `output`, `reasoning`, `confidence`, `durationMs`, `tokensUsed`.

Query token usage harian:
```sql
SELECT date_trunc('day', created_at) AS day,
       agent_name,
       count(*) AS calls,
       sum(tokens_used) AS total_tokens,
       avg(duration_ms) AS avg_ms,
       avg(confidence) AS avg_conf
FROM agent_logs
WHERE created_at > now() - interval '7 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 4 DESC;
```

#### `simulations` & `lead_scores`
- `simulations.status` (`pending`/`running`/`completed`/`failed`)
- `simulations.errorMessage` (filled when failed)
- `simulations.totalDurationMs`, `simulations.totalTokensUsed`

Detect stuck jobs:
```sql
SELECT id, title, status, created_at
FROM simulations
WHERE status IN ('pending', 'running')
  AND created_at < now() - interval '5 minutes';
```

### Manajemen Log di SumoPod
Buka **Logs** di SumoPod dashboard. Filter prefix:
- `[OrchestratedAI]` — lead-scoring pipeline
- `[FinanceSim]` — finance simulation worker
- `[FinanceOrchestrator]` — per-step orchestrator
- `[ScrapeWorker]` — Google Maps scraper

Contoh output 1 simulation sukses:
```
[FinanceSim] Picked up simulation abc-123
[FinanceOrchestrator] Starting execution xyz for simulation abc-123
[FinanceOrchestrator] Running Owner/Supplier/Customer/Bank in parallel
[FinanceOrchestrator]   ✓ owner confidence=82% in 12340ms
[FinanceOrchestrator]   ✓ supplier confidence=75% in 14200ms
[FinanceOrchestrator]   ✓ customer confidence=80% in 11800ms
[FinanceOrchestrator]   ✓ bank confidence=70% in 15600ms
[FinanceOrchestrator] Running Synthesizer with 4 stakeholder views
[FinanceOrchestrator] Done. risk=medium confidence=78% total=32100ms tokens=4820
[FinanceSim] Completed abc-123 risk=medium
```
