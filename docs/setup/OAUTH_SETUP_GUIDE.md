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

## 3. Zoom OAuth Setup

### Step 1: Create a Zoom OAuth App

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Sign in with your Zoom account (or create one if needed)
3. Click **"Develop"** → **"Build App"** (or go to [Zoom App Marketplace - Create App](https://marketplace.zoom.us/develop/create))
4. Select **"OAuth"** as the app type
5. Click **"Create"**

### Step 2: Configure App Information

1. **App Information**:
   - **App Name**: Khanflow (or your preferred name)
   - **Short Description**: Calendar and meeting management integration
   - **Company Name**: Your company name
   - **Developer Contact Email**: Your email address
   - **App Category**: Select **"Productivity"** or **"Business"**

2. Click **"Continue"**

### Step 3: Configure OAuth Settings

1. **OAuth Redirect URL**:
   - Add your production redirect URI:
     ```
     https://yourdomain.com/api/integration/zoom/callback
     ```
   - For local development, also add:
     ```
     http://localhost:8000/api/integration/zoom/callback
     ```
   - **Important**: The redirect URI must match exactly (including protocol, domain, and path)

2. **Scopes/Permissions**:
   - The following scopes are required for creating meetings:
     - `meeting:write` - Create and manage meetings
     - `meeting:read` - Read meeting information
     - `user:read` - Read user information (optional but recommended)
   
   - To add scopes:
     - Scroll to **"Scopes"** section
     - Click **"Add Scopes"**
     - Select the required scopes from the list
     - Click **"Done"**

3. **Activation**:
   - Toggle **"Activate your app"** to **ON**
   - This makes your app available for users to install

4. Click **"Save"** or **"Continue"**

### Step 4: Get Your Credentials

1. After saving, you'll see your app credentials:
   - **Client ID**: `xxxxxxxxxxxxxxxxxxxxx`
   - **Client Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   
2. **Important**: 
   - Copy the **Client Secret** immediately - you can only see it once!
   - If you lose it, you'll need to regenerate it (which invalidates the old one)

### Step 5: Publish Your App (Optional for Production)

1. If you want to make your app publicly available:
   - Go to **"Publish"** tab
   - Fill in required information
   - Submit for review (can take 1-2 weeks)
   
2. **For private/internal use**:
   - You can skip publishing
   - Users can still install the app if they have the Client ID
   - Or you can add specific users/accounts in the **"Users"** section

### Step 6: Test Your App

1. **Test Installation**:
   - Go to **"Test"** tab in your app settings
   - Click **"Install Test App"** to test with your own account
   - This will redirect you through the OAuth flow

2. **Verify Redirect URI**:
   - Make sure the redirect URI in your app matches exactly with your backend configuration
   - Test the OAuth flow end-to-end

### Important Notes for Zoom OAuth

1. **Account Type**:
   - Works with both **Free** and **Paid** Zoom accounts
   - For production, consider using a **Zoom Pro** or higher account for better API limits

2. **API Rate Limits**:
   - **Free accounts**: 10,000 requests per day
   - **Pro accounts**: 50,000 requests per day
   - **Business/Enterprise**: Higher limits
   - Monitor usage in the Zoom Developer Dashboard

3. **Token Expiration**:
   - Access tokens expire after 1 hour
   - Refresh tokens are long-lived (can be revoked manually)
   - Your backend automatically refreshes tokens when needed

4. **Redirect URI Requirements**:
   - Must use HTTPS in production
   - Must match exactly (case-sensitive)
   - No trailing slashes unless specified
   - Can have multiple redirect URIs (one per environment)

5. **App Status**:
   - **Development**: Only you can install
   - **Published**: Available to all Zoom users (after review)
   - **Unpublished**: Can still be used with direct installation

---

## 4. Environment Variables Configuration

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

# Zoom OAuth
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
ZOOM_REDIRECT_URI=https://yourdomain.com/api/integration/zoom/callback

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

## 5. Important Notes for Production

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

### Zoom OAuth

1. **App Activation**:
   - Make sure your app is activated in the Zoom Marketplace
   - Inactive apps won't work even with correct credentials

2. **Redirect URI Matching**:
   - Must match exactly (case-sensitive, including protocol)
   - Use HTTPS in production (required by Zoom)
   - Can add multiple URIs for different environments

3. **Token Management**:
   - Access tokens expire after 1 hour
   - Refresh tokens are long-lived but can be revoked
   - Your backend handles automatic token refresh

4. **Rate Limits**:
   - Monitor API usage in Zoom Developer Dashboard
   - Free accounts: 10,000 requests/day
   - Pro accounts: 50,000 requests/day
   - Set up alerts for approaching limits

5. **App Publishing**:
   - Not required for private/internal use
   - Required for public distribution
   - Review process takes 1-2 weeks

---

## 6. Testing Checklist

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

### Zoom OAuth
- [ ] Zoom integration connects successfully
- [ ] OAuth callback redirects correctly
- [ ] Zoom meetings can be created
- [ ] Meeting links are generated correctly
- [ ] Token refresh works automatically

---

## 7. Security Best Practices

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

## 8. Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
- **Solution**: Ensure redirect URI in code matches exactly with OAuth console

### Issue: "invalid_client"
- **Solution**: Check client ID and secret are correct, not expired

### Issue: "access_denied"
- **Solution**: User denied consent, or admin consent required

### Issue: "insufficient_scope"
- **Solution**: Add required scopes in OAuth consent screen

### Issue: "redirect_uri_mismatch" (Zoom)
- **Solution**: Ensure redirect URI in Zoom app matches exactly with `ZOOM_REDIRECT_URI` in your `.env`
- Check for trailing slashes, protocol (https vs http), and exact path

### Issue: "invalid_client" (Zoom)
- **Solution**: Verify Client ID and Client Secret are correct
- Check if app is activated in Zoom Marketplace
- Regenerate Client Secret if needed (old one will be invalidated)

### Issue: "invalid_grant" (Zoom)
- **Solution**: Refresh token may be expired or revoked
- User may need to reconnect their Zoom account
- Check token expiration in your database

### Issue: "rate_limit_exceeded" (Zoom)
- **Solution**: You've exceeded API rate limits
- Upgrade Zoom account or wait for limit reset
- Implement request throttling in your app

---

## 9. Quick Reference

### Google OAuth URLs
- **Auth URL**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token URL**: `https://oauth2.googleapis.com/token`
- **Callback**: `https://yourdomain.com/api/integration/google/callback`

### Microsoft OAuth URLs
- **Auth URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
- **Token URL**: `https://login.microsoftonline.com/common/oauth2/v2.0/token`
- **Callback**: `https://yourdomain.com/api/integration/microsoft/callback`

### Zoom OAuth URLs
- **Auth URL**: `https://zoom.us/oauth/authorize`
- **Token URL**: `https://zoom.us/oauth/token`
- **Callback**: `https://yourdomain.com/api/integration/zoom/callback`
- **Marketplace**: `https://marketplace.zoom.us/develop/create`
- **Developer Dashboard**: `https://marketplace.zoom.us/user/build`

---

## 10. Deployment Checklist

Before deploying:

- [ ] All OAuth apps created and configured (Google, Microsoft, Zoom)
- [ ] All redirect URIs added for production domain
- [ ] Environment variables set in hosting platform
- [ ] OAuth consent screens configured (Google)
- [ ] API permissions granted (Microsoft)
- [ ] Zoom app activated in Marketplace
- [ ] Tested OAuth flows in staging environment
- [ ] Secrets stored securely (not in code)
- [ ] Monitoring/alerts set up
- [ ] Rate limit monitoring configured (Zoom)

---

## Support Resources

- **Google OAuth**: [Google Identity Platform Documentation](https://developers.google.com/identity/protocols/oauth2)
- **Microsoft OAuth**: [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- **Zoom OAuth**: [Zoom OAuth Documentation](https://marketplace.zoom.us/docs/guides/auth/oauth)
- **Google Calendar API**: [Calendar API Docs](https://developers.google.com/calendar/api)
- **Google Tasks API**: [Tasks API Docs](https://developers.google.com/tasks/api)
- **Microsoft Graph API**: [Graph API Docs](https://docs.microsoft.com/en-us/graph/)
- **Zoom API**: [Zoom API Documentation](https://marketplace.zoom.us/docs/api-reference/zoom-api)