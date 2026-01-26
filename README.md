# Khanflow

Full-stack application for Khanflow.

## Structure

- `backend/` - Express.js backend API
- `new-frontend/` - Next.js frontend application (current, integrated with backend)
- `old-frontend/` - Next.js frontend application (previous version)

## Setup

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend (new-frontend) - **CURRENT**
```bash
cd new-frontend
npm install
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
# NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
npm run dev
```

### Frontend (old-frontend) - Legacy
```bash
cd old-frontend
npm install
npm run dev
```

## Features

- **Integrations**: Connect Google Calendar, Outlook, Zoom, Teams, Google Tasks, Microsoft To Do
- **Meetings**: View, filter, and manage meetings
- **Scheduling**: Create and manage event types
- **Availability**: Set weekly availability schedules
- **Voice Assistant**: Create tasks and events via voice commands
- **Life Organization**: Organize intentions with life areas and intent boards
- **AI Suggestions**: Get personalized suggestions based on your life areas
