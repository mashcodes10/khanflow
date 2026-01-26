import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * AI Suggestion Payload Schema
 * This matches the structure expected by the suggestion system
 */
const AISuggestionPayloadSchema = z.object({
  title: z.string().min(1),
  reason: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']),
  recommendedActionType: z.enum(['task', 'reminder', 'plan']),
  options: z.array(
    z.object({
      label: z.string().min(1),
      type: z.enum(['task', 'reminder', 'plan']),
      details: z.record(z.any()),
      estimatedEffortMin: z.number().int().positive(),
    })
  ).min(1),
  defaultOptionIndex: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
});

type AISuggestionPayload = z.infer<typeof AISuggestionPayloadSchema>;

describe('AI Suggestion Payload Validation', () => {
  const validPayload: AISuggestionPayload = {
    title: 'Start Workout Routine',
    reason: 'This intent has been inactive for 14 days',
    priority: 'medium',
    recommendedActionType: 'task',
    options: [
      {
        label: 'Quick 10-minute workout',
        type: 'task',
        details: { taskTitle: 'Quick 10-minute workout' },
        estimatedEffortMin: 10,
      },
      {
        label: 'Full 30-minute session',
        type: 'task',
        details: { taskTitle: 'Full 30-minute workout session' },
        estimatedEffortMin: 30,
      },
    ],
    defaultOptionIndex: 0,
    confidence: 0.8,
  };

  it('should accept valid payload', () => {
    const result = AISuggestionPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validPayload);
    }
  });

  it('should reject payload with missing title', () => {
    const invalid = { ...validPayload, title: '' };
    const result = AISuggestionPayloadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject payload with invalid priority', () => {
    const invalid = { ...validPayload, priority: 'invalid' };
    const result = AISuggestionPayloadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject payload with invalid recommendedActionType', () => {
    const invalid = { ...validPayload, recommendedActionType: 'invalid' };
    const result = AISuggestionPayloadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject payload with empty options array', () => {
    const invalid = { ...validPayload, options: [] };
    const result = AISuggestionPayloadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject payload with invalid option type', () => {
    const invalid = {
      ...validPayload,
      options: [
        {
          ...validPayload.options[0],
          type: 'invalid',
        },
      ],
    };
    const result = AISuggestionPayloadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject payload with negative estimatedEffortMin', () => {
    const invalid = {
      ...validPayload,
      options: [
        {
          ...validPayload.options[0],
          estimatedEffortMin: -5,
        },
      ],
    };
    const result = AISuggestionPayloadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject payload with defaultOptionIndex out of bounds', () => {
    const invalid = {
      ...validPayload,
      defaultOptionIndex: 999, // Out of bounds
    };
    const result = AISuggestionPayloadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject payload with confidence outside [0, 1]', () => {
    const invalid1 = { ...validPayload, confidence: -0.1 };
    const invalid2 = { ...validPayload, confidence: 1.1 };

    expect(AISuggestionPayloadSchema.safeParse(invalid1).success).toBe(false);
    expect(AISuggestionPayloadSchema.safeParse(invalid2).success).toBe(false);
  });

  it('should accept payload with confidence at boundaries', () => {
    const minConfidence = { ...validPayload, confidence: 0 };
    const maxConfidence = { ...validPayload, confidence: 1 };

    expect(AISuggestionPayloadSchema.safeParse(minConfidence).success).toBe(true);
    expect(AISuggestionPayloadSchema.safeParse(maxConfidence).success).toBe(true);
  });

  it('should accept payload with multiple options', () => {
    const multiOption = {
      ...validPayload,
      options: [
        ...validPayload.options,
        {
          label: 'Extended 60-minute session',
          type: 'task' as const,
          details: { taskTitle: 'Extended workout' },
          estimatedEffortMin: 60,
        },
      ],
    };
    const result = AISuggestionPayloadSchema.safeParse(multiOption);
    expect(result.success).toBe(true);
  });

  it('should accept payload with different option types', () => {
    const mixedOptions = {
      ...validPayload,
      options: [
        {
          label: 'Create task',
          type: 'task' as const,
          details: { taskTitle: 'Task' },
          estimatedEffortMin: 10,
        },
        {
          label: 'Set reminder',
          type: 'reminder' as const,
          details: { reminderText: 'Reminder' },
          estimatedEffortMin: 5,
        },
        {
          label: 'Make plan',
          type: 'plan' as const,
          details: { planDetails: 'Plan' },
          estimatedEffortMin: 30,
        },
      ],
    };
    const result = AISuggestionPayloadSchema.safeParse(mixedOptions);
    expect(result.success).toBe(true);
  });
});
