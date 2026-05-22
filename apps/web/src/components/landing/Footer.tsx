import Link from "next/link";

const footerLinks = {
  product: [
    { label: "Home", href: "/" },
    { label: "Business Finder", href: "/start" },
    { label: "Pricing", href: "#" },
    { label: "Login", href: "/login" },
  ],
  company: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Docs", href: "#" },
  ],
  social: [
    { label: "X", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "GitHub", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#fbfaf6] border-t border-[#efede6]">
      <div className="max-w-[1100px] mx-auto px-6 py-16 w-full">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
          <div>
            <h3 className="font-display text-[26px] leading-snug">
              Find and close more
              <br />
              <span className="text-[#6b7180]">B2B deals with uTune AI</span>
            </h3>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[#0f1115] text-white text-[13px] font-medium rounded-xl px-5 py-3 hover:opacity-90 transition-all"
              >
                Start prospecting
              </Link>
            </div>
          </div>

          <div className="space-y-2 text-[12px] text-[#6b7180]">
            <div className="text-[#0f1115] text-[11px] uppercase tracking-wider mb-2">Product</div>
            {footerLinks.product.map((l) => (
              <Link key={l.label} className="block hover:text-[#0f1115] transition-colors" href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="space-y-2 text-[12px] text-[#6b7180]">
            <div className="text-[#0f1115] text-[11px] uppercase tracking-wider mb-2">Company</div>
            {footerLinks.company.map((l) => (
              <Link key={l.label} className="block hover:text-[#0f1115] transition-colors" href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="space-y-2 text-[12px] text-[#6b7180]">
            <div className="text-[#0f1115] text-[11px] uppercase tracking-wider mb-2">Social</div>
            {footerLinks.social.map((l) => (
              <Link key={l.label} className="block hover:text-[#0f1115] transition-colors" href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between text-[11px] text-[#9aa0aa]">
          <div>© uTune AI {new Date().getFullYear()}. Built for field sales teams.</div>
        </div>
      </div>
      <div className="grass-strip" />
    </footer>
  );
}
