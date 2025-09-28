// Payment Services - Main Export File
// Centralized exports for the payment processing system

// --- Service Exports ---
export { default as paymentProcessingService } from './paymentProcessingService';
export { default as stripeTerminalService } from './stripeTerminalService';
export { default as cryptoPaymentService } from './cryptoPaymentService';

// --- Component Exports ---
// Payment Settings Components
export { default as PaymentSettings } from './components/PaymentSettings';
export { default as StripeTerminalConfig } from './components/PaymentSettings/StripeTerminalConfig';
export { default as CryptoPaymentConfig } from './components/PaymentSettings/CryptoPaymentConfig';
export { default as PaymentMethodsList } from './components/PaymentSettings/PaymentMethodsList';

// Terminal Manager Components
export { default as TerminalManager } from './components/TerminalManager';
export { default as DeviceStatus } from './components/TerminalManager/DeviceStatus';
export { default as ConnectionWizard } from './components/TerminalManager/ConnectionWizard';

// Crypto Checkout Components
export { default as CryptoCheckout } from './components/CryptoCheckout';
export { default as WalletInput } from './components/CryptoCheckout/WalletInput';
export { default as CryptoRatesDisplay } from './components/CryptoCheckout/CryptoRatesDisplay';

// --- Type Exports ---
export * from './types';

// --- Service-specific Type Exports ---
export type {
  TerminalDevice,
  TerminalPaymentRequest,
  TerminalPaymentResult,
  ConnectionStatus,
  TerminalConfiguration
} from './stripeTerminalService';

export type {
  CryptoRate,
  CryptoPaymentRequest,
  CryptoPaymentResult,
  WalletValidationResult,
  FintracCryptoReport
} from './cryptoPaymentService';

export type {
  UnifiedPaymentRequest,
  UnifiedPaymentResult,
  PaymentSystemStatus
} from './paymentProcessingService';

export type { PaymentAnalytics } from './types';

// --- Convenience Re-exports ---
export {
  PAYMENT_METHODS,
  SUPPORTED_CRYPTOCURRENCIES,
  COMPLIANCE_LEVELS,
  RISK_LEVELS,
  FINTRAC_THRESHOLDS
} from './types';

// --- Service Instance Exports with Types ---
import paymentProcessingService from './paymentProcessingService';
import stripeTerminalService from './stripeTerminalService';
import cryptoPaymentService from './cryptoPaymentService';

export const paymentServices = {
  main: paymentProcessingService,
  terminal: stripeTerminalService,
  crypto: cryptoPaymentService
};

// --- Utility Functions ---

/**
 * Initialize all payment services
 */
export const initializePaymentServices = async (): Promise<{
  success: boolean;
  initializedServices: string[];
  errors: string[];
}> => {
  const initializedServices: string[] = [];
  const errors: string[] = [];

  try {
    const mainServiceInitialized = await paymentProcessingService.initialize();
    if (mainServiceInitialized) {
      initializedServices.push('paymentProcessingService');
    } else {
      errors.push('Failed to initialize payment processing service');
    }

    return {
      success: initializedServices.length > 0,
      initializedServices,
      errors
    };
  } catch (error) {
    errors.push(`Initialization error: ${error}`);
    return {
      success: false,
      initializedServices,
      errors
    };
  }
};

/**
 * Get overall system health
 */
export const getPaymentSystemHealth = () => {
  try {
    const status = paymentProcessingService.getSystemStatus();
    return {
      healthy: status.overall.status === 'fully_operational',
      status: status.overall.status,
      operationalSystems: status.overall.operationalSystems,
      totalSystems: status.overall.totalSystems,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      status: 'error' as const,
      error: `Health check failed: ${error}`,
      operationalSystems: 0,
      totalSystems: 2,
      lastCheck: new Date().toISOString()
    };
  }
};

/**
 * Quick payment processing with error handling
 */
export const processQuickPayment = async (
  amount: number,
  paymentMethod: import('./types').PaymentMethod,
  options: {
    description?: string;
    customerEmail?: string;
    cryptocurrency?: import('./types').SupportedCrypto;
    recipientWallet?: string;
  } = {}
): Promise<import('./types').UnifiedPaymentResult> => {
  try {
    const request: import('./types').UnifiedPaymentRequest = {
      amount,
      paymentMethod,
      description: options.description,
      customerEmail: options.customerEmail,
      cryptocurrency: options.cryptocurrency,
      recipientWallet: options.recipientWallet
    };

    return await paymentProcessingService.processPayment(request);
  } catch (error) {
    return {
      success: false,
      paymentMethod,
      transactionId: `error_${Date.now()}`,
      amount,
      currency: 'CAD',
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: `Payment processing failed: ${error}`,
      errorType: 'system_error'
    };
  }
};

// --- Component Collections ---
import PaymentSettings from './components/PaymentSettings';
import StripeTerminalConfig from './components/PaymentSettings/StripeTerminalConfig';
import CryptoPaymentConfig from './components/PaymentSettings/CryptoPaymentConfig';
import PaymentMethodsList from './components/PaymentSettings/PaymentMethodsList';
import TerminalManager from './components/TerminalManager';
import DeviceStatus from './components/TerminalManager/DeviceStatus';
import ConnectionWizard from './components/TerminalManager/ConnectionWizard';
import CryptoCheckout from './components/CryptoCheckout';
import WalletInput from './components/CryptoCheckout/WalletInput';
import CryptoRatesDisplay from './components/CryptoCheckout/CryptoRatesDisplay';

export const paymentComponents = {
  // Payment Settings
  PaymentSettings,
  StripeTerminalConfig,
  CryptoPaymentConfig,
  PaymentMethodsList,

  // Terminal Manager
  TerminalManager,
  DeviceStatus,
  ConnectionWizard,

  // Crypto Checkout
  CryptoCheckout,
  WalletInput,
  CryptoRatesDisplay
};

// --- Default Export ---
export default {
  services: paymentServices,
  components: paymentComponents,
  initialize: initializePaymentServices,
  getHealth: getPaymentSystemHealth,
  processQuickPayment
};