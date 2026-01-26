# Google Calendar Connection Troubleshooting

## Common Errors and Solutions

### Error 1: "redirect_uri_mismatch"

**Error Message:**
```
Error 400: redirect_uri_mismatch
```

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:8000/api/integration/google/callback
   ```
4. For production, also add:
   ```
   https://yourdomain.com/api/integration/google/callback
   ```
5. Click **"Save"**
6. Wait 1-2 minutes for changes to propagate
7. Try connecting again

---

### Error 2: "Access blocked: This app's request is invalid"

**Error Message:**
```
Access blocked: This app's request is invalid
Error 400: redirect_uri_mismatch
```

**Solution:**
- Same as Error 1 - check your redirect URIs in Google Cloud Console

---

### Error 3: "OAuth consent screen not configured"

**Error Message:**
```
OAuth consent screen is not configured
```

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"APIs & Services"** → **"OAuth consent screen"**
3. Configure:
   - **User Type**: External (for public access)
   - **App name**: Khanflow
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add **Scopes**:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/tasks`
   - `https://www.googleapis.com/auth/tasks.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. Add **Test users** (your email) if app is in testing mode
6. Click **"Save and Continue"** → **"Back to Dashboard"**

---

### Error 4: "Invalid client" or "Invalid credentials"

**Error Message:**
```
Error 401: invalid_client
```

**Solution:**
1. Check your `.env` file has correct credentials:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/integration/google/callback
   ```
2. Verify credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Make sure you're using the correct Client ID and Secret
4. Restart your backend server after updating `.env`

---

### Error 5: "Access token expired" or "Token refresh failed"

**Error Message:**
```
Your Google connection has expired. Please reconnect your Google account.
```

**Solution:**
1. Disconnect Google Calendar in your app
2. Reconnect it (this will get a fresh token)
3. Make sure `GOOGLE_REDIRECT_URI` matches exactly what's in Google Cloud Console

---

### Error 6: "Required APIs not enabled"

**Error Message:**
```
API not enabled
```

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **"APIs & Services"** → **"Library"**
3. Enable these APIs:
   - ✅ **Google Calendar API**
   - ✅ **Google Tasks API**
   - ✅ **Google People API** (optional, for user profile)
4. Wait a few minutes for APIs to activate
5. Try connecting again

---

## Quick Checklist

Before connecting Google Calendar, verify:

- [ ] Google Calendar API is enabled
- [ ] Google Tasks API is enabled
- [ ] OAuth consent screen is configured
- [ ] OAuth 2.0 Client ID is created
- [ ] Redirect URI is added: `http://localhost:8000/api/integration/google/callback`
- [ ] `.env` file has correct `GOOGLE_CLIENT_ID`
- [ ] `.env` file has correct `GOOGLE_CLIENT_SECRET`
- [ ] `.env` file has correct `GOOGLE_REDIRECT_URI`
- [ ] Backend server is running
- [ ] Backend server was restarted after updating `.env`

---

## Testing the Connection

1. **Check backend logs** when clicking "Connect":
   - Look for any error messages
   - Verify the OAuth URL is being generated

2. **Check browser console** (F12):
   - Look for network errors
   - Check if redirect is happening correctly

3. **Verify redirect flow**:
   ```
   Click "Connect" 
   → Redirects to Google OAuth 
   → User authorizes 
   → Redirects to: http://localhost:8000/api/integration/google/callback?code=...
   → Backend processes callback
   → Redirects to: http://localhost:3000/integrations?app_type=google&success=true
   ```

---

## Still Having Issues?

1. **Share the exact error message** you're seeing
2. **Check backend terminal** for error logs
3. **Check browser console** (F12) for errors
4. **Verify your Google Cloud Console settings** match the checklist above

---

## Production Deployment

For production, make sure:

1. **OAuth consent screen** is published (not just in testing)
2. **Redirect URI** includes your production domain:
   ```
   https://yourdomain.com/api/integration/google/callback
   ```
3. **Environment variables** are set in your hosting platform (Vercel, Railway, etc.)
4. **Backend URL** in `.env` is updated to production URL
