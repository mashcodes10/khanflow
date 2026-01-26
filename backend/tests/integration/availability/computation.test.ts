import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getTestDataSource } from "../../helpers/db";
import { User } from "../../../src/database/entities/user.entity";
import { Availability } from "../../../src/database/entities/availability.entity";
import { DayAvailability, DayOfWeekEnum } from "../../../src/database/entities/day-availability";
import { computeAvailabilityPreview } from "../../../src/lib/availability/preview";
import { AvailabilitySettings } from "../../../src/lib/availability/slot-generation";
import { FakeCalendarBusyProvider } from "../../helpers/fake-calendar-busy-provider";
import { freezeTime, unfreezeTime } from "../../helpers/time";

describe("Availability Computation - Integration", () => {
  let fakeBusyProvider: FakeCalendarBusyProvider;

  beforeEach(async () => {
    freezeTime("2025-01-27T15:00:00Z"); // Monday, 10 AM EST (15:00 UTC = 10:00 EST in January)
    fakeBusyProvider = new FakeCalendarBusyProvider();
  });

  afterEach(() => {
    unfreezeTime();
    fakeBusyProvider.clearAll();
  });

  const createTestUserWithAvailability = async () => {
    const dataSource = await getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    const availabilityRepo = dataSource.getRepository(Availability);
    const dayRepo = dataSource.getRepository(DayAvailability);

    const user = userRepo.create({
      name: "Test User",
      username: `testuser-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      password: "password123",
    });
    await userRepo.save(user);

    // Create weekly schedule: Mon-Fri 9-5
    const days = [
      DayOfWeekEnum.MONDAY,
      DayOfWeekEnum.TUESDAY,
      DayOfWeekEnum.WEDNESDAY,
      DayOfWeekEnum.THURSDAY,
      DayOfWeekEnum.FRIDAY,
    ].map((day) =>
      dayRepo.create({
        day,
        startTime: new Date("2025-01-01T09:00:00Z"),
        endTime: new Date("2025-01-01T17:00:00Z"),
        isAvailable: true,
      })
    );

    const availability = availabilityRepo.create({
      user,
      timeGap: 30,
      timezone: "America/New_York",
      minimumNotice: 240, // 4 hours
      bookingWindow: 7, // 7 days
      days,
    });
    await availabilityRepo.save(availability);

    return { user, availability, days };
  };

  it("should compute availability preview for next 7 days", async () => {
    const { availability } = await createTestUserWithAvailability();
    const now = new Date("2025-01-27T15:00:00Z"); // 10 AM EST (15:00 UTC = 10:00 EST in January)

    const settings: AvailabilitySettings = {
      timezone: availability.timezone || "America/New_York",
      bufferTime: availability.timeGap,
      minimumNotice: availability.minimumNotice || 240,
      bookingWindow: availability.bookingWindow || 7,
    };

    const preview = await computeAvailabilityPreview(
      now,
      7,
      settings,
      availability.days.map((d) => ({
        day: d.day,
        startTime: d.startTime,
        endTime: d.endTime,
        isAvailable: d.isAvailable,
      })),
      60, // 60-minute slots
      availability.timeGap,
      (start, end) => fakeBusyProvider.getBusyBlocks(start, end),
      []
    );

    expect(preview.days.length).toBe(7);
    expect(preview.totalSlots).toBeGreaterThan(0);
    expect(preview.totalHours).toBeGreaterThan(0);

    // Monday should have slots (today, but after minimum notice)
    const monday = preview.days.find((d) => d.dayOfWeek === DayOfWeekEnum.MONDAY);
    expect(monday).toBeDefined();
    // Slots should be filtered by minimum notice (4 hours from 10 AM = 2 PM earliest)
    if (monday && monday.slots.length > 0) {
      expect(monday.slots[0].timeString).toBe("14:00"); // 2 PM
    }
  });

  it("should filter slots by calendar busy blocks", async () => {
    const { availability } = await createTestUserWithAvailability();
    const now = new Date("2025-01-27T15:00:00Z"); // 10 AM EST (15:00 UTC = 10:00 EST in January)

    // Add a busy block on Tuesday from 10 AM to 12 PM EST (15:00-17:00 UTC)
    const tuesday = new Date("2025-01-28T15:00:00Z"); // 10 AM EST
    fakeBusyProvider.addBusyBlock("cal1", tuesday, new Date("2025-01-28T17:00:00Z")); // 12 PM EST

    const settings: AvailabilitySettings = {
      timezone: availability.timezone || "America/New_York",
      bufferTime: 30,
      minimumNotice: 0, // No minimum notice for this test
      bookingWindow: 7,
    };

    const preview = await computeAvailabilityPreview(
      now,
      7,
      settings,
      availability.days.map((d) => ({
        day: d.day,
        startTime: d.startTime,
        endTime: d.endTime,
        isAvailable: d.isAvailable,
      })),
      60,
      availability.timeGap,
      (start, end) => fakeBusyProvider.getBusyBlocks(start, end, ["cal1"]),
      ["cal1"]
    );

    const tuesdayDay = preview.days.find((d) => d.dayOfWeek === DayOfWeekEnum.TUESDAY);
    expect(tuesdayDay).toBeDefined();

    if (tuesdayDay) {
      const slotTimes = tuesdayDay.slots.map((s) => s.timeString);
      // Busy block: 10 AM - 12 PM EST with 30min buffer = 9:30 AM - 12:30 PM EST
      // With 60-min slots and 30-min gap, slots start at: 9:00, 10:30, 12:00, 1:30, etc.
      // Slots that overlap with busy period (9:30-12:30) should be filtered out
      expect(slotTimes).not.toContain("09:00"); // 9:00-10:00 overlaps with 9:30-12:30
      expect(slotTimes).not.toContain("10:30"); // 10:30-11:30 overlaps with 9:30-12:30
      expect(slotTimes).not.toContain("12:00"); // 12:00-1:00 overlaps with 9:30-12:30
      // 13:30 (1:30 PM) should be available (first slot after busy period)
      expect(slotTimes).toContain("13:30");
    }
  });

  it("should respect calendar selection - only selected calendars affect availability", async () => {
    const { availability } = await createTestUserWithAvailability();
    const now = new Date("2025-01-27T15:00:00Z"); // 10 AM EST (15:00 UTC = 10:00 EST in January)

    // Add busy blocks to two calendars (in EST timezone: 10 AM EST = 3 PM UTC)
    // Use non-overlapping blocks to ensure cal2 filters additional slots
    const tuesday = new Date("2025-01-28T15:00:00Z"); // 10 AM EST
    fakeBusyProvider.addBusyBlock("cal1", tuesday, new Date("2025-01-28T17:00:00Z")); // 10 AM - 12 PM EST
    // cal2 block starts after cal1 ends to ensure it filters additional slots
    fakeBusyProvider.addBusyBlock("cal2", new Date("2025-01-28T18:00:00Z"), new Date("2025-01-28T20:00:00Z")); // 1 PM - 3 PM EST

    const settings: AvailabilitySettings = {
      timezone: availability.timezone || "America/New_York",
      bufferTime: 30,
      minimumNotice: 0,
      bookingWindow: 7,
    };

    // Only select cal1
    const previewWithCal1 = await computeAvailabilityPreview(
      now,
      7,
      settings,
      availability.days.map((d) => ({
        day: d.day,
        startTime: d.startTime,
        endTime: d.endTime,
        isAvailable: d.isAvailable,
      })),
      60,
      availability.timeGap,
      (start, end) => fakeBusyProvider.getBusyBlocks(start, end, ["cal1"]),
      ["cal1"]
    );

    // Select both calendars
    const previewWithBoth = await computeAvailabilityPreview(
      now,
      7,
      settings,
      availability.days.map((d) => ({
        day: d.day,
        startTime: d.startTime,
        endTime: d.endTime,
        isAvailable: d.isAvailable,
      })),
      60,
      availability.timeGap,
      (start, end) => fakeBusyProvider.getBusyBlocks(start, end, ["cal1", "cal2"]),
      ["cal1", "cal2"]
    );

    const tuesdayCal1 = previewWithCal1.days.find((d) => d.dayOfWeek === DayOfWeekEnum.TUESDAY);
    const tuesdayBoth = previewWithBoth.days.find((d) => d.dayOfWeek === DayOfWeekEnum.TUESDAY);

    expect(tuesdayCal1?.slots.length).toBeGreaterThan(tuesdayBoth?.slots.length || 0);
    // With both calendars, more slots should be filtered
  });

  it("should apply minimum notice filter correctly", async () => {
    const { availability } = await createTestUserWithAvailability();
    const now = new Date("2025-01-27T15:00:00Z"); // Monday 10 AM EST (15:00 UTC = 10:00 EST in January)

    const settings: AvailabilitySettings = {
      timezone: availability.timezone || "America/New_York",
      bufferTime: 0,
      minimumNotice: 240, // 4 hours
      bookingWindow: 7,
    };

    const preview = await computeAvailabilityPreview(
      now,
      7,
      settings,
      availability.days.map((d) => ({
        day: d.day,
        startTime: d.startTime,
        endTime: d.endTime,
        isAvailable: d.isAvailable,
      })),
      60,
      availability.timeGap,
      (start, end) => fakeBusyProvider.getBusyBlocks(start, end),
      []
    );

    const monday = preview.days.find((d) => d.dayOfWeek === DayOfWeekEnum.MONDAY);
    if (monday && monday.slots.length > 0) {
      // First slot should be at 2 PM (10 AM + 4 hours)
      expect(monday.slots[0].timeString).toBe("14:00");
    }
  });

  it("should apply booking window filter correctly", async () => {
    const { availability } = await createTestUserWithAvailability();
    const now = new Date("2025-01-27T15:00:00Z"); // 10 AM EST (15:00 UTC = 10:00 EST in January)

    const settings: AvailabilitySettings = {
      timezone: availability.timezone || "America/New_York",
      bufferTime: 0,
      minimumNotice: 0,
      bookingWindow: 3, // Only 3 days
    };

    const preview = await computeAvailabilityPreview(
      now,
      7, // Request 7 days
      settings,
      availability.days.map((d) => ({
        day: d.day,
        startTime: d.startTime,
        endTime: d.endTime,
        isAvailable: d.isAvailable,
      })),
      60,
      availability.timeGap,
      (start, end) => fakeBusyProvider.getBusyBlocks(start, end),
      []
    );

    // Days beyond 3 days should have no slots
    // With bookingWindow=3, days 0-3 are included (Monday-Thursday), day 4+ (Friday+) are excluded
    const friday = preview.days.find((d) => d.dayOfWeek === DayOfWeekEnum.FRIDAY);
    const saturday = preview.days.find((d) => d.dayOfWeek === DayOfWeekEnum.SATURDAY);

    // Friday (day 4) and Saturday (day 5) should be filtered out
    // Thursday (day 3) should still be included with bookingWindow=3
    if (friday) {
      expect(friday.slots.length).toBe(0);
    }
    if (saturday) {
      expect(saturday.slots.length).toBe(0);
    }
  });
});
