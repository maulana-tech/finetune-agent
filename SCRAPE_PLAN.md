# Scraping Improvement Plan

## Status Implementasi

| Item | Status |
|---|---|
| Fase 1A — ganti fixed delay → selector wait | ✅ Done |
| Fase 1B — smart scroll early exit | ✅ Done |
| Fase 1C — parallel email scraping | ✅ Done |
| WhatsApp extraction (bonus) | ✅ Done |
| Fase 2C — coords fallback | ✅ Done |
| Fase 2A — kategori asli dari panel | ✅ Done |
| Fase 2D — deduplication di worker | ✅ Done |
| Field `whatsapp` di schema leads | ✅ Done — perlu `pnpm db:generate && pnpm db:migrate` |
| Fase 1D — flag `--no-email` | ❌ Tidak jadi — diganti parallel (email + WA selalu ada) |
| Fase 3A — tambah kolom startedAt/completedAt ke jobs | ⏳ Belum |
| Fase 3B — UI tabel di scrapes page | ⏳ Belum |

---



> Goal: scraper lebih cepat, hasil lebih akurat, UI scrapes page jadi tabel yang informatif.

---

## Diagnosis — Masalah Sekarang

### 1. Kecepatan (lambat)

Bottleneck utama di `maps_scraper.py`:

| Bottleneck | Waktu saat ini | Keterangan |
|---|---|---|
| `wait_for_timeout(2500)` per card click | 2.5s × N leads | Nunggu panel terbuka, fixed delay |
| `wait_for_timeout(1000)` per card close | 1s × N leads | Nunggu panel nutup |
| `wait_for_timeout(1500)` × 6 scroll | 9s total | Fixed scroll loop |
| Email scraping sequential per website | 8s timeout × 7 paths | Tiap lead bisa +56s |
| **Total untuk 10 leads** | **~5–10 menit** | Terlalu lama |

### 2. Akurasi (data kurang sesuai)

| Field | Masalah |
|---|---|
| `category` | Selalu isi dengan search query, bukan kategori bisnis asli dari Google Maps |
| `address` | Diambil dari index baris innerText (baris ke-2 atau ke-3) → fragile, bisa salah |
| `lat/lng` | Regex dari URL `!3d...!4d...` → bisa kosong kalau format URL berubah |
| `emails` | Sequential HTTP ke 7 path, 8s timeout masing-masing → lambat dan bisa empty |
| Rating/review | Tidak di-scrape sama sekali |
| Duplikat | Tidak ada dedup — run dua kali query sama = leads ganda di DB |
| Error handling | Exception per-card di-silenced tanpa log → susah debug |

### 3. UI Scrapes Page (kurang informatif)

Tampilan sekarang pakai card list, tidak ada:
- Kolom Duration (berapa lama scraping)
- Kolom Limit (berapa yang diminta vs didapat)
- Action "Re-run" atau "View Leads"
- Sorting
- Started At timestamp yang jelas

---

## Plan — 3 Fase

---

### Fase 1 — Kecepatan (Priority: HIGH)

**Target: 10 leads < 45 detik**

#### 1A. Ganti fixed delay → selector-based wait

```python
# SEKARANG (lambat):
link.click()
page.wait_for_timeout(2500)

# GANTI dengan:
link.click()
page.wait_for_selector('[data-item-id^="phone:tel:"], [data-item-id="authority"]',
                       timeout=3000, state='attached')
```

Saving: ~1s per lead (dari 2.5s ke ~1.5s rata-rata)

#### 1B. Kurangi scroll wait

```python
# SEKARANG:
page.wait_for_timeout(1500)  # × 6 = 9s

# GANTI: scroll sampai card count stabil
prev_count = 0
for _ in range(8):
    feed.evaluate('el => el.scrollBy(0, el.scrollHeight)')
    page.wait_for_timeout(800)
    curr_count = len(page.query_selector_all('div[role="article"]'))
    if curr_count == prev_count:
        break  # tidak ada card baru, stop scroll
    prev_count = curr_count
```

Saving: bisa potong dari 9s ke 3–4s kalau results sedikit

#### 1C. Parallelkan email scraping

Email scraping sekarang sequential **per lead**. Ubah menjadi:

1. Kumpulkan semua website dari semua leads dulu
2. Scrape email semua website secara **parallel** pakai `ThreadPoolExecutor`

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def scrape_all_emails(website_map: dict[str, str]) -> dict[str, list]:
    """website_map: {lead_name: website_url}"""
    results = {}
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(scrape_emails_from_website, url): name
            for name, url in website_map.items() if url
        }
        for future in as_completed(futures, timeout=30):
            name = futures[future]
            try:
                results[name] = future.result()
            except Exception:
                results[name] = []
    return results
```

Saving: dari sequential ke parallel → 5× lebih cepat untuk email enrichment

#### 1D. Jadikan email scraping opsional (flag)

Tambah argumen `--no-email` ke scraper. Default: skip email scraping (jauh lebih cepat). Aktifkan hanya untuk Enriched tier.

```python
# CLI args
parser.add_argument('--no-email', action='store_true')
```

Worker kirim flag sesuai plan user:
```typescript
// scrape.worker.ts
const args = [scriptPath, query, String(limit)];
if (!payload.enrichEmail) args.push('--no-email');
```

Saving: potong 80% total waktu untuk default use case

#### 1E. Kurangi timeout close panel

```python
# SEKARANG:
page.wait_for_timeout(1000)

# GANTI:
page.wait_for_timeout(400)
```

#### Summary kecepatan setelah Fase 1

| Scenario | Sebelum | Setelah |
|---|---|---|
| 10 leads, no email | ~5 min | **~30–45s** |
| 10 leads, with email | ~10 min | **~2–3 min** |
| 50 leads, no email | ~25 min | **~3–4 min** |

---

### Fase 2 — Akurasi (Priority: MEDIUM)

#### 2A. Extract kategori asli dari panel

```python
# Di dalam panel extraction:
cat_el = panel.query_selector('button[jsaction*="category"]')
if not cat_el:
    cat_el = panel.query_selector('[data-item-id="category"]')
category = _val(cat_el) if cat_el else query  # fallback ke query
```

#### 2B. Extract rating dan review count

```python
# Dari card (list view, sebelum click):
rating_el = card.query_selector('span[aria-label*="bintang"], span[aria-label*="stars"]')
rating = _val(rating_el, 'aria-label') if rating_el else ''
# Parse "4.5 bintang" → 4.5

review_el = card.query_selector('span[aria-label*="ulasan"], span[aria-label*="reviews"]')
review_count = _val(review_el, 'aria-label') if review_el else ''
```

Tambah field `rating` dan `reviewCount` ke output JSON dan leads schema.

#### 2C. Koordinat fallback lebih robust

```python
def coords_from_href(href: str):
    # Primary: !3d!4d format
    m = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', href)
    if m:
        return float(m.group(1)), float(m.group(2))
    # Fallback: @lat,lng format
    m2 = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', href)
    if m2:
        return float(m2.group(1)), float(m2.group(2))
    return None, None
```

#### 2D. Deduplication sebelum insert

Di `scrape.worker.ts`, cek apakah lead dengan nama + address yang sama sudah ada:

```typescript
import { and, eq, ilike } from 'drizzle-orm';

// Sebelum insert:
const existing = await db
  .select({ id: leads.id })
  .from(leads)
  .where(
    and(
      eq(leads.workspaceId, workspaceId),
      ilike(leads.name, res.name as string),
    )
  )
  .limit(1);

if (existing.length > 0) {
  console.log(`[Scrape] Skip duplicate: ${res.name}`);
  continue;
}
```

#### 2E. Log error per card (jangan silent)

```python
except Exception as e:
    print(f"[WARN] Card error ({name}): {e}", file=sys.stderr)
    continue  # lanjut ke card berikutnya, tapi error ke-log
```

Worker forward stderr ke console sehingga bisa debug dari logs.

---

### Fase 3 — Schema Jobs + UI Tabel (Priority: MEDIUM)

#### 3A. Tambah field ke tabel `jobs`

```typescript
// packages/db/src/schema/jobs.ts — tambah kolom:
startedAt:    timestamp('started_at'),           // worker pickup time
completedAt:  timestamp('completed_at'),          // done time
limit:        integer('limit').default(10),       // berapa leads diminta
errorMessage: text('error_message'),              // pesan error kalau failed
```

Setelah tambah kolom, jalankan:
```bash
pnpm db:generate
pnpm db:migrate
```

Worker update `startedAt` saat status → processing, `completedAt` saat status → completed/failed.

#### 3B. Ubah scrapes page jadi tabel

**Kolom tabel:**

| # | Query | Status | Diminta | Ditemukan | Mulai | Durasi | Aksi |
|---|---|---|---|---|---|---|---|
| 1 | Coffee Shop Jakarta | ✅ COMPLETED | 10 | 8 | 5m ago | 38s | Re-run |
| 2 | Dentist Surabaya | 🔵 PROCESSING | 20 | — | 1m ago | — | — |
| 3 | Resto Bali | ❌ FAILED | 10 | 0 | 2h ago | 12s | Re-run |

**Struktur HTML:**
```tsx
<table className="w-full text-xs border-collapse">
  <thead>
    <tr className="border-b border-border">
      <th>#</th>
      <th>Query</th>
      <th>Status</th>
      <th>Diminta</th>
      <th>Ditemukan</th>
      <th>Mulai</th>
      <th>Durasi</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {jobs.map((job, i) => (
      <tr key={job.id} className="border-b border-border hover:bg-accent/20">
        <td>{i + 1}</td>
        <td className="font-bold">{job.query}</td>
        <td><StatusBadge status={job.status} /></td>
        <td>{job.limit ?? '—'}</td>
        <td>{job.resultCount ?? '—'}</td>
        <td>{timeAgo(job.createdAt)}</td>
        <td>{duration(job.startedAt, job.completedAt)}</td>
        <td><RerunButton query={job.query} /></td>
      </tr>
    ))}
  </tbody>
</table>
```

**Action "Re-run":**
Client component yang POST `/jobs/scrape` dengan query yang sama, lalu redirect ke `/dashboard/scrapes`.

---

## File Touchpoints

### Fase 1 & 2 — Scraper

| File | Perubahan |
|---|---|
| `apps/workers/src/python/maps_scraper.py` | Semua optimasi kecepatan + akurasi |
| `apps/workers/src/queues/scrape.worker.ts` | Pass `--no-email` flag, tambah dedup, update startedAt/completedAt |
| `packages/shared/src/index.ts` | Tambah `enrichEmail?: boolean` ke `ScrapeJobPayload` |

### Fase 3 — Schema + UI

| File | Perubahan |
|---|---|
| `packages/db/src/schema/jobs.ts` | Tambah `startedAt`, `completedAt`, `limit`, `errorMessage` |
| `packages/db/src/schema/leads.ts` | Tambah `rating`, `reviewCount` (opsional) |
| `apps/web/src/app/(app)/dashboard/scrapes/page.tsx` | Ubah dari card list ke tabel |
| `apps/api/src/jobs/jobs.controller.ts` | Tambah POST `/jobs/re-run` |

---

## Urutan Implementasi yang Disarankan

```
1. Fase 1C + 1D  →  parallelkan email + jadikan opsional   (impact terbesar, ~1 jam)
2. Fase 1A + 1B  →  replace fixed delay + smarter scroll   (~30 menit)
3. Fase 2D       →  deduplication di worker                (~20 menit)
4. Fase 3A       →  tambah kolom DB + migrate              (~15 menit)
5. Fase 3B       →  ubah UI ke tabel                       (~45 menit)
6. Fase 2A–2C    →  akurasi data (category, rating, coords) (~1 jam)
```

Total estimasi: ~4 jam untuk semua fase.

---

## Quick Wins (bisa langsung dikerjain sekarang)

Tanpa perlu schema migration apapun:

1. `wait_for_timeout(2500)` → `1000` (1 baris, -15s per 10 leads)
2. `wait_for_timeout(1000)` → `400` (1 baris, -6s per 10 leads)
3. `wait_for_timeout(1500)` scroll + early exit (10 baris, -5s average)
4. Tambah `--no-email` flag (30 baris, -80% waktu default)

**Total quick win: 10 leads dari ~5 menit → ~45 detik.**
