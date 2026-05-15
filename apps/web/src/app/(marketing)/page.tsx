import Link from "next/link";
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
            Cofounder lets you run an
            <br /> entire company with agents
          </h1>
          <p className="text-white/90 text-[15px] mt-4 max-w-[460px]">
            Run engineering, sales, marketing, design, finance, and ops.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <Link href="#" className="btn-dark">Run a company</Link>
            <Link href="#" className="btn-ghost">Check out the launch! →</Link>
          </div>
        </div>
      </section>

      {/* =============== ORCHESTRATION PLATFORM (1 viewport) =============== */}
      <Section className="bg-[#fbfaf6]">
        <h2 className="font-display text-center text-[clamp(24px,2.6vw,34px)] leading-snug text-[#0f1115] max-w-[760px] mx-auto">
          Cofounder is an agent orchestration platform
          <br />
          <span className="text-[#6b7180]">designed to help you run an entire business</span>
        </h2>

        <div className="mt-10 grid md:grid-cols-[1.4fr_1fr] gap-4">
          <div className="card p-5">
            <div className="text-[11px] text-[#9aa0aa] mb-3">Agents › Departments › Roles</div>
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
                { x: 110, y: 80, label: "Legal" },
                { x: 200, y: 40, label: "Design" },
                { x: 280, y: 40, label: "Product" },
                { x: 370, y: 80, label: "Finance" },
                { x: 120, y: 220, label: "Marketing" },
                { x: 240, y: 245, label: "Sales" },
                { x: 370, y: 220, label: "Engineering" },
              ].map((n) => (
                <g key={n.label}>
                  <rect x={n.x - 38} y={n.y - 12} width="76" height="24" rx="5" fill="#fff" stroke="#e3e1d8" />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="10" fill="#3b3f48" fontFamily="Inter">{n.label}</text>
                </g>
              ))}
              <g>
                <circle cx="240" cy="150" r="22" fill="#fff" stroke="#e3e1d8" />
                <text x="240" y="153" textAnchor="middle" fontSize="10" fill="#0f1115" fontFamily="Inter" fontWeight="600">you</text>
              </g>
              <circle cx="240" cy="118" r="4" fill="#ffcc3a" />
            </svg>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 text-[11px] text-[#9aa0aa] mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Bash &nbsp; Edit &nbsp; Search &nbsp; Read
            </div>
            <div className="text-[12px] text-[#3b3f48] leading-relaxed border-l-2 border-[#e8e6df] pl-3">
              Let's reach out to potential customers in verticals we may know.
            </div>
            <ul className="mt-3 space-y-2 text-[12px] text-[#3b3f48]">
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span>I can pull you a list of contacts from the open source community.</li>
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span>Drafting a campaign would be useful for outreach.</li>
            </ul>
            <div className="mt-4 space-y-2">
              <div className="rounded-md border border-[#e8e6df] bg-[#fbfaf6] px-3 py-2 flex items-center justify-between text-[12px]">
                <span>Growth Agent — Approve campaign brief</span>
                <button className="bg-[#0f1115] text-white text-[11px] rounded px-2 py-1">Approve</button>
              </div>
              <div className="rounded-md border border-[#e8e6df] bg-[#fbfaf6] px-3 py-2 flex items-center justify-between text-[12px]">
                <span>Sales Agent — Send sequence to 24 leads</span>
                <button className="bg-[#0f1115] text-white text-[11px] rounded px-2 py-1">Approve</button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-10">
          {[
            { t: "Agentic departments", d: "Cofounder is designed like a real company with departments, managers, and shared context." },
            { t: "Human in the loop", d: "Agents work alongside you, requiring approval when potentially dangerous actions are taken." },
            { t: "Fully extensible", d: "Easily connect MCP, custom APIs, custom skills, or an entire custom codebase to Cofounder." },
          ].map((c) => (
            <div key={c.t}>
              <div className="text-[13px] font-semibold text-[#0f1115]">{c.t}</div>
              <p className="text-[12.5px] text-[#6b7180] mt-1.5 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* =============== LEARN HOW TO START (1 viewport) =============== */}
      <Section className="bg-[#fbfaf6]" inner="max-w-[920px]">
        <h2 className="font-display text-center text-[clamp(24px,2.6vw,34px)] text-[#0f1115]">Learn how to start a company</h2>
        <p className="text-center text-[13px] text-[#6b7180] mt-2">
          Read the full guide on how to start a company and how you can do it easier with Cofounder.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-5">
          {[
            { n: 1, t: "How To Start", cover: "cover-start", emoji: "🚀", href: "/start" },
            { n: 2, t: "How To Build", cover: "cover-build", emoji: "🧰", href: "/build" },
            { n: 3, t: "How To Sell", cover: "cover-sell", emoji: "🏜️", href: "/sell" },
            { n: 4, t: "How To Scale", cover: "cover-scale", emoji: "🏙️", href: "/scale" },
          ].map((c) => (
            <Link href={c.href} key={c.n} className="card p-3 group hover:shadow-md transition-shadow">
              <div className={`${c.cover} h-[160px] rounded-md flex items-end justify-center text-4xl pb-3`}>
                <span aria-hidden>{c.emoji}</span>
              </div>
              <div className="px-2 pt-3 pb-1">
                <div className="text-[11px] text-[#9aa0aa] uppercase tracking-wider">Chapter {c.n}</div>
                <div className="text-[15px] font-medium text-[#0f1115] mt-0.5">{c.t}</div>
              </div>
              <div className="px-2 mt-3 text-[11px] text-[#9aa0aa] flex items-center justify-between border-t border-[#efede6] pt-2">
                <span>Read the chapter →</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* =============== BUILD A REAL COMPANY — INTRO (1 viewport) =============== */}
      <Section className="bg-[#fbfaf6]">
        <h2 className="font-display text-[clamp(28px,3.2vw,42px)] text-[#0f1115] max-w-[640px]">
          Build a real company with
          <br />
          <span className="text-[#6b7180]">the help of specialized agents</span>
        </h2>
        <p className="text-[14px] text-[#6b7180] mt-3 max-w-[520px]">
          From the first lines of code to a one-billion-dollar revenue, Cofounder will support you through every stage of the journey.
        </p>
        <div className="mt-10 grid grid-cols-4 gap-4 max-w-[640px] text-[11px] uppercase tracking-wider text-[#9aa0aa]">
          <div className="border-t-2 border-[#0f1115] pt-2 text-[#0f1115]">Roadmap</div>
          <div className="border-t border-[#e8e6df] pt-2">Build</div>
          <div className="border-t border-[#e8e6df] pt-2">Sell</div>
          <div className="border-t border-[#e8e6df] pt-2">Scale</div>
        </div>
      </Section>

      {/* =============== FEATURE 1: ROADMAP =============== */}
      <Section className="bg-[#fbfaf6]">
        <FeatureRow
          icon="📁"
          title="A full roadmap tailored to your company"
          desc="When starting a company, it's hard to know what's next. Cofounder guides you through all of the steps to get a real business up and running, freeing you to focus on what truly matters."
          cta="Learn How To Start"
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

      {/* =============== FEATURE 2: BUILD =============== */}
      <Section className="bg-[#fbfaf6]">
        <FeatureRow
          icon="🗂️"
          title="Build products and manage your infrastructure with agents"
          desc="Design, build, and deploy products with engineering agents. Once you're live, infrastructure and security agents monitor and act in real time."
          cta="Learn How To Build"
        >
          <div className="grid grid-cols-[1.3fr_1fr] gap-3">
            <div className="card p-4">
              <div className="text-[12px] font-medium mb-2">Automate your life with natural language</div>
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
              <div className="text-[11px] text-[#9aa0aa] mb-1.5">Action: Deploy</div>
              <div className="space-y-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div className="h-1.5 flex-1 bg-[#efede6] rounded" />
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full bg-[#0f1115] text-white text-[11px] rounded py-1.5">Approve</button>
            </div>
          </div>
        </FeatureRow>
      </Section>

      {/* =============== FEATURE 3: SELL =============== */}
      <Section className="bg-[#fbfaf6]">
        <FeatureRow
          icon="📨"
          title="Automate sales and marketing with agents"
          desc="Cofounder handles inbox warming, email outbound campaigns, content creation, paid marketing, organic social, and analytics."
          cta="Learn How To Sell"
        >
          <div className="grid grid-cols-[1.2fr_1fr] gap-3">
            <div className="card p-4">
              <div className="text-[12px] font-medium mb-2">Email Campaign</div>
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
              <div className="text-[11px] text-[#9aa0aa]">Open rate</div>
              <div className="text-[28px] font-display">58%</div>
              <div className="h-2 rounded-full bg-[#efede6] overflow-hidden mt-2">
                <div className="h-full w-[58%] bg-emerald-400" />
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

      {/* =============== FEATURE 4: SCALE =============== */}
      <Section className="bg-[#fbfaf6]">
        <FeatureRow
          icon="📊"
          title="Scale with product analytics, Stripe payments, and customer support"
          desc="Cofounder agents run customer support, set up payments through Stripe, and handle inbound customer support so you can scale quickly."
          cta="Learn How To Scale"
        >
          <div className="grid grid-cols-[1.3fr_1fr] gap-3">
            <div className="card p-4">
              <div className="flex items-baseline gap-6 mb-3">
                <div><div className="text-[10px] text-[#9aa0aa]">MRR</div><div className="text-[18px] font-display">234</div></div>
                <div><div className="text-[10px] text-[#9aa0aa]">Subs</div><div className="text-[18px] font-display">18,251</div></div>
                <div><div className="text-[10px] text-[#9aa0aa]">Tickets</div><div className="text-[18px] font-display">49 / 162</div></div>
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
                  <button className="text-[10px] bg-[#0f1115] text-white rounded px-2 py-1">Reply</button>
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
            All the tools and systems
            <br />
            <span className="text-white/90">your company needs</span>
          </h2>
          <p className="text-white/90 text-[14px] mt-3 max-w-[560px] mx-auto">
            You stay in control, working ships without your approval. Cofounder agents work hand in hand with you, you stay in the loop.
          </p>
          <div className="mt-10 max-w-[760px] mx-auto card p-5 text-left">
            <div className="text-[12px] font-medium mb-3">Email Template</div>
            <div className="grid grid-cols-[120px_1fr] gap-3 text-[12px]">
              {[
                ["Subject Line", "Welcome to our newsletter!"],
                ["Name", "Cofounder"],
                ["Sender Email", "newsletter@cofounder.com"],
                ["Audience", "All subscribers"],
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
              <button className="btn-dark text-[11px]">Send to subscribers</button>
            </div>
          </div>
        </div>
      </section>

      {/* =============== BUILD ACROSS INDUSTRIES (1 viewport) =============== */}
      <Section className="bg-[#fbfaf6]" inner="max-w-[900px]">
        <h2 className="font-display text-center text-[clamp(24px,2.6vw,34px)] text-[#0f1115]">Build across industries</h2>
        <p className="text-center text-[13px] text-[#6b7180] mt-2 max-w-[520px] mx-auto">
          From software products to service platforms and marketplaces. Cofounder helps you turn ideas into working companies.
        </p>
        <WordSearch />
      </Section>

      {/* =============== FOOTER (1 viewport) =============== */}
      <section className="bg-[#fbfaf6] border-t border-[#efede6] min-h-screen flex flex-col justify-center">
        <div className="max-w-[1100px] mx-auto px-6 w-full">
          <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
            <div>
              <h3 className="font-display text-[26px] leading-snug">
                Run an entire company
                <br />
                <span className="text-[#6b7180]">with AI agents</span>
              </h3>
              <div className="mt-8 flex items-center gap-3 text-[11px] text-[#9aa0aa]">
                <Link className="font-medium text-[#0f1115]" href="/start">Start</Link>
                <Link href="/build">Build</Link>
                <Link href="/sell">Sell</Link>
                <Link href="/scale">Scale</Link>
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
                <div className="font-medium">Cofounder is an agent orchestration platform</div>
                <div className="text-white/90">designed to run an entire business.</div>
                <span className="inline-block mt-2 bg-white text-[#0f1115] rounded px-2 py-1 text-[10px]">Run a company</span>
              </div>
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-between text-[11px] text-[#9aa0aa]">
            <div>© Cofounder 2026. Powered with intelligence.</div>
            <div>Made by Studio</div>
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
  icon: string;
  title: string;
  desc: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-[1fr_1.4fr] gap-12 items-center">
      <div>
        <div className="w-9 h-9 rounded-md bg-[#cfeefc] flex items-center justify-center text-[18px]">{icon}</div>
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
    "QVEAISROPLATFORMTIA",
    "RAIVOICEAGENTBVCXZQ",
    "YOUTUBERTNGIUBECLAV",
    "VERTWUSPRYLZNEWQTSI",
    "AINEWSLETTERFIRMBHH",
    "BGRECRUITINGTSRMKAW",
    "MCYNETPVRITERZXRZUE",
    "VJCONSULTINGEKZIRTC",
    "KSUPPORTAGENTHMRCKV",
    "LRUYADRGROWTHAGENCY",
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
