# 🚀 Serverless Deployment - Files Created

## Overview
Complete AWS Amplify serverless deployment setup for Khanflow. Backend runs on Lambda, frontend on Amplify Hosting.

---

## New Files Created

### 1. **AWS_AMPLIFY_DEPLOYMENT.md** (Main Guide)
   - 📄 Comprehensive 800+ line deployment guide
   - Architecture diagrams and comparisons
   - Step-by-step instructions for both backend and frontend
   - Troubleshooting, monitoring, and cost estimation
   - **Start here** for complete understanding

### 2. **AMPLIFY_QUICK_START.md** (Quick Reference)
   - 📋 Condensed step-by-step checklist
   - Copy-paste commands ready to use
   - Quick troubleshooting tips
   - Success checklist
   - **Use this** for actual deployment

### 3. **backend/serverless.yml**
   - ⚙️ Serverless Framework configuration
   - Lambda function definition
   - API Gateway HTTP API setup
   - Environment variable mapping
   - AWS permissions and IAM roles

### 4. **backend/src/lambda.ts**
   - 🔧 Lambda handler for Express app
   - Wraps your existing Express app for Lambda
   - No changes needed to your routes
   - Handles cold starts and warm instances

### 5. **new-frontend/amplify.yml**
   - 🎨 Amplify build configuration
   - Next.js build commands
   - Node version specification
   - Cache configuration
   - Output artifacts definition

### 6. **backend/.env.template**
   - 📝 Environment variables template
   - All required production secrets
   - Comments explaining each variable
   - **Action required**: Copy to `.env` and fill in values

### 7. **deploy-amplify.sh**
   - 🤖 Automated deployment script
   - Interactive menu for deployment options
   - Validates prerequisites
   - Deploys backend with one command
   - **Executable**: `./deploy-amplify.sh`

---

## Modified Files

### 1. **backend/src/index.ts**
   - ✏️ Added app export for Lambda
   - Database initialization moved outside server startup
   - Conditional server start (only in non-Lambda environment)
   - No breaking changes to existing functionality

### 2. **backend/package.json**
   - 📦 Added dependencies:
     - `@vendia/serverless-express` (Lambda adapter)
   - 📦 Added devDependencies:
     - `serverless` (deployment framework)
     - `serverless-offline` (local testing)
     - `@types/aws-lambda` (TypeScript types)
   - 🔧 Added scripts:
     - `build:lambda` - Build for Lambda
     - `deploy`, `deploy:production`, `deploy:staging` - Deploy to AWS
     - `test:lambda` - Test locally with serverless-offline
     - `remove` - Remove deployed stack

### 3. **backend/.gitignore**
   - 🚫 Added `.env.template` exception (allow in git)
   - 🚫 Added `.serverless/` (Serverless Framework artifacts)
   - 🚫 Added `.webpack/` (if using Webpack plugin)

---

## What Didn't Change

✅ **All your existing code** - routes, controllers, services remain unchanged  
✅ **Database schema** - no migrations needed  
✅ **Frontend code** - works as-is with Amplify  
✅ **Development workflow** - `npm run dev` still works locally  
✅ **Testing** - all tests still run the same way  

---

## Architecture Comparison

### Before (What you attempted with ECS Fargate)
```
GitHub → Docker Build → ECR → ECS Fargate → ALB → Internet
                                    ↓
                              Supabase DB
```
**Issues:** ALB blocked by AWS account restrictions

### After (New Serverless Setup)
```
GitHub → Amplify Build → CloudFront → Internet (Frontend)
       ↘
        → Lambda Build → API Gateway → Internet (Backend)
                              ↓
                         Supabase DB
```
**Benefits:** No ALB needed, auto-scaling, pay-per-use

---

## Deployment Flow

### Phase 1: Backend (Lambda)
```bash
cd backend
cp .env.template .env
# Fill in .env with your values
npm install
npm run deploy:production
# → Get API Gateway URL
```

### Phase 2: Frontend (Amplify Console)
```
1. Go to AWS Amplify Console
2. Connect GitHub repo
3. Set monorepo root: new-frontend
4. Add environment variables (including API Gateway URL)
5. Deploy
# → Get Amplify app URL
```

### Phase 3: Final Configuration
```bash
# Update backend .env with Amplify URL
# Update OAuth redirect URIs
# Redeploy backend
npm run deploy:production
```

---

## Environment Variables Needed

### Backend (.env file)
- Database: `PROD_DATABASE_URL`
- Auth: `PROD_JWT_SECRET`
- Google OAuth: `PROD_GOOGLE_CLIENT_ID`, `PROD_GOOGLE_CLIENT_SECRET`, `PROD_GOOGLE_REDIRECT_URI`
- Microsoft OAuth: `PROD_MICROSOFT_CLIENT_ID`, `PROD_MICROSOFT_CLIENT_SECRET`, `PROD_MICROSOFT_REDIRECT_URI`
- APIs: `PROD_OPENAI_API_KEY`
- Frontend: `PROD_FRONTEND_ORIGIN`, `PROD_FRONTEND_INTEGRATION_URL`
- Supabase: `PROD_SUPABASE_URL`, `PROD_SUPABASE_SERVICE_ROLE_KEY`

### Frontend (Amplify Console)
- `NEXT_PUBLIC_API_URL` (from Lambda deployment)
- `NEXT_PUBLIC_APP_ORIGIN` (from Amplify, after first build)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

---

## Cost Comparison

| Solution | Monthly Cost | Your Current Status |
|----------|-------------|---------------------|
| **ECS Fargate** | $60-100 | ❌ Blocked (no ALB access) |
| **EC2 (t3.medium)** | $30-50 | ⚠️ Manual management |
| **Amplify + Lambda** | $13-35 | ✅ Ready to deploy |

**Serverless wins for:**
- Lower cost (pay-per-use)
- Auto-scaling
- No server management
- No ALB needed

---

## Next Steps

### Immediate Actions (Today)

1. **Create backend/.env file**
   ```bash
   cd backend
   cp .env.template .env
   nano .env  # Fill in your values
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Deploy backend**
   ```bash
   npm run deploy:production
   ```
   Copy the API Gateway URL from output

4. **Deploy frontend via Amplify Console**
   - Go to AWS Amplify Console
   - Connect GitHub
   - Configure with your API Gateway URL
   - Wait for build

5. **Update OAuth and redeploy**
   - Update Google/Microsoft OAuth redirect URIs
   - Update backend `.env` with Amplify URL
   - Redeploy backend

### Future Enhancements

- [ ] Set up staging environment
- [ ] Configure custom domains
- [ ] Enable CloudWatch alarms
- [ ] Set up CI/CD for backend (GitHub Actions)
- [ ] Add Lambda warming (if cold starts are an issue)
- [ ] Configure WAF rules (if needed)

---

## Documentation Reference

1. **AWS_AMPLIFY_DEPLOYMENT.md** - Complete guide with explanations
2. **AMPLIFY_QUICK_START.md** - Quick reference for deployment
3. **backend/serverless.yml** - Infrastructure as code
4. **backend/.env.template** - All required environment variables

---

## Rollback Plan

If something goes wrong:

**Backend:**
```bash
cd backend
serverless remove  # Delete entire stack
```

**Frontend:**
- Delete Amplify app in console
- Or redeploy previous build version

---

## Support Resources

- AWS Amplify Docs: https://docs.amplify.aws/
- Serverless Framework: https://www.serverless.com/framework/docs
- Lambda Best Practices: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- Issues? See **Troubleshooting** section in AWS_AMPLIFY_DEPLOYMENT.md

---

## 🎯 Ready to Deploy!

Start with: **AMPLIFY_QUICK_START.md**

or run:
```bash
./deploy-amplify.sh
```

---

**Created:** January 28, 2026  
**For:** Khanflow AWS Serverless Deployment  
**By:** GitHub Copilot
