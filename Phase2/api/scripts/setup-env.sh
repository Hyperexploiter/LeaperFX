#!/bin/bash

# LeaperFX Backend Environment Setup Script
# This script helps set up environment variables for Vercel deployment

set -e

echo "🔧 LeaperFX Backend Environment Setup"
echo "===================================="

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

echo ""
echo "This script will help you set up environment variables for your Vercel deployment."
echo "You can skip any variables by pressing Enter."
echo ""

# Function to set environment variable
set_env_var() {
    local var_name=$1
    local description=$2
    local is_secret=${3:-true}

    echo "Setting $var_name ($description):"
    read -p "Enter value (or press Enter to skip): " var_value

    if [ ! -z "$var_value" ]; then
        if [ "$is_secret" = true ]; then
            vercel env add "$var_name" production <<< "$var_value"
            vercel env add "$var_name" preview <<< "$var_value"
        else
            vercel env add "$var_name" production --sensitive=false <<< "$var_value"
            vercel env add "$var_name" preview --sensitive=false <<< "$var_value"
        fi
        echo "✅ $var_name set successfully"
    else
        echo "⏭️ Skipping $var_name"
    fi
    echo ""
}

# Core application settings
echo "🔐 Core Application Settings"
echo "----------------------------"
set_env_var "API_SECRET_KEY" "Secret key for API authentication"
set_env_var "CORS_ORIGIN" "Allowed origin for CORS (your dashboard URL)" false

# Data provider API keys
echo "📊 Data Provider API Keys"
echo "-------------------------"
set_env_var "POLYGON_API_KEY" "Polygon.io API key for forex and indices data"
set_env_var "TWELVEDATA_API_KEY" "TwelveData API key for commodities data"
set_env_var "COINBASE_API_KEY" "Coinbase Pro API key for crypto data"
set_env_var "COINBASE_API_SECRET" "Coinbase Pro API secret"
set_env_var "COINBASE_API_PASSPHRASE" "Coinbase Pro API passphrase"
set_env_var "OPENWEATHER_API_KEY" "OpenWeather API key (optional)"

# Storage configuration
echo "💾 Storage Configuration"
echo "------------------------"
echo "Setting up Vercel KV (recommended)..."
echo "Run 'vercel env pull' after setting up KV in your Vercel dashboard"
echo ""

set_env_var "UPSTASH_REDIS_REST_URL" "Upstash Redis URL (fallback storage)" false
set_env_var "UPSTASH_REDIS_REST_TOKEN" "Upstash Redis token"

# Optional providers
echo "🔗 Optional Providers"
echo "--------------------"
set_env_var "FXAPI_KEY" "FX API key (optional)"
set_env_var "ALPACA_API_KEY" "Alpaca API key (optional)"
set_env_var "ALPACA_SECRET_KEY" "Alpaca secret key (optional)"

# Rate limiting
echo "⚡ Rate Limiting Configuration"
echo "-----------------------------"
set_env_var "RATE_LIMIT_REQUESTS" "Max requests per minute (default: 1000)" false
set_env_var "RATE_LIMIT_WINDOW" "Rate limit window in ms (default: 60000)" false

echo "🎉 Environment setup completed!"
echo ""
echo "Next steps:"
echo "1. Set up Vercel KV in your dashboard: https://vercel.com/dashboard"
echo "2. Run 'vercel env pull' to sync KV environment variables"
echo "3. Test your configuration: npm run dev"
echo "4. Deploy: npm run deploy"
echo ""
echo "To view your environment variables: vercel env ls"
echo "To remove an environment variable: vercel env rm <name>"