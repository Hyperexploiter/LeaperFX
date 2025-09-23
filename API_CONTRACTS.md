# LeaperFX API Contracts & Service Boundaries

## API Gateway Overview

Base URL: `https://api.leaperfx.com/v1`

### Authentication
All protected endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

## Authentication Service

### POST `/auth/login`
**Purpose**: Authenticate user and receive access tokens
```typescript
// Request
{
  email: string;
  password: string;
  storeId?: string;  // For multi-store support
}

// Response
{
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      email: string;
      name: string;
      role: 'owner' | 'operator' | 'viewer';
      permissions: string[];
    }
  }
}
```

### POST `/auth/refresh`
**Purpose**: Refresh access token using refresh token
```typescript
// Request
{
  refreshToken: string;
}

// Response
{
  success: boolean;
  data: {
    accessToken: string;
    expiresIn: number;
  }
}
```

### POST `/auth/logout`
**Purpose**: Invalidate refresh token
```typescript
// Request
{
  refreshToken: string;
}

// Response
{
  success: boolean;
  message: string;
}
```

## Exchange Rate Service

### GET `/rates/current`
**Purpose**: Get current exchange rates
**Public**: Yes
```typescript
// Query Parameters
?base=CAD&targets=USD,EUR,GBP

// Response
{
  success: boolean;
  data: {
    base: string;
    timestamp: string;
    rates: {
      [currency: string]: {
        buy: number;
        sell: number;
        mid: number;
      }
    }
  }
}
```

### GET `/rates/history`
**Purpose**: Get historical rates
```typescript
// Query Parameters
?base=CAD&target=USD&from=2024-01-01&to=2024-01-31

// Response
{
  success: boolean;
  data: {
    base: string;
    target: string;
    history: Array<{
      date: string;
      buy: number;
      sell: number;
      mid: number;
    }>
  }
}
```

### POST `/rates/lock`
**Purpose**: Lock exchange rate for customer
```typescript
// Request
{
  customerId?: string;
  phoneNumber?: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  expiresIn: number; // minutes
}

// Response
{
  success: boolean;
  data: {
    lockId: string;
    code: string;  // 6-digit verification code
    expiresAt: string;
    rate: number;
  }
}
```

## Transaction Service

### POST `/transactions/create`
**Purpose**: Create new transaction
```typescript
// Request
{
  customerId: string;
  fromCurrency: string;
  fromAmount: number;
  toCurrency: string;
  toAmount: number;
  rate: number;
  commission: number;
  paymentMethod: 'cash' | 'debit' | 'credit' | 'interac';
  rateLockId?: string;
  notes?: string;
}

// Response
{
  success: boolean;
  data: {
    transactionId: string;
    receiptNumber: string;
    status: 'completed' | 'pending' | 'cancelled';
    complianceStatus?: 'standard' | 'lctr_required' | 'enhanced_records';
    lctrDeadline?: string;
  }
}
```

### GET `/transactions/list`
**Purpose**: Get paginated transaction list
```typescript
// Query Parameters
?page=1&limit=20&from=2024-01-01&to=2024-01-31&status=completed

// Response
{
  success: boolean;
  data: {
    transactions: Array<Transaction>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }
}
```

### GET `/transactions/:id`
**Purpose**: Get transaction details
```typescript
// Response
{
  success: boolean;
  data: Transaction;
}
```

### POST `/transactions/:id/receipt`
**Purpose**: Generate and email receipt
```typescript
// Request
{
  email: string;
  format: 'pdf' | 'text';
}

// Response
{
  success: boolean;
  data: {
    sent: boolean;
    receiptUrl: string;
  }
}
```

## Inventory Service

### GET `/inventory/current`
**Purpose**: Get current inventory levels
```typescript
// Response
{
  success: boolean;
  data: Array<{
    currency: string;
    amount: number;
    lastUpdated: string;
    threshold: number;
    status: 'healthy' | 'low' | 'critical';
  }>
}
```

### PUT `/inventory/update`
**Purpose**: Update inventory level
```typescript
// Request
{
  currency: string;
  amount: number;
  operation: 'set' | 'add' | 'subtract';
  reason: string;
}

// Response
{
  success: boolean;
  data: {
    currency: string;
    previousAmount: number;
    newAmount: number;
    updatedAt: string;
  }
}
```

### POST `/inventory/alerts`
**Purpose**: Configure inventory alerts
```typescript
// Request
{
  currency: string;
  threshold: number;
  notifyEmail: boolean;
  notifyDashboard: boolean;
}

// Response
{
  success: boolean;
  data: {
    alertId: string;
    currency: string;
    threshold: number;
  }
}
```

## Compliance Service

### GET `/compliance/transactions`
**Purpose**: Get transactions requiring compliance action
```typescript
// Query Parameters
?status=lctr_required&from=2024-01-01

// Response
{
  success: boolean;
  data: Array<{
    transactionId: string;
    amount: number;
    customerId: string;
    complianceType: 'lctr' | 'eftr' | 'str';
    deadline: string;
    status: 'pending' | 'submitted' | 'overdue';
  }>
}
```

### POST `/compliance/report/lctr`
**Purpose**: Submit Large Cash Transaction Report
```typescript
// Request
{
  transactionId: string;
  reportData: {
    // FINTRAC LCTR fields
    conductorInfo: {...};
    beneficiaryInfo: {...};
    transactionDetails: {...};
  }
}

// Response
{
  success: boolean;
  data: {
    reportId: string;
    fintracId: string;
    submittedAt: string;
    status: 'submitted' | 'accepted' | 'rejected';
  }
}
```

### GET `/compliance/reports/export`
**Purpose**: Export compliance reports
```typescript
// Query Parameters
?format=csv&from=2024-01-01&to=2024-01-31

// Response
{
  success: boolean;
  data: {
    downloadUrl: string;
    expiresAt: string;
    recordCount: number;
  }
}
```

## Customer Service

### POST `/customers/create`
**Purpose**: Create new customer
```typescript
// Request
{
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  identification: {
    type: 'passport' | 'drivers_license' | 'health_card';
    number: string;
    expiryDate: string;
    issuingCountry: string;
  };
  riskProfile?: 'low' | 'medium' | 'high';
}

// Response
{
  success: boolean;
  data: {
    customerId: string;
    status: 'active' | 'pending_verification';
    createdAt: string;
  }
}
```

### GET `/customers/search`
**Purpose**: Search customers
```typescript
// Query Parameters
?q=john&phone=514&email=@gmail.com

// Response
{
  success: boolean;
  data: Array<Customer>;
}
```

### POST `/customers/:id/verify`
**Purpose**: Verify customer identity
```typescript
// Request
{
  verificationMethod: 'document' | 'biometric' | 'manual';
  documentImages?: string[];  // Base64 encoded
  biometricData?: {...};
}

// Response
{
  success: boolean;
  data: {
    verified: boolean;
    verificationId: string;
    confidence: number;
    issues?: string[];
  }
}
```

## Analytics Service

### GET `/analytics/dashboard`
**Purpose**: Get dashboard metrics
```typescript
// Query Parameters
?period=7d

// Response
{
  success: boolean;
  data: {
    summary: {
      todayTransactions: number;
      todayRevenue: number;
      todayProfit: number;
      activeCustomers: number;
    };
    trends: {
      transactions: Array<{date: string; count: number}>;
      revenue: Array<{date: string; amount: number}>;
    };
    topCurrencies: Array<{
      currency: string;
      volume: number;
      profit: number;
    }>;
    insights: Array<{
      type: 'info' | 'warning' | 'opportunity';
      message: string;
      priority: number;
    }>;
  }
}
```

### GET `/analytics/performance`
**Purpose**: Get detailed performance metrics
```typescript
// Query Parameters
?from=2024-01-01&to=2024-01-31&groupBy=day

// Response
{
  success: boolean;
  data: {
    metrics: Array<{
      date: string;
      transactions: number;
      volume: number;
      revenue: number;
      profit: number;
      avgTransactionSize: number;
    }>;
    comparison: {
      previousPeriod: {...};
      percentageChange: {...};
    }
  }
}
```

## Crypto Service (Stripe Integration)

### GET `/crypto/rates`
**Purpose**: Get cryptocurrency exchange rates
```typescript
// Response
{
  success: boolean;
  data: {
    timestamp: string;
    rates: {
      BTC: { cad: number; usd: number };
      ETH: { cad: number; usd: number };
      USDC: { cad: number; usd: number };
      SOL: { cad: number; usd: number };
    }
  }
}
```

### POST `/crypto/transaction/create`
**Purpose**: Create crypto purchase transaction
```typescript
// Request
{
  customerId: string;
  cryptocurrency: 'BTC' | 'ETH' | 'USDC' | 'SOL';
  fiatAmount: number;
  fiatCurrency: 'CAD' | 'USD';
  walletAddress: string;
  paymentMethodId: string;  // Stripe payment method
}

// Response
{
  success: boolean;
  data: {
    transactionId: string;
    cryptoAmount: number;
    fiatAmount: number;
    fee: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    estimatedDelivery: string;
    blockchainTxId?: string;
  }
}
```

## WebSocket Events

### Connection
```typescript
// Connect to WebSocket server
const ws = new WebSocket('wss://ws.leaperfx.com');

// Authentication after connection
ws.send(JSON.stringify({
  type: 'auth',
  token: 'Bearer <token>'
}));
```

### Rate Updates
```typescript
// Subscribe to rate updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'rates',
  currencies: ['USD', 'EUR', 'GBP']
}));

// Receive rate updates
{
  type: 'rate:update',
  data: {
    currency: 'USD',
    buy: 1.35,
    sell: 1.37,
    timestamp: '2024-01-01T12:00:00Z'
  }
}
```

### Transaction Notifications
```typescript
// Subscribe to transaction notifications
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'transactions'
}));

// Receive notifications
{
  type: 'transaction:created',
  data: {
    transactionId: string;
    amount: number;
    currency: string;
    customer: string;
  }
}
```

### Inventory Alerts
```typescript
// Subscribe to inventory alerts
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'inventory'
}));

// Receive alerts
{
  type: 'inventory:low',
  data: {
    currency: string;
    currentAmount: number;
    threshold: number;
    severity: 'warning' | 'critical';
  }
}
```

### Compliance Notifications
```typescript
// Subscribe to compliance notifications
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'compliance'
}));

// Receive notifications
{
  type: 'compliance:deadline',
  data: {
    reportType: 'lctr' | 'eftr';
    transactionId: string;
    deadline: string;
    hoursRemaining: number;
  }
}
```

## Error Responses

All API errors follow a consistent format:
```typescript
{
  success: false;
  error: {
    code: string;           // e.g., 'AUTH_INVALID_TOKEN'
    message: string;        // Human-readable message
    details?: any;          // Additional error details
    timestamp: string;
  }
}
```

### Common Error Codes
- `AUTH_INVALID_TOKEN`: Invalid or expired token
- `AUTH_INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server error occurred
- `COMPLIANCE_DEADLINE_MISSED`: Compliance deadline has passed
- `INVENTORY_INSUFFICIENT`: Insufficient inventory for transaction
- `PAYMENT_FAILED`: Payment processing failed

## Rate Limiting

API rate limits per tier:
- **Public endpoints**: 100 requests/minute
- **Authenticated endpoints**: 1000 requests/minute
- **WebSocket connections**: 10 concurrent connections

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

## Service Boundaries

### 1. Public Services (No Authentication)
- Current exchange rates
- Rate calculator
- Contact form submission
- Public rate display feed

### 2. Operator Services (Requires Authentication)
- Transaction creation and management
- Customer search and creation
- Inventory viewing
- Basic compliance reporting

### 3. Owner Services (Elevated Permissions)
- Full analytics access
- Inventory management
- User management
- System configuration
- Financial reports

### 4. System Services (Internal Only)
- Database migrations
- Backup operations
- Monitoring and health checks
- Internal service communication

## Data Validation Rules

### Currency Codes
- Must be valid ISO 4217 3-letter codes
- Supported: CAD, USD, EUR, GBP, JPY, CNY, INR, MXN, etc.

### Amounts
- Minimum transaction: $10 CAD equivalent
- Maximum transaction: $10,000 CAD (triggers LCTR)
- Decimal precision: 2 places for fiat, 8 for crypto

### Dates and Times
- All timestamps in ISO 8601 format
- UTC timezone for storage
- Local timezone for display

### Phone Numbers
- E.164 format: +1234567890
- Must include country code

## Security Requirements

### API Security
- TLS 1.3 minimum
- JWT tokens with 15-minute expiry
- Refresh tokens with 7-day expiry
- Rate limiting on all endpoints
- Request signing for sensitive operations

### Data Security
- PII encryption at rest
- Audit logging for all operations
- GDPR/PIPEDA compliance
- Regular security scans

### Compliance Security
- FINTRAC reporting automation
- Transaction monitoring
- Suspicious activity detection
- Identity verification requirements