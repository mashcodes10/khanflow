# KhanFlow Integration Setup Guide

This guide will help you set up all the integrations in the KhanFlow application by configuring the necessary OAuth applications and environment variables.

## 🔧 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- pnpm or npm
- Active accounts for Google, Microsoft, and Zoom

## 📋 Environment Files Created

The following `.env` files have been created for you:

- `backend/.env` - Backend API configuration
- `frontend/.env` - React frontend configuration
- `availibility/.env.local` - Availability Next.js app (port 3000)
- `integrations/.env.local` - Integrations Next.js app (port 3001)
- `login/.env.local` - Login Next.js app (port 3002)
- `meetings/.env.local` - Meetings Next.js app (port 3003)
- `modern-booking-cards/.env.local` - Booking cards Next.js app (port 3004)

## 🔑 OAuth Application Setup

### 1. Google OAuth Setup (Google Calendar/Meet)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google Meet API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/integration/google/callback`
   - `http://localhost:3000/api/auth/google/callback`
   - `http://localhost:3001/api/auth/google/callback`
   - `http://localhost:3002/api/auth/google/callback`
   - `http://localhost:3003/api/auth/google/callback`
   - `http://localhost:3004/api/auth/google/callback`
7. Copy the Client ID and Client Secret

### 2. Microsoft OAuth Setup (Teams/Outlook)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set application name and redirect URI: `http://localhost:8000/api/integration/microsoft/callback`
5. After creation, go to "Authentication" and add additional redirect URIs:
   - `http://localhost:3000/api/auth/microsoft/callback`
   - `http://localhost:3001/api/auth/microsoft/callback`
   - `http://localhost:3002/api/auth/microsoft/callback`
   - `http://localhost:3003/api/auth/microsoft/callback`
   - `http://localhost:3004/api/auth/microsoft/callback`
6. Go to "API permissions" and add:
   - Microsoft Graph → User.Read
   - Microsoft Graph → Calendars.ReadWrite
   - Microsoft Graph → OnlineMeetings.ReadWrite
7. Go to "Certificates & secrets" → "New client secret"
8. Copy the Application (client) ID and Client secret

### 3. Zoom OAuth Setup

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Sign in and go to "Develop" → "Build App"
3. Choose "OAuth" as the app type
4. Fill in app information:
   - App name: KhanFlow Integration
   - Company name: Your Company
   - Developer email: your-email@example.com
5. In "OAuth Allow List", add redirect URIs:
   - `http://localhost:8000/api/integration/zoom/callback`
   - `http://localhost:3000/api/auth/zoom/callback`
   - `http://localhost:3001/api/auth/zoom/callback`
   - `http://localhost:3002/api/auth/zoom/callback`
   - `http://localhost:3003/api/auth/zoom/callback`
   - `http://localhost:3004/api/auth/zoom/callback`
6. In "Scopes", add:
   - `meeting:write`
   - `user:read`
7. Copy the Client ID and Client Secret

## 🔧 Environment Variable Configuration

### Backend Configuration (`backend/.env`)

Update the following variables with your actual OAuth credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/khanflow

# Google OAuth
GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret

# Microsoft OAuth
MS_CLIENT_ID=your-actual-microsoft-client-id
MS_CLIENT_SECRET=your-actual-microsoft-client-secret

# Zoom OAuth
ZOOM_CLIENT_ID=your-actual-zoom-client-id
ZOOM_CLIENT_SECRET=your-actual-zoom-client-secret

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key

# Session Secret (generate a secure random string)
SESSION_SECRET=your-super-secure-session-secret-key
```

### Frontend Configuration (`frontend/.env`)

Update the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com

# Microsoft OAuth
VITE_MS_CLIENT_ID=your-actual-microsoft-client-id

# Zoom OAuth
VITE_ZOOM_CLIENT_ID=your-actual-zoom-client-id
```

### Next.js Applications

Each Next.js app (availibility, integrations, login, meetings, modern-booking-cards) has its own `.env.local` file with the same OAuth credentials but different ports:

- Availability: `http://localhost:3000`
- Integrations: `http://localhost:3001`
- Login: `http://localhost:3002`
- Meetings: `http://localhost:3003`
- Modern Booking Cards: `http://localhost:3004`

## 🚀 Running the Applications

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Start Next.js Applications (optional)
```bash
# Availability app
cd availibility
npm install
npm run dev

# Integrations app
cd integrations
npm install
npm run dev

# Login app
cd login
npm install
npm run dev

# Meetings app
cd meetings
npm install
npm run dev

# Modern Booking Cards app
cd modern-booking-cards
npm install
npm run dev
```

## 🔍 Integration Testing

### Test Google Integration
1. Navigate to the integrations page
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Verify calendar events are synced

### Test Microsoft Integration
1. Navigate to the integrations page
2. Click "Connect Microsoft Teams/Outlook"
3. Complete OAuth flow
4. Verify calendar and meeting access

### Test Zoom Integration
1. Navigate to the integrations page
2. Click "Connect Zoom"
3. Complete OAuth flow
4. Verify meeting creation capabilities

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure all frontend URLs are added to `CORS_ORIGIN` in backend `.env`
2. **OAuth Redirect Mismatch**: Verify redirect URIs match exactly in OAuth app settings
3. **Database Connection**: Ensure PostgreSQL is running and `DATABASE_URL` is correct
4. **JWT Errors**: Ensure `JWT_SECRET` is set and consistent across all applications

### Debug Mode

Enable debug mode by setting:
```env
NEXT_PUBLIC_DEBUG_MODE=true
VITE_DEBUG_MODE=true
```

## 📚 API Endpoints

### Integration Endpoints
- `GET /api/integration` - Get user integrations
- `GET /api/integration/google/auth` - Google OAuth
- `GET /api/integration/microsoft/auth` - Microsoft OAuth
- `GET /api/integration/zoom/auth` - Zoom OAuth

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for JWT and session keys
3. **Rotate OAuth credentials** regularly
4. **Use HTTPS in production**
5. **Implement rate limiting** for OAuth endpoints

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify OAuth app configurations
3. Ensure all environment variables are set correctly
4. Test database connectivity

---

**Note**: Replace all placeholder values (like `your-actual-google-client-id`) with your real OAuth credentials before running the applications.
