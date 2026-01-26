import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateTimeSlots,
  filterSlotsByMinimumNotice,
  DaySchedule,
} from "../../../src/lib/availability/slot-generation";
import { freezeTime, unfreezeTime, advanceTime } from "../../helpers/time";

describe("Availability - Minimum Notice", () => {
  beforeEach(() => {
    // Freeze time to Monday, Jan 27, 2025 10:00 AM UTC
    freezeTime("2025-01-27T10:00:00Z");
  });

  afterEach(() => {
    unfreezeTime();
  });

  const baseSchedule: DaySchedule = {
    dayOfWeek: 1, // Monday
    startTime: "09:00",
    endTime: "17:00",
    isAvailable: true,
  };

  it("should not filter slots when minimumNotice=0", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");
    const now = new Date("2025-01-27T10:00:00Z");

    const filtered = filterSlotsByMinimumNotice(slots, now, 0);

    expect(filtered.length).toBe(slots.length);
  });

  it("should remove slots within 4 hours (240 minutes)", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");
    const now = new Date("2025-01-27T10:00:00Z"); // 10:00 AM

    const filtered = filterSlotsByMinimumNotice(slots, now, 240); // 4 hours

    const slotTimes = filtered.map((s) => s.timeString);
    // Slots before 2:00 PM (10:00 + 4 hours) should be removed
    expect(slotTimes).not.toContain("09:00");
    expect(slotTimes).not.toContain("10:00");
    expect(slotTimes).not.toContain("11:00");
    expect(slotTimes).not.toContain("12:00");
    expect(slotTimes).not.toContain("13:00");
    // 14:00 (2:00 PM) should be the first available slot
    expect(slotTimes).toContain("14:00");
    expect(slotTimes).toContain("15:00");
  });

  it("should remove slots within 24 hours (1440 minutes)", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");
    const now = new Date("2025-01-27T10:00:00Z"); // 10:00 AM

    const filtered = filterSlotsByMinimumNotice(slots, now, 1440); // 24 hours

    const slotTimes = filtered.map((s) => s.timeString);
    // All slots today should be removed
    expect(slotTimes.length).toBe(0);
  });

  it("should allow slots tomorrow when notice=24h", () => {
    const tomorrow = new Date("2025-01-28T00:00:00Z");
    const slots = generateTimeSlots(tomorrow, baseSchedule, 60, 0, "UTC");
    const now = new Date("2025-01-27T10:00:00Z"); // 10:00 AM today

    const filtered = filterSlotsByMinimumNotice(slots, now, 1440); // 24 hours

    // Tomorrow's slots should be available (more than 24h away)
    // With 24h notice from 10:00 AM today, slots before 10:00 AM tomorrow are filtered
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered[0].timeString).toBe("10:00"); // First available slot is at 10:00 (exactly 24h later)
  });

  it("should handle edge case: slot exactly at cutoff time", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");
    const now = new Date("2025-01-27T10:00:00Z"); // 10:00 AM
    const cutoff = new Date("2025-01-27T14:00:00Z"); // 2:00 PM (exactly 4 hours later)

    const filtered = filterSlotsByMinimumNotice(slots, now, 240); // 4 hours

    // Slot at exactly 14:00 should be included (>= cutoff)
    const slotAtCutoff = filtered.find((s) => s.start.getTime() === cutoff.getTime());
    expect(slotAtCutoff).toBeDefined();
  });

  it("should work correctly when time advances", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");

    // Initial time: 10:00 AM
    let now = new Date("2025-01-27T10:00:00Z");
    let filtered = filterSlotsByMinimumNotice(slots, now, 240);
    expect(filtered.length).toBeGreaterThan(0);

    // Advance time by 2 hours: 12:00 PM
    advanceTime(2 * 60 * 60 * 1000);
    now = new Date("2025-01-27T12:00:00Z");
    filtered = filterSlotsByMinimumNotice(slots, now, 240);
    // More slots should be available now
    expect(filtered.length).toBeGreaterThan(0);
  });
});
