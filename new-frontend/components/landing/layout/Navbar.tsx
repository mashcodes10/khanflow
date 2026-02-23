"use client";

import Link from "next/link";
import { useState } from "react";

function TrafficLightLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full bg-[#E53E3E]" />
      <div className="w-3 h-3 rounded-full bg-[#F6C844]" />
      <div className="w-3 h-3 rounded-full bg-[#68D391]" />
      <div className="w-12 h-2.5 rounded-full bg-[oklch(0.76_0.02_75)]/50 ml-1" />
    </div>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="flex flex-col justify-center items-center w-6 h-6 gap-[5px] cursor-pointer">
      <span
        className={`block h-[2px] w-5 rounded-full bg-[oklch(0.22_0.01_50)] transition-all duration-300 ${open ? "rotate-45 translate-y-[7px]" : ""
          }`}
      />
      <span
        className={`block h-[2px] w-5 rounded-full bg-[oklch(0.22_0.01_50)] transition-all duration-300 ${open ? "opacity-0" : ""
          }`}
      />
      <span
        className={`block h-[2px] w-5 rounded-full bg-[oklch(0.22_0.01_50)] transition-all duration-300 ${open ? "-rotate-45 -translate-y-[7px]" : ""
          }`}
      />
    </div>
  );
}

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/apps", label: "Integrations" },
  { href: "/#faq", label: "FAQ" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] md:w-auto md:min-w-[720px]">
      <div className="bg-[oklch(0.91_0.018_75/0.95)] backdrop-blur-md rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border border-[oklch(0.76_0.02_75)] px-5 md:px-10 h-[56px] md:h-[68px] flex items-center justify-between gap-4 md:gap-12">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <TrafficLightLogo />
          <span className="font-semibold tracking-tight text-lg ml-1 text-[oklch(0.22_0.01_50)]">
            Khanflow
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[oklch(0.58_0.015_50)]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative hover:text-[oklch(0.22_0.01_50)] transition-colors duration-200 after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1.5px] after:bg-[oklch(0.55_0.12_35)] hover:after:w-full after:transition-all after:duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/auth/signin"
            className="text-[oklch(0.58_0.015_50)] hover:text-[oklch(0.22_0.01_50)] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="text-[oklch(0.55_0.12_35)] font-semibold hover:opacity-80 transition-opacity"
          >
            Start Free →
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex md:hidden items-center gap-4">
          <Link
            href="/auth/signup"
            className="text-[oklch(0.55_0.12_35)] font-semibold text-sm hover:opacity-80 transition-opacity"
          >
            Start Free →
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="p-1"
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? "max-h-[400px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
          }`}
      >
        <div className="bg-[oklch(0.91_0.018_75/0.95)] backdrop-blur-md rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border border-[oklch(0.76_0.02_75)] px-5 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-[oklch(0.58_0.015_50)] hover:text-[oklch(0.22_0.01_50)] hover:bg-[oklch(0.76_0.02_75/0.3)] transition-colors text-sm font-medium py-2.5 px-3 rounded-lg"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-[oklch(0.76_0.02_75)] mt-2 pt-3 px-3">
            <Link
              href="/auth/signin"
              onClick={() => setMobileOpen(false)}
              className="text-[oklch(0.58_0.015_50)] hover:text-[oklch(0.22_0.01_50)] transition-colors text-sm font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
