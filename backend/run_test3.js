const { addMinutes, format, startOfDay, addDays, parseISO } = require("date-fns");
const { fromZonedTime, toZonedTime, formatInTimeZone } = require("date-fns-tz");

function generateTimeSlots(date, schedule, slotDuration, timeGap, timezone) {
    const slots = [];
    const dateStr = formatInTimeZone(date, timezone, "yyyy-MM-dd");
    const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
    const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
    const dayStartStr = `${dateStr}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00`;
    const dayEndStr = `${dateStr}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00`;
    const dayStartLocal = parseISO(dayStartStr);
    const dayEndLocal = parseISO(dayEndStr);
    let dayStart = fromZonedTime(dayStartLocal, timezone);
    let dayEnd = fromZonedTime(dayEndLocal, timezone);
    let currentSlotStart = dayStart;
    while (currentSlotStart < dayEnd) {
        const slotEnd = addMinutes(currentSlotStart, slotDuration);
        if (slotEnd > dayEnd) break;
        const timeString = formatInTimeZone(currentSlotStart, timezone, "HH:mm");
        slots.push({ start: currentSlotStart, end: slotEnd, timeString });
        currentSlotStart = addMinutes(currentSlotStart, slotDuration + timeGap);
    }
    return slots;
}

function filterSlotsByMinimumNotice(slots, now, minimumNotice, timezone) {
    const nowDateStr = formatInTimeZone(now, timezone, "yyyy-MM-dd");
    const nowTimeStr = formatInTimeZone(now, timezone, "HH:mm:ss");
    const dateTimeStr = `${nowDateStr}T${nowTimeStr}`;
    const nowLocal = parseISO(dateTimeStr);
    const nowInTimezone = fromZonedTime(nowLocal, timezone);
    const cutoffTime = addMinutes(nowInTimezone, minimumNotice);
    console.log("Min Notice Config:", {
        now: now.toISOString(),
        nowDateStr, nowTimeStr, dateTimeStr,
        nowLocal: nowLocal.toISOString(),
        nowInTimezone: nowInTimezone.toISOString(),
        cutoffTime: cutoffTime.toISOString()
    });
    return slots.filter((slot) => {
        console.log(`Slot ${slot.timeString} at ${slot.start.toISOString()} >= cutoff ${cutoffTime.toISOString()}? ${slot.start >= cutoffTime}`);
        return slot.start >= cutoffTime;
    });
}

const timezone = "America/New_York";
const now = new Date("2025-01-27T15:00:00Z"); // Monday 10 AM EST
const date = parseISO("2025-01-27T05:00:00Z"); // this is dayStartUTC from preview.ts
const schedule = { isAvailable: true, startTime: "09:00", endTime: "17:00" };
let slots = generateTimeSlots(date, schedule, 60, 30, timezone);
console.log("Generated slots:", slots.length);
slots = filterSlotsByMinimumNotice(slots, now, 240, timezone);
console.log("After min notice:", slots.length, slots[0]?.timeString);
