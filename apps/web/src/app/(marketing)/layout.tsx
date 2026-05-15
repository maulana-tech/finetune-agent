import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import LenisProvider from "@/components/landing/LenisProvider";

export const metadata: Metadata = {
  title: "uTune AI — B2B Business Finder & Mapped CRM",
  description:
    "Find millions of B2B leads on a map, enrich with AI reviews and emails, and manage your pipeline. The map-first CRM built for field sales teams in Indonesia and SEA.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
        rel="stylesheet"
      />
      <LenisProvider />
      {children}
    </>
  );
}
