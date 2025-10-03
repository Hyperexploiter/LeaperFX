// Payment Error Handler - Comprehensive Error Management
// Centralized error handling for payment processing system

import type { PaymentErrorType, PaymentMethod, SupportedCrypto } from './types';

// --- Error Class Definitions ---
export class PaymentError extends Error {
  public readonly type: PaymentErrorType;
  public readonly code: string;
  public readonly recoverable: boolean;
  public readonly userMessage: string;
  public readonly technicalDetails?: any;
  public readonly timestamp: string;

  constructor(
    type: PaymentErrorType,
    message: string,
    options: {
      code?: string;
      recoverable?: boolean;
      userMessage?: string;
      technicalDetails?: any;
    } = {}
  ) {
    super(message);
    this.name = 'PaymentError';
    this.type = type;
    this.code = options.code || this.generateErrorCode(type);
    this.recoverable = options.recoverable ?? this.isRecoverable(type);
    this.userMessage = options.userMessage || this.generateUserMessage(type);
    this.technicalDetails = options.technicalDetails;
    this.timestamp = new Date().toISOString();
  }

  private generateErrorCode(type: PaymentErrorType): string {
    const codes: Record<PaymentErrorType, string> = {
      validation_error: 'PAY_VAL_001',
      network_error: 'PAY_NET_001',
      card_declined: 'PAY_DEC_001',
      processing_error: 'PAY_PROC_001',
      insufficient_funds: 'PAY_FUND_001',
      invalid_wallet: 'PAY_WAL_001',
      timeout: 'PAY_TIME_001',
      canceled: 'PAY_CANC_001',
      compliance_error: 'PAY_COMP_001',
      system_error: 'PAY_SYS_001'
    };
    return codes[type] || 'PAY_UNK_001';
  }

  private isRecoverable(type: PaymentErrorType): boolean {
    const recoverableTypes: PaymentErrorType[] = [
      'network_error',
      'timeout',
      'processing_error',
      'system_error'
    ];
    return recoverableTypes.includes(type);
  }

  private generateUserMessage(type: PaymentErrorType): string {
    const messages: Record<PaymentErrorType, string> = {
      validation_error: 'Please check your payment details and try again.',
      network_error: 'Connection problem. Please check your internet and try again.',
      card_declined: 'Your payment was declined. Please try a different payment method.',
      processing_error: 'Payment processing failed. Please try again in a moment.',
      insufficient_funds: 'Insufficient funds available for this transaction.',
      invalid_wallet: 'The wallet address provided is not valid.',
      timeout: 'Payment timed out. Please try again.',
      canceled: 'Payment was canceled.',
      compliance_error: 'This transaction requires additional compliance verification.',
      system_error: 'A system error occurred. Please try again or contact support.'
    };
    return messages[type] || 'An unexpected error occurred.';
  }

  public toJSON() {
    return {
      name: this.name,
      type: this.type,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      recoverable: this.recoverable,
      technicalDetails: this.technicalDetails,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class TerminalError extends PaymentError {
  public readonly deviceId?: string;
  public readonly deviceType?: string;

  constructor(
    type: PaymentErrorType,
    message: string,
    deviceInfo?: { deviceId?: string; deviceType?: string },
    options: Parameters<typeof PaymentError.prototype.constructor>[2] = {}
  ) {
    super(type, message, {
      ...options,
      code: options.code || `TERM_${type.toUpperCase()}_001`
    });
    this.name = 'TerminalError';
    this.deviceId = deviceInfo?.deviceId;
    this.deviceType = deviceInfo?.deviceType;
  }
}

export class CryptoError extends PaymentError {
  public readonly cryptocurrency?: SupportedCrypto;
  public readonly walletAddress?: string;
  public readonly txHash?: string;

  constructor(
    type: PaymentErrorType,
    message: string,
    cryptoInfo?: {
      cryptocurrency?: SupportedCrypto;
      walletAddress?: string;
      txHash?: string;
    },
    options: Parameters<typeof PaymentError.prototype.constructor>[2] = {}
  ) {
    super(type, message, {
      ...options,
      code: options.code || `CRYPTO_${type.toUpperCase()}_001`
    });
    this.name = 'CryptoError';
    this.cryptocurrency = cryptoInfo?.cryptocurrency;
    this.walletAddress = cryptoInfo?.walletAddress;
    this.txHash = cryptoInfo?.txHash;
  }
}

// --- Error Handler Class ---
export class PaymentErrorHandler {
  private errorLog: PaymentError[] = [];
  private readonly maxLogSize = 1000;

  /**
   * Handle and log payment errors
   */
  public handleError(error: Error | PaymentError, context?: {
    paymentMethod?: PaymentMethod;
    amount?: number;
    transactionId?: string;
    additionalInfo?: any;
  }): PaymentError {
    let paymentError: PaymentError;

    if (error instanceof PaymentError) {
      paymentError = error;
    } else {
      // Convert generic errors to PaymentError
      paymentError = this.convertToPaymentError(error, context);
    }

    // Log the error
    this.logError(paymentError, context);

    // Store in error log
    this.addToErrorLog(paymentError);

    // Report critical errors
    if (!paymentError.recoverable) {
      this.reportCriticalError(paymentError, context);
    }

    return paymentError;
  }

  /**
   * Create validation error
   */
  public createValidationError(
    field: string,
    value: any,
    requirement: string
  ): PaymentError {
    return new PaymentError(
      'validation_error',
      `Validation failed for ${field}: ${requirement}`,
      {
        userMessage: `Please check the ${field} field and try again.`,
        technicalDetails: { field, value, requirement }
      }
    );
  }

  /**
   * Create network error with retry information
   */
  public createNetworkError(
    operation: string,
    attemptNumber: number,
    maxAttempts: number
  ): PaymentError {
    return new PaymentError(
      'network_error',
      `Network error during ${operation} (attempt ${attemptNumber}/${maxAttempts})`,
      {
        recoverable: attemptNumber < maxAttempts,
        userMessage: attemptNumber < maxAttempts
          ? 'Connection problem. Retrying...'
          : 'Unable to connect. Please check your internet and try again.',
        technicalDetails: { operation, attemptNumber, maxAttempts }
      }
    );
  }

  /**
   * Create terminal-specific error
   */
  public createTerminalError(
    type: PaymentErrorType,
    message: string,
    deviceInfo?: { deviceId?: string; deviceType?: string }
  ): TerminalError {
    return new TerminalError(type, message, deviceInfo);
  }

  /**
   * Create crypto-specific error
   */
  public createCryptoError(
    type: PaymentErrorType,
    message: string,
    cryptoInfo?: {
      cryptocurrency?: SupportedCrypto;
      walletAddress?: string;
      txHash?: string;
    }
  ): CryptoError {
    return new CryptoError(type, message, cryptoInfo);
  }

  /**
   * Get error statistics
   */
  public getErrorStats(timeframe?: { start: Date; end: Date }): {
    totalErrors: number;
    errorsByType: Record<PaymentErrorType, number>;
    recoverableErrors: number;
    criticalErrors: number;
    mostCommonError: PaymentErrorType | null;
  } {
    let filteredErrors = this.errorLog;

    if (timeframe) {
      filteredErrors = this.errorLog.filter(error => {
        const errorTime = new Date(error.timestamp);
        return errorTime >= timeframe.start && errorTime <= timeframe.end;
      });
    }

    const errorsByType: Record<PaymentErrorType, number> = {
      validation_error: 0,
      network_error: 0,
      card_declined: 0,
      processing_error: 0,
      insufficient_funds: 0,
      invalid_wallet: 0,
      timeout: 0,
      canceled: 0,
      compliance_error: 0,
      system_error: 0
    };

    let recoverableErrors = 0;
    let criticalErrors = 0;

    filteredErrors.forEach(error => {
      errorsByType[error.type]++;
      if (error.recoverable) {
        recoverableErrors++;
      } else {
        criticalErrors++;
      }
    });

    const mostCommonError = Object.entries(errorsByType)
      .reduce((max, [type, count]) => count > max.count ? { type: type as PaymentErrorType, count } : max,
              { type: null as PaymentErrorType | null, count: 0 })
      .type;

    return {
      totalErrors: filteredErrors.length,
      errorsByType,
      recoverableErrors,
      criticalErrors,
      mostCommonError
    };
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(limit = 50): PaymentError[] {
    return this.errorLog.slice(-limit).reverse();
  }

  // --- Private Methods ---

  private convertToPaymentError(error: Error, context?: any): PaymentError {
    // Analyze error message and context to determine appropriate PaymentError type
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
      return new PaymentError('network_error', error.message, {
        technicalDetails: { originalError: error, context }
      });
    }

    if (message.includes('timeout')) {
      return new PaymentError('timeout', error.message, {
        technicalDetails: { originalError: error, context }
      });
    }

    if (message.includes('declined') || message.includes('card')) {
      return new PaymentError('card_declined', error.message, {
        technicalDetails: { originalError: error, context }
      });
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return new PaymentError('validation_error', error.message, {
        technicalDetails: { originalError: error, context }
      });
    }

    if (message.includes('wallet') || message.includes('address')) {
      return new PaymentError('invalid_wallet', error.message, {
        technicalDetails: { originalError: error, context }
      });
    }

    // Default to system error
    return new PaymentError('system_error', error.message, {
      technicalDetails: { originalError: error, context }
    });
  }

  private logError(error: PaymentError, context?: any): void {
    const logLevel = error.recoverable ? 'warn' : 'error';
    const logMessage = `[${error.code}] ${error.type}: ${error.message}`;

    console[logLevel](logMessage, {
      error: error.toJSON(),
      context
    });

    // In production, send to logging service
    if (typeof window !== 'undefined') {
      try {
        // Store error for dashboard monitoring
        const errorReport = {
          timestamp: error.timestamp,
          type: error.type,
          code: error.code,
          message: error.message,
          recoverable: error.recoverable,
          context
        };

        localStorage.setItem('lastPaymentError', JSON.stringify(errorReport));

        // Dispatch error event
        window.dispatchEvent(new CustomEvent('paymentError', {
          detail: errorReport
        }));
      } catch (e) {
        console.warn('Failed to report error:', e);
      }
    }
  }

  private addToErrorLog(error: PaymentError): void {
    this.errorLog.push(error);

    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Save to localStorage (last 100 errors)
    try {
      const recentErrors = this.errorLog.slice(-100).map(e => e.toJSON());
      localStorage.setItem('paymentErrorLog', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Failed to save error log:', e);
    }
  }

  private reportCriticalError(error: PaymentError, context?: any): void {
    console.error('🚨 CRITICAL PAYMENT ERROR:', {
      error: error.toJSON(),
      context
    });

    // In production, this would alert monitoring systems
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('criticalPaymentError', {
          detail: {
            error: error.toJSON(),
            context,
            requiresAttention: true
          }
        }));
      } catch (e) {
        console.warn('Failed to report critical error:', e);
      }
    }
  }
}

// --- Singleton Error Handler ---
export const paymentErrorHandler = new PaymentErrorHandler();

// --- Utility Functions ---

/**
 * Wrap async payment operations with error handling
 */
export const withErrorHandling = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  context?: {
    operationName?: string;
    paymentMethod?: PaymentMethod;
    retryable?: boolean;
  }
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await operation(...args);
    } catch (error) {
      const handledError = paymentErrorHandler.handleError(error as Error, {
        paymentMethod: context?.paymentMethod,
        additionalInfo: {
          operationName: context?.operationName,
          arguments: args
        }
      });

      throw handledError;
    }
  };
};

/**
 * Retry operation with exponential backoff
 */
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    operationName?: string;
  } = {}
): Promise<T> => {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, operationName = 'operation' } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw paymentErrorHandler.createNetworkError(operationName, attempt, maxAttempts);
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`Retrying ${operationName} in ${delay}ms (attempt ${attempt}/${maxAttempts})`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry logic error'); // Should never reach here
};

// --- Export Default ---
export default {
  PaymentError,
  TerminalError,
  CryptoError,
  paymentErrorHandler,
  withErrorHandling,
  retryWithBackoff
};