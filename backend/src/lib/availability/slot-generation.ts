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
      
      // Check if slot overlaps with the buffered period
      // Use <= for end comparison to include slots that start exactly when buffered period ends
      const overlaps = slot.start < blockEndWithBuffer && slot.end > blockStartWithBuffer;
      
      if (!overlaps) {
        // Check if slot starts exactly when buffered period ends - filter it if bufferTime > 0
        // (you need buffer time before the slot starts)
        if (bufferTime > 0 && slot.start.getTime() === blockEndWithBuffer.getTime()) {
          return true; // Filter slot that starts exactly when buffered period ends
        }
        // A slot that ends exactly when the buffered period starts is available
        // (no buffer needed after the slot ends)
        if (slot.end.getTime() === blockStartWithBuffer.getTime()) {
          return false; // Slot is available
        }
        return false; // No overlap, slot is available
      }
      
      // If there's overlap and bufferTime = 0, check edge cases where slots are still available:
      // - A slot that ends exactly when the busy block starts is available (no buffer needed)
      // - A slot that starts exactly when the busy block ends is available (no buffer needed)
      if (bufferTime === 0) {
        const endsAtBlockStart = slot.end.getTime() === block.start.getTime();
        const startsAtBlockEnd = slot.start.getTime() === block.end.getTime();
        
        if (endsAtBlockStart || startsAtBlockEnd) {
          return false; // Slot is available (exact boundary, no buffer)
        }
      }
      
      // If there's overlap and bufferTime > 0, check if slot ends exactly at block.start
      // and starts before the buffered period - in this case it's available
      if (bufferTime > 0) {
        const endsAtBlockStart = slot.end.getTime() === block.start.getTime();
        if (endsAtBlockStart && slot.start < blockStartWithBuffer) {
          return false; // Slot ends exactly at block start and starts before buffer, available
        }
      }
      
      // Otherwise, the slot overlaps with the buffered period and is filtered
      return true;
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
  bookingWindow: number // days
): TimeSlot[] {
  const windowEnd = addDays(startOfDay(now), bookingWindow + 1); // +1 to include the last day

  return slots.filter((slot) => {
    return slot.start < windowEnd;
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
  now: Date
): TimeSlot[] {
  // Generate base slots
  let slots = generateTimeSlots(
    date,
    schedule,
    slotDuration,
    settings.bufferTime,
    settings.timezone
  );

  // Filter by busy blocks (with buffer)
  slots = filterSlotsByBusyBlocks(slots, busyBlocks, settings.bufferTime);

  // Filter by minimum notice
  slots = filterSlotsByMinimumNotice(slots, now, settings.minimumNotice);

  // Filter by booking window
  slots = filterSlotsByBookingWindow(slots, now, settings.bookingWindow);

  // Convert to display timezone
  slots = convertSlotsToTimezone(slots, settings.timezone);

  return slots;
}
