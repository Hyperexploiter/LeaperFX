# Payment UI Components

This directory contains the React UI components for the LeaperFX payment system, providing comprehensive interfaces for payment processing, terminal management, and cryptocurrency transactions.

## Component Structure

### PaymentSettings/
Main payment configuration and settings management components.

- **`index.tsx`** - Main payment settings container with tabbed interface
- **`StripeTerminalConfig.tsx`** - Stripe Terminal device configuration and management
- **`CryptoPaymentConfig.tsx`** - Cryptocurrency payment settings and rate management
- **`PaymentMethodsList.tsx`** - Payment method configuration and analytics

### TerminalManager/
Terminal device management and connection components.

- **`index.tsx`** - Terminal management dashboard with device overview
- **`DeviceStatus.tsx`** - Real-time device status display and controls
- **`ConnectionWizard.tsx`** - Step-by-step terminal connection setup

### CryptoCheckout/
Cryptocurrency payment checkout flow components.

- **`index.tsx`** - Complete crypto payment checkout flow
- **`WalletInput.tsx`** - Wallet address input with validation
- **`CryptoRatesDisplay.tsx`** - Real-time cryptocurrency rates display

## Usage

### Import Individual Components
```typescript
import { PaymentSettings, TerminalManager, CryptoCheckout } from '@/features/payments';
```

### Import Component Collections
```typescript
import { paymentComponents } from '@/features/payments';
const { PaymentSettings, TerminalManager, CryptoCheckout } = paymentComponents;
```

### Import with Services
```typescript
import paymentSystem from '@/features/payments';
const { components, services } = paymentSystem;
```

## Component Features

### PaymentSettings
- **Multi-tab interface**: Overview, Terminal, Crypto, Methods
- **System status monitoring**: Real-time health checks
- **Configuration management**: Unified settings interface
- **Analytics integration**: Payment method performance metrics

### TerminalManager
- **Device discovery**: Automatic terminal detection
- **Connection management**: Connect, disconnect, reconnect
- **Real-time monitoring**: Device status, battery, connectivity
- **Setup wizard**: Guided terminal configuration

### CryptoCheckout
- **Multi-step checkout**: Currency selection, wallet input, confirmation
- **Wallet validation**: Real-time address validation
- **Rate integration**: Live cryptocurrency pricing
- **Security features**: Address verification, transaction warnings

## Design Patterns

### Consistent UI/UX
- **Tailwind CSS**: Utility-first styling approach
- **Lucide React**: Consistent iconography
- **Responsive design**: Mobile-first layout
- **Accessibility**: WCAG compliant interfaces

### State Management
- **Local state**: React hooks for component state
- **Service integration**: Direct service calls for data
- **Error handling**: Comprehensive error boundaries
- **Loading states**: User feedback during operations

### Validation & Security
- **Input validation**: Real-time field validation
- **Wallet verification**: Cryptocurrency address validation
- **Error messaging**: Clear, actionable error messages
- **Security notices**: User warnings for critical operations

## Integration with Services

Components seamlessly integrate with the payment services:

```typescript
import { paymentServices } from '@/features/payments';

// Terminal operations
const devices = await paymentServices.terminal.discoverDevices();
const connected = await paymentServices.terminal.connectToDevice(deviceId);

// Crypto operations
const rates = await paymentServices.crypto.getCryptoRates();
const validation = paymentServices.crypto.validateWalletAddress(address);

// Payment processing
const result = await paymentServices.main.processPayment(request);
```

## Styling & Theming

Components follow the established design system:

- **Color scheme**: Blue primary, semantic colors for status
- **Typography**: Consistent font weights and sizes
- **Spacing**: 4px grid system
- **Shadows**: Subtle elevation for cards and modals
- **Animations**: Smooth transitions and loading states

## Future Enhancements

- **WebSocket integration**: Real-time updates for device status
- **QR code scanning**: Camera integration for wallet addresses
- **Biometric authentication**: Enhanced security for high-value transactions
- **Multi-language support**: Internationalization ready
- **Theme customization**: Light/dark mode support

## Dependencies

- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+
- Lucide React 0.200+
- Payment Services (local)