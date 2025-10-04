#!/bin/bash

# LeaperFX Backend Deployment Script
# This script deploys the backend to Vercel with proper environment configuration

set -e

echo "🚀 Starting LeaperFX Backend Deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Environment setup
ENVIRONMENT=${1:-production}
echo "🌍 Deploying to environment: $ENVIRONMENT"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type check
echo "🔍 Running type check..."
npm run type-check

# Build check (for Next.js)
echo "🏗️ Building application..."
npm run build

# Deploy to Vercel
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🚀 Deploying to production..."
    vercel --prod --yes
else
    echo "🚀 Deploying to preview..."
    vercel --yes
fi

echo "✅ Deployment completed successfully!"

# Show deployment URL
DEPLOYMENT_URL=$(vercel ls --app=$(cat package.json | grep '"name"' | cut -d'"' -f4) | head -n 2 | tail -n 1 | awk '{print $2}')
echo "🌐 Deployment URL: https://$DEPLOYMENT_URL"

# Health check
echo "🏥 Running health check..."
sleep 10
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL/api/health" || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health check passed!"
else
    echo "⚠️ Health check failed with status: $HEALTH_RESPONSE"
    echo "Please check the deployment logs: vercel logs"
fi

echo "🎉 Deployment process completed!"
echo ""
echo "Next steps:"
echo "1. Update your dashboard frontend to use the new backend URL"
echo "2. Test all API endpoints"
echo "3. Monitor the deployment: vercel logs --follow"