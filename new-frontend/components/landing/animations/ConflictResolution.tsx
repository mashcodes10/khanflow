"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

/* ── Data ─────────────────────────────────────────────── */

const USERS = [
  { name: "Felix", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
  { name: "Aneka", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
  { name: "James", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James" },
  { name: "Maria", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria" },
];

const TIME_SLOTS: { label: string; active: boolean; spaceBefore?: boolean; spaceAfter?: boolean }[] = [
  { label: "08:00 AM", active: false },
  { label: "09:00 AM", active: false },
  { label: "10:00 AM", active: false },
  { label: "10:30 AM", active: true, spaceBefore: true },
  { label: "11:00 AM", active: false, spaceAfter: true },
  { label: "12:00 PM", active: false },
  { label: "01:00 PM", active: false },
];

/* Busy blocks per user — scattered across time slots */
const BUSY_BLOCKS: Record<number, { time: string; h: string }[]> = {
  0: [
    { time: "9:00 – 10:00 AM", h: "h-16" },
    { time: "10:30 – 11:30 AM", h: "h-20" },
  ],
  1: [
    { time: "10:00 – 11:00 AM", h: "h-20" },
  ],
  2: [
    { time: "9:30 – 10:30 AM", h: "h-16" },
    { time: "11:00 – 12:00 PM", h: "h-20" },
  ],
  3: [
    { time: "10:00 – 10:30 AM", h: "h-16" },
  ],
};

/* ── Component ────────────────────────────────────────── */

export default function ConflictResolution({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fontLoaded = useRef(false);

  /* Load Cabinet Grotesk + Satoshi fonts */
  useEffect(() => {
    if (fontLoaded.current) return;
    fontLoaded.current = true;

    const link = document.createElement("link");
    link.href =
      "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,400&f[]=satoshi@400,500,700&f[]=gambetta@600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  /* Trigger animation loop — plays, pauses 2s, resets, repeats */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const CYCLE = 8000; // 6s animation + 2s hold

    const startCycle = () => {
      el.classList.remove("cr-animate");
      // Force reflow to reset CSS animations
      void el.offsetWidth;
      el.classList.add("cr-animate");
    };

    startCycle();
    const interval = setInterval(startCycle, CYCLE);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`cr-root relative w-full min-h-screen overflow-hidden ${className ?? ""}`}
      style={{
        backgroundColor: "#0c0c0e",
        color: "#ffffff",
        fontFamily: "'Satoshi', sans-serif",
      }}
    >
      {/* ── Inline keyframes ──────────────────────────── */}
      <style>{`
        /* ── STUDIO LIGHTING ────────────────────────── */
        .cr-root::before,
        .cr-root::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .cr-root::before {
          background: radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.08), transparent 60%);
        }
        .cr-root::after {
          background: radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.05), transparent 60%);
        }

        /* ── SHAKE ──────────────────────────────────── */
        @keyframes cr-shake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-3px); }
          20% { transform: translateX(3px); }
          30% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          50% { transform: translateX(-2px); }
          60% { transform: translateX(2px); }
          70% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
          90% { transform: translateX(-2px); }
        }

        /* ── CONFLICT BLOCK SEQUENCE ────────────────── */
        .cr-conflict {
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .cr-animate .cr-conflict {
          animation:
            cr-conflict-appear 0.3s cubic-bezier(0.65, 0, 0.35, 1) 0.3s forwards,
            cr-shake 0.5s ease-in-out 0.8s 4 forwards,
            cr-conflict-fade 0.5s cubic-bezier(0.65, 0, 0.35, 1) 2.8s forwards;
        }
        @keyframes cr-conflict-appear {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cr-conflict-fade {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }

        /* stagger appearance per conflict block */
        .cr-animate .cr-conflict:nth-child(1) { animation-delay: 0.3s, 0.8s, 2.8s; }
        .cr-animate .cr-conflict:nth-child(2) { animation-delay: 0.4s, 0.9s, 2.9s; }
        .cr-animate .cr-conflict:nth-child(3) { animation-delay: 0.5s, 1.0s, 3.0s; }

        /* ── GREEN SYNC BLOCK ───────────────────────── */
        .cr-sync-block {
          opacity: 0;
          width: 260px;
          transform: translateY(120px);
          animation-fill-mode: forwards;
        }
        .cr-animate .cr-sync-block {
          animation:
            cr-glide 2s cubic-bezier(0.65, 0, 0.35, 1) 3s forwards,
            cr-expand 0.8s cubic-bezier(0.7, 0, 0.3, 1) 5s forwards;
        }
        @keyframes cr-glide {
          0% {
            opacity: 0;
            transform: translateY(120px);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes cr-expand {
          0% { width: 260px; }
          100% { width: 100%; }
        }

        /* ── AVATARS BOUNCE ─────────────────────────── */
        .cr-sync-avatar {
          opacity: 0;
          transform: scale(0);
          animation-fill-mode: forwards;
        }
        .cr-animate .cr-sync-avatar:nth-child(1) {
          animation: cr-avatar-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 5.2s forwards;
        }
        .cr-animate .cr-sync-avatar:nth-child(2) {
          animation: cr-avatar-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 5.3s forwards;
        }
        .cr-animate .cr-sync-avatar:nth-child(3) {
          animation: cr-avatar-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 5.4s forwards;
        }
        .cr-animate .cr-sync-avatar:nth-child(4) {
          animation: cr-avatar-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 5.5s forwards;
        }
        @keyframes cr-avatar-bounce {
          0% { opacity: 0; transform: scale(0); }
          60% { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ── CONTROL BAR FADE IN ────────────────────── */
        .cr-controls {
          opacity: 0;
          transform: translateY(20px);
          animation-fill-mode: forwards;
        }
        .cr-animate .cr-controls {
          animation: cr-controls-in 0.8s cubic-bezier(0.65, 0, 0.35, 1) 0.3s forwards;
        }
        @keyframes cr-controls-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* ── NAV FADE IN ────────────────────────────── */
        .cr-nav {
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .cr-animate .cr-nav {
          animation: cr-fade-in 0.6s cubic-bezier(0.65, 0, 0.35, 1) 0.1s forwards;
        }
        @keyframes cr-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        /* ── GRID FADE IN ───────────────────────────── */
        .cr-grid {
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .cr-animate .cr-grid {
          animation: cr-fade-in 0.8s cubic-bezier(0.65, 0, 0.35, 1) 0.2s forwards;
        }
      `}</style>

      {/* ── TOP NAVIGATION ────────────────────────────── */}
      <nav className="cr-nav relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Icon icon="lucide:calendar-check-2" className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-2xl uppercase tracking-widest font-extrabold"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
          >
            Sync.
          </span>
        </div>

        {/* Right side: avatars + invite */}
        <div className="flex items-center gap-4">
          {/* Overlapping avatars */}
          <div className="flex -space-x-2">
            {USERS.map((u, i) => (
              <img
                key={i}
                src={u.avatar}
                alt={u.name}
                className="w-8 h-8 rounded-full"
                style={{
                  border: "2px solid #0c0c0e",
                  zIndex: USERS.length - i,
                  position: "relative",
                }}
              />
            ))}
          </div>
          <button
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Invite Team
          </button>
        </div>
      </nav>

      {/* ── CALENDAR GRID ─────────────────────────────── */}
      <div className="cr-grid relative z-10 max-w-6xl mx-auto px-8 mt-4">
        <div className="flex gap-0">

          {/* ── Time Column ──────────────────────────── */}
          <div className="w-20 flex-shrink-0 pt-16">
            {TIME_SLOTS.map((slot, i) => (
              <div
                key={i}
                className="flex items-center justify-end pr-4"
                style={{
                  height: 80,
                  marginTop: slot.spaceBefore ? 12 : 0,
                  marginBottom: slot.spaceAfter ? 12 : 0,
                }}
              >
                {slot.active ? (
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-md"
                    style={{
                      color: "#22c55e",
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.2)",
                    }}
                  >
                    {slot.label}
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {slot.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── User Columns ─────────────────────────── */}
          {USERS.map((user, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 min-w-0"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* User header */}
              <div className="flex items-center gap-3 px-4 mb-8">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                  style={{ border: "2px solid rgba(255,255,255,0.1)" }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                >
                  {user.name}
                </span>
              </div>

              {/* Busy blocks */}
              <div className="px-3 space-y-4">
                {(BUSY_BLOCKS[colIdx] || []).map((block, bIdx) => (
                  <div
                    key={bIdx}
                    className={`cr-conflict ${block.h} rounded-xl px-4 py-3 flex flex-col justify-center`}
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <span
                      className="text-[10px] uppercase font-bold tracking-wider"
                      style={{ color: "#f87171" }}
                    >
                      Busy
                    </span>
                    <span
                      className="text-xs mt-1"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {block.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── GREEN SYNC BLOCK (positioned over grid) ── */}
        <div className="absolute left-20 right-8 flex justify-center" style={{ top: "calc(16px + 64px + 3 * 80px)" }}>
          <div
            className="cr-sync-block h-[72px] rounded-2xl px-6 flex items-center gap-4 relative"
            style={{
              backgroundColor: "#22c55e",
              boxShadow: "0 20px 60px rgba(34, 197, 94, 0.4)",
            }}
          >
            {/* Sparkle icon */}
            <Icon icon="lucide:sparkles" className="w-5 h-5 text-white flex-shrink-0" />

            {/* Text content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="font-bold text-sm text-white truncate leading-tight">
                Scheduled: Q4 Kickoff
              </span>
              <span
                className="text-[10px] uppercase tracking-widest font-bold leading-tight mt-1 truncate"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                Conflict Resolved · 10:30 AM
              </span>
            </div>

            {/* Attendee avatars (bounce in) */}
            <div className="flex -space-x-1.5 flex-shrink-0 ml-2">
              {USERS.map((u, i) => (
                <img
                  key={i}
                  src={u.avatar}
                  alt={u.name}
                  className="cr-sync-avatar w-7 h-7 rounded-full"
                  style={{
                    border: "2px solid #22c55e",
                    zIndex: USERS.length - i,
                    position: "relative",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING TOOL DOCK ────────────────────────── */}
      <div className="cr-controls fixed bottom-12 left-1/2 -translate-x-1/2 z-30">
        <div
          className="flex items-center gap-0 rounded-2xl px-2 py-2 shadow-2xl"
          style={{
            backgroundColor: "#121214",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Analyze Grid */}
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-colors hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <Icon icon="lucide:search" className="w-4 h-4" />
            Analyze Grid
          </button>

          {/* Divider */}
          <div className="w-px h-6 mx-1" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

          {/* Sync Active (highlighted) */}
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-colors"
            style={{
              color: "#22c55e",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
            }}
          >
            <Icon icon="lucide:wand-2" className="w-4 h-4" />
            Sync Active
          </button>

          {/* Divider */}
          <div className="w-px h-6 mx-1" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

          {/* Configuration */}
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-colors hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <Icon icon="lucide:settings" className="w-4 h-4" />
            Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
