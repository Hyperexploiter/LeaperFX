// Payment System Types - Comprehensive TypeScript Interfaces
// Centralized type definitions for the payment processing system

// --- Core Payment Types ---
export type PaymentMethod = 'stripe_terminal' | 'cryptocurrency' | 'cash' | 'interac';
export type SupportedCrypto = 'BTC' | 'ETH' | 'SOL' | 'AVAX' | 'USDC';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'canceled' | 'refunded';
export type ComplianceLevel = 'none' | 'enhanced_records' | 'lctr_required';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// --- Error Types ---
export type PaymentErrorType =
  | 'validation_error'
  | 'network_error'
  | 'card_declined'
  | 'processing_error'
  | 'insufficient_funds'
  | 'invalid_wallet'
  | 'timeout'
  | 'canceled'
  | 'compliance_error'
  | 'system_error';

// --- Terminal Device Types ---
export type DeviceType = 'verifone_P400' | 'bbpos_wisepad3' | 'simulated_wisepos_e';
export type DeviceStatus = 'online' | 'offline' | 'busy' | 'needs_reboot';
export type ConnectionState = 'not_connected' | 'connecting' | 'connected' | 'reconnecting';

export interface TerminalDevice {
  id: string;
  label: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  batteryLevel?: number;
  serialNumber: string;
  softwareVersion: string;
  ipAddress?: string;
  lastSeen: string;
  capabilities?: {
    contactless: boolean;
    chip: boolean;
    magstripe: boolean;
    pinEntry: boolean;
  };
}

export interface ConnectionStatus {
  status: ConnectionState;
  device?: TerminalDevice;
  lastConnected?: string;
  connectionError?: string;
  connectionAttempts?: number;
}

// --- Payment Intent and Request Types ---
export interface BasePaymentRequest {
  amount: number; // Amount in CAD
  description?: string;
  metadata?: { [key: string]: string };
  customerEmail?: string;
  customerId?: string;
}

export interface TerminalPaymentRequest extends BasePaymentRequest {
  currency: string;
  receiptEmail?: string;
  applicationFeeAmount?: number;
  onBehalfOf?: string;
  captureMethod?: 'automatic' | 'manual';
  confirmationMethod?: 'automatic' | 'manual';
}

export interface CryptoPaymentRequest extends BasePaymentRequest {
  cryptocurrency: SupportedCrypto;
  recipientWallet: string;
  senderWallet?: string;
  networkFeePreference?: 'low' | 'medium' | 'high';
  confirmationThreshold?: number; // Required confirmations
}

export interface UnifiedPaymentRequest extends BasePaymentRequest {
  paymentMethod: PaymentMethod;

  // Terminal-specific fields
  receiptEmail?: string;
  applicationFeeAmount?: string;

  // Crypto-specific fields
  cryptocurrency?: SupportedCrypto;
  recipientWallet?: string;
  senderWallet?: string;
  networkFeePreference?: 'low' | 'medium' | 'high';
}

// --- Payment Result Types ---
export interface PaymentMethodDetails {
  id: string;
  type: string;
  cardDetails?: {
    last4: string;
    brand: string;
    expMonth: number;
    expYear: number;
    network?: string;
    funding?: 'credit' | 'debit' | 'prepaid' | 'unknown';
    country?: string;
  };
  interacDetails?: {
    last4: string;
    type: 'debit';
    network: 'interac';
  };
}

export interface TerminalPaymentResult {
  success: boolean;
  paymentIntent?: {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    metadata?: { [key: string]: string };
    description?: string;
    receiptEmail?: string;
  };
  paymentMethod?: PaymentMethodDetails;
  error?: string;
  errorType?: PaymentErrorType;
  receiptUrl?: string;
  refundable?: boolean;
}

export interface CryptoPaymentResult {
  success: boolean;
  transactionId?: string;
  txHash?: string;
  amountCrypto?: number;
  amountCAD: number;
  cryptocurrency: SupportedCrypto;
  rate: number;
  networkFee?: number;
  confirmations?: number;
  error?: string;
  errorType?: PaymentErrorType;
  confirmationUrl?: string;
  blockExplorerUrl?: string;
  estimatedConfirmationTime?: number; // in minutes
}

export interface UnifiedPaymentResult {
  success: boolean;
  paymentMethod: PaymentMethod;
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: PaymentStatus;

  // Method-specific results
  terminalResult?: TerminalPaymentResult;
  cryptoResult?: CryptoPaymentResult;

  // Unified payment method details
  paymentMethodDetails?: PaymentMethodDetails;

  // Crypto-specific unified fields
  txHash?: string;
  blockExplorerUrl?: string;
  cryptoAmount?: number;
  exchangeRate?: number;

  // Error handling
  error?: string;
  errorType?: PaymentErrorType;

  // Compliance and reporting
  requiresFintracReport?: boolean;
  complianceLevel?: ComplianceLevel;
  riskLevel?: RiskLevel;

  // Additional metadata
  receiptUrl?: string;
  refundable?: boolean;
  refundedAmount?: number;
  refundHistory?: Array<{
    amount: number;
    timestamp: string;
    reason?: string;
  }>;
}

// --- Cryptocurrency Types ---
export interface CryptoRate {
  symbol: SupportedCrypto;
  priceCAD: number;
  priceUSD: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
  source: string;
  confidence?: number; // 0-100 confidence score
}

export interface CryptoWallet {
  address: string;
  type: SupportedCrypto;
  label?: string;
  balance?: number;
  isValid: boolean;
  network?: 'mainnet' | 'testnet';
  format?: 'legacy' | 'segwit' | 'bech32' | 'evm' | 'solana' | 'avalanche';
}

export interface WalletValidationResult {
  isValid: boolean;
  format: 'legacy' | 'segwit' | 'bech32' | 'evm' | 'solana' | 'avalanche' | 'unknown';
  network: 'mainnet' | 'testnet' | 'unknown';
  cryptocurrency: SupportedCrypto | 'unknown';
  error?: string;
  confidence?: number;
}

export interface CryptoTransaction {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'not_found';
  confirmations: number;
  requiredConfirmations: number;
  blockHeight?: number;
  timestamp?: string;
  networkFee: number;
  fromAddress?: string;
  toAddress: string;
  amount: number;
  cryptocurrency: SupportedCrypto;
}

// --- System Status Types ---
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: string;
  responseTime?: number;
  errorRate?: number;
  uptime?: number;
}

export interface PaymentSystemStatus {
  stripeTerminal: {
    initialized: boolean;
    connectionStatus: ConnectionStatus;
    availableDevices: TerminalDevice[];
    health: SystemHealth;
  };
  cryptocurrency: {
    initialized: boolean;
    supportedCurrencies: Array<{
      symbol: SupportedCrypto;
      name: string;
      priceCAD: number;
      networkFee: number;
      health: SystemHealth;
    }>;
    lastRateUpdate?: string;
    health: SystemHealth;
  };
  overall: {
    operationalSystems: number;
    totalSystems: number;
    status: 'fully_operational' | 'partial_operational' | 'offline';
    lastHealthCheck: string;
  };
}

// --- Analytics and Reporting Types ---
export interface PaymentAnalytics {
  period: {
    start: string;
    end: string;
    type: 'day' | 'week' | 'month' | 'year';
  };
  summary: {
    totalTransactions: number;
    totalVolume: number;
    successRate: number;
    averageAmount: number;
    failedPayments: number;
  };
  byMethod: Array<{
    method: PaymentMethod;
    count: number;
    volume: number;
    averageAmount: number;
    successRate: number;
  }>;
  byTimeOfDay?: Array<{
    hour: number;
    count: number;
    volume: number;
  }>;
  cryptocurrency?: Array<{
    symbol: SupportedCrypto;
    count: number;
    volume: number;
    volumeCAD: number;
    averageRate: number;
  }>;
  compliance: {
    totalReportsRequired: number;
    lctrRequired: number;
    enhancedRecordsRequired: number;
    reportsSubmitted: number;
  };
}

export interface TransactionSummary {
  id: string;
  timestamp: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  customerEmail?: string;
  description?: string;
  requiresCompliance: boolean;
}

// --- FINTRAC and Compliance Types ---
export interface FintracReport {
  id: string;
  transactionId: string;
  reportType: 'LCTR' | 'CTR' | 'STR' | 'EFT';
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  timestamp: string;
  customerId?: string;
  customerDetails?: {
    name: string;
    address: string;
    identification: {
      type: string;
      number: string;
    };
  };
  riskLevel: RiskLevel;
  riskFactors: string[];
  reportedToFintrac: boolean;
  reportSubmissionDate?: string;
  submittedBy?: string;

  // Crypto-specific fields
  cryptocurrency?: SupportedCrypto;
  senderWallet?: string;
  recipientWallet?: string;
  txHash?: string;
}

export interface ComplianceCheck {
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  requiresLCTR: boolean;
  requiresEnhancedRecords: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  automaticFlags: string[];
  manualReviewRequired: boolean;
  deadline?: string;
}

// --- Configuration Types ---
export interface TerminalConfiguration {
  apiKey: string;
  environment: 'test' | 'live';
  merchantDisplayName: string;
  locationId?: string;
  autoConnect?: boolean;
  defaultReceiptEmail?: string;
}

export interface CryptoConfiguration {
  supportedCurrencies: SupportedCrypto[];
  rateUpdateInterval: number;
  confirmationThresholds: Record<SupportedCrypto, number>;
  networkFeePreferences: Record<SupportedCrypto, {
    low: number;
    medium: number;
    high: number;
  }>;
  walletValidationLevel: 'basic' | 'extended';
}

export interface PaymentSystemConfiguration {
  terminal: TerminalConfiguration;
  crypto: CryptoConfiguration;
  compliance: {
    lctrThreshold: number;
    enhancedRecordsThreshold: number;
    autoSubmitReports: boolean;
    reportingEmail: string;
  };
  analytics: {
    retentionPeriod: number; // days
    enableDetailedTracking: boolean;
    exportFormat: 'json' | 'csv' | 'pdf';
  };
}

// --- Event Types ---
export interface PaymentEvent {
  type: 'payment_started' | 'payment_completed' | 'payment_failed' | 'payment_canceled' |
        'terminal_connected' | 'terminal_disconnected' | 'rate_updated' | 'compliance_required';
  timestamp: string;
  data: any;
  source: 'terminal' | 'crypto' | 'system';
}

export interface PaymentEventHandler {
  (event: PaymentEvent): void;
}

// --- Utility Types ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  minAmount?: number;
  maxAmount?: number;
  customerId?: string;
  requiresCompliance?: boolean;
}

export interface SortOptions {
  field: 'timestamp' | 'amount' | 'status' | 'paymentMethod';
  direction: 'asc' | 'desc';
}

// --- Service Interface Types ---
export interface PaymentService {
  initialize(): Promise<boolean>;
  processPayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResult>;
  getSystemStatus(): PaymentSystemStatus;
  getAnalytics(): PaymentAnalytics;
  getPaymentHistory(options?: FilterOptions & SortOptions): PaginatedResult<TransactionSummary>;
}

export interface TerminalService {
  initialize(config: TerminalConfiguration): Promise<boolean>;
  discoverDevices(): Promise<TerminalDevice[]>;
  connectToDevice(deviceId: string): Promise<boolean>;
  disconnect(): Promise<void>;
  processPayment(request: TerminalPaymentRequest): Promise<TerminalPaymentResult>;
  getConnectionStatus(): ConnectionStatus;
}

export interface CryptoService {
  initialize(): Promise<boolean>;
  getCryptoRates(forceRefresh?: boolean): Promise<CryptoRate[]>;
  validateWalletAddress(address: string, crypto?: SupportedCrypto): WalletValidationResult;
  processPayment(request: CryptoPaymentRequest): Promise<CryptoPaymentResult>;
  checkTransactionStatus(txHash: string, crypto: SupportedCrypto): Promise<CryptoTransaction>;
}

// --- Export all types for easy imports ---
export type {
  // Re-export key types for convenience
  PaymentMethod,
  SupportedCrypto,
  PaymentStatus,
  PaymentErrorType,
  ComplianceLevel,
  RiskLevel
};

// --- Constants ---
export const PAYMENT_METHODS: PaymentMethod[] = ['stripe_terminal', 'cryptocurrency', 'cash', 'interac'];
export const SUPPORTED_CRYPTOCURRENCIES: SupportedCrypto[] = ['BTC', 'ETH', 'SOL', 'AVAX', 'USDC'];
export const COMPLIANCE_LEVELS: ComplianceLevel[] = ['none', 'enhanced_records', 'lctr_required'];
export const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

// FINTRAC Thresholds (in CAD)
export const FINTRAC_THRESHOLDS = {
  ENHANCED_RECORDS: 3000,
  LCTR_REQUIRED: 10000,
  LARGE_CASH: 10000,
  SUSPICIOUS_THRESHOLD: 10000
} as const;