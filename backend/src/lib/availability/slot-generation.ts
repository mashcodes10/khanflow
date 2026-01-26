import { addMinutes, format, startOfDay, addDays, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export interface TimeSlot {
  start: Date;
  end: Date;
  timeString: string; // HH:mm format in the specified timezone
}

export interface BusyBlock {
  start: Date;
  end: Date;
  calendarId?: string;
  provider?: string;
}

export interface AvailabilitySettings {
  timezone: string;
  bufferTime: number; // minutes
  minimumNotice: number; // minutes
  bookingWindow: number; // days
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

/**
 * Generate time slots for a given day based on schedule
 */
export function generateTimeSlots(
  date: Date,
  schedule: DaySchedule,
  slotDuration: number, // minutes
  timeGap: number, // minutes (buffer between slots)
  timezone: string
): TimeSlot[] {
  if (!schedule.isAvailable) {
    return [];
  }

  const slots: TimeSlot[] = [];
  
  // Format date in the target timezone to get the correct date string
  // This ensures we use the date as it appears in that timezone, not local timezone
  const dateStr = formatInTimeZone(date, timezone, "yyyy-MM-dd");

  // Parse start and end times
  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

  // Create zoned times for the day
  // Parse the date string as if it's in the specified timezone, then convert to UTC
  const dayStartStr = `${dateStr}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`;
  const dayEndStr = `${dateStr}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`;
  
  // For UTC, append 'Z' to ensure UTC parsing. For other timezones, use fromZonedTime
  let dayStart: Date;
  let dayEnd: Date;
  
  if (timezone === "UTC") {
    dayStart = parseISO(dayStartStr + "Z");
    dayEnd = parseISO(dayEndStr + "Z");
  } else {
    // Use parseISO to ensure consistent parsing, then treat as if in the specified timezone
    const dayStartLocal = parseISO(dayStartStr);
    const dayEndLocal = parseISO(dayEndStr);
    dayStart = fromZonedTime(dayStartLocal, timezone);
    dayEnd = fromZonedTime(dayEndLocal, timezone);
  }

  let currentSlotStart = dayStart;

  while (currentSlotStart < dayEnd) {
    const slotEnd = addMinutes(currentSlotStart, slotDuration);

    // Don't create slots that extend beyond the day
    if (slotEnd > dayEnd) {
      break;
    }

    // Format time in the specified timezone for display
    const zonedTime = toZonedTime(currentSlotStart, timezone);
    const timeString = format(zonedTime, "HH:mm");

    slots.push({
      start: currentSlotStart,
      end: slotEnd,
      timeString,
    });

    // Move to next slot (duration + gap)
    currentSlotStart = addMinutes(currentSlotStart, slotDuration + timeGap);
  }

  return slots;
}

/**
 * Filter slots based on busy blocks (with buffer time)
 */
export function filterSlotsByBusyBlocks(
  slots: TimeSlot[],
  busyBlocks: BusyBlock[],
  bufferTime: number // minutes
): TimeSlot[] {
  if (busyBlocks.length === 0) {
    return slots;
  }

  return slots.filter((slot) => {
    // Check if slot overlaps with any busy block (including buffer)
    return !busyBlocks.some((block) => {
      const blockStartWithBuffer = addMinutes(block.start, -bufferTime);
      const blockEndWithBuffer = addMinutes(block.end, bufferTime);
      
      // Slot overlaps with buffered busy period if:
      // slot.start < bufferedBlockEnd && slot.end > bufferedBlockStart
      // This means the slot and the buffered period have any time in common
      const overlaps = slot.start < blockEndWithBuffer && slot.end > blockStartWithBuffer;
      
      return overlaps;
    });
  });
}

/**
 * Filter slots based on minimum notice requirement
 */
export function filterSlotsByMinimumNotice(
  slots: TimeSlot[],
  now: Date,
  minimumNotice: number // minutes
): TimeSlot[] {
  if (minimumNotice === 0) {
    return slots;
  }

  const cutoffTime = addMinutes(now, minimumNotice);

  return slots.filter((slot) => {
    return slot.start >= cutoffTime;
  });
}

/**
 * Filter slots based on booking window
 */
export function filterSlotsByBookingWindow(
  slots: TimeSlot[],
  now: Date,
  bookingWindow: number, // days
  timezone: string = "UTC"
): TimeSlot[] {
  if (bookingWindow === 0) {
    // If booking window is 0, only allow slots today
    const todayStart = startOfDay(now);
    const todayEnd = addDays(todayStart, 1);
    return slots.filter((slot) => {
      return slot.start >= todayStart && slot.start < todayEnd;
    });
  }

  // bookingWindow=3 means you can book up to 3 days in advance (inclusive)
  // Days 0, 1, 2, 3 are included, day 4+ are excluded
  // Calculate window end based on calendar days in the target timezone
  
  // Get the start of today in the target timezone
  const nowDateStr = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  const todayStartUTC = fromZonedTime(parseISO(nowDateStr + "T00:00:00"), timezone);
  
  // Add days to get the start of the day after the last allowed day
  // bookingWindow=3 means days 0-3 are included, so we want to exclude day 4+
  // cutoffDayStartUTC is the start of day (bookingWindow + 1), which is the first excluded day
  const cutoffDayStartUTC = addDays(todayStartUTC, bookingWindow + 1);

  return slots.filter((slot) => {
    // Get the slot's date in the target timezone
    const slotDateStr = formatInTimeZone(slot.start, timezone, "yyyy-MM-dd");
    const slotDayStartUTC = fromZonedTime(parseISO(slotDateStr + "T00:00:00"), timezone);
    
    // Check if the slot's day is within the booking window
    // Days 0 through bookingWindow are included (slotDayStartUTC < cutoffDayStartUTC)
    // Day 0 is today, day 1 is tomorrow, etc.
    return slotDayStartUTC < cutoffDayStartUTC;
  });
}

/**
 * Convert slots to a specific timezone for display
 */
export function convertSlotsToTimezone(
  slots: TimeSlot[],
  targetTimezone: string
): TimeSlot[] {
  return slots.map((slot) => {
    const zonedTime = toZonedTime(slot.start, targetTimezone);
    return {
      ...slot,
      timeString: format(zonedTime, "HH:mm"),
    };
  });
}

/**
 * Complete availability computation pipeline
 */
export function computeAvailability(
  date: Date,
  schedule: DaySchedule,
  slotDuration: number,
  settings: AvailabilitySettings,
  busyBlocks: BusyBlock[],
  now: Date,
  timeGap: number = 0 // minutes between slots
): TimeSlot[] {
  // Generate base slots
  let slots = generateTimeSlots(
    date,
    schedule,
    slotDuration,
    timeGap,
    settings.timezone
  );

  // Filter by busy blocks (with buffer)
  slots = filterSlotsByBusyBlocks(slots, busyBlocks, settings.bufferTime);

  // Filter by minimum notice
  slots = filterSlotsByMinimumNotice(slots, now, settings.minimumNotice);

  // Filter by booking window
  slots = filterSlotsByBookingWindow(slots, now, settings.bookingWindow, settings.timezone);

  // Convert to display timezone
  slots = convertSlotsToTimezone(slots, settings.timezone);

  return slots;
}
