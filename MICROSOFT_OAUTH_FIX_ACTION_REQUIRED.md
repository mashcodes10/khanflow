# Microsoft OAuth Production Fix - Action Required

## Problem
Microsoft sign-in/sign-up is not working in production. Users see error: "unauthorized_client: The client does not exist or is not enabled for consumers."

## What Was Fixed

### 1. ✅ Backend Configuration
- Updated `microsoft.config.ts` to use correct environment variable mapping
- Redeployed backend Lambda with proper configuration
- Backend is now live and ready

### 2. ✅ Build Configuration
- Updated `amplify.yml` to include Microsoft OAuth variables in production build
- Added all required `NEXT_PUBLIC_*` variables

### 3. ✅ Documentation
- Created comprehensive setup guide: `docs/setup/MICROSOFT_OAUTH_PRODUCTION_SETUP.md`

## What You Need to Do

### Step 1: Configure Azure App Registration (5 minutes)

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: Azure Active Directory → App Registrations → Your App (Client ID: `cb97b6bf-0f28-480e-a1e6-60e2924b6297`)
3. **Click on**: Authentication → Platform configurations → Web
4. **Add this redirect URI**:
   ```
   https://main.dmip7cam6gz9o.amplifyapp.com/auth/microsoft/callback
   ```
5. **Verify supported account types**:
   - Should be: "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts"
6. **Click Save**

### Step 2: Set AWS Amplify Environment Variables

#### Option A: Use AWS Console (Recommended - 2 minutes)

1. Go to: https://console.aws.amazon.com/amplify/home?region=us-east-1#/
2. Select your app
3. Go to: **App settings** → **Environment variables**
4. Add/Update these variables:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_MS_CLIENT_ID` | `cb97b6bf-0f28-480e-a1e6-60e2924b6297` |
| `NEXT_PUBLIC_MS_REDIRECT_URI` | `https://main.dmip7cam6gz9o.amplifyapp.com/auth/microsoft/callback` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `685420243888-5bbgpj4d0mau3h0ala8v3rt2clg7shsv.apps.googleusercontent.com` |
| `NEXT_PUBLIC_API_URL` | `https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com/api` |
| `NEXT_PUBLIC_APP_ORIGIN` | `https://main.dmip7cam6gz9o.amplifyapp.com` |

5. Also verify these are set (should already be there):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`

#### Option B: Use AWS CLI (1 minute)

Run the provided setup script:
```bash
cd new-frontend
./setup-amplify-env.sh
```

### Step 3: Trigger Amplify Rebuild

After setting the environment variables:

#### Option A: Via Console
1. In Amplify Console, go to your app
2. Click **Run build** button

#### Option B: Via Git Push
```bash
git add .
git commit -m "fix: Update Microsoft OAuth configuration"
git push origin main
```

### Step 4: Verify (2 minutes)

1. **Wait for build to complete** (~3-5 minutes)
2. **Check build logs** - Verify environment variables are written to `.env.production`
3. **Test Microsoft login**:
   - Go to: https://main.dmip7cam6gz9o.amplifyapp.com/auth/signin
   - Click "Sign in with Microsoft"
   - Should redirect to Microsoft login
   - Should successfully authenticate and return to your app

## Quick Verification Checklist

- [ ] Azure redirect URI added: `https://main.dmip7cam6gz9o.amplifyapp.com/auth/microsoft/callback`
- [ ] Amplify environment variables set (all NEXT_PUBLIC_* vars)
- [ ] Amplify app rebuilt successfully
- [ ] Build logs show environment variables in `.env.production`
- [ ] Microsoft sign-in works in production

## Troubleshooting

### Still getting "unauthorized_client"?
- Double-check the Azure redirect URI is **exactly** as specified (including https://)
- Verify the client ID in Azure matches: `cb97b6bf-0f28-480e-a1e6-60e2924b6297`

### Frontend shows "undefined" for Microsoft client ID?
- Check Amplify environment variables are set correctly
- Rebuild the Amplify app
- Check build logs for `.env.production` contents

### Backend returns 400 error?
- Backend is already fixed and deployed
- Check Lambda logs: `aws logs tail /aws/lambda/khanflow-backend-production-api --follow --region us-east-1`

## Files Changed

- [`amplify.yml`](../amplify.yml) - Added Microsoft OAuth env vars
- [`backend/src/config/microsoft.config.ts`](../backend/src/config/microsoft.config.ts) - Fixed env var mapping
- [`docs/setup/MICROSOFT_OAUTH_PRODUCTION_SETUP.md`](../docs/setup/MICROSOFT_OAUTH_PRODUCTION_SETUP.md) - Full documentation
- [`new-frontend/setup-amplify-env.sh`](../new-frontend/setup-amplify-env.sh) - Automated setup script

## Support

For detailed information, see: [`docs/setup/MICROSOFT_OAUTH_PRODUCTION_SETUP.md`](../docs/setup/MICROSOFT_OAUTH_PRODUCTION_SETUP.md)
