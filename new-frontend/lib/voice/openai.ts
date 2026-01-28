import OpenAI from 'openai';
import { VoiceActionSchema, ExtractedActionsResponseSchema, type ExtractedActionsResponse } from './schemas';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

/**
 * Transcribes audio to text using OpenAI Whisper
 * @param audioFile Audio file (File object or Buffer with mimeType)
 * @param mimeType MIME type of the audio file (required if audioFile is Buffer)
 * @returns Transcript string
 */
export async function transcribeAudio(
  audioFile: File | Buffer,
  mimeType?: string
): Promise<string> {
  let file: File;
  let fileMimeType: string;

  // If we already have a File object, normalize it before sending to OpenAI
  if (audioFile instanceof File) {
    fileMimeType = audioFile.type;
    
    // Normalize MIME type - OpenAI prefers simple types without codecs
    let normalizedMimeType = 'audio/webm';
    let filename = 'audio.webm';
    
    if (fileMimeType.includes('webm')) {
      normalizedMimeType = 'audio/webm';
      filename = 'audio.webm';
    } else if (fileMimeType.includes('wav')) {
      normalizedMimeType = 'audio/wav';
      filename = 'audio.wav';
    } else if (fileMimeType.includes('m4a') || fileMimeType.includes('x-m4a')) {
      normalizedMimeType = 'audio/m4a';
      filename = 'audio.m4a';
    } else if (fileMimeType.includes('mp3')) {
      normalizedMimeType = 'audio/mpeg';
      filename = 'audio.mp3';
    } else if (fileMimeType.includes('mp4')) {
      normalizedMimeType = 'audio/mp4';
      filename = 'audio.mp4';
    }
    
    // Read the file as ArrayBuffer and create a new normalized File
    // This ensures we have a clean file with a simple MIME type
    const arrayBuffer = await audioFile.arrayBuffer();
    
    const FileConstructor = (globalThis as any).File as new (
      parts: (string | Blob | ArrayBuffer | ArrayBufferView)[],
      filename: string,
      options?: { type?: string; lastModified?: number }
    ) => File;
    
    file = new FileConstructor([arrayBuffer], filename, {
      type: normalizedMimeType,
      lastModified: Date.now(),
    });
  } else {
    // If we have a Buffer, create a File object from it
    if (!mimeType) {
      throw new Error('mimeType is required when audioFile is a Buffer');
    }

    fileMimeType = mimeType;
    
    // Determine file extension and filename from mime type
    let filename = 'audio.webm';
    let openaiMimeType = 'audio/webm';
    
    if (mimeType.includes('wav')) {
      filename = 'audio.wav';
      openaiMimeType = 'audio/wav';
    } else if (mimeType.includes('m4a') || mimeType.includes('x-m4a')) {
      filename = 'audio.m4a';
      openaiMimeType = 'audio/m4a';
    } else if (mimeType.includes('mp3')) {
      filename = 'audio.mp3';
      openaiMimeType = 'audio/mpeg';
    } else if (mimeType.includes('mp4')) {
      filename = 'audio.mp4';
      openaiMimeType = 'audio/mp4';
    } else if (mimeType.includes('webm')) {
      filename = 'audio.webm';
      openaiMimeType = 'audio/webm';
    }

    // Use File constructor from globalThis (available in Node.js 18+)
    const FileConstructor = (globalThis as any).File as new (
      parts: (string | Blob | ArrayBuffer | ArrayBufferView)[],
      filename: string,
      options?: { type?: string; lastModified?: number }
    ) => File;
    
    // Create File from Buffer - Buffer extends Uint8Array which is ArrayBufferView
    // File constructor accepts ArrayBufferView, so we can pass Buffer directly
    file = new FileConstructor([audioFile], filename, {
      type: openaiMimeType,
      lastModified: Date.now(),
    });
  }

  try {
    // Verify file properties before sending
    if (!file || !file.name || !file.type) {
      throw new Error('Failed to create valid File object');
    }
    
    // Special handling for very small files that might not contain meaningful audio
    if (file.size < 2000) { // Less than 2KB
      console.warn('Very small audio file detected:', {
        filename: file.name,
        size: file.size,
        type: file.type
      });
    }
    
    console.log('Sending normalized audio to OpenAI:', {
      filename: file.name,
      normalizedType: file.type,
      size: file.size,
      originalMimeType: fileMimeType,
    });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file as any,
      model: 'whisper-1',
      language: 'en',
    });

    // Handle empty transcriptions
    if (!transcription.text || transcription.text.trim().length === 0) {
      console.warn('OpenAI returned empty transcription for file:', {
        filename: file.name,
        size: file.size,
        type: file.type
      });
      return '[No speech detected]'; // Return a placeholder instead of failing
    }

    return transcription.text;
  } catch (error: any) {
    console.error('OpenAI transcription error:', error);
    // Log more details about the error
    if (error?.error) {
      console.error('OpenAI error details:', error.error);
    }
    if (error?.response) {
      console.error('OpenAI response:', error.response);
    }
    
    // Handle specific error types with user-friendly messages
    if (error?.code === 'audio_too_short' || error?.error?.code === 'audio_too_short') {
      throw new Error('Recording too short. Please speak for at least 1 second and try again.');
    }
    
    throw new Error(`Failed to transcribe audio: ${error?.message || error?.error?.message || 'Unknown error'}`);
  }
}

/**
 * Extracts structured actions from transcript using OpenAI
 * @param transcript The transcribed text
 * @param context Optional context (today's date, timezone, etc.)
 * @returns Extracted actions with transcript
 */
export async function extractActions(
  transcript: string,
  context?: { today?: string; timezone?: string }
): Promise<ExtractedActionsResponse> {
  const today = context?.today || new Date().toISOString().split('T')[0];
  const timezone = context?.timezone || 'UTC';

  const systemPrompt = `You are a voice assistant that extracts structured actions from user speech. 
Extract tasks, reminders, and goals from the transcript. Return ONLY valid JSON matching this schema:
{
  "transcript": "the original transcript",
  "actions": [
    {
      "type": "task" | "reminder" | "goal",
      "title": "short descriptive title (1-200 chars)",
      "due_at": "ISO 8601 datetime string (optional, only if explicitly mentioned)",
      "cadence": "recurrence pattern if mentioned (optional)",
      "priority": "low" | "medium" | "high" (optional, infer from urgency)",
      "confidence": 0.0-1.0
    }
  ]
}

Rules:
- Maximum 5 actions
- Do NOT hallucinate dates - only use dates explicitly mentioned
- For relative dates like "tomorrow", "next week", calculate using today: ${today} and timezone: ${timezone}
- If no date is mentioned, omit due_at
- due_at MUST be a valid ISO 8601 datetime string (e.g., "2024-01-15T14:30:00Z" or "2024-01-15T14:30:00.000Z")
- If you're unsure about a date format, omit due_at rather than guessing
- Confidence should reflect how certain you are about the extraction
- Return valid JSON only, no markdown, no code blocks`;

  const userPrompt = `Extract actions from this transcript:\n\n${transcript}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Small/cheap chat model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more deterministic output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Pre-process: Clean invalid datetime strings
    if (parsed.actions && Array.isArray(parsed.actions)) {
      parsed.actions = parsed.actions.map((action: any) => {
        if (action.due_at) {
          // Try to validate the datetime string
          try {
            const date = new Date(action.due_at);
            // Check if it's a valid date and can be converted to ISO string
            if (isNaN(date.getTime())) {
              // Invalid date, remove due_at
              console.warn('Removing invalid due_at:', action.due_at);
              delete action.due_at;
            } else {
              // Ensure it's in ISO 8601 format
              action.due_at = date.toISOString();
            }
          } catch (e) {
            // Invalid datetime format, remove it
            console.warn('Removing invalid due_at:', action.due_at);
            delete action.due_at;
          }
        }
        return action;
      });
    }

    // Validate with Zod
    let validated = ExtractedActionsResponseSchema.safeParse(parsed);

    // If validation fails, attempt one repair
    if (!validated.success) {
      console.warn('Initial validation failed, attempting repair:', validated.error);
      
      const repairPrompt = `The previous response failed validation. Fix it to match this exact schema:
{
  "transcript": string,
  "actions": Array<{
    "type": "task" | "reminder" | "goal",
    "title": string (1-200 chars),
    "due_at"?: ISO 8601 datetime string (MUST be valid format like "2024-01-15T14:30:00Z"),
    "cadence"?: string,
    "priority"?: "low" | "medium" | "high",
    "confidence": number (0-1)
  }> (max 5 items)
}

IMPORTANT: If due_at is invalid or you're unsure, OMIT it entirely (don't include the field).

Validation errors: ${JSON.stringify(validated.error.errors)}

Original transcript: ${transcript}
Original response: ${content}

Return ONLY valid JSON matching the schema exactly.`;

      const repairResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: repairPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Even lower temperature for repair
      });

      const repairContent = repairResponse.choices[0]?.message?.content;
      if (!repairContent) {
        throw new Error('No repair response from OpenAI');
      }

      try {
        parsed = JSON.parse(repairContent);
      } catch (parseError) {
        throw new Error('Invalid JSON in repair response');
      }

      // Pre-process repair response: Clean invalid datetime strings
      if (parsed.actions && Array.isArray(parsed.actions)) {
        parsed.actions = parsed.actions.map((action: any) => {
          if (action.due_at) {
            // Try to validate the datetime string
            try {
              const date = new Date(action.due_at);
              // Check if it's a valid date and can be converted to ISO string
              if (isNaN(date.getTime())) {
                // Invalid date, remove due_at
                console.warn('Removing invalid due_at from repair:', action.due_at);
                delete action.due_at;
              } else {
                // Ensure it's in ISO 8601 format
                action.due_at = date.toISOString();
              }
            } catch (e) {
              // Invalid datetime format, remove it
              console.warn('Removing invalid due_at from repair:', action.due_at);
              delete action.due_at;
            }
          }
          return action;
        });
      }

      validated = ExtractedActionsResponseSchema.safeParse(parsed);
    }

    // If still invalid after repair, fail gracefully
    if (!validated.success) {
      console.error('Validation failed after repair:', validated.error);
      throw new Error(`Failed to extract valid actions: ${validated.error.message}`);
    }

    return validated.data;
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract actions from transcript');
  }
}
