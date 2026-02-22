"use client";

import Link from "next/link";

export default function WarmNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[oklch(0.65_0.12_35)] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_oklch(0.65_0.12_35_/_0.4)]">
            U
          </div>
          <span
            className="font-bold text-xl tracking-wide"
            style={{ fontFamily: "'Satoshi', sans-serif" }}
          >
            Unified
          </span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-[oklch(0.58_0.015_50)] font-medium">
          <Link
            href="#features"
            className="hover:text-[oklch(0.65_0.12_35)] transition-colors"
          >
            Features
          </Link>
          <Link
            href="#integrations"
            className="hover:text-[oklch(0.65_0.12_35)] transition-colors"
          >
            Integrations
          </Link>
          <Link
            href="#pricing"
            className="hover:text-[oklch(0.65_0.12_35)] transition-colors"
          >
            Pricing
          </Link>
        </div>

        {/* CTA Button */}
        <button className="px-5 py-2.5 bg-[oklch(0.82_0.008_75)] text-[oklch(0.25_0.01_50)] rounded-full text-sm font-bold hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,0,0,0.1)]">
          Get Early Access
        </button>
      </div>
    </nav>
  );
}
