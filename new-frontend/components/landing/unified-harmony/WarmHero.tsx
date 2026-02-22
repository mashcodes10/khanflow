"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function WarmHero() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!glowRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(glowRef.current, {
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "50% top",
          scrub: true,
        },
        opacity: 0,
        scale: 0.8,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20">
      {/* Hero Glow */}
      <div
        ref={glowRef}
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.65 0.12 35 / 0.15) 0%, oklch(0.70 0.14 70 / 0.05) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center max-w-4xl px-6 mb-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[oklch(0.65_0.12_35)]/10 border border-[oklch(0.65_0.12_35)]/20 text-[oklch(0.65_0.12_35)] text-xs font-medium uppercase tracking-wider mb-8">
          <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.12_35)] animate-pulse" />
          Intelligent Scheduling
        </div>

        {/* Headline */}
        <h1
          className="text-6xl md:text-8xl font-bold leading-tight tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-[oklch(0.82_0.008_75)] to-[oklch(0.58_0.015_50)]"
          style={{ fontFamily: "'Satoshi', sans-serif" }}
        >
          From Chaos
          <br />
          <span className="text-[oklch(0.65_0.12_35)] bg-clip-text text-transparent bg-none" style={{ WebkitTextFillColor: "oklch(0.65 0.12 35)" }}>
            To Clarity
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[oklch(0.58_0.015_50)] max-w-2xl mx-auto leading-relaxed">
          Experience the satisfying snap of a perfectly organized life. Unified
          automatically arranges your work and personal events into harmony.
        </p>

        {/* Scroll Indicator */}
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-[oklch(0.58_0.015_50)]">
          <Icon icon="lucide:mouse-pointer-2" className="animate-bounce" />
          <span>Scroll to sync</span>
        </div>
      </div>
    </section>
  );
}
