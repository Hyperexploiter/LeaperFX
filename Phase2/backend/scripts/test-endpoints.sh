#!/bin/bash

# LeaperFX Backend API Endpoints Testing Script
# This script tests all API endpoints to ensure they're working correctly

set -e

# Configuration
BASE_URL=${1:-"http://localhost:3000"}
API_KEY=${2:-"dev-secret-key-12345"}

echo "🧪 Testing LeaperFX Backend API Endpoints"
echo "========================================="
echo "Base URL: $BASE_URL"
echo "API Key: ${API_KEY:0:10}..."
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=${4:-""}
    local expected_status=${5:-200}

    echo "Testing: $description"
    echo "Method: $method $endpoint"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$status_code" -eq "$expected_status" ]; then
        echo "✅ Status: $status_code (Expected: $expected_status)"
        if [ "$method" = "GET" ] && [ ! -z "$body" ]; then
            echo "📄 Response: $(echo "$body" | head -c 200)..."
        fi
    else
        echo "❌ Status: $status_code (Expected: $expected_status)"
        echo "📄 Response: $body"
    fi
    echo ""
}

# Health Check
echo "🏥 Health Check"
echo "---------------"
test_endpoint "GET" "/api/health" "Health check endpoint"

# Data Endpoints
echo "📊 Data API Endpoints"
echo "--------------------"
test_endpoint "GET" "/api/data/forex?pairs=USD/CAD,EUR/USD" "Forex data"
test_endpoint "GET" "/api/data/crypto?symbols=BTC,ETH" "Crypto data"
test_endpoint "GET" "/api/data/commodities?symbols=GOLD,SILVER" "Commodities data"
test_endpoint "GET" "/api/data/indices?symbols=SPX,DJI" "Indices data"
test_endpoint "GET" "/api/data/yields?instruments=CA_2Y,CA_10Y" "Yields data"

# Configuration Endpoints
echo "⚙️ Configuration API Endpoints"
echo "------------------------------"
test_endpoint "GET" "/api/config/get" "Get all configurations"

# Test configuration creation
CONFIG_DATA='{"key":"test.value","value":"hello","category":"test","description":"Test configuration"}'
test_endpoint "POST" "/api/config/set" "Create configuration" "$CONFIG_DATA"

# Test configuration retrieval
test_endpoint "GET" "/api/config/get?key=test.value" "Get specific configuration"

# Configuration Profiles
echo "👤 Configuration Profiles"
echo "-------------------------"
PROFILE_DATA='{"name":"Test Profile","description":"Test profile for API testing","values":{"test.key":"test.value"},"isActive":false}'
test_endpoint "POST" "/api/config/profiles" "Create profile" "$PROFILE_DATA"
test_endpoint "GET" "/api/config/profiles" "Get all profiles"

# Error Testing
echo "🚨 Error Handling Tests"
echo "-----------------------"
test_endpoint "GET" "/api/data/forex" "Missing parameters" "" 400
test_endpoint "GET" "/api/config/get?key=nonexistent" "Non-existent config" "" 404

# Rate Limiting Test (if applicable)
echo "⚡ Rate Limiting Test"
echo "--------------------"
echo "Making multiple rapid requests to test rate limiting..."
for i in {1..5}; do
    curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
        -H "X-API-Key: $API_KEY" \
        "$BASE_URL/api/health"
done
echo ""

# Invalid API Key Test
echo "🔐 Authentication Test"
echo "----------------------"
response=$(curl -s -w "%{http_code}" \
    -H "X-API-Key: invalid-key" \
    "$BASE_URL/api/health")

if [ "$response" = "401" ]; then
    echo "✅ Authentication working correctly (401 for invalid key)"
else
    echo "❌ Authentication issue (Expected 401, got $response)"
fi
echo ""

# CORS Test
echo "🌐 CORS Test"
echo "------------"
cors_response=$(curl -s -w "%{http_code}" \
    -H "Origin: https://example.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: X-API-Key" \
    -X OPTIONS \
    "$BASE_URL/api/health")

if [ "$cors_response" = "200" ]; then
    echo "✅ CORS preflight working correctly"
else
    echo "❌ CORS preflight issue (Expected 200, got $cors_response)"
fi
echo ""

echo "🎉 API Testing completed!"
echo ""
echo "Summary:"
echo "--------"
echo "✅ Health check endpoint tested"
echo "✅ All data endpoints tested"
echo "✅ Configuration endpoints tested"
echo "✅ Profile management tested"
echo "✅ Error handling tested"
echo "✅ Authentication tested"
echo "✅ CORS tested"
echo ""
echo "If any tests failed, check:"
echo "1. Server is running on $BASE_URL"
echo "2. API key is correct: $API_KEY"
echo "3. All environment variables are set"
echo "4. External API keys are valid"