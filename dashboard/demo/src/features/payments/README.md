# Payment Services Infrastructure

This directory contains the complete payment processing infrastructure for the LeaperFX Store Owner Operating System, supporting both traditional payment terminals and cryptocurrency transactions with FINTRAC compliance.

## Architecture Overview

The payment system consists of three main services orchestrated by a unified payment processing service:

### 🏛️ Core Services

1. **Payment Processing Service** (`paymentProcessingService.ts`)
   - Unified interface for all payment types
   - Orchestrates terminal and crypto payments
   - Handles analytics and compliance reporting
   - Manages payment history and system status

2. **Stripe Terminal Service** (`stripeTerminalService.ts`)
   - Hardware payment terminal management
   - Device discovery and connection
   - Support for Verifone P400 and BBPOS WisePad 3
   - Real-time payment processing with retry logic

3. **Crypto Payment Service** (`cryptoPaymentService.ts`)
   - Multi-cryptocurrency support (BTC, ETH, SOL, AVAX, USDC)
   - Real-time rate fetching and caching
   - Wallet address validation
   - FINTRAC reporting for large transactions

## 💳 Supported Payment Methods

### Traditional Payments
- **Stripe Terminal**: Card payments via hardware terminals
- **Cash**: Manual cash transaction recording
- **Interac**: Debit card processing

### Cryptocurrency Payments
- **Bitcoin (BTC)**: Legacy, SegWit, and Bech32 addresses
- **Ethereum (ETH)**: EVM-compatible addresses
- **Solana (SOL)**: Native Solana addresses
- **Avalanche (AVAX)**: C-Chain EVM addresses
- **USD Coin (USDC)**: Stablecoin on multiple networks

## 🔧 Quick Start

```typescript
import { paymentProcessingService, initializePaymentServices } from './features/payments';

// Initialize all payment services
const result = await initializePaymentServices();
console.log('Payment services initialized:', result.success);

// Process a payment
const paymentResult = await paymentProcessingService.processPayment({
  amount: 100.00, // CAD
  paymentMethod: 'stripe_terminal',
  description: 'Coffee and pastry',
  customerEmail: 'customer@example.com'
});

// Process a crypto payment
const cryptoResult = await paymentProcessingService.processPayment({
  amount: 250.00, // CAD
  paymentMethod: 'cryptocurrency',
  cryptocurrency: 'BTC',
  recipientWallet: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  description: 'Crypto payment'
});
```

## 🛡️ Security Features

### Wallet Validation
- Multi-format address validation
- Network detection (mainnet/testnet)
- Cryptocurrency auto-detection
- Confidence scoring for validation results

### Error Handling
- Comprehensive error classification
- Automatic retry with exponential backoff
- User-friendly error messages
- Technical error logging and monitoring

### FINTRAC Compliance
- Automatic compliance level detection
- Large Cash Transaction Report (LCTR) preparation
- Enhanced record keeping for transactions ≥ $3,000 CAD
- Risk assessment and flagging

## 📊 System Monitoring

### Real-time Status
```typescript
const status = paymentProcessingService.getSystemStatus();
console.log('System health:', status.overall.status);
console.log('Terminal connected:', status.stripeTerminal.connectionStatus.status);
console.log('Crypto service:', status.cryptocurrency.initialized);
```

### Analytics
```typescript
const analytics = paymentProcessingService.getPaymentAnalytics();
console.log('Today\'s volume:', analytics.today.totalVolume);
console.log('Payment methods:', analytics.byMethod);
console.log('Crypto breakdown:', analytics.cryptocurrency);
```

## 🔌 Hardware Support

### Supported Terminals
- **Verifone P400**: Full-featured countertop terminal
- **BBPOS WisePad 3**: Mobile card reader
- **Simulated Device**: Testing and development

### Terminal Features
- Contactless payments (NFC)
- Chip and PIN
- Magnetic stripe
- Battery monitoring
- Remote reboot capability

## 💰 Cryptocurrency Features

### Rate Management
- Real-time rate fetching from multiple sources
- 30-second cache with fallback rates
- CAD and USD pricing
- 24-hour change tracking

### Transaction Processing
- Network fee estimation
- Confirmation tracking
- Block explorer integration
- Transaction status monitoring

### Supported Networks
- Bitcoin: Mainnet with multiple address formats
- Ethereum: Mainnet with ERC-20 token support
- Solana: Native SPL tokens
- Avalanche: C-Chain compatibility
- Multi-chain USDC support

## 📋 Compliance Features

### FINTRAC Reporting
- Automatic threshold detection
- Report generation for transactions ≥ $10,000 CAD
- Enhanced records for transactions ≥ $3,000 CAD
- Customer due diligence integration

### Risk Assessment
- Transaction pattern analysis
- Automatic flag generation
- Risk level scoring (low/medium/high/critical)
- Suspicious activity monitoring

## 🛠️ Configuration

### Environment Variables
```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Crypto Service Configuration
CRYPTO_API_KEY=your_crypto_api_key
CRYPTO_RATE_SOURCE=coingecko

# Compliance Configuration
FINTRAC_LCTR_THRESHOLD=10000
FINTRAC_ENHANCED_THRESHOLD=3000
```

### Service Configuration
```typescript
const config = {
  terminal: {
    apiKey: process.env.STRIPE_PUBLISHABLE_KEY,
    environment: 'test',
    merchantDisplayName: 'LeaperFX Store',
    autoConnect: true
  },
  crypto: {
    supportedCurrencies: ['BTC', 'ETH', 'SOL', 'AVAX', 'USDC'],
    rateUpdateInterval: 30000,
    confirmationThresholds: {
      BTC: 1,
      ETH: 12,
      SOL: 1,
      AVAX: 1,
      USDC: 12
    }
  }
};
```

## 🧪 Testing

### Mock Data
All services include comprehensive mock data for testing:
- Simulated terminal devices
- Mock cryptocurrency rates
- Test wallet addresses
- Sample transaction responses

### Error Simulation
```typescript
// Simulate network errors
const errorResult = await paymentProcessingService.processPayment({
  amount: -1, // Invalid amount triggers validation error
  paymentMethod: 'cryptocurrency',
  cryptocurrency: 'BTC',
  recipientWallet: 'invalid_address'
});
```

## 📈 Performance

### Optimizations
- Rate caching with TTL
- Connection pooling for terminals
- Batch processing for multiple payments
- Lazy loading of crypto services

### Monitoring
- Response time tracking
- Error rate monitoring
- System health checks
- Performance metrics collection

## 🔄 Event System

### Payment Events
```typescript
// Listen for payment events
window.addEventListener('payment_completed', (event) => {
  console.log('Payment completed:', event.detail.result);
});

window.addEventListener('cryptoFintracReportRequired', (event) => {
  console.log('FINTRAC report required:', event.detail);
});

window.addEventListener('terminal_connected', (event) => {
  console.log('Terminal connected:', event.detail.deviceId);
});
```

## 📝 API Reference

### Main Service Methods
- `initialize()`: Initialize all payment services
- `processPayment(request)`: Process unified payment
- `getSystemStatus()`: Get current system status
- `getPaymentAnalytics()`: Get payment analytics
- `getPaymentHistory()`: Get transaction history

### Terminal Service Methods
- `discoverDevices()`: Find available terminals
- `connectToDevice(deviceId)`: Connect to specific terminal
- `processPayment(request)`: Process terminal payment
- `disconnect()`: Disconnect from terminal

### Crypto Service Methods
- `getCryptoRates()`: Get real-time rates
- `validateWalletAddress(address)`: Validate wallet address
- `processPayment(request)`: Process crypto payment
- `checkTransactionStatus(txHash)`: Check transaction status

## 🚨 Error Handling

### Error Types
- `validation_error`: Invalid input data
- `network_error`: Connection problems
- `card_declined`: Payment declined
- `processing_error`: Payment processing failed
- `insufficient_funds`: Insufficient balance
- `invalid_wallet`: Invalid crypto address
- `timeout`: Operation timeout
- `canceled`: User canceled
- `compliance_error`: Compliance violation
- `system_error`: System malfunction

### Error Recovery
```typescript
try {
  const result = await paymentProcessingService.processPayment(request);
} catch (error) {
  if (error.recoverable) {
    // Retry the operation
    console.log('Retrying payment...');
  } else {
    // Handle non-recoverable error
    console.error('Payment failed:', error.userMessage);
  }
}
```

## 🔐 Security Considerations

## 🧲 Stripe Terminal Integration Guide

This module is ready to connect to Stripe Terminal cloud readers. The frontend automatically attempts to use the real Stripe Terminal JS SDK and falls back to a simulator when unavailable.

1) Backend endpoints required
- POST /api/terminal/connection_token → returns { secret: string }
- POST /api/terminal/payment_intents → body { amount, currency, capture_method?, description?, metadata?, receipt_email? } → returns { client_secret, id, status }
- POST /api/terminal/payment_intents/:id/capture → returns { success: true }

Alternative base path: If your API is not reverse-proxied under /api, set API_BASE_URL and expose equivalent endpoints under:
- ${API_BASE_URL}/payments/terminal/connection_token
- ${API_BASE_URL}/payments/terminal/payment_intents
- ${API_BASE_URL}/payments/terminal/payment_intents/:id/capture

2) Environment configuration
Expose runtime env vars either via process.env (Node/Electron) or window.__ENV__ (browser):
- API_BASE_URL=https://api.leaperfx.com/v1    # or set window.__ENV__ = { VITE_API_BASE_URL: '...' }
- STRIPE_PUBLISHABLE_KEY=pk_live_xxx (if needed elsewhere)
- STRIPE_TERMINAL_LOCATION=loc_123 (optional)

3) Reader connection (cloud/internet)
- In Test mode, discovery uses the simulator by default.
- In Live mode, discovery uses { discoveryMethod: 'internet' } and lists cloud readers assigned to your Stripe account/location.
- Use Payment Settings → Stripe Terminal to Discover → Connect to a reader, then run a test charge.

4) Payment flow (real SDK)
- Create PaymentIntent on server → collectPaymentMethod(client_secret) → processPayment(paymentIntent)
- If status === requires_capture, the service will call your backend to capture.

5) Simulator
- When the real SDK is not available, a simulator is used so the UI remains functional. This allows development without hardware.

### Data Protection
- No storage of sensitive payment data
- PCI DSS compliance for card processing
- Encrypted communication with terminals
- Secure wallet address validation

### Access Control
- API key management
- Environment-based configuration
- Audit logging for all transactions
- Compliance event tracking

## 📞 Support

For technical support or questions about the payment services:

1. Check the error logs: `paymentErrorHandler.getRecentErrors()`
2. Review system status: `paymentProcessingService.getSystemStatus()`
3. Verify configuration settings
4. Contact the development team with error codes

---

**Built for LeaperFX Store Owner Operating System**
*Comprehensive payment processing with compliance and security*