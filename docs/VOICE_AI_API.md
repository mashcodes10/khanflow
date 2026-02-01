# Voice AI API Documentation

## Base URL
```
/api/voice/enhanced
```

All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Execute Voice Command

Process a voice command with conversation management and conflict detection.

**Endpoint:** `POST /api/voice/enhanced/execute`

**Request Body:**
```json
{
  "transcript": "Schedule a team meeting tomorrow at 2 PM",
  "conversationId": "optional-conversation-id-for-multi-turn",
  "taskAppType": "GOOGLE_MEET_AND_CALENDAR",  // Optional
  "calendarAppType": "GOOGLE_MEET_AND_CALENDAR"  // Optional
}
```

**Response (Success):**
```json
{
  "message": "Command processed successfully",
  "success": true,
  "conversationId": "conversation-uuid",
  "requiresClarification": false,
  "action": {
    "actionId": "action-uuid",
    "timestamp": "2024-01-15T10:30:00Z",
    "intent": "create_task",
    "actionType": "task",
    "createdTaskId": "task-123",
    "createdTaskListId": "list-456"
  },
  "conversationStep": "completed",
  "message": "Great! I've added \"Team meeting\" to your tasks."
}
```

**Response (Needs Clarification):**
```json
{
  "message": "Clarification required",
  "success": false,
  "conversationId": "conversation-uuid",
  "requiresClarification": true,
  "clarificationQuestion": "When would you like to schedule this?",
  "clarificationOptions": [
    {
      "id": "option-1",
      "label": "Tomorrow at 2 PM",
      "value": { "date": "2024-01-16", "time": "14:00:00" }
    },
    {
      "id": "option-2",
      "label": "Tomorrow at 3 PM",
      "value": { "date": "2024-01-16", "time": "15:00:00" }
    }
  ],
  "conversationStep": "clarifying"
}
```

**Response (Conflict Detected):**
```json
{
  "message": "This event conflicts with \"Project review\" scheduled at 2:00 PM tomorrow.\n\nHere are some alternative times:\n1. Wed, Jan 16 at 3:00 PM\n2. Wed, Jan 16 at 4:00 PM\n3. Thu, Jan 17 at 2:00 PM\n\nWhich would you prefer?",
  "success": false,
  "conversationId": "conversation-uuid",
  "requiresClarification": true,
  "conflict": {
    "type": "hard_conflict",
    "severity": "high",
    "requestedEvent": {
      "title": "Team meeting",
      "startTime": "2024-01-16T14:00:00Z",
      "endTime": "2024-01-16T15:00:00Z",
      "duration": 60
    },
    "conflictingEvents": [
      {
        "id": "event-123",
        "title": "Project review",
        "startTime": "2024-01-16T14:00:00Z",
        "endTime": "2024-01-16T15:00:00Z",
        "isFlexible": false,
        "attendeeCount": 5,
        "source": "google"
      }
    ],
    "suggestions": [
      {
        "startTime": "2024-01-16T15:00:00Z",
        "endTime": "2024-01-16T16:00:00Z",
        "score": 95,
        "reason": "Available this afternoon"
      }
    ],
    "message": "Team meeting conflicts with \"Project review\" scheduled at 2:00 PM."
  },
  "clarificationOptions": [
    {
      "id": "slot-0",
      "label": "Wed, Jan 16 at 3:00 PM",
      "value": { "startTime": "2024-01-16T15:00:00Z", "endTime": "2024-01-16T16:00:00Z" }
    },
    {
      "id": "slot-1",
      "label": "Wed, Jan 16 at 4:00 PM",
      "value": { "startTime": "2024-01-16T16:00:00Z", "endTime": "2024-01-16T17:00:00Z" }
    },
    {
      "id": "cancel",
      "label": "Cancel",
      "value": null
    }
  ],
  "conversationStep": "resolving_conflict"
}
```

---

### 2. Handle Clarification

Respond to a clarification request.

**Endpoint:** `POST /api/voice/enhanced/clarify`

**Request Body:**
```json
{
  "conversationId": "conversation-uuid",
  "response": "Tomorrow at 3 PM",  // Text response
  "selectedOptionId": "option-1"   // Or select an option by ID
}
```

**Response:**
Same format as `/execute` endpoint - either success or another clarification.

---

### 3. Get Conversation

Retrieve a conversation by ID.

**Endpoint:** `GET /api/voice/enhanced/conversation/:id`

**Response:**
```json
{
  "message": "Conversation retrieved successfully",
  "conversation": {
    "id": "conversation-uuid",
    "userId": "user-uuid",
    "status": "active",
    "currentStep": "clarifying",
    "extractedData": {
      "intent": "create_task",
      "actionType": "task",
      "taskTitle": "Team meeting",
      "date": "2024-01-16",
      "time": "14:00:00"
    },
    "pendingFields": ["duration"],
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "Schedule a team meeting tomorrow at 2 PM",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "id": "msg-2",
        "role": "assistant",
        "content": "How long will the meeting be?",
        "timestamp": "2024-01-15T10:30:01Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "lastActivityAt": "2024-01-15T10:30:01Z",
    "timeoutAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 4. Get User Conversations

Get all active conversations for the authenticated user.

**Endpoint:** `GET /api/voice/enhanced/conversations`

**Response:**
```json
{
  "message": "Conversations retrieved successfully",
  "conversations": [
    {
      "id": "conversation-1",
      "status": "active",
      "currentStep": "clarifying",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### 5. Delete Conversation

Delete or abandon a conversation.

**Endpoint:** `DELETE /api/voice/enhanced/conversation/:id`

**Response:**
```json
{
  "message": "Conversation deleted successfully"
}
```

---

### 6. Check Conflicts

Check for calendar conflicts at a specific time.

**Endpoint:** `POST /api/voice/enhanced/check-conflicts`

**Request Body:**
```json
{
  "startTime": "2024-01-16T14:00:00Z",
  "endTime": "2024-01-16T15:00:00Z",
  "title": "Team meeting",
  "includeAllCalendars": true
}
```

**Response (No Conflicts):**
```json
{
  "message": "No conflicts found",
  "hasConflicts": false
}
```

**Response (Conflicts Found):**
```json
{
  "message": "Conflicts detected",
  "hasConflicts": true,
  "conflict": {
    "type": "hard_conflict",
    "severity": "high",
    "requestedEvent": { /* ... */ },
    "conflictingEvents": [ /* ... */ ],
    "suggestions": [ /* ... */ ],
    "message": "Team meeting conflicts with \"Project review\" scheduled at 2:00 PM."
  }
}
```

---

### 7. Find Alternative Slots

Find available time slots for scheduling.

**Endpoint:** `POST /api/voice/enhanced/find-slots`

**Request Body:**
```json
{
  "duration": 60,  // minutes
  "preferredDate": "2024-01-16",
  "maxSuggestions": 5,
  "preferredTimeOfDay": "afternoon",  // morning, afternoon, evening
  "workHoursOnly": true,
  "sameDayOnly": false
}
```

**Response:**
```json
{
  "message": "Alternative slots found",
  "slots": [
    {
      "startTime": "2024-01-16T15:00:00Z",
      "endTime": "2024-01-16T16:00:00Z",
      "score": 95,
      "reason": "Available this afternoon"
    },
    {
      "startTime": "2024-01-16T16:00:00Z",
      "endTime": "2024-01-16T17:00:00Z",
      "score": 90,
      "reason": "Available this afternoon"
    }
  ],
  "count": 2
}
```

---

### 8. Detect Recurrence

Detect if a transcript contains a recurring pattern.

**Endpoint:** `POST /api/voice/enhanced/detect-recurrence`

**Request Body:**
```json
{
  "transcript": "I want to go to the gym every Monday and Wednesday at 7 AM"
}
```

**Response (Pattern Found):**
```json
{
  "message": "Recurrence pattern detected",
  "hasRecurrence": true,
  "pattern": {
    "frequency": "WEEKLY",
    "interval": 1,
    "byDay": ["MO", "WE"],
    "count": null,
    "until": null
  }
}
```

**Response (No Pattern):**
```json
{
  "message": "No recurrence pattern detected",
  "hasRecurrence": false
}
```

---

### 9. Create Recurring Task

Create a task that repeats on a schedule.

**Endpoint:** `POST /api/voice/enhanced/recurring-task`

**Request Body:**
```json
{
  "title": "Go to gym",
  "description": "Morning workout session",
  "recurrence": {
    "frequency": "WEEKLY",
    "interval": 1,
    "byDay": ["MO", "WE", "FR"]
  },
  "duration": 60,
  "conflictStrategy": "ask",  // ask, skip, auto_adjust
  "taskAppType": "GOOGLE_MEET_AND_CALENDAR"
}
```

**Response:**
```json
{
  "message": "Recurring task created successfully",
  "success": true,
  "recurringTaskId": "recurring-123"
}
```

---

### 10. Get Conversation Statistics

Get system-wide conversation statistics (admin endpoint).

**Endpoint:** `GET /api/voice/enhanced/stats`

**Response:**
```json
{
  "message": "Statistics retrieved successfully",
  "stats": {
    "totalConversations": 25,
    "activeConversations": 5,
    "completedConversations": 18,
    "abandonedConversations": 2
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Transcript is required",
  "errorCode": "MISSING_TRANSCRIPT"
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required",
  "errorCode": "UNAUTHORIZED"
}
```

### 403 Forbidden
```json
{
  "message": "You don't have access to this conversation",
  "errorCode": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "message": "Conversation not found or expired",
  "errorCode": "CONVERSATION_NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "message": "An unexpected error occurred",
  "errorCode": "INTERNAL_ERROR"
}
```

---

## Conversation Flow Examples

### Example 1: Simple Task Creation

**Request 1:**
```json
POST /api/voice/enhanced/execute
{
  "transcript": "Add a task to buy groceries"
}
```

**Response 1:**
```json
{
  "success": false,
  "conversationId": "conv-123",
  "requiresClarification": true,
  "clarificationQuestion": "When would you like to do this?",
  "conversationStep": "clarifying"
}
```

**Request 2:**
```json
POST /api/voice/enhanced/clarify
{
  "conversationId": "conv-123",
  "response": "Tomorrow afternoon"
}
```

**Response 2:**
```json
{
  "success": true,
  "message": "Great! I've added \"Buy groceries\" to your tasks.",
  "action": { /* ... */ },
  "conversationStep": "completed"
}
```

---

### Example 2: Meeting with Conflict

**Request 1:**
```json
POST /api/voice/enhanced/execute
{
  "transcript": "Schedule a team meeting tomorrow at 2 PM for 1 hour"
}
```

**Response 1:**
```json
{
  "success": false,
  "conversationId": "conv-456",
  "requiresClarification": true,
  "conflict": { /* conflict details */ },
  "clarificationOptions": [
    { "id": "slot-0", "label": "Tomorrow at 3 PM" },
    { "id": "slot-1", "label": "Tomorrow at 4 PM" },
    { "id": "cancel", "label": "Cancel" }
  ],
  "conversationStep": "resolving_conflict"
}
```

**Request 2:**
```json
POST /api/voice/enhanced/clarify
{
  "conversationId": "conv-456",
  "selectedOptionId": "slot-0"
}
```

**Response 2:**
```json
{
  "success": true,
  "message": "All set! \"Team meeting\" has been added to your calendar for tomorrow at 3 PM.",
  "action": { /* ... */ },
  "conversationStep": "completed"
}
```

---

## Rate Limits

- Voice transcription: 100 requests/hour per user
- AI analysis: 500 requests/hour per user
- Calendar operations: 1000 requests/hour per user

## Notes

- Conversations expire after 30 minutes of inactivity
- Maximum of 10 active conversations per user
- Audio files are deleted immediately after transcription
- All timestamps are in ISO 8601 format with UTC timezone
