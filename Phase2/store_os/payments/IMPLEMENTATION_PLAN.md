# Payment Integration Implementation Plan

## Phase 1: Pre-Hardware Setup (Ready Now)

### 1.1 Stripe Terminal Configuration
```typescript
// Update stripeTerminalService.ts for production readiness
const STRIPE_CONFIG = {
  // Switch to live mode when ready
  testMode: process.env.NODE_ENV === 'development',

  // Canadian readers configuration
  supportedReaders: {
    'BBPOS_WISEPOS_E': {
      name: 'BBPOS WisePOS E',
      type: 'internet',
      price: 'CAD $299',
      features: ['Interac', 'Tap', 'Chip', 'Swipe']
    },
    'STRIPE_S700': {
      name: 'Stripe Reader S700',
      type: 'smart',
      price: 'CAD $449',
      features: ['Android Apps', 'Standalone', 'All payment types']
    }
  },

  // Canadian payment methods
  supportedPaymentMethods: ['interac', 'visa', 'mastercard', 'amex', 'discover'],

  // Location settings for Saadat Exchange
  defaultLocation: {
    display_name: 'Currency Exchange SAADAT',
    address: {
      country: 'CA',
      city: 'Montreal',
      // Add actual address
    }
  }
};
```

### 1.2 Connection Flow Enhancement
The existing stripeTerminalService.ts already handles:
- ✅ Device discovery
- ✅ Connection management
- ✅ Payment processing
- ✅ Error handling with retries

**Action Required**: Update API endpoint for connection tokens:
```typescript
// In stripeTerminalService.ts, line 58
private async fetchConnectionToken(): Promise<string> {
  // Update to production endpoint
  const endpoints = [
    '/api/stripe/connection-token',  // Primary
    '/api/terminal/token',           // Fallback
  ];

  // ... existing fallback logic
}
```

## Phase 2: Hardware Arrival Actions

### 2.1 Device Pairing Process
When Stripe devices arrive:

1. **Unbox and Power On**
   - BBPOS WisePOS E: Connect to ethernet/WiFi
   - Stripe S700: Connect to WiFi via touchscreen

2. **Register in Dashboard**
   ```bash
   # Access Stripe Dashboard
   https://dashboard.stripe.com/terminal/locations

   # Add reader to location "Currency Exchange SAADAT"
   # Note the reader ID for configuration
   ```

3. **Update Configuration**
   ```typescript
   // Add to environment variables
   STRIPE_READER_ID=tmr_xxxxx
   STRIPE_LOCATION_ID=tml_xxxxx
   ```

4. **Test Connection**
   - Use existing discovery flow in Store OS
   - Reader should appear in discovery list
   - Connect and process test payment

### 2.2 Integration Testing Checklist
- [ ] Device discovery working
- [ ] Connection established
- [ ] Test payment processed (use test card)
- [ ] Receipt generated
- [ ] Transaction recorded in system
- [ ] FINTRAC compliance triggered for large amounts
- [ ] Analytics updated

## Phase 3: Crypto Payment Implementation

### 3.1 Immediate: Coinbase Commerce Integration
```typescript
// Enhanced crypto payment flow
class ProductionCryptoService {
  async processCryptoPayment(request: CryptoPaymentRequest) {
    // 1. Use existing cryptoPaymentService.ts
    const result = await this.cryptoPaymentService.processPayment(request);

    // 2. Trigger FINTRAC compliance
    if (request.amount >= 1000) {
      await this.cryptoFintracService.createVCTR(result);
    }

    // 3. Record in transaction service
    await this.transactionService.createTransaction({
      ...result,
      paymentMethod: 'cryptocurrency',
      cryptocurrency: request.cryptocurrency
    });

    return result;
  }
}
```

### 3.2 Future: Stripe Crypto (When Available in Canada)
- Request beta access to Stripe crypto payments
- Integrate with existing Payment Intents flow
- Redirect to crypto.link.com for wallet connection

## Phase 4: SmartCalculator Integration

The SmartCalculator already handles the complete flow:

### Current Working Flow:
1. **Amount Entry** → SmartCalculator calculates exchange
2. **Customer Selection** → Creates/selects customer with FINTRAC data
3. **Payment Method** → Opens PaymentProcessingModal
4. **Process Payment** → Calls appropriate payment service:
   - Cash: Direct recording
   - Card: Stripe Terminal flow
   - Crypto: Crypto payment service
5. **Transaction Creation** → Records with all compliance data
6. **Receipt Generation** → Prints/emails receipt

### Enhancement Needed:
```typescript
// In PaymentProcessingModal, add Stripe Terminal trigger
const handleCardPayment = async () => {
  // Get amount from props
  const amount = Math.round(totalAmount * 100); // Convert to cents

  // Call Stripe Terminal service
  const terminal = await stripeTerminalService.getInstance();

  // Process payment
  const result = await terminal.processPayment({
    amount,
    currency: 'cad',
    description: `Exchange: ${fromCurrency} to ${toCurrency}`
  });

  // Return result to SmartCalculator
  onPaymentComplete({
    paymentMethod: 'stripe_terminal',
    paymentResult: result,
    paymentReferenceId: result.paymentIntent.id
  });
};
```

## Phase 5: Production Deployment

### 5.1 Environment Configuration
```env
# .env.production
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_TERMINAL_LOCATION=tml_xxx
COINBASE_COMMERCE_API_KEY=xxx
REACT_APP_API_URL=https://api.saadatexchange.com
```

### 5.2 Security Checklist
- [ ] Remove all test keys
- [ ] Enable HTTPS only
- [ ] Set up webhook endpoints
- [ ] Configure IP allowlisting
- [ ] Enable 2FA for Stripe Dashboard
- [ ] Set up monitoring/alerts

### 5.3 Compliance Verification
- [ ] FINTRAC registration confirmed
- [ ] Transaction reporting tested
- [ ] Audit trail verified
- [ ] Data retention policy implemented

## Current Action Items

### Immediate (Before Hardware):
1. ✅ Move analytics to Analytics tab
2. Update connection token endpoint
3. Set up production Stripe account
4. Configure Stripe locations in Dashboard
5. Implement Coinbase Commerce as crypto fallback

### Upon Hardware Arrival:
1. Register devices in Stripe Dashboard
2. Update reader IDs in configuration
3. Test end-to-end payment flow
4. Train staff on device usage
5. Create troubleshooting guide

### Integration Points:
- **SmartCalculator**: Already integrated, just needs terminal ID
- **Transactions Tab**: Automatically receives all payments
- **Analytics Tab**: Now contains payment analytics
- **Compliance Tab**: Receives FINTRAC alerts

## Testing Strategy

### Unit Tests:
```typescript
describe('Stripe Terminal Integration', () => {
  it('should discover readers', async () => {
    const readers = await terminal.discoverReaders();
    expect(readers.length).toBeGreaterThan(0);
  });

  it('should connect to reader', async () => {
    const reader = await terminal.connectReader(testReaderId);
    expect(reader.status).toBe('online');
  });

  it('should process payment', async () => {
    const payment = await terminal.processPayment({
      amount: 1000,
      currency: 'cad'
    });
    expect(payment.status).toBe('succeeded');
  });
});
```

### Integration Tests:
1. Complete flow from SmartCalculator
2. FINTRAC reporting for large amounts
3. Multi-currency transactions
4. Receipt generation and delivery
5. Analytics data accuracy

## Support Documentation

### For Store Staff:
1. How to connect Stripe Terminal
2. Processing different payment types
3. Handling declined payments
4. Generating receipts
5. Troubleshooting connection issues

### For Management:
1. Analytics dashboard overview
2. FINTRAC compliance reports
3. Daily reconciliation process
4. Refund procedures
5. Security best practices

## Timeline

- **Week 1**: Complete pre-hardware setup
- **Week 2**: Hardware arrival and configuration
- **Week 3**: Testing and staff training
- **Week 4**: Production deployment

## Risk Mitigation

1. **Hardware Delay**: Use simulator mode for testing
2. **Connection Issues**: Implement offline mode with queue
3. **Payment Failures**: Clear error messages and retry logic
4. **Compliance Issues**: Automated FINTRAC reporting with alerts
5. **Technical Issues**: 24/7 monitoring with alerts

---

This plan ensures the payment system is ready for immediate use when Stripe devices arrive, with all necessary integrations and compliance measures in place.