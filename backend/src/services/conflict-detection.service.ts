import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { AppDataSource } from "../config/database.config";
import { Integration, IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { validateMicrosoftToken } from "./integration.service";
import axios from "axios";

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  score?: number; // Quality score based on user preferences
  reason?: string; // Why this slot was suggested
}

export interface ConflictEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isFlexible: boolean; // Can this event be moved?
  attendeeCount?: number;
  source: "google" | "outlook" | "local";
}

export interface Conflict {
  type: ConflictType;
  severity: "low" | "medium" | "high";
  requestedEvent: {
    title: string;
    startTime: Date;
    endTime: Date;
    duration: number; // in minutes
  };
  conflictingEvents: ConflictEvent[];
  suggestions: TimeSlot[];
  message: string; // Human-readable conflict description
}

export type ConflictType =
  | "hard_conflict" // Immovable event (meeting with others)
  | "soft_conflict" // Flexible event (personal task)
  | "partial_overlap" // Events overlap partially
  | "adjacent" // Back-to-back events (might want buffer)
  | "overbooked"; // Multiple events at same time

export interface FindSlotsOptions {
  maxSuggestions?: number;
  preferredTimeOfDay?: "morning" | "afternoon" | "evening";
  workHoursOnly?: boolean;
  bufferMinutes?: number; // Buffer time between events
  sameDayOnly?: boolean; // Only suggest slots on the same day
}

export interface UserPreferences {
  workHours: {
    start: number; // Hour (0-23)
    end: number; // Hour (0-23)
  };
  preferredTimeSlots?: Array<{
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startHour: number;
    endHour: number;
  }>;
  breakDuration?: number; // Minutes between meetings
  timezone: string;
}

export class ConflictDetectionService {
  private calendar: any;
  private microsoftGraphBaseUrl = "https://graph.microsoft.com/v1.0";

  constructor(private oauth2Client?: OAuth2Client) {
    if (oauth2Client) {
      this.calendar = google.calendar({ version: "v3", auth: oauth2Client });
    }
  }

  /**
   * Check for calendar conflicts
   */
  async checkConflicts(
    userId: string,
    startTime: Date,
    endTime: Date,
    options?: {
      title?: string;
      calendarId?: string;
      includeAllCalendars?: boolean;
    }
  ): Promise<Conflict | null> {
    try {
      // Get user's calendar events
      const events = await this.getCalendarEvents(
        userId,
        startTime,
        endTime,
        options?.includeAllCalendars
      );

      // Check for overlaps
      const conflictingEvents = events.filter((event) =>
        this.eventsOverlap(
          { start: startTime, end: endTime },
          { start: event.startTime, end: event.endTime }
        )
      );

      if (conflictingEvents.length === 0) {
        return null; // No conflicts
      }

      // Determine conflict type and severity
      const conflictType = this.determineConflictType(conflictingEvents);
      const severity = this.calculateConflictSeverity(conflictingEvents);

      // Find alternative time slots
      const suggestions = await this.findAlternativeSlots(
        userId,
        Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
        startTime,
        {
          maxSuggestions: 5,
          workHoursOnly: true,
        }
      );

      // Generate human-readable message
      const message = this.generateConflictMessage(
        options?.title || "This event",
        conflictingEvents
      );

      return {
        type: conflictType,
        severity,
        requestedEvent: {
          title: options?.title || "New Event",
          startTime,
          endTime,
          duration: Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
        },
        conflictingEvents,
        suggestions,
        message,
      };
    } catch (error) {
      console.error("Error checking conflicts:", error);
      throw new Error("Failed to check calendar conflicts");
    }
  }

  /**
   * Get calendar events for a user
   */
  private async getCalendarEvents(
    userId: string,
    startTime: Date,
    endTime: Date,
    includeAllCalendars: boolean = true
  ): Promise<ConflictEvent[]> {
    const allEvents: ConflictEvent[] = [];

    // Get user's integrations
    const integrations = await AppDataSource.getRepository(Integration).find({
      where: { userId },
    });

    // Get Google Calendar events
    const googleIntegration = integrations.find(
      (i) => i.appType === IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR
    );

    if (googleIntegration && this.calendar) {
      try {
        const response = await this.calendar.events.list({
          calendarId: "primary",
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
        });

        const googleEvents = (response.data.items || []).map((event: any) => ({
          id: event.id,
          title: event.summary || "Untitled",
          startTime: new Date(event.start?.dateTime || event.start?.date),
          endTime: new Date(event.end?.dateTime || event.end?.date),
          isFlexible: this.isEventFlexible(event),
          attendeeCount: event.attendees?.length || 0,
          source: "google" as const,
        }));

        allEvents.push(...googleEvents);
      } catch (error) {
        console.error("Error fetching Google Calendar events:", error);
      }
    }

    // Get Outlook Calendar events
    const outlookIntegration = integrations.find(
      (i) => i.appType === IntegrationAppTypeEnum.OUTLOOK_CALENDAR
    );

    if (outlookIntegration) {
      try {
        const outlookEvents = await this.getOutlookCalendarEvents(
          outlookIntegration,
          startTime,
          endTime
        );
        allEvents.push(...outlookEvents);
      } catch (error) {
        console.error("Error fetching Outlook Calendar events:", error);
      }
    }

    return allEvents;
  }

  /**
   * Get Outlook calendar events via Microsoft Graph API
   */
  private async getOutlookCalendarEvents(
    integration: Integration,
    startTime: Date,
    endTime: Date
  ): Promise<ConflictEvent[]> {
    // Validate and refresh token if needed
    const validatedIntegration = await validateMicrosoftToken(integration);

    const response = await axios.get(`${this.microsoftGraphBaseUrl}/me/calendar/calendarView`, {
      headers: {
        Authorization: `Bearer ${validatedIntegration.accessToken}`,
      },
      params: {
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString(),
      },
    });

    return response.data.value.map((event: any) => ({
      id: event.id,
      title: event.subject || "Untitled",
      startTime: new Date(event.start.dateTime),
      endTime: new Date(event.end.dateTime),
      isFlexible: event.isReminderOn && !event.attendees?.length,
      attendeeCount: event.attendees?.length || 0,
      source: "outlook" as const,
    }));
  }

  /**
   * Check if two time ranges overlap
   */
  private eventsOverlap(
    event1: { start: Date; end: Date },
    event2: { start: Date; end: Date }
  ): boolean {
    return event1.start < event2.end && event1.end > event2.start;
  }

  /**
   * Determine if an event is flexible (can be moved)
   */
  private isEventFlexible(event: any): boolean {
    // Events with multiple attendees are less flexible
    if (event.attendees && event.attendees.length > 1) {
      return false;
    }

    // All-day events are more flexible
    if (event.start?.date && !event.start?.dateTime) {
      return true;
    }

    // Events marked as "busy" are less flexible
    if (event.transparency === "opaque") {
      return false;
    }

    // Default: assume flexible if it's a personal event
    return true;
  }

  /**
   * Determine conflict type based on conflicting events
   */
  private determineConflictType(events: ConflictEvent[]): ConflictType {
    // Check if any event has multiple attendees (hard conflict)
    const hasMultipleAttendees = events.some((e) => (e.attendeeCount || 0) > 1);
    if (hasMultipleAttendees) {
      return "hard_conflict";
    }

    // Check if events are flexible
    const allFlexible = events.every((e) => e.isFlexible);
    if (allFlexible) {
      return "soft_conflict";
    }

    // Check if multiple events overlap
    if (events.length > 1) {
      return "overbooked";
    }

    return "partial_overlap";
  }

  /**
   * Calculate conflict severity
   */
  private calculateConflictSeverity(events: ConflictEvent[]): "low" | "medium" | "high" {
    let score = 0;

    // More conflicts = higher severity
    score += events.length * 2;

    // Non-flexible events increase severity
    score += events.filter((e) => !e.isFlexible).length * 3;

    // Events with attendees increase severity
    score += events.reduce((sum, e) => sum + (e.attendeeCount || 0), 0);

    if (score >= 10) return "high";
    if (score >= 5) return "medium";
    return "low";
  }

  /**
   * Generate human-readable conflict message
   */
  private generateConflictMessage(eventTitle: string, conflicts: ConflictEvent[]): string {
    if (conflicts.length === 1) {
      const conflict = conflicts[0];
      return `${eventTitle} conflicts with "${conflict.title}" scheduled at ${this.formatTime(
        conflict.startTime
      )}.`;
    }

    return `${eventTitle} conflicts with ${conflicts.length} existing events: ${conflicts
      .map((c) => `"${c.title}"`)
      .join(", ")}.`;
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
    const {
      maxSuggestions = 5,
      workHoursOnly = true,
      bufferMinutes = 15,
      sameDayOnly = false,
    } = options;

    // Get user preferences (default to 9-5)
    const preferences: UserPreferences = {
      workHours: { start: 9, end: 17 },
      timezone: "UTC",
      breakDuration: bufferMinutes,
    };

    // Determine date range
    const startDate = sameDayOnly ? new Date(preferredDate) : new Date(preferredDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = sameDayOnly
      ? new Date(preferredDate)
      : new Date(preferredDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);

    // Get all events in date range
    const events = await this.getCalendarEvents(userId, startDate, endDate);

    // Generate potential slots
    const potentialSlots = this.generateTimeSlots(
      startDate,
      endDate,
      durationMinutes,
      preferences,
      workHoursOnly
    );

    // Filter out conflicting slots
    const availableSlots = potentialSlots.filter((slot) => {
      // Check if slot conflicts with any existing event
      const hasConflict = events.some((event) =>
        this.eventsOverlap(
          { start: slot.startTime, end: slot.endTime },
          { start: event.startTime, end: event.endTime }
        )
      );

      return !hasConflict;
    });

    // Score and sort slots
    const scoredSlots = availableSlots.map((slot) => ({
      ...slot,
      score: this.scoreTimeSlot(slot, preferredDate, preferences, options),
    }));

    scoredSlots.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Add reasons for top suggestions
    const topSlots = scoredSlots.slice(0, maxSuggestions).map((slot) => ({
      ...slot,
      reason: this.generateSlotReason(slot, preferredDate),
    }));

    return topSlots;
  }

  /**
   * Generate potential time slots
   */
  private generateTimeSlots(
    startDate: Date,
    endDate: Date,
    durationMinutes: number,
    preferences: UserPreferences,
    workHoursOnly: boolean
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const slotInterval = 30; // Generate slots every 30 minutes

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      // Skip weekends if work hours only
      if (workHoursOnly && (date.getDay() === 0 || date.getDay() === 6)) {
        continue;
      }

      const dayStart = workHoursOnly ? preferences.workHours.start : 0;
      const dayEnd = workHoursOnly ? preferences.workHours.end : 24;

      for (let hour = dayStart; hour < dayEnd; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
          const slotStart = new Date(date);
          slotStart.setHours(hour, minute, 0, 0);

          const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

          // Check if slot end is within work hours
          if (workHoursOnly && slotEnd.getHours() > dayEnd) {
            continue;
          }

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
          });
        }
      }
    }

    return slots;
  }

  /**
   * Score a time slot based on preferences
   */
  private scoreTimeSlot(
    slot: TimeSlot,
    preferredDate: Date,
    preferences: UserPreferences,
    options: FindSlotsOptions
  ): number {
    let score = 100; // Start with base score

    // Prefer same day
    if (slot.startTime.toDateString() === preferredDate.toDateString()) {
      score += 50;
    }

    // Prefer closer dates
    const daysDiff = Math.abs(
      Math.floor(
        (slot.startTime.getTime() - preferredDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    score -= daysDiff * 5;

    // Prefer time of day if specified
    if (options.preferredTimeOfDay) {
      const hour = slot.startTime.getHours();
      if (options.preferredTimeOfDay === "morning" && hour >= 8 && hour < 12) {
        score += 20;
      } else if (options.preferredTimeOfDay === "afternoon" && hour >= 12 && hour < 17) {
        score += 20;
      } else if (options.preferredTimeOfDay === "evening" && hour >= 17 && hour < 21) {
        score += 20;
      }
    }

    // Prefer slots during typical work hours (10 AM - 4 PM)
    const hour = slot.startTime.getHours();
    if (hour >= 10 && hour < 16) {
      score += 10;
    }

    // Avoid very early or very late slots
    if (hour < 8 || hour >= 18) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Generate reason for why slot was suggested
   */
  private generateSlotReason(slot: TimeSlot, preferredDate: Date): string {
    const hour = slot.startTime.getHours();
    const sameDay = slot.startTime.toDateString() === preferredDate.toDateString();

    if (sameDay) {
      if (hour >= 8 && hour < 12) {
        return "Available this morning";
      } else if (hour >= 12 && hour < 17) {
        return "Available this afternoon";
      } else {
        return "Available later today";
      }
    }

    const tomorrow = new Date(preferredDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (slot.startTime.toDateString() === tomorrow.toDateString()) {
      return "Available tomorrow";
    }

    // Calculate days difference
    const daysDiff = Math.floor(
      (slot.startTime.getTime() - preferredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 7) {
      return `Available in ${daysDiff} days`;
    }

    return "Available soon";
  }

  /**
   * Format time for display
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  /**
   * Format time slot for display
   */
  formatTimeSlot(slot: TimeSlot): string {
    const date = slot.startTime.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const time = this.formatTime(slot.startTime);
    return `${date} at ${time}`;
  }
}

export const createConflictDetectionService = (oauth2Client?: OAuth2Client) => {
  return new ConflictDetectionService(oauth2Client);
};
