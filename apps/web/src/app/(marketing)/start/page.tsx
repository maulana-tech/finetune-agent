import Link from "next/link";
import TopNav from "@/components/landing/TopNav";
import RocketScene from "@/components/landing/RocketScene";

type TocItem = { id: string; label: string };
type TocChapter = { num: string; title: string; href: string; items: TocItem[]; active?: boolean };

const toc: TocChapter[] = [
  {
    num: "1.0",
    title: "Business Finder",
    href: "/start",
    active: true,
    items: [
      { id: "introduction", label: "Overview" },
      { id: "search-basics", label: "Search by Location" },
      { id: "keywords", label: "Multi-Keyword Search" },
      { id: "results", label: "Understanding Results" },
      { id: "filters", label: "Filters and Tiers" },
      { id: "export", label: "Exporting Leads" },
    ],
  },
  {
    num: "2.0",
    title: "Mapped CRM",
    href: "#",
    items: [
      { id: "c-intro", label: "Map Overview" },
      { id: "c-pins", label: "Lead Pins" },
      { id: "c-filters", label: "Map Filters" },
      { id: "c-pipeline", label: "Pipeline Stages" },
      { id: "c-detail", label: "Lead Detail Panel" },
    ],
  },
  {
    num: "3.0",
    title: "Smart Reviews",
    href: "#",
    items: [
      { id: "r-intro", label: "How It Works" },
      { id: "r-summary", label: "AI Summary" },
      { id: "r-insights", label: "Pain Point Detection" },
    ],
  },
  {
    num: "4.0",
    title: "Smart Emails",
    href: "#",
    items: [
      { id: "e-intro", label: "Personalization" },
      { id: "e-tone", label: "Tone and Language" },
      { id: "e-send", label: "Sending from CRM" },
    ],
  },
];

export default function StartPage() {
  return (
    <main className="bg-white text-[#0f1115]">
      <div className="bg-[#fbfaf6] border-b border-[#efede6]">
        <TopNav variant="dark" />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 py-12 grid grid-cols-[260px_minmax(0,1fr)] gap-12">
        {/* ============ SIDEBAR ============ */}
        <aside className="hidden md:block">
          <div className="sticky top-8">
            <div className="text-[11px] text-[#9aa0aa] uppercase tracking-wider mb-4">
              Getting started
              <br />
              with uTune AI
            </div>

            <nav className="space-y-5 text-[12.5px]">
              {toc.map((ch) => (
                <div key={ch.num}>
                  <Link
                    href={ch.href}
                    className={`flex items-baseline gap-2 ${ch.active ? "text-[#0f1115] font-medium" : "text-[#6b7180]"}`}
                  >
                    <span className="text-[10px] text-[#9aa0aa]">{ch.num}</span>
                    <span>{ch.title}</span>
                  </Link>
                  {ch.active && (
                    <ul className="mt-2 ml-5 space-y-1.5 border-l border-[#efede6] pl-3">
                      {ch.items.map((it, idx) => (
                        <li key={it.id}>
                          <a
                            href={`#${it.id}`}
                            className={`block text-[12px] ${
                              idx === 0 ? "text-[#0f1115] font-medium" : "text-[#6b7180] hover:text-[#0f1115]"
                            }`}
                          >
                            {it.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </nav>

            <button className="mt-8 btn-dark text-[11px] w-full justify-center">Start prospecting</button>
          </div>
        </aside>

        {/* ============ ARTICLE ============ */}
        <article className="max-w-[680px]">
          <div className="text-[11px] text-[#9aa0aa] uppercase tracking-wider mb-3">Guide 1</div>
          <h1 className="font-display text-[44px] leading-[1.1] tracking-tight">Business Finder</h1>

          <p className="mt-6 text-[15px] leading-[1.7] text-[#3b3f48]">
            The Business Finder is your starting point. Search millions of companies across Indonesia and SEA by industry and location.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            No more manual scraping from Google Maps. No more spreadsheets with outdated data. Just pick your target area, choose your keywords, and let uTune AI do the rest.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            This guide walks you through running your first search and understanding the results.
          </p>

          <div className="mt-10 rounded-xl overflow-hidden border border-[#efede6]">
            <div className="aspect-[16/9]">
              <RocketScene />
            </div>
          </div>

          <h2 id="search-basics" className="font-display text-[26px] mt-14">Search by Location</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            You can search by country → region → province → city, or draw a custom polygon directly on the map.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            The map interface lets you visually select your target area. Zoom in to street level for hyper-local prospecting, or zoom out for regional campaigns. Every search creates a job that runs in the background.
          </p>
          <p className="mt-4 font-medium text-[14px]">Best practices:</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.7] text-[#3b3f48] list-disc pl-5">
            <li>Start with a specific city or district for your first search.</li>
            <li>Use the polygon tool for irregular boundaries.</li>
            <li>Combine multiple areas in a single job for broader coverage.</li>
            <li>Results are capped at 1,000 businesses per job (configurable by plan).</li>
          </ul>

          <h2 id="keywords" className="font-display text-[26px] mt-14">Multi-Keyword Search</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            Run multiple business types in a single search. For example: <strong className="font-medium">dentists, lawyers, clinics</strong> in Jakarta.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            Each keyword acts as a separate query, and results are merged and deduplicated automatically. You can also select output language — results are normalized to Bahasa Indonesia, English, or 26+ other languages.
          </p>
          <p className="mt-4 font-medium text-[14px]">Tips for keyword selection:</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.7] text-[#3b3f48] list-disc pl-5">
            <li>Use industry-standard terms (e.g. "dental clinic" not "tooth doctor").</li>
            <li>Include variants like "restaurant, cafe, eatery".</li>
            <li>Think about what your ideal prospect calls themselves.</li>
          </ul>

          <h2 id="results" className="font-display text-[26px] mt-14">Understanding Results</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            Each result includes: business name, full address, phone number, website, operating hours, category, and coordinates.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            Depending on your plan tier, you can also get enriched data: emails, mobile numbers, WhatsApp, social links, Google reviews, AI insights, and personalized emails.
          </p>

          <div className="my-10 rounded-xl border border-[#dfeeff] bg-[#f3faff] p-5">
            <div className="text-[11px] text-[#3d8de0] uppercase tracking-wider mb-2">★ uTune AI feature</div>
            <p className="text-[13.5px] text-[#3b3f48] leading-relaxed">
              Free tier gives you 15–50 leads with no credit card required. Enough to validate your prospecting workflow before upgrading.
            </p>
          </div>

          <h2 id="filters" className="font-display text-[26px] mt-14">Filters and Tiers</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            Each search job lets you toggle enrichment tiers before running:
          </p>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.7] text-[#3b3f48] list-disc pl-5">
            <li><strong className="font-medium">Business data</strong> — name, address, phone, website, hours (base).</li>
            <li><strong className="font-medium">Enriched data</strong> — emails, mobile, social, WhatsApp (paid).</li>
            <li><strong className="font-medium">Smart Reviews</strong> — 10/20/40 reviews per lead, AI summary.</li>
            <li><strong className="font-medium">Smart Sales</strong> — weaknesses, strengths, opportunities.</li>
            <li><strong className="font-medium">Smart Emails</strong> — 1/2/4 personalized cold emails per lead.</li>
          </ul>

          <div className="my-10 rounded-xl border border-[#dfeeff] bg-[#f3faff] p-5">
            <div className="text-[11px] text-[#3d8de0] uppercase tracking-wider mb-2">★ uTune AI feature</div>
            <p className="text-[13.5px] text-[#3b3f48] leading-relaxed">
              Restaurant Menu extraction is also available for F&B verticals — get menu items, pricing, and popular dishes alongside lead data.
            </p>
          </div>

          <h2 id="export" className="font-display text-[26px] mt-14">Exporting Leads</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            Once your search is complete, you can import selected leads directly into your CRM. Each lead becomes a pin on your map with a full profile.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            From there, you can assign pipeline stages, add notes, schedule visits, and trigger AI analysis — all without leaving the map interface.
          </p>

          <div className="my-8 rounded-xl border border-[#dfeeff] bg-[#f3faff] p-5">
            <div className="text-[11px] text-[#3d8de0] uppercase tracking-wider mb-2">★ uTune AI feature</div>
            <p className="text-[13.5px] text-[#3b3f48] leading-relaxed">
              Pipeline stages are fully customizable per workspace. Create stages that match your sales process — from "New Lead" to "Closed Won".
            </p>
          </div>

          <h3 className="font-medium text-[16px] mt-12">What comes next</h3>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#3b3f48]">
            Once you have imported leads, head to the CRM to manage them on the map, filter by criteria, and start outreach. The Mapped CRM guide covers all of that.
          </p>

          <div className="mt-14 flex items-center justify-between border-t border-[#efede6] pt-6 text-[12px]">
            <Link href="/" className="text-[#9aa0aa] hover:text-[#0f1115]">← Back to home</Link>
            <Link href="#" className="font-medium text-[#0f1115]">Guide 2: Mapped CRM →</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
