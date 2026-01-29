#!/bin/bash

# Script to set AWS Amplify environment variables for production
# Usage: ./setup-amplify-env.sh

APP_ID="d2zmmdvnbw2hbh"  # Your Amplify App ID
BRANCH="main"

echo "Setting up AWS Amplify environment variables for production..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Set environment variables
aws amplify update-app \
  --app-id $APP_ID \
  --environment-variables \
    NEXT_PUBLIC_MS_CLIENT_ID=cb97b6bf-0f28-480e-a1e6-60e2924b6297 \
    NEXT_PUBLIC_MS_REDIRECT_URI=https://main.dmip7cam6gz9o.amplifyapp.com/auth/microsoft/callback \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=685420243888-5bbgpj4d0mau3h0ala8v3rt2clg7shsv.apps.googleusercontent.com \
    NEXT_PUBLIC_API_URL=https://ambbx0lkg8.execute-api.us-east-1.amazonaws.com/api \
    NEXT_PUBLIC_APP_ORIGIN=https://main.dmip7cam6gz9o.amplifyapp.com \
    SUPABASE_URL=https://fncrvjemsycdzrdkjcvy.supabase.co \
    SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}" \
    JWT_SECRET="${JWT_SECRET:-}" \
    OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  --region us-east-1

if [ $? -eq 0 ]; then
    echo "✓ Environment variables set successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/home"
    echo "2. Select your app: khanflow"
    echo "3. Trigger a new build from the console or push to the main branch"
    echo "4. Ensure Azure redirect URI is configured: https://main.dmip7cam6gz9o.amplifyapp.com/auth/microsoft/callback"
else
    echo "✗ Failed to set environment variables"
    exit 1
fi
