import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateTimeSlots,
  convertSlotsToTimezone,
  DaySchedule,
} from "../../../src/lib/availability/slot-generation";
import { freezeTime, unfreezeTime } from "../../helpers/time";

describe("Availability - Timezone Conversion", () => {
  beforeEach(() => {
    // Freeze time to a fixed date: Monday, Jan 27, 2025 10:00 AM UTC
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

  it("should generate slots in UTC timezone", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].timeString).toBe("09:00");
    expect(slots[0].start.toISOString()).toBe("2025-01-27T09:00:00.000Z");
  });

  it("should generate slots in America/New_York timezone (EST, UTC-5)", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "America/New_York");

    expect(slots.length).toBeGreaterThan(0);
    // 9 AM EST = 14:00 UTC, but displayed as 09:00 in EST
    expect(slots[0].timeString).toBe("09:00");
    // The actual UTC time should be 14:00 (9 AM + 5 hours)
    expect(slots[0].start.getUTCHours()).toBe(14);
  });

  it("should generate slots in America/Los_Angeles timezone (PST, UTC-8)", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "America/Los_Angeles");

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].timeString).toBe("09:00");
    // 9 AM PST = 17:00 UTC
    expect(slots[0].start.getUTCHours()).toBe(17);
  });

  it("should convert slots from one timezone to another", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slotsUTC = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");

    // Convert to EST
    const slotsEST = convertSlotsToTimezone(slotsUTC, "America/New_York");

    expect(slotsEST.length).toBe(slotsUTC.length);
    // The time strings should reflect EST time
    // 9 AM UTC = 4 AM EST
    expect(slotsEST[0].timeString).toBe("04:00");
  });

  it("should maintain slot count when converting timezones", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slotsUTC = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");
    const originalCount = slotsUTC.length;

    const slotsEST = convertSlotsToTimezone(slotsUTC, "America/New_York");
    const slotsPST = convertSlotsToTimezone(slotsUTC, "America/Los_Angeles");

    expect(slotsEST.length).toBe(originalCount);
    expect(slotsPST.length).toBe(originalCount);
  });

  it("should handle timezone conversion for different days", () => {
    const monday = new Date("2025-01-27T00:00:00Z"); // Monday
    const tuesday = new Date("2025-01-28T00:00:00Z"); // Tuesday

    const mondaySlots = generateTimeSlots(monday, baseSchedule, 60, 0, "America/New_York");
    const tuesdaySlots = generateTimeSlots(tuesday, baseSchedule, 60, 0, "America/New_York");

    expect(mondaySlots.length).toBe(tuesdaySlots.length);
    expect(mondaySlots[0].timeString).toBe(tuesdaySlots[0].timeString);
  });
});
