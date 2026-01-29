# Microsoft OAuth Production Setup

## Issue
Microsoft sign-in is failing in production with error:
```
unauthorized_client: The client does not exist or is not enabled for consumers.
```

## Root Causes Identified

1. **Frontend**: Missing `NEXT_PUBLIC_MS_CLIENT_ID` in Amplify production build
2. **Backend**: Environment variables not properly mapped in serverless deployment
3. **Azure**: Missing production redirect URIs in Azure App Registration

## Solution

### 1. Frontend Environment Variables (Amplify)

Add the following environment variables to your AWS Amplify application:

**Go to**: AWS Amplify Console → Your App → Environment Variables

Add these variables:

```
NEXT_PUBLIC_MS_CLIENT_ID=cb97b6bf-0f28-480e-a1e6-60e2924b6297
NEXT_PUBLIC_MS_REDIRECT_URI=https://main.dmip7cam6gz9o.amplifyapp.com/auth/microsoft/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=685420243888-5bbgpj4d0mau3h0ala8v3rt2clg7shsv.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com/api
NEXT_PUBLIC_APP_ORIGIN=https://main.dmip7cam6gz9o.amplifyapp.com
```

### 2. Azure App Registration Configuration

**Go to**: [Azure Portal](https://portal.azure.com) → Azure Active Directory → App Registrations → Your App

#### Add Redirect URIs

1. Navigate to **Authentication** section
2. Under **Platform configurations** → **Web**
3. Add the following redirect URIs:

```
https://main.dmip7cam6gz9o.amplifyapp.com/auth/microsoft/callback
```

4. Click **Save**

#### Verify API Permissions

Ensure the following permissions are configured under **API permissions**:

- `openid` (Delegated)
- `profile` (Delegated)
- `email` (Delegated)
- `User.Read` (Delegated)
- `Calendars.ReadWrite` (Delegated)
- `OnlineMeetings.ReadWrite` (Delegated)
- `Tasks.ReadWrite` (Delegated)
- `offline_access` (Delegated)

#### Supported Account Types

Under **Authentication** → **Supported account types**, select:
- ✅ **Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)**

This allows both organizational and personal Microsoft accounts to sign in.

### 3. Backend Environment Variables (Lambda)

The backend is already configured in `serverless.yml` to use these environment variables. 

Ensure your `.env` file has these production variables (with your actual secret values):

```bash
PROD_MICROSOFT_CLIENT_ID=cb97b6bf-0f28-480e-a1e6-60e2924b6297
PROD_MICROSOFT_CLIENT_SECRET=<your_microsoft_client_secret>
PROD_MICROSOFT_REDIRECT_URI=https://main.dmip7cam6gz9o.amplifyapp.com/auth/microsoft/callback
PROD_FRONTEND_ORIGIN=https://main.dmip7cam6gz9o.amplifyapp.com
```

**Note**: Replace `<your_microsoft_client_secret>` with the actual secret from Azure Portal.

### 4. Deployment Steps

After making the above changes:

#### Deploy Backend:
```bash
cd backend
export $(grep "^PROD_" .env | xargs)
npm run build
npx serverless deploy --stage production
```

#### Deploy Frontend (Amplify):
Amplify will automatically rebuild when you push to the main branch, or trigger a manual deployment from the Amplify Console.

## Verification

1. **Check Frontend Build**: Verify that the Amplify build logs show the environment variables being written to `.env.production`

2. **Test Microsoft Login**:
   - Go to https://main.dmip7cam6gz9o.amplifyapp.com/auth/signin
   - Click "Sign in with Microsoft"
   - Should redirect to Microsoft login
   - After authentication, should redirect back to your app

3. **Check Backend Logs**:
```bash
aws logs tail /aws/lambda/khanflow-backend-production-api --follow --region us-east-1
```

## Troubleshooting

### Error: "unauthorized_client"
- Verify the client ID in Azure matches the one in Amplify environment variables
- Verify the redirect URI in Azure matches exactly (including https://)

### Error: "redirect_uri_mismatch"
- Check that the redirect URI in Azure App Registration matches your production URL exactly
- Both frontend and backend need to use the same redirect URI format

### Frontend shows "undefined" for client ID
- Verify Amplify environment variables are set
- Check Amplify build logs to ensure variables are written to `.env.production`
- Redeploy the frontend application

### Backend token exchange fails
- Check Lambda environment variables in AWS Console
- Verify `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` are set
- Check that backend is using the correct redirect URI

## Files Modified

- [`amplify.yml`](../../amplify.yml) - Added Microsoft OAuth env vars to build
- [`backend/src/config/microsoft.config.ts`](../../backend/src/config/microsoft.config.ts) - Updated to use Lambda env vars
- [`backend/serverless.yml`](../../backend/serverless.yml) - Already configured with PROD_ variables

## Additional Resources

- [Microsoft OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Azure App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [AWS Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
