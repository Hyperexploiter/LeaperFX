/**
 * Error Handler Service
 * Provides graceful error handling and fallback mechanisms for API failures
 */

export interface ErrorInfo {
  code: string;
  message: string;
  timestamp: number;
  service: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
}

export interface ConnectionStatus {
  service: string;
  connected: boolean;
  lastSuccess: number;
  errorCount: number;
  status: 'healthy' | 'degraded' | 'error' | 'offline';
}

class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private connectionStatuses: Map<string, ConnectionStatus> = new Map();
  private maxErrors = 100;
  private fallbackData: Map<string, any> = new Map();
  private offlineMode = false;

  /**
   * Log an error with context
   */
  logError(error: Error | string, service: string, context?: any): ErrorInfo {
    const errorInfo: ErrorInfo = {
      code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : error,
      timestamp: Date.now(),
      service,
      severity: this.determineSeverity(error, service),
      userMessage: this.generateUserMessage(error, service)
    };

    this.errors.unshift(errorInfo);

    // Limit error history
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Update connection status
    this.updateConnectionStatus(service, false);

    // Log to console in development
    if (this.isDebugMode()) {
      console.error(`[ErrorHandler] ${service}:`, errorInfo, context);
    }

    return errorInfo;
  }

  /**
   * Log successful operation
   */
  logSuccess(service: string): void {
    this.updateConnectionStatus(service, true);
  }

  /**
   * Update connection status for a service
   */
  private updateConnectionStatus(service: string, success: boolean): void {
    const existing = this.connectionStatuses.get(service) || {
      service,
      connected: false,
      lastSuccess: 0,
      errorCount: 0,
      status: 'offline' as const
    };

    if (success) {
      existing.connected = true;
      existing.lastSuccess = Date.now();
      existing.errorCount = 0;
      existing.status = 'healthy';
    } else {
      existing.connected = false;
      existing.errorCount++;

      if (existing.errorCount > 5) {
        existing.status = 'error';
      } else if (existing.errorCount > 2) {
        existing.status = 'degraded';
      } else {
        existing.status = 'degraded';
      }
    }

    this.connectionStatuses.set(service, existing);
  }

  /**
   * Get connection status for a service
   */
  getConnectionStatus(service: string): ConnectionStatus | null {
    return this.connectionStatuses.get(service) || null;
  }

  /**
   * Get all connection statuses
   */
  getAllConnectionStatuses(): Map<string, ConnectionStatus> {
    return new Map(this.connectionStatuses);
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error | string, service: string): 'low' | 'medium' | 'high' | 'critical' {
    const message = error instanceof Error ? error.message : error;
    const lowerMessage = message.toLowerCase();

    // Critical errors
    if (lowerMessage.includes('network') || lowerMessage.includes('cors') || lowerMessage.includes('timeout')) {
      return 'critical';
    }

    // High severity
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden') || lowerMessage.includes('rate limit')) {
      return 'high';
    }

    // Medium severity
    if (lowerMessage.includes('invalid') || lowerMessage.includes('not found')) {
      return 'medium';
    }

    // Low severity for everything else
    return 'low';
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(error: Error | string, service: string): string {
    const message = error instanceof Error ? error.message : error;
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('cors')) {
      return `Connection to ${service} is temporarily unavailable. Using cached data.`;
    }

    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
      return `Authentication issue with ${service}. Please check your API credentials.`;
    }

    if (lowerMessage.includes('rate limit')) {
      return `${service} rate limit exceeded. Data updates may be delayed.`;
    }

    if (lowerMessage.includes('timeout')) {
      return `${service} is responding slowly. Using cached data where available.`;
    }

    return `Temporary issue with ${service}. Attempting to reconnect...`;
  }

  /**
   * Store fallback data for offline use
   */
  storeFallbackData(key: string, data: any): void {
    this.fallbackData.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get fallback data
   */
  getFallbackData(key: string): any | null {
    const cached = this.fallbackData.get(key);
    if (!cached) return null;

    // Return cached data if less than 1 hour old
    const age = Date.now() - cached.timestamp;
    if (age < 3600000) { // 1 hour
      return cached.data;
    }

    return null;
  }

  /**
   * Enable offline mode
   */
  enableOfflineMode(): void {
    this.offlineMode = true;
    console.warn('[ErrorHandler] Offline mode enabled - using cached data only');
  }

  /**
   * Disable offline mode
   */
  disableOfflineMode(): void {
    this.offlineMode = false;
    console.log('[ErrorHandler] Offline mode disabled - resuming normal operations');
  }

  /**
   * Check if in offline mode
   */
  isOfflineMode(): boolean {
    return this.offlineMode;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errors.slice(0, limit);
  }

  /**
   * Get errors by service
   */
  getErrorsByService(service: string, limit: number = 10): ErrorInfo[] {
    return this.errors.filter(e => e.service === service).slice(0, limit);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical', limit: number = 10): ErrorInfo[] {
    return this.errors.filter(e => e.severity === severity).slice(0, limit);
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get system health summary
   */
  getHealthSummary(): {
    overall: 'healthy' | 'degraded' | 'error' | 'critical';
    services: number;
    errors: number;
    criticalErrors: number;
    offlineMode: boolean;
  } {
    const statusCounts = { healthy: 0, degraded: 0, error: 0, offline: 0 };
    this.connectionStatuses.forEach(status => {
      statusCounts[status.status]++;
    });

    let overall: 'healthy' | 'degraded' | 'error' | 'critical';
    if (statusCounts.error > 0 || statusCounts.offline > 0) {
      overall = 'critical';
    } else if (statusCounts.degraded > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    const criticalErrors = this.errors.filter(e => e.severity === 'critical').length;

    return {
      overall,
      services: this.connectionStatuses.size,
      errors: this.errors.length,
      criticalErrors,
      offlineMode: this.offlineMode
    };
  }

  /**
   * Check if debug mode is enabled
   */
  private isDebugMode(): boolean {
    try {
      const viteEnv = (typeof import.meta !== 'undefined') ? (import.meta as any).env : undefined;
      const win: any = (typeof window !== 'undefined') ? (window as any) : {};
      const nodeEnv: any = (typeof process !== 'undefined') ? (process as any).env : undefined;

      const debugMode = (viteEnv && viteEnv.VITE_DEBUG_MODE) ||
                       (win.__ENV__ && win.__ENV__.VITE_DEBUG_MODE) ||
                       (nodeEnv && nodeEnv.VITE_DEBUG_MODE);

      return String(debugMode).toLowerCase() === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Execute with error handling and fallback
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    service: string,
    fallbackKey?: string
  ): Promise<T | null> {
    try {
      const result = await operation();
      this.logSuccess(service);

      // Store successful result as fallback
      if (fallbackKey) {
        this.storeFallbackData(fallbackKey, result);
      }

      return result;
    } catch (error) {
      this.logError(error as Error, service);

      // Try to return fallback data
      if (fallbackKey) {
        const fallbackData = this.getFallbackData(fallbackKey);
        if (fallbackData) {
          console.warn(`[ErrorHandler] Using fallback data for ${service}`);
          return fallbackData;
        }
      }

      return null;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    service: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T | null> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await operation();
        this.logSuccess(service);
        return result;
      } catch (error) {
        this.logError(error as Error, service);

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`[ErrorHandler] Retrying ${service} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
export default errorHandler;