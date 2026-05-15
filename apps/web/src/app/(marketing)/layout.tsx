import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import LenisProvider from "@/components/landing/LenisProvider";

export const metadata: Metadata = {
  title: "Cofounder — Run an entire company with agents",
  description:
    "Cofounder is an agent orchestration platform designed to help you run an entire business.",
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
