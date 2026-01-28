# AI Suggestions System Architecture

## Overview

This document describes the complete "AI Suggestions → Accept → Provider Tasks → Calendar → Completion Feedback" system implemented for Khanflow.

## System Flow

```
User Intent Boards/Intents
    ↓
Stage A: Rules-based Candidate Selection (Deterministic)
    ↓
Stage B: AI Generation (LLM - Gemini)
    ↓
Suggestions UI (Pending/Shown)
    ↓
User Accepts → Action Sheet (Choose Option + Destination + Schedule)
    ↓
Create AcceptedAction + Provider Tasks + Calendar Events (Idempotent)
    ↓
Provider Sync (Polling/Webhooks) → Track Completion
    ↓
Update Intent last_activity_at → Feed back into future suggestions
```

## Data Model

### Core Entities

1. **Intent** (extended)
   - `lastActivityAt`: Tracks last activity from any source
   - `lastEngagedAt`: Tracks user engagement
   - Other existing fields: `suggestionCount`, `acceptCount`, `ignoreCount`

2. **Suggestion** (extended)
   - `aiPayload`: JSON containing AI-generated suggestion with options
   - `actedAt`: Timestamp when user acted (accept/dismiss/snooze)

3. **AcceptedAction** (new)
   - Links suggestion to user action
   - Tracks which option was selected
   - Status: pending/in_progress/completed/cancelled
   - Type: task/reminder/plan

4. **ProviderTaskLink** (new)
   - Links accepted action to provider task (Google Tasks / Microsoft To Do)
   - Idempotency key: `(userId, acceptedActionId, optionIndex)`
   - Tracks status: open/completed/deleted
   - Stores `providerTaskId`, `providerListId`, `completedAt`

5. **CalendarLink** (new)
   - Links accepted action to calendar event
   - Stores `providerEventId`, `startAt`, `endAt`

6. **ActivityEvent** (new)
   - Audit log of all activities
   - Event types: suggestion_accepted, task_completed, etc.
   - Used for analytics and feedback loops

## Two-Stage Suggestion Engine

### Stage A: Rules-based Candidate Selection

**Service**: `candidate-scoring.service.ts`

**Purpose**: Deterministic, explainable candidate selection (NO AI)

**Signals Computed**:
- `stalenessDays`: Days since `lastActivityAt` (fallback to `updatedAt`)
- `noExecution`: No provider_task_links and no calendar_links for intent
- `dropOff`: Had completions previously but none recently (>30 days)
- `priorityBoost`: Higher priority boards surface more (future enhancement)

**Constraints**:
- Max 3 candidates per day
- Max 1 per Life Area
- Do not suggest same intent more than once per 7 days
- Respect `snoozeUntil` dates

**Scoring Formula**:
```
score = (stalenessDays / 30) * 50  // Up to 50 points
      + (noExecution ? 30 : 0)       // 30 points if no execution
      + (dropOff ? 20 : 0)          // 20 points if drop-off
      * priorityBoost                // Multiplier
```

### Stage B: AI Generation

**Service**: `ai-suggestion-generator.service.ts`

**Purpose**: Generate rich suggestion payload using OpenAI (GPT-4o-mini)

**Input**: Candidate intent with signals

**Output**: Structured JSON payload:
```json
{
  "title": "Short, actionable title",
  "reason": "Must reference real signals (e.g. 'inactive for 14 days')",
  "priority": "low|medium|high",
  "recommendedActionType": "task|reminder|plan",
  "options": [
    {
      "label": "Quick 10-minute task",
      "type": "task",
      "details": { "taskTitle": "...", "estimatedEffortMin": 10 },
      "estimatedEffortMin": 10
    },
    {
      "label": "Dedicated 30-minute session",
      "type": "task",
      "details": { "taskTitle": "...", "estimatedEffortMin": 30 },
      "estimatedEffortMin": 30
    }
  ],
  "defaultOptionIndex": 0,
  "confidence": 0.0-1.0
}
```

**Key Rules**:
- AI must NEVER invent facts
- Only use provided signals
- Generate 2-4 options with varying effort levels
- Reason must reference actual signals

## Accept Flow

### Service: `suggestion-accept.service.ts`

**Endpoint**: `POST /api/life-organization/suggestions/:id/accept`

**Request Body**:
```json
{
  "optionIndex": 0,
  "destinationList": "inbox" | "board",
  "scheduleNow": boolean,
  "scheduledTime": "ISO datetime string"
}
```

**Process** (Transactional):
1. Validate suggestion and option
2. Check for existing `AcceptedAction` (idempotency)
3. Create `AcceptedAction` if not exists
4. Create provider tasks (Google Tasks / Microsoft To Do):
   - List: "Khanflow Inbox" or "Khanflow • <BoardName>"
   - Idempotent: Check for existing `ProviderTaskLink` with `(userId, acceptedActionId, optionIndex)`
5. Create calendar events if `scheduleNow` is true
6. Update `Suggestion.status = ACCEPTED`, `Suggestion.actedAt`
7. Update `Intent.lastActivityAt`, `Intent.lastEngagedAt`, `Intent.acceptCount`
8. Create `ActivityEvent` for audit

**Idempotency**:
- All writes use unique constraints
- Retries don't create duplicates
- Deterministic keys: `(userId, acceptedActionId, optionIndex)`

## Provider Sync

### Service: `provider-sync.service.ts`

**Endpoint**: `POST /api/life-organization/provider/sync`

**Purpose**: Poll provider APIs to detect completion status changes

**Process**:
1. Get all `ProviderTaskLink` with `status = OPEN` for user
2. For each link:
   - Query provider API (Google Tasks / Microsoft To Do)
   - Check if task is completed/deleted
   - Update `ProviderTaskLink.status` and `completedAt`
   - If completed:
     - Update `Intent.lastActivityAt = now()`
     - Create `ActivityEvent` (TASK_COMPLETED)
3. Sync calendar events (optional):
   - Check if events still exist
   - Update timestamps if changed
   - Update `Intent.lastActivityAt` if event is in the past

**Scheduling**:
- Should be called periodically (cron job or webhook)
- Recommended: Every 15-30 minutes
- Can be triggered manually via API

## Frontend Components

### Suggestions Page
**Path**: `/app/suggestions/page.tsx`

**Features**:
- List of active suggestions
- Priority badges
- Accept / Dismiss buttons
- Generate new suggestions button
- Empty state

### Accept Action Sheet
**Path**: `/components/suggestions/accept-suggestion-sheet.tsx`

**Features**:
- Radio group for option selection
- Destination list selector (Inbox vs Board)
- Schedule now toggle
- Scheduled time picker (if scheduleNow is true)
- Accept & Create button

## API Endpoints

### Suggestions
- `GET /api/life-organization/suggestions` - Get active suggestions
- `POST /api/life-organization/suggestions/generate` - Manually trigger generation
- `POST /api/life-organization/suggestions/:id/accept` - Accept with options
- `POST /api/life-organization/suggestions/:id/dismiss` - Dismiss suggestion
- `POST /api/life-organization/suggestions/:id/snooze` - Snooze suggestion
- `POST /api/life-organization/provider/sync` - Sync provider tasks/calendar

## Database Migration

**File**: `1751000000000-AddSuggestionSystemTables.ts`

**Tables Created**:
- `accepted_actions`
- `provider_task_links` (with unique constraint for idempotency)
- `calendar_links`
- `activity_events`

**Columns Added**:
- `intents.lastActivityAt`
- `suggestions.aiPayload` (JSONB)
- `suggestions.actedAt`

## Configuration

**Environment Variables**:
- `OPENAI_API_KEY`: Required for AI generation (Stage B)

## Testing Considerations

### Candidate Selection Tests
- Rate limiting (max 3 per day, max 1 per Life Area)
- Snooze logic (respect `snoozedUntil`)
- 7-day cooldown per intent

### Idempotency Tests
- Retry accept flow multiple times
- Verify no duplicate provider tasks
- Verify no duplicate calendar events

### Completion Tracking Tests
- Mock provider API responses
- Verify `lastActivityAt` updates
- Verify activity events created

## Future Enhancements

1. **Webhook Support**: Replace polling with webhooks for real-time updates
2. **Board Priority**: Add priority field to IntentBoard for better scoring
3. **Advanced Scheduling**: Use availability service for smarter calendar scheduling
4. **Analytics Dashboard**: Visualize suggestion performance and user engagement
5. **A/B Testing**: Test different AI prompts and scoring formulas
6. **Multi-provider Support**: Support more task/calendar providers

## Logging & Monitoring

**Key Metrics**:
- Suggestions generated per day
- Acceptance rate
- Completion rate (tasks created → completed)
- Average time to completion
- Provider sync success rate

**Log Points**:
- Candidate selection: userId, candidateCount, scores
- AI generation: userId, suggestionId, confidence
- Accept flow: userId, suggestionId, acceptedActionId, provider tasks created
- Provider sync: userId, updated, completed, errors

## Error Handling

- **AI Generation Failure**: Falls back to deterministic suggestion
- **Provider API Failure**: Logs error, continues with other providers
- **Transaction Rollback**: All-or-nothing for accept flow
- **Idempotency**: Retries are safe, no duplicates created
