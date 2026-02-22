"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

/* ── Data ─────────────────────────────────────────────── */

const DAYS = [
  { label: "Mon", date: 6 },
  { label: "Tue", date: 7 },
  { label: "Wed", date: 8 },
];

const TIME_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"];

type CalendarEvent = {
  id: string;
  title: string;
  time: string;
  type: "personal" | "work";
  dayIndex: number;
  slotStart: number;
  slotSpan: number;
};

const EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Personal event",
    time: "08:30 – 09:30",
    type: "personal",
    dayIndex: 0,
    slotStart: 1,
    slotSpan: 2,
  },
  {
    id: "evt-2",
    title: "Work event",
    time: "08:00 – 09:00",
    type: "work",
    dayIndex: 1,
    slotStart: 0,
    slotSpan: 2,
  },
  {
    id: "evt-3",
    title: "Team standup",
    time: "09:30 – 10:00",
    type: "work",
    dayIndex: 2,
    slotStart: 3,
    slotSpan: 1,
  },
  {
    id: "evt-4",
    title: "Gym session",
    time: "10:00 – 10:30",
    type: "personal",
    dayIndex: 2,
    slotStart: 4,
    slotSpan: 1,
  },
];

/* ── Color maps ───────────────────────────────────────── */
const eventColors = {
  personal: {
    bg: "rgba(96, 165, 250, 0.12)",
    border: "rgba(96, 165, 250, 0.30)",
    text: "oklch(0.75 0.10 240)",
    subtext: "oklch(0.60 0.06 240)",
  },
  work: {
    bg: "rgba(244, 114, 182, 0.12)",
    border: "rgba(244, 114, 182, 0.30)",
    text: "oklch(0.75 0.10 350)",
    subtext: "oklch(0.60 0.06 350)",
  },
};

const SLOT_H = 44;

/* ── Component ────────────────────────────────────────── */
export default function CalendarMultiSync({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const CYCLE = 10000;
    const start = () => {
      el.classList.remove("cms-go");
      void el.offsetWidth;
      el.classList.add("cms-go");
    };
    start();
    const id = setInterval(start, CYCLE);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`cms-root relative w-full overflow-hidden rounded-2xl ${className ?? ""}`}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* ── CSS ─────────────────────────────────────── */}
      <style>{`
        /* fade helpers */
        .cms-fade { opacity: 0; }
        .cms-go .cms-fade { animation: cmsFade .5s ease-out .1s forwards; }
        @keyframes cmsFade { to { opacity: 1; } }

        /* grid lines stagger */
        .cms-line { opacity: 0; }
        .cms-go .cms-line { animation: cmsFade .35s ease-out forwards; }
        .cms-go .cms-line:nth-child(1){ animation-delay:.12s }
        .cms-go .cms-line:nth-child(2){ animation-delay:.16s }
        .cms-go .cms-line:nth-child(3){ animation-delay:.20s }
        .cms-go .cms-line:nth-child(4){ animation-delay:.24s }
        .cms-go .cms-line:nth-child(5){ animation-delay:.28s }
        .cms-go .cms-line:nth-child(6){ animation-delay:.32s }

        /* event blocks */
        .cms-evt { opacity:0; transform:translateY(14px) scale(.96); }
        .cms-go .cms-evt-1 { animation: cmsEvtIn .5s cubic-bezier(.34,1.56,.64,1) .55s forwards }
        .cms-go .cms-evt-2 { animation: cmsEvtIn .5s cubic-bezier(.34,1.56,.64,1) .75s forwards }
        .cms-go .cms-evt-3 { animation: cmsEvtIn .5s cubic-bezier(.34,1.56,.64,1) .95s forwards }
        .cms-go .cms-evt-4 { animation: cmsEvtIn .5s cubic-bezier(.34,1.56,.64,1) 1.15s forwards }
        @keyframes cmsEvtIn {
          0%   { opacity:0; transform:translateY(14px) scale(.96) }
          100% { opacity:1; transform:translateY(0) scale(1) }
        }

        /* service icons — bounce in then float */
        .cms-svc { opacity:0; transform:scale(0) }
        .cms-go .cms-svc-1 {
          animation: cmsSvcIn .55s cubic-bezier(.34,1.56,.64,1) 1.1s forwards,
                     cmsSvcFloat 3s ease-in-out 1.7s infinite;
        }
        .cms-go .cms-svc-2 {
          animation: cmsSvcIn .55s cubic-bezier(.34,1.56,.64,1) 1.35s forwards,
                     cmsSvcFloat 3s ease-in-out 2.0s infinite;
        }
        .cms-go .cms-svc-3 {
          animation: cmsSvcIn .55s cubic-bezier(.34,1.56,.64,1) 1.6s forwards,
                     cmsSvcFloat 3s ease-in-out 2.3s infinite;
        }
        .cms-go .cms-svc-4 {
          animation: cmsSvcIn .55s cubic-bezier(.34,1.56,.64,1) 1.85s forwards,
                     cmsSvcFloat 3s ease-in-out 2.6s infinite;
        }
        @keyframes cmsSvcIn {
          0%   { opacity:0; transform:scale(0) }
          60%  { opacity:1; transform:scale(1.18) }
          100% { opacity:1; transform:scale(1) }
        }
        @keyframes cmsSvcFloat {
          0%,100% { transform:scale(1) translateY(0) }
          50%     { transform:scale(1) translateY(-5px) }
        }

        /* sync badge */
        .cms-badge { opacity:0; transform:scale(.7) }
        .cms-go .cms-badge {
          animation: cmsBadge .5s cubic-bezier(.34,1.56,.64,1) 2.4s forwards;
        }
        @keyframes cmsBadge {
          0%   { opacity:0; transform:scale(.7) }
          60%  { transform:scale(1.1) }
          100% { opacity:1; transform:scale(1) }
        }

        /* ambient glow */
        .cms-root::before {
          content:'';
          position:absolute; inset:0;
          pointer-events:none; z-index:0;
          background:
            radial-gradient(ellipse at 25% 55%, rgba(96,165,250,.04), transparent 55%),
            radial-gradient(ellipse at 75% 40%, rgba(244,114,182,.04), transparent 55%);
        }
      `}</style>

      {/* ── Window chrome ─────────────────────────────── */}
      <div className="cms-fade relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 25 / 0.6)" }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "oklch(0.75 0.15 85 / 0.6)" }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 155 / 0.6)" }} />
        </div>

        <div
          className="cms-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full"
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

      {/* ── Calendar grid ─────────────────────────────── */}
      <div className="cms-fade relative z-10 px-5 pb-5">
        <div className="flex">
          {/* Time column */}
          <div className="w-14 flex-shrink-0 pt-10">
            {TIME_SLOTS.map((t, i) => (
              <div key={i} className="flex items-start justify-end pr-3" style={{ height: SLOT_H }}>
                <span
                  className="text-[11px] font-medium tabular-nums leading-none"
                  style={{ color: "oklch(0.55 0.01 50)", marginTop: -1 }}
                >
                  {t}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 flex">
            {DAYS.map((day, di) => (
              <div key={di} className="flex-1 min-w-0 relative">
                {/* header */}
                <div className="h-10 flex items-center justify-center gap-1.5">
                  <span className="text-sm font-semibold" style={{ color: "oklch(0.60 0.01 50)" }}>{day.label}</span>
                  <span className="text-sm font-bold" style={{ color: "oklch(0.78 0.01 50)" }}>{day.date}</span>
                </div>

                {/* slot rows */}
                <div className="relative" style={{ height: SLOT_H * TIME_SLOTS.length }}>
                  {TIME_SLOTS.map((_, si) => (
                    <div
                      key={si}
                      className="cms-line absolute left-0 right-0 border-t"
                      style={{
                        top: si * SLOT_H,
                        borderColor: "oklch(0.35 0.01 50 / 0.5)",
                      }}
                    />
                  ))}
                  {/* column separator */}
                  <div
                    className="cms-line absolute top-0 bottom-0 left-0 border-l"
                    style={{ borderColor: "oklch(0.35 0.01 50 / 0.5)" }}
                  />

                  {/* Events for this day column */}
                  {EVENTS.filter((e) => e.dayIndex === di).map((evt) => {
                    const c = eventColors[evt.type];
                    const evtIdx = EVENTS.indexOf(evt) + 1;
                    return (
                      <div
                        key={evt.id}
                        className={`cms-evt cms-evt-${evtIdx} absolute left-1.5 right-1.5`}
                        style={{
                          top: evt.slotStart * SLOT_H + 2,
                          height: evt.slotSpan * SLOT_H - 4,
                          zIndex: 10,
                        }}
                      >
                        <div
                          className="relative w-full h-full rounded-lg px-2.5 py-2 flex flex-col justify-center overflow-visible"
                          style={{
                            backgroundColor: c.bg,
                            border: `1px solid ${c.border}`,
                          }}
                        >
                          <span className="text-xs font-bold leading-tight truncate" style={{ color: c.text }}>
                            {evt.title}
                          </span>
                          {evt.slotSpan > 1 && (
                            <span className="text-[10px] mt-0.5 truncate font-medium" style={{ color: c.subtext }}>
                              {evt.time}
                            </span>
                          )}

                          {/* ── Service icon badge ── */}
                          <div
                            className={`cms-svc cms-svc-${evtIdx} absolute flex items-center justify-center rounded-xl`}
                            style={{
                              width: 40,
                              height: 40,
                              right: -12,
                              bottom: evt.slotSpan > 1 ? -6 : -12,
                              backgroundColor: "oklch(0.30 0.012 50)",
                              border: "1px solid oklch(0.42 0.01 50)",
                              boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                              zIndex: 30,
                            }}
                          >
                            {evt.type === "personal" ? (
                              <Icon icon="logos:google-calendar" className="w-[22px] h-[22px]" />
                            ) : (
                              <img src="/icons/outlook.svg" alt="Microsoft Outlook" className="w-[22px] h-[22px]" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
