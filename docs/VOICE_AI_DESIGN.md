# Voice AI Calendar & Task Management System - Design Document

## Executive Summary

This document outlines the design and implementation of an interactive Voice AI system for calendar and task management in KhanFlow. The system enables users to create, manage, and schedule tasks through natural voice interactions, with intelligent conflict detection, urgency assessment, and automated scheduling.

---

## Table of Contents

1. [General Overview](#general-overview)
2. [System Architecture](#system-architecture)
3. [Technical Implementation](#technical-implementation)
4. [User Interaction Flow](#user-interaction-flow)
5. [Component Details](#component-details)
6. [Data Models](#data-models)
7. [API Endpoints](#api-endpoints)
8. [Integration Points](#integration-points)

---

## General Overview

### What It Does

The Voice AI system acts as an intelligent personal assistant that:

1. **Listens to User Voice Commands**: Users speak naturally (e.g., "Schedule a team meeting tomorrow at 2 PM" or "Add a task to call John")

2. **Understands Intent**: The AI analyzes the speech to determine:
   - What type of task/event the user wants to create
   - When it should happen (today, tomorrow, recurring)
   - How urgent it is
   - Where it belongs (which calendar, task list, life area)

3. **Asks Clarifying Questions**: If information is missing or unclear, the AI engages in a conversation:
   - "Would you like this at 2 PM or 2:30 PM?"
   - "I see you have a conflict at that time. How about 3 PM instead?"
   - "Is this a one-time task or something you'll do daily/weekly?"

4. **Detects Conflicts**: Before scheduling, the system:
   - Checks existing calendar events
   - Identifies time conflicts
   - Suggests alternative time slots
   - Asks user preferences for conflict resolution

5. **Creates and Schedules**: Once all information is gathered:
   - Creates tasks in Google Tasks or Microsoft To-Do
   - Schedules events in Google Calendar or Outlook
   - Sets up recurring tasks if applicable
   - Assigns appropriate priorities

### Key Use Cases

#### Use Case 1: Simple Task Creation
```
User: "Add a task to buy groceries"
AI: "I've added 'Buy groceries' to your tasks. When would you like to do this?"
User: "Tomorrow afternoon"
AI: "Got it! I've scheduled it for tomorrow at 2 PM with a reminder."
```

#### Use Case 2: Meeting with Conflict
```
User: "Schedule a team meeting tomorrow at 10 AM"
AI: "I see you have 'Project review' scheduled at 10 AM tomorrow. 
     Would you like to:
     1. Move the team meeting to 11 AM
     2. Move the team meeting to 2 PM
     3. Cancel the project review"
User: "Option 1"
AI: "Perfect! Team meeting scheduled for tomorrow at 11 AM."
```

#### Use Case 3: Recurring Task
```
User: "I want to go to the gym every Monday and Wednesday"
AI: "Great! What time works best for you?"
User: "7 AM"
AI: "How long do you usually spend at the gym?"
User: "One hour"
AI: "Perfect! I've created a recurring task 'Gym' for every Monday 
     and Wednesday at 7 AM for 1 hour."
```

#### Use Case 4: Urgent Task
```
User: "I need to submit the report ASAP"
AI: "This sounds urgent. When is the deadline?"
User: "End of today"
AI: "I've marked this as high priority and scheduled it for 
     your next available slot at 3 PM today. I estimate it 
     will take about 2 hours based on similar tasks."
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Voice Recorder  │  │ Voice Visualizer │  │ Chat Interface │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Voice Audio + User Selections
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Next.js)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              POST /api/voice/transcribe                  │  │
│  │              POST /api/voice/execute                     │  │
│  │              POST /api/voice/clarify                     │  │
│  │              GET  /api/voice/conversation/:id            │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES (Express)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Voice Service Layer                     │  │
│  │  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ Transcription  │  │ Intent Parser│  │ Conversation │ │  │
│  │  │   (Whisper)    │  │  (GPT-4)     │  │   Manager    │ │  │
│  │  └────────────────┘  └──────────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  AI Services Layer                       │  │
│  │  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ AI Calendar    │  │ Conflict     │  │ Task Analysis│ │  │
│  │  │ Scheduling     │  │ Detection    │  │  (Gemini AI) │ │  │
│  │  └────────────────┘  └──────────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Integration Services Layer                  │  │
│  │  ┌────────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ Google Tasks   │  │ Microsoft    │  │ Google       │ │  │
│  │  │ Service        │  │ To-Do Service│  │ Calendar     │ │  │
│  │  └────────────────┘  └──────────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌────────────────┐  ┌──────────────┐  ┌──────────────────────┐│
│  │  PostgreSQL    │  │  Supabase    │  │  External APIs       ││
│  │  (TypeORM)     │  │  (Auth)      │  │  (Google/Microsoft)  ││
│  └────────────────┘  └──────────────┘  └──────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Voice Command Processing Flow
```
User speaks → Audio captured → Sent to backend
    ↓
Whisper API transcribes → Text transcript generated
    ↓
GPT-4 analyzes transcript → Extracts intent + entities
    ↓
System determines: Is information complete?
    ├─ YES → Execute action (create task/event)
    └─ NO  → Request clarification from user
```

#### 2. Conflict Detection Flow
```
Task/Event to schedule
    ↓
Query user's calendar for time range
    ↓
Check for overlapping events
    ├─ NO CONFLICT → Schedule directly
    └─ CONFLICT FOUND
        ↓
    Find alternative time slots
        ↓
    Present options to user
        ↓
    User selects option
        ↓
    Schedule at selected time
```

#### 3. Recurring Task Flow
```
AI detects recurring pattern (daily/weekly/monthly)
    ↓
Ask for recurrence details (which days, time, duration)
    ↓
Calculate all occurrences for next N months
    ↓
Check each occurrence for conflicts
    ├─ Conflicts found → Ask user preference
    └─ No conflicts → Create all occurrences
```

---

## Technical Implementation

### Technology Stack

#### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL via TypeORM
- **AI/ML**: 
  - OpenAI GPT-4 for intent parsing
  - OpenAI Whisper for speech-to-text
  - Google Gemini for task analysis
- **External APIs**:
  - Google Calendar API
  - Google Tasks API
  - Microsoft Graph API (Outlook, To-Do)

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: React Query (TanStack)
- **Voice Recording**: MediaRecorder API

### Key Services

#### 1. VoiceService
**Purpose**: Core orchestration of voice commands

**Key Methods**:
```typescript
- transcribeAudio(audioBuffer, filename): Promise<string>
  // Converts audio to text using Whisper

- parseVoiceAction(transcript, userId, conversationId?): Promise<ParsedVoiceAction>
  // Analyzes transcript to extract intent and entities

- executeVoiceAction(userId, parsedAction, options): Promise<ExecutedAction>
  // Executes the parsed action (create task, schedule event)

- handleClarification(userId, conversationId, userResponse): Promise<any>
  // Processes user's clarification response
```

#### 2. ConversationManager
**Purpose**: Manages multi-turn conversations

**Key Methods**:
```typescript
- createConversation(userId, initialTranscript): Promise<Conversation>
  // Starts a new conversation session

- addMessage(conversationId, role, content): Promise<Message>
  // Adds user or assistant message to conversation

- getContext(conversationId): Promise<ConversationContext>
  // Retrieves full conversation context for AI

- requiresClarification(parsedAction): boolean
  // Determines if clarification is needed

- generateClarificationQuestion(parsedAction): Promise<string>
  // Creates appropriate clarification question
```

#### 3. ConflictDetectionService
**Purpose**: Detects and resolves calendar conflicts

**Key Methods**:
```typescript
- checkConflicts(userId, startTime, endTime, calendarId): Promise<Conflict[]>
  // Checks for overlapping events

- findAlternativeSlots(userId, duration, preferredDate, options): Promise<TimeSlot[]>
  // Suggests alternative time slots

- resolveConflict(userId, conflictId, resolution): Promise<ResolvedConflict>
  // Applies user's conflict resolution choice

- analyzeConflictSeverity(conflict): ConflictSeverity
  // Determines if conflict is hard (immovable) or soft (flexible)
```

#### 4. AICalendarService (Enhanced)
**Purpose**: AI-powered task scheduling and analysis

**Key Methods**:
```typescript
- analyzeTasksAndSuggestBlocks(tasks, dateRange): Promise<TaskAnalysis[]>
  // Uses Gemini AI to analyze tasks and suggest optimal scheduling

- detectRecurrencePattern(transcript): Promise<RecurrencePattern | null>
  // Identifies recurring patterns in user's request

- assessUrgency(task, context): Promise<UrgencyAssessment>
  // Determines task urgency (today, tomorrow, flexible)

- estimateTaskDuration(taskTitle, taskDescription): Promise<number>
  // AI estimates how long task will take
```

### Database Schema

#### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  status VARCHAR(20), -- 'active', 'completed', 'abandoned'
  context JSONB, -- Stores conversation state
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### Conversation Messages Table
```sql
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role VARCHAR(20), -- 'user' or 'assistant'
  content TEXT,
  parsed_data JSONB, -- Structured data extracted from message
  timestamp TIMESTAMP
);
```

#### Task Conflicts Table
```sql
CREATE TABLE task_conflicts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  task_id VARCHAR(255), -- External task ID
  conflicting_event_id VARCHAR(255), -- External event ID
  conflict_type VARCHAR(50), -- 'time_overlap', 'double_booking'
  severity VARCHAR(20), -- 'high', 'medium', 'low'
  status VARCHAR(20), -- 'pending', 'resolved', 'ignored'
  resolution JSONB, -- How conflict was resolved
  created_at TIMESTAMP,
  resolved_at TIMESTAMP
);
```

#### Recurring Tasks Table
```sql
CREATE TABLE recurring_tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  task_template JSONB, -- Template for creating instances
  recurrence_rule VARCHAR(255), -- iCal RRULE format
  start_date DATE,
  end_date DATE,
  status VARCHAR(20), -- 'active', 'paused', 'completed'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### AI Prompt Engineering

#### Intent Parsing Prompt Structure
```typescript
const systemPrompt = `You are an intelligent calendar assistant that understands natural language.

TASK: Parse the user's voice command and extract:
1. Intent (create_task, create_event, update_task, query_tasks)
2. Task/Event details (title, description, date, time)
3. Urgency indicators (ASAP, urgent, today, tomorrow)
4. Recurrence patterns (daily, weekly, every Monday, etc.)
5. Priority indicators (important, critical, low priority)

CONTEXT:
- Current date/time: ${currentDateTime}
- User's timezone: ${userTimezone}
- User's work hours: ${workHours}

RULES:
- If date/time is ambiguous, mark for clarification
- Detect relative dates (today, tomorrow, next week)
- Identify recurring patterns (every X, daily, weekly)
- Extract priority from keywords and context
- If critical information is missing, set confidence to false

Return JSON: { intent, task, confidence, urgency, recurrence }`;
```

#### Conflict Resolution Prompt
```typescript
const conflictPrompt = `The user wants to schedule: "${taskTitle}" at ${requestedTime}

CONFLICT FOUND:
Existing event: "${existingEvent.title}" 
Time: ${existingEvent.startTime} - ${existingEvent.endTime}

AVAILABLE ALTERNATIVES:
${alternativeSlots.map(s => `- ${formatTime(s)}`).join('\n')}

Generate a friendly, concise message that:
1. Explains the conflict clearly
2. Presents 3-4 alternative options
3. Asks user which they prefer
4. Maintains conversational tone

Format as multiple choice question.`;
```

---

## User Interaction Flow

### Conversation State Machine

```
[START]
    ↓
┌─────────────────┐
│  LISTENING      │ ← User begins speaking
└────────┬────────┘
         │ Audio captured
         ↓
┌─────────────────┐
│ TRANSCRIBING    │ ← Whisper API processing
└────────┬────────┘
         │ Text generated
         ↓
┌─────────────────┐
│ PARSING         │ ← GPT-4 analyzing intent
└────────┬────────┘
         │
         ├─→ [CONFIDENT] → EXECUTING → [SUCCESS/FAILURE] → END
         │
         └─→ [NEEDS_CLARIFICATION]
                   ↓
         ┌─────────────────┐
         │ CLARIFYING      │ ← AI asks question
         └────────┬────────┘
                  │ User responds
                  ↓
         ┌─────────────────┐
         │ PROCESSING      │ ← Incorporate response
         └────────┬────────┘
                  │
                  └─→ Loop back to PARSING or EXECUTING
```

### Multi-Turn Conversation Example

```
Turn 1:
  User: "I need to schedule a meeting"
  AI: "Sure! What's the meeting about?"
  [State: Waiting for meeting title]

Turn 2:
  User: "Project kickoff"
  AI: "When would you like to schedule the project kickoff meeting?"
  [State: Have title, waiting for date/time]

Turn 3:
  User: "Tomorrow at 2"
  AI: "I see you have 'Team standup' at 2 PM tomorrow. Would you like to:
       1. Schedule at 3 PM instead
       2. Schedule at 4 PM instead
       3. Move the team standup"
  [State: Have all info, resolving conflict]

Turn 4:
  User: "Option 1"
  AI: "Perfect! I've scheduled 'Project kickoff meeting' for tomorrow at 3 PM."
  [State: Complete]
```

### Urgency Assessment Logic

```typescript
function assessUrgency(parsedAction: ParsedVoiceAction): UrgencyLevel {
  const { transcript, task } = parsedAction;
  
  // Explicit urgency keywords
  if (contains(transcript, ['ASAP', 'urgent', 'immediately', 'right now'])) {
    return 'critical'; // Schedule in next available slot
  }
  
  // Time-based urgency
  if (task.due_date === 'today' && currentTime.hour > 15) {
    return 'urgent'; // Less than 2 hours left today
  }
  
  if (task.due_date === 'today' || task.due_date === 'tomorrow') {
    return 'high'; // Within 24 hours
  }
  
  if (daysUntilDue <= 3) {
    return 'medium'; // Within 3 days
  }
  
  // Keyword-based priorities
  if (contains(transcript, ['deadline', 'due', 'submit'])) {
    return 'medium';
  }
  
  return 'normal'; // Default
}
```

### Recurrence Detection

```typescript
function detectRecurrence(transcript: string): RecurrencePattern | null {
  const patterns = [
    // Daily patterns
    { regex: /every day|daily|each day/i, type: 'DAILY', interval: 1 },
    { regex: /every (\d+) days/i, type: 'DAILY', interval: 'captured' },
    
    // Weekly patterns
    { regex: /every week|weekly/i, type: 'WEEKLY', interval: 1 },
    { regex: /every (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, 
      type: 'WEEKLY', byDay: 'captured' },
    { regex: /every (monday|tuesday) and (wednesday|thursday)/i,
      type: 'WEEKLY', byDay: ['captured1', 'captured2'] },
    
    // Monthly patterns
    { regex: /every month|monthly/i, type: 'MONTHLY', interval: 1 },
    { regex: /every (\d+)(?:st|nd|rd|th) of the month/i,
      type: 'MONTHLY', byMonthDay: 'captured' },
    
    // Complex patterns
    { regex: /every weekday|weekdays/i, 
      type: 'WEEKLY', byDay: ['MO', 'TU', 'WE', 'TH', 'FR'] },
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern.regex);
    if (match) {
      return buildRecurrenceRule(pattern, match);
    }
  }
  
  return null;
}
```

---

## Component Details

### 1. Conversation Manager

**Responsibilities**:
- Track conversation state across multiple turns
- Store conversation history
- Provide context to AI for better understanding
- Manage clarification loops
- Handle conversation timeouts

**State Structure**:
```typescript
interface ConversationState {
  id: string;
  userId: string;
  status: 'active' | 'completed' | 'abandoned';
  currentStep: 'initial' | 'clarifying' | 'confirming' | 'executing';
  
  // Accumulated information
  extractedData: {
    intent?: string;
    taskTitle?: string;
    taskDescription?: string;
    dateTime?: string;
    recurrence?: RecurrencePattern;
    priority?: string;
  };
  
  // Missing information
  pendingFields: string[];
  
  // Conversation history
  messages: ConversationMessage[];
  
  // Metadata
  createdAt: Date;
  lastActivityAt: Date;
  timeoutAt: Date;
}
```

### 2. Conflict Detection Service

**Responsibilities**:
- Query calendar APIs for existing events
- Identify time overlaps
- Classify conflict severity
- Generate alternative suggestions
- Track conflict resolutions

**Conflict Types**:
```typescript
type ConflictType = 
  | 'hard_conflict'    // Immovable event (meeting with others)
  | 'soft_conflict'    // Flexible event (personal task)
  | 'partial_overlap'  // Events overlap partially
  | 'adjacent'         // Back-to-back events (might want buffer)
  | 'overbooked';      // Multiple events at same time

interface Conflict {
  type: ConflictType;
  severity: 'low' | 'medium' | 'high';
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
    isFlexible: boolean;
    attendeeCount?: number;
  }>;
  suggestions: TimeSlot[];
}
```

**Alternative Slot Algorithm**:
```typescript
async findAlternativeSlots(
  userId: string,
  duration: number,
  preferredDate: Date,
  options: FindSlotsOptions
): Promise<TimeSlot[]> {
  // 1. Get user's work hours and preferences
  const preferences = await getUserPreferences(userId);
  
  // 2. Get all events in date range (prefer same day, then next few days)
  const dateRange = {
    start: preferredDate,
    end: addDays(preferredDate, 7)
  };
  const events = await getCalendarEvents(userId, dateRange);
  
  // 3. Generate potential slots
  const potentialSlots = generateTimeSlots(
    dateRange,
    duration,
    preferences.workHours
  );
  
  // 4. Filter out conflicting slots
  const availableSlots = potentialSlots.filter(slot => 
    !hasConflict(slot, events)
  );
  
  // 5. Score slots based on user preferences
  const scoredSlots = availableSlots.map(slot => ({
    ...slot,
    score: calculateSlotScore(slot, preferredDate, preferences)
  }));
  
  // 6. Sort by score and return top N
  return scoredSlots
    .sort((a, b) => b.score - a.score)
    .slice(0, options.maxSuggestions || 5);
}
```

### 3. Recurring Task Manager

**Responsibilities**:
- Parse recurrence rules
- Generate task instances
- Handle exceptions (skip dates)
- Update all instances or single occurrence
- Detect and handle conflicts for recurring tasks

**Implementation**:
```typescript
class RecurringTaskManager {
  /**
   * Create recurring task instances
   */
  async createRecurringTask(
    userId: string,
    taskTemplate: TaskTemplate,
    recurrenceRule: string, // iCal RRULE format
    options: RecurringOptions
  ): Promise<RecurringTask> {
    // 1. Store recurring task template
    const recurringTask = await this.saveRecurringTask({
      userId,
      taskTemplate,
      recurrenceRule,
      startDate: options.startDate,
      endDate: options.endDate || addYears(options.startDate, 1)
    });
    
    // 2. Generate individual instances
    const occurrences = this.generateOccurrences(
      recurrenceRule,
      options.startDate,
      options.endDate,
      options.maxOccurrences || 100
    );
    
    // 3. Check each occurrence for conflicts
    const conflictingOccurrences = [];
    for (const occurrence of occurrences) {
      const conflicts = await this.conflictService.checkConflicts(
        userId,
        occurrence.startTime,
        occurrence.endTime
      );
      
      if (conflicts.length > 0) {
        conflictingOccurrences.push({
          occurrence,
          conflicts
        });
      }
    }
    
    // 4. Handle conflicts based on user preference
    if (conflictingOccurrences.length > 0 && options.conflictStrategy === 'ask') {
      // Return to user for manual resolution
      throw new ConflictRequiresResolutionError(conflictingOccurrences);
    } else if (options.conflictStrategy === 'skip') {
      // Skip conflicting occurrences
      occurrences = occurrences.filter(o => 
        !conflictingOccurrences.some(co => co.occurrence.id === o.id)
      );
    } else if (options.conflictStrategy === 'auto_adjust') {
      // Automatically find alternative times
      for (const { occurrence } of conflictingOccurrences) {
        const alternative = await this.findNearestAvailableSlot(
          userId,
          occurrence.startTime,
          occurrence.duration
        );
        if (alternative) {
          occurrence.startTime = alternative.startTime;
          occurrence.endTime = alternative.endTime;
        }
      }
    }
    
    // 5. Create all task instances
    await this.createTaskInstances(userId, occurrences, taskTemplate);
    
    return recurringTask;
  }
  
  /**
   * Generate occurrences from iCal RRULE
   */
  private generateOccurrences(
    rrule: string,
    startDate: Date,
    endDate: Date,
    maxOccurrences: number
  ): TaskOccurrence[] {
    // Use rrule library to parse and generate occurrences
    const rule = RRule.fromString(rrule);
    const dates = rule.between(startDate, endDate, true);
    
    return dates.slice(0, maxOccurrences).map((date, index) => ({
      id: generateId(),
      occurrenceIndex: index,
      startTime: date,
      endTime: addMinutes(date, this.getDefaultDuration()),
      status: 'scheduled'
    }));
  }
}
```

---

## API Endpoints

### Voice Command Endpoints

#### POST /api/voice/transcribe
Transcribe audio to text.

**Request**:
```typescript
{
  audio: File, // Audio file (multipart/form-data)
  format: 'webm' | 'mp3' | 'wav'
}
```

**Response**:
```typescript
{
  transcript: string,
  confidence: number,
  duration: number // seconds
}
```

#### POST /api/voice/execute
Execute a voice command.

**Request**:
```typescript
{
  transcript: string,
  conversationId?: string, // For multi-turn conversations
  userId: string,
  options?: {
    taskAppType?: 'GOOGLE_TASKS' | 'MICROSOFT_TODO',
    calendarAppType?: 'GOOGLE_CALENDAR' | 'OUTLOOK_CALENDAR'
  }
}
```

**Response**:
```typescript
{
  success: boolean,
  action: ExecutedAction | null,
  requiresClarification: boolean,
  clarification?: {
    question: string,
    options?: Array<{
      id: string,
      label: string
    }>,
    conversationId: string
  },
  conflict?: {
    type: string,
    conflictingEvents: Array<Event>,
    alternatives: Array<TimeSlot>
  }
}
```

#### POST /api/voice/clarify
Respond to a clarification request.

**Request**:
```typescript
{
  conversationId: string,
  response: string | number, // Text response or option ID
  selectedOptionId?: string
}
```

**Response**:
```typescript
{
  success: boolean,
  action?: ExecutedAction,
  requiresMoreClarification: boolean,
  nextQuestion?: string
}
```

#### GET /api/voice/conversation/:id
Get conversation history.

**Response**:
```typescript
{
  conversation: {
    id: string,
    status: string,
    messages: Array<ConversationMessage>,
    extractedData: object,
    createdAt: string,
    updatedAt: string
  }
}
```

### Calendar & Task Endpoints (Enhanced)

#### POST /api/calendar/check-conflicts
Check for calendar conflicts.

**Request**:
```typescript
{
  userId: string,
  startTime: string, // ISO datetime
  endTime: string,
  calendarId?: string
}
```

**Response**:
```typescript
{
  hasConflicts: boolean,
  conflicts: Array<Conflict>,
  alternatives: Array<TimeSlot>
}
```

#### POST /api/tasks/recurring
Create a recurring task.

**Request**:
```typescript
{
  userId: string,
  taskTemplate: {
    title: string,
    description?: string,
    duration?: number
  },
  recurrence: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    interval: number,
    byDay?: string[], // ['MO', 'WE', 'FR']
    until?: string // End date
  },
  conflictStrategy: 'ask' | 'skip' | 'auto_adjust'
}
```

**Response**:
```typescript
{
  recurringTaskId: string,
  instancesCreated: number,
  conflicts?: Array<ConflictInfo>
}
```

---

## Integration Points

### External Services

#### 1. Google Services Integration
- **Google Calendar API**: Read/write calendar events, check availability
- **Google Tasks API**: Create/update/delete tasks
- **OAuth 2.0**: User authentication and authorization

#### 2. Microsoft Services Integration
- **Microsoft Graph API**: 
  - Outlook Calendar: Manage events
  - Microsoft To-Do: Manage tasks
- **OAuth 2.0**: User authentication

#### 3. OpenAI Integration
- **Whisper API**: Speech-to-text transcription
- **GPT-4 API**: Natural language understanding and intent parsing

#### 4. Google Gemini Integration
- **Gemini AI**: Advanced task analysis, priority assessment, scheduling optimization

### Authentication Flow

```
User initiates voice command
    ↓
Frontend checks authentication
    ├─ Not authenticated → Redirect to login
    └─ Authenticated → Proceed
        ↓
    Frontend sends audio + JWT token
        ↓
    Backend validates token
        ↓
    Backend checks user's connected integrations
        ├─ No calendar/task service → Prompt to connect
        └─ Has integrations → Proceed with voice command
            ↓
        Execute action using user's OAuth tokens
            ↓
        Return result to frontend
```

### Error Handling

```typescript
// Hierarchical error handling
try {
  const result = await voiceService.execute(command);
  return success(result);
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Trigger OAuth refresh flow
    return needsReauth(error.provider);
  } else if (error instanceof ConflictError) {
    // Return conflict information for user resolution
    return needsClarification(error.conflicts);
  } else if (error instanceof APIRateLimitError) {
    // Queue for retry or notify user
    return rateLimitExceeded(error.retryAfter);
  } else if (error instanceof InvalidInputError) {
    // Ask for clarification
    return needsClarification(error.missingFields);
  } else {
    // Unknown error - log and return generic message
    logger.error('Unexpected error', error);
    return serverError();
  }
}
```

---

## Implementation Phases

### Phase 1: Enhanced Voice Service (Completed ✅)
- ✅ Basic voice transcription
- ✅ Intent parsing for tasks
- ✅ Google Tasks integration
- ✅ Microsoft To-Do integration

### Phase 2: Conversation Management (Completed ✅)
- ✅ Conversation state management
- ✅ Multi-turn conversation support
- ✅ Clarification question generation
- ✅ Context preservation across turns

### Phase 3: Conflict Detection (Completed ✅)
- ✅ Calendar conflict detection
- ✅ Alternative slot generation
- ✅ Conflict resolution strategies
- ⚠️ User preference learning (partial - basic scoring implemented)

### Phase 4: Recurring Tasks (Completed ✅)
- ✅ Recurrence pattern detection
- ✅ RRULE generation and parsing
- ✅ Recurring task instance creation
- ✅ Exception handling

### Phase 5: Intelligence & Learning (Future Enhancement)
- [ ] Advanced user habit learning
- [ ] Predictive scheduling suggestions
- [ ] Automatic workload balancing
- [ ] AI-powered productivity insights

---

## Security & Privacy Considerations

### Data Protection
1. **Audio Data**: Never stored permanently; deleted after transcription
2. **Transcripts**: Encrypted at rest in database
3. **Conversation History**: Retained for 30 days, then auto-deleted
4. **OAuth Tokens**: Encrypted, stored securely, refreshed automatically

### Rate Limiting
- Voice transcription: 100 requests/hour per user
- AI analysis: 500 requests/hour per user
- Calendar operations: 1000 requests/hour per user

### Privacy Controls
- Users can delete conversation history anytime
- Opt-out of AI analysis features
- Export all voice interaction data
- Clear consent for data usage

---

## Testing Strategy

### Unit Tests
- Voice service transcription
- Intent parsing accuracy
- Conflict detection logic
- Recurrence rule generation

### Integration Tests
- End-to-end voice command flow
- Multi-turn conversations
- Calendar API interactions
- Task creation across providers

### AI Testing
- Intent classification accuracy (target: >95%)
- Clarification appropriateness
- Alternative suggestion quality
- User satisfaction metrics

---

## Monitoring & Analytics

### Key Metrics
1. **Success Rate**: % of voice commands successfully executed
2. **Clarification Rate**: % of commands requiring clarification
3. **Conflict Rate**: % of scheduling attempts with conflicts
4. **Resolution Time**: Average time to complete a voice interaction
5. **User Satisfaction**: Explicit feedback ratings

### Logging
```typescript
// Structured logging for voice interactions
logger.info('voice.interaction', {
  userId,
  conversationId,
  intent,
  turnsRequired,
  hadConflicts,
  resolutionTime,
  successfullyExecuted,
  errorType
});
```

---

## Future Enhancements

1. **Smart Scheduling**
   - Learn user's peak productivity hours
   - Suggest optimal task timing
   - Balance workload across days

2. **Team Collaboration**
   - Schedule meetings considering all attendees
   - Suggest best meeting times for groups
   - Handle meeting conflicts automatically

3. **Multi-language Support**
   - Support voice commands in multiple languages
   - Automatic language detection

4. **Voice Responses**
   - Text-to-speech for AI responses
   - Full voice-only interaction mode

5. **Advanced Recurrence**
   - Complex patterns (2nd Tuesday of month)
   - Holiday awareness
   - Business day calculations

---

## Conclusion

This Voice AI Calendar & Task Management system transforms natural voice commands into organized, conflict-free schedules. By combining speech recognition, natural language understanding, intelligent conflict detection, and multi-turn conversations, it provides a seamless experience for managing tasks and calendar events.

The system's architecture is modular, scalable, and extensible, allowing for easy addition of new features and integrations. The use of state-of-the-art AI models ensures high accuracy in understanding user intent while maintaining a conversational and helpful interaction style.
