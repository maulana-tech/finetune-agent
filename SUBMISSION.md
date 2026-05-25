# UTune AI: Multi-Agent Sales Intelligence Platform with Geographic CRM

## Deskripsi AI Agent

UTune AI adalah platform CRM berbasis peta yang mengintegrasikan pencarian bisnis Google Maps-grade dengan analisis multi-agent AI untuk mempercepat proses sales B2B. Platform ini mengatasi masalah utama tim sales: menemukan leads berkualitas, memvalidasi kelayakan finansial, dan memahami positioning pasar — semuanya dalam satu dashboard.

## Arsitektur AI Multi-Agent (9 Agents, 3 Pipeline)

### 1. Lead Scoring Pipeline (Sequential)
4 agents menganalisis setiap lead secara bertahap:
- **Extractor**: ekstraksi data terstruktur dari hasil scraping
- **Finance Agent**: analisis kesehatan finansial
- **Marketing Agent**: evaluasi messaging fit
- **Strategy Agent**: sintesis rekomendasi final

### 2. Finance Simulation Pipeline (Parallel Stakeholder Perspectives)
5 agents mensimulasikan cashflow forecast 12 bulan dengan 4 perspektif stakeholder yang dijalankan paralel (Owner, Supplier, Customer, Bank), lalu Synthesizer merekonsiliasi menjadi prediksi terpadu dengan risk scoring (low/medium/high/critical).

### 3. Market Analysis Pipeline (Parallel Market Intelligence)
5 agents menganalisis peluang pasar dari 4 sudut pandang paralel (Competitor, Trend, Risk, Demand), kemudian Synthesizer menghasilkan opportunity score dan positioning recommendation.

## Swarm Runtime Architecture

Sistem routing dinamis yang memungkinkan agents memutuskan agent mana yang akan dijalankan berikutnya (sequential handoff), menjalankan multiple agents secara paralel (fan-out), atau memanggil tools eksternal — semuanya dengan full observability trace di `agent_logs` table.

## Tech Stack

- **Frontend**: Next.js 15 + MapLibre GL JS + Zustand
- **Backend**: NestJS 11 + BullMQ workers + Python scraper (Playwright)
- **AI**: NVIDIA NIM (Llama 3.1 70B/8B) via Vercel AI SDK
- **Database**: PostgreSQL + Drizzle ORM
- **Infrastructure**: Redis + Supabase + Upstash

## Nilai Unik

- **Hybrid Intelligence**: Kombinasi web scraping real-time + multi-agent reasoning untuk due diligence otomatis
- **Geographic Context**: Semua leads divisualisasikan di peta interaktif dengan pipeline stages
- **Parallel Multi-Perspective Analysis**: Finance & market analysis menggunakan parallel stakeholder agents untuk menghasilkan insight yang lebih robust dibanding single-agent approach
- **Production-Ready Observability**: Setiap step agent tercatat di `agent_logs` dengan handoff tracking dan parallel group markers untuk debugging dan audit trail

## Target Pengguna

Platform ini dirancang untuk founder/sales teams yang ingin scale outreach tanpa mengorbankan kualitas lead qualification.

## Demo

- **Live URL**: https://utune-ai.vercel.app
- **Dashboard**: https://utune-ai.vercel.app/dashboard
- **Finance Simulation**: https://utune-ai.vercel.app/dashboard/finance
- **Market Analysis**: https://utune-ai.vercel.app/dashboard/market
