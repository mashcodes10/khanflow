# Zoom OAuth Scopes Setup Guide

## Your Credentials
- **Client ID**: `Sa51q9UMSyCGvO5wnbcEpQ`
- **Client Secret**: `pNlrsHxXRFhrHmgnVhdDfIKSQHsfFpbQ`

## Required Scopes for Khanflow

Your app needs these scopes to create and manage Zoom meetings:

1. **`meeting:write`** - Create, update, and delete meetings
2. **`meeting:read`** - Read meeting information (recommended)

## Step-by-Step: Finding and Adding Scopes

### Method 1: Through Zoom Marketplace (Recommended)

1. **Go to Zoom Marketplace**
   - Visit: https://marketplace.zoom.us/
   - Sign in with your Zoom account

2. **Navigate to Your App**
   - Click **"Develop"** in the top menu
   - Select **"My Apps"** or go directly to: https://marketplace.zoom.us/user/build
   - Find your app (Client ID: `Sa51q9UMSyCGvO5wnbcEpQ`) and click on it

3. **Find the Scopes Section**
   - Look for a tab or section called **"Scopes"** or **"Permissions"** in the left sidebar
   - If you don't see it, look for **"OAuth"** or **"App Credentials"** section
   - The scopes might be under **"Information"** → **"Scopes"**

4. **Add Scopes**
   - Click **"Add Scopes"** or **"Edit Scopes"** button
   - Search for or select:
     - ✅ `meeting:write`
     - ✅ `meeting:read`
   - For each scope, you may need to provide a **description/reason**:
     - **meeting:write**: "Create and manage Zoom meetings for scheduled events"
     - **meeting:read**: "Read meeting details to display meeting information"
   - Click **"Save"** or **"Done"**

### Method 2: If Scopes Section is Not Visible

If you can't find the Scopes section, try these steps:

1. **Check App Type**
   - Make sure your app type is **"OAuth"** (not Server-to-Server OAuth)
   - If it's the wrong type, you may need to create a new OAuth app

2. **Activate Your App First**
   - Some scopes only appear after the app is activated
   - Go to **"Activation"** tab and toggle **"Activate your app"** to **ON**
   - Then go back to **"Scopes"** section

3. **Check App Information Tab**
   - Sometimes scopes are configured in **"Information"** → **"Scopes"** or **"Permissions"**

### Method 3: Direct URL (If Available)

Try accessing your app's scopes directly:
- https://marketplace.zoom.us/user/build/app/{YOUR_APP_ID}/scopes
- Replace `{YOUR_APP_ID}` with your app's ID (you can find this in the URL when viewing your app)

## Alternative: Scopes in OAuth Authorization URL

If you can't find where to configure scopes in the UI, Zoom OAuth apps typically request scopes during the authorization flow. However, for your app to work properly, the scopes need to be:

1. **Configured in the app settings** (preferred method)
2. **Or requested in the authorization URL** (if the app allows dynamic scope requests)

### Check Your Current Authorization URL

Your backend currently uses this authorization URL:
```
https://zoom.us/oauth/authorize?response_type=code&client_id=Sa51q9UMSyCGvO5wnbcEpQ&redirect_uri=...
```

If Zoom allows scope parameters, you could modify it to:
```
https://zoom.us/oauth/authorize?response_type=code&client_id=Sa51q9UMSyCGvO5wnbcEpQ&redirect_uri=...&scope=meeting:write%20meeting:read
```

However, **this may not work** if Zoom requires scopes to be pre-configured in the app settings.

## Verification Steps

After adding scopes:

1. **Save your changes** in the Zoom Marketplace
2. **Test the OAuth flow**:
   - Try connecting Zoom in your app
   - Check if you're prompted to grant the meeting permissions
   - Verify that meetings can be created successfully

3. **Check Token Permissions**:
   - After authorization, check the access token
   - The token should include the `meeting:write` and `meeting:read` scopes

## Troubleshooting

### Issue: "Insufficient scope" error
- **Solution**: Make sure both `meeting:write` and `meeting:read` are added and saved
- Re-authorize the app after adding scopes

### Issue: Can't find Scopes section
- **Solution**: 
  - Make sure your app is an **OAuth app** (not Server-to-Server)
  - Try activating the app first
  - Check if you're looking at the correct app (verify Client ID matches)

### Issue: Scopes not working after adding
- **Solution**:
  - Users need to **re-authorize** after scopes are added
  - Disconnect and reconnect the Zoom integration in your app
  - Clear any cached tokens

## Need Help?

If you still can't find the scopes section:

1. **Take a screenshot** of your app's dashboard/configuration page
2. **Check Zoom's documentation**: https://marketplace.zoom.us/docs/guides/auth/oauth/oauth-scopes/
3. **Contact Zoom Support** through the Marketplace if needed

## Quick Reference

- **Zoom Marketplace**: https://marketplace.zoom.us/user/build
- **OAuth Scopes Docs**: https://marketplace.zoom.us/docs/guides/auth/oauth/oauth-scopes/
- **Your App**: Look for Client ID `Sa51q9UMSyCGvO5wnbcEpQ`
