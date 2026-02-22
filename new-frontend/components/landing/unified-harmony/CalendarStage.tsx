"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CalendarEventCard from "./CalendarEventCard";

gsap.registerPlugin(ScrollTrigger);

/* ── Event data ───────────────────────────────────────── */
const eventCards = [
  {
    id: "card-1",
    category: "Work",
    title: "Product Strategy",
    time: "9:00 AM",
    color: "amber" as const,
    icon: "lucide:briefcase",
  },
  {
    id: "card-2",
    category: "Personal",
    title: "Dentist Appt",
    time: "2:00 PM",
    color: "indigo" as const,
    icon: "lucide:heart-pulse",
  },
  {
    id: "card-3",
    category: "Work",
    title: "Q4 Workshop",
    time: "11:00 AM",
    color: "amber" as const,
    icon: "lucide:presentation",
    avatars: [
      "https://i.pravatar.cc/100?img=1",
      "https://i.pravatar.cc/100?img=2",
      "https://i.pravatar.cc/100?img=3",
    ],
  },
  {
    id: "card-4",
    category: "Gym",
    title: "Upper Body",
    time: "6:30 AM",
    color: "emerald" as const,
    icon: "lucide:dumbbell",
  },
  {
    id: "card-5",
    category: "Social",
    title: "Coffee with Alex",
    time: "3:00 PM",
    color: "rose" as const,
    icon: "lucide:coffee",
  },
  {
    id: "card-6",
    category: "Personal",
    title: "Pick Up Kids",
    time: "3:30 PM",
    color: "indigo" as const,
    icon: "lucide:car",
  },
  {
    id: "card-7",
    category: "Work",
    title: "Client Review",
    time: "4:00 PM",
    color: "amber" as const,
    icon: "lucide:video",
  },
  {
    id: "card-8",
    category: "Social",
    title: "Book Club",
    time: "6:00 PM",
    color: "rose" as const,
    icon: "lucide:book-open",
  },
];

/* ── Mini-calendar month data for Oct 2023 ────────────── */
const dayHeaders = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const calendarDays = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
];
const today = 25;
const eventDots: Record<number, string[]> = {
  2: ["amber"],
  5: ["emerald"],
  9: ["indigo"],
  12: ["amber", "rose"],
  15: ["emerald"],
  18: ["indigo"],
  21: ["amber"],
  23: ["rose", "amber"],
  25: ["amber", "indigo", "emerald", "rose"],
  27: ["amber"],
  29: ["emerald"],
  31: ["indigo"],
};
const dotColorClass: Record<string, string> = {
  amber: "bg-amber-500",
  indigo: "bg-indigo-400",
  emerald: "bg-emerald-400",
  rose: "bg-rose-400",
};

/* ── Component ────────────────────────────────────────── */
export default function CalendarStage() {
  const stageRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const calendarRef = useRef<HTMLDivElement>(null);
  const chaosLabelRef = useRef<HTMLDivElement>(null);
  const aiLabelRef = useRef<HTMLDivElement>(null);
  const doneLabelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stageRef.current) return;

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    const calendar = calendarRef.current;
    const chaosLabel = chaosLabelRef.current;
    const aiLabel = aiLabelRef.current;
    const doneLabel = doneLabelRef.current;
    if (!calendar || !chaosLabel || !aiLabel || !doneLabel) return;

    const ctx = gsap.context(() => {
      /* ── Initial state ─────────────────────────── */
      // Calendar hidden
      gsap.set(calendar, { opacity: 0, scale: 0.9, y: 40 });
      // AI label hidden
      gsap.set(aiLabel, { opacity: 0, y: 20 });
      // Done label hidden
      gsap.set(doneLabel, { opacity: 0, scale: 0.8 });
      // Chaos label visible
      gsap.set(chaosLabel, { opacity: 1 });

      // Cards start scattered across the viewport
      const chaosConfig = cards.map(() => ({
        x: gsap.utils.random(-500, 500),
        y: gsap.utils.random(-300, 300),
        z: gsap.utils.random(-150, 250),
        rotationX: gsap.utils.random(-35, 35),
        rotationY: gsap.utils.random(-35, 35),
        rotationZ: gsap.utils.random(-20, 20),
        scale: gsap.utils.random(0.85, 1.15),
      }));

      cards.forEach((card, i) => {
        gsap.set(card, {
          position: "fixed",
          x: chaosConfig[i].x,
          y: chaosConfig[i].y,
          z: chaosConfig[i].z,
          rotationX: chaosConfig[i].rotationX,
          rotationY: chaosConfig[i].rotationY,
          rotation: chaosConfig[i].rotationZ,
          scale: chaosConfig[i].scale,
          transformPerspective: 1000,
          opacity: 1,
        });

        // Floating drift
        gsap.to(card, {
          y: `+=${gsap.utils.random(12, 28)}`,
          x: `+=${gsap.utils.random(-10, 10)}`,
          rotation: `+=${gsap.utils.random(-5, 5)}`,
          duration: gsap.utils.random(2, 4),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: gsap.utils.random(0, 2),
        });
      });

      /* ── Scroll-triggered timeline ─────────────── */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: 1,
        },
      });

      // Phase 1 — Fade out "tasks everywhere" label
      tl.to(chaosLabel, {
        opacity: 0,
        y: -30,
        duration: 0.3,
        ease: "power2.in",
      });

      // Phase 2 — Show AI label + calendar shell
      tl.to(
        aiLabel,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        "<0.1"
      );

      tl.to(
        calendar,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          ease: "power3.out",
        },
        "<0.2"
      );

      // Phase 3 — Cards fly into calendar slots one by one
      cards.forEach((card, i) => {
        tl.to(
          card,
          {
            x: 0,
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            rotation: 0,
            scale: 1,
            position: "relative",
            duration: 0.4,
            ease: "back.out(1.4)",
            overwrite: "auto",
          },
          i === 0 ? ">" : "<0.12"
        );
      });

      // Phase 4 — Fade AI label → show "Done" badge
      tl.to(aiLabel, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });

      tl.to(doneLabel, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: "back.out(1.7)",
      });
    }, stageRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={stageRef}
      id="calendar-stage"
      className="h-screen w-full flex items-center justify-center overflow-hidden relative"
      style={{ perspective: "2000px" }}
    >
      {/* ── Floating chaos label ───────────────────────── */}
      <div
        ref={chaosLabelRef}
        className="absolute top-[12%] left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none"
      >
        <p className="text-sm uppercase tracking-[0.25em] text-[oklch(0.58_0.015_50)] font-semibold mb-2">
          Your tasks are everywhere
        </p>
        <p className="text-xs text-[oklch(0.50_0.01_50)]">
          Meetings, errands, workouts — scattered across your day
        </p>
      </div>

      {/* ── AI organizing label ────────────────────────── */}
      <div
        ref={aiLabelRef}
        className="absolute top-[8%] left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[oklch(0.29_0.012_50)] border border-[oklch(0.35_0.01_50)] shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.65_0.12_35)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[oklch(0.65_0.12_35)]" />
          </span>
          <span
            className="text-sm font-bold text-[oklch(0.82_0.008_75)]"
            style={{ fontFamily: "'Satoshi', sans-serif" }}
          >
            Khanflow AI
          </span>
          <span className="text-xs text-[oklch(0.58_0.015_50)]">
            is scheduling your day…
          </span>
        </div>
      </div>

      {/* ── Done label ─────────────────────────────────── */}
      <div
        ref={doneLabelRef}
        className="absolute top-[8%] left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[oklch(0.29_0.012_50)] border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
          <Icon
            icon="lucide:check-circle-2"
            className="w-4 h-4 text-emerald-400"
          />
          <span
            className="text-sm font-bold text-[oklch(0.82_0.008_75)]"
            style={{ fontFamily: "'Satoshi', sans-serif" }}
          >
            All scheduled
          </span>
          <span className="text-xs text-emerald-400">
            by Khanflow AI
          </span>
        </div>
      </div>

      {/* ── Mini Calendar Card ─────────────────────────── */}
      <div
        ref={calendarRef}
        className="relative w-full max-w-4xl mx-auto px-4 flex flex-col md:flex-row gap-6 rounded-3xl overflow-hidden shadow-2xl p-6 z-20"
        style={{
          background: "oklch(0.29 0.012 50 / 0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid oklch(0.35 0.01 50)",
        }}
      >
        {/* ── LEFT: Month Grid ──────────────────────────── */}
        <div className="flex-shrink-0 md:w-[280px]">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold text-[oklch(0.82_0.008_75)]"
              style={{ fontFamily: "'Satoshi', sans-serif" }}
            >
              October 2023
            </h2>
            <div className="flex gap-1">
              <button className="w-7 h-7 rounded-full hover:bg-[oklch(0.35_0.01_50)] flex items-center justify-center transition-colors text-[oklch(0.58_0.015_50)]">
                <Icon icon="lucide:chevron-left" className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded-full hover:bg-[oklch(0.35_0.01_50)] flex items-center justify-center transition-colors text-[oklch(0.58_0.015_50)]">
                <Icon icon="lucide:chevron-right" className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayHeaders.map((d) => (
              <div
                key={d}
                className="text-[10px] font-semibold text-[oklch(0.58_0.015_50)] text-center uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isToday = day === today;
              const dots = eventDots[day];
              return (
                <div key={day} className="flex flex-col items-center py-[2px]">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors cursor-pointer
                      ${
                        isToday
                          ? "bg-[oklch(0.65_0.12_35)] text-white font-bold shadow-md shadow-[oklch(0.65_0.12_35)]/30"
                          : "text-[oklch(0.75_0.01_50)] hover:bg-[oklch(0.35_0.01_50)]"
                      }`}
                  >
                    {day}
                  </div>
                  <div className="flex gap-[2px] mt-[2px] h-[5px]">
                    {dots
                      ? dots
                          .slice(0, 3)
                          .map((c, i) => (
                            <span
                              key={i}
                              className={`w-[5px] h-[5px] rounded-full ${dotColorClass[c]}`}
                            />
                          ))
                      : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-[oklch(0.58_0.015_50)]">
            {Object.entries(dotColorClass).map(([label, cls]) => (
              <div key={label} className="flex items-center gap-1 capitalize">
                <span className={`w-2 h-2 rounded-full ${cls}`} />
                {label === "amber"
                  ? "Work"
                  : label === "indigo"
                    ? "Personal"
                    : label === "emerald"
                      ? "Gym"
                      : "Social"}
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────── */}
        <div className="hidden md:block w-px bg-[oklch(0.35_0.01_50)]" />
        <div className="block md:hidden h-px bg-[oklch(0.35_0.01_50)]" />

        {/* ── RIGHT: Today's Events ─────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[oklch(0.58_0.015_50)] uppercase tracking-wider font-semibold">
                Wednesday
              </p>
              <h3
                className="text-base font-bold text-[oklch(0.82_0.008_75)]"
                style={{ fontFamily: "'Satoshi', sans-serif" }}
              >
                October 25
              </h3>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[oklch(0.65_0.12_35)]/15 text-[oklch(0.65_0.12_35)]">
              {eventCards.length} events
            </span>
          </div>

          {/* Event list — cards land here */}
          <div className="relative flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {eventCards.map((card, i) => (
              <div
                key={card.id}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                className="event-card"
              >
                <CalendarEventCard
                  category={card.category}
                  title={card.title}
                  time={card.time}
                  color={card.color}
                  icon={card.icon}
                  avatars={card.avatars}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
