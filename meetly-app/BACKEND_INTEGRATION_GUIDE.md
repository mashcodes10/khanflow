# Meetly App - Backend Integration Guide

## ✅ What's Been Implemented

### 1. **API Service Layer** (`lib/api.ts`)
- Complete API client with axios
- Authentication token management
- Error handling and 401 redirect
- Organized API endpoints:
  - `authAPI` - Login, register, profile
  - `eventsAPI` - CRUD operations for events
  - `meetingsAPI` - Meeting management
  - `availabilityAPI` - Availability settings
  - `integrationsAPI` - Integration connect/disconnect
  - `tasksAPI` - Placeholder (coming soon)
  - `aiCalendarAPI` - Placeholder (coming soon)

### 2. **Type Definitions** (`lib/types.ts`)
- Complete TypeScript interfaces for all entities
- Event, Meeting, Integration, Availability, User, Task types

### 3. **Updated Components**
- **Event Types Content**: Connected to backend with real data fetching, create/edit/delete functionality
- **Meetings Content**: Full CRUD operations, filtering by status
- **Integrations Content**: Connect/disconnect integrations with OAuth
- **Tasks Content**: Placeholder UI with integration prompt

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd meetly-app
pnpm install axios sonner
```

Or with npm:
```bash
npm install axios sonner
```

### 2. Configure Environment

Create `.env.local` file (already blocked by gitignore):

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# App Origin (for generating event booking links)
NEXT_PUBLIC_APP_ORIGIN=http://localhost:5173
```

### 3. Update Components to Use Toast

Add Toaster to your root layout (`app/layout.tsx`):

```tsx
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

---

## 🔌 API Integration Details

### Authentication

The API client automatically:
- Adds JWT token from localStorage to all requests
- Handles 401 errors by redirecting to login
- Persists tokens across page reloads

```typescript
// Token is automatically added to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### API Endpoints Used

#### Events
- `GET /api/event` - Get all events
- `POST /api/event` - Create event
- `PUT /api/event/:id` - Update event
- `DELETE /api/event/:id` - Delete event
- `PATCH /api/event/:id` - Toggle privacy

#### Meetings
- `GET /api/meeting` - Get all meetings
- `POST /api/meeting` - Create meeting
- `PUT /api/meeting/:id` - Update meeting
- `DELETE /api/meeting/:id` - Cancel meeting

#### Integrations
- `GET /api/integration` - Get all integrations
- `GET /api/integration/:type/auth` - Get OAuth URL
- `DELETE /api/integration/:type` - Disconnect

---

## 📋 Features Status

### ✅ Implemented (Connected to Backend)
1. **Events Page** - Full CRUD, real-time data
2. **Meetings Page** - Display, filter, cancel meetings
3. **Integrations Page** - Connect OAuth integrations
4. **Dashboard** - Shows stats (needs minor updates)

### 🚧 Placeholders (Not Yet Implemented)
1. **Google Tasks** - Placeholder with integration prompt
2. **AI Calendar** - Placeholder for AI recommendations
3. **Availability** - Basic UI ready, needs backend connection
4. **Calendar View** - Calendar UI ready, needs backend connection

---

## 🔄 How to Add Missing Features

### 1. Connect Google Tasks

Update `lib/api.ts`:

```typescript
export const tasksAPI = {
  getAll: async () => {
    const response = await api.get('/tasks')
    return response.data
  },
  // ... other methods
}
```

Update `components/tasks-content.tsx`:
- Uncomment the API call in `loadTasks()`
- Remove placeholder message

### 2. Add AI Calendar Features

Update `lib/api.ts`:

```typescript
export const aiCalendarAPI = {
  getRecommendations: async () => {
    const response = await api.get('/ai-calendar/recommendations')
    return response.data
  },
  getTasks: async () => {
    const response = await api.get('/ai-calendar/tasks')
    return response.data
  },
}
```

### 3. Connect Availability

Update `components/availability-content.tsx`:

```typescript
import { availabilityAPI } from "@/lib/api"

const loadAvailability = async () => {
  const response = await availabilityAPI.get()
  // Update state with data
}

const saveAvailability = async (data) => {
  await availabilityAPI.update(data)
  // Show success toast
}
```

---

## 🧪 Testing

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd meetly-app
pnpm dev
```

### 3. Test Features
1. Navigate to Events page
2. Click "New Event" - should create and show in list
3. Click "Copy Link" - should copy booking URL
4. Go to Meetings - should show real meetings
5. Go to Integrations - should show connection status
6. Go to Tasks - should show placeholder with prompt

---

## 🐛 Troubleshooting

### Issue: API calls fail with CORS error
**Solution**: Make sure backend has CORS enabled for your frontend URL

### Issue: 401 Unauthorized errors
**Solution**: Login again to get new token

### Issue: Google Tasks not working
**Solution**: This is expected - it's a placeholder. Backend needs to implement this endpoint

### Issue: Data not loading
**Solution**: 
1. Check browser console for errors
2. Verify backend is running on port 8000
3. Check Network tab in DevTools
4. Verify API endpoints match backend routes

---

## 📝 Next Steps

1. **Connect Availability** - Update availability-content.tsx
2. **Connect Calendar** - Update calendar-content.tsx
3. **Add Real-time Updates** - Use React Query or SWR
4. **Add Loading States** - Skeleton loaders
5. **Add Error Boundaries** - Better error handling
6. **Implement Tasks** - When backend is ready

---

## 🎯 Current Architecture

```
meetly-app/
├── lib/
│   ├── api.ts          # API client with all endpoints
│   └── types.ts        # TypeScript interfaces
├── components/
│   ├── event-types-content.tsx   ✅ Connected
│   ├── meetings-content.tsx      ✅ Connected
│   ├── integrations-content.tsx  ✅ Connected
│   ├── tasks-content.tsx          🚧 Placeholder
│   └── availability-content.tsx  🚧 Needs connection
└── app/
    └── page.tsx        # Routes to components
```

---

## ✅ Summary

Your Meetly app is now:
- ✅ Connected to backend API
- ✅ Using real data for events, meetings, integrations
- ✅ Showing placeholders for unimplemented features
- ✅ Providing user feedback via toasts
- ✅ Handling authentication automatically
- ✅ Ready for Google Tasks integration when backend is ready

Good luck! 🚀

