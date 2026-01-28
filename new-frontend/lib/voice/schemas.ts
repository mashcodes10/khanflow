import { z } from 'zod';

/**
 * Schema for a single voice action
 */
export const VoiceActionSchema = z.object({
  type: z.enum(['task', 'reminder', 'goal']),
  title: z.string().min(1).max(200),
  due_at: z.string().datetime().optional(),
  cadence: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  confidence: z.number().min(0).max(1),
});

/**
 * Schema for the extracted actions response
 */
export const ExtractedActionsResponseSchema = z.object({
  transcript: z.string(),
  actions: z.array(VoiceActionSchema).max(5),
});

/**
 * Schema for action confirmation payload
 */
export const ConfirmActionSchema = z.object({
  boardId: z.string().uuid(), // Required: always save to a local board
  intentId: z.string().uuid().optional(), // Optional: specific intent within board
  destination: z.enum(['google', 'microsoft', 'local']), // Provider sync (optional, creates additional copy)
  schedule: z.object({
    enabled: z.boolean(),
    startAt: z.string().datetime().optional(),
    durationMin: z.number().optional(),
  }),
  actions: z.array(VoiceActionSchema),
});

export type VoiceAction = z.infer<typeof VoiceActionSchema>;
export type ExtractedActionsResponse = z.infer<typeof ExtractedActionsResponseSchema>;
export type ConfirmAction = z.infer<typeof ConfirmActionSchema>;
