# Khanflow AWS Amplify Serverless Deployment Guide

Complete guide for deploying Khanflow as a fully serverless application using AWS Amplify for frontend and AWS Lambda for backend.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Migration to Lambda](#backend-migration-to-lambda)
4. [Frontend Amplify Setup](#frontend-amplify-setup)
5. [Environment Variables](#environment-variables)
6. [Deployment Steps](#deployment-steps)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Monitoring & Debugging](#monitoring--debugging)
9. [Cost Estimation](#cost-estimation)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Current Architecture
```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Next.js   │─────▶│   Express   │─────▶│   Supabase   │
│  Frontend   │      │   Backend   │      │  PostgreSQL  │
└─────────────┘      └─────────────┘      └──────────────┘
```

### New Serverless Architecture
```
┌──────────────────┐      ┌───────────────────┐      ┌──────────────┐
│  Amplify Hosting │      │   API Gateway +   │      │   Supabase   │
│    Next.js SSR   │─────▶│  Lambda Functions │─────▶│  PostgreSQL  │
│   + CloudFront   │      │  (Express API)    │      │              │
└──────────────────┘      └───────────────────┘      └──────────────┘
```

**Benefits:**
- ✅ Auto-scaling (frontend and backend)
- ✅ Pay only for actual usage
- ✅ No server management
- ✅ Built-in SSL/CDN
- ✅ GitHub auto-deploy
- ✅ Lower cost for low-traffic apps

**Trade-offs:**
- ⚠️ Cold starts (200-500ms for first request)
- ⚠️ Lambda timeouts (max 15 minutes, recommend <30s)
- ⚠️ More complex debugging initially

---

## Prerequisites

✅ **What you already have:**
- AWS Account configured
- GitHub repository
- Supabase production database
- All OAuth credentials
- ECR repositories (we'll keep these for CI/CD testing)

✅ **What you need to install:**
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Verify installation
amplify --version
```

---

## Backend Migration to Lambda

### Step 1: Install Serverless Dependencies

```bash
cd backend

# Install serverless framework and AWS Lambda adapter
npm install --save-dev serverless serverless-offline
npm install --save aws-serverless-express @vendia/serverless-express
```

### Step 2: Create Lambda Handler

We'll wrap your Express app to work with Lambda without changing your existing routes.

**File: `backend/src/lambda.ts`** (I'll create this for you)

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import app from './index'; // Your existing Express app

let serverlessExpressInstance: any;

async function setup(event: APIGatewayProxyEvent, context: Context) {
  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }
  return setup(event, context);
};
```

### Step 3: Update Express App Export

Your `backend/src/index.ts` needs to export the app without listening on a port.

**Modify `backend/src/index.ts`:**

```typescript
// ... existing imports and setup ...

const app = express();

// ... all your middleware and routes ...

// Export app for Lambda (don't call app.listen in production)
export default app;

// Only start server in non-Lambda environment (local development)
if (process.env.NODE_ENV !== 'production' || process.env.AWS_EXECUTION_ENV === undefined) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
```

### Step 4: Create Serverless Configuration

**File: `backend/serverless.yml`** (I'll create this for you)

```yaml
service: khanflow-backend

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: ${opt:stage, 'production'}
  timeout: 30
  memorySize: 1024
  environment:
    NODE_ENV: production
    DATABASE_URL: ${env:PROD_DATABASE_URL}
    JWT_SECRET: ${env:PROD_JWT_SECRET}
    GOOGLE_CLIENT_ID: ${env:PROD_GOOGLE_CLIENT_ID}
    GOOGLE_CLIENT_SECRET: ${env:PROD_GOOGLE_CLIENT_SECRET}
    GOOGLE_REDIRECT_URI: ${env:PROD_GOOGLE_REDIRECT_URI}
    MICROSOFT_CLIENT_ID: ${env:PROD_MICROSOFT_CLIENT_ID}
    MICROSOFT_CLIENT_SECRET: ${env:PROD_MICROSOFT_CLIENT_SECRET}
    MICROSOFT_REDIRECT_URI: ${env:PROD_MICROSOFT_REDIRECT_URI}
    OPENAI_API_KEY: ${env:PROD_OPENAI_API_KEY}
    FRONTEND_ORIGIN: ${env:PROD_FRONTEND_ORIGIN}
    FRONTEND_INTEGRATION_URL: ${env:PROD_FRONTEND_INTEGRATION_URL}
    SUPABASE_URL: ${env:PROD_SUPABASE_URL}
    SUPABASE_SERVICE_ROLE_KEY: ${env:PROD_SUPABASE_SERVICE_ROLE_KEY}

functions:
  api:
    handler: dist/lambda.handler
    events:
      - httpApi: '*'

plugins:
  - serverless-offline

custom:
  serverless-offline:
    httpPort: 8000
```

### Step 5: Update Backend Package.json Scripts

Add deployment scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "build:lambda": "tsc && cp -r node_modules dist/",
    "deploy": "npm run build && serverless deploy",
    "deploy:production": "npm run build && serverless deploy --stage production",
    "test:lambda": "serverless offline",
    "remove": "serverless remove"
  }
}
```

---

## Frontend Amplify Setup

### Step 1: Initialize Amplify in Frontend

```bash
cd ../new-frontend

# Configure Amplify (one-time setup)
amplify configure

# Initialize Amplify in your project
amplify init
```

**Answer the prompts:**
```
? Enter a name for the project: khanflow
? Initialize the project with the above configuration? No
? Enter a name for the environment: production
? Choose your default editor: Visual Studio Code
? Choose the type of app that you're building: javascript
? What javascript framework are you using: react
? Source Directory Path: .
? Distribution Directory Path: .next
? Build Command: npm run build
? Start Command: npm run start
? Select the authentication method you want to use: AWS profile
? Please choose the profile you want to use: default
```

### Step 2: Add Amplify Hosting

```bash
# Add hosting with Amplify Console
amplify add hosting
```

**Answer the prompts:**
```
? Select the plugin module to execute: Hosting with Amplify Console
? Choose a type: Manual deployment
```

### Step 3: Create amplify.yml Build Configuration

**File: `new-frontend/amplify.yml`** (I'll create this for you)

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" >> .env.production
        - echo "NEXT_PUBLIC_APP_ORIGIN=$NEXT_PUBLIC_APP_ORIGIN" >> .env.production
        - echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" >> .env.production
        - echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" >> .env.production
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

---

## Environment Variables

### Backend Environment Variables (Lambda)

Set these in your local `.env` file for deployment, or use AWS Systems Manager Parameter Store:

```bash
# Create .env file in backend directory
cat > backend/.env << 'EOF'
PROD_DATABASE_URL=postgresql://user:pass@host.supabase.co:5432/postgres
PROD_JWT_SECRET=your-jwt-secret-here
PROD_GOOGLE_CLIENT_ID=your-google-client-id
PROD_GOOGLE_CLIENT_SECRET=your-google-client-secret
PROD_GOOGLE_REDIRECT_URI=https://your-amplify-domain.amplifyapp.com/auth/google/callback
PROD_MICROSOFT_CLIENT_ID=your-microsoft-client-id
PROD_MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
PROD_MICROSOFT_REDIRECT_URI=https://your-amplify-domain.amplifyapp.com/auth/microsoft/callback
PROD_OPENAI_API_KEY=sk-your-openai-key
PROD_FRONTEND_ORIGIN=https://your-amplify-domain.amplifyapp.com
PROD_FRONTEND_INTEGRATION_URL=https://your-amplify-domain.amplifyapp.com/integrations
PROD_SUPABASE_URL=https://yourproject.supabase.co
PROD_SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
EOF
```

### Frontend Environment Variables (Amplify Console)

You'll add these in the Amplify Console UI after deployment:

```
NEXT_PUBLIC_API_URL=https://<your-api-gateway-url>.execute-api.us-east-1.amazonaws.com
NEXT_PUBLIC_APP_ORIGIN=https://<your-amplify-domain>.amplifyapp.com
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=sk-your-openai-key
```

---

## Deployment Steps

### Phase 1: Deploy Backend to Lambda (20 minutes)

#### 1. Build and Deploy Lambda Function

```bash
cd backend

# Load environment variables
source .env

# Build TypeScript
npm run build

# Deploy to AWS Lambda + API Gateway
npm run deploy:production
```

**Expected output:**
```
✔ Service deployed to stack khanflow-backend-production

endpoint: https://abc123xyz.execute-api.us-east-1.amazonaws.com
functions:
  api: khanflow-backend-production-api
```

**📝 IMPORTANT: Copy the `endpoint` URL - you'll need it for the frontend!**

#### 2. Test Lambda Function

```bash
# Test the health endpoint
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-28T..."}
```

### Phase 2: Deploy Frontend to Amplify (30 minutes)

#### Option A: Deploy via Amplify Console (Recommended)

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify/
2. **Click "New app" → "Host web app"**
3. **Connect GitHub:**
   - Select your `khanflow` repository
   - Branch: `main`
   - Enable auto-deploy: ✅

4. **Configure build settings:**
   - App name: `khanflow-frontend`
   - Monorepo: Root directory = `new-frontend`
   - Build command: Auto-detected ✓
   - Custom build spec: Upload `amplify.yml` (I'll create this)

5. **Add environment variables:**
   ```
   NEXT_PUBLIC_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com
   NEXT_PUBLIC_APP_ORIGIN=https://main.d1234567890.amplifyapp.com
   NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   OPENAI_API_KEY=sk-your-openai-key
   ```

6. **Review and deploy** → Click "Save and deploy"

**Wait 5-10 minutes for build to complete.**

#### Option B: Deploy via CLI

```bash
cd new-frontend

# Set environment variables
export NEXT_PUBLIC_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com
export NEXT_PUBLIC_APP_ORIGIN=https://main.d1234567890.amplifyapp.com

# Deploy
amplify publish
```

### Phase 3: Update OAuth Redirect URIs (10 minutes)

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth client
3. Add to **Authorized redirect URIs**:
   - `https://main.d1234567890.amplifyapp.com/auth/google/callback`
4. Add to **Authorized JavaScript origins**:
   - `https://main.d1234567890.amplifyapp.com`

#### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Select your app registration
3. Go to **Authentication** → **Web**
4. Add redirect URI:
   - `https://main.d1234567890.amplifyapp.com/auth/microsoft/callback`

### Phase 4: Update Backend Environment Variables (5 minutes)

Update Lambda function with correct frontend URL:

```bash
cd backend

# Update .env with actual Amplify domain
nano .env
# Change PROD_FRONTEND_ORIGIN and PROD_FRONTEND_INTEGRATION_URL

# Redeploy
npm run deploy:production
```

### Phase 5: Add Custom Domain (Optional - 15 minutes)

#### In Amplify Console:

1. **Domain management** → **Add domain**
2. Enter your domain: `khanflow.com`
3. Amplify creates SSL certificate automatically
4. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: main.d1234567890.amplifyapp.com
   
   Type: A/ALIAS
   Name: @
   Value: (provided by Amplify)
   ```
5. Wait for DNS propagation (10-60 minutes)

#### Update API Gateway Custom Domain:

```bash
# Create custom domain for API
aws apigatewayv2 create-domain-name \
  --domain-name api.khanflow.com \
  --domain-name-configurations CertificateArn=<ACM_CERT_ARN>

# Create API mapping
aws apigatewayv2 create-api-mapping \
  --domain-name api.khanflow.com \
  --api-id <API_GATEWAY_ID> \
  --stage production
```

---

## Post-Deployment Configuration

### 1. Run Database Migrations

```bash
cd backend

# Run migrations against production database
DATABASE_URL=$PROD_DATABASE_URL npm run migration:run
```

### 2. Test All Endpoints

```bash
# Backend health check
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/api/health

# Frontend
curl https://main.d1234567890.amplifyapp.com

# Test OAuth flow (in browser)
open https://main.d1234567890.amplifyapp.com/auth/google
```

### 3. Configure CORS in Backend

Ensure your Express CORS configuration allows Amplify domain:

```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    'https://main.d1234567890.amplifyapp.com' // Add your Amplify domain
  ],
  credentials: true
}));
```

---

## Monitoring & Debugging

### CloudWatch Logs

**Backend Lambda Logs:**
```bash
# View logs
aws logs tail /aws/lambda/khanflow-backend-production-api --follow

# Filter errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/khanflow-backend-production-api \
  --filter-pattern "ERROR"
```

**Frontend Build Logs:**
- Go to Amplify Console → Your app → Build history → Click build → View logs

### X-Ray Tracing

Enable X-Ray for Lambda to trace requests:

```yaml
# Add to serverless.yml
provider:
  tracing:
    lambda: true
    apiGateway: true
```

### Key Metrics to Monitor

1. **Lambda Duration**: Should be < 3000ms (usually 200-500ms)
2. **Lambda Errors**: Should be < 1%
3. **Lambda Throttles**: Should be 0
4. **API Gateway 4xx/5xx**: Should be < 5%
5. **Amplify Build Success Rate**: Should be 100%

---

## Cost Estimation

### Lambda Function (Backend)

**AWS Lambda Pricing:**
- First 1 million requests/month: **Free**
- After that: $0.20 per 1 million requests
- Compute: $0.0000166667 per GB-second

**Example (1024MB, 500ms avg):**
- 100,000 requests/month = **$0.00** (free tier)
- 1 million requests/month = **$8.35**
- 10 million requests/month = **$83.50**

### API Gateway

**HTTP API Pricing:**
- First 1 million requests/month: $1.00 per million
- After 1 million: $0.90 per million

**Example:**
- 100,000 requests/month = **$0.10**
- 1 million requests/month = **$1.00**
- 10 million requests/month = **$9.90**

### Amplify Hosting (Frontend)

**Pricing:**
- Build: $0.01 per build minute
- Hosting: $0.15 per GB served
- Storage: $0.023 per GB stored

**Example (typical Next.js app):**
- 100 builds/month × 5 min = **$5.00**
- 50GB served/month = **$7.50**
- 2GB storage = **$0.05**

**Total: ~$12.55/month**

### Total Monthly Cost Estimates

| Traffic Level | Lambda + API Gateway | Amplify Hosting | **Total** |
|--------------|---------------------|-----------------|-----------|
| **Low** (10K req/month) | $0.10 | $12.55 | **~$13** |
| **Medium** (100K req/month) | $1.00 | $15.00 | **~$16** |
| **High** (1M req/month) | $9.35 | $20.00 | **~$29** |
| **Very High** (10M req/month) | $93.40 | $30.00 | **~$123** |

**Plus Supabase:** $0-25/month (separate)

**💡 Much cheaper than ECS Fargate ($60-100/month) for low-medium traffic!**

---

## Troubleshooting

### Issue 1: Lambda Cold Starts (Slow First Request)

**Symptom:** First request takes 2-5 seconds, subsequent requests fast

**Solutions:**

1. **Provisioned Concurrency** (costs $$$):
   ```yaml
   # serverless.yml
   functions:
     api:
       provisionedConcurrency: 1
   ```

2. **Lambda Warming** (free, DIY):
   ```bash
   # Use CloudWatch Events to ping every 5 minutes
   aws events put-rule --schedule-expression "rate(5 minutes)" --name WarmLambda
   ```

3. **Accept cold starts:** Most serverless apps do this

### Issue 2: Lambda Timeout

**Symptom:** Requests fail after 30 seconds

**Solutions:**

1. Increase timeout (max 900 seconds):
   ```yaml
   provider:
     timeout: 60  # seconds
   ```

2. Optimize slow database queries
3. Add connection pooling for database

### Issue 3: Environment Variables Not Working

**Check:**
```bash
# View Lambda function config
aws lambda get-function-configuration \
  --function-name khanflow-backend-production-api

# Check environment variables section
```

**Fix:**
```bash
# Redeploy with environment variables
cd backend
source .env
npm run deploy:production
```

### Issue 4: CORS Errors in Browser

**Symptom:** `Access-Control-Allow-Origin` errors in console

**Fix:**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Issue 5: Database Connection Pool Exhausted

**Symptom:** "too many connections" errors

**Fix:** Use connection pooling for serverless:

```bash
npm install pg
```

```typescript
// backend/src/config/database.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Important for Lambda: 1 connection per instance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Issue 6: Amplify Build Fails

**Check build logs** in Amplify Console

**Common fixes:**
1. Verify `amplify.yml` is in root or monorepo root
2. Check environment variables are set
3. Ensure build command works locally: `npm run build`
4. Check Node version matches: Add to `amplify.yml`:
   ```yaml
   frontend:
     phases:
       preBuild:
         commands:
           - nvm use 20
   ```

---

## Rollback Procedure

### Rollback Backend

```bash
cd backend

# List deployments
serverless deploy list

# Rollback to previous
serverless rollback --timestamp <TIMESTAMP>
```

### Rollback Frontend

1. Go to Amplify Console
2. Click your app → Build history
3. Find successful build
4. Click "Redeploy this version"

---

## Advanced: CI/CD with GitHub Actions

Update `.github/workflows/ci-cd.yml` to deploy on push:

```yaml
deploy-lambda:
  name: Deploy Backend to Lambda
  runs-on: ubuntu-latest
  needs: [test-backend]
  if: github.ref == 'refs/heads/main'
  
  steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 20
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Deploy to Lambda
      run: |
        cd backend
        npm install -g serverless
        npx serverless deploy --stage production
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        PROD_DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        # ... all other environment variables
```

**Frontend deploys automatically via Amplify Console Git integration!**

---

## Summary: Your Deployment Checklist

### ✅ Backend Checklist

- [ ] Install serverless dependencies
- [ ] Create `lambda.ts` handler
- [ ] Update `index.ts` to export app
- [ ] Create `serverless.yml`
- [ ] Add `.env` with production variables
- [ ] Deploy: `npm run deploy:production`
- [ ] Test: `curl <api-gateway-url>/api/health`
- [ ] Copy API Gateway URL

### ✅ Frontend Checklist

- [ ] Create `amplify.yml`
- [ ] Go to Amplify Console
- [ ] Connect GitHub repository
- [ ] Configure build settings (monorepo: `new-frontend`)
- [ ] Add environment variables (with API Gateway URL)
- [ ] Deploy and wait for build
- [ ] Copy Amplify domain

### ✅ Configuration Checklist

- [ ] Update OAuth redirect URIs (Google + Microsoft)
- [ ] Update backend `.env` with Amplify domain
- [ ] Redeploy backend with new frontend URL
- [ ] Test OAuth flows
- [ ] Run database migrations
- [ ] (Optional) Add custom domain

---

## Next Steps After Deployment

1. **Monitor CloudWatch Logs** for errors
2. **Set up CloudWatch Alarms** for Lambda errors/throttles
3. **Enable AWS X-Ray** for request tracing
4. **Configure Amplify notifications** for build failures
5. **Test load** with multiple concurrent users
6. **Document API Gateway endpoint** for team
7. **Set up staging environment** (duplicate with `--stage staging`)

---

## Support & Resources

- **Amplify Docs**: https://docs.amplify.aws/
- **Serverless Framework Docs**: https://www.serverless.com/framework/docs
- **Lambda Best Practices**: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- **Next.js Amplify**: https://docs.amplify.aws/guides/hosting/nextjs/

**Repository:** https://github.com/mashcodes10/khanflow

---

**🚀 Ready to deploy? I'll now create all the necessary files for you!**
