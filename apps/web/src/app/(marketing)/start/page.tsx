import Link from "next/link";
import TopNav from "@/components/landing/TopNav";
import RocketScene from "@/components/landing/RocketScene";

type TocItem = { id: string; label: string };
type TocChapter = { num: string; title: string; href: string; items: TocItem[]; active?: boolean };

const toc: TocChapter[] = [
  {
    num: "1.0",
    title: "How to start",
    href: "/start",
    active: true,
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "should-you-start", label: "Should You Start a Company?" },
      { id: "ideas", label: "How to Come Up With Startup Ideas" },
      { id: "evaluate", label: "Evaluate Startup Ideas" },
      { id: "wedge", label: "Pick a Wedge Market" },
      { id: "name", label: "Pick a Name and Domain" },
      { id: "leap", label: "Take the Leap" },
    ],
  },
  {
    num: "2.0",
    title: "How to build",
    href: "/build",
    items: [
      { id: "b-intro", label: "Introduction" },
      { id: "b-spec", label: "Come up with a spec" },
      { id: "b-repo", label: "Create a repository" },
      { id: "b-deploy", label: "Set up deployment" },
      { id: "b-secret", label: "Secret management" },
      { id: "b-scaffold", label: "Scaffold your app" },
      { id: "b-quality", label: "Testing and quality" },
      { id: "b-frontend", label: "The frontend" },
      { id: "b-backend", label: "The backend" },
      { id: "b-prod", label: "Deploy to production" },
      { id: "b-debug", label: "Debugging and quality" },
      { id: "b-infra", label: "Infrastructure management" },
      { id: "b-next", label: "What comes next" },
    ],
  },
  {
    num: "3.0",
    title: "How to sell",
    href: "/sell",
    items: [
      { id: "s-intro", label: "Introduction" },
      { id: "s-icp", label: "Identify your ICP" },
      { id: "s-outbound", label: "Build outbound" },
      { id: "s-inbound", label: "Build inbound" },
      { id: "s-content", label: "Content marketing" },
      { id: "s-paid", label: "Paid marketing" },
    ],
  },
  {
    num: "4.0",
    title: "How to scale",
    href: "/scale",
    items: [
      { id: "sc-intro", label: "Introduction" },
      { id: "sc-support", label: "Customer support" },
      { id: "sc-payments", label: "Set up payments" },
      { id: "sc-analytics", label: "Product analytics" },
      { id: "sc-team", label: "Build a team" },
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
              How to start a company
              <br />
              with Cofounder
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

            <button className="mt-8 btn-dark text-[11px] w-full justify-center">Download guide</button>
          </div>
        </aside>

        {/* ============ ARTICLE ============ */}
        <article className="max-w-[680px]">
          <div className="text-[11px] text-[#9aa0aa] uppercase tracking-wider mb-3">Chapter 1</div>
          <h1 className="font-display text-[44px] leading-[1.1] tracking-tight">How To Start A Company</h1>

          <p className="mt-6 text-[15px] leading-[1.7] text-[#3b3f48]">
            Great companies usually start with a simple belief: something should exist that does not exist yet.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            At zero, you do not need a perfect plan, a team, funding, or a polished product. You need a problem worth
            exploring. A customer to learn from, and enough momentum to take the next step.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            This chapter is about what you do from Stand Zero.
          </p>

          <div className="mt-10 rounded-xl overflow-hidden border border-[#efede6]">
            <div className="aspect-[16/9]">
              <RocketScene />
            </div>
          </div>

          <h2 id="should-you-start" className="font-display text-[26px] mt-14">Should You Start a Company?</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            Everyone should try to start a company at some point in their lives.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            It's hard, takes a while to pay off, and sometimes comes with significant risks. But you end up with
            something you can build yourself. The real question is whether it's the right time for you to make an
            attempt.
          </p>
          <p className="mt-4 font-medium text-[14px]">A good signing point is if:</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.7] text-[#3b3f48] list-disc pl-5">
            <li>You have seen a painful problem up close.</li>
            <li>You understand a customer or industry better than most people.</li>
            <li>You have access to a market other founders cannot easily reach.</li>
            <li>A new technology makes something possible that was not possible before.</li>
            <li>You keep coming back to the same problem even after trying to ignore it.</li>
          </ul>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            If any of these are true, and you're in a place where you've got extra time (for a side project) or want
            to take some risk, it's probably the right time to start a company.
          </p>

          <h2 id="ideas" className="font-display text-[26px] mt-14">How to Come Up With Startup Ideas</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            Startup ideas can come from many places. Most great ones start with a problem.
          </p>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            A problem gives you something real to test. If people already feel pain, already spend money, already use
            awkward workarounds, or already complain about the current options, you have signal. You may still be
            wrong about the solution, but you are positive about something that matters.
          </p>

          <p className="mt-6 text-[13px] text-[#9aa0aa] italic">Most startup ideas come from three sources.</p>

          <h3 className="font-medium text-[16px] mt-8">Problems you understand</h3>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#3b3f48]">
            Here's where to look for problems to solve.
          </p>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            <strong className="font-medium text-[#0f1115]">The best source is a problem from your previous work.</strong>{" "}
            You were inside a company or industry, watched people struggle with the same workflow over and over, and
            realized the current tools were not good enough. These ideas are dangerous. You know what they have tried
            before. You know which parts of the problem are annoying and which parts are expensive.
          </p>

          <h3 className="font-medium text-[16px] mt-8">New technology</h3>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#3b3f48]">
            The iPhone created the mobile app boom. Cloud infrastructure made it easier to start software companies
            without buying servers. Modern AI is creating new ways to build, search, automate, generate, and interact
            with software.
          </p>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            When a new technology arrives, it changes what is possible. Things that were too expensive, too slow, or
            too awkward suddenly become practical. That creates startup opportunities. But it needs to be mapped to a
            problem space.
          </p>

          <h2 id="evaluate" className="font-display text-[26px] mt-14">Evaluate Startup Ideas</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            Not all startup ideas are worth pursuing. Whenever you want to go for something, evaluate the idea
            critically across four lenses.
          </p>

          <h3 className="font-medium text-[16px] mt-8">Market Size</h3>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#3b3f48]">
            The market should be big already or small but likely to become huge. A big existing market means people
            already spend money in the category — demand is proven. The opportunity is to serve a specific segment
            better than the current options.
          </p>

          <h3 className="font-medium text-[16px] mt-8">Founder/Market Fit</h3>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#3b3f48]">
            Founder/market fit means you are able to understand and serve the market. Maybe you worked in the
            industry. Maybe you are the customer. Maybe you have relationships that help you get early meetings.
            Maybe you understand the culture and constraints of the buyer better than outsiders do.
          </p>

          <h3 className="font-medium text-[16px] mt-8">Pain</h3>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#3b3f48]">
            The best startup ideas solve painful problems. Pain means the customer already cares — they are losing
            money, wasting time, missing opportunities, taking on risk, or bound by a workflow they hate. A nice-to-
            have product can work, but it is much harder to sell. A painful problem pulls the product into the
            market.
          </p>

          <h3 className="font-medium text-[16px] mt-8">Unique Insight</h3>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#3b3f48]">
            A unique insight is something you believe that most people in the market have not realized yet. It might
            be that a customer segment is underserved because incumbents are focused upmarket. It might be that a new
            workflow can now be automated because of a new model. It might be that a product that worked in one
            country or industry can work in another. Without a unique insight, you are probably entering the market
            the same way everyone else does. That does not mean you cannot win, but it makes the path harder.
          </p>

          <h4 className="mt-8 font-medium text-[14px] text-[#0f1115]">Some examples of positive signals.</h4>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.7] text-[#3b3f48] list-disc pl-5">
            <li>You are building something you personally want.</li>
            <li>It only recently became possible.</li>
            <li>There are successful analogue elsewhere.</li>
            <li>Customers already reached out before launch.</li>
            <li>The market pulls the product from you.</li>
          </ul>

          <h4 className="mt-8 font-medium text-[14px] text-[#0f1115]">Common mistakes.</h4>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.7] text-[#3b3f48] list-disc pl-5">
            <li>
              <strong className="font-medium text-[#0f1115]">Avoiding ideas that seem too hard.</strong> Hard ideas can
              be good because fewer people attempt them.
            </li>
            <li>
              <strong className="font-medium text-[#0f1115]">Avoiding boring industries.</strong> Many of the best
              startup opportunities are non glamorous.
            </li>
            <li>
              <strong className="font-medium text-[#0f1115]">Waiting for the perfect idea.</strong> You will learn
              more from a month of serious customer conversations and prototyping than from a year of abstract
              brainstorming.
            </li>
          </ul>

          <h2 id="wedge" className="font-display text-[26px] mt-14">Pick a Wedge Market</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            A startup idea is the wedge. The market is the world around it. Picking a market matters because it
            determines who you learn from, how you sell, how much customers can pay, how large the company can
            become, and what kind of product you need to build.
          </p>
          <p className="mt-4 font-medium text-[14px]">A good early market has a few traits.</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.7] text-[#3b3f48] list-disc pl-5">
            <li>The customer is easy to describe.</li>
            <li>The pain is frequent or expensive.</li>
            <li>The buyer has budget.</li>
            <li>You can reach customers without needing a giant sales team.</li>
            <li>The current alternatives are bad, expensive, slow, or outdated.</li>
            <li>The market is changing in a way that creates an opening.</li>
          </ul>

          <p className="mt-6 text-[15px] leading-[1.7] text-[#3b3f48]">
            Start narrow. The Paris counter intuitive because founders want the company to be big. But the best way
            to become big is to dominate a small group of customers first.
          </p>

          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            Do not say your customer is "small businesses." Say your customer is "independent dental practices with 3
            to 5 locations that struggle with insurance claim details." Do not say your customer is "creators."
            Specificity helps you focus on what users actually need to know where to find customers. You know what
            language to use. You know which features matter. You know who to ignore.
          </p>

          <div className="my-10 rounded-xl border border-[#dfeeff] bg-[#f3faff] p-5">
            <div className="text-[11px] text-[#3d8de0] uppercase tracking-wider mb-2">★ Cofounder feature</div>
            <p className="text-[13.5px] text-[#3b3f48] leading-relaxed">
              Cofounder works with you to define your ICP when you get started — helping you narrow down to a
              specific, reachable customer segment before you write a single line of code.
            </p>
          </div>

          <h2 id="name" className="font-display text-[26px] mt-14">Pick a Name and Domain</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            Naming feels important because it is visible — and it is. You're building a brand. People will know your
            company by this brand. A good name should be simple, memorable, easy to spell, and flexible enough to
            survive changes in the product. You do not need a perfect name. You need a name that does not get in the
            way.
          </p>
          <p className="mt-4 font-medium text-[14px]">A few rules.</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-[1.7] text-[#3b3f48] list-disc pl-5">
            <li>Avoid names people cannot spell after hearing once.</li>
            <li>Avoid names that lock you into a tiny feature.</li>
            <li>Avoid names that would be hard to translate.</li>
            <li>Check trademark conflicts before you get attached.</li>
            <li>Make sure you can get a reasonable domain and social handles.</li>
          </ul>
          <p className="mt-4 text-[15px] leading-[1.7] text-[#3b3f48]">
            A <strong className="font-medium">.com</strong> domain is ideal, but not required at the very beginning.
            A clean alternative domain is fine if it lets you move. Do not spend months negotiating for the perfect
            domain. Domain extensions will sometimes pick a good name that calls "try" or "use" to the beginning of a
            common domain name.
          </p>

          <div className="my-10 rounded-xl border border-[#dfeeff] bg-[#f3faff] p-5">
            <div className="text-[11px] text-[#3d8de0] uppercase tracking-wider mb-2">★ Cofounder feature</div>
            <p className="text-[13.5px] text-[#3b3f48] leading-relaxed">
              Cofounder can buy a domain for you and configure it correctly — DNS, SSL, and all that boring stuff
              you'd rather not have to worry about while you start building.
            </p>
          </div>

          <h2 id="leap" className="font-display text-[26px] mt-14">Take the Leap</h2>
          <p className="mt-3 text-[15px] leading-[1.7] text-[#3b3f48]">
            The beginning of a company should look uncertainly less mature. Do not try to know the next five years.
            Solve the next week. Start the company.
          </p>

          <div className="my-8 rounded-xl border border-[#dfeeff] bg-[#f3faff] p-5">
            <div className="text-[11px] text-[#3d8de0] uppercase tracking-wider mb-2">★ Cofounder feature</div>
            <p className="text-[13.5px] text-[#3b3f48] leading-relaxed">
              Cofounder has a roadmap on starting a real company — a step-by-step guide from zero to your first
              customer, with the tools to execute each step alongside you.
            </p>
          </div>

          <h3 className="font-medium text-[16px] mt-12">What comes next</h3>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#3b3f48]">
            Once you have chosen a problem and are committed to tackling it, the next step is to build and deploy
            your MVP. That's what Chapter 2 covers.
          </p>

          <div className="mt-14 flex items-center justify-between border-t border-[#efede6] pt-6 text-[12px]">
            <Link href="/" className="text-[#9aa0aa] hover:text-[#0f1115]">← Back to home</Link>
            <Link href="/build" className="font-medium text-[#0f1115]">Chapter 2: How To Build →</Link>
          </div>
        </article>
      </div>
    </main>
  );
}
