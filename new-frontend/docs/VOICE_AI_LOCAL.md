# VoiceAI Local Backend Implementation

This document describes the local VoiceAI backend implementation for the Next.js app. The backend handles audio transcription, action extraction, and job management using OpenAI and Supabase.

## Overview

The VoiceAI backend consists of:
- **Database tables**: `voice_jobs`, `voice_actions`, `accepted_actions`
- **API routes**: Job creation, upload/processing, status checking, and confirmation
- **Services**: OpenAI transcription and extraction, Supabase database operations
- **Auth**: JWT token verification for all routes

## Prerequisites

1. **Supabase Project**: You need a Supabase project with a PostgreSQL database
2. **OpenAI API Key**: Required for transcription and action extraction
3. **JWT Secret**: Must match the backend JWT_SECRET (used for OAuth token verification)
4. **Node.js**: Version 18+ recommended

## Setup

### 1. Install Dependencies

```bash
cd new-frontend
npm install openai jsonwebtoken @supabase/supabase-js
npm install --save-dev @types/jsonwebtoken
```

### 2. Environment Variables

Create a `.env.local` file in the `new-frontend` directory with the following variables:

```env
# JWT Secret (must match backend)
JWT_SECRET=your_jwt_secret_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: 
- `JWT_SECRET` must match the secret used by your Express backend to sign JWT tokens
- `SUPABASE_SERVICE_ROLE_KEY` is a server-only key that bypasses RLS - never expose it client-side
- Get your Supabase credentials from: https://supabase.com/dashboard/project/_/settings/api
- Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Run Database Migrations

The migration file is located at `supabase/migrations/20250126000000_create_voice_ai_tables.sql`.

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20250126000000_create_voice_ai_tables.sql`
4. Paste and execute the SQL

#### Option C: Using psql

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/20250126000000_create_voice_ai_tables.sql
```

### 4. Start Next.js Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the next available port).

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### 1. Create Voice Job

**POST** `/api/voice/jobs`

Creates a new voice job in `pending` status.

**Request Body:**
```json
{
  "boardId": "uuid-optional",
  "intentId": "uuid-optional"
}
```

**Response:**
```json
{
  "jobId": "uuid"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/voice/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"boardId": "optional-board-id"}'
```

### 2. Upload and Process Audio

**POST** `/api/voice/jobs/[jobId]/upload-and-process`

Uploads an audio file and processes it (transcription + action extraction).

**Request:**
- Content-Type: `multipart/form-data`
- Form field: `audio` (File)

**File Constraints:**
- Max size: 5MB
- Max duration: ~10 seconds (enforced via file size)
- Allowed types: `audio/webm`, `audio/wav`, `audio/m4a`, `audio/mp3`, `audio/mp4`

**Response:**
```json
{
  "transcript": "User's spoken text",
  "actions": [
    {
      "type": "task",
      "title": "Buy groceries",
      "due_at": "2025-01-27T10:00:00Z",
      "priority": "medium",
      "confidence": 0.95
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/voice/jobs/JOB_ID/upload-and-process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@recording.webm"
```

### 3. Get Job Status

**GET** `/api/voice/jobs/[jobId]`

Retrieves the status and results of a voice job.

**Response:**
```json
{
  "status": "completed",
  "transcript": "User's spoken text",
  "extracted_actions": [...],
  "error_message": null,
  "created_at": "2025-01-26T10:00:00Z"
}
```

**Status Values:**
- `pending`: Job created, waiting for audio upload
- `processing`: Audio uploaded, transcription/extraction in progress
- `completed`: Successfully processed
- `failed`: Processing failed (check `error_message`)

**Example:**
```bash
curl http://localhost:3000/api/voice/jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Confirm Actions

**POST** `/api/voice/jobs/[jobId]/confirm`

Saves confirmed actions to the database.

**Request Body:**
```json
{
  "destination": "google",
  "schedule": {
    "enabled": true,
    "startAt": "2025-01-27T10:00:00Z",
    "durationMin": 30
  },
  "actions": [
    {
      "type": "task",
      "title": "Buy groceries",
      "due_at": "2025-01-27T10:00:00Z",
      "priority": "medium",
      "confidence": 0.95
    }
  ]
}
```

**Response:**
```json
{
  "success": true
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/voice/jobs/JOB_ID/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "local",
    "schedule": {"enabled": false},
    "actions": [...]
  }'
```

## Database Schema

### voice_jobs

Stores voice processing jobs.

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| status | TEXT | `pending`, `processing`, `completed`, `failed` |
| board_id | UUID | Optional foreign key to intent_boards |
| intent_id | UUID | Optional foreign key to intents |
| audio_mime | TEXT | MIME type of uploaded audio |
| audio_size | INTEGER | Size in bytes |
| transcript | TEXT | Transcribed text |
| extracted_actions | JSONB | Array of extracted actions |
| error_message | TEXT | Error message if failed |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp (auto-updated) |

### voice_actions

Audit/history table for all extracted actions.

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| voice_job_id | UUID | Foreign key to voice_jobs |
| user_id | UUID | Foreign key to users |
| type | TEXT | `task`, `reminder`, `goal` |
| title | TEXT | Action title |
| due_at | TIMESTAMPTZ | Optional due date |
| cadence | TEXT | Optional recurrence pattern |
| priority | TEXT | `low`, `medium`, `high` |
| confidence | FLOAT | Extraction confidence (0-1) |
| raw | JSONB | Full action object |
| created_at | TIMESTAMPTZ | Creation timestamp |

### accepted_actions

Stores confirmed actions that users have accepted.

| Column | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| board_id | UUID | Optional foreign key to intent_boards |
| intent_id | UUID | Optional foreign key to intents |
| source | TEXT | Source of action (default: `voice`) |
| status | TEXT | `draft` or `confirmed` |
| payload | JSONB | Full confirmation payload (destination, schedule, actions) |
| created_at | TIMESTAMPTZ | Creation timestamp |

## Common Errors

### 401 Unauthorized

**Cause**: Missing or invalid JWT token.

**Solution**:
- Ensure you're sending `Authorization: Bearer <token>` header
- Verify token is not expired
- Check that `JWT_SECRET` matches backend secret

### 400 Bad Request - File Too Large

**Cause**: Audio file exceeds 5MB limit.

**Solution**: Record shorter audio clips (aim for ~5 seconds).

### 400 Bad Request - Invalid File Type

**Cause**: Audio file is not in allowed MIME types.

**Solution**: Use `webm`, `wav`, `m4a`, `mp3`, or `mp4` format.

### 500 Internal Server Error - OpenAI API Error

**Cause**: 
- Missing or invalid `OPENAI_API_KEY`
- OpenAI API rate limit exceeded
- Network issues

**Solution**:
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI dashboard for API status
- Ensure you have sufficient API credits

### 500 Internal Server Error - Database Error

**Cause**: 
- Supabase connection issues
- Missing tables (migrations not run)
- Invalid `SUPABASE_SERVICE_ROLE_KEY`

**Solution**:
- Verify Supabase credentials
- Run database migrations
- Check Supabase dashboard for service status

### Mic Permission Denied

**Cause**: Browser blocked microphone access.

**Solution**:
- Grant microphone permissions in browser settings
- Use HTTPS in production (required for mic access)

## Testing Checklist

- [ ] Environment variables set correctly
- [ ] Database migrations run successfully
- [ ] Can create a voice job (POST /api/voice/jobs)
- [ ] Can upload and process audio (POST /api/voice/jobs/[id]/upload-and-process)
- [ ] Can get job status (GET /api/voice/jobs/[id])
- [ ] Can confirm actions (POST /api/voice/jobs/[id]/confirm)
- [ ] Error handling works (invalid token, file too large, etc.)
- [ ] Database records are created correctly
- [ ] `intent.last_activity_at` is updated on confirmation

## Architecture Notes

- **Authentication**: JWT tokens from OAuth (Google/Microsoft) are verified using the same secret as the Express backend
- **Database**: Supabase PostgreSQL with service role key (bypasses RLS)
- **AI Processing**: OpenAI Whisper for transcription, GPT-4o-mini for extraction
- **Validation**: Zod schemas ensure type safety and data integrity
- **Error Handling**: Graceful failures with detailed error messages
- **File Limits**: 5MB max size, ~10 seconds max duration (enforced via file size)

## Next Steps

1. **Production Deployment**: 
   - Set environment variables in hosting platform (Vercel, Railway, etc.)
   - Ensure Supabase connection uses SSL
   - Monitor OpenAI API usage and costs

2. **Integration with Providers**:
   - Implement Google Tasks creation (stubbed for now)
   - Implement Microsoft To Do creation (stubbed for now)
   - Add local storage/display of confirmed actions

3. **Enhancements**:
   - Add audio duration validation (currently inferred from file size)
   - Add retry logic for transient OpenAI failures
   - Add job cleanup for old/failed jobs
   - Add webhook support for async processing
