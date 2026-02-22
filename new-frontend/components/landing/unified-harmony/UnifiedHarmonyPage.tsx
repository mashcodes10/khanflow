"use client";

import { useEffect } from "react";
import WarmNavbar from "./WarmNavbar";
import WarmHero from "./WarmHero";
import CalendarStage from "./CalendarStage";
import WarmCTA from "./WarmCTA";
import WarmFooter from "./WarmFooter";

export default function UnifiedHarmonyPage() {
  useEffect(() => {
    // Dynamically load Fontshare fonts
    const link = document.createElement("link");
    link.href =
      "https://api.fontshare.com/v2/css?f[]=satoshi@500,700,900&f[]=general-sans@400,500,600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div
      className="relative min-h-screen selection:bg-[oklch(0.65_0.12_35)] selection:text-white"
      style={
        {
          "--bg-main": "oklch(0.25 0.01 50)",
          "--bg-card": "oklch(0.29 0.012 50)",
          "--text-main": "oklch(0.82 0.008 75)",
          "--text-muted": "oklch(0.58 0.015 50)",
          "--uh-primary": "oklch(0.65 0.12 35)",
          "--uh-border": "oklch(0.35 0.01 50)",
          fontFamily: "'General Sans', sans-serif",
          backgroundColor: "oklch(0.25 0.01 50)",
          color: "oklch(0.82 0.008 75)",
        } as React.CSSProperties
      }
    >
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[oklch(0.65_0.12_35)]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[oklch(0.70_0.14_70)]/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-[oklch(0.82_0.008_75)]/5 rounded-full blur-[100px]" />
      </div>

      <WarmNavbar />

      <div className="relative z-10">
        <WarmHero />
        <CalendarStage />
        {/* Spacer for smooth scroll feel */}
        <section className="h-[50vh]" />
        <WarmCTA />
        <WarmFooter />
      </div>
    </div>
  );
}
