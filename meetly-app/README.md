# Meetly App - Next.js + Backend Integration

This is the frontend Next.js application for Meetly, integrated with the KhanFlow backend.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

Or with npm:
```bash
npm install
```

### 2. Environment Setup

Create `.env.local` file in the root:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# App Origin (for generating event booking links)
NEXT_PUBLIC_APP_ORIGIN=http://localhost:5173
```

### 3. Run Development Server

```bash
pnpm dev
```

The app will run on http://localhost:3000

## 📁 Project Structure

```
meetly-app/
├── app/
│   ├── page.tsx                    # Event types page (home)
│   ├── dashboard/page.tsx          # Dashboard
│   ├── meetings/page.tsx           # Meetings list
│   ├── calendar/page.tsx           # Calendar view
│   ├── tasks/page.tsx              # Google Tasks (placeholder)
│   ├── integrations/page.tsx       # Integrations management
│   ├── availability/page.tsx       # Availability settings
│   └── layout.tsx                  # Root layout
├── components/
│   ├── sidebar.tsx                 # Sidebar navigation
│   ├── event-types-content.tsx     # Events page (✅ Connected)
│   ├── meetings-content.tsx        # Meetings page (✅ Connected)
│   ├── integrations-content.tsx    # Integrations page (✅ Connected)
│   ├── tasks-content.tsx            # Tasks page (🚧 Placeholder)
│   └── ui/                          # shadcn/ui components
└── lib/
    ├── api.ts                      # API client
    └── types.ts                     # TypeScript interfaces
```

## 🔌 Backend Integration

### Connected Features
- ✅ **Events** - Full CRUD operations
- ✅ **Meetings** - View, filter, cancel meetings
- ✅ **Integrations** - Connect OAuth apps (Google, Zoom, Microsoft)
- ✅ **Authentication** - Automatic token management

### Placeholder Features
- 🚧 **Google Tasks** - Shows integration prompt
- 🚧 **AI Calendar** - Coming soon
- 🚧 **Availability** - UI ready, needs backend connection

See [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) for detailed integration instructions.

## 🛠️ Features

### Events Page
- View all event types
- Create new events with location type selection
- Copy booking links
- Edit event details
- Toggle event privacy

### Meetings Page
- View upcoming meetings
- View past meetings
- Cancel meetings
- Filter by status (Upcoming, Past, Cancelled)

### Integrations Page
- Connect Google Meet & Calendar
- Connect Zoom
- Connect Outlook Calendar
- Connect Microsoft Teams
- (Placeholder: Google Tasks)

### Tasks Page
- Placeholder UI
- Prompts to connect Google Tasks
- Will sync tasks when backend is ready

## 🧪 Testing

1. **Start Backend** (from root directory):
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd meetly-app
   pnpm dev
   ```

3. **Login** at**:
   http://localhost:3000/login
   (You'll need to create this page)

4. **Test Features**:
   - Go to Events page - Create a new event
   - Go to Meetings page - View meetings
   - Go to Integrations - Connect services
   - Go to Tasks - See placeholder

## 📝 Environment Variables

Required environment variables for `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Your app's origin (for generating booking links)
NEXT_PUBLIC_APP_ORIGIN=http://localhost:5173
```

## 🔧 Development

### Adding New API Endpoints

Update `lib/api.ts`:

```typescript
export const yourAPI = {
  getData: async () => {
    const response = await api.get('/your-endpoint')
    return response.data
  },
}
```

### Using API in Components

```typescript
import { eventsAPI } from "@/lib/api"
import { toast } from "sonner"

const handleAction = async () => {
  try {
    const data = await eventsAPI.getAll()
    // Handle data
  } catch (error) {
    toast.error("Failed to load data")
  }
}
```

## 📚 Documentation

- **[BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)** - Detailed integration guide
- **[../UI_RESPONSIVE_GUIDE.md](../UI_RESPONSIVE_GUIDE.md)** - Responsive UI patterns
- **[../MINIMALIST_UI_GUIDE.md](../MINIMALIST_UI_GUIDE.md)** - Minimal design patterns

## 🚨 Troubleshooting

### API calls failing
- Check backend is running on port 8000
- Verify API_URL in `.env.local`
- Check browser console for errors

### Authentication issues
- Login again to get new token
- Check token in localStorage

### Google Tasks not working
- This is expected - it's a placeholder
- Backend needs to implement Tasks endpoint

## 🎯 Next Steps

1. **Add Login/Auth Pages** - Create auth UI
2. **Connect Availability** - Update availability-content.tsx
3. **Connect Calendar** - Update calendar-content.tsx
4. **Implement Real-time Updates** - Use React Query
5. **Add Error Boundaries** - Better error handling

---

**Built with** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui

