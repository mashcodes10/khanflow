#!/bin/bash

# Khanflow AWS Amplify Serverless Deployment Script
# This script automates the deployment of both backend (Lambda) and frontend (Amplify)

set -e  # Exit on error

echo "🚀 Khanflow Serverless Deployment Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env file not found${NC}"
    echo "Please create backend/.env from backend/.env.template"
    echo "Run: cp backend/.env.template backend/.env"
    echo "Then fill in your production values"
    exit 1
fi

echo -e "${GREEN}✓ Found backend/.env file${NC}"
echo ""

# Check for required tools
echo "📦 Checking required tools..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm: $(npm --version)${NC}"

if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}⚠ Serverless Framework not found. Installing...${NC}"
    npm install -g serverless
fi
echo -e "${GREEN}✓ Serverless Framework: $(serverless --version | head -n 1)${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Install with: brew install awscli (macOS) or pip install awscli"
    exit 1
fi
echo -e "${GREEN}✓ AWS CLI: $(aws --version)${NC}"

echo ""

# Ask user what to deploy
echo "What would you like to deploy?"
echo "1) Backend only (Lambda + API Gateway)"
echo "2) Frontend only (Amplify - requires Amplify CLI or Console)"
echo "3) Both (Backend first, then instructions for frontend)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1|3)
        echo ""
        echo "========================================="
        echo "📦 DEPLOYING BACKEND TO AWS LAMBDA"
        echo "========================================="
        echo ""
        
        # Navigate to backend
        cd backend
        
        # Install dependencies if node_modules doesn't exist
        if [ ! -d "node_modules" ]; then
            echo "📥 Installing backend dependencies..."
            npm ci
        fi
        
        # Build TypeScript
        echo "🔨 Building TypeScript..."
        npm run build:lambda
        
        # Deploy to Lambda
        echo "🚀 Deploying to AWS Lambda..."
        npm run deploy:production
        
        # Get API Gateway URL
        echo ""
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}✅ BACKEND DEPLOYED SUCCESSFULLY!${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo ""
        echo "📋 Next steps:"
        echo "1. Copy the API Gateway endpoint URL above"
        echo "2. Test it: curl https://YOUR-API-URL.execute-api.us-east-1.amazonaws.com/api/health"
        echo "3. Use this URL for NEXT_PUBLIC_API_URL in your frontend"
        echo ""
        
        cd ..
        ;;
    2)
        echo ""
        echo "========================================="
        echo "📦 FRONTEND DEPLOYMENT INSTRUCTIONS"
        echo "========================================="
        echo ""
        echo "Frontend is deployed via AWS Amplify Console:"
        echo ""
        echo "1. Go to: https://console.aws.amazon.com/amplify/"
        echo "2. Click 'New app' → 'Host web app'"
        echo "3. Connect your GitHub repository: khanflow"
        echo "4. Branch: main"
        echo "5. App name: khanflow-frontend"
        echo "6. Build settings:"
        echo "   - Monorepo root: new-frontend"
        echo "   - Build spec: amplify.yml (auto-detected)"
        echo "7. Add environment variables:"
        echo "   - NEXT_PUBLIC_API_URL=<your-api-gateway-url>"
        echo "   - NEXT_PUBLIC_APP_ORIGIN=<will-be-provided-after-first-build>"
        echo "   - NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>"
        echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-key>"
        echo "   - OPENAI_API_KEY=<your-openai-key>"
        echo "8. Click 'Save and deploy'"
        echo ""
        echo "⏱️  Wait 5-10 minutes for build to complete"
        echo ""
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

if [ "$choice" = "3" ]; then
    echo ""
    echo "========================================="
    echo "📦 FRONTEND DEPLOYMENT INSTRUCTIONS"
    echo "========================================="
    echo ""
    echo "Now deploy your frontend using AWS Amplify Console:"
    echo ""
    echo "1. Go to: https://console.aws.amazon.com/amplify/"
    echo "2. Click 'New app' → 'Host web app'"
    echo "3. Connect GitHub → Select khanflow repo → Branch: main"
    echo "4. App name: khanflow-frontend"
    echo "5. Monorepo root: new-frontend"
    echo "6. Add environment variables with your API Gateway URL from above"
    echo "7. Click 'Save and deploy'"
    echo ""
    echo "⏱️  Wait for build to complete, then update:"
    echo "   - OAuth redirect URIs (Google + Microsoft)"
    echo "   - Backend PROD_FRONTEND_ORIGIN in .env"
    echo "   - Redeploy backend: npm run deploy:production"
    echo ""
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT PROCESS COMPLETE${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "📚 For detailed instructions, see: AWS_AMPLIFY_DEPLOYMENT.md"
echo ""
