# AWS Lambda Backend Deployment - Complete ✅

## Deployment Summary

Your Khanflow backend has been successfully deployed to AWS Lambda!

**API Endpoint:** `https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com`

## What Was Configured

### 1. Lambda Handler
- Created `backend/src/lambda.ts` - wraps Express app for AWS Lambda
- Uses `@vendia/serverless-express` for seamless integration
- Handles warm starts for better performance

### 2. Express App Updates
- Modified `backend/src/index.ts` to export app
- Conditional server startup (only runs locally, not in Lambda)
- Added database initialization for Lambda cold starts

### 3. Serverless Configuration (`backend/serverless.yml`)
- AWS Lambda runtime: Node.js 20.x
- Region: us-east-1
- Memory: 1024 MB
- Timeout: 30 seconds
- Environment variables: All secrets and configs properly configured
- API Gateway HTTP API: Handles all HTTP methods

### 4. Dependencies Fixed
- **Replaced `bcrypt` with `bcryptjs`**: Native dependencies don't work in Lambda without Docker builds. `bcryptjs` is a pure JavaScript implementation that works perfectly in Lambda.
- All TypeScript compilation working correctly

### 5. IAM Permissions Added
Successfully added these permissions to `github-actions-khanflow` user:
- CloudFormation (create/update stacks)
- Lambda (create/update functions)
- API Gateway (create HTTP APIs)
- IAM (create roles, tag roles)
- S3 (deployment artifacts)
- CloudWatch Logs

## Deployment Command

```bash
cd backend
set -a && source .env && set +a
npm run deploy:production
```

## Testing the API

```bash
# Test root endpoint (intentionally throws error in code)
curl https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com/

# Test with auth endpoint
curl https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com/api/auth/me
```

## Known Issues & Next Steps

### 1. Database Connection
There's a database authentication error occurring. This needs to be investigated:
- Supabase pooler connection might need additional configuration
- Check if Supabase IP allowlist needs Lambda IP ranges
- Consider adding `?pgbouncer=true` to DATABASE_URL if using transaction pooling

**Recommended fix:**
1. Go to Supabase Dashboard → Settings → Database
2. Check connection pooler mode (Session vs Transaction)
3. If using Transaction mode, add `?pgbouncer=true` to DATABASE_URL
4. Verify no IP restrictions are blocking AWS Lambda

### 2. Frontend Deployment (Next Step)
Now deploy the frontend to AWS Amplify:

1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/
2. Click **"New app"** → **"Host web app"**
3. Connect to GitHub repository `khanflow`
4. Select branch: `main`
5. Configure monorepo:
   - **App root directory:** `new-frontend`
   - Build settings will auto-detect from `amplify.yml`
6. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   OPENAI_API_KEY=<your-openai-key>
   ```
7. Click **"Save and deploy"**
8. Wait 5-10 minutes for build and deployment

### 3. OAuth Redirect URIs Update
After Amplify deployment (you'll get a domain like `https://main.dxxxxxxx.amplifyapp.com`):

**Google Cloud Console:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client
3. Add to Authorized redirect URIs:
   ```
   https://main.dxxxxxxx.amplifyapp.com/auth/google/callback
   ```

**Azure Portal (Microsoft):**
1. Go to Azure AD → App registrations
2. Find your app → Authentication
3. Add redirect URI:
   ```
   https://main.dxxxxxxx.amplifyapp.com/auth/microsoft/callback
   ```

### 4. Update Backend Environment Variables
After getting your Amplify domain, update these in backend `.env`:
```bash
FRONTEND_ORIGIN=https://main.dxxxxxxx.amplifyapp.com
FRONTEND_INTEGRATION_URL=https://main.dxxxxxxx.amplifyapp.com
GOOGLE_REDIRECT_URI=https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com/api/auth/google/callback
MS_REDIRECT_URI=https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com/api/auth/microsoft/callback
```

Then redeploy backend:
```bash
cd backend
set -a && source .env && set +a
npm run deploy:production
```

### 5. Database Migrations
Run migrations against production database:
```bash
cd backend
set -a && source .env && set +a
npm run db:migrate
```

## Architecture Overview

```
┌─────────────────┐
│  AWS Amplify    │
│  (Frontend)     │
│  Next.js SSR    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  API Gateway    │
│  HTTP API       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AWS Lambda     │
│  Express.js     │
│  (Backend)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  PostgreSQL     │
└─────────────────┘
```

## Cost Estimate

**AWS Lambda:**
- Free tier: 1M requests/month + 400,000 GB-seconds compute
- Expected: $5-15/month after free tier

**AWS Amplify:**
- Free tier: 1000 build minutes/month + 15 GB served/month
- Expected: $0-20/month (depends on traffic)

**API Gateway:**
- $1.00 per million requests

**Total: ~$13-35/month** (compared to $60-100/month for ECS Fargate)

## Monitoring & Logs

View Lambda logs:
```bash
cd backend
set -a && source .env && set +a
npx serverless logs -f api --stage production --tail
```

Or go to AWS CloudWatch: https://console.aws.amazon.com/cloudwatch/
- Navigate to Logs → Log groups → `/aws/lambda/khanflow-backend-production-api`

## Rollback

If you need to remove the Lambda deployment:
```bash
cd backend
set -a && source .env && set +a
npx serverless remove --stage production
```

## Files Changed

### Created:
- `backend/src/lambda.ts` - Lambda handler
- `backend/serverless.yml` - Infrastructure config
- `backend/serverless-deploy-policy.json` - IAM permissions
- `new-frontend/amplify.yml` - Amplify build config
- `backend/scripts/deploy-lambda.sh` - Deployment script

### Modified:
- `backend/src/index.ts` - Export app, conditional server start
- `backend/package.json` - Added serverless dependencies
- `backend/src/utils/bcrypt.ts` - Changed to bcryptjs
- `backend/src/services/auth.service.ts` - Changed to bcryptjs
- `backend/src/database/database.ts` - Graceful error handling for Lambda

## Support

If you encounter issues:
1. Check Lambda logs: `npx serverless logs -f api --stage production --startTime 10m`
2. Verify environment variables are set correctly
3. Test database connection from your local machine
4. Check AWS CloudWatch for detailed error logs
