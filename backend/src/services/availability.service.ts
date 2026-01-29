import { AvailabilityResponseType } from "../@types/availability.type";
import { AppDataSource } from "../config/database.config";
import { User } from "../database/entities/user.entity";
import { NotFoundException } from "../utils/app-error";
import { UpdateAvailabilityDto } from "../database/dto/availability.dto";
import { Availability } from "../database/entities/availability.entity";
import { DayOfWeekEnum } from "../database/entities/day-availability";
import { Event } from "../database/entities/event.entity";
import { MeetingStatus } from "../database/entities/meeting.entity";
import { addDays, addMinutes, format, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Integration, IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { googleOAuth2Client } from "../config/oauth.config";
import { google } from "googleapis";
import { validateGoogleToken, validateMicrosoftToken } from "./integration.service";
import { DayAvailability } from "../database/entities/day-availability";

export const getUserAvailabilityService = async (userId: string) => {
  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({
    where: { id: userId },
    relations: ["availability", "availability.days"],
  });
  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (!user.availability) {
    // create default availability 9-17 weekdays
    const availabilityRepo = AppDataSource.getRepository(Availability);
    const dayRepo = AppDataSource.getRepository(DayAvailability);

    const availability = availabilityRepo.create({
      timeGap: 30,
      days: Object.values(DayOfWeekEnum).map((day) => {
        return dayRepo.create({
          day,
          startTime: new Date(`2025-03-01T09:00:00Z`),
          endTime: new Date(`2025-03-01T17:00:00Z`),
          isAvailable: day !== DayOfWeekEnum.SUNDAY && day !== DayOfWeekEnum.SATURDAY,
        });
      }),
    });
    user.availability = availability;
    await AppDataSource.getRepository(User).save(user);
  }

  const availabilityData: AvailabilityResponseType = {
    timeGap: user.availability.timeGap,
    timezone: user.availability.timezone || 'America/New_York',
    minimumNotice: user.availability.minimumNotice || 240,
    bookingWindow: user.availability.bookingWindow || 60,
    days: [],
  };

  user.availability.days.forEach((dayAvailability) => {
    availabilityData.days.push({
      day: dayAvailability.day,
      startTime: dayAvailability.startTime.toISOString().slice(11, 16),
      endTime: dayAvailability.endTime.toISOString().slice(11, 16),
      isAvailable: dayAvailability.isAvailable,
    });
  });

  return availabilityData;
};

export const updateAvailabilityService = async (
  userId: string,
  data: UpdateAvailabilityDto
) => {
  const userRepository = AppDataSource.getRepository(User);
  const availabilityRepository = AppDataSource.getRepository(Availability);

  const user = await userRepository.findOne({
    where: { id: userId },
    relations: ["availability", "availability.days"],
  });

  if (!user) throw new NotFoundException("User not found");

  const dayAvailabilityData = data.days.map(
    ({ day, isAvailable, startTime, endTime }) => {
      const baseDate = new Date().toISOString().split("T")[0];
      return {
        day: day.toUpperCase() as DayOfWeekEnum,
        startTime: new Date(`${baseDate}T${startTime}:00Z`),
        endTime: new Date(`${baseDate}T${endTime}:00Z`),
        isAvailable,
      };
    }
  );

  if (user.availability) {
    await availabilityRepository.save({
      id: user.availability.id,
      timeGap: data.timeGap,
      timezone: data.timezone,
      minimumNotice: data.minimumNotice,
      bookingWindow: data.bookingWindow,
      days: dayAvailabilityData.map((day) => ({
        ...day,
        availability: { id: user.availability.id },
      })),
    });
  }

  return { sucess: true };
};

export const getAvailabilityForPublicEventService = async (eventId: string) => {
  console.log(`[AVAILABILITY] Starting for event ${eventId}`);
  const eventRepository = AppDataSource.getRepository(Event);

  console.log(`[AVAILABILITY] Fetching event data...`);
  const event = await eventRepository.findOne({
    where: { id: eventId, isPrivate: false },
    relations: [
      "user",
      "user.availability",
      "user.availability.days",
      "user.meetings",
      "user.meetings.event",
    ],
  });

  console.log(`[AVAILABILITY] Event found: ${event ? 'Yes' : 'No'}`);
  if (!event || !event.user.availability) return [];

  console.log(`[AVAILABILITY] Starting slot generation for ${event.title}`);
  const { availability, meetings } = event.user;

  const daysOfWeek = Object.values(DayOfWeekEnum);
  console.log(`[AVAILABILITY] Processing ${daysOfWeek.length} days of the week for next 60 days`);

  const availableDays = [];

  // Filter meetings to only those for this specific event
  const eventMeetings = meetings.filter(m => m.event.id === event.id && m.status === MeetingStatus.SCHEDULED);

  // Fetch calendar integrations (for free/busy)
  console.log(`[AVAILABILITY] Fetching calendar integrations...`);
  const integrationRepository = AppDataSource.getRepository(Integration);
  const googleIntegration = await integrationRepository.findOne({
    where: {
      user: { id: event.user.id },
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      isConnected: true,
    },
  });

  const outlookIntegration = await integrationRepository.findOne({
    where: {
      user: { id: event.user.id },
      app_type: IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
      isConnected: true,
    },
  });
  console.log(`[AVAILABILITY] Integrations fetched - Google: ${!!googleIntegration}, Outlook: ${!!outlookIntegration}`);
  if (outlookIntegration) {
    console.log(`[AVAILABILITY] Outlook metadata:`, JSON.stringify(outlookIntegration.metadata));
  }

  // Check next 30 days of availability (reduced from 60 to prevent timeout)
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const checkDate = addDays(today, dayOffset);
    const dayOfWeek = format(checkDate, 'EEEE').toUpperCase() as DayOfWeekEnum;
    
    console.log(`[AVAILABILITY] Processing ${format(checkDate, 'yyyy-MM-dd')} (${dayOfWeek})`);

    const dayAvailability = availability.days.find((d) => d.day === dayOfWeek);
    if (dayAvailability) {
      const slots = dayAvailability.isAvailable
        ? generateAvailableTimeSlots(
            dayAvailability.startTime,
            dayAvailability.endTime,
            event.duration,
            [], // Don't filter meetings here, we'll do it with busy blocks
            format(checkDate, "yyyy-MM-dd"),
            availability.timeGap
          )
        : [];
      
      if (slots.length === 0) {
        console.log(`[AVAILABILITY] ${format(checkDate, 'yyyy-MM-dd')}: 0 slots, skipping calendar check`);
        continue; // Skip calendar check if no slots generated
      }
      
      console.log(`[AVAILABILITY] ${format(checkDate, 'yyyy-MM-dd')}: Generated ${slots.length} initial slots`);

      // Collect busy blocks from all selected calendars
      const busyBlocks: { start: Date; end: Date }[] = [];
      const userTimezone = availability.timezone || 'America/New_York';
      
      // Create day boundaries in UTC for the user's date
      // Convert the user's date at midnight in their timezone to UTC
      const dayStartLocal = `${format(checkDate, "yyyy-MM-dd")}T00:00:00`;
      const dayEndLocal = `${format(checkDate, "yyyy-MM-dd")}T23:59:59`;
      const dayStart = fromZonedTime(dayStartLocal, userTimezone);
      const dayEnd = fromZonedTime(dayEndLocal, userTimezone);

      // Add booked meetings for this event as busy blocks
      eventMeetings.forEach((meeting) => {
        // Only include meetings that fall within this day
        if (meeting.startTime >= dayStart && meeting.startTime < dayEnd) {
          busyBlocks.push({
            start: meeting.startTime,
            end: meeting.endTime,
          });
        }
      });

      // Check Google Calendar if integration exists
      if (googleIntegration && slots.length) {
        const selectedIds =
          ((googleIntegration.metadata as any)?.selectedCalendarIds as
            | string[]
            | undefined);

        // If user hasn't selected specific calendars, check the primary calendar
        // Otherwise check only the selected calendars
        const calendarsToCheck = (selectedIds && selectedIds.length > 0) ? selectedIds : ["primary"];
        
        try {
          console.log(`Checking Google Calendar for ${calendarsToCheck.length} calendars`);
          const { calendar } = await getGoogleCalendarClient(googleIntegration);

          const fbPromise = calendar.freebusy.query({
            requestBody: {
              timeMin: dayStart.toISOString(),
              timeMax: dayEnd.toISOString(),
              items: calendarsToCheck.map((id) => ({ id })),
            },
          });

          // Add 10 second timeout
          const fb = await Promise.race([
            fbPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Google Calendar API timeout')), 10000)
            )
          ]);

          Object.values((fb as any).data.calendars ?? {}).forEach((c: any) => {
            c.busy?.forEach((b: any) => {
              busyBlocks.push({ start: new Date(b.start!), end: new Date(b.end!) });
            });
          });
          console.log(`Google Calendar check complete, found ${busyBlocks.length} busy blocks`);
        } catch (error) {
          console.error("Error checking Google Calendar:", error);
          // Continue with other calendars even if one fails
        }
      }

      // Check Outlook Calendar if integration exists
      if (outlookIntegration && slots.length) {
        try {
          const validToken = await validateMicrosoftToken(
            outlookIntegration.access_token,
            outlookIntegration.refresh_token ?? "",
            outlookIntegration.expiry_date
          );

          const selectedIds =
            ((outlookIntegration.metadata as any)?.selectedCalendarIds as
              | string[]
              | undefined);

          // If user hasn't selected specific calendars, check the primary calendar
          // Otherwise check only the selected calendars
          if (!selectedIds || selectedIds.length === 0) {
            console.log(`Checking Outlook primary calendar (no specific calendars selected)`);
            try {
              const fetchPromise = fetch(
                `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${dayStart.toISOString()}&endDateTime=${dayEnd.toISOString()}&$select=start,end,isAllDay`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${validToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              // Add 10 second timeout
              const calendarViewResponse = await Promise.race([
                fetchPromise,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Outlook Calendar API timeout')), 10000)
                )
              ]) as Response;

              console.log(`[AVAILABILITY] Outlook API response status: ${calendarViewResponse.status}`);
              
              if (calendarViewResponse.ok) {
                const calendarViewData = await calendarViewResponse.json();
                console.log(`[AVAILABILITY] Outlook API returned ${calendarViewData.value?.length || 0} events`);
                calendarViewData.value?.forEach((event: any) => {
                  if (!event.isAllDay) {
                    busyBlocks.push({
                      start: new Date(event.start.dateTime),
                      end: new Date(event.end.dateTime),
                    });
                  }
                });
              } else {
                const errorText = await calendarViewResponse.text();
                console.error(`[AVAILABILITY] Outlook API error response:`, errorText);
              }
            } catch (calendarError) {
              console.error(`Error checking Outlook primary calendar:`, calendarError);
            }
            console.log(`Outlook Calendar check complete - found ${busyBlocks.length} busy blocks total`);
          } else {
            console.log(`Checking Outlook Calendar for ${selectedIds.length} calendars`);
            // Check each selected calendar individually
            for (const calendarId of selectedIds) {
              try {
                const fetchPromise = fetch(
                  `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/calendarView?startDateTime=${dayStart.toISOString()}&endDateTime=${dayEnd.toISOString()}&$select=start,end,isAllDay`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${validToken}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                // Add 10 second timeout
                const calendarViewResponse = await Promise.race([
                  fetchPromise,
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Outlook Calendar API timeout')), 10000)
                  )
                ]) as Response;

                if (calendarViewResponse.ok) {
                  const calendarViewData = await calendarViewResponse.json();
                  calendarViewData.value?.forEach((event: any) => {
                    if (!event.isAllDay) {
                      busyBlocks.push({
                        start: new Date(event.start.dateTime),
                        end: new Date(event.end.dateTime),
                      });
                    }
                  });
                }
              } catch (calendarError) {
                console.error(`Error checking Outlook calendar ${calendarId}:`, calendarError);
                // Continue with other calendars even if one fails
              }
            }
            console.log(`Outlook Calendar check complete - found ${busyBlocks.length} busy blocks total`);
          }
        } catch (error) {
          console.error("Error checking Outlook Calendar:", error);
          // Continue with other calendars even if one fails
        }
      }

      console.log(`[AVAILABILITY] Total busy blocks for ${dayOfWeek}: ${busyBlocks.length}`);
      if (busyBlocks.length > 0) {
        console.log(`[AVAILABILITY] Busy blocks:`, JSON.stringify(busyBlocks.map(b => ({ start: b.start.toISOString(), end: b.end.toISOString() }))));
      }

      // Filter slots based on all busy blocks (with buffer time)
      const filteredSlots = slots.filter((time) => {
        // Create slot datetime in the user's timezone, then convert to UTC for comparison
        const slotStartLocal = `${format(checkDate, "yyyy-MM-dd")}T${time}:00`;
        const slotStart = fromZonedTime(slotStartLocal, userTimezone);
        const slotEnd = addMinutes(slotStart, event.duration);
        
        // Check minimum notice requirement
        const now = new Date();
        const minimumNoticeMinutes = availability.minimumNotice || 240; // Default 4 hours
        const earliestBookingTime = addMinutes(now, minimumNoticeMinutes);
        
        // Slot must be at least minimumNotice minutes in the future
        if (slotStart < earliestBookingTime) {
          return false;
        }
        
        // Check if slot conflicts with any busy block (including buffer time)
        return !busyBlocks.some((b) => {
          // Apply buffer time (timeGap) before and after busy blocks
          const bufferMinutes = availability.timeGap || 0;
          const blockStartWithBuffer = addMinutes(b.start, -bufferMinutes);
          const blockEndWithBuffer = addMinutes(b.end, bufferMinutes);
          
          // Check for overlap with buffer
          return slotStart < blockEndWithBuffer && slotEnd > blockStartWithBuffer;
        });
      });

      console.log(`[AVAILABILITY] ${format(checkDate, 'yyyy-MM-dd')}: ${slots.length} initial slots -> ${filteredSlots.length} after filtering`);
      
      if (filteredSlots.length > 0) {
        console.log(`[AVAILABILITY] ${format(checkDate, 'yyyy-MM-dd')}: Available slots: ${filteredSlots.join(', ')}`);
      }

      // Only add to result if there are available slots
      if (filteredSlots.length > 0) {
        availableDays.push({
          day: dayOfWeek,
          date: format(checkDate, "yyyy-MM-dd"),
          slots: filteredSlots,
          isAvailable: dayAvailability.isAvailable,
        });
      }
    }
  }

  return {
    availableDays,
    timezone: availability.timezone || 'America/New_York',
  };
};

function getNextDateForDay(dayOfWeek: string): Date {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  const today = new Date();
  const todayDay = today.getDay();

  const targetDay = days.indexOf(dayOfWeek);

  //todayDay = 1// Monday
  //dayOfWeek  = 1 Monday
  //(1 - 1) = 0
  //-3 + 7 = 4
  // 4 % 7 = 4
  //result: Monday is in 0
  const daysUntilTarget = (targetDay - todayDay + 7) % 7;

  return addDays(today, daysUntilTarget);
}

function generateAvailableTimeSlots(
  startTime: Date,
  endTime: Date,
  duration: number,
  meetings: { startTime: Date; endTime: Date }[],
  dateStr: string,
  timeGap: number = 30
) {
  const slots = [];

  // Ensure timeGap is at least the duration to prevent infinite loops
  const safeTimeGap = Math.max(timeGap || duration, duration);

  let slotStartTime = parseISO(
    `${dateStr}T${startTime.toISOString().slice(11, 16)}`
  );

  let slotEndTime = parseISO(
    `${dateStr}T${endTime.toISOString().slice(11, 16)}`
  );

  const now = new Date();

  const isToday = format(now, "yyyy-MM-dd") === dateStr;

  while (slotStartTime < slotEndTime) {
    if (!isToday || slotStartTime >= now) {
      const slotEnd = new Date(slotStartTime.getTime() + duration * 60000);

      if (isSlotAvailable(slotStartTime, slotEnd, meetings)) {
        slots.push(format(slotStartTime, "HH:mm"));
      }
    }

    slotStartTime = addMinutes(slotStartTime, safeTimeGap);
  }

  return slots;
}

function isSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  meetings: { startTime: Date; endTime: Date }[]
): boolean {
  for (const meeting of meetings) {
    if (slotStart < meeting.endTime && slotEnd > meeting.startTime) {
      return false;
    }
  }
  return true;
}

async function getGoogleCalendarClient(integration: Integration) {
  const validToken = await validateGoogleToken(
    integration.access_token,
    integration.refresh_token!,
    integration.expiry_date
  );
  googleOAuth2Client.setCredentials({ access_token: validToken });
  const calendar = google.calendar({ version: "v3", auth: googleOAuth2Client });
  return { calendar };
}
