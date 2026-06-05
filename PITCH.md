# Pitch Deck Hackathon — uTune AI

> **10 slide · ~16–18 menit · Target: juri hackathon (teknis + bisnis)**

---

## 🗺️ Peta Kriteria Juri → Slide

| Kriteria | Slide / Bagian |
|----------|----------------|
| **Reasoning Agent** — logika & kualitas penalaran | Slide 6 + Demo (agent_logs trace) |
| **Kolaborasi Multi-Agent** — efektivitas sistem | Slide 6 (3 pola koordinasi) |
| **Dampak Riil** — nilai bisnis, revenue, efisiensi | Slide 2, 3, 8 |
| **Arsitektur Sistem** — kejelasan arsitektur | Slide 7 + B6 (flow diagram) |
| **Reproducibility** — kemudahan replikasi & deploy | Slide 7 + B7 |
| **Komunikasi** — penyampaian yang jelas | Slide 1–5 (struktur: masalah → solusi → bukti) |
| **Originalitas** — keunikan solusi | Slide 4 + B3 (competitive) |
| **Kesiapan Demo** — kelancaran live demo | Skrip Demo |
| **Antusiasme** — keyakinan & profesionalisme | Slide 1, 4, 10 (tagline) |
| **Pemahaman Masalah** — kedalaman problem statement | Slide 2, 3 |

---

## Slide 1 — Cover

**Judul:** uTune AI
**Tagline:** Temukan. Analisis. Tutup. — Platform inteligensi sales B2B berbasis AI untuk Asia Tenggara.
**Visual:** Screenshot full-bleed dashboard peta — pin lead tersebar di kota Indonesia, panel detail terbuka di kanan
**Bar bawah:** Nama tim · Nama hackathon · Tanggal · `utune-ai.vercel.app`

---

## Slide 2 — Masalah: Cerita Nyata
*→ Kriteria: Pemahaman Masalah, Komunikasi*

**Judul:** Begini cara prospekting B2B masih dilakukan di 2026.

**Narasi:**
> "Kenalkan Raka. Dia SDR di startup SaaS Jakarta. Tugas Senin-nya: temukan 50 klinik gigi di Surabaya untuk dipitch software booking mereka.
>
> Dia buka Google Maps. Cari. Scroll. Salin nama, alamat, nomor telepon — satu per satu — ke spreadsheet.
>
> Tiga jam kemudian: 23 lead, nol ide mana yang mampu beli produknya, dan template email generik yang akan mendarat di folder spam semua orang."

**Visual:** Google Maps + spreadsheet berdampingan (momen "sebelum")

**Poin di bawah gambar:**
> *Tim sales di Indonesia habiskan 65% harinya untuk pekerjaan non-selling. Raka bukan pengecualian — dia adalah aturannya.*

---

## Slide 3 — Masalah di Skala
*→ Kriteria: Pemahaman Masalah, Dampak Riil*

**Judul:** Lead Gen B2B: Manual, Terfragmentasi, Tanpa Inteligensi

**Tiga akar masalah:**

| | Masalah | Dampak Nyata |
|--|---------|--------------|
| 📋 | Scraper memberi daftar, bukan inteligensi | Tidak tahu lead mana layak dihubungi — semua diperlakukan sama |
| 🗺️ | CRM adalah tampilan list — rep lapangan buta arah | Wilayah tidak tercakup optimal, kunjungan terbuang |
| ✉️ | Cold outreach generik, tidak kontekstual | Pipeline macet, kuota tidak tercapai, <1% reply rate |

**4 statistik:**

| Statistik | Sumber |
|-----------|--------|
| **65 Juta+** UMKM di Indonesia — semesta prospek yang bisa dijangkau | BPS / World Bank |
| **65%** waktu rep dihabiskan untuk pekerjaan non-selling | McKinsey |
| **<1%** rata-rata reply rate cold email generik | Salesforce Research |
| **3–5 jam/hari** hilang untuk riset manual & entry data | HubSpot |

**Kesimpulan:** Apollo.io harganya $99/bulan dalam USD, tanpa Bahasa Indonesia, tanpa CRM geografis. Tidak ada solusi yang dibangun native untuk pasar SEA.

---

## Slide 4 — Pertanyaan Pivot
*→ Kriteria: Originalitas, Antusiasme*

**Satu slide, teks besar di tengah:**

> **Bagaimana jika setiap lead datang sudah dianalisis oleh tim spesialis AI —**
> **analis keuangan, ahli strategi pasar, dan konsultan sales —**
> **semua bekerja paralel, dalam waktu kurang dari 10 detik?**

**Visual:** Panah dari "spreadsheet + Google Maps manual" → "peta dengan lead ber-skor AI, diperkaya kontak, siap dihubungi"

**Ini bukan chatbot. Ini orkestrasi 20 agen khusus yang bekerja seperti departemen riset — otomatis, transparan, dan bisa diaudit.**

---

## Slide 5 — Gambaran Solusi
*→ Kriteria: Komunikasi, Dampak Riil*

**Judul:** uTune AI — Platform Inteligensi B2B Berbasis Peta

**Tiga pilar:**

**🔍 Business Finder**
Cari berdasarkan industri + geografi. Gambar poligon, pilih kategori, dapatkan ratusan lead terverifikasi — otomatis di-scrape dari Google Maps lengkap dengan email dan WhatsApp.

**🗺️ Mapped CRM**
Setiap lead adalah pin. Kelola pipeline secara geografis — filter berdasarkan stage, skor AI, atau wilayah. Peta tidak pernah tersembunyi; itulah produknya.

**🤖 Multi-Agent AI**
20 agen AI khusus dalam 3 pipeline — lead scoring, simulasi keuangan, analisis pasar. Setiap keputusan dicatat dengan reasoning trace lengkap. Tidak ada kotak hitam.

**Satu alur kerja end-to-end:**
```
scrape otomatis → perkaya kontak → analisis AI → cold email personal → kunjungi → tutup
```

**Nilai yang langsung terasa:**
- Raka dapat 50 lead dalam 45 detik, bukan 3 jam
- Setiap lead sudah tahu: prioritas A/B/C/D, potensi konversi, pain point spesifik
- Cold email di-generate dari riset nyata, bukan template

---

## Slide 6 — Engine AI: Sistem Multi-Agent
*→ Kriteria: Reasoning Agent, Kolaborasi Multi-Agent*

**Judul:** Bukan satu AI. Tim terkoordinasi 20 spesialis yang berargumen, berkolaborasi, dan memberi keputusan.

---

### Tiga Pola Kolaborasi

**Pola 1 — Sequential dengan Konteks Diwariskan (Lead Scoring)**

Setiap agen menerima output agen sebelumnya. Penalaran menumpuk, bukan diulang dari nol:

```
Raw data scrape
      │
      ▼
[Extractor Agent]  ← "Saya ekstrak profil bisnis terstruktur"
      │ konteks →
      ▼
[Finance Agent]    ← "Berdasarkan profil itu, saya nilai kapasitas anggaran mereka"
      │ konteks →
      ▼
[Marketing Agent]  ← "Berdasarkan profil + kondisi keuangan, ini pain point & channel terbaik"
      │ konteks →
      ▼
[Strategy Agent]   ← "Mensintesis semua — prioritas A/B/C/D + rekomendasi tindakan spesifik"
```

**Mengapa sequential?** Karena setiap analisis bergantung pada yang sebelumnya. Finance Agent tidak bisa nilai anggaran tanpa tahu profil bisnisnya terlebih dulu.

---

**Pola 2 — Parallel Fan-Out + Synthesizer (Simulasi Keuangan & Analisis Pasar)**

Agen-agen independen berjalan bersamaan, lalu synthesizer merekonsiliasi perbedaan perspektif:

```
                    ┌── Owner Agent    ── strategi pendapatan, margin
Skenario input  ──► ├── Supplier Agent ── tekanan supply chain, inventori    ──► Synthesizer
                    ├── Customer Agent ── sensitivitas harga, elastisitas              │
                    └── Bank Agent     ── runway, debt service, kredit           Forecast cashflow
                                                                                 + level risiko
```

**Mengapa paralel?** Perspektif keuangan bersifat independen — Owner, Supplier, Customer, Bank masing-masing punya sudut pandang berbeda pada skenario yang sama. Paralel juga ~4× lebih cepat.

Pola yang sama untuk **Analisis Pasar**: Competitor, Trend, Risk, Demand berjalan paralel → Synthesizer menghasilkan skor peluang.

---

**Pola 3 — Dynamic Handoff via Swarm Runtime**

Semua pipeline dijalankan di atas Swarm runtime kustom. Agen tidak hanya mengeksekusi — mereka **memutuskan siapa agen selanjutnya**:

```typescript
// Setiap agen bisa emit salah satu dari tiga instruksi:
_handoff:  { nextAgent, contextToPass, reason }   // routing berurutan
_parallel: { agents, groupKey, nextAfterAll }      // fan-out paralel
_toolCall: { toolName, params }                    // sub-loop tool use
```

Koordinator memutuskan alur, bukan hardcoded di orchestrator. Ini yang membuat sistem bisa diperluas tanpa mengubah runtime.

---

### Transparansi Penalaran (Reasoning Agent)

Setiap langkah agent dicatat ke tabel `agent_logs`:

```
agent_logs
├── agentName       "strategy_agent"
├── input           konteks dari 3 agen sebelumnya
├── output          {priorityTier: "A", conversionProb: 0.78, action: "Hubungi minggu ini..."}
├── reasoning       "Bisnis ini punya rating 4.2, email terverifikasi, kategori klinik gigi
│                    di Surabaya. Finance Agent menunjukkan margin 35%+. Marketing Agent
│                    mengidentifikasi pain point: booking masih via telepon. Rekomendasi:
│                    pitch fitur booking online, prioritas tinggi."
├── handoffFrom     "marketing_agent"
├── parallelGroup   null
└── tokenUsage      { input: 1847, output: 312 }
```

**Reasoning tidak disembunyikan** — bisa dilihat langsung di UI per lead. Juri bisa audit kenapa agen merekomendasikan prioritas A vs D.

---

**Ringkasan:**
> **20 agen · 3 pipeline · 3 pola kolaborasi · Swarm runtime dengan dynamic handoff**
> Model: Llama 3.1 70B (analisis mendalam) · Llama 3.1 8B (ekstraksi cepat/SQL) via NVIDIA NIM

---

## [DEMO LANGSUNG — 5–7 menit]
*→ Kriteria: Kesiapan Demo*

**Skrip (urutan terbukti, tidak ada improvisasi):**

| # | Aksi | Yang Dibuktikan |
|---|------|-----------------|
| 1 | Buka dashboard peta — pin lead tersebar di Jakarta | Product exists, peta berfungsi |
| 2 | Ketik "klinik gigi di Surabaya" → show progress scraping | Scrape real-time, bukan data dummy |
| 3 | Lead muncul di peta sebagai pin | End-to-end pipeline berjalan |
| 4 | Klik pin → panel detail (nama, alamat, telepon, email, WhatsApp) | Data enrichment berfungsi |
| 5 | Buka panel AI Score → tier A/B/C/D, probabilitas konversi | Reasoning Agent: output terstruktur |
| 6 | Tampilkan `agent_logs` — reasoning trace Finance, Marketing, Strategy | Reasoning transparan, bisa diaudit |
| 7 | Tampilkan cold email yang di-generate AI untuk lead tersebut | Personalisasi dari analisis nyata |
| 8 | Tab AI Query → ketik "semua klinik yang punya email" → SQL → hasil | SQL Agent: bahasa natural → query |
| 9 | Buka Scrape History → daftar job + lead per scrape | Sistem terekam, bisa di-trace |

**Backup jika ada yang gagal:** Gunakan screenshot yang sudah disiapkan di folder `demo-backup/`.

---

## Slide 7 — Arsitektur Sistem
*→ Kriteria: Arsitektur Sistem, Reproducibility*

**Judul:** Arsitektur yang bisa dijelaskan dalam 60 detik.

**Alur sistem end-to-end:**

```
User input "klinik gigi Surabaya"
        │
        ▼
[Next.js Web App]  ──POST /jobs/scrape──►  [NestJS API]
                                                │
                                         push to BullMQ
                                                │
                                                ▼
                                       [scrape-map queue]
                                                │
                                                ▼
                                    [Scrape Worker: TypeScript]
                                                │
                                    spawn child_process
                                                │
                                                ▼
                                    [Python Playwright Scraper]
                                    parallel card scraping +
                                    ThreadPoolExecutor email/WA
                                                │
                                    JSON output → parse → DB insert
                                                │
                                                ▼
                                    [orchestrated-ai-queue]
                                    (1 job per lead)
                                                │
                                                ▼
                                    [AI Worker: Swarm Runtime]
                                    Extractor → Finance → Marketing
                                    → Strategy (+ parallel pipelines)
                                                │
                                    agent_logs + lead_scores
                                                │
                                                ▼
                                    [Next.js] polling → UI update
```

**Stack per lapisan:**

```
Frontend:  Next.js 15 · React 19 · MapLibre GL JS · Tailwind v4 · Zustand
Backend:   NestJS 11 · BullMQ + Redis · 5 antrian async
Workers:   TypeScript (tsx) + Python (Playwright) · PM2 multi-process
AI:        NVIDIA NIM · Llama 3.1 70B + 8B · Vercel AI SDK · Swarm runtime kustom
Data:      Supabase PostgreSQL · Drizzle ORM · agent_logs · lead_scores · swarm_runs
Deploy:    Docker container tunggal · PM2 · SumoPod PaaS + Vercel
```

**3 keputusan arsitektur kunci:**
- **API thin (queue bridge)** → tidak ada pekerjaan berat di request handler, tidak ada timeout
- **MapLibre** → nol biaya Google Maps API — scalable tanpa billing shock
- **BullMQ** → scrape + AI pipeline async dan retry-able, observable via dashboard

---

## Slide 8 — Model Bisnis + Traksi
*→ Kriteria: Dampak Riil*

**Judul:** Dibangun untuk 65 Juta+ UMKM Indonesia. Harga yang masuk akal.

### Nilai Nyata untuk Pengguna

| Sebelum uTune AI | Sesudah uTune AI |
|-----------------|------------------|
| 50 lead = 3 jam kerja manual | 50 lead = 45 detik |
| 0 informasi tentang kelayakan lead | Setiap lead: prioritas A/B/C/D + reasoning |
| Cold email generik, <1% reply | Email dari pain point nyata, kontekstual |
| CRM list — rep buta arah | Peta interaktif — lihat coverage sekilas |

### Tier Harga

| Tier | Harga | Lead/bln | Fitur |
|------|-------|----------|-------|
| **Gratis** | Rp 0 | 50 lead | Tampilan peta, scrape dasar |
| **Growth** | Rp 299.000/bln | 500 lead | AI scoring, pipeline CRM, email outreach |
| **Scale** | Rp 999.000/bln | Tak terbatas | Semua pipeline AI, simulasi keuangan, analisis pasar, akses API |

**Apollo.io (kompetitor terdekat):** $99/bln ≈ Rp 1,6jt — tanpa Bahasa Indonesia, tanpa CRM geografis, tanpa scraping lokal.

### Traksi Hackathon (dibangun dalam waktu singkat)

| Metrik | Nilai |
|--------|-------|
| Lead di-scrape & diperkaya | **50+ lintas 8+ kategori** |
| Agen AI dibangun & terhubung | **20 agen, 3 pipeline** |
| Kecepatan scrape (10 lead) | **~45 detik** (turun dari ~5 menit, 6× lebih cepat) |
| Scraping email + WhatsApp | **Paralel, ThreadPoolExecutor 6 worker** |
| Pipeline AI terekam | **Setiap langkah tercatat di agent_logs** |

### Kenapa Indonesia, Kenapa Sekarang
> **65 Juta+ UMKM** di Indonesia — terbesar ke-4 di dunia. Belum ada platform inteligensi B2B yang dibangun native untuk pasar ini: harga IDR, Bahasa Indonesia, WhatsApp-native, CRM berbasis peta.

---

## Slide 9 — Desain & Pengalaman Pengguna

**Dua dunia visual (disengaja, bukan kebetulan):**

**Dashboard → Brutalist**
Kontras tinggi, tanpa gradien dekoratif, tipografi monospace untuk data teknis. Prinsip: data *adalah* desainnya. Tidak ada elemen yang menghalangi informasi.

**Landing Page → Cinematic**
Sky-gradient scroll via Lenis. Aspirasional dan berbasis cerita — untuk memenangkan calon pelanggan, bukan engineer.

**Prinsip UI Peta:**
- Peta tidak pernah tersembunyi — setiap interaksi terjadi *di* atau *sekitar* peta
- Pin lead dikode warna berdasarkan stage pipeline (Prospecting/Qualified/Closed/dll)
- Cluster view untuk area padat
- Panel detail slide-over — tidak ada navigasi halaman, konteks tetap di peta

**Tipografi:**
- `Inter` — label UI, data dashboard
- `JetBrains Mono` — reasoning trace agen, output SQL, ID teknis
- `Lora` — header editorial landing page

---

## Slide 10 — CTA + Tanya Jawab

**Satu slide, minimal, terpusat:**

```
Coba langsung:
utune-ai.vercel.app

Demo AI Query (ketik ini):
→ "Semua klinik di Jakarta yang punya email"
→ "Lead yang ditambahkan minggu ini"

Dibangun dengan:
NVIDIA NIM · Next.js 15 · NestJS · MapLibre · Supabase

[Nama tim]
[QR code ke aplikasi live]
```

**Tagline penutup:**
> *Temukan. Analisis. Tutup. — Tim sales AI yang tidak pernah tidur.*

---

## Panduan Waktu

| Slide | Konten | Durasi |
|-------|--------|--------|
| 1 | Cover | 30 detik |
| 2 | Cerita masalah (Raka) | 2 menit |
| 3 | Masalah di skala (statistik) | 1 menit |
| 4 | Pertanyaan pivot | 30 detik |
| 5 | Gambaran solusi | 1,5 menit |
| 6 | Engine AI (3 pola kolaborasi) | 2,5 menit |
| — | **Demo Langsung** | **5–7 menit** |
| 7 | Arsitektur sistem | 1,5 menit |
| 8 | Model bisnis + traksi | 1,5 menit |
| 9 | Desain & UX | 1 menit |
| 10 | CTA + Tanya Jawab | 30 detik |
| **Total** | | **~17–19 menit** |

---

## Slide Cadangan (siapkan jika ada pertanyaan)

### B1 — Tabel 20 Agen Lengkap
*→ Jika juri tanya: "Apa saja agen-agennya?"*

| Pipeline | Agen | Peran & Output |
|----------|------|----------------|
| Lead Scoring | Extractor | Profil terstruktur: nama, kategori, lokasi, kontak dari data mentah |
| Lead Scoring | Finance Agent | Kapasitas anggaran, potensi pendapatan bisnis target |
| Lead Scoring | Marketing Agent | Pain point, kesesuaian pesan, channel yang tepat |
| Lead Scoring | Strategy Agent | Prioritas tier A–D + rekomendasi tindakan spesifik |
| Simulasi Keuangan | Owner Agent | Strategi pendapatan, margin, ambisi pertumbuhan |
| Simulasi Keuangan | Supplier Agent | Tekanan biaya supply chain, lead time, inventori |
| Simulasi Keuangan | Customer Agent | Sensitivitas harga, elastisitas permintaan, churn |
| Simulasi Keuangan | Bank Agent | Runway, debt service, rekomendasi kredit |
| Simulasi Keuangan | Synthesizer | Forecast cashflow bulanan + level risiko (rendah/sedang/tinggi/kritis) |
| Analisis Pasar | Competitor Agent | Pangsa pasar, celah positioning kompetitor |
| Analisis Pasar | Trend Agent | Tren industri, vektor pertumbuhan |
| Analisis Pasar | Risk Agent | Risiko masuk, hambatan regulasi, UU PDP |
| Analisis Pasar | Demand Agent | TAM, willingness to pay, segmentasi |
| Analisis Pasar | Synthesizer | Skor peluang (0–100) + rekomendasi go-to-market |
| Standalone | Smart Sales | Strategi sales personal per lead berdasarkan profil AI |
| Standalone | Cold Email | Email outreach hyper-personal dari hasil analisis |
| Standalone | SQL Search | Bahasa natural → PostgreSQL (Bahasa Indonesia support) |
| Swarm | Lead Coordinator | Entry point pipeline lead scoring, routing ke Extractor |
| Swarm | FinSim Coordinator | Inisiasi fan-out paralel untuk 4 agen keuangan |
| Swarm | Market Coordinator | Inisiasi fan-out paralel untuk 4 agen analisis pasar |

### B2 — Mengapa Swarm Runtime, Bukan Satu Model?
*→ Jika juri tanya: "Kenapa tidak pakai satu LLM saja?"*

**Masalah dengan satu LLM untuk semua:**
- Satu prompt harus jadi ahli keuangan, ahli pemasaran, dan strategis sekaligus
- Konteks membengkak → kualitas analisis menurun
- Tidak bisa dioptimasi: prompt keuangan sangat berbeda dari prompt copywriting

**Solusi Swarm:**
- Setiap agen: instruksi fokus + schema output ketat (Zod)
- Agen kecil Llama 8B → ekstraksi cepat (Extractor, SQL)
- Agen besar Llama 70B → analisis mendalam (Finance, Strategy, Synthesizer)
- Dynamic handoff: agen memutuskan siapa yang bekerja selanjutnya — extensible tanpa ubah runtime
- Fan-out paralel: pipeline Finance & Market ~4× lebih cepat dari sequential
- Setiap langkah tercatat → bisa di-debug, bisa di-audit, bisa di-improve per agen

### B3 — Arsitektur Scraper
*→ Jika juri tanya: "Bagaimana scraping bekerja?"*

```
Phase 1: Parallel card scraping
  Playwright → Google Maps → role="article" cards
  aria-label → nama bisnis
  Concurrent via asyncio → 10 lead dalam ~10 detik

Phase 2: Contact enrichment (parallel)
  ThreadPoolExecutor (6 worker)
  Per bisnis: scrape website → extract email + WhatsApp
  ~35 detik untuk 10 bisnis (paralel)

Total: ~45 detik untuk 10 lead + kontak
(vs manual: ~5 menit tanpa kontak sama sekali)

Deduplication:
  Worker TypeScript: cek nama + workspaceId sebelum insert (ILIKE)
  Python scraper: seen set + JUNK_NAMES filter
```

### B4 — Lanskap Kompetitif
*→ Jika juri tanya: "Apa bedanya dengan Apollo.io / HubSpot?"*

| | uTune AI | Apollo.io | HubSpot | Google Maps |
|--|----------|-----------|---------|-------------|
| CRM Geografis (peta) | ✅ | ❌ | ❌ | ❌ |
| AI multi-agent scoring | ✅ | ⚠️ basic | ❌ | ❌ |
| Bahasa Indonesia | ✅ | ❌ | ❌ | ✅ |
| Scraping lokal otomatis | ✅ | ❌ | ❌ | ❌ |
| WhatsApp native | ✅ | ❌ | ❌ | ❌ |
| Reasoning trace (audit AI) | ✅ | ❌ | ❌ | ❌ |
| Harga (IDR/bln) | 299rb | ~1,6jt | ~2jt | Kredit API |
| Dibangun untuk SEA | ✅ | ❌ | ❌ | — |

**Celah terbesar:** Tidak ada kompetitor yang menggabungkan peta + AI multi-agent + scraping lokal + harga IDR dalam satu produk native SEA.

### B5 — Reproducibility: Deploy dalam 3 Langkah
*→ Jika juri tanya: "Bagaimana cara deploy atau replikasi sistem ini?"*

```bash
# 1. Clone & install
git clone <repo>
cp .env.example .env
# isi: DATABASE_URL, REDIS_URL, NVIDIA_API_KEY, NEXT_PUBLIC_SUPABASE_*
pnpm install

# 2. Setup database
pnpm db:generate && pnpm db:migrate

# 3. Jalankan semua (frontend + backend + workers)
pnpm dev
# atau production:
docker build -t utune-ai .
docker run --env-file .env utune-ai
```

**Single Docker container** menjalankan semua via PM2:
- `web` — Next.js port 3000
- `api` — NestJS port 3001
- `workers` — BullMQ (no port)

**Environment yang dibutuhkan:** Supabase (gratis), Redis/Upstash (gratis tier), NVIDIA NIM API key

### B6 — Observabilitas Sistem
*→ Jika juri tanya: "Bagaimana memantau sistem AI?"*

Tiga tabel DB untuk observabilitas penuh:

```
swarm_runs     — 1 baris per workflow (executionId, entryAgent, totalSteps, status)
agent_logs     — 1 baris per langkah agen (input, output, reasoning, handoffFrom, parallelGroup)
lead_scores    — hasil final agregat per lead (priorityTier, conversionProb, action)
```

Setiap scrape bisa di-trace dari awal hingga akhir:
`swarm_runs.executionId` → semua `agent_logs` untuk run tersebut → `lead_scores` final

### B7 — Keamanan & Kepatuhan Data
*→ Jika juri tanya: "Bagaimana dengan privasi data?"*

- Semua data di Supabase PostgreSQL (region Singapore)
- Multi-tenant: setiap query difilter oleh `workspaceId` — data antar pengguna terisolasi penuh
- Tidak ada data yang dibagikan antar workspace
- Rencana: review kepatuhan UU PDP Indonesia sebelum go-live komersial
