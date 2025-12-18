# 🚨 Quick Fix: Google OAuth Error 400 - origin_mismatch

## Problem
Your app URL is not registered in Google Cloud Console OAuth settings.

## ⚡ Quick Solution (2 minutes)

### Step 1: Open Google Cloud Console
Visit: https://console.cloud.google.com/apis/credentials

### Step 2: Find Your OAuth Client
Look for: `107054049352-ji80f34ghl3duu9tko4a61ov5ftjs0as`
Click on it to edit.

### Step 3: Add These URLs

#### Under "Authorized JavaScript origins" - Add:
```
http://localhost:5173
http://localhost:3000
```

#### Under "Authorized redirect URIs" - Add:
```
http://localhost:8000/api/integration/google/callback
```

### Step 4: Save
Click "SAVE" button at the bottom.

### Step 5: Wait 2-3 Minutes
Google needs a few minutes to update.

### Step 6: Try Again
Clear browser cache and try OAuth sign-in again.

---

## 📋 What URL are you accessing?

Based on the URLs below, add the matching one to "Authorized JavaScript origins":

| App | URL | Add this to Google Console |
|-----|-----|---------------------------|
| Frontend (React) | http://localhost:5173 | ✅ Yes |
| Meetly App (Next.js) | http://localhost:3000 | ✅ Yes |
| Availability App | http://localhost:3000 | ✅ Yes |
| Integrations App | http://localhost:3001 | ✅ Yes |
| Login App | http://localhost:3002 | ✅ Yes |
| Meetings App | http://localhost:3003 | ✅ Yes |

---

## 🎯 Which App Are You Using?

### If using the **meetly-app** (Next.js):
- It runs on port 3000 by default
- Add: `http://localhost:3000`

### If using the **frontend** (React):
- It runs on port 5173
- Add: `http://localhost:5173`

---

## ⚠️ Important Notes

1. **NO trailing slash** - Don't add `/` at the end
2. **EXACT match** - URLs must match exactly
3. **Wait 2-5 minutes** after saving
4. **Clear browser cache** before trying again

---

## 🔍 How to Check Which Port You're Using

Look at your terminal where you started the dev server:

### For Next.js apps (meetly-app):
```
➜ Local:   http://localhost:3000
```

### For React apps (frontend):
```
➜  Local:   http://localhost:5173/
```

Add the URL that matches your terminal output.

---

## ✅ After Adding URLs

1. Wait 2-3 minutes for Google to update
2. Close all browser tabs for your app
3. Clear browser cache (Cmd+Shift+Del on Mac, Ctrl+Shift+Del on Windows)
4. Open your app again
5. Try Google sign-in

---

## 🆘 Still Not Working?

### Check 1: Verify your Client ID
Look in your environment file:
- Meetly app: Check `meetly-app/.env.local`
- Frontend: Check `frontend/.env`

Should contain: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=107054049352-ji80f34ghl3duu9tko4a61ov5ftjs0as.apps.googleusercontent.com`

### Check 2: Test URLs
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth client
3. Scroll to "Authorized JavaScript origins"
4. Confirm `http://localhost:5173` (or your port) is there
4. Confirm NO trailing slash `/` at the end

### Check 3: Browser Console
Open browser DevTools (F12) → Console tab
Look for the exact error message

---

## 🎯 Summary

**What to do:**
1. Open https://console.cloud.google.com/apis/credentials
2. Click your OAuth client: `107054049352-ji80f34ghl3duu9tko4a61ov5ftjs0as`
3. Add your app URL to "Authorized JavaScript origins"
4. Save and wait 2-3 minutes
5. Try again

**That's it!** 🎉

