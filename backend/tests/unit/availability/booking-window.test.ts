import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateTimeSlots,
  filterSlotsByBookingWindow,
  DaySchedule,
} from "../../../src/lib/availability/slot-generation";
import { freezeTime, unfreezeTime } from "../../helpers/time";
import { addDays } from "date-fns";

describe("Availability - Booking Window", () => {
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

  it("should include slots within 7-day window", () => {
    const now = new Date("2025-01-27T10:00:00Z");
    const date = new Date("2025-01-27T00:00:00Z"); // Today
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");

    const filtered = filterSlotsByBookingWindow(slots, now, 7); // 7 days

    // Today's slots should be included
    expect(filtered.length).toBeGreaterThan(0);
  });

  it("should exclude slots beyond 7-day window", () => {
    const now = new Date("2025-01-27T10:00:00Z");
    const date8DaysLater = addDays(now, 8);
    const slots = generateTimeSlots(date8DaysLater, baseSchedule, 60, 0, "UTC");

    const filtered = filterSlotsByBookingWindow(slots, now, 7); // 7 days

    // Slots 8 days later should be excluded
    expect(filtered.length).toBe(0);
  });

  it("should include slots exactly at 7-day boundary", () => {
    const now = new Date("2025-01-27T10:00:00Z");
    const date7DaysLater = addDays(now, 7);
    const slots = generateTimeSlots(date7DaysLater, baseSchedule, 60, 0, "UTC");

    const filtered = filterSlotsByBookingWindow(slots, now, 7); // 7 days

    // Slots exactly 7 days later should be included (window is inclusive)
    expect(filtered.length).toBeGreaterThan(0);
  });

  it("should include slots within 14-day window", () => {
    const now = new Date("2025-01-27T10:00:00Z");
    const date14DaysLater = addDays(now, 14);
    const slots = generateTimeSlots(date14DaysLater, baseSchedule, 60, 0, "UTC");

    const filtered = filterSlotsByBookingWindow(slots, now, 14); // 14 days

    // Slots 14 days later should be included
    expect(filtered.length).toBeGreaterThan(0);
  });

  it("should exclude slots beyond 14-day window", () => {
    const now = new Date("2025-01-27T10:00:00Z");
    const date15DaysLater = addDays(now, 15);
    const slots = generateTimeSlots(date15DaysLater, baseSchedule, 60, 0, "UTC");

    const filtered = filterSlotsByBookingWindow(slots, now, 14); // 14 days

    // Slots 15 days later should be excluded
    expect(filtered.length).toBe(0);
  });

  it("should handle multiple days within window", () => {
    const now = new Date("2025-01-27T10:00:00Z");
    const today = new Date("2025-01-27T00:00:00Z");
    const day3 = addDays(now, 3);
    const day7 = addDays(now, 7);

    const slotsToday = generateTimeSlots(today, baseSchedule, 60, 0, "UTC");
    const slotsDay3 = generateTimeSlots(day3, baseSchedule, 60, 0, "UTC");
    const slotsDay7 = generateTimeSlots(day7, baseSchedule, 60, 0, "UTC");

    const allSlots = [...slotsToday, ...slotsDay3, ...slotsDay7];
    const filtered = filterSlotsByBookingWindow(allSlots, now, 7);

    // All slots within 7 days should be included
    expect(filtered.length).toBe(slotsToday.length + slotsDay3.length + slotsDay7.length);
  });

  it("should work with 30-day window", () => {
    const now = new Date("2025-01-27T10:00:00Z");
    const date30DaysLater = addDays(now, 30);
    const slots = generateTimeSlots(date30DaysLater, baseSchedule, 60, 0, "UTC");

    const filtered = filterSlotsByBookingWindow(slots, now, 30);

    // Slots 30 days later should be included
    expect(filtered.length).toBeGreaterThan(0);
  });

  it("should exclude slots beyond 30-day window", () => {
    const now = new Date("2025-01-27T10:00:00Z");
    const date31DaysLater = addDays(now, 31);
    const slots = generateTimeSlots(date31DaysLater, baseSchedule, 60, 0, "UTC");

    const filtered = filterSlotsByBookingWindow(slots, now, 30);

    // Slots 31 days later should be excluded
    expect(filtered.length).toBe(0);
  });
});
