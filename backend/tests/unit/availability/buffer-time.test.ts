import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateTimeSlots,
  filterSlotsByBusyBlocks,
  DaySchedule,
  BusyBlock,
} from "../../../src/lib/availability/slot-generation";
import { freezeTime, unfreezeTime } from "../../helpers/time";

describe("Availability - Buffer Time", () => {
  beforeEach(() => {
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

  it("should allow adjacent slots when buffer=0", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");

    // Create a busy block from 10:00-11:00
    const busyBlock: BusyBlock = {
      start: new Date("2025-01-27T10:00:00Z"),
      end: new Date("2025-01-27T11:00:00Z"),
    };

    const filtered = filterSlotsByBusyBlocks(slots, [busyBlock], 0);

    // Should have slots at 9:00 and 11:00 (adjacent to busy block)
    const slotTimes = filtered.map((s) => s.timeString);
    expect(slotTimes).toContain("09:00");
    expect(slotTimes).toContain("11:00");
    expect(slotTimes).not.toContain("10:00");
  });

  it("should remove slots with 30-minute buffer", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");

    // Create a busy block from 10:00-11:00
    const busyBlock: BusyBlock = {
      start: new Date("2025-01-27T10:00:00Z"),
      end: new Date("2025-01-27T11:00:00Z"),
    };

    const filtered = filterSlotsByBusyBlocks(slots, [busyBlock], 30);

    // With 30min buffer, the buffered period is 9:30-11:30
    // Slots at 9:00, 9:30, 10:00, 10:30, 11:00, 11:30 should be removed (they overlap with buffered period)
    const slotTimes = filtered.map((s) => s.timeString);
    expect(slotTimes).not.toContain("09:00"); // 9:00-10:00 overlaps with 9:30-11:30
    expect(slotTimes).not.toContain("09:30");
    expect(slotTimes).not.toContain("10:00");
    expect(slotTimes).not.toContain("10:30");
    expect(slotTimes).not.toContain("11:00");
    expect(slotTimes).not.toContain("11:30");

    // 12:00 should be available (30min after busy block ends)
    expect(slotTimes).toContain("12:00");
  });

  it("should handle multiple busy blocks with buffer", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");

    const busyBlocks: BusyBlock[] = [
      {
        start: new Date("2025-01-27T10:00:00Z"),
        end: new Date("2025-01-27T11:00:00Z"),
      },
      {
        start: new Date("2025-01-27T14:00:00Z"),
        end: new Date("2025-01-27T15:00:00Z"),
      },
    ];

    const filtered = filterSlotsByBusyBlocks(slots, busyBlocks, 30);

    const slotTimes = filtered.map((s) => s.timeString);
    // Both busy blocks should remove adjacent slots
    expect(slotTimes).not.toContain("09:30");
    expect(slotTimes).not.toContain("10:00");
    expect(slotTimes).not.toContain("11:00");
    expect(slotTimes).not.toContain("11:30");
    expect(slotTimes).not.toContain("13:30");
    expect(slotTimes).not.toContain("14:00");
    expect(slotTimes).not.toContain("15:00");
    expect(slotTimes).not.toContain("15:30");
  });

  it("should not filter slots when no busy blocks exist", () => {
    const date = new Date("2025-01-27T00:00:00Z");
    const slots = generateTimeSlots(date, baseSchedule, 60, 0, "UTC");
    const originalCount = slots.length;

    const filtered = filterSlotsByBusyBlocks(slots, [], 30);

    expect(filtered.length).toBe(originalCount);
  });
});
