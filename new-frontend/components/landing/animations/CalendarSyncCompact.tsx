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
  { label: "09:00", active: false },
  { label: "10:00", active: false },
  { label: "10:30", active: true, spaceBefore: true },
  { label: "11:00", active: false, spaceAfter: true },
  { label: "12:00", active: false },
  { label: "01:00", active: false },
];

/* Busy blocks per user */
const BUSY_BLOCKS: Record<number, { time: string; h: string }[]> = {
  0: [
    { time: "9–10 AM", h: "h-12" },
    { time: "10:30–11:30", h: "h-14" },
  ],
  1: [
    { time: "10–11 AM", h: "h-14" },
  ],
  2: [
    { time: "9:30–10:30", h: "h-12" },
    { time: "11–12 PM", h: "h-14" },
  ],
  3: [
    { time: "10–10:30", h: "h-12" },
  ],
};

/* ── Component ────────────────────────────────────────── */

export default function CalendarSyncCompact({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* Trigger animation loop — plays, pauses, resets, repeats */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const CYCLE = 8000;

    const startCycle = () => {
      el.classList.remove("cs-animate");
      void el.offsetWidth;
      el.classList.add("cs-animate");
    };

    startCycle();
    const interval = setInterval(startCycle, CYCLE);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`cs-root relative w-full overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(8px)",
        color: "inherit",
      }}
    >
      {/* ── Inline keyframes ──────────────────────────── */}
      <style>{`
        /* ── SHAKE ──────────────────────────────────── */
        @keyframes cs-shake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-2px); }
          20% { transform: translateX(2px); }
          30% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          50% { transform: translateX(-1px); }
          60% { transform: translateX(1px); }
          70% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
          90% { transform: translateX(-1px); }
        }

        /* ── CONFLICT BLOCK SEQUENCE ────────────────── */
        .cs-conflict {
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .cs-animate .cs-conflict {
          animation:
            cs-conflict-appear 0.3s cubic-bezier(0.65, 0, 0.35, 1) 0.3s forwards,
            cs-shake 0.5s ease-in-out 0.8s 4 forwards,
            cs-conflict-fade 0.5s cubic-bezier(0.65, 0, 0.35, 1) 2.8s forwards;
        }
        @keyframes cs-conflict-appear {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cs-conflict-fade {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }

        /* stagger */
        .cs-animate .cs-conflict:nth-child(1) { animation-delay: 0.3s, 0.8s, 2.8s; }
        .cs-animate .cs-conflict:nth-child(2) { animation-delay: 0.4s, 0.9s, 2.9s; }
        .cs-animate .cs-conflict:nth-child(3) { animation-delay: 0.5s, 1.0s, 3.0s; }

        /* ── GREEN SYNC BLOCK ───────────────────────── */
        .cs-sync-block {
          opacity: 0;
          width: 200px;
          transform: translateY(100px);
          animation-fill-mode: forwards;
        }
        .cs-animate .cs-sync-block {
          animation:
            cs-glide 2s cubic-bezier(0.65, 0, 0.35, 1) 3s forwards,
            cs-expand 0.8s cubic-bezier(0.7, 0, 0.3, 1) 5s forwards;
        }
        @keyframes cs-glide {
          0% { opacity: 0; transform: translateY(100px); }
          20% { opacity: 1; }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes cs-expand {
          0% { width: 200px; }
          100% { width: 100%; }
        }

        /* ── AVATARS BOUNCE ─────────────────────────── */
        .cs-sync-avatar {
          opacity: 0;
          transform: scale(0);
          animation-fill-mode: forwards;
        }
        .cs-animate .cs-sync-avatar:nth-child(1) {
          animation: cs-avatar-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 5.2s forwards;
        }
        .cs-animate .cs-sync-avatar:nth-child(2) {
          animation: cs-avatar-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 5.3s forwards;
        }
        .cs-animate .cs-sync-avatar:nth-child(3) {
          animation: cs-avatar-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 5.4s forwards;
        }
        .cs-animate .cs-sync-avatar:nth-child(4) {
          animation: cs-avatar-bounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 5.5s forwards;
        }
        @keyframes cs-avatar-bounce {
          0% { opacity: 0; transform: scale(0); }
          60% { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ── GRID FADE IN ───────────────────────────── */
        .cs-grid {
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .cs-animate .cs-grid {
          animation: cs-fade-in 0.8s cubic-bezier(0.65, 0, 0.35, 1) 0.2s forwards;
        }
        @keyframes cs-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        /* Subtle green top glow */
        .cs-root::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.04), transparent 60%);
        }
      `}</style>

      {/* ── WINDOW CHROME ─────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 25 / 0.6)" }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "oklch(0.75 0.15 85 / 0.6)" }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 155 / 0.6)" }} />
        </div>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.25)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">
            Synced
          </span>
        </div>
      </div>

      {/* ── CALENDAR GRID ─────────────────────────────── */}
      <div className="cs-grid relative z-10 px-5 pb-6">
        <div className="flex gap-0">

          {/* ── Time Column ──────────────────────────── */}
          <div className="w-16 flex-shrink-0 pt-12">
            {TIME_SLOTS.map((slot, i) => (
              <div
                key={i}
                className="flex items-center justify-end pr-3"
                style={{
                  height: 56,
                  marginTop: slot.spaceBefore ? 6 : 0,
                  marginBottom: slot.spaceAfter ? 6 : 0,
                }}
              >
                {slot.active ? (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: "#22c55e",
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.2)",
                    }}
                  >
                    {slot.label}
                  </span>
                ) : (
                  <span className="text-xs text-muted/60">
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
              className="flex-1 min-w-0 border-l border-border/30"
            >
              {/* User header */}
              <div className="flex items-center gap-2 px-3 mb-4">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-border/50"
                />
                <span
                  className="text-xs font-medium truncate text-foreground/70"
                >
                  {user.name}
                </span>
              </div>

              {/* Busy blocks */}
              <div className="px-2 space-y-2.5">
                {(BUSY_BLOCKS[colIdx] || []).map((block, bIdx) => (
                  <div
                    key={bIdx}
                    className={`cs-conflict ${block.h} rounded-lg px-3 py-2 flex flex-col justify-center`}
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
                      className="text-[10px] mt-0.5 truncate text-muted/60"
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
        <div
          className="absolute left-16 right-5 flex justify-center"
          style={{ top: "calc(12px + 48px + 2 * 56px + 6px)" }}
        >
          <div
            className="cs-sync-block h-[52px] rounded-xl px-4 flex items-center gap-3 relative"
            style={{
              backgroundColor: "#22c55e",
              boxShadow: "0 16px 50px rgba(34, 197, 94, 0.35)",
            }}
          >
            <Icon icon="lucide:sparkles" className="w-4 h-4 text-white flex-shrink-0" />

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="font-bold text-xs text-white truncate leading-tight">
                Scheduled: Q4 Kickoff
              </span>
              <span
                className="text-[9px] uppercase tracking-widest font-bold leading-tight mt-0.5 truncate"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                Resolved · 10:30 AM
              </span>
            </div>

            <div className="flex -space-x-1.5 flex-shrink-0 ml-2">
              {USERS.map((u, i) => (
                <img
                  key={i}
                  src={u.avatar}
                  alt={u.name}
                  className="cs-sync-avatar w-6 h-6 rounded-full"
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
    </div>
  );
}
