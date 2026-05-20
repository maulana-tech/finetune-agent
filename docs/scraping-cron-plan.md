# Scraping Cron — Implementation Plan (v2)

## Overview

Pre-scrape Google Maps leads by category via cron job. Store raw data in DB.
User searches via SQL agent — zero LLM on scraped leads until user clicks detail.

---

## Arsitektur

```
┌──────────────┐      ┌───────────────────┐      ┌──────────────────┐
│  Cron tick   │──→   │  scrape-scheduler  │──→   │  scrape-map queue │
│  (tiap 15 m) │      │  (baca dari DB)    │      │  (BullMQ)         │
└──────────────┘      └───────────────────┘      └────────┬─────────┘
                                                           │
                                                    spawns Python
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  maps_scraper.py │
                                                  │  (Google Maps)   │
                                                  └────────┬─────────┘
                                                           │
                                                    INSERT ke DB
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  leads table     │
                                                  └──────────────────┘
```

---

## Perubahan

### 1. DB — Tabel `scrape_schedules`

**File baru:** `packages/db/src/schema/scrape_schedules.ts`

```ts
import { pgTable, text, timestamp, uuid, integer, boolean } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces';

export const scrapeSchedules = pgTable('scrape_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  category: text('category').notNull(),       // e.g. "Kesehatan"
  query: text('query').notNull(),              // e.g. "klinik"
  limitPerRun: integer('limit_per_run').notNull().default(30),
  isActive: boolean('is_active').notNull().default(true),
  intervalMinutes: integer('interval_minutes').notNull().default(720),  // 12 jam default
  lastRunAt: timestamp('last_run_at'),
  lastRunStatus: text('last_run_status'),       // 'success' | 'failed'
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  retryDelayMinutes: integer('retry_delay_minutes').notNull().default(60),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**File update:** `packages/db/src/schema/all.ts` — export `scrapeSchedules`

**Migration:**
```bash
pnpm db:generate && pnpm db:migrate
```

### 2. DB — Tambah `maps_url` di `leads`

**File:** `packages/db/src/schema/leads.ts`

```ts
mapsUrl: text('maps_url'),
```

### 3. Python Scraper — Extract `maps_url`

**File:** `apps/workers/src/python/maps_scraper.py`

Tambah `maps_url` di output:
```python
results.append({
    "name": name,
    "address": '',
    "phone": '',
    "website": '',
    "maps_url": href,       # Google Maps place link
    "lat": lat,
    "lng": lng,
    "category": query,
})
```

### 4. Scrape Worker — Pure, tanpa LLM

**File:** `apps/workers/src/queues/scrape.worker.ts`

- Hapus `orchestratedAiQueue` (Queue + dispatch loop)
- Hapus `aiQueue`
- Worker jadi: scrape → insert → update `last_run_at` + `last_run_status`
- Terima payload dengan `scheduleId` biar cron scheduler bisa update status scheduling

### 5. Cron Scheduler — Baru (baca dari DB)

**File baru:** `apps/workers/src/cron/scrape-scheduler.ts`

```ts
/**
 * Scheduler ini jalan tiap 15 menit (node-cron).
 *
 * 1. SELECT * FROM scrape_schedules WHERE is_active = true
 *    AND (last_run_at IS NULL
 *         OR last_run_at + interval_minutes * INTERVAL '1 minute' < now())
 *    AND (retry_count < max_retries
 *         OR last_run_at IS NULL)
 *    ORDER BY
 *      CASE WHEN last_run_at IS NULL THEN 0 ELSE 1 END,  -- belum pernah jalan duluan
 *      last_run_at ASC NULLS FIRST
 *    LIMIT 1
 *
 * 2. Kalau ada yang perlu dijalanin:
 *    - Queue job ke scrape-map queue (pakai BullMQ)
 *    - Payload: { workspaceId, query, limit, scheduleId }
 *
 * 3. Worker selesai → update last_run_at + reset retry_count (= 0)
 *    Worker gagal → increment retry_count
 *    Kalau retry_count >= max_retries → is_active = false (auto-disable)
 *
 * 4. Tidak ada kategori hardcoded — semua dari DB.
 *    User tinggal INSERT ke scrape_schedules via API.
 */
```

**Dependency:** `node-cron` di `apps/workers/package.json`

### 6. API CRUD — Scrape Schedules

**File baru:** `apps/api/src/scrape-schedules/scrape-schedules.module.ts`
**File baru:** `apps/api/src/scrape-schedules/scrape-schedules.controller.ts`
**File baru:** `apps/api/src/scrape-schedules/scrape-schedules.service.ts`

Endpoint:

| Method | Path | Description |
|---|---|---|
| `GET` | `/scrape-schedules` | List semua schedule |
| `POST` | `/scrape-schedules` | Tambah schedule baru |
| `PUT` | `/scrape-schedules/:id` | Edit schedule (interval, limit, active) |
| `DELETE` | `/scrape-schedules/:id` | Hapus schedule |
| `POST` | `/scrape-schedules/:id/run-now` | Trigger manual scraping untuk 1 kategori |

### 7. Search API + SQL Agent

**File baru:** `apps/api/src/leads/leads.module.ts`
**File baru:** `apps/api/src/leads/leads.controller.ts`
**File baru:** `apps/api/src/leads/leads.service.ts`

```http
GET /leads/search?q=klinik gigi jakarta&limit=20
```

Flow:
```
GET /leads/search?q=...
  → SQL Agent (generateObject via @repo/ai, model 8B)
     Input: natural language query
     Output: { sql: "SELECT ... FROM leads WHERE ..." }
  → Execute via drizzle/db
  → Return JSON results
```

---

## Retry & Limit Mechanism

**Limit per run:** `scrape_schedules.limit_per_run` — default 30. Bisa diubah per kategori. Berguna untuk mengontrol bandwidth.

**Retry logic:**

```
Worker scrape gagal (timeout/error)
  → Worker throw error
  → BullMQ job failed
  → Scheduler detect gagal via last_run_status != 'success'
  → Jika retry_count < max_retries:
      → Tunggu retry_delay_minutes
      → Scheduler akan pick up lagi (karena last_run_at + interval still < now)
  → Jika retry_count >= max_retries:
      → is_active = false (auto-disable)
```

**Anti banjir:**
- Scheduler cuma ambil 1 schedule per tick (tiap 15 menit) — jadi gak bakal scrape 12 kategori sekaligus
- Maksimal scraping ~4-6x per jam (1 per 15 menit)
- Kalau perlu lebih cepet, turunin `interval_minutes` per kategori

---

## Ringkasan File

| File | Status |
|---|---|
| `packages/db/src/schema/scrape_schedules.ts` | 🆕 |
| `packages/db/src/schema/all.ts` | ✏️ export scrape_schedules |
| `packages/db/src/schema/leads.ts` | ✏️ tambah `mapsUrl` |
| `apps/workers/src/python/maps_scraper.py` | ✏️ tambah `maps_url` |
| `apps/workers/src/queues/scrape.worker.ts` | ✏️ pure scrape, update schedule status |
| `apps/workers/src/cron/scrape-scheduler.ts` | 🆕 cron baca dari DB |
| `apps/workers/src/index.ts` | ✏️ panggil startScrapeScheduler |
| `apps/workers/package.json` | ✏️ tambah `node-cron` |
| `apps/api/src/scrape-schedules/` | 🆕 CRUD controller + service |
| `apps/api/src/leads/` | 🆕 search endpoint + SQL agent |

## Urutan Implementasi

1. DB schema — `scrape_schedules` + `leads.maps_url`
2. Python scraper — `maps_url`
3. Scrape worker — hapus LLM, update schedule status
4. Cron scheduler — baca dari DB, retry logic
5. API CRUD — scrape schedules
6. Search endpoint + SQL agent
7. Seed default schedules (12 kategori)
8. Test: `pnpm typecheck && pnpm build`
