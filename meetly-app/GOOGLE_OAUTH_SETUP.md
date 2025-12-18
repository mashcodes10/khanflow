# Google OAuth Setup

To enable Google Sign-In, you need to set up Google OAuth credentials:

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Application type to "Web application"
6. Add authorized origins:
   - `http://localhost:3000` (for development)
   - Your production domain
7. Copy the Client ID

## 2. Update Environment Variables

Add your Google Client ID to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

## 3. Backend Setup

Make sure your backend supports Google OAuth login at:
- `POST /api/auth/google` - accepts `{ idToken: string }`

## 4. Test

1. Start your backend: `npm run dev` (in backend directory)
2. Start your frontend: `npm run dev` (in meetly-app directory)
3. Go to `http://localhost:3000/auth/signin`
4. Click "Sign in with Google"

The Google Sign-In button will appear on both sign-in and sign-up pages.