"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

/* ── Data ─────────────────────────────────────────────── */

type CaptureMessage = {
  id: string;
  source: "slack" | "todoist";
  sender: string;
  text: string;
  time: string;
};

const MESSAGES: CaptureMessage[] = [
  { id: "m1", source: "slack", sender: "Sarah", text: "Can we meet at 3pm tomorrow?", time: "2:34 PM" },
  { id: "m2", source: "todoist", sender: "Quick Add", text: "Finish pitch deck by Friday", time: "2:41 PM" },
];

const CALENDAR_BLOCK = {
  title: "Meeting with Sarah",
  time: "3:00 – 3:30 PM",
  day: "Tomorrow",
};

const TODOIST_BLOCK = {
  title: "Finish pitch deck",
  time: "10:00 – 11:30 AM",
  day: "Fri, Deep Work",
};

/* ── Component ────────────────────────────────────────── */

export default function QuickCapture({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const CYCLE = 10000;
    const start = () => {
      el.classList.remove("qc-go");
      void el.offsetWidth;
      el.classList.add("qc-go");
    };
    start();
    const id = setInterval(start, CYCLE);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`qc-root relative w-full overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* ── CSS Animations ──────────────────────────── */}
      <style>{`
        /* ── Header fade ─────────────────────────── */
        .qc-hdr { opacity: 0; }
        .qc-go .qc-hdr { animation: qcFade .4s ease-out .1s forwards; }
        @keyframes qcFade { to { opacity: 1; } }

        /* ── Message slide in ────────────────────── */
        .qc-msg { opacity: 0; transform: translateY(12px) scale(0.95); }
        .qc-go .qc-msg-1 {
          animation: qcMsgIn .45s cubic-bezier(.34,1.56,.64,1) .3s forwards;
        }
        .qc-go .qc-msg-2 {
          animation: qcMsgIn .45s cubic-bezier(.34,1.56,.64,1) .6s forwards;
        }
        @keyframes qcMsgIn {
          0%   { opacity: 0; transform: translateY(12px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Capture button pulse ────────────────── */
        .qc-btn { opacity: 0; transform: scale(0); }
        .qc-go .qc-btn-1 {
          animation: qcBtnIn .35s cubic-bezier(.34,1.56,.64,1) 1s forwards;
        }
        .qc-go .qc-btn-2 {
          animation: qcBtnIn .35s cubic-bezier(.34,1.56,.64,1) 1.3s forwards;
        }
        @keyframes qcBtnIn {
          0%   { opacity: 0; transform: scale(0); }
          60%  { opacity: 1; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ── Click ripple ────────────────────────── */
        .qc-ripple { opacity: 0; transform: scale(0); }
        .qc-go .qc-ripple-1 {
          animation: qcRipple .6s ease-out 1.8s forwards;
        }
        .qc-go .qc-ripple-2 {
          animation: qcRipple .6s ease-out 2.4s forwards;
        }
        @keyframes qcRipple {
          0%   { opacity: 0.6; transform: scale(0); }
          100% { opacity: 0; transform: scale(2.5); }
        }

        /* ── Arrow / flow indicator ──────────────── */
        .qc-arrow { opacity: 0; transform: translateY(-4px); }
        .qc-go .qc-arrow-1 {
          animation: qcArrow .4s ease-out 2s forwards;
        }
        .qc-go .qc-arrow-2 {
          animation: qcArrow .4s ease-out 2.6s forwards;
        }
        @keyframes qcArrow {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* ── Calendar block slide in ─────────────── */
        .qc-cal { opacity: 0; transform: translateX(20px) scale(0.9); }
        .qc-go .qc-cal-1 {
          animation: qcCalIn .5s cubic-bezier(.34,1.56,.64,1) 2.2s forwards;
        }
        .qc-go .qc-cal-2 {
          animation: qcCalIn .5s cubic-bezier(.34,1.56,.64,1) 2.8s forwards;
        }
        @keyframes qcCalIn {
          0%   { opacity: 0; transform: translateX(20px) scale(0.9); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }

        /* ── Deep Work shield ────────────────────── */
        .qc-shield { opacity: 0; transform: scale(0.7); }
        .qc-go .qc-shield {
          animation: qcShieldIn .5s cubic-bezier(.34,1.56,.64,1) 3.4s forwards,
                     qcShieldGlow 2s ease-in-out 4s infinite;
        }
        @keyframes qcShieldIn {
          0%   { opacity: 0; transform: scale(0.7); }
          60%  { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes qcShieldGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
          50%      { box-shadow: 0 0 12px 4px rgba(168, 85, 247, 0.15); }
        }

        /* ── Status badge ────────────────────────── */
        .qc-badge { opacity: 0; transform: scale(0.7); }
        .qc-go .qc-badge {
          animation: qcBadgeIn .5s cubic-bezier(.34,1.56,.64,1) 3.8s forwards;
        }
        @keyframes qcBadgeIn {
          0%   { opacity: 0; transform: scale(0.7); }
          60%  { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ── ambient glow ────────────────────────── */
        .qc-root::before {
          content: '';
          position: absolute; inset: 0;
          pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse at 30% 30%, rgba(74, 21, 75, 0.04), transparent 55%),
            radial-gradient(ellipse at 70% 70%, rgba(239, 68, 68, 0.03), transparent 55%);
        }
      `}</style>

      {/* ── Window chrome ─────────────────────────── */}
      <div className="qc-hdr relative z-10 flex items-center justify-between px-4 pt-3 pb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 25 / 0.6)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "oklch(0.75 0.15 85 / 0.6)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 155 / 0.6)" }} />
        </div>

        <div
          className="qc-badge flex items-center gap-1.5 px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.25)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-green-400">
            Captured
          </span>
        </div>
      </div>

      {/* ── Content ───────────────────────────────── */}
      <div className="relative z-10 px-4 pb-4 space-y-2.5">

        {/* Message 1: Slack */}
        <div className="space-y-1.5">
          <div
            className="qc-msg qc-msg-1 rounded-lg px-3 py-2"
            style={{
              backgroundColor: "rgba(74, 21, 75, 0.08)",
              border: "1px solid rgba(74, 21, 75, 0.18)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <img src="/icons/slack.svg" alt="Slack" className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold" style={{ color: "#E01E5A" }}>
                {MESSAGES[0].sender}
              </span>
              <span className="text-[9px] ml-auto" style={{ color: "oklch(0.50 0.01 50)" }}>
                {MESSAGES[0].time}
              </span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: "oklch(0.75 0.01 50)" }}>
              {MESSAGES[0].text}
            </p>
            {/* Capture button */}
            <div className="flex justify-end mt-1.5 relative">
              <div className="qc-ripple qc-ripple-1 absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/30" />
              <button
                className="qc-btn qc-btn-1 flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#22c55e",
                }}
              >
                <Icon icon="lucide:calendar-plus" className="w-3 h-3" />
                Capture
              </button>
            </div>
          </div>

          {/* Arrow */}
          <div className="qc-arrow qc-arrow-1 flex justify-center">
            <Icon icon="lucide:arrow-down" className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.01 50)" }} />
          </div>

          {/* Calendar block result */}
          <div
            className="qc-cal qc-cal-1 rounded-lg px-3 py-2 flex items-center gap-2.5"
            style={{
              backgroundColor: "rgba(96, 165, 250, 0.10)",
              border: "1px solid rgba(96, 165, 250, 0.25)",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: "rgba(96, 165, 250, 0.15)",
                border: "1px solid rgba(96, 165, 250, 0.3)",
              }}
            >
              <Icon icon="lucide:calendar-check" className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold block truncate" style={{ color: "oklch(0.80 0.08 240)" }}>
                {CALENDAR_BLOCK.title}
              </span>
              <span className="text-[9px] font-medium" style={{ color: "oklch(0.55 0.05 240)" }}>
                {CALENDAR_BLOCK.day} · {CALENDAR_BLOCK.time}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="qc-hdr border-t" style={{ borderColor: "oklch(0.30 0.01 50 / 0.5)" }} />

        {/* Message 2: Todoist */}
        <div className="space-y-1.5">
          <div
            className="qc-msg qc-msg-2 rounded-lg px-3 py-2"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.18)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <img src="/icons/todoist.svg" alt="Todoist" className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold" style={{ color: "#E44332" }}>
                {MESSAGES[1].sender}
              </span>
              <span className="text-[9px] ml-auto" style={{ color: "oklch(0.50 0.01 50)" }}>
                {MESSAGES[1].time}
              </span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: "oklch(0.75 0.01 50)" }}>
              {MESSAGES[1].text}
            </p>
            {/* Capture button */}
            <div className="flex justify-end mt-1.5 relative">
              <div className="qc-ripple qc-ripple-2 absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/30" />
              <button
                className="qc-btn qc-btn-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#22c55e",
                }}
              >
                <Icon icon="lucide:calendar-plus" className="w-3 h-3" />
                Capture
              </button>
            </div>
          </div>

          {/* Arrow */}
          <div className="qc-arrow qc-arrow-2 flex justify-center">
            <Icon icon="lucide:arrow-down" className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.01 50)" }} />
          </div>

          {/* Calendar block result with Deep Work shield */}
          <div
            className="qc-cal qc-cal-2 rounded-lg px-3 py-2 flex items-center gap-2.5"
            style={{
              backgroundColor: "rgba(168, 85, 247, 0.10)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
              }}
            >
              <Icon icon="lucide:brain" className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold block truncate" style={{ color: "oklch(0.80 0.10 310)" }}>
                {TODOIST_BLOCK.title}
              </span>
              <span className="text-[9px] font-medium" style={{ color: "oklch(0.55 0.06 310)" }}>
                {TODOIST_BLOCK.day} · {TODOIST_BLOCK.time}
              </span>
            </div>
            {/* Deep Work shield badge */}
            <div
              className="qc-shield flex items-center gap-1 px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
              }}
            >
              <Icon icon="lucide:shield" className="w-2.5 h-2.5 text-purple-400" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-purple-400">
                Deep Work
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
