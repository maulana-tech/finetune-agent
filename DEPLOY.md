# Deployment Strategy (Vercel + VPS)

Untuk hackathon ini kita pakai **2-platform split deployment** — frontend di Vercel (gratis), backend di VPS SumoPod (pakai voucher). Frontend di edge serverless, backend long-running process buat API + AI workers.

**Budget:** Rp 1.550.000 → Rp 90.000/bulan = **~17 bulan** hosting.

## Arsitektur

```
┌──────────── Vercel (Hobby, free) ────────────┐
│  apps/web (Next.js 15)                       │
│   • Landing: /  /start                       │
│   • Dashboard: /dashboard/...                │
│   • /dashboard/finance + /simulations/[id]   │
│                                               │
│  Server Components → Supabase Pooler          │
│  Client Components → VPS API (CORS)           │
└───────────────────────────────────────────────┘
        │                              │
        │ pg pooler :6543              │ HTTPS
        ▼                              ▼
┌─────────────┐                ┌─────────────────────────┐
│  Supabase   │                │  VPS (Ubuntu 24.04)     │
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
| VPS | NestJS API + BullMQ workers + Python scraper | Butuh long-running process untuk worker AI + Playwright scraper |
| Supabase | Postgres + Auth | Sudah managed, free tier 500MB |
| Upstash | Redis (BullMQ queue) | Free tier 10k commands/day |
| NVIDIA NIM | LLM inference (9 agents) | External API, gratis untuk dev quota |

---

## Bagian 1 — Deploy Frontend ke Vercel

### 1.1 Connect repo

1. Buka https://vercel.com → Sign in dengan GitHub.
2. **Add New** → **Project** → pilih repo `finetune-agent`.
3. Di **Configure Project**:
   - **Framework Preset**: Next.js (auto-detect)
   - **Root Directory**: klik **Edit** → pilih `apps/web`
   - **Build Command**: biarkan default (atau kosongkan manual override, biar `vercel.json` yang handle)
   - **Output Directory**: default
   - **Install Command**: default

### 1.2 Environment Variables di Vercel

via **Settings → Environment Variables** (apply ke Production + Preview + Development):

| Variable | Value | Catatan |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.xxx:[PASSWORD]@aws-0-region.pooler.supabase.co:6543/postgres?pgbouncer=true` | **Pooler URL port 6543**, wajib pakai pgBouncer biar gak kebanjiran koneksi dari serverless |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | dari Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | dari Supabase dashboard (anon public key) |
| `NEXT_PUBLIC_API_URL` | `http://<VPS-IP>:3001` | IP VPS (isi setelah Bagian 2 selesai) |

#### Kenapa Pooler URL?
Vercel functions = serverless (Lambda). Tiap function instance punya pg pool sendiri. Tanpa pooler, ratusan concurrent Lambda → ribuan koneksi Postgres → Supabase reject. **Supabase Transaction Pooler** (pgBouncer port 6543) handle ini natively.

Cara dapat Pooler URL:
1. Supabase dashboard → project → **Settings → Database**
2. Cari **Connection pooling** → mode **Transaction**
3. Copy URL — bentuknya `postgresql://postgres.xxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres`
4. Tambahkan `?pgbouncer=true` di akhir

### 1.3 Deploy

Klik **Deploy**. Build pertama ~3-5 menit.

---

## Bagian 2 — Deploy Backend ke VPS (SumoPod VPS)

### 2.1 Pilih VPS Plan

Di dashboard SumoPod → **Infrastructure → VPS → Create VPS**:

| Setting | Pilihan |
|---|---|
| Provider | Tencent |
| Region | Singapore 🇸🇬 |
| OS | Ubuntu Server 24.04 LTS |
| Plan | **2 vCPU, 4 GB RAM, 60 GB SSD — Rp 90.000/bulan** |

> **Kenapa 4 GB RAM?** Workers perlu memory buat 4 concurrent workers + Python scraper + AI agents. 2 GB cukup untuk coba-coba tapi riskan OOM pas finance simulation paralel.

### 2.2 Setup Awal VPS

Setelah VPS aktif, dapat IP + password via dashboard. SSH masuk:

```bash
ssh root@<VPS-IP>
# Masukin password dari dashboard
```

**Update system & install dependencies:**

```bash
apt update && apt upgrade -y
apt install -y curl wget git python3 python3-pip python3-venv

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v    # should be v22.x

# Install pnpm
npm install -g pnpm pm2
pnpm --version  # should be 9.x
```

### 2.3 Clone & Build

```bash
# Clone repo
git clone https://github.com/maulana-tech/finetune-agent.git /app
cd /app

# Setup Python virtual environment untuk scraper
cd apps/workers
python3 -m venv .venv
source .venv/bin/activate
pip install --no-cache-dir -r requirements.txt
deactivate
cd /app

# Install semua workspace dependencies
pnpm install --frozen-lockfile

# Build API + Workers (skip web — nanti di Vercel)
pnpm turbo build --filter=api --filter=workers
```

### 2.4 Environment Variables

Buat file `/app/.env`:

```bash
cat > /app/.env << 'EOF'
# DB — pakai direct URL port 5432 (VPS long-running, gak butuh pooler)
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres"

# Redis (Upstash)
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"

# AI
NVIDIA_API_KEY="nvapi-..."

# CORS — domain Vercel
ALLOWED_ORIGINS="https://utune-ai.vercel.app"
ALLOW_VERCEL_PREVIEWS="true"

# Port API
PORT=3001
EOF
```

### 2.5 Firewall

```bash
ufw allow 22/tcp        # SSH
ufw allow 3001/tcp      # API
ufw enable
```

### 2.6 Jalankan dengan PM2

```bash
# Start API
PORT=3001 NODE_ENV=production pm2 start node --name "api" -- apps/api/dist/main.js

# Start Workers
NODE_ENV=production pm2 start node --name "workers" -- apps/workers/dist/index.js

# Save PM2 config biar auto-start setelah reboot
pm2 save
pm2 startup
# (ikuti instruksi systemctl yang muncul)
```

Cek status:

```bash
pm2 status
pm2 logs --lines 20
```

### 2.7 Setup Nginx (Reverse Proxy + SSL — opsional)

Kalo mau akses API via domain (bukan IP:3001):

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Buat config `/etc/nginx/sites-available/api`:

```nginx
server {
    listen 80;
    server_name api.domainkamu.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.domainkamu.com
```

> **Skip step ini kalo mau pake IP langsung** — `NEXT_PUBLIC_API_URL=http://<VPS-IP>:3001` juga works.

### 2.8 Auto-restart Worker (systemd — optional)

Biar worker otomatis restart kalo crash, selain PM2 udah handle ini secara default.

---

## Bagian 3 — Wire-up Vercel → VPS

1. Dapetin IP VPS: `curl ifconfig.me` atau lihat di dashboard SumoPod.
2. Update **Vercel Environment Variables**:
   - `NEXT_PUBLIC_API_URL` → `http://<VPS-IP>:3001` (atau `https://api.domainkamu.com` kalo pake SSL)
3. Di VPS, pastiin `ALLOWED_ORIGINS` di `/app/.env` includes Vercel domain.
4. Restart API di VPS setelah update `.env`:
   ```bash
   pm2 restart api
   ```

---

## Bagian 4 — Update & Redeploy

### Update code & rebuild di VPS:

```bash
cd /app
git pull
pnpm install --frozen-lockfile
pnpm turbo build --filter=api --filter=workers
pm2 restart all
```

### Update Vercel:
Push ke GitHub → Vercel auto-deploy.

---

## Verifikasi

### Smoke test
1. `https://utune-ai.vercel.app/` → landing page render ✓
2. `https://utune-ai.vercel.app/dashboard` → dashboard render ✓
3. Cek API: `curl http://<VPS-IP>:3001/api/health` → return JSON ✓
4. Cek worker log: `pm2 logs workers --lines 20` → worker connected + waiting jobs ✓

### Jika error CORS
- Pastikan `ALLOWED_ORIGINS` includes `https://utune-ai.vercel.app`
- Restart API: `pm2 restart api`

### Jika DB connection error
- Vercel: pastikan pakai **pooler URL port 6543** + `?pgbouncer=true`
- VPS: bisa pakai direct URL port 5432

---

## Monitoring

```bash
pm2 status              # status semua process
pm2 logs api --lines 50 # log API
pm2 logs workers        # log workers (real-time)
pm2 monit               # dashboard CPU/memory tiap process
```

Filter log worker:
```bash
pm2 logs workers --lines 100 | grep -E "\[FinanceSim\]|\[OrchestratedAI\]|\[ScrapeWorker\]"
```

### Cek memory usage:
```bash
free -h
pm2 prettylist | grep -E "name|memory"
```

---

## Cost Breakdown

| Item | Biaya | Catatan |
|---|---|---|
| VPS (2 vCPU, 4GB, 60GB) | Rp 90.000/bulan | Tencent Singapore |
| Vercel Hobby | Gratis | 100 GB-hours / 1M req |
| Supabase Free | Gratis | 500MB DB, 2GB bandwidth |
| Upstash Free | Gratis | 10k cmd/day |
| NVIDIA NIM | Gratis | Dev quota |
| **Total/bulan** | **Rp 90.000** | |
| **Budget** | **Rp 1.550.000** | **≈ 17 bulan** |

---

## Tips Hackathon

### Seed data sebelum demo
Demo dengan dashboard kosong = boring. Sebelum demo:
1. `pnpm db:seed` (kalau seed script ada) — atau insert manual
2. Bikin 30-50 transactions realistic (mix income/expense/invoice, span 3-6 bulan)
3. Jalankan 1-2 simulations preset biar history terisi

### Iterasi cepat
- Vercel auto-deploy tiap push ke main
- VPS update: `git pull && pnpm install && pnpm turbo build --filter=api --filter=workers && pm2 restart all`

### Yang sengaja TIDAK dilakukan untuk hackathon
- ❌ Auth Supabase wiring — dummy `DEV_WORKSPACE_ID` cukup
- ❌ Worker concurrency tuning — default 1 OK
- ❌ Caching layer — Next.js edge cache + Supabase query cache cukup
- ❌ Monitoring infrastructure — PM2 + DB queries cukup
