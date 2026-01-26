import { addDays, format, startOfDay } from "date-fns";
import { DayOfWeekEnum } from "../../database/entities/day-availability";
import {
  computeAvailability,
  TimeSlot,
  BusyBlock,
  AvailabilitySettings,
  DaySchedule,
} from "./slot-generation";

export interface DayPreview {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // MONDAY, TUESDAY, etc.
  slots: TimeSlot[];
  isAvailable: boolean;
  timeRanges: string[]; // e.g., ["9:00 AM - 12:00 PM", "1:00 PM - 5:00 PM"]
}

export interface AvailabilityPreview {
  days: DayPreview[];
  totalSlots: number;
  totalHours: number;
}

/**
 * Get day of week enum from date
 */
function getDayOfWeek(date: Date): DayOfWeekEnum {
  const day = date.getDay();
  const days: DayOfWeekEnum[] = [
    DayOfWeekEnum.SUNDAY,
    DayOfWeekEnum.MONDAY,
    DayOfWeekEnum.TUESDAY,
    DayOfWeekEnum.WEDNESDAY,
    DayOfWeekEnum.THURSDAY,
    DayOfWeekEnum.FRIDAY,
    DayOfWeekEnum.SATURDAY,
  ];
  return days[day];
}

/**
 * Convert DayAvailability to DaySchedule format
 */
export function dayAvailabilityToSchedule(
  dayAvailability: {
    day: DayOfWeekEnum;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
  }
): DaySchedule {
  // Extract time from Date (stored as UTC but represents a time of day)
  const startTimeStr = format(dayAvailability.startTime, "HH:mm");
  const endTimeStr = format(dayAvailability.endTime, "HH:mm");

  const dayMap: Record<DayOfWeekEnum, number> = {
    [DayOfWeekEnum.SUNDAY]: 0,
    [DayOfWeekEnum.MONDAY]: 1,
    [DayOfWeekEnum.TUESDAY]: 2,
    [DayOfWeekEnum.WEDNESDAY]: 3,
    [DayOfWeekEnum.THURSDAY]: 4,
    [DayOfWeekEnum.FRIDAY]: 5,
    [DayOfWeekEnum.SATURDAY]: 6,
  };

  return {
    dayOfWeek: dayMap[dayAvailability.day],
    startTime: startTimeStr,
    endTime: endTimeStr,
    isAvailable: dayAvailability.isAvailable,
  };
}

/**
 * Group consecutive slots into time ranges
 */
function groupSlotsIntoRanges(slots: TimeSlot[]): string[] {
  if (slots.length === 0) {
    return [];
  }

  const ranges: string[] = [];
  let rangeStart = slots[0].timeString;
  let rangeEnd = slots[0].timeString;

  for (let i = 1; i < slots.length; i++) {
    const currentSlot = slots[i];
    const prevSlot = slots[i - 1];

    // Check if slots are consecutive (within 1 hour gap)
    const gapMinutes =
      (currentSlot.start.getTime() - prevSlot.end.getTime()) / (1000 * 60);

    if (gapMinutes <= 60) {
      // Continue the range
      rangeEnd = currentSlot.timeString;
    } else {
      // End current range and start new one
      ranges.push(`${rangeStart} - ${rangeEnd}`);
      rangeStart = currentSlot.timeString;
      rangeEnd = currentSlot.timeString;
    }
  }

  // Add the last range
  ranges.push(`${rangeStart} - ${rangeEnd}`);

  return ranges;
}

/**
 * Compute availability preview for next N days
 */
export async function computeAvailabilityPreview(
  startDate: Date,
  days: number,
  settings: AvailabilitySettings,
  weeklySchedule: Array<{
    day: DayOfWeekEnum;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
  }>,
  slotDuration: number, // minutes
  timeGap: number, // minutes
  getBusyBlocks: (
    startDate: Date,
    endDate: Date,
    selectedCalendarIds?: string[]
  ) => Promise<BusyBlock[]>,
  selectedCalendarIds?: string[]
): Promise<AvailabilityPreview> {
  const now = startDate;
  const endDate = addDays(startOfDay(now), days);
  const preview: DayPreview[] = [];

  // Get all busy blocks for the period
  const busyBlocks = await getBusyBlocks(now, endDate, selectedCalendarIds);

  // Process each day
  for (let i = 0; i < days; i++) {
    const date = addDays(startOfDay(now), i);
    const dayOfWeek = getDayOfWeek(date);
    const daySchedule = weeklySchedule.find((s) => s.day === dayOfWeek);

    if (!daySchedule) {
      preview.push({
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek,
        slots: [],
        isAvailable: false,
        timeRanges: [],
      });
      continue;
    }

    const schedule = dayAvailabilityToSchedule(daySchedule);

    // Filter busy blocks for this day
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);
    const dayBusyBlocks = busyBlocks.filter(
      (block) => block.start >= dayStart && block.start < dayEnd
    );

    // Compute availability
    const slots = computeAvailability(
      date,
      schedule,
      slotDuration,
      settings,
      dayBusyBlocks,
      now
    );

    // Group into time ranges
    const timeRanges = groupSlotsIntoRanges(slots);

    preview.push({
      date: format(date, "yyyy-MM-dd"),
      dayOfWeek,
      slots,
      isAvailable: schedule.isAvailable && slots.length > 0,
      timeRanges,
    });
  }

  // Calculate totals
  const totalSlots = preview.reduce((sum, day) => sum + day.slots.length, 0);
  const totalHours = preview.reduce((sum, day) => {
    const dayMinutes = day.slots.reduce((s, slot) => {
      return s + (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
    }, 0);
    return sum + dayMinutes / 60;
  }, 0);

  return {
    days: preview,
    totalSlots,
    totalHours: Math.round(totalHours * 10) / 10,
  };
}
