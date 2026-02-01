import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConflictDetectionService,
  TimeSlot,
  ConflictEvent,
  UserPreferences,
} from '../../src/services/conflict-detection.service';

describe('ConflictDetectionService', () => {
  let service: ConflictDetectionService;

  beforeEach(() => {
    service = new ConflictDetectionService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  describe('eventsOverlap', () => {
    it('should detect overlapping events', () => {
      const event1 = {
        start: new Date('2024-01-15T14:00:00Z'),
        end: new Date('2024-01-15T15:00:00Z'),
      };
      const event2 = {
        start: new Date('2024-01-15T14:30:00Z'),
        end: new Date('2024-01-15T15:30:00Z'),
      };

      // Access private method for testing
      const overlaps = (service as any).eventsOverlap(event1, event2);
      expect(overlaps).toBe(true);
    });

    it('should detect no overlap for sequential events', () => {
      const event1 = {
        start: new Date('2024-01-15T14:00:00Z'),
        end: new Date('2024-01-15T15:00:00Z'),
      };
      const event2 = {
        start: new Date('2024-01-15T15:00:00Z'),
        end: new Date('2024-01-15T16:00:00Z'),
      };

      const overlaps = (service as any).eventsOverlap(event1, event2);
      expect(overlaps).toBe(false);
    });

    it('should detect complete overlap', () => {
      const event1 = {
        start: new Date('2024-01-15T14:00:00Z'),
        end: new Date('2024-01-15T16:00:00Z'),
      };
      const event2 = {
        start: new Date('2024-01-15T14:30:00Z'),
        end: new Date('2024-01-15T15:00:00Z'),
      };

      const overlaps = (service as any).eventsOverlap(event1, event2);
      expect(overlaps).toBe(true);
    });
  });

  describe('determineConflictType', () => {
    it('should identify hard conflict with multiple attendees', () => {
      const events: ConflictEvent[] = [
        {
          id: 'event-1',
          title: 'Team meeting',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: false,
          attendeeCount: 5,
          source: 'google',
        },
      ];

      const type = (service as any).determineConflictType(events);
      expect(type).toBe('hard_conflict');
    });

    it('should identify soft conflict for flexible events', () => {
      const events: ConflictEvent[] = [
        {
          id: 'event-1',
          title: 'Personal task',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: true,
          attendeeCount: 0,
          source: 'google',
        },
      ];

      const type = (service as any).determineConflictType(events);
      expect(type).toBe('soft_conflict');
    });

    it('should identify overbooked for multiple events', () => {
      const events: ConflictEvent[] = [
        {
          id: 'event-1',
          title: 'Event 1',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: true,
          attendeeCount: 0,
          source: 'google',
        },
        {
          id: 'event-2',
          title: 'Event 2',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: true,
          attendeeCount: 0,
          source: 'google',
        },
      ];

      const type = (service as any).determineConflictType(events);
      expect(type).toBe('overbooked');
    });
  });

  describe('calculateConflictSeverity', () => {
    it('should calculate low severity for single flexible event', () => {
      const events: ConflictEvent[] = [
        {
          id: 'event-1',
          title: 'Personal task',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: true,
          attendeeCount: 0,
          source: 'google',
        },
      ];

      const severity = (service as any).calculateConflictSeverity(events);
      expect(severity).toBe('low');
    });

    it('should calculate high severity for multiple non-flexible events with attendees', () => {
      const events: ConflictEvent[] = [
        {
          id: 'event-1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: false,
          attendeeCount: 5,
          source: 'google',
        },
        {
          id: 'event-2',
          title: 'Meeting 2',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: false,
          attendeeCount: 3,
          source: 'google',
        },
      ];

      const severity = (service as any).calculateConflictSeverity(events);
      expect(severity).toBe('high');
    });
  });

  describe('generateTimeSlots', () => {
    it('should generate time slots for a day', () => {
      const preferences: UserPreferences = {
        workHours: { start: 9, end: 17 },
        timezone: 'UTC',
      };

      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');

      const slots = (service as any).generateTimeSlots(
        startDate,
        endDate,
        60, // 1 hour duration
        preferences,
        true // work hours only
      );

      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('startTime');
      expect(slots[0]).toHaveProperty('endTime');

      // All slots should be within work hours
      slots.forEach((slot: TimeSlot) => {
        const hour = slot.startTime.getHours();
        expect(hour).toBeGreaterThanOrEqual(9);
        expect(hour).toBeLessThan(17);
      });
    });

    it('should skip weekends when workHoursOnly is true', () => {
      const preferences: UserPreferences = {
        workHours: { start: 9, end: 17 },
        timezone: 'UTC',
      };

      // Saturday
      const startDate = new Date('2024-01-20T00:00:00Z');
      const endDate = new Date('2024-01-21T23:59:59Z'); // Sunday

      const slots = (service as any).generateTimeSlots(
        startDate,
        endDate,
        60,
        preferences,
        true
      );

      expect(slots.length).toBe(0); // No slots on weekends
    });
  });

  describe('scoreTimeSlot', () => {
    it('should give high score to same-day slots', () => {
      const preferences: UserPreferences = {
        workHours: { start: 9, end: 17 },
        timezone: 'UTC',
      };

      const preferredDate = new Date('2024-01-15T10:00:00Z');
      const slot: TimeSlot = {
        startTime: new Date('2024-01-15T14:00:00Z'),
        endTime: new Date('2024-01-15T15:00:00Z'),
      };

      const score = (service as any).scoreTimeSlot(slot, preferredDate, preferences, {});
      expect(score).toBeGreaterThan(100); // Base score + same day bonus
    });

    it('should prefer morning slots when specified', () => {
      const preferences: UserPreferences = {
        workHours: { start: 9, end: 17 },
        timezone: 'UTC',
      };

      const preferredDate = new Date('2024-01-15T10:00:00Z');
      const morningSlot: TimeSlot = {
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:00:00Z'),
      };

      const score = (service as any).scoreTimeSlot(
        morningSlot,
        preferredDate,
        preferences,
        { preferredTimeOfDay: 'morning' }
      );

      expect(score).toBeGreaterThan(100); // Gets bonus for morning preference
    });

    it('should penalize very early or late slots', () => {
      const preferences: UserPreferences = {
        workHours: { start: 9, end: 17 },
        timezone: 'UTC',
      };

      const preferredDate = new Date('2024-01-15T10:00:00Z');
      const earlySlot: TimeSlot = {
        startTime: new Date('2024-01-15T07:00:00Z'),
        endTime: new Date('2024-01-15T08:00:00Z'),
      };

      const score = (service as any).scoreTimeSlot(earlySlot, preferredDate, preferences, {});
      expect(score).toBeLessThan(100); // Gets penalty for being too early
    });
  });

  describe('generateConflictMessage', () => {
    it('should generate message for single conflict', () => {
      const conflicts: ConflictEvent[] = [
        {
          id: 'event-1',
          title: 'Team meeting',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: false,
          attendeeCount: 5,
          source: 'google',
        },
      ];

      const message = (service as any).generateConflictMessage('New meeting', conflicts);
      expect(message).toContain('New meeting');
      expect(message).toContain('Team meeting');
      expect(message).toContain('conflicts with');
    });

    it('should generate message for multiple conflicts', () => {
      const conflicts: ConflictEvent[] = [
        {
          id: 'event-1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: false,
          source: 'google',
        },
        {
          id: 'event-2',
          title: 'Meeting 2',
          startTime: new Date('2024-01-15T14:00:00Z'),
          endTime: new Date('2024-01-15T15:00:00Z'),
          isFlexible: false,
          source: 'google',
        },
      ];

      const message = (service as any).generateConflictMessage('New meeting', conflicts);
      expect(message).toContain('conflicts with 2 existing events');
      expect(message).toContain('Meeting 1');
      expect(message).toContain('Meeting 2');
    });
  });

  describe('formatTimeSlot', () => {
    it('should format time slot in readable format', () => {
      const slot: TimeSlot = {
        startTime: new Date('2024-01-15T14:00:00Z'),
        endTime: new Date('2024-01-15T15:00:00Z'),
      };

      const formatted = service.formatTimeSlot(slot);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });
});
