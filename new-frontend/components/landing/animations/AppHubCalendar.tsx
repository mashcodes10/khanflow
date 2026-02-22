"use client";

import { useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

/* ── Data ─────────────────────────────────────────────── */

const DAYS = [
  { label: "Mon", date: 6, active: true },
  { label: "Tue", date: 7 },
  { label: "Wed", date: 8 },
  { label: "Thu", date: 9 },
  { label: "Fri", date: 10 },
];

const HOURS = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM"];
const HOUR_H = 54; // pixels per hour

type CalEvent = {
  id: string;
  title: string;
  time: string;
  emoji?: string;
  dayIndex: number;
  topFrac: number;   // fraction of hours from 8 AM (0.5 = 8:30)
  spanFrac: number;  // duration in hours
  bg: string;
  border: string;
  text: string;
  subtext: string;
  sourceImg?: string;
  hasPlayBtn?: boolean;
  flag?: boolean;
  animIdx: number;
};

const EVENTS: CalEvent[] = [
  {
    id: "e1", animIdx: 1, title: "Team Sync", time: "08:30 - 09:00",
    dayIndex: 0, topFrac: 0.5, spanFrac: 0.5,
    bg: "rgba(96, 165, 250, 0.14)", border: "rgba(96, 165, 250, 0.30)",
    text: "oklch(0.80 0.08 230)", subtext: "oklch(0.60 0.05 230)",
    sourceImg: "/icons/slack.svg",
  },
  {
    id: "e4", animIdx: 2, title: "Design Review", time: "10:00 - 11:00",
    dayIndex: 0, topFrac: 2, spanFrac: 1, flag: true,
    bg: "rgba(244, 114, 182, 0.12)", border: "rgba(244, 114, 182, 0.25)",
    text: "oklch(0.80 0.08 350)", subtext: "oklch(0.60 0.05 350)",
    sourceImg: "/icons/ms-teams.svg",
  },
  {
    id: "e2", animIdx: 3, title: "Sprint Planning", time: "09:00 - 10:00",
    dayIndex: 1, topFrac: 1, spanFrac: 1,
    bg: "rgba(168, 85, 247, 0.14)", border: "rgba(168, 85, 247, 0.30)",
    text: "oklch(0.80 0.08 310)", subtext: "oklch(0.60 0.05 310)",
    sourceImg: "/icons/zoom.svg",
  },
  {
    id: "e6", animIdx: 4, title: "Lunch Break", time: "11:00 - 12:00", emoji: "🍽️",
    dayIndex: 1, topFrac: 3, spanFrac: 1,
    bg: "rgba(251, 146, 60, 0.14)", border: "rgba(251, 146, 60, 0.30)",
    text: "oklch(0.80 0.10 65)", subtext: "oklch(0.60 0.06 65)",
  },
  {
    id: "e3", animIdx: 5, title: "Focus Time", time: "08:30 - 09:30",
    dayIndex: 2, topFrac: 0.5, spanFrac: 1,
    bg: "rgba(34, 197, 94, 0.14)", border: "rgba(34, 197, 94, 0.30)",
    text: "oklch(0.80 0.10 155)", subtext: "oklch(0.60 0.06 155)",
    sourceImg: "/icons/google-calendar.svg",
  },
  {
    id: "e7", animIdx: 6, title: "PR Reviews", time: "10:00 - 11:30", flag: true,
    dayIndex: 2, topFrac: 2, spanFrac: 1.5,
    bg: "rgba(244, 114, 182, 0.10)", border: "rgba(244, 114, 182, 0.22)",
    text: "oklch(0.80 0.08 350)", subtext: "oklch(0.60 0.05 350)",
    sourceImg: "/icons/github.svg",
  },
  {
    id: "e5", animIdx: 7, title: "Project Notes", time: "09:00 - 10:30",
    dayIndex: 3, topFrac: 1, spanFrac: 1.5,
    bg: "rgba(96, 165, 250, 0.10)", border: "rgba(96, 165, 250, 0.22)",
    text: "oklch(0.80 0.08 230)", subtext: "oklch(0.60 0.05 230)",
    sourceImg: "/icons/notion.svg",
  },
];

type FloatingApp = {
  id: string;
  img?: string;
  icon?: string;
  left: string;
  top: number;
  size: number;
};

const FLOAT_ICONS: FloatingApp[] = [
  { id: "f1", icon: "logos:google-calendar", left: "3%", top: 0, size: 36 },
  { id: "f2", icon: "logos:slack-icon", left: "12%", top: 6, size: 34 },
  { id: "f3", icon: "logos:notion-icon", left: "22%", top: 2, size: 32 },
  { id: "f4", img: "/icons/outlook.svg", left: "32%", top: 8, size: 30 },
  { id: "f5", img: "/icons/zoom.svg", left: "42%", top: 0, size: 32 },
  { id: "f6", icon: "logos:google-meet", left: "52%", top: 6, size: 34 },
  { id: "f7", icon: "logos:microsoft-teams", left: "62%", top: 2, size: 30 },
  { id: "f8", img: "/icons/google-tasks.svg", left: "72%", top: 8, size: 32 },
  { id: "f9", img: "/icons/ms-todo.svg", left: "80%", top: 0, size: 30 },
  { id: "f10", icon: "logos:todoist-icon", left: "88%", top: 6, size: 32 },
  { id: "f11", icon: "logos:github-icon", left: "95%", top: 2, size: 30 },
];

const TASKS = [
  { id: "t1", img: "/icons/google-tasks.svg", text: "Update wireframes", source: "Google Tasks" },
  { id: "t2", img: "/icons/ms-todo.svg", text: "Write release notes", source: "Microsoft To Do" },
  { id: "t3", img: "/icons/notion.svg", text: "Finalize roadmap", source: "Notion" },
  { id: "t4", img: "/icons/google-tasks.svg", text: "Ship deploy script", source: "Google Tasks" },
  { id: "t5", img: "/icons/ms-todo.svg", text: "Review PR feedback", source: "Microsoft To Do" },
];

const VOICE_TASKS = [
  { id: "vt1", text: "Book a meeting with John", icon: "lucide:calendar-plus", color: "rgba(96, 165, 250, 0.18)", borderColor: "rgba(96, 165, 250, 0.35)" },
  { id: "vt2", text: "Gym session now", icon: "lucide:dumbbell", color: "rgba(34, 197, 94, 0.18)", borderColor: "rgba(34, 197, 94, 0.35)" },
  { id: "vt3", text: "Call Mom at 5 PM", icon: "lucide:phone", color: "rgba(251, 146, 60, 0.18)", borderColor: "rgba(251, 146, 60, 0.35)" },
  { id: "vt4", text: "Pick up groceries", icon: "lucide:shopping-cart", color: "rgba(168, 85, 247, 0.18)", borderColor: "rgba(168, 85, 247, 0.35)" },
];

type FloatingCard = {
  id: string;
  title: string;
  time: string;
  icon: string;
  bg: string;
  border: string;
  accent: string;
  pos: { left: string; top: string };
  rotate: string;
  scale: number;
};

const FLOATING_CARDS: FloatingCard[] = [
  {
    id: "fc1", title: "1:1 with Sarah", time: "2:00 PM", icon: "lucide:video",
    bg: "rgba(96, 165, 250, 0.10)", border: "rgba(96, 165, 250, 0.25)", accent: "rgba(96, 165, 250, 0.8)",
    pos: { left: "-8%", top: "12%" }, rotate: "-6deg", scale: 0.92,
  },
  {
    id: "fc2", title: "Ship v2.4", time: "4:30 PM", icon: "lucide:rocket",
    bg: "rgba(168, 85, 247, 0.10)", border: "rgba(168, 85, 247, 0.25)", accent: "rgba(168, 85, 247, 0.8)",
    pos: { left: "102%", top: "18%" }, rotate: "5deg", scale: 0.88,
  },
  {
    id: "fc3", title: "Yoga Break", time: "12:30 PM", icon: "lucide:heart-pulse",
    bg: "rgba(34, 197, 94, 0.10)", border: "rgba(34, 197, 94, 0.25)", accent: "rgba(34, 197, 94, 0.8)",
    pos: { left: "-6%", top: "62%" }, rotate: "4deg", scale: 0.85,
  },
  {
    id: "fc4", title: "Client Demo", time: "3:00 PM", icon: "lucide:presentation",
    bg: "rgba(251, 146, 60, 0.10)", border: "rgba(251, 146, 60, 0.25)", accent: "rgba(251, 146, 60, 0.8)",
    pos: { left: "100%", top: "58%" }, rotate: "-4deg", scale: 0.90,
  },
  {
    id: "fc5", title: "Code Review", time: "5:00 PM", icon: "lucide:git-pull-request",
    bg: "rgba(244, 114, 182, 0.10)", border: "rgba(244, 114, 182, 0.25)", accent: "rgba(244, 114, 182, 0.8)",
    pos: { left: "40%", top: "100%" }, rotate: "3deg", scale: 0.86,
  },
];

/* ── Helpers for generating CSS ───────────────────────── */

const fiCSS = FLOAT_ICONS.map((_, i) => {
  const d = (0.5 + i * 0.13).toFixed(2);
  const bd = (1.2 + i * 0.13).toFixed(2);
  const dur = (3.5 + (i % 4) * 0.35).toFixed(2);
  return `.ah-go .ah-fi-${i + 1}{animation:ahFiIn .5s cubic-bezier(.34,1.56,.64,1) ${d}s forwards,ahFiBob ${dur}s ease-in-out ${bd}s infinite}`;
}).join("\n");

const evtCSS = EVENTS.map((e) => {
  const d = (1.8 + (e.animIdx - 1) * 0.18).toFixed(2);
  return `.ah-go .ah-evt-${e.animIdx}{animation:ahEvtIn .5s cubic-bezier(.34,1.56,.64,1) ${d}s forwards}`;
}).join("\n");

const inbCSS = TASKS.map((_, i) => {
  const d = (1.0 + i * 0.15).toFixed(2);
  return `.ah-go .ah-inb-${i + 1}{animation:ahInbIn .4s ease-out ${d}s forwards}`;
}).join("\n");

/* Voice tasks: staggered fade-in, then continuous gentle horizontal sway */
const voiceCSS = VOICE_TASKS.map((_, i) => {
  const fadeDelay = (0.6 + i * 0.15).toFixed(2);
  const swayDur = (3.0 + (i % 4) * 0.5).toFixed(2);
  const swayDelay = (1.5 + i * 0.2).toFixed(2);
  return `.ah-go .ah-vt-${i + 1}{animation:ahVtFadeIn .5s ease-out ${fadeDelay}s forwards,ahVtSway ${swayDur}s ease-in-out ${swayDelay}s infinite}`;
}).join("\n");

/* Floating 3D cards: pop in + gentle 3D float */
const fcCSS = FLOATING_CARDS.map((_, i) => {
  const fadeDelay = (2.2 + i * 0.25).toFixed(2);
  const floatDur = (4.0 + (i % 3) * 0.6).toFixed(2);
  const floatDelay = (3.0 + i * 0.3).toFixed(2);
  return `.ah-go .ah-fc-${i + 1}{animation:ahFcIn .6s cubic-bezier(.34,1.56,.64,1) ${fadeDelay}s forwards,ahFcFloat ${floatDur}s ease-in-out ${floatDelay}s infinite}`;
}).join("\n");

/* ── Component ────────────────────────────────────────── */

export default function AppHubCalendar({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.classList.add("ah-go");
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const shine = shineRef.current;
    if (!card) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6; // max ±6deg
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      if (shine) {
        shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.08) 0%, transparent 60%)`;
        shine.style.opacity = "1";
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    const shine = shineRef.current;
    if (card) {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }
    if (shine) {
      shine.style.opacity = "0";
    }
  }, []);

  return (
    <div
      ref={rootRef}
      className={`ah-root relative w-full ${className ?? ""}`}
      style={{ minHeight: 360 }}
    >
      {/* ── CSS Animations ──────────────────────────── */}
      <style>{`
        /* ── Fade helper ──────────────────────────── */
        .ah-fade{opacity:0}
        .ah-go .ah-fade{animation:ahFade .5s ease-out .1s forwards}
        @keyframes ahFade{to{opacity:1}}

        /* ── Floating icons: bounce in + bob ──────── */
        .ah-fi{opacity:0;transform:scale(0)}
        ${fiCSS}
        @keyframes ahFiIn{
          0%{opacity:0;transform:scale(0) rotate(-12deg)}
          60%{opacity:1;transform:scale(1.15) rotate(3deg)}
          100%{opacity:1;transform:scale(1) rotate(0)}
        }
        @keyframes ahFiBob{
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-6px)}
        }

        /* ── Inbox tasks slide in ─────────────────── */
        .ah-inb{opacity:0;transform:translateX(-16px)}
        ${inbCSS}
        @keyframes ahInbIn{to{opacity:1;transform:translateX(0)}}

        /* ── Calendar events pop in ───────────────── */
        .ah-evt{opacity:0;transform:translateY(10px) scale(.92)}
        ${evtCSS}
        @keyframes ahEvtIn{
          0%{opacity:0;transform:translateY(10px) scale(.92)}
          100%{opacity:1;transform:translateY(0) scale(1)}
        }

        /* ── Phone slides up ──────────────────────── */
        .ah-phone{opacity:0;transform:translateY(24px) scale(.95)}
        .ah-go .ah-phone{animation:ahPhoneIn .6s cubic-bezier(.34,1.56,.64,1) 3.0s forwards}
        @keyframes ahPhoneIn{to{opacity:1;transform:translateY(0) scale(1)}}

        /* ── Chat messages ────────────────────────── */
        .ah-chat{opacity:0;transform:translateY(6px)}
        .ah-go .ah-chat-1{animation:ahChatIn .4s ease-out 3.6s forwards}
        .ah-go .ah-chat-2{animation:ahChatIn .4s ease-out 4.1s forwards}
        @keyframes ahChatIn{to{opacity:1;transform:translateY(0)}}

        /* ── Badge ────────────────────────────────── */
        .ah-badge{opacity:0;transform:scale(.7)}
        .ah-go .ah-badge{animation:ahBadgeIn .5s cubic-bezier(.34,1.56,.64,1) 4.6s forwards}
        @keyframes ahBadgeIn{
          0%{opacity:0;transform:scale(.7)}
          60%{transform:scale(1.1)}
          100%{opacity:1;transform:scale(1)}
        }

        /* ── Progress ring draw ───────────────────── */
        .ah-ring-path{stroke-dashoffset:145}
        .ah-go .ah-ring-path{animation:ahRing 1.2s ease-out 3.4s forwards}
        @keyframes ahRing{to{stroke-dashoffset:36}}

        /* ── Voice tasks: fade in + continuous horizontal sway ── */
        .ah-vt{opacity:0}
        ${voiceCSS}
        @keyframes ahVtFadeIn{
          0%{opacity:0;transform:translateX(8px)}
          100%{opacity:1;transform:translateX(0)}
        }
        @keyframes ahVtSway{
          0%,100%{transform:translateX(0)}
          50%{transform:translateX(6px)}
        }

        /* ── Floating 3D cards ────────────────────── */
        .ah-fc{opacity:0;transform:translateY(20px) scale(.7) rotateX(8deg)}
        ${fcCSS}
        @keyframes ahFcIn{
          0%{opacity:0;transform:translateY(20px) scale(.7) rotateX(8deg)}
          100%{opacity:1;transform:translateY(0) scale(1) rotateX(0)}
        }
        @keyframes ahFcFloat{
          0%,100%{transform:translateY(0) rotateX(0) rotateY(0)}
          25%{transform:translateY(-8px) rotateX(2deg) rotateY(-2deg)}
          50%{transform:translateY(-4px) rotateX(-1deg) rotateY(1deg)}
          75%{transform:translateY(-10px) rotateX(1deg) rotateY(-1deg)}
        }

        /* ── Ambient glow ─────────────────────────── */
        .ah-root::before{
          content:'';position:absolute;inset:0;
          pointer-events:none;z-index:0;
          background:
            radial-gradient(ellipse at 20% 40%,rgba(96,165,250,.05),transparent 50%),
            radial-gradient(ellipse at 75% 55%,rgba(168,85,247,.05),transparent 50%);
        }

        /* ── 3D Card effect ────────────────────────── */
        .ah-card-3d{
          transform-style:preserve-3d;
          transition:transform 0.15s ease-out, box-shadow 0.15s ease-out;
          will-change:transform;
        }
        .ah-card-3d:hover{
          box-shadow:
            0 20px 60px rgba(0,0,0,0.4),
            0 8px 24px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .ah-card-shine{
          pointer-events:none;
          position:absolute;inset:0;
          border-radius:inherit;
          opacity:0;
          transition:opacity 0.3s ease;
          z-index:50;
          mix-blend-mode:overlay;
        }
      `}</style>

      {/* ── Main Window ───────────────────────────── */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="ah-fade ah-card-3d relative z-10 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid oklch(0.35 0.01 50 / 0.6)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
          transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        }}
      >
        {/* Shine overlay */}
        <div ref={shineRef} className="ah-card-shine" />
        {/* ── Window Chrome ───────────────────────── */}
        <div className="relative flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-1.5 z-20">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 25 / 0.6)" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "oklch(0.75 0.15 85 / 0.6)" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "oklch(0.65 0.15 155 / 0.6)" }} />
          </div>

          {/* Wave Dots Machine (center) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-[3px] z-10 overflow-hidden"
            style={{ height: 36 }}
          >
            <WaveDot color="#E53E3E" delay={0} maxH={28} />
            <WaveDot color="#E53E3E" delay={0.05} maxH={22} />
            <WaveDot color="#E53E3E" delay={0.10} maxH={32} />
            <WaveDot color="#E53E3E" delay={0.15} maxH={20} />
            <WaveDot color="#F6C844" delay={0.20} maxH={26} />
            <WaveDot color="#F6C844" delay={0.25} maxH={34} />
            <WaveDot color="#F6C844" delay={0.30} maxH={22} />
            <WaveDot color="#F6C844" delay={0.35} maxH={28} />
            <WaveDot color="#68D391" delay={0.40} maxH={32} />
            <WaveDot color="#68D391" delay={0.45} maxH={22} />
            <WaveDot color="#68D391" delay={0.50} maxH={28} />
            <WaveDot color="#68D391" delay={0.55} maxH={18} />
            <WaveDot color="#CBD5E0" delay={0.60} maxH={16} isPill />
          </div>


        </div>

        {/* ── Toolbar ────────────────────────────────── */}
        <div
          className="ah-fade flex items-center justify-between px-4 pb-2 border-b"
          style={{ borderColor: "oklch(0.35 0.01 50 / 0.5)" }}
        >
          <div className="flex items-center gap-2">
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: "oklch(0.60 0.01 50)" }}>
                T
              </span>
              <button className="p-0.5 rounded hover:bg-white/5">
                <Icon icon="lucide:chevron-left" className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.01 50)" }} />
              </button>
              <button className="p-0.5 rounded hover:bg-white/5">
                <Icon icon="lucide:chevron-right" className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.01 50)" }} />
              </button>
            </div>
            <Icon icon="lucide:eye" className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.01 50)" }} />
            <Icon icon="lucide:link" className="w-3.5 h-3.5" style={{ color: "oklch(0.45 0.01 50)" }} />
          </div>
        </div>

        {/* ── Content ────────────────────────────────── */}
        <div className="flex">
          {/* ── Nav Sidebar (icon-only) ─── */}
          <div
            className="ah-fade w-8 flex-shrink-0 border-r flex flex-col items-center gap-3 pt-3 pb-3"
            style={{ borderColor: "oklch(0.35 0.01 50 / 0.5)" }}
          >
            <div className="relative">
              <Icon icon="lucide:check-square" className="w-4 h-4" style={{ color: "oklch(0.75 0.10 230)" }} />
              <div
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "oklch(0.55 0.12 230)" }}
              >
                <span className="text-[7px] font-bold text-white">5</span>
              </div>
            </div>
            <Icon icon="lucide:calendar" className="w-4 h-4" style={{ color: "oklch(0.50 0.01 50)" }} />
            <Icon icon="lucide:layout-grid" className="w-4 h-4" style={{ color: "oklch(0.50 0.01 50)" }} />
          </div>

          {/* ── Tasks Sidebar ─── */}
          <div
            className="w-36 flex-shrink-0 border-r px-2.5 pt-2.5 pb-3"
            style={{ borderColor: "oklch(0.35 0.01 50 / 0.5)" }}
          >
            <div className="ah-fade flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold" style={{ color: "oklch(0.82 0.01 50)" }}>
                Tasks
              </span>
            </div>
            <div
              className="ah-fade flex items-center gap-1.5 mb-2.5 cursor-pointer rounded-lg px-2 py-1.5"
              style={{ color: "oklch(0.50 0.01 50)" }}
            >
              <Icon icon="lucide:plus-circle" className="w-3 h-3" />
              <span className="text-[10px]">Add new task</span>
            </div>
            {TASKS.map((task, i) => (
              <div
                key={task.id}
                className={`ah-inb ah-inb-${i + 1} flex items-center gap-2 rounded-lg px-2 py-1.5 mb-1 cursor-pointer`}
                style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border flex-shrink-0"
                  style={{ borderColor: "oklch(0.40 0.01 50)" }}
                />
                <img src={task.img} alt="" className="w-3 h-3 flex-shrink-0" />
                <span
                  className="text-[10px] font-medium truncate"
                  style={{ color: "oklch(0.70 0.01 50)" }}
                >
                  {task.text}
                </span>
              </div>
            ))}
          </div>

          {/* ── Calendar Grid ─── */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Day headers */}
            <div
              className="ah-fade flex border-b"
              style={{ borderColor: "oklch(0.35 0.01 50 / 0.5)" }}
            >
              <div className="w-11 flex-shrink-0" />
              {DAYS.map((day) => (
                <div key={day.date} className="flex-1 text-center py-1.5">
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: "oklch(0.55 0.01 50)" }}
                  >
                    {day.label}
                  </span>
                  <span
                    className={`text-[11px] font-bold ml-1 ${
                      day.active
                        ? "inline-flex w-5 h-5 items-center justify-center rounded-full"
                        : ""
                    }`}
                    style={{
                      color: day.active ? "white" : "oklch(0.75 0.01 50)",
                      ...(day.active
                        ? { backgroundColor: "oklch(0.55 0.12 230)" }
                        : {}),
                    }}
                  >
                    {day.date}
                  </span>
                </div>
              ))}
              {/* Apps column header */}
              <div className="w-7 flex-shrink-0 flex items-center justify-center">
                <Icon icon="lucide:layout-grid" className="w-3 h-3" style={{ color: "oklch(0.45 0.01 50)" }} />
              </div>
            </div>

            {/* Time grid */}
            <div className="flex">
              {/* Time labels */}
              <div className="w-11 flex-shrink-0">
                {HOURS.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-end pr-2"
                    style={{ height: HOUR_H }}
                  >
                    <span
                      className="text-[9px] font-medium tabular-nums leading-none -mt-[5px]"
                      style={{ color: "oklch(0.50 0.01 50)" }}
                    >
                      {h}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid area */}
              <div
                className="flex-1 relative"
                style={{ height: HOUR_H * (HOURS.length - 1) }}
              >
                {/* Horizontal grid lines */}
                {HOURS.map((_, i) => (
                  <div
                    key={i}
                    className="ah-fade absolute left-0 right-0 border-t"
                    style={{
                      top: i * HOUR_H,
                      borderColor: "oklch(0.35 0.01 50 / 0.3)",
                    }}
                  />
                ))}

                {/* Day columns */}
                <div className="absolute inset-0 flex">
                  {DAYS.map((_, di) => (
                    <div
                      key={di}
                      className="flex-1 relative border-l"
                      style={{ borderColor: "oklch(0.35 0.01 50 / 0.3)" }}
                    >
                      {EVENTS.filter((e) => e.dayIndex === di).map((evt) => (
                        <div
                          key={evt.id}
                          className={`ah-evt ah-evt-${evt.animIdx} absolute left-1 right-1`}
                          style={{
                            top: evt.topFrac * HOUR_H + 1,
                            height: evt.spanFrac * HOUR_H - 2,
                            zIndex: 10,
                          }}
                        >
                          <div
                            className="w-full h-full rounded-md px-1.5 py-1 flex flex-col justify-start overflow-hidden relative"
                            style={{
                              backgroundColor: evt.bg,
                              border: `1px solid ${evt.border}`,
                            }}
                          >
                            {/* Emoji or title row */}
                            <div className="flex items-center gap-0.5">
                              {evt.emoji && (
                                <span className="text-[8px] leading-none">
                                  {evt.emoji}
                                </span>
                              )}
                              <span
                                className="text-[9px] font-bold leading-tight truncate"
                                style={{ color: evt.text }}
                              >
                                {evt.title}
                              </span>
                              {evt.flag && (
                                <span
                                  className="ml-auto text-[8px] font-bold flex-shrink-0"
                                  style={{ color: evt.subtext }}
                                >
                                  F
                                </span>
                              )}
                            </div>

                            {evt.spanFrac >= 1 && (
                              <span
                                className="text-[8px] font-medium truncate"
                                style={{ color: evt.subtext }}
                              >
                                {evt.time}
                              </span>
                            )}

                            {/* Play button for video calls */}
                            {evt.hasPlayBtn && evt.spanFrac >= 1 && (
                              <div className="mt-auto flex items-center justify-center pb-0.5">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{
                                    backgroundColor: "rgba(168, 85, 247, 0.25)",
                                  }}
                                >
                                  <Icon
                                    icon="lucide:play"
                                    className="w-3 h-3 ml-0.5"
                                    style={{ color: "oklch(0.80 0.10 310)" }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Source icon badge */}
                          {evt.sourceImg && (
                            <div
                              className="absolute -right-2 -top-2 w-5 h-5 rounded-lg flex items-center justify-center"
                              style={{
                                backgroundColor: "oklch(0.28 0.012 50)",
                                border: "1px solid oklch(0.42 0.01 50)",
                                boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
                                zIndex: 20,
                              }}
                            >
                              <img src={evt.sourceImg} alt="" className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* App logos column */}
              <div className="w-8 flex-shrink-0 flex flex-col items-center gap-1.5 pt-2 pb-2">
                {FLOAT_ICONS.map((app, i) => (
                  <div
                    key={app.id}
                    className={`ah-fi ah-fi-${i + 1} flex items-center justify-center`}
                    style={{ width: 22, height: 22 }}
                  >
                    {app.img ? (
                      <img src={app.img} alt="" className="w-4 h-4" />
                    ) : (
                      <Icon icon={app.icon!} className="w-4 h-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

    </div>

      {/* ── Floating 3D Calendar Cards ── */}
      {FLOATING_CARDS.map((fc, i) => (
        <div
          key={fc.id}
          className={`ah-fc ah-fc-${i + 1} absolute pointer-events-none`}
          style={{
            left: fc.pos.left,
            top: fc.pos.top,
            zIndex: 30,
            perspective: "600px",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 backdrop-blur-md"
            style={{
              background: fc.bg,
              border: `1px solid ${fc.border}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
              transform: `rotate(${fc.rotate}) scale(${fc.scale})`,
              minWidth: "130px",
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: fc.bg, border: `1px solid ${fc.border}` }}
            >
              <Icon icon={fc.icon} className="w-3.5 h-3.5" style={{ color: fc.accent }} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold truncate" style={{ color: "oklch(0.85 0.01 50)" }}>
                {fc.title}
              </span>
              <span className="text-[9px] font-medium" style={{ color: "oklch(0.55 0.01 50)" }}>
                {fc.time}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* ── Floating Voice Tasks (overlay entire component) ── */}
      {VOICE_TASKS.map((vt, i) => {
        // Spread across full component area with no overlap
        const positions = [
          { left: "30%",  top: "-4%"  },
          { left: "62%",  top: "-6%"  },
          { left: "10%",  top: "-2%"  },
          { left: "85%",  top: "-3%"  },
          { left: "88%",  top: "30%" },
          { left: "85%",  top: "55%" },
          { left: "64%",  top: "80%" },
          { left: "30%",  top: "82%" },
        ];
        const pos = positions[i % positions.length];
        return (
          <span
            key={vt.id}
            className={`ah-vt ah-vt-${i + 1} absolute pointer-events-none`}
            style={{
              left: pos.left,
              top: pos.top,
              whiteSpace: "nowrap",
              zIndex: 25,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: "currentColor",
              opacity: 0.5,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            {vt.text}
          </span>
        );
      })}
    </div>
  );
}

function WaveDot({
  color,
  delay,
  maxH,
  isPill = false,
}: {
  color: string;
  delay: number;
  maxH: number;
  isPill?: boolean;
}) {
  return (
    <div
      className="rounded-full"
      style={{
        width: isPill ? 12 : 4,
        height: 4,
        backgroundColor: color,
        animation: `waveBar 0.6s ease-in-out ${delay}s infinite`,
        // @ts-expect-error css custom property
        "--max-h": `${maxH}px`,
      }}
    />
  );
}
