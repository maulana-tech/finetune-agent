import Link from "next/link";

const navItems: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Start", href: "/start" },
  { label: "Build", href: "/build" },
  { label: "Sell", href: "/sell" },
  { label: "Scale", href: "/scale" },
  { label: "Resources", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Log in", href: "#" },
];

export default function TopNav({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isLight = variant === "light";
  return (
    <header className="relative z-20">
      <div className="max-w-[1200px] mx-auto px-6 pt-5 flex items-center justify-between">
        <Link href="/" className={`flex items-center gap-2 ${isLight ? "text-white" : "text-[#0f1115]"}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12c0-2.2 1.8-4 4-4M16 12c0 2.2-1.8 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="font-display text-[18px] tracking-tight">Cofounder</span>
        </Link>
        <nav
          className={`hidden md:flex items-center gap-1 rounded-full px-2 py-1 ${
            isLight ? "bg-black/15 backdrop-blur" : "bg-[#0f1115]/5"
          }`}
        >
          {navItems.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`text-[13px] px-2.5 py-1.5 rounded-md transition-colors ${
                isLight ? "text-white/90 hover:bg-white/10" : "text-[#3b3f48] hover:bg-[#0f1115]/5"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="#"
            className="ml-1 bg-white text-[#0f1115] text-[12.5px] font-medium rounded-full px-3 py-1.5 border border-black/5"
          >
            Run a company
          </Link>
        </nav>
      </div>
    </header>
  );
}
