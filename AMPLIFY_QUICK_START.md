# AWS Amplify Serverless Deployment - Quick Start

## 🚀 Step-by-Step Deployment Guide

### Prerequisites Checklist
- [ ] AWS CLI configured (`aws configure`)
- [ ] Node.js 20+ installed
- [ ] Supabase production database ready
- [ ] OAuth credentials (Google + Microsoft)
- [ ] OpenAI API key

---

## Phase 1: Install Backend Dependencies (5 minutes)

```bash
cd backend

# Install serverless dependencies
npm install --save @vendia/serverless-express
npm install --save-dev serverless serverless-offline @types/aws-lambda

# Copy environment template
cp .env.template .env

# Edit .env with your production values
nano .env  # or use your preferred editor
```

**Fill in these values in `.env`:**
- `PROD_DATABASE_URL` - From Supabase
- `PROD_JWT_SECRET` - Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `PROD_GOOGLE_CLIENT_ID` and `PROD_GOOGLE_CLIENT_SECRET`
- `PROD_MICROSOFT_CLIENT_ID` and `PROD_MICROSOFT_CLIENT_SECRET`  
- `PROD_OPENAI_API_KEY`
- `PROD_SUPABASE_URL` and `PROD_SUPABASE_SERVICE_ROLE_KEY`
- Leave `PROD_FRONTEND_ORIGIN` empty for now (will update after frontend deployment)

---

## Phase 2: Deploy Backend to Lambda (10 minutes)

```bash
# Still in backend directory
cd backend

# Install serverless globally if not already installed
npm install -g serverless

# Build and deploy
npm run deploy:production
```

**Expected Output:**
```
✔ Service deployed to stack khanflow-backend-production

endpoint: https://abc123xyz.execute-api.us-east-1.amazonaws.com
functions:
  api: khanflow-backend-production-api
```

**⚠️ IMPORTANT: Copy the `endpoint` URL!**

Test it:
```bash
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/api/health
```

Expected response: `{"status":"ok","timestamp":"..."}`

---

## Phase 3: Deploy Frontend to Amplify (15 minutes)

### Option A: Using AWS Console (Easier - Recommended)

1. **Go to AWS Amplify Console**  
   https://console.aws.amazon.com/amplify/

2. **Create New App**
   - Click "New app" → "Host web app"
   - Source: GitHub
   - Authorize GitHub access

3. **Select Repository**
   - Repository: `khanflow`
   - Branch: `main`
   - ✅ Enable "Connecting a monorepo? Pick a folder"
   - App root directory: `new-frontend`

4. **Configure Build Settings**
   - App name: `khanflow-frontend`
   - Build and test settings: Auto-detected ✓
   - The `amplify.yml` in `new-frontend/` will be used automatically

5. **Add Environment Variables**
   Click "Add environment variable" for each:
   ```
   NEXT_PUBLIC_API_URL = https://abc123xyz.execute-api.us-east-1.amazonaws.com
   NEXT_PUBLIC_SUPABASE_URL = https://yourproject.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-supabase-anon-key
   OPENAI_API_KEY = sk-your-openai-key
   ```
   
   **Note:** Leave `NEXT_PUBLIC_APP_ORIGIN` empty for now (Amplify will provide the URL after first build)

6. **Review and Deploy**
   - Click "Save and deploy"
   - ⏱️ Wait 5-10 minutes for build

7. **After Build Completes**
   - Copy your Amplify app URL: `https://main.d1234567890.amplifyapp.com`
   - Go back to "Environment variables"
   - Add: `NEXT_PUBLIC_APP_ORIGIN = https://main.d1234567890.amplifyapp.com`
   - Click "Redeploy this version" to rebuild with the new variable

### Option B: Using Deployment Script (Faster for backend)

```bash
# From project root
./deploy-amplify.sh

# Choose option 1 (Backend only) or 3 (Both)
```

---

## Phase 4: Update OAuth Redirect URIs (10 minutes)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. **Authorized JavaScript origins** → Add:
   - `https://main.d1234567890.amplifyapp.com`
4. **Authorized redirect URIs** → Add:
   - `https://main.d1234567890.amplifyapp.com/auth/google/callback`
5. Save

### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps)
2. Select your app registration
3. Go to **Authentication**
4. Under **Web** → **Redirect URIs** → Add:
   - `https://main.d1234567890.amplifyapp.com/auth/microsoft/callback`
5. Save

---

## Phase 5: Update Backend with Frontend URL (5 minutes)

```bash
cd backend

# Edit .env
nano .env

# Update these lines:
PROD_FRONTEND_ORIGIN=https://main.d1234567890.amplifyapp.com
PROD_FRONTEND_INTEGRATION_URL=https://main.d1234567890.amplifyapp.com/integrations
PROD_GOOGLE_REDIRECT_URI=https://main.d1234567890.amplifyapp.com/auth/google/callback
PROD_MICROSOFT_REDIRECT_URI=https://main.d1234567890.amplifyapp.com/auth/microsoft/callback

# Redeploy backend with updated URLs
npm run deploy:production
```

---

## Phase 6: Run Database Migrations (5 minutes)

```bash
cd backend

# Source the .env file
source .env

# Run migrations against production database
DATABASE_URL=$PROD_DATABASE_URL npm run db:migrate
```

---

## Phase 7: Test Your Deployment (10 minutes)

### Test Backend
```bash
# Health check
curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Test Frontend
1. Open browser: `https://main.d1234567890.amplifyapp.com`
2. You should see the Khanflow homepage
3. Try Google login
4. Try Microsoft login
5. Test creating an event
6. Test voice assistant

---

## Troubleshooting

### Backend Issues

**Lambda timeout?**
```yaml
# Edit backend/serverless.yml
provider:
  timeout: 60  # Increase from 30 to 60 seconds
```

**Database connection errors?**
```bash
# Test database connection
cd backend
source .env
node -e "const pg = require('pg'); new pg.Client({connectionString: process.env.PROD_DATABASE_URL}).connect().then(() => console.log('✓ Connected')).catch(e => console.error('✗ Error:', e.message))"
```

**CORS errors?**
Check that `PROD_FRONTEND_ORIGIN` in backend/.env matches your Amplify URL exactly.

### Frontend Issues

**Build failing?**
1. Check Amplify Console → Build logs
2. Verify all environment variables are set
3. Check Node.js version (should be 20)

**Page loads but API calls fail?**
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_API_URL` in Amplify environment variables
3. Test API directly: `curl https://your-api-url/api/health`

### Viewing Logs

**Lambda logs:**
```bash
aws logs tail /aws/lambda/khanflow-backend-production-api --follow
```

**Amplify build logs:**
- Go to Amplify Console → Your app → Build history → Click build

---

## Cost Monitoring

Check your AWS costs:
```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

**Expected monthly costs:**
- Lambda: $0-10 (free tier covers most small apps)
- API Gateway: $1-5
- Amplify Hosting: $12-20
- **Total: ~$13-35/month**

---

## Rollback

### Rollback Backend
```bash
cd backend
serverless deploy list  # See deployments
serverless rollback -t <TIMESTAMP>
```

### Rollback Frontend
1. Amplify Console → Your app → Build history
2. Find working build
3. Click "Redeploy this version"

---

## Add Custom Domain (Optional)

### For Amplify (Frontend)
1. Amplify Console → Domain management → Add domain
2. Enter your domain: `khanflow.com`
3. Amplify creates SSL certificate automatically
4. Update DNS with provided CNAME/A records
5. Wait 10-60 minutes for DNS propagation

### For API Gateway (Backend)
```bash
# Request SSL certificate in ACM
aws acm request-certificate \
  --domain-name api.khanflow.com \
  --validation-method DNS

# Create custom domain
aws apigatewayv2 create-domain-name \
  --domain-name api.khanflow.com \
  --domain-name-configurations CertificateArn=<CERT_ARN>

# Map to API
aws apigatewayv2 create-api-mapping \
  --domain-name api.khanflow.com \
  --api-id <API_ID> \
  --stage production
```

---

## Success Checklist

- [ ] Backend deployed (Lambda + API Gateway)
- [ ] Health endpoint returns 200: `/api/health`
- [ ] Frontend deployed (Amplify)
- [ ] Homepage loads successfully
- [ ] OAuth logins work (Google + Microsoft)
- [ ] Database migrations completed
- [ ] API calls from frontend work
- [ ] Voice assistant functional
- [ ] Environment variables updated in both services
- [ ] OAuth redirect URIs updated
- [ ] Monitoring set up (CloudWatch)

---

## Next Steps

1. **Set up monitoring alerts**
   - CloudWatch alarms for Lambda errors
   - Amplify build failure notifications

2. **Create staging environment**
   ```bash
   cd backend
   npm run deploy:staging
   ```

3. **CI/CD automation** (optional)
   - Backend auto-deploys via GitHub Actions
   - Frontend auto-deploys via Amplify Git integration (already set up!)

4. **Performance optimization**
   - Enable Lambda provisioned concurrency (if needed)
   - Optimize Docker image sizes
   - Add CDN caching rules

---

## Getting Help

- **AWS Amplify Docs**: https://docs.amplify.aws/
- **Serverless Framework Docs**: https://www.serverless.com/framework/docs
- **Lambda Best Practices**: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html

**Full Guide**: See `AWS_AMPLIFY_DEPLOYMENT.md` for comprehensive documentation

---

**🎉 Congratulations! Your app is now fully serverless on AWS!**
