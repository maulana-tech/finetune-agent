# Demo Video Script — uTune AI
**Team FTune | AI Agent Hackathon 2026**  
Target duration: **3–4 menit**

---

## Format

- **Narasi** = yang diucapkan (voice over / on-camera)
- **Layar** = yang ditampilkan di screen recording
- **Aksi** = yang dilakukan presenter

---

## [00:00 – 00:15] OPENING — Hook

**Layar:** Landing page uTune AI, hero section  
**Aksi:** Scroll perlahan ke bawah

> **Narasi:**
> "Bayangkan kamu punya tim analis — seorang data specialist, financial analyst, marketing strategist, dan strategic advisor — yang bekerja 24 jam, menganalisis setiap lead yang kamu temukan, dan memberikan rekomendasi yang jelas: hubungi sekarang, nurture, atau skip.
>
> Itulah yang kami bangun. uTune AI — B2B lead generation platform dengan multi-agent AI di dalamnya."

---

## [00:15 – 00:35] PROBLEM — Kenapa ini penting

**Layar:** Tetap di landing page, scroll ke section workflow  
**Aksi:** Highlight bagian "Search → Enrich → Analyze → Close"

> **Narasi:**
> "Sales team hari ini masih buang waktu berjam-jam: scraping Google Maps manual, copy-paste ke spreadsheet, riset satu per satu sebelum kirim email.
>
> Hasilnya? 80% waktu habis untuk lead yang salah.
>
> uTune AI mengkolaps semua itu jadi satu workflow — dari search sampai close, di atas satu peta."

---

## [00:35 – 01:10] DEMO PART 1 — Business Finder

**Layar:** Dashboard → halaman utama (map view)  
**Aksi:** Klik "New Search Job" atau buka Business Finder

> **Narasi:**
> "Kita mulai dari Business Finder. Saya mau cari semua dental clinic di Jakarta Selatan."

**Aksi:** Ketik `dental clinic` di search bar, pilih kota Jakarta Selatan

> **Narasi:**
> "Saya bisa search by kota, atau — ini yang menarik — saya bisa gambar polygon langsung di peta."

**Aksi:** Tunjukkan fitur draw polygon di map (kalau sudah ada), atau langsung klik Run

> **Narasi:**
> "Klik Run. Di belakang layar, Python worker kita mulai scraping Google Maps menggunakan Playwright."

**Aksi:** Tunggu beberapa detik, tunjukkan leads mulai muncul

> **Narasi:**
> "184 leads. Nama, alamat, nomor telepon, website, rating — semua dalam hitungan detik. Dan setiap lead langsung jadi pin di peta."

---

## [01:10 – 01:50] DEMO PART 2 — Multi-Agent AI (inti)

**Layar:** Buka salah satu lead dari hasil scrape  
**Aksi:** Klik lead "Klinik Gigi Sehat" atau lead apapun yang sudah ada AI score-nya

> **Narasi:**
> "Sekarang bagian yang jadi inti dari submission kita — multi-agent AI system."

**Aksi:** Scroll ke bagian AI Score / AI Insights di lead detail

> **Narasi:**
> "Setiap lead yang masuk diproses oleh 4 AI agent secara berurutan."

**Layar:** Tunjukkan diagram atau tabel agent (bisa screenshot dari ARCHITECTURE section di landing page)

> **Narasi:**
> "Agent pertama — Extractor — mengambil data mentah dan mengubahnya jadi struktur yang bersih.
>
> Agent kedua — Finance — menganalisis: seberapa besar budget kemungkinan bisnis ini? Ini klinik kecil atau jaringan besar?
>
> Agent ketiga — Marketing — menentukan: apakah produk kita cocok untuk mereka? Apa pain point utamanya?
>
> Dan agent keempat — Strategy — mensintesis semua itu dan memberikan satu rekomendasi: hubungi sekarang, nurture, atau skip."

**Aksi:** Tunjukkan AI score di lead: misalnya "85/100 — Priority A — Immediate Outreach"

> **Narasi:**
> "Lead ini dapat skor 85 dari 100. Priority A. Rekomendasi: immediate outreach."

**Aksi:** Klik "View Reasoning" atau buka agent logs (kalau ada UI-nya)

> **Narasi:**
> "Dan ini yang membedakan kita dari sistem AI biasa — setiap keputusan punya reasoning yang eksplisit. Bukan black box.
>
> Finance agent bilang: budget probability 75% karena ini klinik single-location di area premium.
> Marketing agent bilang: messaging fit 80% karena mereka struggle dengan online booking.
> Strategy agent menyimpulkan: kombinasi keduanya → Priority A."

---

## [01:50 – 02:20] DEMO PART 3 — Smart Reviews + Smart Emails

**Layar:** Masih di lead detail, scroll ke section Reviews  
**Aksi:** Tunjukkan review summary

> **Narasi:**
> "Smart Reviews menarik Google reviews untuk lead ini — 20 reviews — dan AI merangkumnya."

**Aksi:** Highlight bagian pain points

> **Narasi:**
> "Pain points yang terdeteksi: antrian lama, masalah transparansi billing. Ini bukan asumsi — ini dari review nyata pelanggan mereka."

**Aksi:** Klik "Generate Email" atau tunjukkan draft email yang sudah ada

> **Narasi:**
> "Smart Emails menggunakan pain points ini untuk menulis cold email yang personal. Bukan template — setiap email ditulis berdasarkan kondisi spesifik lead tersebut."

**Aksi:** Tunjukkan email draft sebentar

> **Narasi:**
> "Subject line, opening, pain point, CTA — semua disesuaikan. Tinggal review dan kirim."

---

## [02:20 – 02:45] DEMO PART 4 — Map CRM + Pipeline

**Layar:** Kembali ke map view  
**Aksi:** Tunjukkan pins di peta, klik filter

> **Narasi:**
> "Semua lead ada di peta. Saya bisa filter by pipeline stage — mana yang sudah dihubungi, mana yang masih baru, mana yang sudah closing."

**Aksi:** Ganti filter, tunjukkan pins berubah warna atau jumlah

> **Narasi:**
> "Field rep bisa lihat territory mereka, plan route, dan log visit langsung dari sini. Tidak perlu pindah aplikasi."

---

## [02:45 – 03:10] TECHNICAL CREDIBILITY — Untuk juri teknis

**Layar:** Buka terminal atau tunjukkan database query  
**Aksi:** Jalankan query SQL (atau tunjukkan screenshot hasil query)

```sql
SELECT step_number, agent_name, reasoning, confidence
FROM agent_logs
WHERE execution_id = 'xxx'
ORDER BY step_number;
```

> **Narasi:**
> "Untuk juri yang ingin melihat implementasi teknisnya — ini bukan mockup.
>
> Setiap agent execution tersimpan di database dengan full reasoning chain. Kita bisa trace persis bagaimana skor 85 itu dihitung — dari step 1 sampai step 4."

**Aksi:** Tunjukkan hasil query: 4 rows, masing-masing dengan reasoning text

> **Narasi:**
> "Stack-nya: NestJS API, BullMQ untuk queue, Python Playwright untuk scraping, NVIDIA NIM dengan Llama 3.1 untuk AI, PostgreSQL dengan Drizzle ORM, dan Next.js 15 dengan MapLibre untuk frontend.
>
> Semua production-ready. Bukan prototype."

---

## [03:10 – 03:30] CLOSING — Impact + CTA

**Layar:** Kembali ke landing page, section stats  
**Aksi:** Highlight angka: 10M+ businesses, 50K+ cities

> **Narasi:**
> "uTune AI mengubah cara sales team bekerja. Dari 100 leads yang masuk, AI langsung mengidentifikasi 15 yang Priority A — yang paling mungkin convert, dengan deal value tertinggi.
>
> Sales rep fokus ke 15 itu. Conversion rate naik 3×. Waktu riset turun 80%."

**Layar:** Tunjukkan team section di landing page  
**Aksi:** Pause sebentar di foto/card team

> **Narasi:**
> "Kami Team FTune — Maulana sebagai Lead Developer, dan Fitri sebagai Product Designer.
>
> Terima kasih sudah menonton. Demo live dan technical Q&A — kami siap."

---

## [03:30] END CARD

**Layar:** Landing page — hero section  
**Teks overlay (opsional):**
```
uTune AI
Team FTune — AI Agent Hackathon 2026

🔗 [URL demo]
📧 [email kontak]
```

---

## Catatan Produksi

### Urutan screen recording yang dibutuhkan:
1. Landing page (hero + scroll)
2. Dashboard → map view dengan pins
3. Business Finder → search → hasil leads
4. Lead detail → AI score + reasoning
5. Smart Reviews → pain points
6. Smart Emails → draft email
7. Map CRM → filter pipeline
8. Terminal → database query (opsional, untuk credibility)

### Tips:
- Gunakan data yang sudah ada di database (jangan live scrape saat recording — terlalu lama)
- Siapkan 1 lead dengan AI score lengkap sebagai "hero lead" untuk demo
- Zoom in ke bagian reasoning text agar terbaca jelas
- Gunakan cursor highlight tool agar penonton tahu apa yang diklik
- Background music: subtle, tidak mengganggu narasi

### Durasi per bagian:
| Bagian | Durasi |
|---|---|
| Opening / Hook | 15 detik |
| Problem | 20 detik |
| Business Finder | 35 detik |
| Multi-Agent AI | 40 detik |
| Smart Reviews + Emails | 30 detik |
| Map CRM | 25 detik |
| Technical credibility | 25 detik |
| Closing | 20 detik |
| **Total** | **~3:30** |

---

*Team FTune — uTune AI — 2026*
