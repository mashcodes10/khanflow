# KhanFlow Calendar Page — Design Ideas

The app is a **voice-first, AI-powered life OS** that unifies calendars, tasks, goals, and conflict resolution. The calendar page should be the **command center** — not just a grid of events, but a living surface that makes the AI, voice, and life organization features *feel native* there.

---

## Core Design Principle

> The calendar should feel like a **paper planner that thinks** — warm, tactile surfaces (fitting the "Warm Studio" palette), but with intelligent overlays that surface conflicts, life area intent, and voice access at a glance.

---

## Idea 1 — "The Split Command Center"

**Layout:** Left narrow column (today's focus) + Right wide calendar grid

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌───────────────────────────────────────┐│
│  │  TODAY        │  │  WEEKLY / MONTHLY GRID               ││
│  │  ─────────── │  │                                       ││
│  │  9:00  Standup│  │  Mon   Tue   Wed   Thu   Fri   Sat  ││
│  │  11:00 Design │  │  ████  ░░░░  ████  ░░░░  ████       ││
│  │  ──────────── │  │   ↑ conflict      ↑ free            ││
│  │  ⚡ 2 conflicts│  │                                       ││
│  │  ──────────── │  │  [+ Voice create]                   ││
│  │  🎯 Intentions│  │                                       ││
│  │  · Deep work  │  └───────────────────────────────────────┘│
│  │  · Exercise   │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

**Why it works for KhanFlow:** The left panel is always "today-aware" — shows the day's events, pending conflicts, and relevant Life OS intentions. The right is navigable. Fits the Notion-cozy feel naturally.

---

## Idea 2 — "Life-Area Swim Lanes"

**Layout:** Horizontal time axis, vertical rows = Life OS areas (Health, Work, Family, Personal)

```
            9AM     11AM    1PM     3PM     5PM
┌─────────────────────────────────────────────────┐
│ Work    │ ███████ Standup │    ████ Design Sync  │
│ Health  │         │            ██ Gym            │
│ Family  │         │                    ████ Dinner│
│ Personal│                   ██ Read              │
└─────────────────────────────────────────────────┘
```

**Why it works:** Directly mirrors the Life OS structure the app already has (life areas → intent boards → intents). Each row uses the life area's color. Conflicts appear as overlapping blocks *across* rows. Voice-created events drop into the right lane automatically based on AI classification.

---

## Idea 3 — "Voice-Forward Timeline" ⭐ Recommended

**Layout:** A persistent floating voice bar at the bottom, with an agenda/timeline view as the primary content (not a traditional grid)

```
┌─────────────────────────────────────────────────┐
│  Friday, Feb 28                   Week ▾         │
│  ──────────────────────────────────────          │
│  09:00  ┤ Team Standup           [Google Cal]    │
│         │  30 min                                │
│  09:30  ┤                                        │
│  10:00  ┤ Deep Work Block  ← AI suggested        │
│  12:00  ┤ Lunch                                  │
│       ⚠ │ Conflict: Design sync overlaps         │
│  14:00  ┤ ████ Design Sync    [rescheduled ↗]   │
│         │                                        │
│  ┌─────────────────────────────────────────────┐ │
│  │  🎤  "Schedule gym for tomorrow morning..."  │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Why it works:** The voice bar connects directly to the existing voice assistant feature — users can speak from *within* the calendar context. The AI knows the calendar state so it can suggest non-conflicting slots *instantly*. Timeline view maps perfectly to the conflict detection system already built.

---

## Idea 4 — "Week at a Glance + Conflict Radar"

**Layout:** Standard 7-col week grid at top, AI insight strip at bottom

```
┌──────────────────────────────────────────────────────────┐
│   Sun    Mon    Tue    Wed    Thu    Fri    Sat           │
│  ░░░░░  ██████  ░░░░  ██████  ░░░░  ██████  ░░░░         │
│         Standup        Design        Standup              │
│                ⚠ Conflict here                           │
│  ────────────────────────────────────────────────────    │
│  🤖 AI Insight Strip                                     │
│  "You have 3 free hours on Tuesday — good for deep work" │
│  "2 conflicts detected this week — tap to resolve"       │
│  "Your gym intention has no calendar block yet"          │
└──────────────────────────────────────────────────────────┘
```

**Why it works:** The AI insight strip at the bottom is unique — it uses the existing suggestion engine and conflict detection to surface actionable nudges *within* the calendar. Very distinct from Google Calendar or Notion.

---

## Idea 5 — "Dual-Pane: Calendar + Context Drawer"

**Layout:** Calendar grid on left, collapsible right drawer that shows context for the selected day/event

```
┌───────────────────────────┬──────────────────────┐
│  CALENDAR (grid)          │  CONTEXT DRAWER       │
│                           │  ─────────────────    │
│  [selected: Tue March 3]  │  📅 Events (3)        │
│  ████ highlighted day     │  · Standup 9AM        │
│                           │  · Design 2PM         │
│                           │                       │
│                           │  ✅ Tasks due (2)      │
│                           │  · Submit report      │
│                           │                       │
│                           │  🎯 Intentions (1)    │
│                           │  · Deep work block    │
│                           │                       │
│                           │  ⚠ 1 Conflict         │
│                           │  [Resolve with AI →]  │
└───────────────────────────┴──────────────────────┘
```

**Why it works:** Tapping a day shows *everything* relevant — events, tasks due that day, related life OS intentions, and conflicts — in one drawer. Uses the full data model the backend already has. The "Resolve with AI" button can open the voice assistant or inline resolution flow.

---

## Recommendation

**Idea 3 (Voice-Forward Timeline)** as the primary design, because:

1. **It's differentiated** — no one else's calendar looks like this
2. **The voice bar is the app's flagship feature** — it should live on the calendar, not be hidden in a separate route
3. **Agenda/timeline view is actually more useful** than a blank grid for busy professionals
4. **Conflicts feel natural** in a linear timeline — you can literally *see* the overlap
5. **It fits the warm paper aesthetic** — a linear agenda feels like a notebook, which matches "Warm Studio"

Combine it with **the AI insight strip from Idea 4** as a bonus panel at the top or bottom for maximum impact.

---

## Design Tokens Reference

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| Primary | `oklch(0.55 0.12 35)` — terracotta | `oklch(0.65 0.12 35)` | CTAs, selected events |
| Accent | `oklch(0.65 0.08 145)` — sage | `oklch(0.55 0.12 160)` — emerald | Life area highlights |
| Background | `oklch(0.88 0.02 75)` — warm cream | `oklch(0.25 0.01 50)` — charcoal | Page surface |
| Card | `oklch(0.91 0.018 75)` | `oklch(0.29 0.012 50)` | Event cards |
| Destructive | `oklch(0.55 0.18 25)` — warm red | same | Conflicts |
| Success | `oklch(0.60 0.12 145)` — sage | `oklch(0.55 0.10 145)` | Resolved conflicts |
| Warning | `oklch(0.70 0.14 70)` — amber | `oklch(0.65 0.12 70)` | Soft conflicts |
| Sidebar | `oklch(0.18 0.025 45)` — dark brown | `oklch(0.10 0.015 45)` | Navigation |
