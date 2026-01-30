# Custom Domain Setup: khanflow.com

Complete guide for setting up your custom domain and verifying OAuth apps for Google, Microsoft, and Zoom.

## Current Setup (Before Custom Domain)

- **Frontend**: `https://main.dmip7cam6gz9o.amplifyapp.com`
- **Backend API**: `https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com`

## Target Setup (After Custom Domain)

- **Frontend**: `https://khanflow.com` or `https://app.khanflow.com`
- **Backend API**: `https://api.khanflow.com`

---

## Part 1: Set Up Custom Domain on AWS

### Step 1: Request SSL Certificate in AWS Certificate Manager

1. Go to [AWS Certificate Manager](https://console.aws.amazon.com/acm/home?region=us-east-1) (must be **us-east-1** for CloudFront/Amplify)
2. Click **Request a certificate**
3. Choose **Request a public certificate**
4. Add domain names:
   - `khanflow.com`
   - `*.khanflow.com` (wildcard for subdomains)
   - `app.khanflow.com` (if not using wildcard)
   - `api.khanflow.com` (if not using wildcard)
5. Validation method: **DNS validation** (recommended)
6. Click **Request**

### Step 2: Validate Certificate in Cloudflare

1. In ACM, click on your certificate
2. You'll see CNAME records for validation
3. Copy the **CNAME name** and **CNAME value**
4. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Select `khanflow.com`
5. Go to **DNS** → **Records**
6. For each validation record:
   - Click **Add record**
   - Type: `CNAME`
   - Name: (paste the CNAME name, remove `.khanflow.com` if included)
   - Target: (paste the CNAME value)
   - Proxy status: **DNS only** (gray cloud, not proxied)
   - TTL: Auto
   - Click **Save**
7. Wait 5-15 minutes for validation (check ACM - status should change to "Issued")

---

## Part 2: Configure Frontend Domain (AWS Amplify)

### Option A: Use Root Domain (khanflow.com)

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/home?region=us-east-1)
2. Select your app (should be `khanflow` or similar)
3. Click **Domain management** in left menu
4. Click **Add domain**
5. Select domain: Enter `khanflow.com`
6. Amplify will show DNS configuration needed
7. **In Cloudflare**, add these records:
   - Type: `CNAME`
   - Name: `@` (root domain)
   - Target: (the Amplify target, e.g., `d1234567890.cloudfront.net`)
   - Proxy status: **DNS only** (must be gray cloud)
   - TTL: Auto
8. Add subdomain redirect (optional but recommended):
   - In Amplify, also configure `www.khanflow.com` → redirect to `khanflow.com`
   - In Cloudflare, add:
     - Type: `CNAME`
     - Name: `www`
     - Target: (same Amplify target)
     - Proxy status: **DNS only**
9. Click **Save** in Amplify
10. Wait 15-30 minutes for DNS propagation

### Option B: Use Subdomain (app.khanflow.com) - Recommended

1. Same as Option A, but use `app.khanflow.com` instead
2. In Cloudflare, add:
   - Type: `CNAME`
   - Name: `app`
   - Target: (Amplify target)
   - Proxy status: **DNS only**

---

## Part 3: Configure Backend API Domain (API Gateway + CloudFront)

### Option 1: Using API Gateway Custom Domain (Simpler)

1. Go to [API Gateway Console](https://console.aws.amazon.com/apigateway/home?region=us-east-1)
2. Click **Custom domain names** in left menu
3. Click **Create**
4. Configure:
   - **Domain name**: `api.khanflow.com`
   - **TLS version**: `TLS 1.2` (recommended)
   - **ACM certificate**: Select the certificate you created
   - **Endpoint type**: `Regional`
5. Click **Create domain name**
6. After creation, click **API mappings** tab
7. Click **Configure API mappings**
8. Add mapping:
   - **API**: Select your API (look for `khanflow-backend-production-api` or the HTTP API)
   - **Stage**: `$default` or your stage name
   - **Path**: leave empty (or use `/api` if you want `api.khanflow.com/api/...`)
9. Click **Save**
10. Copy the **API Gateway domain name** (e.g., `d-abc123xyz.execute-api.us-east-1.amazonaws.com`)
11. **In Cloudflare**:
    - Type: `CNAME`
    - Name: `api`
    - Target: (paste the API Gateway domain name)
    - Proxy status: **DNS only** (important!)
    - TTL: Auto
    - Click **Save**

### Option 2: Using CloudFront Distribution (More control, caching)

If you need more control, caching, or better global performance, you can create a CloudFront distribution pointing to your API Gateway.

---

## Part 4: Update Environment Variables

### Backend Environment Variables (.env)

Update your production variables:

```bash
# Production URLs with custom domain
PROD_FRONTEND_ORIGIN=https://khanflow.com  # or https://app.khanflow.com
PROD_FRONTEND_INTEGRATION_URL=https://khanflow.com/integrations  # or https://app.khanflow.com/integrations

# OAuth Redirect URIs - Update these
PROD_GOOGLE_REDIRECT_URI=https://khanflow.com/auth/google/callback
PROD_GOOGLE_INTEGRATION_REDIRECT_URI=https://api.khanflow.com/api/integration/google/callback

PROD_MICROSOFT_REDIRECT_URI=https://api.khanflow.com/api/integration/microsoft/callback

PROD_ZOOM_REDIRECT_URI=https://api.khanflow.com/api/integration/zoom/callback
```

### Amplify Environment Variables

Update in AWS Amplify Console → App settings → Environment variables:

```
NEXT_PUBLIC_API_URL=https://api.khanflow.com
NEXT_PUBLIC_APP_ORIGIN=https://khanflow.com
```

### Redeploy

```bash
# Backend
cd backend
npm run deploy

# Frontend will auto-deploy when you save the environment variables in Amplify
```

---

## Part 5: OAuth App Verification

### A. Google OAuth - Publisher Verification & OAuth Consent Screen

#### 1. Configure OAuth Consent Screen for Production

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent)
2. Select your project
3. Edit OAuth consent screen:
   - **App name**: Khanflow
   - **User support email**: Your email
   - **App logo**: Upload your logo (120x120 px PNG)
   - **App domain**:
     - Homepage: `https://khanflow.com`
     - Privacy policy: `https://khanflow.com/privacy`
     - Terms of service: `https://khanflow.com/terms`
   - **Authorized domains**: 
     - Add: `khanflow.com`
   - **Developer contact**: Your email
   - Click **Save and Continue**

#### 2. Configure Scopes

1. Click **Add or Remove Scopes**
2. Select these scopes:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/tasks`
   - `https://www.googleapis.com/auth/tasks.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `openid`
3. Click **Update** → **Save and Continue**

#### 3. Update Authorized Redirect URIs

1. Go to **Credentials** → Select your OAuth 2.0 Client ID
2. Under **Authorized redirect URIs**, add:
   ```
   https://khanflow.com/auth/google/callback
   https://api.khanflow.com/api/integration/google/callback
   ```
3. Keep localhost URIs for development:
   ```
   http://localhost:3000/auth/google/callback
   http://localhost:8000/api/integration/google/callback
   ```
4. Click **Save**

#### 4. Request Verification (Production Readiness)

**Important**: Until verified, your app will show "unverified" warning and be limited to 100 users.

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. You should see **Publishing status: Testing**
3. Click **Publish App**
4. Review the requirements:
   - Privacy policy hosted at your domain
   - Terms of service hosted at your domain
   - Homepage URL
5. Click **Confirm**
6. For full verification (to remove "unverified" warning):
   - Google requires a verification process for apps requesting sensitive scopes
   - Click **Prepare for verification** and follow the steps
   - This includes:
     - Providing a YouTube video demo of your app
     - Explaining why you need each scope
     - Privacy policy review
   - Processing time: 2-6 weeks

**Temporary Solution**: While in testing mode:
- Add test users in the OAuth consent screen
- These users won't see the unverified warning
- Limit: 100 test users

---

### B. Microsoft OAuth - Publisher Verification

#### 1. Add Custom Domain to Azure AD First

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** (Entra ID)
3. Click **Custom domain names** in left menu
4. Click **+ Add custom domain**
5. Enter `khanflow.com`
6. Click **Add domain**
7. You'll see DNS verification records

#### 2. Verify Domain in Cloudflare

1. Copy the verification record from Azure (TXT or MX record)
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → `khanflow.com`
3. Go to **DNS** → **Records**
4. Add record:
   - Type: `TXT` (or `MX` if Azure shows that)
   - Name: `@`
   - Content: (paste the verification value from Azure)
   - TTL: Auto
5. Click **Save**
6. Back in Azure, click **Verify** (may take 5-15 minutes)

#### 3. Set Publisher Domain for Your App

1. In Azure Portal, go to **App registrations**
2. Select your app (`khanflow_prod` or similar)
3. Click **Branding & properties** in left menu
4. Set **Publisher domain**: `khanflow.com`
5. Click **Save**

#### 4. Complete Publisher Verification (Optional but Recommended)

**Benefits**: Removes "unverified" tag and allows access without admin consent in organizations.

**Requirements**:
- Microsoft Partner Network (MPN) membership (free)
- Verified domain ownership (done above)

**Steps**:
1. Join Microsoft Partner Network:
   - Go to [Microsoft Partner Center](https://partner.microsoft.com/)
   - Sign up (free)
   - Complete business verification
2. In Azure Portal → App registration → **Branding & properties**
3. Under **Publisher verification**, click **Add MPN ID**
4. Enter your MPN ID
5. Click **Verify**
6. Microsoft will review (typically 24-48 hours)

#### 5. Update Redirect URIs

1. In your app registration, go to **Authentication**
2. Under **Redirect URIs**, add:
   ```
   https://khanflow.com/auth/microsoft/callback
   https://api.khanflow.com/api/integration/microsoft/callback
   ```
3. Keep localhost for development
4. Click **Save**

#### 6. Configure Admin Consent URL (For Organizations)

For organization accounts that require admin consent, provide this URL:

```
https://login.microsoftonline.com/common/admins/consent?client_id=YOUR_CLIENT_ID&redirect_uri=https://api.khanflow.com/api/integration/microsoft/callback
```

Replace `YOUR_CLIENT_ID` with your actual Microsoft Client ID.

---

### C. Zoom OAuth - App Approval

#### 1. Update Redirect URIs

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Click **Manage** → **Created Apps**
3. Select your app
4. Go to **Basic Information** → **App Credentials** section
5. Under **OAuth Redirect URL**, add:
   ```
   https://api.khanflow.com/api/integration/zoom/callback
   ```
6. Keep localhost for development
7. Click **Save**

#### 2. Configure App Information for Marketplace

1. **App Information**:
   - App name: Khanflow
   - Short description: Smart calendar and meeting management
   - Long description: (Provide detailed description of your app)
   - Developer contact: Your email
   - Company: Your company name

2. **App Branding**:
   - Upload app icon (required, at least 512x512 px)
   - Upload screenshots showing your app's functionality

3. **App Features**:
   - Describe how your app uses Zoom integration
   - List key features

#### 3. Submit for Zoom App Approval (Optional)

**If you want to list your app publicly on Zoom Marketplace**:

1. Complete all required fields in the app configuration
2. Test your OAuth flow thoroughly
3. Click **Submit for Review** in your app dashboard
4. Zoom will review your app (typically 1-2 weeks)

**If you only need it for your users**:
- You can keep it as a **private app** (not listed on marketplace)
- No approval needed, works immediately
- Users install via direct link or integration page

#### 4. Activation

1. In your Zoom app settings
2. Toggle **Activation** to **ON**
3. Your app is now ready to use

---

## Part 6: Testing Checklist

After setting up everything, test thoroughly:

### DNS Propagation
```bash
# Check if DNS is resolving
dig khanflow.com
dig app.khanflow.com
dig api.khanflow.com

# Or use
nslookup khanflow.com
nslookup api.khanflow.com
```

### Frontend Tests
1. Visit `https://khanflow.com` (or `https://app.khanflow.com`)
2. Verify SSL certificate (should show padlock in browser)
3. Check that pages load correctly
4. Test login functionality

### Backend API Tests
```bash
# Test API health endpoint
curl https://api.khanflow.com/health

# Or in browser
https://api.khanflow.com/health
```

### OAuth Flow Tests
1. **Google**: Sign in → Integrate Google Calendar → Check consent screen
2. **Microsoft**: Sign in → Integrate Outlook/Teams → Check consent screen
3. **Zoom**: Integrate Zoom → Create a meeting → Verify it works

### Integration Tests
1. Create a meeting via each integration
2. Check calendar sync
3. Verify webhooks (if any)
4. Test task management features

---

## Part 7: SSL/TLS Configuration (Cloudflare)

### Recommended Settings for Cloudflare

1. Go to Cloudflare Dashboard → `khanflow.com`
2. **SSL/TLS** tab:
   - Encryption mode: **Full (strict)** (recommended)
   - Always Use HTTPS: **On**
   - Minimum TLS Version: **TLS 1.2**
   - Automatic HTTPS Rewrites: **On**

3. **DNS** settings:
   - For records pointing to AWS (Amplify, API Gateway):
   - **Must use DNS only (gray cloud)** - not proxied
   - AWS services handle SSL themselves

### Why "DNS only" for AWS Services?

- AWS Amplify and API Gateway already provide SSL/TLS
- Cloudflare proxy can cause conflicts with AWS SSL certificates
- "DNS only" mode still uses Cloudflare's DNS but lets AWS handle SSL

---

## Part 8: Rollout Strategy

### Phase 1: Set Up Domains (Day 1)
- ✅ Request SSL certificate in ACM
- ✅ Configure DNS in Cloudflare
- ✅ Set up Amplify custom domain
- ✅ Set up API Gateway custom domain

### Phase 2: Update Configs (Day 1-2)
- ✅ Update backend environment variables
- ✅ Update frontend environment variables
- ✅ Redeploy backend to Lambda
- ✅ Redeploy frontend via Amplify

### Phase 3: Update OAuth Apps (Day 2-3)
- ✅ Update Google OAuth redirect URIs
- ✅ Update Microsoft OAuth redirect URIs
- ✅ Update Zoom OAuth redirect URIs
- ✅ Test all OAuth flows

### Phase 4: Verification (Week 1-2)
- ✅ Add verified domain to Azure AD
- ✅ Set publisher domain in Microsoft app
- ✅ Configure Google OAuth consent screen
- ✅ Test with real users

### Phase 5: Submit for Verification (Week 2-4)
- 🔄 Google: Prepare verification materials (optional)
- 🔄 Microsoft: Complete publisher verification (optional)
- 🔄 Zoom: Submit for marketplace approval (optional)

---

## Quick Start Commands

```bash
# 1. Update backend .env file with new domains
cd /Users/md.mashiurrahmankhan/Downloads/projects/khanflow/backend

# Edit .env file - update PROD_* variables with khanflow.com URLs

# 2. Redeploy backend
npm run deploy

# 3. Update Amplify environment variables
# (Do this in AWS Amplify Console UI)

# 4. Test DNS
dig khanflow.com
dig api.khanflow.com

# 5. Test API
curl https://api.khanflow.com/health

# 6. Test frontend
open https://khanflow.com
```

---

## Troubleshooting

### DNS Not Resolving
- Wait 15-30 minutes for DNS propagation
- Check Cloudflare DNS records are set to "DNS only" (gray cloud)
- Verify ACM certificate is "Issued" status

### SSL Certificate Errors
- Ensure certificate in ACM is for correct regions (us-east-1 for CloudFront/Amplify)
- Check that all domain names are included in certificate
- Verify DNS validation is complete

### OAuth Redirect URI Mismatch
- URIs must match exactly (including protocol, domain, path)
- Check for trailing slashes
- Verify you updated both development and production OAuth apps

### "Unverified App" Warnings
- Add test users to Google OAuth consent screen (temporary)
- Complete publisher verification for Microsoft
- These warnings won't prevent functionality, just warn users

---

## Support Resources

- **AWS Support**: https://console.aws.amazon.com/support/
- **Cloudflare Support**: https://dash.cloudflare.com/?to=/:account/support
- **Google OAuth**: https://support.google.com/cloud/
- **Microsoft Azure**: https://azure.microsoft.com/support/
- **Zoom Support**: https://support.zoom.us/

---

## Summary

This guide covers:
- ✅ Custom domain setup with Cloudflare DNS
- ✅ SSL certificate configuration in AWS
- ✅ Frontend domain (Amplify)
- ✅ Backend API domain (API Gateway)
- ✅ OAuth app updates for Google, Microsoft, Zoom
- ✅ Publisher verification processes
- ✅ Testing and validation

Follow the phases in order, test thoroughly at each step, and your app will be running on **khanflow.com** with proper OAuth verification!
