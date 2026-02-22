"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

/* ── Task Data ────────────────────────────────────────── */

type TaskItem = {
  id: string;
  title: string;
  source: "slack" | "mstodo" | "gtasks";
  priority: "high" | "medium" | "low";
  status: "inbox" | "organized";
};

const TASKS: TaskItem[] = [
  { id: "t1", title: "Review Q4 proposal", source: "slack", priority: "high", status: "inbox" },
  { id: "t2", title: "Update sprint board", source: "mstodo", priority: "medium", status: "inbox" },
  { id: "t3", title: "Send invoice to client", source: "gtasks", priority: "high", status: "inbox" },
  { id: "t4", title: "Fix login bug #218", source: "slack", priority: "high", status: "inbox" },
  { id: "t5", title: "Prepare demo slides", source: "mstodo", priority: "medium", status: "inbox" },
  { id: "t6", title: "Book meeting room", source: "gtasks", priority: "low", status: "inbox" },
];

const SOURCE_META = {
  slack: {
    img: "/icons/slack.svg",
    label: "Slack",
    color: "rgba(74, 21, 75, 0.9)",
    bg: "rgba(74, 21, 75, 0.12)",
    border: "rgba(74, 21, 75, 0.25)",
    textColor: "#E01E5A",
  },
  mstodo: {
    img: "/icons/ms-todo.svg",
    label: "MS Todo",
    color: "rgba(56, 133, 224, 0.9)",
    bg: "rgba(56, 133, 224, 0.12)",
    border: "rgba(56, 133, 224, 0.25)",
    textColor: "#3885E0",
  },
  gtasks: {
    img: "/icons/google-tasks.svg",
    label: "Tasks",
    color: "rgba(66, 133, 244, 0.9)",
    bg: "rgba(66, 133, 244, 0.12)",
    border: "rgba(66, 133, 244, 0.25)",
    textColor: "#4285F4",
  },
};

const PRIORITY_COLORS = {
  high: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.25)", dot: "#ef4444" },
  medium: { bg: "rgba(234, 179, 8, 0.12)", border: "rgba(234, 179, 8, 0.25)", dot: "#eab308" },
  low: { bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.25)", dot: "#22c55e" },
};

/* ── Component ────────────────────────────────────────── */

export default function TaskOrganizer({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const CYCLE = 12000;
    const start = () => {
      el.classList.remove("to-go");
      void el.offsetWidth;
      el.classList.add("to-go");
    };
    start();
    const id = setInterval(start, CYCLE);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`to-root relative w-full overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* ── CSS Animations ──────────────────────────── */}
      <style>{`
        /* ── Floating source icons between tasks ── */
        .to-float-icon { opacity: 0; transform: scale(0); z-index: 20; }
        .to-go .to-float-1 {
          animation: toFloatIn .5s cubic-bezier(.34,1.56,.64,1) 1.8s forwards,
                     toFloatBob 3s ease-in-out 2.5s infinite;
        }
        .to-go .to-float-2 {
          animation: toFloatIn .5s cubic-bezier(.34,1.56,.64,1) 2.0s forwards,
                     toFloatBob 3.2s ease-in-out 2.7s infinite;
        }
        .to-go .to-float-3 {
          animation: toFloatIn .5s cubic-bezier(.34,1.56,.64,1) 2.2s forwards,
                     toFloatBob 2.8s ease-in-out 2.9s infinite;
        }
        @keyframes toFloatIn {
          0%   { opacity: 0; transform: scale(0) rotate(-10deg); }
          60%  { opacity: 1; transform: scale(1.2) rotate(3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes toFloatBob {
          0%, 100% { transform: scale(1) translateY(0) rotate(0deg); }
          33%      { transform: scale(1.03) translateY(-5px) rotate(2deg); }
          66%      { transform: scale(0.98) translateY(2px) rotate(-1deg); }
        }

        /* ── Phase 2: Scattered tasks appear ─────── */
        .to-task-scattered { opacity: 0; transform: translateX(-30px) scale(0.85) rotate(-3deg); }
        .to-go .to-task-s1 { animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) .8s forwards; }
        .to-go .to-task-s2 { animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) .95s forwards; }
        .to-go .to-task-s3 { animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) 1.1s forwards; }
        .to-go .to-task-s4 { animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) 1.25s forwards; }
        .to-go .to-task-s5 { animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) 1.4s forwards; }
        .to-go .to-task-s6 { animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) 1.55s forwards; }
        @keyframes toScatter {
          0%   { opacity: 0; transform: translateX(-30px) scale(0.85) rotate(-3deg); }
          70%  { opacity: 1; transform: translateX(3px) scale(1.02) rotate(0.5deg); }
          100% { opacity: 1; transform: translateX(0) scale(1) rotate(0); }
        }

        /* ── Phase 3: Tasks sort/organize ────────── */
        .to-go .to-task-s1 {
          animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) .8s forwards,
                     toSort .6s cubic-bezier(.22,1,.36,1) 3s forwards;
        }
        .to-go .to-task-s2 {
          animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) .95s forwards,
                     toSort .6s cubic-bezier(.22,1,.36,1) 3.15s forwards;
        }
        .to-go .to-task-s3 {
          animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) 1.1s forwards,
                     toSort .6s cubic-bezier(.22,1,.36,1) 3.3s forwards;
        }
        .to-go .to-task-s4 {
          animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) 1.25s forwards,
                     toSort .6s cubic-bezier(.22,1,.36,1) 3.45s forwards;
        }
        .to-go .to-task-s5 {
          animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) 1.4s forwards,
                     toSort .6s cubic-bezier(.22,1,.36,1) 3.6s forwards;
        }
        .to-go .to-task-s6 {
          animation: toScatter .45s cubic-bezier(.34,1.56,.64,1) 1.55s forwards,
                     toSort .6s cubic-bezier(.22,1,.36,1) 3.75s forwards;
        }
        @keyframes toSort {
          0%   { transform: translateX(0) scale(1); }
          40%  { transform: translateX(4px) scale(0.97); }
          100% { transform: translateX(0) scale(1); }
        }

        /* ── Phase 4: Checkmarks appear ──────────── */
        .to-check { opacity: 0; transform: scale(0); }
        .to-go .to-check-1 { animation: toCheckIn .35s cubic-bezier(.34,1.56,.64,1) 4.2s forwards; }
        .to-go .to-check-2 { animation: toCheckIn .35s cubic-bezier(.34,1.56,.64,1) 4.4s forwards; }
        .to-go .to-check-3 { animation: toCheckIn .35s cubic-bezier(.34,1.56,.64,1) 4.6s forwards; }
        .to-go .to-check-4 { animation: toCheckIn .35s cubic-bezier(.34,1.56,.64,1) 4.8s forwards; }
        .to-go .to-check-5 { animation: toCheckIn .35s cubic-bezier(.34,1.56,.64,1) 5.0s forwards; }
        .to-go .to-check-6 { animation: toCheckIn .35s cubic-bezier(.34,1.56,.64,1) 5.2s forwards; }
        @keyframes toCheckIn {
          0%   { opacity: 0; transform: scale(0); }
          60%  { opacity: 1; transform: scale(1.25); }
          100% { opacity: 1; transform: scale(1); }
        }



        /* ── Status badge ────────────────────────── */
        .to-badge { opacity: 0; transform: scale(0.7); }
        .to-go .to-badge {
          animation: toBadgeIn .5s cubic-bezier(.34,1.56,.64,1) 5.5s forwards;
        }
        @keyframes toBadgeIn {
          0%   { opacity: 0; transform: scale(0.7); }
          60%  { transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ── Header fade ─────────────────────────── */
        .to-hdr { opacity: 0; }
        .to-go .to-hdr { animation: toHdrIn .5s ease-out .1s forwards; }
        @keyframes toHdrIn { to { opacity: 1; } }

        /* ── Priority labels slide ───────────────── */
        .to-pri-label { opacity: 0; transform: translateY(8px); }
        .to-go .to-pri-1 { animation: toPriIn .4s ease-out 2.8s forwards; }
        .to-go .to-pri-2 { animation: toPriIn .4s ease-out 2.9s forwards; }
        .to-go .to-pri-3 { animation: toPriIn .4s ease-out 3.0s forwards; }
        @keyframes toPriIn {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* ── ambient glow ────────────────────────── */
        .to-root::before {
          content: '';
          position: absolute; inset: 0;
          pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse at 20% 30%, rgba(74, 21, 75, 0.04), transparent 55%),
            radial-gradient(ellipse at 80% 50%, rgba(66, 133, 244, 0.04), transparent 55%),
            radial-gradient(ellipse at 50% 80%, rgba(56, 133, 224, 0.03), transparent 55%);
        }
      `}</style>

      {/* ── Window chrome ─────────────────────────── */}
      <div className="to-hdr relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 25 / 0.6)" }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "oklch(0.75 0.15 85 / 0.6)" }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 155 / 0.6)" }} />
        </div>

        <div
          className="to-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.25)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">
            Organized
          </span>
        </div>
      </div>

      {/* ── Main content ──────────────────────────── */}
      <div className="relative z-10 px-5 pb-5">
        {/* Priority section labels */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(["high", "medium", "low"] as const).map((pri, i) => (
            <div
              key={pri}
              className={`to-pri-label to-pri-${i + 1} flex items-center gap-1.5 px-2.5 py-1 rounded-full`}
              style={{
                backgroundColor: PRIORITY_COLORS[pri].bg,
                border: `1px solid ${PRIORITY_COLORS[pri].border}`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: PRIORITY_COLORS[pri].dot }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: PRIORITY_COLORS[pri].dot }}>
                {pri}
              </span>
            </div>
          ))}
        </div>

        {/* Task cards */}
        <div className="space-y-1.5 relative">
          {/* Floating source icons on top */}
          <div className="flex items-center justify-center gap-4 mb-3">
            {(["slack", "mstodo", "gtasks"] as const).map((src, i) => {
              const meta = SOURCE_META[src];
              return (
                <div
                  key={src}
                  className={`to-float-icon to-float-${i + 1} w-9 h-9 rounded-xl flex items-center justify-center`}
                  style={{
                    backgroundColor: meta.bg,
                    border: `1px solid ${meta.border}`,
                    boxShadow: `0 6px 20px ${meta.bg}`,
                  }}
                >
                  <img src={meta.img} alt={meta.label} className="w-5 h-5" />
                </div>
              );
            })}
          </div>

          {TASKS.map((task, i) => {
            const srcMeta = SOURCE_META[task.source];
            const priColor = PRIORITY_COLORS[task.priority];

            return (
              <div
                key={task.id}
                className={`to-task-scattered to-task-s${i + 1} flex items-center gap-2.5 px-3 py-2 rounded-lg`}
                style={{
                  backgroundColor: priColor.bg,
                  border: `1px solid ${priColor.border}`,
                }}
              >
                {/* Checkbox */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center"
                    style={{ borderColor: priColor.dot }}
                  >
                    <div className={`to-check to-check-${i + 1}`}>
                      <Icon icon="lucide:check" className="w-3 h-3" style={{ color: priColor.dot }} />
                    </div>
                  </div>
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold truncate block" style={{ color: "oklch(0.82 0.01 50)" }}>
                    {task.title}
                  </span>
                </div>

                {/* Source badge */}
                <div
                  className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: srcMeta.bg,
                    border: `1px solid ${srcMeta.border}`,
                  }}
                >
                  <img src={srcMeta.img} alt={srcMeta.label} className="w-3 h-3" />
                </div>

                {/* Priority dot */}
                <div
                  className="flex-shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: priColor.dot }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
