# Deployment Guide (Vercel + VPS)

Frontend di Vercel (gratis), backend di VPS (Ubuntu 24.04 — Cloudeka Jakarta, Rp 75k/bln).

**Budget:** Rp 1.550.000 → Rp 90.000/bulan = **~17 bulan** hosting.

---

## Arsitektur

```
User → Vercel (Next.js) → Supabase (DB + Auth)
                       ↘ VPS API (NestJS :3001) → Redis (BullMQ)
                                                  → Workers (AI agents)
                                                  → Python scraper
```

| Platform | Berisi | Biaya |
|---|---|---|
| Vercel Hobby | Frontend Next.js | Gratis |
| VPS (Cloudeka Jakarta) | API + Workers + Python scraper | Rp 75.000/bln |
| Supabase Free | PostgreSQL + Auth | Gratis |
| Upstash Free | Redis (BullMQ queue) | Gratis |
| NVIDIA NIM | LLM inference (9 agents) | Gratis (dev quota) |

---

## Bagian 1 — Deploy Frontend ke Vercel

### 1.1 Connect repo

1. Buka https://vercel.com → **Add New → Project** → pilih repo `finetune-agent`
2. **Framework Preset:** Next.js (auto)
3. **Root Directory:** `apps/web`
4. **Build & Output:** default

### 1.2 Environment Variables

via **Settings → Environment Variables** (Production + Preview + Development):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Pooler URL port 6543 + `?pgbouncer=true` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `NEXT_PUBLIC_API_URL` | `http://43.129.54.139:3001` |

> Vercel functions itu serverless — pakai **Supabase Transaction Pooler** (port 6543, pgBouncer) biar gak overload koneksi DB.

### 1.3 Build fix

Buat `vercel.json` di root repo:

```json
{
  "buildCommand": "cd ../.. && pnpm build",
  "installCommand": "cd ../.. && pnpm install --no-frozen-lockfile",
  "outputDirectory": ".next"
}
```

Rootnya di `apps/web`, tapi build harus dari root biar turbo workspaces jalan.

**Penting:** API proxy rewrites harus ditulis di `apps/web/next.config.mjs`, BUKAN di `vercel.json` — Vercel mengabaikan rewrites di `vercel.json` untuk Next.js projects.

```js
// apps/web/next.config.mjs
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'http://43.129.54.139:3001/:path*',
      },
    ];
  },
};
```

### 1.4 Deploy

Klik **Deploy**. Build pertama ~3-5 menit. Setelah itu auto-deploy tiap push ke `main`.

---

## Bagian 2 — Deploy Backend ke VPS

### 2.1 Setup VPS

Beli di SumoPod → **Infrastructure → VPS → Create VPS**:

| Setting | Pilihan |
|---|---|
| Provider | Cloudeka |
| Region | Jakarta |
| OS | Ubuntu Server 24.04 LTS |
| Plan | 2 vCPU, 2 GB RAM, 50 GB SSD |

```bash
ssh ubuntu@<IP-VPS>
# masukin password dari dashboard

# System update + dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git python3 python3-pip python3-venv

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs

# Tools
sudo npm install -g pnpm pm2
```

### 2.2 Clone & Build

```bash
# SSH key (biar gak perlu password tiap pull)
ssh-keygen -t ed25519 -N '' -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
# tambahin ke GitHub → Settings → SSH keys

ssh-keyscan github.com >> ~/.ssh/known_hosts
git clone git@github.com:maulana-tech/finetune-agent.git ~/app

# Python venv untuk scraper
cd ~/app/apps/workers
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
playwright install-deps chromium
deactivate

# Workspace deps
cd ~/app
pnpm install --frozen-lockfile
cp .env.example .env  # lalu isi env vars

# Build (skip web)
pnpm turbo build --filter=api --filter=workers
```

### 2.3 Environment Variables

Isi file `~/app/.env`:

```bash
# DB — direct URL port 5432 (VPS long-running, gak butuh pooler)
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres"

# Redis (Upstash)
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"

# AI
NVIDIA_API_KEY="nvapi-..."

# CORS
ALLOWED_ORIGINS="https://utune-ai.vercel.app"

# Port API
PORT=3001
```

### 2.4 Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3001/tcp  # API
sudo ufw --force enable
```

### 2.5 PM2 dengan tsx Runtime

`@repo/ai` export `.ts` langsung → butuh `tsx` runtime untuk production:

```bash
sudo npm install -g tsx

# Copy ecosystem.config.js udah include interpreter + dotenv preload
DOTENV_CONFIG_PATH=/home/ubuntu/app/.env pm2 start ecosystem.config.js
```

PM2 config (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'apps/api/dist/main.js',
      interpreter: 'tsx',
      node_args: '-r dotenv/config',
      env: { DOTENV_CONFIG_PATH: '/home/ubuntu/app/.env', NODE_ENV: 'production' },
    },
    {
      name: 'workers',
      script: 'apps/workers/dist/index.js',
      interpreter: 'tsx',
      node_args: '-r dotenv/config',
      env: { DOTENV_CONFIG_PATH: '/home/ubuntu/app/.env', NODE_ENV: 'production' },
    },
  ],
};
```

### 2.6 Auto-start

```bash
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 2.7 Verify

```bash
pm2 status
curl http://localhost:3001/  # → 404 (normal)
curl -X POST http://localhost:3001/jobs/scrape \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"<real-uuid>","query":"test","limit":1}'
```

---

## Bagian 3 — Update & Redeploy

### Backend (VPS)

```bash
cd ~/app
git pull
pnpm install --frozen-lockfile
pnpm turbo build --filter=api --filter=workers
DOTENV_CONFIG_PATH=/home/ubuntu/app/.env pm2 restart all
```

### Frontend (Vercel)

Push ke `main` → auto-deploy.

---

## Bagian 4 — DB Migrations

Schema diupdate via Drizzle. Dua mode:

### Push (cepat, untuk development)

```bash
pnpm --filter @repo/db push
```

### Migration (untuk production)

```bash
pnpm db:generate    # bikin file SQL baru di packages/db/drizzle/
pnpm db:migrate     # apply ke database
```

> Kalo tabel udah ada (dibikin via `push`), pake `push` lagi aja — aman untuk nambah kolom.

---

## Monitoring

```bash
pm2 status              # status semua process
pm2 logs api --lines 50 # log API
pm2 logs workers        # log workers (real-time)
pm2 monit               # dashboard CPU/memory

# Filter log AI pipeline
pm2 logs workers --lines 100 | grep -E "\[FinanceSim\]|\[OrchestratedAI\]|\[MarketAnalysis\]"
```

---

## Cost Breakdown

| Item | Biaya |
|---|---|
| VPS (2 vCPU, 2GB, 50GB) | Rp 75.000/bulan |
| Vercel Hobby | Gratis |
| Supabase Free | Gratis |
| Upstash Free | Gratis |
| NVIDIA NIM | Gratis |
| **Total** | **Rp 90.000/bulan** |
| **Budget** | **≈ 17 bulan** |

---

## Troubleshooting

### Build gagal karena `@repo/ai` export `.ts`

Solusi: pake `tsx` runtime di PM2 (bukan `node` langsung). Jangan compile `@repo/ai` ke dist — tsx handle transpile on-the-fly.

### Scraper error "Browser not found"

```bash
cd ~/app/apps/workers
source .venv/bin/activate
playwright install chromium
playwright install-deps chromium
deactivate
```

### CORS error dari frontend

Pastiin `ALLOWED_ORIGINS` di `.env` VPS includes `https://utune-ai.vercel.app`, lalu restart API.

### DB connection error di Vercel

Pastikan pakai **pooler URL port 6543** + `?pgbouncer=true`. VPS bisa pake port 5432 langsung.
