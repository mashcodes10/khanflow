# New Frontend - Backend Integration Guide

## Overview

The new frontend (`new-frontend/`) has been fully integrated with the backend API. All pages now use real API calls instead of mock data.

## Setup

### 1. Install Dependencies

```bash
cd new-frontend
npm install
```

### 2. Environment Configuration

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

## Integrated Pages

### ✅ Integrations Page (`/integrations`)
- Fetches real integrations from backend
- Connect/disconnect functionality
- Calendar preferences management
- Calendar selection modal

### ✅ Meetings Page (`/meetings`)
- Fetches meetings from backend with filtering (UPCOMING, PAST, CANCELLED)
- Cancel meeting functionality
- Real-time date grouping and formatting
- Status mapping from backend to frontend

### ✅ Availability Page (`/availability`)
- Fetches current availability settings
- Save/update availability
- Weekly schedule editor connected to backend

### ✅ Scheduling Page (`/scheduling`)
- Fetches event types from backend
- Toggle privacy functionality
- Delete event types
- Copy booking links

### ✅ Voice Assistant Page (`/voice-assistant`)
- Audio transcription via backend
- Voice command parsing
- Task/event/intent creation
- Clarification options support

### ✅ Life Organization Page (`/`)
- Fetches life areas and intent boards
- Fetches AI suggestions
- Accept/ignore suggestions
- Real-time data updates

## API Client Structure

### Files Created:
- `lib/get-env.ts` - Environment configuration
- `lib/axios-client.ts` - Axios instance with auth interceptors
- `lib/types.ts` - TypeScript types matching backend
- `lib/api.ts` - Complete API service layer

### API Modules:
- `authAPI` - Authentication
- `eventsAPI` - Event types management
- `meetingsAPI` - Meetings CRUD
- `integrationsAPI` - Integration management
- `availabilityAPI` - Availability settings
- `tasksAPI` - Google Tasks
- `microsoftTodoAPI` - Microsoft To Do
- `voiceAPI` - Voice assistant
- `lifeOrganizationAPI` - Life areas, intents, suggestions

## React Query Integration

- `QueryProvider` added to root layout
- All data fetching uses `useQuery`
- Mutations use `useMutation` with proper error handling
- Automatic cache invalidation on mutations

## Authentication

- JWT tokens stored in `localStorage` as `accessToken`
- Automatic token injection in API requests
- 401 errors redirect to `/auth/signin`
- Token refresh handled automatically

## Error Handling

- Toast notifications for all API errors
- Loading states for async operations
- Graceful fallbacks for empty states
- Network error handling

## Next Steps

1. Add authentication pages (signin/signup) if not present
2. Add user profile management
3. Test all API endpoints
4. Add error boundaries for better error handling
5. Add loading skeletons for better UX
