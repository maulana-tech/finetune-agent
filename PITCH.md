# Pitch Deck Hackathon — uTune AI

> **10 slide · ~16–18 menit · Target: juri hackathon (teknis + bisnis)**

---

## Slide 1 — Cover

**Judul:** uTune AI
**Tagline:** Temukan. Analisis. Tutup. — Platform inteligensi sales B2B berbasis AI untuk Asia Tenggara.
**Visual:** Screenshot full-bleed dashboard peta — pin lead tersebar di kota Indonesia, panel detail terbuka di kanan
**Bar bawah:** Nama tim · Nama hackathon · Tanggal · `utune-ai.vercel.app`

---

## Slide 2 — Masalah (Cerita)

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

**Judul:** Lead Gen B2B Masih Manual, Terfragmentasi, dan Tanpa Inteligensi

**Tiga pilar:**

| | Masalah | Dampak |
|--|---------|--------|
| 📋 | Scraper memberi daftar, bukan inteligensi | Tidak tahu lead mana yang layak dihubungi |
| 🗺️ | CRM adalah tampilan list — rep lapangan buta arah | Wilayah tidak tercakup optimal, kunjungan terbuang |
| ✉️ | Cold outreach generik dapat <1% reply rate | Pipeline macet, kuota tidak tercapai |

**4 statistik (angka besar):**

| Statistik | Sumber |
|-----------|--------|
| **65 Juta+** UMKM di Indonesia — semesta prospek yang bisa dijangkau | BPS / World Bank |
| **65%** waktu rep dihabiskan untuk pekerjaan non-selling | McKinsey |
| **<1%** rata-rata reply rate cold email | Salesforce Research |
| **3–5 jam/hari** hilang untuk riset manual & entry data | HubSpot |

---

## Slide 4 — Pertanyaan Pivot

**Satu slide, teks besar di tengah:**

> **Bagaimana jika setiap lead datang sudah dianalisis oleh tim spesialis AI —**
> **analis keuangan, ahli strategi pasar, dan konsultan sales —**
> **semua bekerja paralel, dalam waktu kurang dari 10 detik?**

**Visual:** Panah dari "spreadsheet berantakan + Google Maps" → "peta bersih dengan lead ber-skor AI dan diperkaya"

---

## Slide 5 — Gambaran Solusi

**Judul:** uTune AI — Platform Inteligensi B2B Berbasis Peta

**Tiga pilar (ikon + deskripsi 2 baris):**

**🔍 Business Finder**
Cari berdasarkan industri + geografi. Gambar poligon, pilih kategori, dapatkan ratusan lead terverifikasi dengan kontak — otomatis di-scrape dari Google Maps. Termasuk email dan nomor WhatsApp.

**🗺️ Mapped CRM**
Setiap lead adalah pin. Kelola pipeline secara geografis — filter berdasarkan stage, skor, atau wilayah. Peta tidak pernah tersembunyi; itulah produknya.

**🤖 Multi-Agent AI**
20 agen AI khusus dalam 3 pipeline — lead scoring, simulasi keuangan, analisis pasar. Setiap keputusan dicatat. Tidak ada kotak hitam.

**Alur kerja:**
```
cari → scrape → perkaya → analisis AI → email personal → kunjungi → tutup
```

---

## Slide 6 — Engine AI

**Judul:** Bukan satu AI. Tim terkoordinasi 20 spesialis.

**Visual: Tiga kotak pipeline berdampingan**

```
┌──────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  LEAD SCORING         │  │  SIMULASI KEUANGAN  │  │  ANALISIS PASAR     │
│  (Berurutan)          │  │  (Paralel)          │  │  (Paralel)          │
│                       │  │                     │  │                     │
│  1. Extractor         │  │  ┌ Owner   ┐        │  │  ┌ Competitor ┐     │
│       ↓               │  │  ├ Supplier┤ → Sint │  │  ├ Trend      ┤→Sint│
│  2. Finance Agent     │  │  ├ Customer┤        │  │  ├ Risk       ┤     │
│       ↓               │  │  └ Bank    ┘        │  │  └ Demand     ┘     │
│  3. Marketing Agent   │  │                     │  │                     │
│       ↓               │  │  Forecast cashflow  │  │  Skor peluang       │
│  4. Strategy Agent    │  │  + level risiko     │  │  + positioning      │
└──────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

**Cara kerjanya:**

**Pipeline A — Lead Scoring (Berurutan, konteks diwariskan)**
Setiap agen menerima output agen sebelumnya sebagai konteks:
1. **Extractor** → Profil bisnis terstruktur dari data mentah scrape
2. **Finance Agent** → Kapasitas anggaran, potensi pendapatan bisnis target
3. **Marketing Agent** → Pain point, kesesuaian pesan, channel yang tepat
4. **Strategy Agent** → Skor prioritas A/B/C/D + rekomendasi tindakan final

**Pipeline B — Simulasi Keuangan (Paralel, 4 perspektif stakeholder)**
Empat agen berjalan paralel, lalu synthesizer merekonsiliasi hasil:
- **Owner Agent** — strategi pendapatan, margin, pertumbuhan
- **Supplier Agent** — tekanan biaya supply chain, kecukupan inventori
- **Customer Agent** — sensitivitas harga, elastisitas permintaan
- **Bank Agent** — runway, debt service, rekomendasi kredit
- **Synthesizer** → Forecast cashflow bulanan + level risiko (rendah/sedang/tinggi/kritis)

**Pipeline C — Analisis Pasar (Paralel, 4 perspektif independen)**
- **Competitor Agent** — pangsa pasar, celah positioning
- **Trend Agent** — tren industri, vektor pertumbuhan
- **Risk Agent** — risiko masuk, hambatan regulasi
- **Demand Agent** — TAM, willingness to pay
- **Synthesizer** → Skor peluang + rekomendasi go-to-market

**Agen standalone:**
- **SQL Search Agent** — bahasa natural → PostgreSQL (tanya database dalam Bahasa Indonesia)
- **Smart Sales Agent** — strategi sales personal per lead
- **Cold Email Agent** — outreach hyper-personal dari hasil analisis AI

**Swarm Runtime:**
Semua pipeline dijalankan di atas runtime Swarm kustom dengan dynamic handoff — koordinator memutuskan siapa agen berikutnya, fan-out paralel otomatis, dan setiap langkah dicatat ke `agent_logs` untuk transparansi penuh.

**Catatan bawah:**
> **20 agen · 3 pipeline · Swarm runtime dengan dynamic handoff · Setiap langkah tercatat di `agent_logs`**
> Model: Llama 3.1 70B (analisis) · Llama 3.1 8B (cepat/SQL) via NVIDIA NIM

---

## [DEMO LANGSUNG — 5–7 menit]

**Skrip:**
1. Buka dashboard peta — pin lead tersebar di Jakarta
2. Trigger scrape baru: ketik "klinik gigi di Surabaya" → tampilkan progress scraping real-time
3. Lead muncul di peta sebagai pin
4. Klik pin → panel detail terbuka (nama, alamat, telepon, email, WhatsApp, stage pipeline)
5. Buka panel AI Score → tier prioritas A/B/C/D, probabilitas konversi, rekomendasi tindakan
6. Tampilkan reasoning trace di `agent_logs` — analisis Finance Agent, pain point Marketing Agent, keputusan final Strategy Agent
7. Tampilkan cold email yang di-generate AI khusus untuk bisnis tersebut
8. Buka tab AI Query → ketik "semua klinik yang punya email" → AI generate SQL → tabel hasil
9. Buka Scrape History → tampilkan daftar job dengan jumlah lead per scrape

---

## Slide 7 — Tech Stack

**Diagram lapisan:**

```
┌─────────────────────────────────────────────┐
│  FRONTEND                                    │
│  Next.js 15 (App Router) · React 19          │
│  MapLibre GL JS · tile OpenFreeMap           │
│  Tailwind v4 · Zustand                       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  BACKEND                                     │
│  NestJS 11 — REST API tipis (queue bridge)   │
│  BullMQ + Redis — orkestrasi job async       │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  WORKERS                                     │
│  Python (Playwright) scraper — paralel       │
│  5 antrian BullMQ (scrape, score, finance…)  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  LAPISAN AI                                  │
│  NVIDIA NIM · Llama 3.1 70B + 8B            │
│  Vercel AI SDK · Swarm runtime kustom        │
│  Pipeline sequential + parallel fan-out      │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  DATA                                        │
│  Supabase PostgreSQL · Drizzle ORM           │
│  agent_logs · lead_scores · swarm_runs       │
└─────────────────────────────────────────────┘
```

**3 keputusan teknis kunci:**
- **MapLibre** → nol biaya Google Maps API di skala besar
- **BullMQ** → scrape + pipeline AI async, tidak pernah blokir API
- **NVIDIA NIM** → OpenAI-compatible, model-agnostic, inferensi cepat

**Deploy:** Container Docker tunggal · PM2 multi-proses · SumoPod PaaS + Vercel

---

## Slide 8 — Model Bisnis + Traksi

**Judul:** Dibangun untuk pasar UMKM Indonesia. Harga untuk skala.

### Tier Harga

| Tier | Harga | Lead/bln | Fitur |
|------|-------|----------|-------|
| **Gratis** | Rp 0 | 50 lead | Tampilan peta, scrape dasar |
| **Growth** | Rp 299.000/bln | 500 lead | AI scoring, pipeline CRM, email outreach |
| **Scale** | Rp 999.000/bln | Tak terbatas | Semua pipeline AI, simulasi keuangan, analisis pasar, akses API |

### Traksi Awal (Build Hackathon)

| Metrik | Nilai |
|--------|-------|
| Lead di-scrape & diperkaya | **50+ lintas 8+ kategori** |
| Agen AI dibangun & terhubung | **20 agen, 3 pipeline** |
| Kecepatan scrape (10 lead) | **~45 detik** (dari ~5 menit) |
| Pengayaan email | **Paralel, 6× lebih cepat** |

### Kenapa Sekarang
> Indonesia punya **65 Juta+ UMKM** — namun belum ada platform inteligensi B2B lokal yang dibangun native untuk pasar ini. Apollo.io harganya $99/bulan dalam USD, tanpa dukungan Bahasa Indonesia, dan tanpa CRM geografis. Kami membangun versi native SEA-nya.

---

## Slide 9 — Sistem Desain

**Dua kolom: galeri komponen kiri, spesifikasi kanan**

**Tipografi:**
- `Inter` — data dashboard, label UI
- `JetBrains Mono` — trace reasoning agen, output SQL, ID
- `Lora` — header editorial di landing page marketing

**Dua dunia visual (disengaja):**
- **Dashboard** → Tema Brutalist. Kontras tinggi, tanpa gradien dekoratif, data padat. Data adalah desainnya.
- **Landing page (`/`)** → Sky-gradient cinematic scroll via Lenis. Aspirasional, berbasis cerita.

**Prinsip UI Peta:**
- Peta tidak pernah tersembunyi — setiap interaksi terjadi *di* atau *sekitar* peta
- Pin lead dikode warna berdasarkan stage pipeline
- Cluster view untuk area padat
- Panel detail slide-over — konteks tetap di peta, tanpa navigasi halaman

---

## Slide 10 — CTA + Tanya Jawab

**Satu slide, minimal, terpusat:**

```
Coba langsung:
utune-ai.vercel.app

Demo AI Query:
→ "Semua klinik di Jakarta yang punya email"

Dibangun dengan:
NVIDIA NIM · Next.js · NestJS · MapLibre · Supabase

[Nama tim]
[QR code ke aplikasi live]
```

**Tagline:**
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
| 6 | Engine AI (20 agen) | 2 menit |
| — | **Demo Langsung** | **5–7 menit** |
| 7 | Tech stack | 1,5 menit |
| 8 | Model bisnis + traksi | 1,5 menit |
| 9 | Sistem desain | 1 menit |
| 10 | CTA + Tanya Jawab | 30 detik |
| **Total** | | **~17–19 menit** |

---

## Slide Cadangan (siapkan jika ada pertanyaan)

### B1 — Tabel Detail Agen (lengkap)

| Pipeline | Agen | Peran |
|----------|------|-------|
| Lead Scoring | Extractor | Profil bisnis terstruktur dari data mentah |
| Lead Scoring | Finance Agent | Kapasitas anggaran, potensi pendapatan |
| Lead Scoring | Marketing Agent | Pain point, kesesuaian pesan, channel yang tepat |
| Lead Scoring | Strategy Agent | Prioritas tier A–D + rekomendasi tindakan |
| Simulasi Keuangan | Owner Agent | Strategi pendapatan, margin, pertumbuhan |
| Simulasi Keuangan | Supplier Agent | Tekanan biaya supply chain, lead time |
| Simulasi Keuangan | Customer Agent | Sensitivitas harga, elastisitas permintaan |
| Simulasi Keuangan | Bank Agent | Runway, debt service, rekomendasi kredit |
| Simulasi Keuangan | Synthesizer | Forecast cashflow bulanan + level risiko |
| Analisis Pasar | Competitor Agent | Pangsa pasar, celah positioning |
| Analisis Pasar | Trend Agent | Tren industri, vektor pertumbuhan |
| Analisis Pasar | Risk Agent | Risiko masuk, hambatan regulasi |
| Analisis Pasar | Demand Agent | TAM, willingness to pay |
| Analisis Pasar | Synthesizer | Skor peluang + go-to-market |
| Standalone | Smart Sales | Strategi sales personal per lead |
| Standalone | Cold Email | Outreach hyper-personal dari analisis AI |
| Standalone | SQL Search | Bahasa natural → PostgreSQL |
| Swarm | Lead Coordinator | Entry point pipeline lead scoring |
| Swarm | FinSim Coordinator | Fan-out paralel untuk agen keuangan |
| Swarm | Market Coordinator | Fan-out paralel untuk agen analisis pasar |

### B2 — Arsitektur Scraper

- **Fase 1:** Scraping paralel kartu Google Maps (Playwright headless)
- **Fase 2:** Pengayaan website via ThreadPoolExecutor (6 worker, email + WhatsApp)
- **Kecepatan:** 10 lead dalam ~45 detik (turun dari ~5 menit)
- **Deduplikasi:** Cek nama + workspaceId sebelum insert
- **Filtrasi:** JUNK_NAMES di Python + BAD_NAMES di worker TypeScript

### B3 — Lanskap Kompetitif

| | uTune AI | Apollo.io | HubSpot | Google Maps |
|--|----------|-----------|---------|-------------|
| CRM Geografis | ✅ | ❌ | ❌ | ❌ |
| AI scoring | ✅ | ✅ | ❌ | ❌ |
| Bahasa Indonesia | ✅ | ❌ | ❌ | ✅ |
| Scraping lokal | ✅ | ❌ | ❌ | ❌ |
| WhatsApp native | ✅ | ❌ | ❌ | ❌ |
| Harga (IDR) | 299rb/bln | ~1,5jt/bln | ~2jt/bln | Kredit API |

### B4 — Mengapa Swarm Runtime, Bukan Satu Model?

**Masalah dengan satu LLM untuk semua:**
- Satu prompt harus menjadi ahli keuangan, ahli pemasaran, dan strategis sekaligus
- Konteks membengkak → kualitas menurun
- Tidak bisa dioptimasi per tugas

**Solusi Swarm:**
- Setiap agen punya instruksi fokus + schema output ketat
- Agen kecil (8B) untuk ekstraksi cepat, agen besar (70B) untuk analisis dalam
- Dynamic handoff: agen memutuskan siapa yang bekerja selanjutnya
- Paralel fan-out untuk pipeline independen → 4× lebih cepat
- Setiap langkah dicatat di `agent_logs` → bisa di-debug, bisa di-audit

### B5 — Kepatuhan Data & UU PDP

- Semua data disimpan di Supabase PostgreSQL (Singapore region)
- Multi-tenant via `workspace_id` — data antar workspace terisolasi penuh
- Tidak ada data yang dibagikan antar pengguna
- Rencana ke depan: review lawyer untuk kepatuhan UU PDP Indonesia sebelum go-live komersial
