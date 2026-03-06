const { addMinutes, parseISO } = require("date-fns");
const { formatInTimeZone, fromZonedTime, toZonedTime } = require("date-fns-tz");

const timezone = "America/New_York";
const now = new Date("2025-01-27T15:00:00Z"); // 10 AM EST
const minimumNotice = 240;

const nowDateStr = formatInTimeZone(now, timezone, "yyyy-MM-dd");
const nowTimeStr = formatInTimeZone(now, timezone, "HH:mm:ss");
const dateTimeStr = `${nowDateStr}T${nowTimeStr}`;
const nowLocal = parseISO(dateTimeStr);
const nowInTimezone = fromZonedTime(nowLocal, timezone);
const cutoffInTimezone = addMinutes(nowInTimezone, minimumNotice);

console.log({
    now: now.toISOString(),
    nowDateStr,
    nowTimeStr,
    dateTimeStr,
    nowLocal: nowLocal.toISOString(),
    nowInTimezone: nowInTimezone.toISOString(),
    cutoffTime: cutoffInTimezone.toISOString(),
});
