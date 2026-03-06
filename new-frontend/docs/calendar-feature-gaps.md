# Calendar Page — Feature Gap Analysis

> Based on the app's core goal: **"your time should reflect your life goals"**

---

## What the calendar currently does well

- Shows Google + Outlook + Khanflow events in one unified view
- Drag intents from Life OS panel → schedule them on the calendar
- Link calendar events to Life OS boards (split view in event detail)
- AI suggestion ghost blocks rendered inline
- Intent due dates shown as all-day events
- Google → Outlook fallback for event creation

---

## Absolutely missing (critical gaps)

### 1. Life area time distribution — most critical

You can link events to boards, but there is zero feedback on where your time actually went. If the whole point is to align your calendar with your Life OS areas, the calendar needs to answer:

> "This week I spent 10h on Career, 0h on Health, 2h on Relationships."

That insight is completely absent. The feedback loop — link event → see impact on life balance — is never closed.

**What it needs:** A weekly breakdown bar or panel showing hours per life area, derived from linked events.

---

### 2. AI suggestions are siloed

Suggestions live on a separate page and only appear as passive ghost blocks if they already have a time assigned. There is no way to see "the AI thinks you should schedule X this week" and act on it from within the calendar. The path from AI insight → scheduled time is broken.

**What it needs:** A surfaced suggestions strip or sidebar section in the calendar that lists pending suggestions with one-click scheduling.

---

### 3. Google Tasks / Microsoft To-Do due dates not on calendar

Intent due dates show as all-day events, but tasks from the Tasks page are completely invisible on the calendar. The app integrates Google Tasks and Microsoft To-Do but they never appear here. This is inconsistent — if intents with due dates are rendered, tasks should be too.

**What it needs:** Task due dates rendered as all-day chips (same as intent due dates), togglable via the sidebar.

---

### 4. No weekly planning mode

There is no structured way to plan the week. You can drag intents one at a time, but there is no "plan my week" flow that shows unscheduled focus intents alongside empty calendar slots and lets you fill them intentionally.

**What it needs:** A planning mode (or panel) that lists all unpinned/unscheduled intents for the week and surfaces open time slots, so the user can allocate intentionally.

---

## Nice-to-have (not critical)

- **Availability overlay** — visually highlight bookable slots based on availability settings so the user can see free/busy at a glance
- **Recurring event badge** — a small indicator on event chips that are part of a recurring series
- **Voice capture from calendar** — quick access to the voice assistant without leaving the calendar view

---

## Priority order

| # | Feature | Impact | Effort |
|---|---------|--------|--------|
| 1 | Life area time distribution | High — closes the core feedback loop | Medium |
| 2 | AI suggestions inline | High — makes AI actionable | Low |
| 3 | Tasks due dates on calendar | Medium — unifies the data model | Low |
| 4 | Weekly planning mode | High — core differentiator | High |
| 5 | Availability overlay | Medium | Medium |
| 6 | Recurring event badge | Low | Low |
