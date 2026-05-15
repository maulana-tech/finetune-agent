import Link from "next/link";
import { Search, Map, Star, Mail, Sparkles, Target, Globe, ChevronRight } from "lucide-react";
import HeroScene from "@/components/landing/HeroScene";
import SkyScene from "@/components/landing/SkyScene";
import TopNav from "@/components/landing/TopNav";

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
          <h1 className="font-display text-white text-[clamp(36px,5vw,56px)] leading-[1.05] max-w-[640px] drop-shadow-[0_1px_0_rgba(0,0,0,0.18)]">
            uTune AI lets you find millions
            <br /> of B2B leads on a map
          </h1>
          <p className="text-white/90 text-[15px] mt-4 max-w-[460px]">
            Search businesses by industry + location, enrich with AI reviews and emails, and close deals faster.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <Link href="#" className="btn-dark">Find leads</Link>
            <Link href="#" className="btn-ghost">Watch the demo →</Link>
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

      {/* =============== BUILD A REAL COMPANY — INTRO (1 viewport) =============== */}
      <Section className="bg-[#fbfaf6]">
        <h2 className="font-display text-[clamp(28px,3.2vw,42px)] text-[#0f1115] max-w-[640px]">
          Millions of businesses at
          <br />
          <span className="text-[#6b7180]">your fingertips, ready to prospect</span>
        </h2>
        <p className="text-[14px] text-[#6b7180] mt-3 max-w-[520px]">
          From searching businesses on a map to closing deals — uTune AI supports your entire sales workflow.
        </p>
        <div className="mt-10 grid grid-cols-4 gap-4 max-w-[640px] text-[11px] uppercase tracking-wider text-[#9aa0aa]">
          <div className="border-t-2 border-[#0f1115] pt-2 text-[#0f1115]">Search</div>
          <div className="border-t border-[#e8e6df] pt-2">Enrich</div>
          <div className="border-t border-[#e8e6df] pt-2">Analyze</div>
          <div className="border-t border-[#e8e6df] pt-2">Close</div>
        </div>
      </Section>

      {/* =============== FEATURE 1: BUSINESS FINDER =============== */}
      <Section className="bg-[#fbfaf6]">
        <FeatureRow
          icon={<Search className="size-[18px]" />}
          title="Search millions of businesses by industry and location"
          desc="Search by country, region, province, city — or draw a custom polygon on the map. Run multiple keywords per job and get names, addresses, phones, websites, and hours in seconds."
          cta="Try Business Finder"
        >
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card p-3 h-[88px]">
                <div className="h-2 w-3/4 bg-[#efede6] rounded mb-2" />
                <div className="h-1.5 w-1/2 bg-[#efede6] rounded mb-1" />
                <div className="h-1.5 w-2/3 bg-[#efede6] rounded" />
              </div>
            ))}
          </div>
        </FeatureRow>
      </Section>

      {/* =============== FEATURE 2: MAPPED CRM =============== */}
      <Section className="bg-[#fbfaf6]">
        <FeatureRow
          icon={<Map className="size-[18px]" />}
          title="Every lead is a pin on a real interactive map"
          desc="Import leads directly to your map. Filter by rating, pipeline stage, assigned rep, or area. Slide open the lead detail panel without leaving the map view."
          cta="Explore CRM Features"
        >
          <div className="grid grid-cols-[1.3fr_1fr] gap-3">
            <div className="card p-4">
              <div className="text-[12px] font-medium mb-2">Your leads on a map</div>
              <div className="space-y-1.5">
                <div className="h-1.5 w-11/12 bg-[#efede6] rounded" />
                <div className="h-1.5 w-10/12 bg-[#efede6] rounded" />
                <div className="h-1.5 w-9/12 bg-[#efede6] rounded" />
                <div className="h-1.5 w-11/12 bg-[#efede6] rounded" />
                <div className="h-1.5 w-7/12 bg-[#efede6] rounded" />
              </div>
              <div className="mt-3 rounded-md h-[64px] bg-gradient-to-b from-[#cfeefc] to-[#a8dcff]" />
            </div>
            <div className="card p-3">
              <div className="text-[11px] text-[#9aa0aa] mb-1.5">Lead: Dental Clinic</div>
              <div className="space-y-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div className="h-1.5 flex-1 bg-[#efede6] rounded" />
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full bg-[#0f1115] text-white text-[11px] rounded py-1.5">View details</button>
            </div>
          </div>
        </FeatureRow>
      </Section>

      {/* =============== FEATURE 3: SMART REVIEWS =============== */}
      <Section className="bg-[#fbfaf6]">
        <FeatureRow
          icon={<Star className="size-[18px]" />}
          title="AI-powered review analysis per lead"
          desc="Pull Google reviews for every lead. Sort by rating, detect recurring complaints, and get AI summaries in your chosen language. Know each prospect before you reach out."
          cta="See Smart Reviews"
        >
          <div className="grid grid-cols-[1.2fr_1fr] gap-3">
            <div className="card p-4">
              <div className="text-[12px] font-medium mb-2">Review Summary</div>
              <div className="space-y-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-16 h-1.5 bg-[#efede6] rounded" />
                    <div className="flex-1 h-1.5 bg-[#efede6] rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-[11px] text-[#9aa0aa]">Avg rating</div>
              <div className="text-[28px] font-display">3.8</div>
              <div className="h-2 rounded-full bg-[#efede6] overflow-hidden mt-2">
                <div className="h-full w-[76%] bg-amber-400" />
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-11/12 bg-[#efede6] rounded" />
                <div className="h-1.5 w-9/12 bg-[#efede6] rounded" />
                <div className="h-1.5 w-10/12 bg-[#efede6] rounded" />
              </div>
            </div>
          </div>
        </FeatureRow>
      </Section>

      {/* =============== FEATURE 4: SMART EMAILS =============== */}
      <Section className="bg-[#fbfaf6]">
        <FeatureRow
          icon={<Mail className="size-[18px]" />}
          title="Personalized cold emails generated from real pain points"
          desc="Smart Emails drafts personalized cold emails per lead using review-derived insights. Configure tone, CTA, language, and length. Send directly from the CRM."
          cta="Try Smart Emails"
        >
          <div className="grid grid-cols-[1.3fr_1fr] gap-3">
            <div className="card p-4">
              <div className="flex items-baseline gap-6 mb-3">
                <div><div className="text-[10px] text-[#9aa0aa]">Sent</div><div className="text-[18px] font-display">234</div></div>
                <div><div className="text-[10px] text-[#9aa0aa]">Opens</div><div className="text-[18px] font-display">18.2k</div></div>
                <div><div className="text-[10px] text-[#9aa0aa]">Replies</div><div className="text-[18px] font-display">49 / 162</div></div>
              </div>
              <svg viewBox="0 0 400 120" className="w-full h-[120px]">
                <polyline fill="none" stroke="#e8e6df" strokeWidth="1" points="0,90 60,80 120,70 180,60 240,40 300,30 360,20 400,15" />
                <polyline fill="none" stroke="#3d8de0" strokeWidth="2" points="0,100 60,95 120,75 180,72 240,55 300,42 360,30 400,18" />
              </svg>
            </div>
            <div className="card p-3 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#efede6] last:border-0 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#efede6]" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-20 bg-[#efede6] rounded" />
                      <div className="h-1.5 w-12 bg-[#efede6] rounded" />
                    </div>
                  </div>
                  <button className="text-[10px] bg-[#0f1115] text-white rounded px-2 py-1">Send</button>
                </div>
              ))}
            </div>
          </div>
        </FeatureRow>
      </Section>

      {/* =============== ALL THE TOOLS (1 viewport) =============== */}
      <section className="relative h-screen overflow-hidden">
        <SkyScene />
        <div className="relative z-10 h-full flex flex-col justify-center max-w-[1100px] mx-auto px-6 text-center">
          <h2 className="font-display text-[clamp(28px,3vw,40px)] text-white">
            All the tools your
            <br />
            <span className="text-white/90">sales team needs</span>
          </h2>
          <p className="text-white/90 text-[14px] mt-3 max-w-[560px] mx-auto">
            Search millions of leads, enrich with AI insights, draft emails, and track your pipeline — all on one map.
          </p>
          <div className="mt-10 max-w-[760px] mx-auto card p-5 text-left">
            <div className="text-[12px] font-medium mb-3">Lead Profile</div>
            <div className="grid grid-cols-[120px_1fr] gap-3 text-[12px]">
              {[
                ["Business", "Dental Clinic Jakarta"],
                ["Rating", "★★★★☆ (4.2)"],
                ["Phone", "+62 21 5555 1234"],
                ["Industry", "Healthcare"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <div className="text-[#9aa0aa]">{k}</div>
                  <div className="text-[#0f1115]">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-[#efede6] pt-3 text-[12px] text-[#6b7180] space-y-1.5">
              <div className="h-1.5 w-11/12 bg-[#efede6] rounded" />
              <div className="h-1.5 w-10/12 bg-[#efede6] rounded" />
              <div className="h-1.5 w-9/12 bg-[#efede6] rounded" />
            </div>
            <div className="mt-3 flex justify-end">
              <button className="btn-dark text-[11px]">Add to pipeline</button>
            </div>
          </div>
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

      {/* =============== FOOTER (1 viewport) =============== */}
      <section className="bg-[#fbfaf6] border-t border-[#efede6] min-h-screen flex flex-col justify-center">
        <div className="max-w-[1100px] mx-auto px-6 w-full">
          <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
            <div>
              <h3 className="font-display text-[26px] leading-snug">
                Find and close more
                <br />
                <span className="text-[#6b7180]">B2B deals with uTune AI</span>
              </h3>
              <div className="mt-8 flex items-center gap-3 text-[11px] text-[#9aa0aa]">
                <Link className="font-medium text-[#0f1115]" href="#">Finder</Link>
                <Link href="#">CRM</Link>
                <Link href="#">Reviews</Link>
                <Link href="#">Emails</Link>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 text-[12px] text-[#6b7180]">
                <Link href="/">Homepage</Link>
                <Link href="#">Pricing</Link>
              </div>
            </div>
            <div className="space-y-2 text-[12px] text-[#6b7180]">
              <div className="text-[#0f1115] text-[11px] uppercase tracking-wider mb-2">Company</div>
              <Link className="block" href="#">Privacy Policy</Link>
              <Link className="block" href="#">Terms of Service</Link>
              <Link className="block" href="#">Docs</Link>
            </div>
            <div className="space-y-2 text-[12px] text-[#6b7180]">
              <div className="text-[#0f1115] text-[11px] uppercase tracking-wider mb-2">Social</div>
              <Link className="block" href="#">X</Link>
              <Link className="block" href="#">in</Link>
            </div>
            <Link href="#" className="rounded-xl overflow-hidden relative h-[200px] flex flex-col justify-end">
              <svg viewBox="0 0 240 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
                <defs>
                  <linearGradient id="footerSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6cbfff" />
                    <stop offset="100%" stopColor="#cdeeff" />
                  </linearGradient>
                </defs>
                <rect width="240" height="180" fill="url(#footerSky)" />
                <ellipse cx="60" cy="40" rx="30" ry="8" fill="#fff" />
                <ellipse cx="200" cy="60" rx="22" ry="6" fill="#fff" />
                <path d="M0,140 C60,120 120,160 240,130 L240,180 L0,180 Z" fill="#5fa84d" />
                <g transform="translate(165,80)">
                  <rect x="-1" y="18" width="3" height="50" fill="#3d7a2e" />
                  {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i * 30 * Math.PI) / 180;
                    const x = Math.cos(a) * 18;
                    const y = Math.sin(a) * 18;
                    return <ellipse key={i} cx={x} cy={y} rx="10" ry="5" transform={`rotate(${i * 30})`} fill="#ffcc3a" />;
                  })}
                  <circle r="10" fill="#7a4a1a" />
                </g>
              </svg>
              <div className="relative p-3 text-white text-[11px] leading-snug">
                <div className="font-medium">uTune AI is a B2B lead generation platform</div>
                <div className="text-white/90">designed for field sales teams.</div>
                <span className="inline-block mt-2 bg-white text-[#0f1115] rounded px-2 py-1 text-[10px]">Find leads</span>
              </div>
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-between text-[11px] text-[#9aa0aa]">
            <div>© uTune AI 2026. Built for field sales teams.</div>
            <div>Made by KonaKorp</div>
          </div>
        </div>
        <div className="grass-strip mt-8" />
      </section>
    </main>
  );
}

/* ====================== Sub-components ====================== */

function FeatureRow({
  icon,
  title,
  desc,
  cta,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-[1fr_1.4fr] gap-12 items-center">
      <div>
        <div className="w-9 h-9 rounded-md bg-[#cfeefc] flex items-center justify-center text-[#0f1115]">{icon}</div>
        <h3 className="mt-5 text-[clamp(20px,2.2vw,28px)] font-medium text-[#0f1115] leading-snug">{title}</h3>
        <p className="mt-3 text-[13.5px] text-[#6b7180] leading-relaxed max-w-[420px]">{desc}</p>
        <Link href="/start" className="mt-4 inline-block text-[11px] text-[#9aa0aa] uppercase tracking-wider hover:text-[#0f1115]">
          {cta} →
        </Link>
      </div>
      <div>{children}</div>
    </div>
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
