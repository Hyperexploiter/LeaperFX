# Payment Systems Implementation Plan
## Store Owner Operating System - Phase 2

### Requirements from phase2.tex

#### Stripe Terminal Integration (Milestone 2)
- **Verifone P400**: Primary terminal for chip & PIN, contactless
- **BBPOS WisePad 3**: Mobile terminal for flexibility
- **Payment Methods**: Interac, Visa, Mastercard, Amex, Apple Pay, Google Pay
- **Real-time Sync**: Instant transaction recording in dashboard

#### Cryptocurrency Integration (Enhancement)
- **Supported Cryptos**: BTC, ETH, SOL, AVAX, USDC
- **Payment Methods**: Credit, Debit, Apple Pay via Stripe
- **Features**:
  - Instant crypto delivery to customer wallets
  - Zero fraud liability (Stripe handles)
  - Real-time crypto rates
  - FINTRAC compliance for all crypto transactions

### Implementation Architecture

```
dashboard/demo/src/
├── features/
│   ├── payments/                    # NEW FEATURE MODULE
│   │   ├── components/
│   │   │   ├── PaymentSettings/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── StripeTerminalConfig.tsx
│   │   │   │   ├── CryptoPaymentConfig.tsx
│   │   │   │   └── PaymentMethodsList.tsx
│   │   │   ├── TerminalManager/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── DeviceStatus.tsx
│   │   │   │   └── ConnectionWizard.tsx
│   │   │   └── CryptoCheckout/
│   │   │       ├── index.tsx
│   │   │       ├── WalletInput.tsx
│   │   │       └── CryptoRatesDisplay.tsx
│   │   ├── services/
│   │   │   ├── stripeTerminalService.ts
│   │   │   ├── cryptoPaymentService.ts
│   │   │   └── paymentProcessingService.ts
│   │   ├── hooks/
│   │   │   ├── useStripeTerminal.ts
│   │   │   └── useCryptoRates.ts
│   │   └── index.tsx
│   └── transactions/
│       └── components/
│           └── TransactionForm/
│               └── PaymentMethodSelector.tsx  # UPDATED
```

### Detailed Implementation Tasks

#### Phase 1: Payment Infrastructure (Day 1-2)

##### 1.1 Create Payment Feature Module
```typescript
// features/payments/index.tsx
export { PaymentSettings } from './components/PaymentSettings';
export { TerminalManager } from './components/TerminalManager';
export { stripeTerminalService } from './services/stripeTerminalService';
export { cryptoPaymentService } from './services/cryptoPaymentService';
```

##### 1.2 Stripe Terminal Service
```typescript
// services/stripeTerminalService.ts
interface StripeTerminalConfig {
  locationId: string;
  devices: Array<{
    id: string;
    type: 'verifone_P400' | 'bbpos_wisepad3';
    label: string;
    status: 'online' | 'offline' | 'busy';
  }>;
}

class StripeTerminalService {
  async initializeTerminal(config: StripeTerminalConfig);
  async connectDevice(deviceId: string);
  async processPayment(amount: number, currency: string);
  async refundPayment(chargeId: string);
  async getConnectionStatus();
}
```

##### 1.3 Crypto Payment Service
```typescript
// services/cryptoPaymentService.ts
interface CryptoTransaction {
  cryptocurrency: 'BTC' | 'ETH' | 'SOL' | 'AVAX' | 'USDC';
  fiatAmount: number;
  fiatCurrency: 'CAD' | 'USD';
  cryptoAmount: number;
  walletAddress: string;
  networkFee: number;
  exchangeRate: number;
}

class CryptoPaymentService {
  async getCryptoRates(): Promise<CryptoRates>;
  async calculateCryptoAmount(fiat: number, crypto: string);
  async processCryptoPayment(transaction: CryptoTransaction);
  async validateWalletAddress(address: string, chain: string);
  async generateFintracReport(transaction: CryptoTransaction);
}
```

#### Phase 2: UI Components (Day 3-4)

##### 2.1 Payment Settings Component
```typescript
// components/PaymentSettings/index.tsx
- Main settings container
- Tab navigation (Terminals, Crypto, Methods, Reports)
- Save/Test configuration buttons
```

##### 2.2 Stripe Terminal Configuration
```typescript
// components/PaymentSettings/StripeTerminalConfig.tsx
- Device management grid
- Connection status indicators
- Test transaction button
- Receipt printer settings
```

##### 2.3 Crypto Payment Configuration
```typescript
// components/PaymentSettings/CryptoPaymentConfig.tsx
- Enable/disable cryptocurrencies
- Set spreads and fees
- Wallet validation rules
- Compliance thresholds
```

#### Phase 3: Transaction Flow Integration (Day 5-6)

##### 3.1 Update Transaction Form
```typescript
// Add payment method selection
- Cash (existing)
- Debit Card (new - Terminal)
- Credit Card (new - Terminal)
- Crypto (new - Multi-chain)
- Apple Pay (new - Terminal/Crypto)
```

##### 3.2 Payment Processing Flow
```typescript
1. Customer selects currency and amount
2. Choose payment method
3. If Terminal:
   - Initialize device
   - Customer taps/inserts card
   - Process payment
   - Print receipt
4. If Crypto:
   - Select cryptocurrency
   - Enter wallet address
   - Show QR code for payment
   - Confirm blockchain transaction
   - Generate FINTRAC record
```

#### Phase 4: Compliance & Reporting (Day 7-8)

##### 4.1 FINTRAC Crypto Integration
```typescript
// Automatic reporting for crypto transactions
- Transaction details
- Wallet addresses
- Blockchain transaction IDs
- Customer verification
- Risk assessment
```

##### 4.2 Payment Analytics
```typescript
// New analytics metrics
- Payment method breakdown
- Terminal utilization
- Crypto volume trends
- Failed transaction analysis
- Fee/commission reports
```

### Database Schema Updates

```sql
-- Payment configurations
CREATE TABLE payment_configs (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  stripe_location_id VARCHAR(255),
  stripe_secret_key_encrypted TEXT,
  crypto_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Terminal devices
CREATE TABLE terminal_devices (
  id UUID PRIMARY KEY,
  config_id UUID REFERENCES payment_configs(id),
  stripe_device_id VARCHAR(255),
  device_type VARCHAR(50),
  label VARCHAR(100),
  status VARCHAR(20),
  last_seen TIMESTAMP
);

-- Crypto transactions
CREATE TABLE crypto_transactions (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  cryptocurrency VARCHAR(10),
  crypto_amount DECIMAL(20, 8),
  wallet_address VARCHAR(255),
  blockchain_tx_id VARCHAR(255),
  network_fee DECIMAL(10, 2),
  status VARCHAR(20),
  fintrac_reported BOOLEAN DEFAULT false
);
```

### Agent Deployment Strategy

#### Agent 1: Backend Developer
**Task**: Implement payment services and API endpoints
- Create stripeTerminalService.ts
- Create cryptoPaymentService.ts
- Add database migrations
- Implement API routes

#### Agent 2: Frontend Developer
**Task**: Build payment settings UI
- Create PaymentSettings components
- Implement Terminal configuration
- Build crypto payment flow
- Update transaction form

#### Agent 3: Integration Engineer
**Task**: Connect services and test
- Integrate Stripe SDK
- Test terminal connections
- Validate crypto transactions
- End-to-end testing

#### Agent 4: Compliance Specialist
**Task**: FINTRAC and security
- Implement crypto reporting
- Add transaction monitoring
- Security audit
- Documentation

### Success Criteria

1. **Stripe Terminals**
   - [ ] Both devices connect successfully
   - [ ] Process test transactions
   - [ ] Real-time sync to dashboard
   - [ ] Receipt printing works

2. **Crypto Payments**
   - [ ] All 5 cryptocurrencies supported
   - [ ] Wallet validation works
   - [ ] Real-time rate updates
   - [ ] Successful test transactions

3. **Compliance**
   - [ ] FINTRAC reports auto-generate
   - [ ] Audit trail complete
   - [ ] Risk thresholds enforced
   - [ ] Export functionality works

4. **User Experience**
   - [ ] 90-second transaction time
   - [ ] Intuitive payment flow
   - [ ] Clear status indicators
   - [ ] Comprehensive error handling

### Risk Mitigation

1. **Technical Risks**
   - Test in Stripe sandbox first
   - Use testnet for crypto
   - Implement rollback capability
   - Extensive error handling

2. **Compliance Risks**
   - Review FINTRAC guidelines
   - Implement all required fields
   - Auto-flag suspicious activity
   - Regular audit logs

3. **Security Risks**
   - Encrypt all keys
   - Use secure webhooks
   - Implement rate limiting
   - Regular security scans

### Timeline
- **Day 1-2**: Infrastructure setup
- **Day 3-4**: UI components
- **Day 5-6**: Integration
- **Day 7-8**: Testing & compliance
- **Day 9-10**: Deployment & monitoring