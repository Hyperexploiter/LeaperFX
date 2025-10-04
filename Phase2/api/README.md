# LeaperFX Backend API

Production-ready backend infrastructure for the LeaperFX dashboard with secure API key management and Vercel deployment.

## 🚀 Features

- **Secure API Proxy System**: Protect API keys by proxying requests through backend
- **Configuration Management**: Store and manage dashboard configurations with versioning
- **Rate Limiting**: Protect against abuse with configurable rate limits
- **Multi-Storage Support**: Vercel KV primary, Upstash Redis fallback, memory cache
- **Security First**: CORS, input validation, security headers, and authentication
- **High Performance**: <100ms API response times with edge deployment
- **Health Monitoring**: Comprehensive health checks and metrics

## 📊 Supported Data Sources

- **Forex**: Polygon.io (USD/CAD, EUR/USD, etc.)
- **Crypto**: Coinbase Pro (BTC, ETH, SOL, etc.)
- **Commodities**: TwelveData (Gold, Silver, Oil, etc.)
- **Indices**: Polygon.io (S&P 500, NASDAQ, etc.)
- **Yields**: Bank of Canada (Government bonds, rates)

## 🏗️ Architecture

```
Backend API
├── Data Proxy Layer
│   ├── Forex (/api/data/forex)
│   ├── Crypto (/api/data/crypto)
│   ├── Commodities (/api/data/commodities)
│   ├── Indices (/api/data/indices)
│   └── Yields (/api/data/yields)
├── Configuration Layer
│   ├── Get Config (/api/config/get)
│   ├── Set Config (/api/config/set)
│   └── Profiles (/api/config/profiles)
├── Security Layer
│   ├── API Key Authentication
│   ├── Rate Limiting
│   ├── CORS Protection
│   └── Input Validation
└── Storage Layer
    ├── Vercel KV (Primary)
    ├── Upstash Redis (Fallback)
    └── Memory Cache (Fallback)
```

## 🛠️ Quick Start

### 1. Environment Setup

```bash
# Clone and navigate to backend
cd Phase2/backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Set up environment variables
./scripts/setup-env.sh
```

### 2. Development

```bash
# Start development server
npm run dev

# Test endpoints
./scripts/test-endpoints.sh http://localhost:3000

# Type check
npm run type-check
```

### 3. Production Deployment

```bash
# Deploy to Vercel
./scripts/deploy.sh production

# Test production
./scripts/test-endpoints.sh https://your-api-domain.vercel.app
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Core Settings
API_SECRET_KEY=your-super-secret-key
CORS_ORIGIN=https://your-dashboard-domain.vercel.app

# Data Provider Keys
POLYGON_API_KEY=your-polygon-key
TWELVEDATA_API_KEY=your-twelvedata-key
COINBASE_API_KEY=your-coinbase-key
COINBASE_API_SECRET=your-coinbase-secret
COINBASE_API_PASSPHRASE=your-coinbase-passphrase

# Storage (Vercel KV auto-configured)
KV_URL=auto-configured-by-vercel
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### Rate Limiting

- **API Endpoints**: 1000 requests/minute per IP
- **Data Endpoints**: 500 requests/minute per IP
- **Config Endpoints**: 100 requests/minute per IP
- **Health Check**: 60 requests/minute per IP

## 📡 API Endpoints

### Health Check
```bash
GET /api/health
```

### Data Endpoints

#### Forex Data
```bash
GET /api/data/forex?pairs=USD/CAD,EUR/USD&provider=polygon
```

#### Crypto Data
```bash
GET /api/data/crypto?symbols=BTC,ETH,SOL&base=USD&provider=coinbase
```

#### Commodities Data
```bash
GET /api/data/commodities?symbols=GOLD,SILVER,OIL&provider=twelvedata
```

#### Indices Data
```bash
GET /api/data/indices?symbols=SPX,DJI,IXIC&provider=polygon
```

#### Yields Data
```bash
GET /api/data/yields?instruments=CA_2Y,CA_10Y&provider=boc
```

### Configuration Endpoints

#### Get Configuration
```bash
# Get all configurations
GET /api/config/get

# Get specific configuration
GET /api/config/get?key=dashboard.theme

# Get by category
GET /api/config/get?category=timing

# Get multiple keys
GET /api/config/get?keys=theme,refresh_rate,chart_type
```

#### Set Configuration
```bash
# Set single configuration
POST /api/config/set
{
  "key": "dashboard.theme",
  "value": "dark",
  "category": "display",
  "description": "Dashboard theme setting"
}

# Set multiple configurations
POST /api/config/set
[
  {"key": "refresh.rate", "value": 1000, "category": "timing"},
  {"key": "chart.type", "value": "candlestick", "category": "display"}
]
```

#### Configuration Profiles
```bash
# Get all profiles
GET /api/config/profiles

# Get specific profile
GET /api/config/profiles?id=profile-uuid

# Create profile
POST /api/config/profiles
{
  "name": "High Performance",
  "description": "Optimized for speed",
  "values": {
    "refresh.rate": 500,
    "animation.enabled": false
  },
  "isActive": true
}

# Update profile
PUT /api/config/profiles?id=profile-uuid
{
  "name": "Updated Name",
  "isActive": false
}

# Delete profile
DELETE /api/config/profiles?id=profile-uuid
```

## 🔐 Authentication

All API endpoints require authentication via headers:

```bash
# Using API Key
X-API-Key: your-api-secret-key

# Or Authorization header
Authorization: Bearer your-api-secret-key
```

## 🎯 Performance Optimizations

- **Edge Functions**: Deploy to Vercel Edge for <50ms response times
- **Intelligent Caching**: 15s crypto, 30s forex, 60s commodities, 5min yields
- **Connection Pooling**: Reuse database connections
- **Response Compression**: Gzip compression enabled
- **Memory Management**: Efficient cleanup and garbage collection

## 📊 Monitoring

### Health Check Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "database": "up",
      "providers": {
        "polygon": "up",
        "coinbase": "up",
        "twelvedata": "up"
      }
    },
    "performance": {
      "responseTimeMs": 45,
      "memoryUsageMB": 128
    }
  }
}
```

### API Response Format
```json
{
  "success": true,
  "data": {...},
  "timestamp": 1699123456789,
  "requestId": "uuid-v4-string"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": 1699123456789,
  "requestId": "uuid-v4-string"
}
```

## 🧪 Testing

```bash
# Test all endpoints
./scripts/test-endpoints.sh

# Test specific environment
./scripts/test-endpoints.sh https://api.yourdomain.com your-api-key

# Load testing (requires artillery)
npm install -g artillery
artillery quick --count 100 --num 10 https://your-api.vercel.app/api/health
```

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
# One-click deployment
./scripts/deploy.sh production

# Manual deployment
vercel --prod
```

### Docker
```bash
# Build image
docker build -t leaperfx-backend .

# Run container
docker run -p 3000:3000 --env-file .env leaperfx-backend
```

### Manual Node.js
```bash
# Build application
npm run build

# Start production server
npm start
```

## 🔧 Development Tools

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run type-check` - TypeScript validation
- `npm run lint` - ESLint code quality
- `./scripts/deploy.sh` - Deploy to Vercel
- `./scripts/setup-env.sh` - Environment setup
- `./scripts/test-endpoints.sh` - API testing

### Dependencies
- **Runtime**: Next.js 14, Node.js 18+
- **Storage**: Vercel KV, Upstash Redis
- **Security**: CORS, Helmet, Rate Limiting
- **Validation**: Custom validation with sanitization
- **TypeScript**: Full type safety

## 📈 Scaling Considerations

- **Rate Limits**: Increase for higher traffic
- **Redis**: Use Redis cluster for high availability
- **CDN**: Enable Vercel CDN for static assets
- **Monitoring**: Add APM for production monitoring
- **Caching**: Implement Redis caching layers

## 🐛 Troubleshooting

### Common Issues

1. **API Key Issues**
   ```bash
   # Check environment variables
   vercel env ls

   # Test API key validity
   ./scripts/test-endpoints.sh
   ```

2. **Rate Limiting**
   ```bash
   # Check rate limit headers
   curl -I https://your-api.vercel.app/api/health
   ```

3. **CORS Issues**
   ```bash
   # Update CORS_ORIGIN environment variable
   vercel env add CORS_ORIGIN
   ```

4. **Storage Issues**
   ```bash
   # Test storage health
   curl https://your-api.vercel.app/api/health
   ```

### Support

For issues and questions:
- Check logs: `vercel logs`
- Monitor metrics: Vercel dashboard
- Test endpoints: `./scripts/test-endpoints.sh`

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready for production deployment!** 🚀

The backend is optimized for the LeaperFX dashboard's sub-12ms frame budget requirements and handles the 147 configurable properties with secure, scalable infrastructure.