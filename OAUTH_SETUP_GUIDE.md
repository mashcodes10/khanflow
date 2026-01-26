# OAuth Setup Guide for Production Deployment

This guide will help you set up Google and Microsoft OAuth credentials for public access to your Khanflow application.

## Prerequisites

- Google account (for Google Cloud Console)
- Microsoft account (for Azure Portal)
- Your production domain (e.g., `https://yourdomain.com`)

---

## 1. Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Khanflow` (or your preferred name)
4. Click **"Create"**

### Step 2: Enable Required APIs

1. In the project, go to **"APIs & Services"** → **"Library"**
2. Search and enable these APIs:
   - **Google Calendar API**
   - **Google Tasks API**
   - **Google People API** (for user profile)

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen first:
   - **User Type**: External (for public access)
   - **App name**: Khanflow
   - **User support email**: Your email
   - **Developer contact**: Your email
   - **Scopes**: Add these scopes:
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/tasks`
     - `https://www.googleapis.com/auth/tasks.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - **Test users**: Add your email (for testing)
   - Click **"Save and Continue"** → **"Back to Dashboard"**

4. Create OAuth Client ID:
   - **Application type**: Web application
   - **Name**: Khanflow Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:8000/api/integration/google/callback
     https://yourdomain.com/api/integration/google/callback
     http://localhost:3000/auth/google/callback
     https://yourdomain.com/auth/google/callback
     ```
   - Click **"Create"**
   - **Copy the Client ID and Client Secret** (you'll need these)

### Step 4: Get Your Credentials

- **Client ID**: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 2. Microsoft OAuth Setup

### Step 1: Register an Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Click **"Azure Active Directory"** → **"App registrations"**
3. Click **"+ New registration"**
4. Fill in:
   - **Name**: Khanflow
   - **Supported account types**: 
     - Select **"Accounts in any organizational directory and personal Microsoft accounts"** (for public access)
   - **Redirect URI**:
     - Platform: **Web**
     - URI: `http://localhost:8000/api/integration/microsoft/callback`
   - Click **"Register"**

### Step 2: Configure API Permissions

1. In your app, go to **"API permissions"**
2. Click **"+ Add a permission"**
3. Select **"Microsoft Graph"** → **"Delegated permissions"**
4. Add these permissions:
   - `User.Read` (for sign in)
   - `Calendars.ReadWrite` (for calendar access)
   - `OnlineMeetings.ReadWrite` (for Teams meetings)
   - `Tasks.ReadWrite` (for Microsoft To Do)
   - `offline_access` (for refresh tokens)
5. Click **"Add permissions"**
6. Click **"Grant admin consent"** (if you're an admin) or users will consent on first use

### Step 3: Configure Redirect URIs

1. Go to **"Authentication"** in the left menu
2. Under **"Platform configurations"**, click **"Add a platform"** → **"Web"**
3. Add these redirect URIs:
   ```
   http://localhost:8000/api/integration/microsoft/callback
   https://yourdomain.com/api/integration/microsoft/callback
   http://localhost:3000/auth/microsoft/callback
   https://yourdomain.com/auth/microsoft/callback
   ```
4. Click **"Configure"**

### Step 4: Create Client Secret

1. Go to **"Certificates & secrets"**
2. Click **"+ New client secret"**
3. Description: `Khanflow Production Secret`
4. Expires: Choose **24 months** (or your preference)
5. Click **"Add"**
6. **Copy the Value immediately** (you can only see it once!)

### Step 5: Get Your Credentials

- **Application (client) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Directory (tenant) ID**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Client secret value**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 3. Environment Variables Configuration

### Backend Environment Variables (`.env`)

Create/update `.env` in your `backend/` folder:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Microsoft OAuth
MS_CLIENT_ID=your_microsoft_client_id_here
MS_CLIENT_SECRET=your_microsoft_client_secret_here
MS_REDIRECT_URI=https://yourdomain.com/api/integration/microsoft/callback

# Frontend URL (for OAuth callbacks)
FRONTEND_INTEGRATION_URL=https://yourdomain.com/integrations

# Other backend configs...
PORT=8000
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### Frontend Environment Variables (`.env.local`)

Create/update `.env.local` in your `new-frontend/` folder:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# App Origin
NEXT_PUBLIC_APP_ORIGIN=https://yourdomain.com

# Google OAuth Client ID (for sign in)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here

# Microsoft OAuth (for sign in)
NEXT_PUBLIC_MS_CLIENT_ID=your_microsoft_client_id_here
NEXT_PUBLIC_MS_REDIRECT_URI=https://yourdomain.com/auth/microsoft/callback
```

---

## 4. Important Notes for Production

### Google OAuth

1. **OAuth Consent Screen**: 
   - For public apps, you need to submit for verification if you request sensitive scopes
   - For testing, you can add test users in the consent screen
   - Production apps may require verification (can take 1-2 weeks)

2. **Quotas**:
   - Google Calendar API: 1,000,000 queries/day (default)
   - Google Tasks API: 1,000,000 queries/day (default)

### Microsoft OAuth

1. **Admin Consent**:
   - For organizational accounts, admin consent may be required
   - Personal Microsoft accounts will consent on first use

2. **Redirect URI Matching**:
   - Must match exactly (including protocol, domain, path)
   - No trailing slashes unless specified

3. **Client Secret Expiration**:
   - Secrets expire (you set the duration)
   - Rotate secrets before expiration
   - Update environment variables when rotating

---

## 5. Testing Checklist

### Google OAuth
- [ ] Sign in with Google works
- [ ] Google Calendar integration connects
- [ ] Google Tasks integration connects
- [ ] Calendar events can be created
- [ ] Tasks can be created/updated

### Microsoft OAuth
- [ ] Sign in with Microsoft works
- [ ] Outlook Calendar integration connects
- [ ] Microsoft To Do integration connects
- [ ] Calendar events can be created
- [ ] Tasks can be created/updated

---

## 6. Security Best Practices

1. **Never commit secrets to git**
   - Add `.env` and `.env.local` to `.gitignore`
   - Use environment variables in your hosting platform

2. **Use different credentials for dev/prod**
   - Create separate OAuth apps for development and production
   - Use different redirect URIs

3. **Rotate secrets regularly**
   - Set reminders for secret expiration
   - Have a process for rotating without downtime

4. **Monitor API usage**
   - Set up alerts for unusual activity
   - Monitor quota usage

---

## 7. Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
- **Solution**: Ensure redirect URI in code matches exactly with OAuth console

### Issue: "invalid_client"
- **Solution**: Check client ID and secret are correct, not expired

### Issue: "access_denied"
- **Solution**: User denied consent, or admin consent required

### Issue: "insufficient_scope"
- **Solution**: Add required scopes in OAuth consent screen

---

## 8. Quick Reference

### Google OAuth URLs
- **Auth URL**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**: `https://oauth2.googleapis.com/token`
- **Callback**: `https://yourdomain.com/api/integration/google/callback`

### Microsoft OAuth URLs
- **Auth URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Token URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/token`
- **Callback**: `https://yourdomain.com/api/integration/microsoft/callback`

---

## 9. Deployment Checklist

Before deploying:

- [ ] All OAuth apps created and configured
- [ ] All redirect URIs added for production domain
- [ ] Environment variables set in hosting platform
- [ ] OAuth consent screens configured
- [ ] API permissions granted
- [ ] Tested OAuth flows in staging environment
- [ ] Secrets stored securely (not in code)
- [ ] Monitoring/alerts set up

---

## Support Resources

- **Google OAuth**: [Google Identity Platform Documentation](https://developers.google.com/identity/protocols/oauth2)
- **Microsoft OAuth**: [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- **Google Calendar API**: [Calendar API Docs](https://developers.google.com/calendar/api)
- **Google Tasks API**: [Tasks API Docs](https://developers.google.com/tasks/api)
- **Microsoft Graph API**: [Graph API Docs](https://docs.microsoft.com/en-us/graph/)
