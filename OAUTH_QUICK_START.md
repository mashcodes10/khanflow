# OAuth Quick Start - Production Deployment

## 🚀 Quick Setup Steps

### Google OAuth (5 minutes)

1. **Go to**: https://console.cloud.google.com/
2. **Create Project** → Name it "Khanflow"
3. **Enable APIs**:
   - Google Calendar API
   - Google Tasks API
4. **Create OAuth Credentials**:
   - APIs & Services → Credentials → Create OAuth Client ID
   - Type: Web application
   - **Authorized redirect URIs**:
     ```
     https://yourdomain.com/api/integration/google/callback
     ```
5. **Copy**: Client ID and Client Secret

### Microsoft OAuth (5 minutes)

1. **Go to**: https://portal.azure.com/
2. **Azure AD** → App registrations → New registration
3. **Name**: Khanflow
4. **Account types**: "Any organizational directory and personal Microsoft accounts"
5. **Redirect URI**: 
   ```
   https://yourdomain.com/api/integration/microsoft/callback
   ```
6. **API Permissions** → Add:
   - `User.Read`
   - `Calendars.ReadWrite`
   - `Tasks.ReadWrite`
   - `OnlineMeetings.ReadWrite`
   - `offline_access`
7. **Certificates & secrets** → New client secret → Copy value
8. **Copy**: Application (client) ID and Client secret value

---

## 📝 Environment Variables

### Backend `.env`

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/integration/google/callback

# Microsoft OAuth
MS_CLIENT_ID=your_microsoft_client_id_guid
MS_CLIENT_SECRET=your_microsoft_secret_value
MS_REDIRECT_URI=https://yourdomain.com/api/integration/microsoft/callback

# Frontend URL
FRONTEND_INTEGRATION_URL=https://yourdomain.com/integrations
```

### Frontend `.env.local`

```env
# Backend API
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# App Origin
NEXT_PUBLIC_APP_ORIGIN=https://yourdomain.com

# Google Sign In
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Microsoft Sign In
NEXT_PUBLIC_MS_CLIENT_ID=your_microsoft_client_id_guid
NEXT_PUBLIC_MS_REDIRECT_URI=https://yourdomain.com/auth/microsoft/callback
```

---

## ✅ Testing Checklist

After setup, test:

- [ ] Google sign in works
- [ ] Microsoft sign in works
- [ ] Google Calendar connects
- [ ] Google Tasks connects
- [ ] Outlook Calendar connects
- [ ] Microsoft To Do connects
- [ ] Can create calendar events
- [ ] Can create tasks

---

## 🔗 Important URLs

Replace `yourdomain.com` with your actual domain:

**Google Callbacks:**
- `https://yourdomain.com/api/integration/google/callback`

**Microsoft Callbacks:**
- `https://yourdomain.com/api/integration/microsoft/callback`
- `https://yourdomain.com/auth/microsoft/callback`

---

## ⚠️ Common Issues

1. **"redirect_uri_mismatch"**
   - Fix: Ensure redirect URI in OAuth console matches exactly (including https://)

2. **"invalid_client"**
   - Fix: Check client ID and secret are correct

3. **"access_denied"**
   - Fix: User needs to grant permissions, or admin consent required

---

## 📚 Full Documentation

See `OAUTH_SETUP_GUIDE.md` for detailed step-by-step instructions.
