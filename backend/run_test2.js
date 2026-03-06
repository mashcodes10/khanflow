const { parseISO } = require("date-fns");
const { fromZonedTime } = require("date-fns-tz");

const dayStartStr = "2025-01-27T09:00:00";
const dayStartLocal = parseISO(dayStartStr);
const dayStart = fromZonedTime(dayStartLocal, "America/New_York");
const direct = fromZonedTime(dayStartStr, "America/New_York");

console.log({
    dayStartLocalStr: dayStartLocal.toString(),
    dayStartLocalISO: dayStartLocal.toISOString(),
    dayStart: dayStart.toISOString(),
    direct: direct.toISOString()
});
