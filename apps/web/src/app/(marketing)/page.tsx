import Link from "next/link";
import { Search, Map, Star, Sparkles, Globe, ChevronRight, Database, Cpu, GitBranch, Layers, Zap, Shield, Target } from "lucide-react";
import HeroScene from "@/components/landing/HeroScene";
import SkyScene from "@/components/landing/SkyScene";
import TopNav from "@/components/landing/TopNav";
import Footer from "@/components/landing/Footer";
import StickyFeatureSection from "@/components/landing/StickyFeatureSection";

/* Every <Section> fills exactly one viewport and centers its content. */
function Section({
  children,
  className = "",
  inner = "",
}: {
  children: React.ReactNode;
  className?: string;
  inner?: string;
}) {
  return (
    <section className={`min-h-screen flex flex-col justify-center relative ${className}`}>
      <div className={`max-w-[1100px] mx-auto px-6 w-full ${inner}`}>{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <main>
      {/* =============== HERO (1 viewport) =============== */}
      <section className="relative h-screen overflow-hidden">
        <HeroScene />
        <TopNav variant="light" />
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 mt-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1 text-[11px] text-white/80 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            AI-powered B2B prospecting
          </div>
          <h1 className="font-display text-white text-[clamp(36px,5vw,56px)] leading-[1.05] max-w-[640px] drop-shadow-[0_1px_0_rgba(0,0,0,0.18)]">
            Find millions of
            <br /> B2B leads on a map
          </h1>
          <p className="text-white/90 text-[15px] mt-4 max-w-[480px] leading-relaxed">
            Search by industry + location, enrich with AI reviews and emails, and close deals faster — all from one map-powered CRM.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link href="#" className="inline-flex items-center gap-2 bg-white text-[#0f1115] text-[14px] font-medium rounded-xl px-5 py-3 shadow-lg hover:bg-white/90 transition-all">
              <Search className="size-4" />
              Find leads
            </Link>
            <Link href="#" className="inline-flex items-center gap-2 text-white/90 text-[13px] font-medium rounded-xl border border-white/20 bg-white/10 backdrop-blur px-5 py-3 hover:bg-white/20 transition-all">
              Watch the demo
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </Link>
          </div>
          <div className="mt-5 flex items-center gap-5 text-[12px] text-white/60">
            <span className="flex items-center gap-1.5"><Globe className="size-3.5" /> 10M+ businesses</span>
            <span className="flex items-center gap-1.5"><Map className="size-3.5" /> 50K+ cities</span>
            <span className="flex items-center gap-1.5"><Sparkles className="size-3.5" /> No credit card</span>
          </div>
        </div>
      </section>

      {/* =============== ORCHESTRATION PLATFORM (1 viewport) =============== */}
      <Section className="bg-[#fbfaf6]">
        <h2 className="font-display text-center text-[clamp(24px,2.6vw,34px)] leading-snug text-[#0f1115] max-w-[760px] mx-auto">
          uTune AI is a B2B lead generation platform
          <br />
          <span className="text-[#6b7180]">designed for field sales and prospecting teams</span>
        </h2>

        <div className="mt-10 grid md:grid-cols-[1.4fr_1fr] gap-4">
          <div className="card p-5">
            <div className="text-[11px] text-[#9aa0aa] mb-3">Search › Enrich › Analyze › Close</div>
            <svg viewBox="0 0 480 280" className="w-full h-[260px]">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="#b8b6ad" />
                </marker>
              </defs>
              <g stroke="#cfcdc4" strokeWidth="1.2" fill="none" markerEnd="url(#arrow)">
                <path d="M240,150 C200,90 140,80 110,80" />
                <path d="M240,150 C220,80 220,60 200,40" />
                <path d="M240,150 C260,80 260,60 280,40" />
                <path d="M240,150 C300,90 340,80 370,80" />
                <path d="M240,150 C200,200 150,220 120,220" />
                <path d="M240,150 C240,210 240,230 240,245" />
                <path d="M240,150 C290,210 340,220 370,220" />
              </g>
              {[
                { x: 110, y: 80, label: "Dentists" },
                { x: 200, y: 40, label: "Clinics" },
                { x: 280, y: 40, label: "Lawyers" },
                { x: 370, y: 80, label: "Hotels" },
                { x: 120, y: 220, label: "Cafes" },
                { x: 240, y: 245, label: "Shops" },
                { x: 370, y: 220, label: "Gyms" },
              ].map((n) => (
                <g key={n.label}>
                  <rect x={n.x - 38} y={n.y - 12} width="76" height="24" rx="5" fill="#fff" stroke="#e3e1d8" />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10" fill="#3b3f48" fontFamily="Inter">{n.label}</text>
                </g>
              ))}
              <g>
                <circle cx="240" cy="150" r="22" fill="#fff" stroke="#e3e1d8" />
                <text x="240" y="153" textAnchor="middle" fontSize="10" fill="#0f1115" fontFamily="Inter" fontWeight="600">map</text>
              </g>
              <circle cx="240" cy="118" r="4" fill="#ffcc3a" />
            </svg>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 text-[11px] text-[#9aa0aa] mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Leads &nbsp; Reviews &nbsp; Emails &nbsp; Pipeline
            </div>
            <div className="text-[12px] text-[#3b3f48] leading-relaxed border-l-2 border-[#e8e6df] pl-3">
              Find me all dental clinics in Jakarta with reviews below 4 stars.
            </div>
            <ul className="mt-3 space-y-2 text-[12px] text-[#3b3f48]">
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span>Found 184 dental clinics in Jakarta with reviews below 4 stars.</li>
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span>I can generate AI insights and draft personalized emails for each lead.</li>
            </ul>
            <div className="mt-4 space-y-2">
              <div className="rounded-md border border-[#e8e6df] bg-[#fbfaf6] px-3 py-2 flex items-center justify-between text-[12px]">
                <span>Smart Reviews — Analyze 20 reviews per lead</span>
                <button className="bg-[#0f1115] text-white text-[11px] rounded px-2 py-1">Analyze</button>
              </div>
              <div className="rounded-md border border-[#e8e6df] bg-[#fbfaf6] px-3 py-2 flex items-center justify-between text-[12px]">
                <span>Smart Emails — Draft sequence for 24 leads</span>
                <button className="bg-[#0f1115] text-white text-[11px] rounded px-2 py-1">Generate</button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-10">
          {[
            { t: "Business Finder", d: "Search millions of companies by industry, location, or draw a polygon on the map. Get names, addresses, phones, and websites in seconds." },
            { t: "Map-first CRM", d: "Every lead is a pin on a real map. Filter by rating, stage, assigned rep, or area. Manage pipelines without leaving the map." },
            { t: "AI-powered sales", d: "Smart Reviews analyze Google reviews per lead. Smart Emails draft personalized cold emails from real pain points." },
          ].map((c) => (
            <div key={c.t}>
              <div className="text-[13px] font-semibold text-[#0f1115]">{c.t}</div>
              <p className="text-[12.5px] text-[#6b7180] mt-1.5 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* =============== BENTO GRID (1 viewport) =============== */}
      <Section className="bg-[#fbfaf6]" inner="max-w-[1000px]">
        <h2 className="font-display text-center text-[clamp(24px,2.6vw,34px)] text-[#0f1115]">Find and close more deals with uTune AI</h2>
        <p className="text-center text-[13px] text-[#6b7180] mt-2">
          From prospecting to closing — everything your sales team needs in one map-powered platform.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-4 auto-rows-[180px]">
          {/* ---- CARD 1: Business Finder (large, 2x2) ---- */}
          <Link href="#" className="card col-span-2 row-span-2 p-0 overflow-hidden group relative hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#60a5fa]" />
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "radial-gradient(circle at 25px 25px, white 2px, transparent 0)",
              backgroundSize: "40px 40px"
            }} />
            <div className="relative h-full flex flex-col p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
                  <Search className="size-5" />
                </div>
                <div>
                  <div className="text-[11px] text-blue-200 uppercase tracking-wider">Core feature</div>
                  <div className="text-[17px] font-semibold">Business Finder</div>
                </div>
              </div>
              <p className="mt-3 text-[13px] text-blue-100 leading-relaxed max-w-[420px]">
                Search millions of companies by industry, location, or draw a polygon on the map.
                Get names, addresses, phones, websites, and hours in seconds.
              </p>
              <div className="mt-auto flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                  <Globe className="size-3" /> <span>10M+ businesses</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                  <Target className="size-3" /> <span>1000 leads/job</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-200 group-hover:underline underline-offset-2">
                Explore Business Finder <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* ---- CARD 2: Mapped CRM (1x1) ---- */}
          <Link href="#" className="card p-0 overflow-hidden group relative hover:shadow-lg transition-all duration-300">
            <div className="h-full flex flex-col p-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Map className="size-[18px]" />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-[#0f1115]">Mapped CRM</div>
              <p className="mt-1 text-[12px] text-[#6b7180] leading-relaxed flex-1">
                Every lead is a pin on a real map. Filter, sort, and manage pipelines visually.
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 group-hover:underline underline-offset-2 mt-2">
                Explore <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* ---- CARD 3: Smart Reviews (1x1) ---- */}
          <Link href="#" className="card p-0 overflow-hidden group relative hover:shadow-lg transition-all duration-300">
            <div className="h-full flex flex-col p-5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Star className="size-[18px]" />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-[#0f1115]">Smart Reviews</div>
              <p className="mt-1 text-[12px] text-[#6b7180] leading-relaxed flex-1">
                AI-powered review analysis. Detect pain points and opportunities per lead.
              </p>
              <div className="flex items-center gap-1 text-[11px] text-amber-600 group-hover:underline underline-offset-2 mt-2">
                Explore <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* ---- CARD 4: Smart Emails (wide, 2x1) ---- */}
          <Link href="#" className="card col-span-2 p-0 overflow-hidden group relative hover:shadow-lg transition-all duration-300">
            <div className="h-full flex items-center p-5">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                <Mail className="size-[18px]" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[#0f1115]">Smart Emails</div>
                <p className="text-[12px] text-[#6b7180] leading-relaxed">
                  Personalized cold emails generated from real review-derived pain points. Configure tone, CTA, and language.
                </p>
              </div>
              <div className="shrink-0 ml-3 flex items-center gap-3 text-[11px]">
                <div className="flex -space-x-1.5">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-300 to-violet-400 border-2 border-white flex items-center justify-center text-[8px] text-white font-medium">
                      {["S","M","L"][i-1]}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-violet-600 group-hover:underline underline-offset-2">
                  Explore <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* ---- CARD 5: AI Assistant (1x1) ---- */}
          <Link href="#" className="card p-0 overflow-hidden group relative hover:shadow-lg transition-all duration-300">
            <div className="h-full flex flex-col p-5">
              <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                <Sparkles className="size-[18px]" />
              </div>
              <div className="mt-3 text-[15px] font-semibold text-[#0f1115]">AI Assistant</div>
              <p className="mt-1 text-[12px] text-[#6b7180] leading-relaxed flex-1">
                Ask anything about your leads. "Who has the worst reviews in Yogyakarta?"
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#9aa0aa]">
                <span className="bg-[#f0f0f0] rounded px-2 py-1">Powered by LLMs</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-sky-600 group-hover:underline underline-offset-2 mt-1">
                Try it <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </Section>

      {/* =============== STICKY SCROLL — SEARCH › ENRICH › ANALYZE › CLOSE =============== */}
      <StickyFeatureSection />

      {/* =============== ARCHITECTURE =============== */}
      <ArchitectureSection />

      {/* =============== TECH STACK =============== */}
      <TechStackSection />

      {/* =============== TEAM =============== */}
      <TeamSection />

      {/* =============== CTA (sky scene) =============== */}
      <section className="relative h-[60vh] overflow-hidden">
        <SkyScene />
        <div className="relative z-10 h-full flex flex-col items-center justify-center max-w-[1100px] mx-auto px-6 text-center">
          <h2 className="font-display text-[clamp(28px,3vw,40px)] text-white">
            Ready to find your first
            <br />
            <span className="text-white/80">100 leads?</span>
          </h2>
          <p className="text-white/70 text-[14px] mt-3 max-w-[400px]">
            No credit card required. Start prospecting in under 2 minutes.
          </p>
          <Link
            href="/start"
            className="mt-8 inline-flex items-center gap-2 bg-white text-[#0f1115] text-[14px] font-medium rounded-xl px-6 py-3.5 shadow-lg hover:bg-white/90 transition-all"
          >
            <Search className="size-4" />
            Start for free
          </Link>
        </div>
      </section>

      {/* =============== BUILD ACROSS INDUSTRIES (1 viewport) =============== */}
      <Section className="bg-[#fbfaf6]" inner="max-w-[900px]">
        <h2 className="font-display text-center text-[clamp(24px,2.6vw,34px)] text-[#0f1115]">Find leads across industries</h2>
        <p className="text-center text-[13px] text-[#6b7180] mt-2 max-w-[520px] mx-auto">
          From dental clinics and law firms to hotels and gyms. uTune AI covers millions of businesses across Indonesia and SEA.
        </p>
        <WordSearch />
      </Section>

      <Footer />
    </main>
  );
}

/* ====================== Sub-components ====================== */

/* ── Architecture ─────────────────────────────────────────── */
function ArchitectureSection() {
  const nodes = [
    { id: "user",    x: 80,  y: 140, label: "User",          sub: "Next.js 15",        color: "#3b82f6" },
    { id: "api",     x: 240, y: 140, label: "API",           sub: "NestJS 11",          color: "#8b5cf6" },
    { id: "queue",   x: 400, y: 80,  label: "Queue",         sub: "BullMQ + Redis",     color: "#f59e0b" },
    { id: "worker",  x: 400, y: 200, label: "Workers",       sub: "BullMQ Workers",     color: "#f59e0b" },
    { id: "python",  x: 560, y: 200, label: "Scraper",       sub: "Python + Playwright",color: "#10b981" },
    { id: "ai",      x: 560, y: 80,  label: "AI Agents",     sub: "NVIDIA NIM / Llama", color: "#ec4899" },
    { id: "db",      x: 700, y: 140, label: "Database",      sub: "PostgreSQL + Drizzle",color: "#6b7280" },
  ];
  const edges = [
    { x1: 130, y1: 140, x2: 210, y2: 140 },
    { x1: 290, y1: 130, x2: 370, y2: 90  },
    { x1: 290, y1: 150, x2: 370, y2: 190 },
    { x1: 450, y1: 200, x2: 530, y2: 200 },
    { x1: 450, y1: 90,  x2: 530, y2: 90  },
    { x1: 610, y1: 200, x2: 670, y2: 155 },
    { x1: 610, y1: 90,  x2: 670, y2: 130 },
  ];

  const agents = [
    { step: "01", name: "Extractor",  model: "Llama 3.1 8B",  role: "Data extraction specialist",  color: "bg-blue-100 text-blue-700" },
    { step: "02", name: "Finance",    model: "Llama 3.1 70B", role: "Financial analyst",            color: "bg-amber-100 text-amber-700" },
    { step: "03", name: "Marketing",  model: "Llama 3.1 70B", role: "Messaging strategist",         color: "bg-violet-100 text-violet-700" },
    { step: "04", name: "Strategy",   model: "Llama 3.1 70B", role: "Strategic advisor (synthesis)",color: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <section className="bg-white py-24 border-t border-[#e8e6df]">
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e3e1d8] bg-[#f8f7f3] px-3 py-1 text-[11px] text-[#9aa0aa] mb-4">
            <GitBranch className="size-3" /> System Architecture
          </div>
          <h2 className="font-display text-[clamp(24px,2.8vw,36px)] text-[#0f1115]">
            How it works under the hood
          </h2>
          <p className="mt-2 text-[13.5px] text-[#6b7180] max-w-[560px] leading-relaxed">
            A fully async pipeline — from user request to AI-scored lead — built on a queue-first architecture with a 4-agent reasoning chain.
          </p>
        </div>

        {/* System flow diagram */}
        <div className="card p-6 mb-8 overflow-x-auto">
          <div className="text-[11px] text-[#9aa0aa] mb-4 uppercase tracking-wider">System flow</div>
          <svg viewBox="0 0 780 280" className="w-full min-w-[600px] h-[200px]">
            <defs>
              <marker id="arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#d0cec6" />
              </marker>
            </defs>
            {/* edges */}
            {edges.map((e, i) => (
              <line
                key={i}
                x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke="#e3e1d8" strokeWidth="1.5"
                markerEnd="url(#arch-arrow)"
                strokeDasharray="4 3"
              />
            ))}
            {/* nodes */}
            {nodes.map((n) => (
              <g key={n.id}>
                <rect
                  x={n.x - 48} y={n.y - 26}
                  width="96" height="52" rx="8"
                  fill="white" stroke="#e3e1d8" strokeWidth="1.2"
                />
                <rect
                  x={n.x - 48} y={n.y - 26}
                  width="4" height="52" rx="2"
                  fill={n.color}
                />
                <text x={n.x + 4} y={n.y - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0f1115" fontFamily="Inter">
                  {n.label}
                </text>
                <text x={n.x + 4} y={n.y + 10} textAnchor="middle" fontSize="9" fill="#9aa0aa" fontFamily="Inter">
                  {n.sub}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Multi-agent chain */}
        <div className="card p-6">
          <div className="text-[11px] text-[#9aa0aa] mb-5 uppercase tracking-wider">Multi-agent reasoning chain</div>
          <div className="grid md:grid-cols-4 gap-3">
            {agents.map((a, i) => (
              <div key={a.name} className="relative">
                {i < agents.length - 1 && (
                  <div className="hidden md:block absolute top-6 -right-1.5 z-10 text-[#d0cec6] text-[10px]">→</div>
                )}
                <div className="rounded-xl border border-[#e8e6df] bg-[#fafaf8] p-4 h-full">
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium mb-3 ${a.color}`}>
                    {a.step} {a.name}
                  </div>
                  <div className="text-[12px] text-[#3b3f48] leading-snug mb-2">{a.role}</div>
                  <div className="text-[10px] text-[#9aa0aa] bg-[#f0f0f0] rounded px-2 py-1 inline-block">
                    {a.model}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-[#e8e6df] bg-[#f8f7f3] px-4 py-3 text-[12px] text-[#6b7180]">
            Each agent passes typed context to the next. Every step logs <code className="bg-[#eeece6] rounded px-1 text-[11px]">reasoning</code>, <code className="bg-[#eeece6] rounded px-1 text-[11px]">confidence</code>, and <code className="bg-[#eeece6] rounded px-1 text-[11px]">tokensUsed</code> to PostgreSQL — full audit trail per lead.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Tech Stack ───────────────────────────────────────────── */
function TechStackSection() {
  const stack = [
    {
      category: "Frontend",
      color: "bg-blue-50 border-blue-100",
      dot: "bg-blue-400",
      items: [
        { name: "Next.js 15", detail: "App Router, React 19, RSC" },
        { name: "MapLibre GL JS", detail: "Interactive map rendering" },
        { name: "Tailwind v4", detail: "Utility-first styling" },
        { name: "Zustand", detail: "Client state management" },
      ],
    },
    {
      category: "Backend",
      color: "bg-violet-50 border-violet-100",
      dot: "bg-violet-400",
      items: [
        { name: "NestJS 11", detail: "REST API, queue bridge" },
        { name: "BullMQ + Redis", detail: "Async job processing" },
        { name: "Python + Playwright", detail: "Google Maps scraper" },
        { name: "Supabase Auth", detail: "Authentication & sessions" },
      ],
    },
    {
      category: "Data & AI",
      color: "bg-emerald-50 border-emerald-100",
      dot: "bg-emerald-400",
      items: [
        { name: "PostgreSQL", detail: "Primary database" },
        { name: "Drizzle ORM", detail: "Type-safe schema & queries" },
        { name: "NVIDIA NIM", detail: "Llama 3.1 8B + 70B inference" },
        { name: "Vercel AI SDK", detail: "Streaming & structured output" },
      ],
    },
    {
      category: "Infrastructure",
      color: "bg-amber-50 border-amber-100",
      dot: "bg-amber-400",
      items: [
        { name: "pnpm Workspaces", detail: "Monorepo package manager" },
        { name: "Turborepo", detail: "Build orchestration & caching" },
        { name: "Docker + PM2", detail: "Single-container deployment" },
        { name: "TypeScript strict", detail: "End-to-end type safety" },
      ],
    },
  ];

  return (
    <section className="bg-[#fbfaf6] py-24 border-t border-[#e8e6df]">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e3e1d8] bg-[#f0ede6] px-3 py-1 text-[11px] text-[#9aa0aa] mb-4">
            <Layers className="size-3" /> Tech Stack
          </div>
          <h2 className="font-display text-[clamp(24px,2.8vw,36px)] text-[#0f1115]">
            Built with production-grade tools
          </h2>
          <p className="mt-2 text-[13.5px] text-[#6b7180] max-w-[520px] leading-relaxed">
            Every technology choice was deliberate — optimized for developer velocity, type safety, and real-world scale.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stack.map((cat) => (
            <div key={cat.category} className={`rounded-xl border p-5 ${cat.color}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${cat.dot}`} />
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7180]">
                  {cat.category}
                </div>
              </div>
              <div className="space-y-3">
                {cat.items.map((item) => (
                  <div key={item.name}>
                    <div className="text-[13px] font-medium text-[#0f1115]">{item.name}</div>
                    <div className="text-[11px] text-[#9aa0aa] mt-0.5">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Key design decisions */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[
            { icon: Zap,      title: "Queue-first API",       desc: "NestJS controllers only validate and enqueue. No long-running work in request handlers — everything is async via BullMQ." },
            { icon: Shield,   title: "Full audit trail",      desc: "Every AI agent logs reasoning, confidence score, and token usage to PostgreSQL. Full traceability per lead, per execution." },
            { icon: Database, title: "Typed end-to-end",      desc: "Drizzle schema → shared Zod types → NestJS DTOs → React components. One source of truth, zero runtime surprises." },
          ].map((d) => (
            <div key={d.title} className="card p-5">
              <div className="w-8 h-8 rounded-lg bg-[#f0ede6] flex items-center justify-center text-[#6b7180] mb-3">
                <d.icon className="size-4" />
              </div>
              <div className="text-[13px] font-semibold text-[#0f1115] mb-1.5">{d.title}</div>
              <p className="text-[12px] text-[#6b7180] leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Team ─────────────────────────────────────────────────── */
function TeamSection() {
  const team = [
    {
      name: "Muhammad Maulana Firdaussyah",
      role: "Lead Developer & Fullstack Engineer",
      initials: "MF",
      gradient: "from-blue-400 to-violet-500",
      contributions: ["NestJS API + BullMQ pipeline", "Python scraper (Playwright)", "Multi-agent AI orchestration", "Next.js frontend + MapLibre"],
      badge: "Lead Dev",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      name: "Fitri Ayu R",
      role: "Product Designer",
      initials: "FA",
      gradient: "from-pink-400 to-rose-500",
      contributions: ["Product vision & UX flow", "UI design system", "Landing page design", "User research & wireframes"],
      badge: "Design",
      badgeColor: "bg-pink-100 text-pink-700",
    },
  ];

  return (
    <section className="bg-white py-24 border-t border-[#e8e6df]">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e3e1d8] bg-[#f8f7f3] px-3 py-1 text-[11px] text-[#9aa0aa] mb-4">
            <Cpu className="size-3" /> The Team
          </div>
          <h2 className="font-display text-[clamp(24px,2.8vw,36px)] text-[#0f1115]">
            Built by{" "}
            <span className="text-[#6b7180]">Team FTune</span>
          </h2>
          <p className="mt-2 text-[13.5px] text-[#6b7180] max-w-[480px] leading-relaxed">
            Two people, one shared obsession — making B2B prospecting fast, intelligent, and actually enjoyable.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-[760px]">
          {team.map((member) => (
            <div key={member.name} className="card p-6">
              {/* Avatar */}
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-[20px] font-display shrink-0 shadow-sm`}>
                  {member.initials}
                </div>
                <div className="min-w-0 pt-1">
                  <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mb-1.5 ${member.badgeColor}`}>
                    {member.badge}
                  </div>
                  <div className="text-[15px] font-semibold text-[#0f1115] leading-snug">{member.name}</div>
                  <div className="text-[12px] text-[#9aa0aa] mt-0.5">{member.role}</div>
                </div>
              </div>

              {/* Contributions */}
              <div className="border-t border-[#f0ede6] pt-4">
                <div className="text-[10px] text-[#9aa0aa] uppercase tracking-wider mb-2.5">Contributions</div>
                <div className="space-y-1.5">
                  {member.contributions.map((c) => (
                    <div key={c} className="flex items-center gap-2 text-[12px] text-[#3b3f48]">
                      <div className="w-1 h-1 rounded-full bg-[#d0cec6] shrink-0" />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hackathon note */}
        <div className="mt-8 max-w-[760px] rounded-xl border border-[#e8e6df] bg-[#f8f7f3] px-5 py-4 flex items-start gap-3">
          <div className="text-[18px] mt-0.5">🏆</div>
          <div>
            <div className="text-[13px] font-medium text-[#0f1115] mb-1">Built for hackathon — production-ready code</div>
            <p className="text-[12px] text-[#6b7180] leading-relaxed">
              Every feature shown is working code, not a mockup. The scraper runs, the AI agents reason, the database persists. We can demo live reasoning traces and real lead data during Q&A.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WordSearch() {
  const rows = [
    "WLEADSDENTISTPROSPE",
    "CTBDENTALCLINICSLOH",
    "AXXLAWFIRMSPROPECT",
    "FINDYOURNEXTCLIENTP",
    "EAGROCARSHOTELSALOT",
    "TZEJAKARTABANDUNGYA",
    "RCXRESTAURANTEGYMR",
    "IAUVGROWTHAGENCYSOL",
    "AMEDICALCLINICCNUIR",
    "SREALESTATEAGENTOSM",
  ];
  const hits = new Set<string>([
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((c) => `1:${c}`),
    ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((c) => `4:${c}`),
    ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((c) => `7:${c}`),
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((c) => `8:${c}`),
    ...[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((c) => `9:${c}`),
  ]);
  return (
    <div className="mt-10 mx-auto max-w-[560px]">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${rows[0].length}, 1fr)` }}>
        {rows.map((row, r) =>
          row.split("").map((ch, c) => (
            <div key={`${r}-${c}`} className={`ws-cell ${hits.has(`${r}:${c}`) ? "ws-hit" : ""}`}>
              {ch}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
