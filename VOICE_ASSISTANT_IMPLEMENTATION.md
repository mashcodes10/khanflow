# Voice Assistant Implementation

## Overview
A complete voice-to-action system that allows users to speak tasks and have them automatically created in Google Tasks and Calendar events.

## Features
- **Hold-to-talk** microphone button for voice input
- **Audio transcription** using OpenAI Whisper
- **LLM parsing** with strict JSON schema enforcement
- **Automatic task creation** in Google Tasks
- **Automatic calendar event creation** when date+time is present
- **Action preview** before confirmation
- **Undo functionality** for last action

## Architecture

### Backend Endpoints

#### 1. POST `/api/voice/transcribe`
- **Purpose**: Transcribe audio to text using OpenAI Whisper
- **Input**: Multipart form data with audio file
- **Output**: Transcript text
- **Authentication**: Required (JWT)

#### 2. POST `/api/voice/parse`
- **Purpose**: Parse transcript into structured JSON
- **Input**: 
  ```json
  {
    "transcript": "string",
    "currentDateTime": "ISO string",
    "timezone": "string"
  }
  ```
- **Output**: Parsed action with intent, task, calendar, and confidence
- **Authentication**: Required (JWT)

#### 3. POST `/api/actions/execute`
- **Purpose**: Execute parsed action (create tasks/events)
- **Input**: 
  ```json
  {
    "parsedAction": {
      "intent": "create_task | update_task | delete_task | query_tasks | clarification_required",
      "task": { ... },
      "calendar": { ... },
      "confidence": { ... }
    }
  }
  ```
- **Output**: Executed action with created IDs
- **Authentication**: Required (JWT)

#### 4. POST `/api/actions/undo`
- **Purpose**: Undo last action (delete task/event)
- **Input**: None (uses user's action history)
- **Output**: Success/failure message
- **Authentication**: Required (JWT)

### Frontend Components

#### VoiceAssistant Component
- **Location**: `meetly-app/components/voice-assistant.tsx`
- **Features**:
  - Microphone button (hold to record)
  - Audio recording using MediaRecorder API
  - Transcript display
  - Action preview card
  - Confirm/Cancel buttons
  - Undo button for last action
  - Automatic data refresh after actions

#### Integration Points
- **Dashboard**: Voice button in header
- **Tasks Page**: Voice button in header
- **Calendar Page**: Voice button in header

## LLM Parsing Schema

The LLM parser uses a strict JSON schema with the following structure:

```typescript
{
  intent: "create_task" | "update_task" | "delete_task" | "query_tasks" | "clarification_required",
  task?: {
    title: string;
    description?: string;
    due_date?: string; // ISO date "YYYY-MM-DD"
    due_time?: string; // ISO time "HH:mm:ss"
    timezone?: string;
    priority?: "high" | "normal" | "low";
    recurrence?: string;
  },
  calendar?: {
    create_event: boolean;
    event_title?: string;
    start_datetime?: string; // ISO datetime
    duration_minutes?: number;
  },
  confidence: {
    is_confident: boolean;
    missing_fields?: string[];
    clarification_question?: string;
  }
}
```

### Parsing Rules
1. **Never guess missing dates/times** - If ambiguous → `clarification_required`
2. **Time without date** → `clarification_required`
3. **Date without time** → Create task only, no calendar event
4. **Relative dates** → Convert using current datetime + timezone ("tomorrow", "next Monday", "in 2 hours")

## Time Resolution

The system handles:
- **Relative dates**: "tomorrow", "next Monday", "in 2 hours"
- **Absolute dates**: "January 15th", "2024-12-25"
- **Time zones**: Uses user's timezone or provided timezone
- **Ambiguity**: Requests clarification when date/time is unclear

## Dependencies

### Backend
- `openai`: OpenAI SDK for Whisper transcription and GPT-4 parsing
- `multer`: File upload handling
- `@types/multer`: TypeScript types for multer

### Frontend
- `MediaRecorder API`: Browser audio recording
- `@tanstack/react-query`: Data fetching and cache invalidation
- `sonner`: Toast notifications

## Environment Variables

Add to `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage Flow

1. **User clicks/holds microphone button**
   - Browser requests microphone permission
   - MediaRecorder starts recording

2. **User releases button**
   - Recording stops
   - Audio blob is sent to `/api/voice/transcribe`
   - Transcript is displayed

3. **Transcript is parsed**
   - Sent to `/api/voice/parse`
   - LLM extracts structured data
   - Preview card shows parsed action

4. **User confirms action**
   - Sent to `/api/actions/execute`
   - Task created in Google Tasks (if applicable)
   - Calendar event created (if date+time present)
   - Success notification shown
   - Data refreshed automatically

5. **User can undo**
   - Clicks undo button
   - Last action is reverted
   - Task/event deleted from Google

## Error Handling

- **Microphone access denied**: Shows error toast
- **Transcription failure**: Shows error with details
- **Parsing failure**: Shows error message
- **Execution failure**: Shows error with rollback option
- **Clarification needed**: Shows clarification question in preview

## Security

- All endpoints require JWT authentication
- User actions are isolated by user ID
- Action history stored in-memory (per user)
- Audio files processed server-side, not stored

## Future Enhancements

- Persistent action history (database)
- Multiple undo levels
- Voice feedback/confirmation
- Support for more intents (update, delete, query)
- Integration with internal task board
- Batch operations
- Voice commands for navigation



