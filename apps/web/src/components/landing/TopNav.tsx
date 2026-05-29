import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

const navItems = [
  { label: "Home",   href: "/" },
  { label: "Finder", href: "/start" },
];

export default function TopNav({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isLight = variant === "light";

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="max-w-[1200px] mx-auto px-8 h-[72px] flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center gap-2.5 ${isLight ? "text-white" : "text-[#0f1115]"}`}
        >
          <Image src="/logo.png" alt="uTune AI" width={36} height={36} className="shrink-0" />
          <span className="font-display text-[17px] tracking-tight">uTune AI</span>
        </Link>

        {/* Nav links — center */}
        <nav className={`hidden md:flex items-center gap-1 rounded-full px-2 py-1.5 ${
          isLight ? "bg-white/10 backdrop-blur border border-white/15" : "bg-[#0f1115]/5 border border-[#0f1115]/8"
        }`}>
          {navItems.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`text-[13.5px] font-medium px-4 py-1.5 rounded-full transition-colors ${
                isLight
                  ? "text-white/85 hover:text-white hover:bg-white/12"
                  : "text-[#3b3f48] hover:text-[#0f1115] hover:bg-[#0f1115]/6"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className={`hidden md:inline-flex text-[13.5px] font-medium px-4 py-2 rounded-full transition-colors ${
              isLight
                ? "text-white/80 hover:text-white hover:bg-white/10"
                : "text-[#6b7180] hover:text-[#0f1115]"
            }`}
          >
            Log in
          </Link>
          <Link
            href="/login"
            className={`inline-flex items-center gap-2 text-[13.5px] font-medium rounded-full px-4 py-2 transition-all ${
              isLight
                ? "bg-white text-[#0f1115] hover:bg-white/90 shadow-sm"
                : "bg-[#0f1115] text-white hover:opacity-90"
            }`}
          >
            <Search className="size-3.5" />
            Find leads
          </Link>
        </div>

      </div>
    </header>
  );
}
