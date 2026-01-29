#!/bin/bash
set -e

echo "🏗️  Building TypeScript..."
npm run build:lambda

echo "📦 Installing production dependencies..."
rm -rf node_modules
npm ci --only=production --platform=linux --arch=x64 --libc=glibc || npm ci --only=production

echo "🚀 Deploying to AWS Lambda..."
serverless deploy --stage production

echo "✅ Deployment complete!"
