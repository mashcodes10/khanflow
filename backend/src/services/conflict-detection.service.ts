import { AppDataSource } from "../config/database.config";
import { TaskConflict, ConflictType, ConflictSeverity, ConflictStatus } from "../database/entities/task-conflict.entity";
import { Integration, IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Client } from "@microsoft/microsoft-graph-client";
import { validateMicrosoftToken } from "./integration.service";

export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  score: number; // Higher score = better match
  reason?: string;
}

export interface ConflictInfo {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  requestedEvent: {
    title: string;
    startTime: Date;
    endTime: Date;
  };
  conflictingEvents: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    calendarId?: string;
    isFlexible: boolean;
    attendeeCount?: number;
    provider: string;
  }>;
  suggestions: TimeSlot[];
}

export interface FindSlotsOptions {
  maxSuggestions?: number;
  preferredTimeOfDay?: "morning" | "afternoon" | "evening";
  workHoursOnly?: boolean;
  bufferMinutes?: number;
  searchDays?: number;
}

export interface UserPreferences {
  workHours: {
    start: string; // "09:00"
    end: string; // "17:00"
  };
  timezone: string;
  preferredTimeOfDay?: "morning" | "afternoon" | "evening";
  bufferBetweenEvents?: number; // minutes
}

export class ConflictDetectionService {
  private conflictRepo = AppDataSource.getRepository(TaskConflict);
  private integrationRepo = AppDataSource.getRepository(Integration);

  /**
   * Check for calendar conflicts
   */
  async checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    options?: {
      calendarId?: string;
      taskId?: string;
      title?: string;
    }
  ): Promise<ConflictInfo | null> {
    // Get user's calendar integrations
    const integrations = await this.integrationRepo.find({
      where: { userId, isConnected: true },
    });

    const calendarIntegrations = integrations.filter(
      (i) =>
        i.app_type === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR ||
        i.app_type === IntegrationAppTypeEnum.OUTLOOK_CALENDAR
    );

    if (calendarIntegrations.length === 0) {
      return null; // No calendar integrations, no conflicts possible
    }

    // Get events from all calendars
    const allEvents: Array<{
      id: string;
      title: string;
      startTime: Date;
      endTime: Date;
      calendarId?: string;
      attendeeCount?: number;
      provider: string;
    }> = [];

    for (const integration of calendarIntegrations) {
      try {
        if (integration.app_type === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR) {
          const googleEvents = await this.getGoogleCalendarEvents(
            integration,
            startTime,
            endTime
          );
          allEvents.push(...googleEvents);
        } else if (integration.app_type === IntegrationAppTypeEnum.OUTLOOK_CALENDAR) {
          const outlookEvents = await this.getOutlookCalendarEvents(
            integration,
            startTime,
            endTime
          );
          allEvents.push(...outlookEvents);
        }
      } catch (error) {
        console.error(`Error fetching events from ${integration.app_type}:`, error);
        // Continue with other integrations
      }
    }

    // Find overlapping events
    const conflictingEvents = allEvents.filter((event) => {
      return this.hasTimeOverlap(
        startTime,
        endTime,
        new Date(event.startTime),
        new Date(event.endTime)
      );
    });

    if (conflictingEvents.length === 0) {
      return null; // No conflicts
    }

    // Determine conflict type and severity
    const conflictType = this.determineConflictType(
      startTime,
      endTime,
      conflictingEvents[0].startTime,
      conflictingEvents[0].endTime
    );

    const severity = this.analyzeConflictSeverity(conflictingEvents);

    // Generate alternative time slots
    const preferences = await this.getUserPreferences(userId);
    const suggestions = await this.findAlternativeSlots(
      userId,
      Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)), // duration in minutes
      startTime,
      {
        maxSuggestions: 5,
        workHoursOnly: true,
        bufferMinutes: preferences.bufferBetweenEvents || 15,
        searchDays: 7,
      }
    );

    // Create conflict record
    const conflict = this.conflictRepo.create({
      userId,
      taskId: options?.taskId || "temp_" + Date.now(),
      conflictingEventId: conflictingEvents[0].id,
      conflictType,
      severity,
      status: "pending",
      conflictDetails: {
        requestedStartTime: startTime.toISOString(),
        requestedEndTime: endTime.toISOString(),
        existingStartTime: conflictingEvents[0].startTime.toISOString(),
        existingEndTime: conflictingEvents[0].endTime.toISOString(),
        requestedTitle: options?.title || "New task",
        existingTitle: conflictingEvents[0].title,
        overlapDurationMinutes: this.calculateOverlapMinutes(
          startTime,
          endTime,
          new Date(conflictingEvents[0].startTime),
          new Date(conflictingEvents[0].endTime)
        ),
      },
    });

    await this.conflictRepo.save(conflict);

    return {
      id: conflict.id,
      type: conflictType,
      severity,
      requestedEvent: {
        title: options?.title || "New task",
        startTime,
        endTime,
      },
      conflictingEvents: conflictingEvents.map((e) => ({
        ...e,
        isFlexible: e.attendeeCount ? e.attendeeCount <= 1 : true,
      })),
      suggestions,
    };
  }

  /**
   * Find alternative time slots
   */
  async findAlternativeSlots(
    userId: string,
    durationMinutes: number,
    preferredDate: Date,
    options: FindSlotsOptions = {}
  ): Promise<TimeSlot[]> {
    const maxSuggestions = options.maxSuggestions || 5;
    const searchDays = options.searchDays || 7;
    const bufferMinutes = options.bufferMinutes || 15;

    // Get user preferences
    const preferences = await this.getUserPreferences(userId);

    // Get all events in the search range
    const endDate = new Date(preferredDate);
    endDate.setDate(endDate.getDate() + searchDays);

    const integrations = await this.integrationRepo.find({
      where: { userId, isConnected: true },
    });

    const calendarIntegrations = integrations.filter(
      (i) =>
        i.app_type === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR ||
        i.app_type === IntegrationAppTypeEnum.OUTLOOK_CALENDAR
    );

    // Get all events
    const allEvents: Array<{
      startTime: Date;
      endTime: Date;
    }> = [];

    for (const integration of calendarIntegrations) {
      try {
        if (integration.app_type === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR) {
          const events = await this.getGoogleCalendarEvents(integration, preferredDate, endDate);
          allEvents.push(...events.map((e) => ({ startTime: e.startTime, endTime: e.endTime })));
        } else if (integration.app_type === IntegrationAppTypeEnum.OUTLOOK_CALENDAR) {
          const events = await this.getOutlookCalendarEvents(integration, preferredDate, endDate);
          allEvents.push(...events.map((e) => ({ startTime: e.startTime, endTime: e.endTime })));
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    }

    // Sort events by start time
    allEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Generate potential time slots
    const potentialSlots: TimeSlot[] = [];
    let currentDate = new Date(preferredDate);
    currentDate.setHours(0, 0, 0, 0);

    for (let day = 0; day < searchDays; day++) {
      const daySlots = this.generateDaySlots(
        currentDate,
        durationMinutes,
        preferences,
        options.workHoursOnly || false
      );

      potentialSlots.push(...daySlots);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Filter out slots that conflict with existing events
    const availableSlots = potentialSlots.filter((slot) => {
      // Add buffer time
      const slotStart = new Date(slot.startTime.getTime() - bufferMinutes * 60 * 1000);
      const slotEnd = new Date(slot.endTime.getTime() + bufferMinutes * 60 * 1000);

      // Check if slot conflicts with any event
      return !allEvents.some((event) =>
        this.hasTimeOverlap(slotStart, slotEnd, new Date(event.startTime), new Date(event.endTime))
      );
    });

    // Score and sort slots
    const scoredSlots = availableSlots.map((slot) => ({
      ...slot,
      score: this.calculateSlotScore(slot, preferredDate, preferences, options),
    }));

    scoredSlots.sort((a, b) => b.score - a.score);

    return scoredSlots.slice(0, maxSuggestions);
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: {
      resolutionType: "reschedule" | "cancel" | "ignore" | "auto_adjust";
      newStartTime?: Date;
      newEndTime?: Date;
      alternativeSlotId?: string;
      userChoice?: string;
    }
  ): Promise<void> {
    const resolutionData: any = {
      status: "resolved" as const,
      resolved_at: new Date(),
    };

    // Only include resolution field if there's data
    if (Object.keys(resolution).length > 0) {
      resolutionData.resolution = {
        resolutionType: resolution.resolutionType,
        newStartTime: resolution.newStartTime?.toISOString(),
        newEndTime: resolution.newEndTime?.toISOString(),
        alternativeSlotId: resolution.alternativeSlotId,
        userChoice: resolution.userChoice,
      };
    }

    await this.conflictRepo.update(conflictId, resolutionData);
  }

  /**
   * Get Google Calendar events
   */
  private async getGoogleCalendarEvents(
    integration: Integration,
    startTime: Date,
    endTime: Date
  ): Promise<
    Array<{
      id: string;
      title: string;
      startTime: Date;
      endTime: Date;
      calendarId?: string;
      attendeeCount?: number;
      provider: string;
    }>
  > {
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    return (response.data.items || []).map((event) => ({
      id: event.id || "",
      title: event.summary || "Untitled",
      startTime: new Date(event.start?.dateTime || event.start?.date || ""),
      endTime: new Date(event.end?.dateTime || event.end?.date || ""),
      calendarId: "primary",
      attendeeCount: event.attendees?.length || 0,
      provider: "google",
    }));
  }

  /**
   * Get Outlook Calendar events
   */
  private async getOutlookCalendarEvents(
    integration: Integration,
    startTime: Date,
    endTime: Date
  ): Promise<
    Array<{
      id: string;
      title: string;
      startTime: Date;
      endTime: Date;
      attendeeCount?: number;
      provider: string;
    }>
  > {
    await validateMicrosoftToken(integration.access_token, integration.refresh_token, integration.expiry_date);

    const client = Client.init({
      authProvider: (done: any) => {
        done(null, integration.access_token);
      },
    });

    const events = await client
      .api("/me/calendar/events")
      .filter(
        `start/dateTime ge '${startTime.toISOString()}' and end/dateTime le '${endTime.toISOString()}'`
      )
      .select("id,subject,start,end,attendees")
      .get();

    return events.value.map((event: any) => ({
      id: event.id,
      title: event.subject || "Untitled",
      startTime: new Date(event.start.dateTime),
      endTime: new Date(event.end.dateTime),
      attendeeCount: event.attendees?.length || 0,
      provider: "microsoft",
    }));
  }

  /**
   * Check if two time ranges overlap
   */
  private hasTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): ConflictType {
    // Check if they're adjacent (within 5 minutes)
    const timeDiff = Math.abs(end1.getTime() - start2.getTime());
    if (timeDiff <= 5 * 60 * 1000) {
      return "adjacent";
    }

    // Full overlap
    if (start1 >= start2 && end1 <= end2) {
      return "double_booking";
    }

    // Partial overlap
    return "partial_overlap";
  }

  /**
   * Analyze conflict severity
   */
  analyzeConflictSeverity(
    events: Array<{ attendeeCount?: number }>
  ): ConflictSeverity {
    // High severity if event has multiple attendees (meeting)
    const hasMultipleAttendees = events.some((e) => (e.attendeeCount || 0) > 1);
    if (hasMultipleAttendees) {
      return "high";
    }

    // Medium severity if single attendee (1:1 or personal with someone)
    const hasSingleAttendee = events.some((e) => e.attendeeCount === 1);
    if (hasSingleAttendee) {
      return "medium";
    }

    // Low severity (personal task/event)
    return "low";
  }

  /**
   * Calculate overlap duration in minutes
   */
  private calculateOverlapMinutes(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): number {
    const overlapStart = start1 > start2 ? start1 : start2;
    const overlapEnd = end1 < end2 ? end1 : end2;

    if (overlapStart >= overlapEnd) {
      return 0;
    }

    return Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));
  }

  /**
   * Generate time slots for a day
   */
  private generateDaySlots(
    date: Date,
    durationMinutes: number,
    preferences: UserPreferences,
    workHoursOnly: boolean
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    let startHour = 0;
    let endHour = 24;

    if (workHoursOnly) {
      startHour = parseInt(preferences.workHours.start.split(":")[0]);
      endHour = parseInt(preferences.workHours.end.split(":")[0]);
    }

    // Generate slots every 30 minutes
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

        // Don't create slots that go past work hours
        if (workHoursOnly && slotEnd.getHours() > endHour) {
          continue;
        }

        // Don't create slots in the past
        if (slotStart < new Date()) {
          continue;
        }

        slots.push({
          id: `${slotStart.toISOString()}_${slotEnd.toISOString()}`,
          startTime: slotStart,
          endTime: slotEnd,
          score: 0, // Will be calculated later
        });
      }
    }

    return slots;
  }

  /**
   * Calculate slot score
   */
  private calculateSlotScore(
    slot: TimeSlot,
    preferredDate: Date,
    preferences: UserPreferences,
    options: FindSlotsOptions
  ): number {
    let score = 100;

    // Prefer same day
    if (this.isSameDay(slot.startTime, preferredDate)) {
      score += 50;
    } else {
      // Penalize days further out
      const daysDiff = Math.floor(
        (slot.startTime.getTime() - preferredDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      score -= daysDiff * 5;
    }

    // Prefer time of day based on preferences or options
    const preferredTimeOfDay = options.preferredTimeOfDay || preferences.preferredTimeOfDay;
    if (preferredTimeOfDay) {
      const hour = slot.startTime.getHours();
      if (preferredTimeOfDay === "morning" && hour >= 9 && hour < 12) {
        score += 20;
      } else if (preferredTimeOfDay === "afternoon" && hour >= 12 && hour < 17) {
        score += 20;
      } else if (preferredTimeOfDay === "evening" && hour >= 17 && hour < 21) {
        score += 20;
      }
    }

    // Penalize early morning or late evening
    const hour = slot.startTime.getHours();
    if (hour < 8 || hour > 20) {
      score -= 30;
    }

    // Prefer slots at common meeting times (on the hour or half hour)
    if (slot.startTime.getMinutes() === 0) {
      score += 5;
    }

    return score;
  }

  /**
   * Check if two dates are on the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Get user preferences (placeholder - should fetch from user settings)
   */
  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    // TODO: Fetch from user settings table
    return {
      workHours: {
        start: "09:00",
        end: "17:00",
      },
      timezone: "America/New_York",
      preferredTimeOfDay: "morning",
      bufferBetweenEvents: 15,
    };
  }
}
