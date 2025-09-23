# LeaperFX Monorepo Structure

## Root Configuration

### `/package.json`
```json
{
  "name": "@leaperfx/platform",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "deploy": "turbo run deploy",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### `/turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## Applications Structure

### `/apps/website/`
```
website/
├── src/
│   ├── app/                    # Next.js 14 app directory
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── rates/
│   │   ├── calculator/
│   │   └── contact/
│   ├── components/
│   │   ├── RateBoard.tsx
│   │   ├── Calculator.tsx
│   │   └── QRCodeGenerator.tsx
│   └── lib/
│       └── api.ts
├── public/
├── package.json
└── next.config.js
```

### `/apps/dashboard/`
```
dashboard/
├── src/
│   ├── main.tsx                # Entry point
│   ├── App.tsx
│   ├── features/               # Feature-based modules
│   │   ├── transactions/
│   │   ├── inventory/
│   │   ├── compliance/
│   │   ├── analytics/
│   │   └── customers/
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── hooks/
│   └── utils/
├── index.html
├── package.json
└── vite.config.ts
```

### `/apps/rate-display/`
```
rate-display/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── RateGrid.tsx
│   │   ├── RateTicker.tsx
│   │   └── ConnectionStatus.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts
│   └── styles/
│       └── digital-display.css
├── package.json
└── vite.config.ts
```

## Packages Structure

### `/packages/shared-ui/`
```
shared-ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   ├── Form/
│   │   ├── Table/
│   │   └── Chart/
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── theme/
│   │   ├── colors.ts
│   │   └── typography.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### `/packages/core-services/`
```
core-services/
├── src/
│   ├── services/
│   │   ├── TransactionService.ts
│   │   ├── InventoryService.ts
│   │   ├── ComplianceService.ts
│   │   ├── AnalyticsService.ts
│   │   └── CustomerService.ts
│   ├── repositories/
│   │   ├── TransactionRepository.ts
│   │   └── BaseRepository.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   └── formatting.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### `/packages/api-client/`
```
api-client/
├── src/
│   ├── client/
│   │   ├── ApiClient.ts
│   │   ├── WebSocketClient.ts
│   │   └── HttpClient.ts
│   ├── endpoints/
│   │   ├── auth.ts
│   │   ├── transactions.ts
│   │   ├── inventory.ts
│   │   └── compliance.ts
│   ├── types/
│   │   └── responses.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### `/packages/types/`
```
types/
├── src/
│   ├── models/
│   │   ├── Transaction.ts
│   │   ├── Customer.ts
│   │   ├── Inventory.ts
│   │   └── Compliance.ts
│   ├── enums/
│   │   ├── TransactionStatus.ts
│   │   └── ComplianceLevel.ts
│   ├── interfaces/
│   │   ├── ApiResponse.ts
│   │   └── WebSocketMessage.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Services Structure

### `/services/api-gateway/`
```
api-gateway/
├── src/
│   ├── server.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── transaction.routes.ts
│   │   ├── inventory.routes.ts
│   │   ├── compliance.routes.ts
│   │   └── crypto.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   └── BaseController.ts
│   ├── services/
│   │   ├── JwtService.ts
│   │   └── CacheService.ts
│   └── config/
│       ├── database.ts
│       └── redis.ts
├── package.json
├── Dockerfile
└── tsconfig.json
```

### `/services/websocket-server/`
```
websocket-server/
├── src/
│   ├── server.ts
│   ├── handlers/
│   │   ├── RateHandler.ts
│   │   ├── TransactionHandler.ts
│   │   └── NotificationHandler.ts
│   ├── rooms/
│   │   ├── RateRoom.ts
│   │   └── DashboardRoom.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   └── utils/
│       └── broadcast.ts
├── package.json
├── Dockerfile
└── tsconfig.json
```

### `/services/crypto-service/`
```
crypto-service/
├── src/
│   ├── server.ts
│   ├── providers/
│   │   ├── StripeProvider.ts
│   │   └── CryptoProvider.ts
│   ├── handlers/
│   │   ├── PaymentHandler.ts
│   │   └── WalletHandler.ts
│   ├── validators/
│   │   └── transaction.validator.ts
│   └── config/
│       └── stripe.config.ts
├── package.json
├── Dockerfile
└── tsconfig.json
```

## Infrastructure

### `/infrastructure/database/`
```
database/
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_transactions.sql
│   ├── 003_create_inventory.sql
│   └── 004_create_compliance.sql
├── seeds/
│   ├── users.sql
│   └── currencies.sql
├── docker-compose.yml
└── init.sql
```

### `/infrastructure/deployment/`
```
deployment/
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.website
│   └── docker-compose.yml
├── kubernetes/
│   ├── api-deployment.yaml
│   ├── website-deployment.yaml
│   └── ingress.yaml
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

## Shared Configuration Files

### `/tsconfig.base.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  }
}
```

### `/.eslintrc.js`
```javascript
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  }
};
```

### `/.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

## Environment Variables

### `/.env.example`
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/leaperfx
REDIS_URL=redis://localhost:6379

# API
API_PORT=3000
API_URL=http://localhost:3000

# WebSocket
WS_PORT=3001
WS_URL=ws://localhost:3001

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Services
WEBSITE_URL=http://localhost:3002
DASHBOARD_URL=http://localhost:3003
RATE_DISPLAY_URL=http://localhost:3004

# External APIs
EXCHANGE_RATE_API_KEY=your-api-key
FINTRAC_API_KEY=your-api-key

# Storage
S3_BUCKET=leaperfx-documents
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
LOGFLARE_API_KEY=your-api-key
```

## Package Dependencies

### Workspace Dependencies
```json
{
  "@leaperfx/shared-ui": "workspace:*",
  "@leaperfx/core-services": "workspace:*",
  "@leaperfx/api-client": "workspace:*",
  "@leaperfx/types": "workspace:*"
}
```

## Build & Deploy Scripts

### `/scripts/setup.sh`
```bash
#!/bin/bash
echo "Setting up LeaperFX monorepo..."
npm install
npm run build:packages
npm run db:migrate
npm run seed:dev
echo "Setup complete!"
```

### `/scripts/deploy.sh`
```bash
#!/bin/bash
echo "Deploying LeaperFX..."
npm run test
npm run build
npm run deploy:api
npm run deploy:website
npm run deploy:dashboard
echo "Deployment complete!"
```

This monorepo structure provides:
- Clear separation between applications, packages, and services
- Shared code reusability
- Independent deployment capability
- Type safety across the entire platform
- Efficient development workflow with Turborepo
- Scalable architecture for future growth