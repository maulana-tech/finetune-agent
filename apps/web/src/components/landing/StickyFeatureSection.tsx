"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Star, Sparkles, Map, ChevronRight } from "lucide-react";

/* ─── step data ─────────────────────────────────────────────────────────── */

interface Step {
  id: string;
  step: string;
  icon: React.ElementType;
  title: string;
  colorClass: string;        // icon bg + text
  accentBg: string;          // dot color (inline style)
  heading: string;
  desc: string;
  tag: string;
  visual: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: "search",
    step: "01",
    icon: Search,
    title: "Search",
    colorClass: "bg-blue-100 text-blue-600",
    accentBg: "#3b82f6",
    heading: "Find any business, anywhere",
    desc: "Search by industry, city, region, or draw a custom polygon on the map. Run multiple keywords per job and get names, addresses, phones, websites, and hours in seconds.",
    tag: "10M+ businesses indexed",
    visual: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-[#e3e1d8] bg-white px-3 py-2.5 text-[13px] shadow-sm">
          <Search className="size-4 shrink-0 text-[#9aa0aa]" />
          <span className="text-[#3b3f48]">dental clinics in Jakarta</span>
          <span className="ml-auto text-[11px] text-[#9aa0aa]">↵</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "Klinik Gigi Sehat",  city: "Jakarta Selatan", rating: "4.2" },
            { name: "Dental Care Plus",   city: "Jakarta Pusat",   rating: "3.8" },
            { name: "Smile Dental",       city: "Jakarta Barat",   rating: "4.5" },
            { name: "Klinik Utama",       city: "Jakarta Timur",   rating: "3.6" },
          ].map((b) => (
            <div key={b.name} className="rounded-lg border border-[#e3e1d8] bg-white p-3 shadow-sm">
              <div className="text-[12px] font-medium leading-tight text-[#0f1115]">{b.name}</div>
              <div className="mt-0.5 text-[11px] text-[#9aa0aa]">{b.city}</div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-500">
                ★ <span className="text-[#6b7180]">{b.rating}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] text-blue-700">
          Found <strong>184 leads</strong> in 12 seconds
        </div>
      </div>
    ),
  },
  {
    id: "enrich",
    step: "02",
    icon: Star,
    title: "Enrich",
    colorClass: "bg-amber-100 text-amber-600",
    accentBg: "#f59e0b",
    heading: "Pull reviews, emails & contacts",
    desc: "Automatically enrich every lead with Google reviews, email addresses, WhatsApp numbers, and social links. No manual copy-paste.",
    tag: "20 reviews per lead",
    visual: (
      <div className="space-y-2.5">
        <div className="rounded-lg border border-[#e3e1d8] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-medium text-[#0f1115]">Klinik Gigi Sehat</div>
            <div className="text-[11px] text-[#9aa0aa]">Enriching…</div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Email",     value: "info@klinikgigisehat.com" },
              { label: "WhatsApp",  value: "+62 812 3456 7890" },
              { label: "Reviews",   value: "20 pulled" },
              { label: "Website",   value: "klinikgigisehat.com" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2 text-[12px]">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[9px] text-emerald-600">
                  ✓
                </div>
                <span className="w-16 shrink-0 text-[#9aa0aa]">{r.label}</span>
                <span className="truncate text-[#3b3f48]">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
          <strong>184 leads</strong> enriched automatically
        </div>
      </div>
    ),
  },
  {
    id: "analyze",
    step: "03",
    icon: Sparkles,
    title: "Analyze",
    colorClass: "bg-violet-100 text-violet-600",
    accentBg: "#8b5cf6",
    heading: "AI summarizes pain points & opportunities",
    desc: "Smart Reviews reads every Google review and surfaces recurring complaints, strengths, and sales opportunities — in your language.",
    tag: "AI-powered insights",
    visual: (
      <div className="space-y-2.5">
        <div className="rounded-lg border border-[#e3e1d8] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-violet-500" />
            <div className="text-[13px] font-medium text-[#0f1115]">AI Review Summary</div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-[11px] text-[#9aa0aa]">Pain points</div>
              {["Long waiting times (mentioned 12×)", "Billing transparency issues (8×)"].map((p) => (
                <div key={p} className="flex items-start gap-1.5 text-[12px] text-[#3b3f48]">
                  <span className="mt-0.5 shrink-0 text-red-400">•</span> {p}
                </div>
              ))}
            </div>
            <div>
              <div className="mb-1 text-[11px] text-[#9aa0aa]">Opportunities</div>
              {["Patients want online booking", "Staff praised — upsell training"].map((o) => (
                <div key={o} className="flex items-start gap-1.5 text-[12px] text-[#3b3f48]">
                  <span className="mt-0.5 shrink-0 text-emerald-500">•</span> {o}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-[12px] text-violet-700">
          Avg rating <strong>3.8 ★</strong> — below market average
        </div>
      </div>
    ),
  },
  {
    id: "close",
    step: "04",
    icon: Map,
    title: "Close",
    colorClass: "bg-emerald-100 text-emerald-600",
    accentBg: "#10b981",
    heading: "Import to CRM and send personalized emails",
    desc: "Push leads to your map-based CRM, assign pipeline stages, and send AI-drafted cold emails based on real pain points. Close deals without leaving the platform.",
    tag: "Map-first CRM",
    visual: (
      <div className="space-y-2.5">
        <div className="rounded-lg border border-[#e3e1d8] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-medium text-[#0f1115]">Pipeline</div>
            <div className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">
              184 leads
            </div>
          </div>
          <div className="space-y-2">
            {[
              { stage: "New",        count: 92, max: 92, barClass: "bg-blue-400" },
              { stage: "Contacted",  count: 54, max: 92, barClass: "bg-amber-400" },
              { stage: "Interested", count: 28, max: 92, barClass: "bg-violet-400" },
              { stage: "Closed",     count: 10, max: 92, barClass: "bg-emerald-400" },
            ].map((s) => (
              <div key={s.stage} className="flex items-center gap-2 text-[12px]">
                <div className="w-16 shrink-0 text-[#9aa0aa]">{s.stage}</div>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-[#f0f0f0]">
                  <div
                    className={`h-full rounded-full ${s.barClass}`}
                    style={{ width: `${(s.count / s.max) * 100}%` }}
                  />
                </div>
                <div className="w-6 text-right text-[#3b3f48]">{s.count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
          <strong>10 deals closed</strong> from this batch
        </div>
      </div>
    ),
  },
];

const STATS = [
  { value: "10M+",  label: "Businesses indexed" },
  { value: "50K+",  label: "Cities & districts" },
  { value: "26+",   label: "Supported languages" },
  { value: "1,000", label: "Leads per job" },
];

/* ─── component ─────────────────────────────────────────────────────────── */

export default function StickyFeatureSection() {
  const [activeId, setActiveId] = useState<string>(STEPS[0].id);
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* Track which step is in the viewport */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    STEPS.forEach((s) => {
      const el = stepRefs.current[s.id];
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(s.id);
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const activeStep = STEPS.find((s) => s.id === activeId) ?? STEPS[0];

  return (
    <section className="bg-[#fbfaf6]">
      <div className="max-w-[1100px] mx-auto px-6 w-full">
        <div className="flex gap-16 lg:gap-20">

          {/* ══════════════════════════════════════════
              LEFT — sticky panel
          ══════════════════════════════════════════ */}
          <div className="hidden md:block w-[320px] lg:w-[360px] shrink-0">
            <div className="sticky top-[12vh]">

              {/* Heading */}
              <h2 className="font-display text-[clamp(26px,3vw,40px)] leading-[1.1] text-[#0f1115]">
                Millions of businesses
                <br />
                <span className="text-[#6b7180]">at your fingertips,</span>
                <br />
                <span className="text-[#6b7180]">ready to prospect</span>
              </h2>
              <p className="mt-4 text-[13.5px] text-[#6b7180] leading-relaxed">
                From searching businesses on a map to closing deals — uTune AI supports your entire sales workflow.
              </p>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-2 gap-y-5 gap-x-6">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-[clamp(24px,2.4vw,32px)] tracking-tight text-[#0f1115]">
                      {s.value}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#6b7180]">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href="/start"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#0f1115] px-5 py-3 text-[13px] font-medium text-white transition-all hover:opacity-90"
              >
                Start prospecting
                <ChevronRight className="size-4" />
              </Link>

              {/* Step progress tracker */}
              <div className="mt-10 space-y-1">
                {STEPS.map((s) => {
                  const isActive = s.id === activeId;
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        stepRefs.current[s.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                        isActive
                          ? "bg-[#0f1115] text-white"
                          : "text-[#9aa0aa] hover:bg-[#f0ede6] hover:text-[#3b3f48]"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold transition-colors ${
                          isActive ? "bg-white/15 text-white" : "bg-[#f0f0f0] text-[#9aa0aa] group-hover:bg-[#e8e6df]"
                        }`}
                      >
                        {s.step}
                      </div>
                      <Icon className="size-3.5 shrink-0" />
                      <span className="text-[12px] font-medium">{s.title}</span>
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active step accent line */}
              <div
                className="mt-6 h-0.5 rounded-full transition-all duration-500"
                style={{ backgroundColor: activeStep.accentBg, width: `${(STEPS.findIndex(s => s.id === activeId) + 1) * 25}%` }}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════
              RIGHT — scrolling steps
          ══════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 py-20">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  ref={(el) => { stepRefs.current[s.id] = el; }}
                  className={`py-16 ${i < STEPS.length - 1 ? "border-b border-[#e8e6df]" : ""}`}
                >
                  {/* Mobile heading */}
                  <div className="mb-6 md:hidden">
                    <h2 className="font-display text-[clamp(24px,5vw,34px)] text-[#0f1115]">
                      Millions of businesses at your fingertips
                    </h2>
                  </div>

                  {/* Step badge */}
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.colorClass}`}>
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9aa0aa]">
                      Step {s.step} — {s.title}
                    </span>
                  </div>

                  {/* Heading + desc */}
                  <h3 className="text-[clamp(20px,2vw,26px)] font-medium leading-snug text-[#0f1115] mb-3">
                    {s.heading}
                  </h3>
                  <p className="max-w-[460px] text-[13.5px] leading-relaxed text-[#6b7180] mb-7">
                    {s.desc}
                  </p>

                  {/* Visual card */}
                  <div className="card max-w-[460px] p-4">
                    <div className="mb-4 flex items-center gap-2 text-[11px] text-[#9aa0aa]">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.accentBg }}
                      />
                      {s.tag}
                    </div>
                    {s.visual}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
