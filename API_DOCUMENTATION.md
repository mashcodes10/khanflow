# Khanflow API Documentation

**Version:** 1.0.0  
**Base URL:** `https://api.khanflow.com` (Production)  
**Base Path:** `/api`

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Health](#health)
   - [Authentication](#auth-endpoints)
   - [Events](#events)
   - [Meetings](#meetings)
   - [Availability](#availability)
   - [Calendar](#calendar)
   - [Integrations](#integrations)
   - [AI Calendar & Tasks](#ai-calendar--tasks)
   - [Microsoft Todo](#microsoft-todo)
   - [Voice Assistant](#voice-assistant)
   - [Actions](#actions)
   - [Life Organization](#life-organization)
4. [Error Responses](#error-responses)
5. [Rate Limiting](#rate-limiting)

---

## Overview

Khanflow is an AI-powered productivity platform that integrates with your calendar and communication tools to simplify meeting management. The API provides comprehensive access to scheduling, task management, voice commands, and life organization features.

### Key Features

- 🔐 **OAuth Integration**: Google, Microsoft, and Zoom
- 📅 **Smart Scheduling**: AI-powered meeting suggestions
- 🎙️ **Voice Assistant**: Natural language command processing
- ✅ **Task Management**: Google Tasks and Microsoft Todo integration
- 🎯 **Life Organization**: Intent-based productivity system
- 🔄 **Calendar Sync**: Multi-platform calendar synchronization

---

## Authentication

### Overview

Khanflow uses JWT (JSON Web Tokens) for authentication. Most endpoints require authentication via the `Authorization` header.

### Authentication Methods

1. **Email/Password Registration & Login**
2. **Google OAuth**
3. **Microsoft OAuth**

### JWT Token

After successful authentication, you'll receive an `accessToken`:

```json
{
  "message": "User logged in successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-03-05T12:00:00.000Z"
}
```

### Using JWT in Requests

Include the token in the Authorization header:

```bash
Authorization: Bearer <accessToken>
```

### Token Expiration

Tokens expire after a set period (default: 7 days). After expiration, users must re-authenticate.

---

## API Endpoints

### Health

#### Check API Health

```http
GET /health
```

**Description:** Check API and database health status.

**Authentication:** Not required

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-02-05T12:00:00.000Z",
  "environment": "production",
  "database": {
    "status": "connected",
    "test": {
      "success": true,
      "timestamp": "2026-02-05T12:00:00.000Z",
      "version": "PostgreSQL 15.x"
    }
  },
  "lambda": {
    "isLambda": true,
    "region": "us-east-1",
    "memoryLimit": "1024"
  }
}
```

#### Root Endpoint

```http
GET /
```

**Description:** Basic API information.

**Response:**

```json
{
  "message": "Khanflow API is running",
  "version": "1.0.0",
  "status": "healthy"
}
```

---

### Auth Endpoints

#### Register User

```http
POST /api/auth/register
```

**Description:** Create a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd",
  "username": "johndoe",
  "name": "John Doe"
}
```

**Validation Rules:**
- `email`: Valid email format, required
- `password`: Minimum 8 characters, required
- `username`: Alphanumeric, 3-30 characters, required
- `name`: Optional

**Response:** `201 Created`

```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "createdAt": "2026-02-05T12:00:00.000Z"
  }
}
```

#### Login

```http
POST /api/auth/login
```

**Description:** Authenticate user with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Response:** `201 Created`

```json
{
  "message": "User logged in successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-03-05T12:00:00.000Z"
}
```

#### Google Login

```http
POST /api/auth/google
```

**Description:** Authenticate or register user via Google OAuth.

**Request Body:**

```json
{
  "idToken": "google_id_token_here"
}
```

**Response:** `201 Created`

```json
{
  "message": "User logged in with Google successfully",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "username": "user_gmail"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-03-05T12:00:00.000Z"
}
```

#### Microsoft Login

```http
POST /api/auth/microsoft
```

**Description:** Authenticate or register user via Microsoft OAuth.

**Request Body (Option 1 - Authorization Code):**

```json
{
  "code": "authorization_code",
  "redirectUri": "https://khanflow.com/auth/microsoft/callback"
}
```

**Request Body (Option 2 - Access Token):**

```json
{
  "accessToken": "microsoft_access_token"
}
```

**Response:** `201 Created`

```json
{
  "message": "User logged in with Microsoft successfully",
  "user": {
    "id": "uuid",
    "email": "user@outlook.com",
    "username": "user_outlook"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-03-05T12:00:00.000Z"
}
```

---

### Events

Events are scheduling templates that users create and share. Guests can book meetings based on these event templates.

#### Create Event

```http
POST /api/event/create
```

**Authentication:** Required

**Description:** Create a new event template for scheduling.

**Request Body:**

```json
{
  "title": "30-Minute Consultation",
  "slug": "consultation-30",
  "description": "Quick consultation call to discuss your needs",
  "duration": 30,
  "location": "zoom",
  "isPrivate": false,
  "bufferTimeBefore": 0,
  "bufferTimeAfter": 15,
  "availabilityScheduleId": "uuid",
  "color": "#4CAF50"
}
```

**Fields:**
- `title`: Event name (required)
- `slug`: URL-friendly identifier (required, unique per user)
- `description`: Event description (optional)
- `duration`: Duration in minutes (required)
- `location`: Meeting location type: "zoom", "google-meet", "phone", "in-person" (required)
- `isPrivate`: Whether event is publicly accessible (default: false)
- `bufferTimeBefore`: Minutes before the meeting (default: 0)
- `bufferTimeAfter`: Minutes after the meeting (default: 0)
- `availabilityScheduleId`: Associated availability schedule
- `color`: Event color for calendar display

**Response:** `201 Created`

```json
{
  "message": "Event created successfully",
  "event": {
    "id": "uuid",
    "title": "30-Minute Consultation",
    "slug": "consultation-30",
    "duration": 30,
    "location": "zoom",
    "isPrivate": false,
    "createdAt": "2026-02-05T12:00:00.000Z"
  }
}
```

#### Get User Events

```http
GET /api/event/all
```

**Authentication:** Required

**Description:** Retrieve all events for the authenticated user.

**Response:** `200 OK`

```json
{
  "message": "User event fetched successfully",
  "data": {
    "events": [
      {
        "id": "uuid",
        "title": "30-Minute Consultation",
        "slug": "consultation-30",
        "duration": 30,
        "location": "zoom",
        "isPrivate": false,
        "bookingsCount": 12
      }
    ],
    "username": "johndoe"
  }
}
```

#### Get Public Events by Username

```http
GET /api/event/public/:username
```

**Authentication:** Not required

**Description:** Retrieve all public events for a specific user.

**Path Parameters:**
- `username`: User's username

**Example:**
```http
GET /api/event/public/johndoe
```

**Response:** `200 OK`

```json
{
  "message": "Public events fetched successfully",
  "user": {
    "username": "johndoe",
    "name": "John Doe",
    "avatar": "https://..."
  },
  "events": [
    {
      "id": "uuid",
      "title": "30-Minute Consultation",
      "slug": "consultation-30",
      "duration": 30,
      "description": "Quick consultation call"
    }
  ]
}
```

#### Get Public Event Details

```http
GET /api/event/public/:username/:slug
```

**Authentication:** Not required

**Description:** Get detailed information about a specific public event.

**Path Parameters:**
- `username`: User's username
- `slug`: Event slug

**Example:**
```http
GET /api/event/public/johndoe/consultation-30
```

**Response:** `200 OK`

```json
{
  "message": "Event details fetched successfully",
  "event": {
    "id": "uuid",
    "title": "30-Minute Consultation",
    "slug": "consultation-30",
    "description": "Quick consultation call to discuss your needs",
    "duration": 30,
    "location": "zoom",
    "bufferTimeBefore": 0,
    "bufferTimeAfter": 15,
    "user": {
      "username": "johndoe",
      "name": "John Doe"
    }
  }
}
```

#### Toggle Event Privacy

```http
PUT /api/event/toggle-privacy
```

**Authentication:** Required

**Description:** Toggle event between public and private.

**Request Body:**

```json
{
  "eventId": "uuid"
}
```

**Response:** `200 OK`

```json
{
  "message": "Event set to private successfully"
}
```

#### Delete Event

```http
DELETE /api/event/:eventId
```

**Authentication:** Required

**Description:** Delete an event.

**Path Parameters:**
- `eventId`: Event UUID

**Response:** `200 OK`

```json
{
  "message": "Event deleted successfully"
}
```

---

### Meetings

Meetings are actual bookings made by guests on event templates.

#### Get User Meetings

```http
GET /api/meeting/user/all?filter=upcoming
```

**Authentication:** Required

**Description:** Get all meetings for authenticated user.

**Query Parameters:**
- `filter` (optional): `upcoming`, `past`, `cancelled`, `all` (default: `upcoming`)

**Response:** `200 OK`

```json
{
  "message": "Meetings fetched successfully",
  "meetings": [
    {
      "id": "uuid",
      "title": "30-Minute Consultation",
      "startTime": "2026-02-06T15:00:00.000Z",
      "endTime": "2026-02-06T15:30:00.000Z",
      "status": "confirmed",
      "guestEmail": "guest@example.com",
      "guestName": "Jane Smith",
      "location": "zoom",
      "meetingLink": "https://zoom.us/j/123456789",
      "eventId": "uuid"
    }
  ]
}
```

#### Create Meeting (Public)

```http
POST /api/meeting/public/create
```

**Authentication:** Not required

**Description:** Book a meeting on a public event (for guests).

**Request Body:**

```json
{
  "eventId": "uuid",
  "guestName": "Jane Smith",
  "guestEmail": "jane@example.com",
  "startTime": "2026-02-06T15:00:00.000Z",
  "endTime": "2026-02-06T15:30:00.000Z",
  "guestTimezone": "America/New_York",
  "notes": "Looking forward to discussing the project"
}
```

**Response:** `201 Created`

```json
{
  "message": "Meeting scheduled successfully",
  "data": {
    "meetLink": "https://zoom.us/j/123456789",
    "meeting": {
      "id": "uuid",
      "title": "30-Minute Consultation",
      "startTime": "2026-02-06T15:00:00.000Z",
      "endTime": "2026-02-06T15:30:00.000Z",
      "guestEmail": "jane@example.com"
    }
  }
}
```

#### Cancel Meeting

```http
PUT /api/meeting/cancel/:meetingId
```

**Authentication:** Required

**Description:** Cancel a scheduled meeting.

**Path Parameters:**
- `meetingId`: Meeting UUID

**Response:** `200 OK`

```json
{
  "messsage": "Meeting cancelled successfully"
}
```

---

### Availability

Manage user availability schedules and check availability for bookings.

#### Get User Availability

```http
GET /api/availability/me
```

**Authentication:** Required

**Description:** Get authenticated user's availability schedule.

**Response:** `200 OK`

```json
{
  "message": "Availability fetched successfully",
  "availability": {
    "id": "uuid",
    "timezone": "America/New_York",
    "schedule": {
      "monday": [
        { "start": "09:00", "end": "17:00" }
      ],
      "tuesday": [
        { "start": "09:00", "end": "17:00" }
      ],
      "wednesday": [
        { "start": "09:00", "end": "17:00" }
      ],
      "thursday": [
        { "start": "09:00", "end": "17:00" }
      ],
      "friday": [
        { "start": "09:00", "end": "12:00" },
        { "start": "14:00", "end": "17:00" }
      ],
      "saturday": [],
      "sunday": []
    },
    "dateOverrides": [
      {
        "date": "2026-02-10",
        "isAvailable": false,
        "reason": "Holiday"
      }
    ]
  }
}
```

#### Get Public Availability for Event

```http
GET /api/availability/public/:eventId
```

**Authentication:** Not required

**Description:** Get available time slots for booking a public event.

**Path Parameters:**
- `eventId`: Event UUID

**Query Parameters:**
- `startDate`: ISO date string (optional, defaults to today)
- `endDate`: ISO date string (optional, defaults to 30 days from now)
- `timezone`: IANA timezone (optional, defaults to event owner's timezone)

**Example:**
```http
GET /api/availability/public/uuid?startDate=2026-02-06&endDate=2026-02-13&timezone=America/New_York
```

**Response:** `200 OK`

```json
{
  "message": "Availability fetched successfully",
  "availableSlots": [
    {
      "date": "2026-02-06",
      "slots": [
        {
          "start": "2026-02-06T14:00:00.000Z",
          "end": "2026-02-06T14:30:00.000Z"
        },
        {
          "start": "2026-02-06T15:00:00.000Z",
          "end": "2026-02-06T15:30:00.000Z"
        }
      ]
    }
  ],
  "timezone": "America/New_York"
}
```

#### Update Availability

```http
PUT /api/availability/update
```

**Authentication:** Required

**Description:** Update user's availability schedule.

**Request Body:**

```json
{
  "timezone": "America/New_York",
  "schedule": {
    "monday": [
      { "start": "09:00", "end": "17:00" }
    ],
    "tuesday": [
      { "start": "09:00", "end": "17:00" }
    ],
    "wednesday": [],
    "thursday": [
      { "start": "09:00", "end": "17:00" }
    ],
    "friday": [
      { "start": "09:00", "end": "17:00" }
    ],
    "saturday": [],
    "sunday": []
  },
  "dateOverrides": [
    {
      "date": "2026-02-10",
      "isAvailable": false,
      "reason": "Out of office"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "message": "Availability updated successfully",
  "availability": {
    "id": "uuid",
    "timezone": "America/New_York",
    "schedule": { ... }
  }
}
```

---

### Calendar

Manage calendar events across integrated platforms.

#### Get Calendar Events

```http
GET /api/calendar/events?startDate=2026-02-01&endDate=2026-02-28
```

**Authentication:** Required

**Description:** Retrieve calendar events from all connected calendars.

**Query Parameters:**
- `startDate`: ISO date string (required)
- `endDate`: ISO date string (required)
- `calendarIds`: Comma-separated calendar IDs (optional, fetches from all if not specified)

**Response:** `200 OK`

```json
{
  "message": "Calendar events fetched successfully",
  "events": [
    {
      "id": "google_event_123",
      "title": "Team Meeting",
      "start": "2026-02-06T10:00:00.000Z",
      "end": "2026-02-06T11:00:00.000Z",
      "description": "Weekly sync",
      "location": "Conference Room A",
      "attendees": [
        { "email": "john@example.com", "responseStatus": "accepted" }
      ],
      "calendarId": "primary",
      "source": "google",
      "meetingLink": "https://meet.google.com/xyz"
    }
  ]
}
```

#### Create Calendar Event

```http
POST /api/calendar/events
```

**Authentication:** Required

**Description:** Create a new event in the primary calendar.

**Request Body:**

```json
{
  "title": "Project Review",
  "start": "2026-02-10T14:00:00.000Z",
  "end": "2026-02-10T15:00:00.000Z",
  "description": "Review Q1 project progress",
  "location": "Conference Room B",
  "attendees": ["colleague@example.com"],
  "calendarId": "primary",
  "source": "google",
  "sendNotifications": true
}
```

**Response:** `201 Created`

```json
{
  "message": "Event created successfully",
  "event": {
    "id": "google_event_456",
    "title": "Project Review",
    "start": "2026-02-10T14:00:00.000Z",
    "end": "2026-02-10T15:00:00.000Z",
    "meetingLink": "https://meet.google.com/abc"
  }
}
```

#### Update Calendar Event

```http
PUT /api/calendar/events/:eventId
```

**Authentication:** Required

**Description:** Update an existing calendar event.

**Path Parameters:**
- `eventId`: Calendar event ID

**Request Body:**

```json
{
  "title": "Project Review (Updated)",
  "start": "2026-02-10T15:00:00.000Z",
  "end": "2026-02-10T16:00:00.000Z",
  "calendarId": "primary",
  "source": "google"
}
```

**Response:** `200 OK`

```json
{
  "message": "Event updated successfully",
  "event": {
    "id": "google_event_456",
    "title": "Project Review (Updated)",
    "start": "2026-02-10T15:00:00.000Z",
    "end": "2026-02-10T16:00:00.000Z"
  }
}
```

#### Delete Calendar Event

```http
DELETE /api/calendar/events/:eventId?calendarId=primary&source=google
```

**Authentication:** Required

**Description:** Delete a calendar event.

**Path Parameters:**
- `eventId`: Calendar event ID

**Query Parameters:**
- `calendarId`: Calendar identifier (required)
- `source`: Calendar source: "google", "microsoft" (required)

**Response:** `200 OK`

```json
{
  "message": "Event deleted successfully"
}
```

---

### Integrations

Manage third-party integrations (Google, Microsoft, Zoom).

#### Get All Integrations

```http
GET /api/integration/all
```

**Authentication:** Required

**Description:** Get status of all integrations for the user.

**Response:** `200 OK`

```json
{
  "message": "Integrations fetched successfully",
  "integrations": [
    {
      "appType": "google",
      "isConnected": true,
      "connectedAt": "2026-01-15T10:00:00.000Z",
      "email": "user@gmail.com",
      "scopes": ["calendar.events", "calendar.readonly", "tasks"]
    },
    {
      "appType": "microsoft",
      "isConnected": true,
      "connectedAt": "2026-01-20T12:00:00.000Z",
      "email": "user@outlook.com"
    },
    {
      "appType": "zoom",
      "isConnected": false
    }
  ]
}
```

#### Check Integration Status

```http
GET /api/integration/check/:appType
```

**Authentication:** Required

**Description:** Check if a specific integration is connected.

**Path Parameters:**
- `appType`: "google", "microsoft", or "zoom"

**Response:** `200 OK`

```json
{
  "message": "Integration status fetched",
  "appType": "google",
  "isConnected": true,
  "email": "user@gmail.com"
}
```

#### Connect Integration

```http
GET /api/integration/connect/:appType
```

**Authentication:** Required

**Description:** Initiate OAuth flow for connecting an integration.

**Path Parameters:**
- `appType`: "google", "microsoft", or "zoom"

**Response:** `302 Redirect`

Redirects to OAuth provider's authorization page.

#### Disconnect Integration

```http
DELETE /api/integration/disconnect/:appType
```

**Authentication:** Required

**Description:** Disconnect an integration and revoke access.

**Path Parameters:**
- `appType`: "google", "microsoft", or "zoom"

**Response:** `200 OK`

```json
{
  "message": "Integration disconnected successfully",
  "appType": "google"
}
```

#### OAuth Callbacks

These endpoints handle OAuth redirects from providers.

**Google Callback:**
```http
GET /api/integration/google/callback?code=auth_code&state=user_state
```

**Microsoft Callback:**
```http
GET /api/integration/microsoft/callback?code=auth_code&state=user_state
```

**Zoom Callback:**
```http
GET /api/integration/zoom/callback?code=auth_code&state=user_state
```

These redirect to the frontend with success/error status.

#### List Calendars

```http
GET /api/integration/calendars/:appType
```

**Authentication:** Required

**Description:** List all calendars from a connected integration.

**Path Parameters:**
- `appType`: "google" or "microsoft"

**Response:** `200 OK`

```json
{
  "message": "Calendars fetched successfully",
  "calendars": [
    {
      "id": "primary",
      "name": "Primary Calendar",
      "isPrimary": true,
      "accessRole": "owner",
      "color": "#1E88E5"
    },
    {
      "id": "work_calendar",
      "name": "Work",
      "isPrimary": false,
      "accessRole": "owner",
      "color": "#F4511E"
    }
  ]
}
```

#### Select Calendars for Sync

```http
PUT /api/integration/calendars/:appType/select
```

**Authentication:** Required

**Description:** Select which calendars to sync for availability checking.

**Path Parameters:**
- `appType`: "google" or "microsoft"

**Request Body:**

```json
{
  "calendarIds": ["primary", "work_calendar"]
}
```

**Response:** `200 OK`

```json
{
  "message": "Calendar selection saved successfully",
  "selectedCalendars": ["primary", "work_calendar"]
}
```

#### Get Calendar Preferences

```http
GET /api/integration/calendar-preferences
```

**Authentication:** Required

**Description:** Get user's calendar preferences and sync settings.

**Response:** `200 OK`

```json
{
  "message": "Preferences fetched successfully",
  "preferences": {
    "primaryCalendar": {
      "source": "google",
      "calendarId": "primary"
    },
    "selectedCalendars": {
      "google": ["primary", "work_calendar"],
      "microsoft": ["Calendar"]
    },
    "checkConflicts": true,
    "autoCreateMeetings": true
  }
}
```

#### Save Calendar Preferences

```http
PUT /api/integration/calendar-preferences
```

**Authentication:** Required

**Description:** Update calendar preferences.

**Request Body:**

```json
{
  "primaryCalendar": {
    "source": "google",
    "calendarId": "primary"
  },
  "checkConflicts": true,
  "autoCreateMeetings": true
}
```

**Response:** `200 OK`

```json
{
  "message": "Preferences updated successfully"
}
```

---

### AI Calendar & Tasks

AI-powered task management and calendar optimization with Google Tasks integration.

#### Get Task Recommendations

```http
GET /api/ai-calendar/recommendations
```

**Authentication:** Required

**Description:** Get AI-powered task recommendations based on calendar and priorities.

**Query Parameters:**
- `date`: ISO date string (optional, defaults to today)
- `limit`: Number of recommendations (optional, default: 10)

**Response:** `200 OK`

```json
{
  "message": "Recommendations fetched successfully",
  "recommendations": [
    {
      "taskId": "task_123",
      "title": "Review Q1 report",
      "priority": "high",
      "estimatedDuration": 60,
      "suggestedTime": "2026-02-06T14:00:00.000Z",
      "reasoning": "Based on deadline and calendar availability"
    }
  ],
  "generatedAt": "2026-02-05T12:00:00.000Z"
}
```

#### Analyze Tasks

```http
POST /api/ai-calendar/analyze-tasks
```

**Authentication:** Required

**Description:** Analyze specific tasks with AI to get time estimates and suggestions.

**Request Body:**

```json
{
  "tasks": [
    {
      "id": "task_123",
      "title": "Write project proposal",
      "description": "Draft proposal for client project"
    },
    {
      "id": "task_456",
      "title": "Review code PR"
    }
  ]
}
```

**Response:** `200 OK`

```json
{
  "message": "Tasks analyzed successfully",
  "analysis": [
    {
      "taskId": "task_123",
      "estimatedDuration": 120,
      "complexity": "medium",
      "suggestedBreakdown": [
        "Research requirements (30 min)",
        "Draft outline (30 min)",
        "Write content (60 min)"
      ],
      "recommendedTime": "morning"
    }
  ]
}
```

#### Create Calendar Blocks for Tasks

```http
POST /api/ai-calendar/create-blocks
```

**Authentication:** Required

**Description:** Automatically create calendar blocks for tasks.

**Request Body:**

```json
{
  "tasks": [
    {
      "taskId": "task_123",
      "title": "Write project proposal",
      "duration": 120,
      "preferredDate": "2026-02-06"
    }
  ],
  "preferences": {
    "workingHoursOnly": true,
    "avoidLunchTime": true,
    "preferMornings": false
  }
}
```

**Response:** `201 Created`

```json
{
  "message": "Calendar blocks created successfully",
  "blocks": [
    {
      "taskId": "task_123",
      "eventId": "calendar_event_789",
      "title": "🎯 Write project proposal",
      "start": "2026-02-06T14:00:00.000Z",
      "end": "2026-02-06T16:00:00.000Z",
      "calendarId": "primary"
    }
  ]
}
```

#### Get Task Lists (Google Tasks)

```http
GET /api/ai-calendar/task-lists
```

**Authentication:** Required (Google integration required)

**Description:** Get all Google Task lists.

**Response:** `200 OK`

```json
{
  "message": "Task lists fetched successfully",
  "taskLists": [
    {
      "id": "tasklist_123",
      "title": "My Tasks",
      "updated": "2026-02-05T12:00:00.000Z"
    },
    {
      "id": "tasklist_456",
      "title": "Work Tasks",
      "updated": "2026-02-04T10:00:00.000Z"
    }
  ]
}
```

#### Get Tasks from List

```http
GET /api/ai-calendar/tasks/:taskListId
```

**Authentication:** Required

**Description:** Get all tasks from a specific Google Task list.

**Path Parameters:**
- `taskListId`: Task list ID

**Response:** `200 OK`

```json
{
  "message": "Tasks fetched successfully",
  "tasks": [
    {
      "id": "task_123",
      "title": "Review Q1 report",
      "notes": "Check financials and metrics",
      "status": "needsAction",
      "due": "2026-02-10T00:00:00.000Z",
      "completed": null,
      "parent": null,
      "position": "00000000000000000001"
    }
  ]
}
```

#### Get All Tasks

```http
GET /api/ai-calendar/tasks
```

**Authentication:** Required

**Description:** Get all tasks from all Google Task lists.

**Response:** `200 OK`

```json
{
  "message": "All tasks fetched successfully",
  "taskLists": [
    {
      "listId": "tasklist_123",
      "listTitle": "My Tasks",
      "tasks": [...]
    }
  ]
}
```

#### Create Task

```http
POST /api/ai-calendar/tasks
```

**Authentication:** Required

**Description:** Create a new Google Task.

**Request Body:**

```json
{
  "taskListId": "tasklist_123",
  "title": "Complete project documentation",
  "notes": "Include API docs and user guide",
  "due": "2026-02-15T00:00:00.000Z"
}
```

**Response:** `201 Created`

```json
{
  "message": "Task created successfully",
  "task": {
    "id": "task_789",
    "title": "Complete project documentation",
    "status": "needsAction",
    "due": "2026-02-15T00:00:00.000Z"
  }
}
```

#### Update Task

```http
PUT /api/ai-calendar/tasks/:taskListId/:taskId
```

**Authentication:** Required

**Description:** Update an existing Google Task.

**Path Parameters:**
- `taskListId`: Task list ID
- `taskId`: Task ID

**Request Body:**

```json
{
  "title": "Complete project documentation (Updated)",
  "notes": "Focus on API documentation first",
  "status": "needsAction",
  "due": "2026-02-20T00:00:00.000Z"
}
```

**Response:** `200 OK`

```json
{
  "message": "Task updated successfully",
  "task": {
    "id": "task_789",
    "title": "Complete project documentation (Updated)",
    "due": "2026-02-20T00:00:00.000Z"
  }
}
```

#### Delete Task

```http
DELETE /api/ai-calendar/tasks/:taskListId/:taskId
```

**Authentication:** Required

**Description:** Delete a Google Task.

**Path Parameters:**
- `taskListId`: Task list ID
- `taskId`: Task ID

**Response:** `200 OK`

```json
{
  "message": "Task deleted successfully"
}
```

#### Complete Task

```http
POST /api/ai-calendar/tasks/:taskListId/:taskId/complete
```

**Authentication:** Required

**Description:** Mark a Google Task as completed.

**Path Parameters:**
- `taskListId`: Task list ID
- `taskId`: Task ID

**Response:** `200 OK`

```json
{
  "message": "Task marked as completed",
  "task": {
    "id": "task_789",
    "title": "Complete project documentation",
    "status": "completed",
    "completed": "2026-02-05T12:00:00.000Z"
  }
}
```

---

### Microsoft Todo

Microsoft Todo task management integration.

#### Get Task Lists

```http
GET /api/microsoft-todo/task-lists
```

**Authentication:** Required (Microsoft integration required)

**Description:** Get all Microsoft Todo task lists.

**Response:** `200 OK`

```json
{
  "message": "Task lists fetched successfully",
  "taskLists": [
    {
      "id": "list_123",
      "displayName": "Tasks",
      "isOwner": true,
      "isShared": false,
      "wellknownListName": "defaultList"
    }
  ]
}
```

#### Get Tasks from List

```http
GET /api/microsoft-todo/tasks/:taskListId
```

**Authentication:** Required

**Description:** Get all tasks from a Microsoft Todo list.

**Path Parameters:**
- `taskListId`: Task list ID

**Response:** `200 OK`

```json
{
  "message": "Tasks fetched successfully",
  "tasks": [
    {
      "id": "task_123",
      "title": "Prepare presentation",
      "body": {
        "content": "Slides for Q1 review",
        "contentType": "text"
      },
      "status": "notStarted",
      "importance": "high",
      "dueDateTime": {
        "dateTime": "2026-02-10T00:00:00.000Z",
        "timeZone": "UTC"
      },
      "completedDateTime": null
    }
  ]
}
```

#### Get All Tasks

```http
GET /api/microsoft-todo/tasks
```

**Authentication:** Required

**Description:** Get all tasks from all Microsoft Todo lists.

**Response:** `200 OK`

```json
{
  "message": "All tasks fetched successfully",
  "taskLists": [
    {
      "listId": "list_123",
      "listTitle": "Tasks",
      "tasks": [...]
    }
  ]
}
```

#### Create Task

```http
POST /api/microsoft-todo/tasks
```

**Authentication:** Required

**Description:** Create a new Microsoft Todo task.

**Request Body:**

```json
{
  "taskListId": "list_123",
  "title": "Review budget proposal",
  "body": "Check Q2 budget allocations",
  "importance": "high",
  "dueDateTime": "2026-02-12T00:00:00.000Z"
}
```

**Response:** `201 Created`

```json
{
  "message": "Task created successfully",
  "task": {
    "id": "task_456",
    "title": "Review budget proposal",
    "status": "notStarted",
    "importance": "high"
  }
}
```

#### Update Task

```http
PUT /api/microsoft-todo/tasks/:taskListId/:taskId
```

**Authentication:** Required

**Description:** Update a Microsoft Todo task.

**Path Parameters:**
- `taskListId`: Task list ID
- `taskId`: Task ID

**Request Body:**

```json
{
  "title": "Review budget proposal (Updated)",
  "status": "inProgress",
  "importance": "high"
}
```

**Response:** `200 OK`

```json
{
  "message": "Task updated successfully",
  "task": {
    "id": "task_456",
    "title": "Review budget proposal (Updated)",
    "status": "inProgress"
  }
}
```

#### Delete Task

```http
DELETE /api/microsoft-todo/tasks/:taskListId/:taskId
```

**Authentication:** Required

**Description:** Delete a Microsoft Todo task.

**Path Parameters:**
- `taskListId`: Task list ID
- `taskId`: Task ID

**Response:** `200 OK`

```json
{
  "message": "Task deleted successfully"
}
```

#### Complete Task

```http
POST /api/microsoft-todo/tasks/:taskListId/:taskId/complete
```

**Authentication:** Required

**Description:** Mark a Microsoft Todo task as completed.

**Path Parameters:**
- `taskListId`: Task list ID
- `taskId`: Task ID

**Response:** `200 OK`

```json
{
  "message": "Task marked as completed",
  "task": {
    "id": "task_456",
    "title": "Review budget proposal",
    "status": "completed",
    "completedDateTime": {
      "dateTime": "2026-02-05T12:00:00.000Z"
    }
  }
}
```

---

### Voice Assistant

Natural language voice command processing for calendar and task management.

#### Transcribe Audio

```http
POST /api/voice/transcribe
```

**Authentication:** Required

**Description:** Convert audio to text using speech recognition.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `audio`: Audio file (supported formats: WAV, MP3, M4A, WEBM)

**Response:** `200 OK`

```json
{
  "message": "Audio transcribed successfully",
  "transcript": "Schedule a meeting with John tomorrow at 2 PM for 30 minutes"
}
```

#### Parse Transcript

```http
POST /api/voice/parse
```

**Authentication:** Required

**Description:** Parse transcript into structured JSON for action execution.

**Request Body:**

```json
{
  "transcript": "Schedule a meeting with John tomorrow at 2 PM for 30 minutes"
}
```

**Response:** `200 OK`

```json
{
  "message": "Transcript parsed successfully",
  "parsed": {
    "action": "create_event",
    "parameters": {
      "title": "Meeting with John",
      "start": "2026-02-06T14:00:00.000Z",
      "duration": 30,
      "attendees": ["john"]
    },
    "confidence": 0.95
  }
}
```

#### Parse Intent Command

```http
POST /api/voice/intent/parse
```

**Authentication:** Required

**Description:** Parse transcript specifically for intent/task creation in the life organization system.

**Request Body:**

```json
{
  "transcript": "Add a task to learn Spanish for personal development"
}
```

**Response:** `200 OK`

```json
{
  "message": "Intent parsed successfully",
  "options": [
    {
      "title": "Learn Spanish",
      "lifeArea": "Personal Development",
      "board": "Skills & Learning",
      "confidence": 0.92
    },
    {
      "title": "Practice Spanish daily",
      "lifeArea": "Personal Development",
      "board": "Habits",
      "confidence": 0.78
    }
  ]
}
```

#### Create Intent from Voice

```http
POST /api/voice/intent/create
```

**Authentication:** Required

**Description:** Create an intent directly from voice command.

**Request Body:**

```json
{
  "transcript": "Add a task to learn Spanish for personal development"
}
```

**Response:** `201 Created`

```json
{
  "message": "Intent created successfully",
  "intent": {
    "id": "intent_123",
    "title": "Learn Spanish",
    "lifeAreaId": "area_456",
    "boardId": "board_789",
    "status": "not_started"
  }
}
```

#### Create Intent from Option

```http
POST /api/voice/intent/create-from-option
```

**Authentication:** Required

**Description:** Create intent from one of the parsed options.

**Request Body:**

```json
{
  "optionIndex": 0,
  "parsedOptions": [
    {
      "title": "Learn Spanish",
      "lifeArea": "Personal Development",
      "board": "Skills & Learning"
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "message": "Intent created successfully",
  "intent": {
    "id": "intent_123",
    "title": "Learn Spanish",
    "status": "not_started"
  }
}
```

---

### Actions

Execute and manage voice-commanded actions.

#### Execute Action

```http
POST /api/actions/execute
```

**Authentication:** Required

**Description:** Execute a parsed action from voice command.

**Request Body:**

```json
{
  "action": "create_event",
  "parameters": {
    "title": "Team Standup",
    "start": "2026-02-06T09:00:00.000Z",
    "duration": 15,
    "recurrence": "daily"
  }
}
```

**Supported Actions:**
- `create_event`: Create calendar event
- `update_event`: Update existing event
- `delete_event`: Delete event
- `create_task`: Create task
- `complete_task`: Mark task complete
- `check_availability`: Check calendar availability
- `create_intent`: Create life organization intent

**Response:** `200 OK`

```json
{
  "message": "Action executed successfully",
  "result": {
    "eventId": "event_123",
    "title": "Team Standup",
    "start": "2026-02-06T09:00:00.000Z",
    "recurrenceCreated": true
  },
  "actionId": "action_789"
}
```

#### Undo Action

```http
POST /api/actions/undo
```

**Authentication:** Required

**Description:** Undo the last executed action.

**Request Body:**

```json
{
  "actionId": "action_789"
}
```

**Response:** `200 OK`

```json
{
  "message": "Action undone successfully",
  "undoneAction": {
    "actionId": "action_789",
    "type": "create_event",
    "timestamp": "2026-02-05T12:00:00.000Z"
  }
}
```

---

### Life Organization

Intent-based life organization system with AI-powered suggestions.

#### Get Life Areas

```http
GET /api/life-organization/life-areas
```

**Authentication:** Required

**Description:** Get all life areas for the user.

**Response:** `200 OK`

```json
{
  "message": "Life areas fetched successfully",
  "lifeAreas": [
    {
      "id": "area_123",
      "name": "Career",
      "color": "#1976D2",
      "order": 1,
      "boards": [
        {
          "id": "board_456",
          "name": "Current Projects",
          "order": 1,
          "intentCount": 5
        }
      ]
    },
    {
      "id": "area_789",
      "name": "Health & Fitness",
      "color": "#388E3C",
      "order": 2,
      "boards": []
    }
  ]
}
```

#### Create Life Area

```http
POST /api/life-organization/life-areas
```

**Authentication:** Required

**Description:** Create a new life area.

**Request Body:**

```json
{
  "name": "Personal Finance",
  "color": "#F57C00",
  "order": 3
}
```

**Response:** `201 Created`

```json
{
  "message": "Life area created successfully",
  "lifeArea": {
    "id": "area_999",
    "name": "Personal Finance",
    "color": "#F57C00",
    "order": 3
  }
}
```

#### Update Life Area

```http
PUT /api/life-organization/life-areas/:id
```

**Authentication:** Required

**Description:** Update a life area.

**Path Parameters:**
- `id`: Life area ID

**Request Body:**

```json
{
  "name": "Finance & Investments",
  "color": "#E65100"
}
```

**Response:** `200 OK`

```json
{
  "message": "Life area updated successfully",
  "lifeArea": {
    "id": "area_999",
    "name": "Finance & Investments",
    "color": "#E65100"
  }
}
```

#### Delete Life Area

```http
DELETE /api/life-organization/life-areas/:id
```

**Authentication:** Required

**Description:** Delete a life area and all its boards/intents.

**Path Parameters:**
- `id`: Life area ID

**Response:** `200 OK`

```json
{
  "message": "Life area deleted successfully"
}
```

#### Create Intent Board

```http
POST /api/life-organization/intent-boards
```

**Authentication:** Required

**Description:** Create a new intent board within a life area.

**Request Body:**

```json
{
  "name": "Q1 Goals",
  "lifeAreaId": "area_123",
  "description": "Goals for first quarter",
  "order": 1
}
```

**Response:** `201 Created`

```json
{
  "message": "Intent board created successfully",
  "board": {
    "id": "board_888",
    "name": "Q1 Goals",
    "lifeAreaId": "area_123",
    "order": 1
  }
}
```

#### Update Intent Board

```http
PUT /api/life-organization/intent-boards/:id
```

**Authentication:** Required

**Description:** Update an intent board.

**Path Parameters:**
- `id`: Board ID

**Request Body:**

```json
{
  "name": "Q1 2026 Goals",
  "description": "Updated goals for Q1"
}
```

**Response:** `200 OK`

```json
{
  "message": "Intent board updated successfully"
}
```

#### Delete Intent Board

```http
DELETE /api/life-organization/intent-boards/:id
```

**Authentication:** Required

**Description:** Delete an intent board and all its intents.

**Path Parameters:**
- `id`: Board ID

**Response:** `200 OK`

```json
{
  "message": "Intent board deleted successfully"
}
```

#### Create Intent

```http
POST /api/life-organization/intents
```

**Authentication:** Required

**Description:** Create a new intent (task/goal).

**Request Body:**

```json
{
  "title": "Complete React certification",
  "boardId": "board_456",
  "description": "Finish online React course and get certified",
  "priority": "high",
  "status": "not_started",
  "dueDate": "2026-03-31T00:00:00.000Z",
  "estimatedDuration": 30,
  "tags": ["learning", "programming"]
}
```

**Response:** `201 Created`

```json
{
  "message": "Intent created successfully",
  "intent": {
    "id": "intent_777",
    "title": "Complete React certification",
    "boardId": "board_456",
    "status": "not_started",
    "priority": "high",
    "createdAt": "2026-02-05T12:00:00.000Z"
  }
}
```

#### Update Intent

```http
PUT /api/life-organization/intents/:id
```

**Authentication:** Required

**Description:** Update an intent.

**Path Parameters:**
- `id`: Intent ID

**Request Body:**

```json
{
  "title": "Complete React certification",
  "status": "in_progress",
  "progress": 45,
  "notes": "Completed modules 1-5"
}
```

**Response:** `200 OK`

```json
{
  "message": "Intent updated successfully",
  "intent": {
    "id": "intent_777",
    "status": "in_progress",
    "progress": 45
  }
}
```

#### Delete Intent

```http
DELETE /api/life-organization/intents/:id
```

**Authentication:** Required

**Description:** Delete an intent.

**Path Parameters:**
- `id`: Intent ID

**Response:** `200 OK`

```json
{
  "message": "Intent deleted successfully"
}
```

#### Get Intents by Board

```http
GET /api/life-organization/intent-boards/:id/intents
```

**Authentication:** Required

**Description:** Get all intents for a specific board.

**Path Parameters:**
- `id`: Board ID

**Query Parameters:**
- `status`: Filter by status: "not_started", "in_progress", "completed", "on_hold" (optional)
- `priority`: Filter by priority: "low", "medium", "high" (optional)

**Response:** `200 OK`

```json
{
  "message": "Intents fetched successfully",
  "intents": [
    {
      "id": "intent_777",
      "title": "Complete React certification",
      "status": "in_progress",
      "priority": "high",
      "progress": 45,
      "dueDate": "2026-03-31T00:00:00.000Z"
    }
  ]
}
```

#### Get Suggestions

```http
GET /api/life-organization/suggestions
```

**Authentication:** Required

**Description:** Get AI-powered suggestions for task scheduling and organization.

**Query Parameters:**
- `date`: ISO date string (optional, defaults to today)
- `limit`: Number of suggestions (optional, default: 10)

**Response:** `200 OK`

```json
{
  "message": "Suggestions fetched successfully",
  "suggestions": [
    {
      "id": "suggestion_111",
      "type": "schedule_intent",
      "intentId": "intent_777",
      "title": "Schedule time for React certification",
      "suggestedTime": "2026-02-06T09:00:00.000Z",
      "duration": 120,
      "reasoning": "You have a 2-hour free block and this is a high-priority task",
      "confidence": 0.88,
      "status": "pending"
    },
    {
      "id": "suggestion_222",
      "type": "task_breakdown",
      "intentId": "intent_888",
      "title": "Break down project planning into smaller tasks",
      "reasoning": "Large tasks are more manageable when split",
      "confidence": 0.75,
      "status": "pending"
    }
  ]
}
```

#### Generate Suggestions

```http
POST /api/life-organization/suggestions/generate
```

**Authentication:** Required

**Description:** Trigger AI to generate new suggestions.

**Request Body:**

```json
{
  "includeCalendar": true,
  "includeTasks": true,
  "lookAheadDays": 7
}
```

**Response:** `200 OK`

```json
{
  "message": "Suggestions generated successfully",
  "count": 8,
  "suggestions": [...]
}
```

#### Accept Suggestion

```http
POST /api/life-organization/suggestions/:id/accept
```

**Authentication:** Required

**Description:** Accept and execute a suggestion.

**Path Parameters:**
- `id`: Suggestion ID

**Response:** `200 OK`

```json
{
  "message": "Suggestion accepted and executed",
  "result": {
    "eventCreated": true,
    "eventId": "event_999"
  }
}
```

#### Snooze Suggestion

```http
POST /api/life-organization/suggestions/:id/snooze
```

**Authentication:** Required

**Description:** Snooze a suggestion for later.

**Path Parameters:**
- `id`: Suggestion ID

**Request Body:**

```json
{
  "snoozeDuration": 86400
}
```

**Response:** `200 OK`

```json
{
  "message": "Suggestion snoozed",
  "snoozeUntil": "2026-02-06T12:00:00.000Z"
}
```

#### Ignore Suggestion

```http
POST /api/life-organization/suggestions/:id/ignore
```

**Authentication:** Required

**Description:** Permanently ignore a suggestion.

**Path Parameters:**
- `id`: Suggestion ID

**Response:** `200 OK`

```json
{
  "message": "Suggestion ignored"
}
```

#### Sync Providers

```http
POST /api/life-organization/provider/sync
```

**Authentication:** Required

**Description:** Sync tasks and events from connected providers (Google, Microsoft).

**Request Body:**

```json
{
  "providers": ["google", "microsoft"],
  "syncTasks": true,
  "syncCalendar": true
}
```

**Response:** `200 OK`

```json
{
  "message": "Providers synced successfully",
  "synced": {
    "google": {
      "tasks": 12,
      "events": 8
    },
    "microsoft": {
      "tasks": 5,
      "events": 3
    }
  }
}
```

#### Get Onboarding Questions

```http
GET /api/life-organization/onboarding/questions
```

**Authentication:** Required

**Description:** Get onboarding questions for new users.

**Response:** `200 OK`

```json
{
  "message": "Onboarding questions fetched",
  "questions": [
    {
      "id": "q1",
      "question": "What are your main life priorities?",
      "type": "multiple_choice",
      "options": ["Career", "Health", "Relationships", "Finance", "Personal Growth"]
    },
    {
      "id": "q2",
      "question": "How do you prefer to organize your tasks?",
      "type": "single_choice",
      "options": ["By project", "By priority", "By deadline", "By area of life"]
    }
  ]
}
```

#### Complete Onboarding

```http
POST /api/life-organization/onboarding/complete
```

**Authentication:** Required

**Description:** Submit onboarding answers and initialize user's life organization.

**Request Body:**

```json
{
  "answers": {
    "q1": ["Career", "Health", "Personal Growth"],
    "q2": "By area of life"
  },
  "preferences": {
    "enableSuggestions": true,
    "workingHours": {
      "start": "09:00",
      "end": "17:00"
    }
  }
}
```

**Response:** `201 Created`

```json
{
  "message": "Onboarding completed successfully",
  "lifeAreas": [
    {
      "id": "area_123",
      "name": "Career",
      "boards": [...]
    }
  ]
}
```

#### Get Onboarding Status

```http
GET /api/life-organization/onboarding/status
```

**Authentication:** Required

**Description:** Check if user has completed onboarding.

**Response:** `200 OK`

```json
{
  "message": "Onboarding status fetched",
  "isComplete": true,
  "completedAt": "2026-01-15T10:00:00.000Z"
}
```

#### Mark Onboarding Complete

```http
POST /api/life-organization/onboarding/mark-complete
```

**Authentication:** Required

**Description:** Manually mark onboarding as complete.

**Response:** `200 OK`

```json
{
  "message": "Onboarding marked as complete"
}
```

#### Reset Onboarding Status

```http
POST /api/life-organization/onboarding/reset
```

**Authentication:** Required

**Description:** Reset onboarding status to start over.

**Response:** `200 OK`

```json
{
  "message": "Onboarding reset successfully"
}
```

#### Seed Life Organization

```http
POST /api/life-organization/seed
```

**Authentication:** Required

**Description:** Populate user's life organization with example data for demo/testing.

**Response:** `201 Created`

```json
{
  "message": "Life organization seeded successfully",
  "created": {
    "lifeAreas": 4,
    "boards": 8,
    "intents": 15
  }
}
```

#### Remove Example Intents

```http
POST /api/life-organization/remove-examples
```

**Authentication:** Required

**Description:** Remove example/demo intents from life organization.

**Response:** `200 OK`

```json
{
  "message": "Example intents removed successfully",
  "removed": 15
}
```

#### Clear Life Organization

```http
POST /api/life-organization/clear
```

**Authentication:** Required

**Description:** Delete all life organization data for the user.

**Warning:** This action cannot be undone.

**Response:** `200 OK`

```json
{
  "message": "Life organization cleared successfully"
}
```

#### Get Templates

```http
GET /api/life-organization/templates
```

**Authentication:** Required

**Description:** Get pre-built templates for life areas and boards.

**Response:** `200 OK`

```json
{
  "message": "Templates fetched successfully",
  "templates": [
    {
      "id": "career_template",
      "name": "Career Development",
      "lifeAreas": [
        {
          "name": "Professional Growth",
          "boards": ["Current Projects", "Skills to Learn", "Career Goals"]
        }
      ]
    },
    {
      "id": "wellness_template",
      "name": "Health & Wellness",
      "lifeAreas": [
        {
          "name": "Physical Health",
          "boards": ["Fitness Goals", "Nutrition", "Sleep Tracking"]
        }
      ]
    }
  ]
}
```

#### Import Task

```http
POST /api/life-organization/import-task
```

**Authentication:** Required

**Description:** Import a task from external provider (Google Tasks/Microsoft Todo) into life organization.

**Request Body:**

```json
{
  "provider": "google",
  "taskId": "task_123",
  "taskListId": "tasklist_456",
  "boardId": "board_789"
}
```

**Response:** `201 Created`

```json
{
  "message": "Task imported successfully",
  "intent": {
    "id": "intent_999",
    "title": "Imported: Review Q1 report",
    "boardId": "board_789",
    "sourceProvider": "google",
    "sourceTaskId": "task_123"
  }
}
```

#### Reorder Boards

```http
POST /api/life-organization/reorder-boards
```

**Authentication:** Required

**Description:** Change the order of boards within a life area.

**Request Body:**

```json
{
  "lifeAreaId": "area_123",
  "boardOrder": [
    { "id": "board_456", "order": 1 },
    { "id": "board_789", "order": 2 },
    { "id": "board_888", "order": 3 }
  ]
}
```

**Response:** `200 OK`

```json
{
  "message": "Boards reordered successfully"
}
```

#### Move Intent

```http
POST /api/life-organization/move-intent
```

**Authentication:** Required

**Description:** Move an intent to a different board.

**Request Body:**

```json
{
  "intentId": "intent_777",
  "targetBoardId": "board_999",
  "position": 2
}
```

**Response:** `200 OK`

```json
{
  "message": "Intent moved successfully",
  "intent": {
    "id": "intent_777",
    "boardId": "board_999",
    "order": 2
  }
}
```

---

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2026-02-05T12:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing or invalid token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists |
| `422` | Unprocessable Entity - Validation error |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |
| `503` | Service Unavailable |

### Common Error Examples

#### Authentication Error
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Authentication required",
  "timestamp": "2026-02-05T12:00:00.000Z"
}
```

#### Validation Error
```json
{
  "status": "error",
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "timestamp": "2026-02-05T12:00:00.000Z"
}
```

#### Not Found Error
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Event not found",
  "timestamp": "2026-02-05T12:00:00.000Z"
}
```

#### Rate Limit Error
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60,
  "timestamp": "2026-02-05T12:00:00.000Z"
}
```

---

## Rate Limiting

### Current Limits

- **Authenticated Endpoints**: 100 requests per minute per user
- **Public Endpoints**: 20 requests per minute per IP
- **OAuth Callbacks**: 10 requests per minute per IP

### Rate Limit Headers

Responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707139200
```

### Exceeding Limits

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response with a `Retry-After` header indicating when you can retry.

---

## Best Practices

### 1. Use Appropriate Authentication

- Always include JWT token for authenticated endpoints
- Refresh tokens before expiration
- Securely store tokens on the client side

### 2. Handle Errors Gracefully

- Check HTTP status codes
- Parse error messages for user feedback
- Implement retry logic for 5xx errors

### 3. Optimize Requests

- Use query parameters to filter data
- Request only needed fields when available
- Cache responses when appropriate

### 4. Respect Rate Limits

- Monitor rate limit headers
- Implement exponential backoff
- Batch operations when possible

### 5. Timezone Handling

- Always send dates in ISO 8601 format
- Include timezone information
- Use UTC for storage, convert for display

### 6. Webhook Best Practices

- Validate webhook signatures
- Respond quickly (within 5 seconds)
- Process data asynchronously
- Implement idempotency

---

## Support

- **Documentation**: [https://khanflow.com/docs](https://khanflow.com/docs)
- **Support Email**: support@khanflow.com
- **Status Page**: [https://status.khanflow.com](https://status.khanflow.com)

---

**Last Updated:** February 5, 2026  
**API Version:** 1.0.0
