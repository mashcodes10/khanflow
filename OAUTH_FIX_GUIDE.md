# Fixing Google OAuth "origin_mismatch" Error

## 🔍 The Problem

You're getting this error because the URL where your frontend app is running is not registered in your Google Cloud Console OAuth credentials.

**Error:** `Error 400: origin_mismatch`

This happens when:
1. Your frontend JavaScript loads from a URL that's not in the "Authorized JavaScript origins"
2. Your OAuth redirect URI doesn't match what's in Google Cloud Console

## 📋 Current Configuration

Based on your environment files:
- **Frontend URL:** `http://localhost:5173` (React app)
- **Backend URL:** `http://localhost:8000`
- **Google Client ID:** `107054049352-ji80f34ghl3duu9tko4a61ov5ftjs0as.apps.googleusercontent.com`

## ✅ Solution: Add Authorized Origins in Google Cloud Console

### Step 1: Go to Google Cloud Console

1. Visit: [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the one with OAuth credentials: `107054049352-ji80f34ghl3duu9tko4a61ov5ftjs0as`)
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Edit Your OAuth Client ID

1. Find your OAuth 2.0 Client ID in the list
2. Click on it to open the configuration

### Step 3: Add Authorized JavaScript Origins

Add these URLs to the **"Authorized JavaScript origins"** section:

```
http://localhost:5173
http://localhost:3000
http://localhost:3001
http://localhost:3002
http://localhost:3003
http://localhost:3004
```

**Important:** 
- Each URL must be on its own line
- NO trailing slash at the end
- Must include the protocol (`http://` or `https://`)
- For production, add your production domain

### Step 4: Add Authorized Redirect URIs

Add these URLs to the **"Authorized redirect URIs"** section:

```
http://localhost:8000/api/integration/google/callback
```

**Note:** For production, add:
```
https://yourdomain.com/api/integration/google/callback
```

### Step 5: Save Changes

1. Click **"SAVE"** at the bottom of the page
2. Wait for the changes to propagate (may take a few minutes)

## 🔧 Quick Checklist

Make sure you've added:

- ✅ `http://localhost:5173` - Frontend (React)
- ✅ `http://localhost:3000` - Availability app (Next.js)
- ✅ `http://localhost:3001` - Integrations app (Next.js)
- ✅ `http://localhost:3002` - Login app (Next.js)
- ✅ `http://localhost:3003` - Meetings app (Next.js)
- ✅ `http://localhost:3004` - Modern Booking Cards app (Next.js)
- ✅ `http://localhost:8000/api/integration/google/callback` - Backend OAuth callback

## 🧪 Testing

After making these changes:

1. **Wait 2-5 minutes** for changes to propagate
2. Clear your browser cache and cookies for the OAuth domain
3. Try the OAuth flow again

## 🚨 Common Issues

### Issue 1: Changes not taking effect immediately
**Solution:** Google's changes can take up to 5 minutes to propagate. Wait a few minutes and try again.

### Issue 2: Still getting the same error
**Solution:** 
- Double-check that URLs match EXACTLY (including http vs https)
- Make sure there are NO trailing slashes
- Clear your browser cache and cookies
- Try an incognito/private window

### Issue 3: "The app is blocked" message
**Solution:** This might be because you're using an unverified OAuth consent screen. For development, you can:
1. Go to **APIs & Services** → **OAuth consent screen**
2. Add test users (your email address)
3. Publish for testing (if your project is in Testing mode)

## 📝 For Production

When deploying to production, you'll need to add:

**Authorized JavaScript origins:**
```
https://yourdomain.com
https://www.yourdomain.com
```

**Authorized redirect URIs:**
```
https://api.yourdomain.com/api/integration/google/callback
```

## 🆘 Still Having Issues?

If the problem persists:

1. **Check your browser console** for the exact error message
2. **Verify your environment variables:**
   - Check that `GOOGLE_CLIENT_ID` in backend matches Google Cloud Console
   - Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` or `VITE_GOOGLE_CLIENT_ID` matches
3. **Test with a simple OAuth flow** to isolate the issue
4. **Check Google Cloud Console logs** for more details

---

**Note:** Always restart your servers after making environment variable changes.

