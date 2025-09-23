// Payment Processing Service - Production Ready
// Orchestrates both traditional and cryptocurrency payments with unified interface

import stripeTerminalService, {
  type TerminalPaymentRequest,
  type TerminalPaymentResult,
  type TerminalDevice,
  type ConnectionStatus
} from './stripeTerminalService';
import cryptoPaymentService, {
  type CryptoPaymentRequest,
  type CryptoPaymentResult,
  type SupportedCrypto,
  type CryptoRate
} from './cryptoPaymentService';
import { cryptoFintracService } from './services/cryptoFintracService';
import { fintracReportingService } from '../../services/fintracReportingService';
// Types for UI-facing services
import type {
  PaymentAnalytics as UIPaymentAnalytics,
  TransactionSummary,
  PaginatedResult,
  FilterOptions,
  SortOptions,
  PaymentStatus as UIPaymentStatus,
  PaymentMethod as UIPaymentMethod
} from './types';

// --- Type Definitions ---
export type PaymentMethod = 'stripe_terminal' | 'cryptocurrency' | 'cash' | 'interac';

export interface UnifiedPaymentRequest {
  amount: number; // Amount in CAD
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: { [key: string]: string };
  customerEmail?: string;
  customerId?: string;

  // Terminal-specific fields
  receiptEmail?: string;
  applicationFeeAmount?: number;

  // Crypto-specific fields
  cryptocurrency?: SupportedCrypto;
  recipientWallet?: string;
  senderWallet?: string;
}

export interface UnifiedPaymentResult {
  success: boolean;
  paymentMethod: PaymentMethod;
  transactionId: string;
  amount: number;
  currency: string;
  timestamp: string;

  // Terminal payment details
  terminalResult?: TerminalPaymentResult;
  paymentMethodDetails?: {
    type: string;
    cardDetails?: {
      last4: string;
      brand: string;
      expMonth: number;
      expYear: number;
    };
  };

  // Crypto payment details
  cryptoResult?: CryptoPaymentResult;
  txHash?: string;
  blockExplorerUrl?: string;
  cryptoAmount?: number;
  exchangeRate?: number;

  // Common fields
  error?: string;
  errorType?: string;
  requiresFintracReport?: boolean;
  complianceLevel?: 'none' | 'enhanced_records' | 'lctr_required';
}

export interface PaymentSystemStatus {
  stripeTerminal: {
    initialized: boolean;
    connectionStatus: ConnectionStatus;
    availableDevices: TerminalDevice[];
    health?: { status: 'healthy' | 'degraded' | 'down'; lastChecked: string };
  };
  cryptocurrency: {
    initialized: boolean;
    supportedCurrencies: Array<{
      symbol: SupportedCrypto;
      name: string;
      priceCAD: number;
      networkFee: number;
    }>;
    lastRateUpdate?: string;
    health?: { status: 'healthy' | 'degraded' | 'down'; lastChecked: string };
  };
  overall: {
    operationalSystems: number;
    totalSystems: number;
    status: 'fully_operational' | 'partial_operational' | 'offline';
    lastHealthCheck?: string;
  };
}

export interface PaymentAnalytics {
  today: {
    totalTransactions: number;
    totalVolume: number;
    terminalPayments: number;
    cryptoPayments: number;
    cashPayments: number;
    failedPayments: number;
  };
  byMethod: Array<{
    method: PaymentMethod;
    count: number;
    volume: number;
    averageAmount: number;
  }>;
  cryptocurrency?: Array<{
    symbol: SupportedCrypto;
    count: number;
    volume: number;
    volumeCAD: number;
  }>;
}

// --- Payment Processing Service Class ---
class PaymentProcessingService {
  private isInitialized = false;
  private paymentHistory: UnifiedPaymentResult[] = [];
  private systemStatus: PaymentSystemStatus = {
    stripeTerminal: {
      initialized: false,
      connectionStatus: { status: 'not_connected' },
      availableDevices: [],
      health: { status: 'down', lastChecked: new Date().toISOString() }
    },
    cryptocurrency: {
      initialized: false,
      supportedCurrencies: [],
      health: { status: 'down', lastChecked: new Date().toISOString() }
    },
    overall: {
      operationalSystems: 0,
      totalSystems: 2,
      status: 'offline',
      lastHealthCheck: new Date().toISOString()
    }
  };

  /**
   * Initialize all payment systems
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initializing Payment Processing Service...');

      // Initialize Stripe Terminal
      const terminalConfig = {
        apiKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_simulated',
        environment: 'test' as const,
        merchantDisplayName: 'LeaperFX Store'
      };

      const terminalInitialized = await stripeTerminalService.initialize(terminalConfig);
      this.systemStatus.stripeTerminal.initialized = terminalInitialized;
      this.systemStatus.stripeTerminal.health = {
        status: terminalInitialized ? 'healthy' : 'down',
        lastChecked: new Date().toISOString()
      };

      if (terminalInitialized) {
        this.systemStatus.overall.operationalSystems++;
        // Discover devices after initialization
        try {
          this.systemStatus.stripeTerminal.availableDevices = await stripeTerminalService.discoverDevices();
          this.systemStatus.stripeTerminal.connectionStatus = stripeTerminalService.getConnectionStatus();
        } catch (error) {
          console.warn('Failed to discover terminal devices:', error);
        }
      }

      // Initialize Crypto Payment Service
      const cryptoInitialized = await cryptoPaymentService.initialize();
      this.systemStatus.cryptocurrency.initialized = cryptoInitialized;
      this.systemStatus.cryptocurrency.health = {
        status: cryptoInitialized ? 'healthy' : 'down',
        lastChecked: new Date().toISOString()
      };

      if (cryptoInitialized) {
        this.systemStatus.overall.operationalSystems++;
        // Load supported currencies with rates
        const supportedCryptos = cryptoPaymentService.getSupportedCryptocurrencies();
        const rates = await cryptoPaymentService.getCryptoRates();

        this.systemStatus.cryptocurrency.supportedCurrencies = supportedCryptos.map(crypto => {
          const rate = rates.find(r => r.symbol === crypto.symbol);
          return {
            symbol: crypto.symbol,
            name: crypto.name,
            priceCAD: rate?.priceCAD || 0,
            networkFee: crypto.networkFeeEstimate
          };
        });
        this.systemStatus.cryptocurrency.lastRateUpdate = new Date().toISOString();
      }

      // Update overall status
      if (this.systemStatus.overall.operationalSystems === this.systemStatus.overall.totalSystems) {
        this.systemStatus.overall.status = 'fully_operational';
      } else if (this.systemStatus.overall.operationalSystems > 0) {
        this.systemStatus.overall.status = 'partial_operational';
      } else {
        this.systemStatus.overall.status = 'offline';
      }
      this.systemStatus.overall.lastHealthCheck = new Date().toISOString();

      this.isInitialized = true;
      console.log(`✅ Payment Processing Service initialized - ${this.systemStatus.overall.operationalSystems}/${this.systemStatus.overall.totalSystems} systems operational`);

      // Load payment history from localStorage
      this.loadPaymentHistory();

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Payment Processing Service:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Process a unified payment request
   */
  async processPayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResult> {
    if (!this.isInitialized) {
      throw new Error('Payment Processing Service not initialized');
    }

    const transactionId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`💳 Processing ${request.paymentMethod} payment: ${transactionId}`);

    try {
      let result: UnifiedPaymentResult;

      switch (request.paymentMethod) {
        case 'stripe_terminal':
          result = await this.processTerminalPayment(request, transactionId);
          break;

        case 'cryptocurrency':
          result = await this.processCryptoPayment(request, transactionId);
          break;

        case 'cash':
          result = await this.processCashPayment(request, transactionId);
          break;

        case 'interac':
          result = await this.processInteracPayment(request, transactionId);
          break;

        default:
          throw new Error(`Unsupported payment method: ${request.paymentMethod}`);
      }

      // Add to payment history
      this.addToHistory(result);

      // Check for FINTRAC compliance requirements
      this.checkComplianceRequirements(result);

      // Broadcast payment completion event
      this.broadcastPaymentEvent('payment_completed', result);

      console.log(`✅ Payment ${transactionId} completed successfully`);
      return result;

    } catch (error) {
      console.error(`❌ Payment ${transactionId} failed:`, error);

      const failedResult: UnifiedPaymentResult = {
        success: false,
        paymentMethod: request.paymentMethod,
        transactionId,
        amount: request.amount,
        currency: 'CAD',
        timestamp: new Date().toISOString(),
        error: `Payment processing failed: ${error}`,
        errorType: 'processing_error'
      };

      this.addToHistory(failedResult);
      this.broadcastPaymentEvent('payment_failed', failedResult);

      return failedResult;
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus(): PaymentSystemStatus {
    return JSON.parse(JSON.stringify(this.systemStatus));
  }

  /**
   * Refresh system status
   */
  async refreshSystemStatus(): Promise<PaymentSystemStatus> {
    try {
      // Update terminal status
      if (this.systemStatus.stripeTerminal.initialized) {
        this.systemStatus.stripeTerminal.connectionStatus = stripeTerminalService.getConnectionStatus();
        this.systemStatus.stripeTerminal.health = {
          status: this.systemStatus.stripeTerminal.connectionStatus.status === 'connected' ? 'healthy' : 'degraded',
          lastChecked: new Date().toISOString()
        };
      } else {
        this.systemStatus.stripeTerminal.health = { status: 'down', lastChecked: new Date().toISOString() };
      }

      // Update crypto rates
      if (this.systemStatus.cryptocurrency.initialized) {
        const rates = await cryptoPaymentService.getCryptoRates(true);
        this.systemStatus.cryptocurrency.supportedCurrencies =
          this.systemStatus.cryptocurrency.supportedCurrencies.map(crypto => {
            const rate = rates.find(r => r.symbol === crypto.symbol);
            return {
              ...crypto,
              priceCAD: rate?.priceCAD || crypto.priceCAD
            };
          });
        this.systemStatus.cryptocurrency.lastRateUpdate = new Date().toISOString();
        this.systemStatus.cryptocurrency.health = { status: 'healthy', lastChecked: new Date().toISOString() };
      } else {
        this.systemStatus.cryptocurrency.health = { status: 'down', lastChecked: new Date().toISOString() };
      }

      // Overall health check timestamp
      this.systemStatus.overall.lastHealthCheck = new Date().toISOString();

      return this.getSystemStatus();
    } catch (error) {
      console.error('Failed to refresh system status:', error);
      return this.getSystemStatus();
    }
  }

  /**
   * Get payment analytics
   */
  // New unified analytics matching ./types PaymentAnalytics
  getAnalytics(): UIPaymentAnalytics {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dayPrefix = startOfDay.toISOString().split('T')[0];

    const todays = this.paymentHistory.filter(p => p.timestamp.startsWith(dayPrefix));
    const successful = todays.filter(p => p.success);
    const failed = todays.filter(p => !p.success);

    const totalVolume = successful.reduce((sum, p) => sum + p.amount, 0);
    const totalCount = successful.length;
    const averageAmount = totalCount > 0 ? totalVolume / totalCount : 0;
    const successRate = todays.length > 0 ? successful.length / todays.length : 1;

    // By method with success rate
    const methodMap = new Map<PaymentMethod, { count: number; volume: number; attempts: number }>();
    todays.forEach(p => {
      const cur = methodMap.get(p.paymentMethod) || { count: 0, volume: 0, attempts: 0 };
      methodMap.set(p.paymentMethod, {
        count: cur.count + (p.success ? 1 : 0),
        volume: cur.volume + (p.success ? p.amount : 0),
        attempts: cur.attempts + 1
      });
    });

    const byMethod = Array.from(methodMap.entries()).map(([method, s]) => ({
      method,
      count: s.count,
      volume: s.volume,
      averageAmount: s.count > 0 ? s.volume / s.count : 0,
      successRate: s.attempts > 0 ? s.count / s.attempts : 1
    }));

    // Crypto breakdown with average rate
    const cryptoMap = new Map<SupportedCrypto, { count: number; volume: number; volumeCAD: number; rateSum: number }>();
    successful
      .filter(p => p.paymentMethod === 'cryptocurrency' && p.cryptoResult)
      .forEach(p => {
        const symbol = p.cryptoResult!.cryptocurrency;
        const cur = cryptoMap.get(symbol) || { count: 0, volume: 0, volumeCAD: 0, rateSum: 0 };
        cryptoMap.set(symbol, {
          count: cur.count + 1,
          volume: cur.volume + (p.cryptoAmount || 0),
          volumeCAD: cur.volumeCAD + p.amount,
          rateSum: cur.rateSum + (p.exchangeRate || p.cryptoResult!.rate || 0)
        });
      });

    const cryptocurrency = Array.from(cryptoMap.entries()).map(([symbol, stats]) => ({
      symbol,
      count: stats.count,
      volume: stats.volume,
      volumeCAD: stats.volumeCAD,
      averageRate: stats.count > 0 ? stats.rateSum / stats.count : 0
    }));

    // Compliance summary (best effort from stored results)
    const lctrRequired = successful.filter(p => p.complianceLevel === 'lctr_required').length;
    const enhancedRecordsRequired = successful.filter(p => p.complianceLevel === 'enhanced_records').length;
    const totalReportsRequired = successful.filter(p => p.requiresFintracReport).length;

    const analytics: UIPaymentAnalytics = {
      period: {
        start: startOfDay.toISOString(),
        end: new Date().toISOString(),
        type: 'day'
      },
      summary: {
        totalTransactions: totalCount,
        totalVolume,
        successRate,
        averageAmount,
        failedPayments: failed.length
      },
      byMethod,
      cryptocurrency: cryptocurrency.length > 0 ? cryptocurrency : undefined,
      compliance: {
        totalReportsRequired,
        lctrRequired,
        enhancedRecordsRequired,
        reportsSubmitted: 0
      }
    };

    return analytics;
  }

  // Backward-compatible alias
  getPaymentAnalytics(): UIPaymentAnalytics {
    return this.getAnalytics();
  }

  /**
   * Get payment history
   * - If called with a number (or no arg): returns last N raw results (backward compatible)
   * - If called with options object: returns paginated TransactionSummary per ./types
   */
  getPaymentHistory(arg?: number | (FilterOptions & SortOptions)):
    UnifiedPaymentResult[] | PaginatedResult<TransactionSummary> {
    if (typeof arg === 'number' || typeof arg === 'undefined') {
      const limit = typeof arg === 'number' ? arg : 50;
      return this.paymentHistory
        .slice(-limit)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Options-based paginated result
    const options = arg as FilterOptions & SortOptions;

    // Filter
    let items = this.paymentHistory.slice();
    if (options.startDate) {
      items = items.filter(p => new Date(p.timestamp) >= new Date(options.startDate!));
    }
    if (options.endDate) {
      items = items.filter(p => new Date(p.timestamp) <= new Date(options.endDate!));
    }
    if (options.paymentMethod) {
      items = items.filter(p => p.paymentMethod === options.paymentMethod);
    }
    if (options.status) {
      items = items.filter(p => (p.success ? 'completed' : 'failed') === options.status);
    }
    if (typeof options.minAmount === 'number') {
      items = items.filter(p => p.amount >= options.minAmount!);
    }
    if (typeof options.maxAmount === 'number') {
      items = items.filter(p => p.amount <= options.maxAmount!);
    }
    if (typeof options.requiresCompliance === 'boolean') {
      items = items.filter(p => !!p.requiresFintracReport === options.requiresCompliance);
    }

    // Sort
    const field = options.field || 'timestamp';
    const direction = options.direction || 'desc';
    items.sort((a, b) => {
      const av = field === 'timestamp' ? new Date(a.timestamp).getTime() :
                 field === 'amount' ? a.amount :
                 field === 'status' ? (a.success ? 1 : 0) :
                 field === 'paymentMethod' ? a.paymentMethod.localeCompare(b.paymentMethod) : 0;
      const bv = field === 'timestamp' ? new Date(b.timestamp).getTime() :
                 field === 'amount' ? b.amount :
                 field === 'status' ? (b.success ? 1 : 0) :
                 field === 'paymentMethod' ? b.paymentMethod.localeCompare(a.paymentMethod) : 0;
      return direction === 'asc' ? av - bv : bv - av;
    });

    // Pagination defaults
    const pageSize = (options as any).pageSize || 50;
    const page = (options as any).page || 1;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    // Map to TransactionSummary
    const mapped: TransactionSummary[] = paged.map(p => ({
      id: p.transactionId,
      timestamp: p.timestamp,
      amount: p.amount,
      paymentMethod: p.paymentMethod as UIPaymentMethod,
      status: (p.success ? 'completed' : 'failed') as UIPaymentStatus,
      customerEmail: undefined,
      description: undefined,
      requiresCompliance: !!p.requiresFintracReport
    }));

    const result: PaginatedResult<TransactionSummary> = {
      items: mapped,
      totalCount: items.length,
      page,
      pageSize,
      hasNextPage: start + pageSize < items.length,
      hasPreviousPage: page > 1
    };

    return result;
  }

  /**
   * Connect to terminal device
   */
  async connectTerminalDevice(deviceId: string): Promise<boolean> {
    if (!this.systemStatus.stripeTerminal.initialized) {
      throw new Error('Stripe Terminal not initialized');
    }

    const success = await stripeTerminalService.connectToDevice(deviceId);
    this.systemStatus.stripeTerminal.connectionStatus = stripeTerminalService.getConnectionStatus();

    return success;
  }

  /**
   * Disconnect terminal device
   */
  async disconnectTerminalDevice(): Promise<void> {
    if (this.systemStatus.stripeTerminal.initialized) {
      await stripeTerminalService.disconnect();
      this.systemStatus.stripeTerminal.connectionStatus = stripeTerminalService.getConnectionStatus();
    }
  }

  // --- Private Payment Processing Methods ---

  private async processTerminalPayment(request: UnifiedPaymentRequest, transactionId: string): Promise<UnifiedPaymentResult> {
    if (!this.systemStatus.stripeTerminal.initialized) {
      throw new Error('Stripe Terminal not initialized');
    }

    const terminalRequest: TerminalPaymentRequest = {
      amount: Math.round(request.amount * 100), // Convert to cents
      currency: 'cad',
      description: request.description,
      metadata: request.metadata,
      receiptEmail: request.receiptEmail
    };

    const terminalResult = await stripeTerminalService.processPayment(terminalRequest);

    return {
      success: terminalResult.success,
      paymentMethod: 'stripe_terminal',
      transactionId,
      amount: request.amount,
      currency: 'CAD',
      timestamp: new Date().toISOString(),
      terminalResult,
      paymentMethodDetails: terminalResult.paymentMethod ? {
        type: terminalResult.paymentMethod.type,
        cardDetails: terminalResult.paymentMethod.cardDetails
      } : undefined,
      error: terminalResult.error,
      errorType: terminalResult.errorType,
      requiresFintracReport: request.amount >= 10000,
      complianceLevel: this.getComplianceLevel(request.amount)
    };
  }

  private async processCryptoPayment(request: UnifiedPaymentRequest, transactionId: string): Promise<UnifiedPaymentResult> {
    if (!this.systemStatus.cryptocurrency.initialized) {
      throw new Error('Cryptocurrency service not initialized');
    }

    if (!request.cryptocurrency || !request.recipientWallet) {
      throw new Error('Cryptocurrency and recipient wallet required for crypto payments');
    }

    const cryptoRequest: CryptoPaymentRequest = {
      amount: request.amount,
      cryptocurrency: request.cryptocurrency,
      recipientWallet: request.recipientWallet,
      senderWallet: request.senderWallet,
      description: request.description,
      metadata: request.metadata,
      customerEmail: request.customerEmail,
      customerId: request.customerId
    };

    const cryptoResult = await cryptoPaymentService.processPayment(cryptoRequest);

    const result: UnifiedPaymentResult = {
      success: cryptoResult.success,
      paymentMethod: 'cryptocurrency',
      transactionId,
      amount: request.amount,
      currency: 'CAD',
      timestamp: new Date().toISOString(),
      cryptoResult,
      txHash: cryptoResult.txHash,
      blockExplorerUrl: cryptoResult.blockExplorerUrl,
      cryptoAmount: cryptoResult.amountCrypto,
      exchangeRate: cryptoResult.rate,
      error: cryptoResult.error,
      errorType: cryptoResult.errorType,
      requiresFintracReport: request.amount >= 1000, // VCTR threshold is $1,000 CAD
      complianceLevel: this.getCryptoComplianceLevel(request.amount)
    };

    // Process FINTRAC reporting for successful crypto transactions
    if (cryptoResult.success && result.requiresFintracReport) {
      try {
        await this.processCryptoFintracReporting(result, request);
      } catch (error) {
        console.error('Error processing crypto FINTRAC reporting:', error);
        // Don't fail the payment due to reporting issues
      }
    }

    return result;
  }

  private async processCashPayment(request: UnifiedPaymentRequest, transactionId: string): Promise<UnifiedPaymentResult> {
    // Simulate cash payment processing
    console.log('💵 Processing cash payment...');
    await this.delay(1000);

    return {
      success: true,
      paymentMethod: 'cash',
      transactionId,
      amount: request.amount,
      currency: 'CAD',
      timestamp: new Date().toISOString(),
      requiresFintracReport: request.amount >= 10000,
      complianceLevel: this.getComplianceLevel(request.amount)
    };
  }

  private async processInteracPayment(request: UnifiedPaymentRequest, transactionId: string): Promise<UnifiedPaymentResult> {
    // Simulate Interac payment processing
    console.log('🏧 Processing Interac payment...');
    await this.delay(2000);

    // Simulate 98% success rate
    const success = Math.random() > 0.02;

    return {
      success,
      paymentMethod: 'interac',
      transactionId,
      amount: request.amount,
      currency: 'CAD',
      timestamp: new Date().toISOString(),
      error: success ? undefined : 'Interac transaction declined',
      errorType: success ? undefined : 'card_declined',
      requiresFintracReport: request.amount >= 10000,
      complianceLevel: this.getComplianceLevel(request.amount)
    };
  }

  private getComplianceLevel(amount: number): UnifiedPaymentResult['complianceLevel'] {
    if (amount >= 10000) return 'lctr_required';
    if (amount >= 3000) return 'enhanced_records';
    return 'none';
  }

  private getCryptoComplianceLevel(amount: number): UnifiedPaymentResult['complianceLevel'] {
    if (amount >= 10000) return 'lctr_required'; // LVCTR required
    if (amount >= 1000) return 'enhanced_records'; // VCTR required
    return 'none';
  }

  /**
   * Process FINTRAC reporting for crypto transactions
   */
  private async processCryptoFintracReporting(result: UnifiedPaymentResult, request: UnifiedPaymentRequest): Promise<void> {
    if (!result.cryptoResult || !request.cryptocurrency) {
      return;
    }

    try {
      // Auto-trigger crypto FINTRAC reports
      const reportingResult = await cryptoFintracService.processCompletedCryptoTransaction(result);

      console.log('📋 Crypto FINTRAC reporting processed:', {
        transactionId: result.transactionId,
        reportsGenerated: reportingResult.reportsGenerated,
        immediateAction: reportingResult.immediateAction,
        deadline: reportingResult.deadline
      });

      // Broadcast compliance event for real-time alerts
      this.broadcastComplianceEvent(result, reportingResult);

      // Store compliance tracking
      this.storeComplianceRecord(result, reportingResult);

    } catch (error) {
      console.error('Crypto FINTRAC reporting failed:', error);

      // Create manual review alert
      this.createManualReviewAlert(result, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Broadcast compliance events for real-time monitoring
   */
  private broadcastComplianceEvent(result: UnifiedPaymentResult, reportingResult: any): void {
    window.dispatchEvent(new CustomEvent('cryptoComplianceProcessed', {
      detail: {
        transactionId: result.transactionId,
        amount: result.amount,
        cryptocurrency: result.cryptoResult?.cryptocurrency,
        reportsGenerated: reportingResult.reportsGenerated,
        immediateAction: reportingResult.immediateAction,
        deadline: reportingResult.deadline,
        timestamp: new Date().toISOString()
      }
    }));

    // Alert for overdue or immediate action required
    if (reportingResult.immediateAction) {
      window.dispatchEvent(new CustomEvent('complianceAlertCritical', {
        detail: {
          type: 'crypto_immediate_action',
          transactionId: result.transactionId,
          message: `Crypto transaction ${result.transactionId} requires immediate FINTRAC action`,
          severity: 'critical'
        }
      }));
    }
  }

  /**
   * Store compliance record for audit trail
   */
  private storeComplianceRecord(result: UnifiedPaymentResult, reportingResult: any): void {
    try {
      const complianceRecord = {
        transactionId: result.transactionId,
        paymentMethod: result.paymentMethod,
        amount: result.amount,
        cryptocurrency: result.cryptoResult?.cryptocurrency,
        txHash: result.cryptoResult?.txHash,
        reportsGenerated: reportingResult.reportsGenerated,
        immediateAction: reportingResult.immediateAction,
        deadline: reportingResult.deadline,
        processedAt: new Date().toISOString(),
        complianceLevel: result.complianceLevel
      };

      // Store in localStorage for local compliance tracking
      const existingRecords = JSON.parse(localStorage.getItem('complianceRecords') || '[]');
      existingRecords.unshift(complianceRecord);

      // Keep only last 500 records
      if (existingRecords.length > 500) {
        existingRecords.splice(500);
      }

      localStorage.setItem('complianceRecords', JSON.stringify(existingRecords));
    } catch (error) {
      console.error('Failed to store compliance record:', error);
    }
  }

  /**
   * Create alert for manual review when automatic reporting fails
   */
  private createManualReviewAlert(result: UnifiedPaymentResult, error: string): void {
    const alert = {
      id: `manual-review-${result.transactionId}`,
      type: 'manual_review_required',
      severity: 'high',
      transactionId: result.transactionId,
      amount: result.amount,
      cryptocurrency: result.cryptoResult?.cryptocurrency,
      error,
      createdAt: new Date().toISOString(),
      acknowledged: false
    };

    // Store alert
    const existingAlerts = JSON.parse(localStorage.getItem('complianceAlerts') || '[]');
    existingAlerts.unshift(alert);
    localStorage.setItem('complianceAlerts', JSON.stringify(existingAlerts));

    // Broadcast alert
    window.dispatchEvent(new CustomEvent('complianceAlertCreated', {
      detail: alert
    }));
  }

  private checkComplianceRequirements(result: UnifiedPaymentResult): void {
    if (result.requiresFintracReport && result.success) {
      // Store compliance requirement
      localStorage.setItem('pendingCompliancePayment', JSON.stringify({
        transactionId: result.transactionId,
        amount: result.amount,
        paymentMethod: result.paymentMethod,
        complianceLevel: result.complianceLevel,
        timestamp: result.timestamp
      }));

      // Dispatch compliance event
      window.dispatchEvent(new CustomEvent('paymentComplianceRequired', {
        detail: {
          transactionId: result.transactionId,
          amount: result.amount,
          complianceLevel: result.complianceLevel
        }
      }));
    }
  }

  private addToHistory(result: UnifiedPaymentResult): void {
    this.paymentHistory.push(result);

    // Keep only last 1000 transactions in memory
    if (this.paymentHistory.length > 1000) {
      this.paymentHistory = this.paymentHistory.slice(-1000);
    }

    // Save to localStorage
    this.savePaymentHistory();
  }

  private loadPaymentHistory(): void {
    try {
      const stored = localStorage.getItem('paymentHistory');
      if (stored) {
        this.paymentHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load payment history:', error);
    }
  }

  private savePaymentHistory(): void {
    try {
      // Save only last 100 transactions to localStorage
      const toSave = this.paymentHistory.slice(-100);
      localStorage.setItem('paymentHistory', JSON.stringify(toSave));
    } catch (error) {
      console.warn('Failed to save payment history:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private broadcastPaymentEvent(eventType: string, result: UnifiedPaymentResult): void {
    try {
      // Broadcast to window event system
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(eventType, {
          detail: {
            timestamp: new Date().toISOString(),
            result
          }
        }));
      }

      // Store latest event
      localStorage.setItem('lastPaymentEvent', JSON.stringify({
        type: eventType,
        timestamp: new Date().toISOString(),
        result
      }));
    } catch (error) {
      console.warn('Failed to broadcast payment event:', error);
    }
  }
}

// Export singleton instance
const paymentProcessingService = new PaymentProcessingService();
export default paymentProcessingService;