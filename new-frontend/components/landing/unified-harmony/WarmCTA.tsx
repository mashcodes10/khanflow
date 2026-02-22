"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WarmCTA() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      router.push(`/auth/signup?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/auth/signup");
    }
  };

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[oklch(0.65_0.12_35)]/20 rounded-[100%] blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <h2
          className="text-4xl md:text-6xl font-bold mb-8 text-[oklch(0.82_0.008_75)]"
          style={{ fontFamily: "'Satoshi', sans-serif" }}
        >
          Ready to find your rhythm?
        </h2>
        <p className="text-[oklch(0.58_0.015_50)] text-lg mb-10 max-w-xl mx-auto">
          Stop fighting your schedule. Let Unified&apos;s AI engine organize
          your life into perfect harmony.
        </p>
        <form
          className="max-w-md mx-auto flex gap-2"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 bg-white/5 border border-[oklch(0.35_0.01_50)] rounded-full px-6 py-4 text-white placeholder-[oklch(0.58_0.015_50)] focus:outline-none focus:border-[oklch(0.65_0.12_35)] transition-colors"
          />
          <button
            type="submit"
            className="bg-[oklch(0.65_0.12_35)] hover:bg-[oklch(0.65_0.12_35)]/90 text-white font-bold rounded-full px-8 py-4 transition-colors"
          >
            Start Free
          </button>
        </form>
      </div>
    </section>
  );
}
