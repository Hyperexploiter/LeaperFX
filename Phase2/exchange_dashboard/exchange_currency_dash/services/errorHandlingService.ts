/**
 * Error Handling and Monitoring Service
 *
 * Provides centralized error handling, logging, and recovery mechanisms
 * for the real-time data architecture
 */

export interface ErrorEvent {
  id: string;
  timestamp: number;
  service: string;
  type: 'connection' | 'data' | 'parsing' | 'timeout' | 'rate_limit' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  resolved: boolean;
  recoveryAttempts: number;
}

export interface ConnectionHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastSeen: number;
  errorCount: number;
  uptime: number;
  responseTime?: number;
}

export interface RecoveryStrategy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  resetThreshold: number; // Time in ms after which to reset attempt count
}

/**
 * Error Handling Service Class
 */
class ErrorHandlingService {
  private errors: Map<string, ErrorEvent> = new Map();
  private errorCallbacks: ((error: ErrorEvent) => void)[] = [];
  private healthCallbacks: ((health: Map<string, ConnectionHealth>) => void)[] = [];

  // Service health tracking
  private serviceHealth: Map<string, ConnectionHealth> = new Map();
  private healthCheckTimers: Map<string, NodeJS.Timeout> = new Map();

  // Recovery strategies by service
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map([
    ['coinbase-ws', {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      resetThreshold: 5 * 60 * 1000 // 5 minutes
    }],
    ['data-manager', {
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 15000,
      backoffMultiplier: 1.5,
      resetThreshold: 3 * 60 * 1000 // 3 minutes
    }],
    ['animation-buffer', {
      maxAttempts: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      resetThreshold: 2 * 60 * 1000 // 2 minutes
    }]
  ]);

  // Active recovery operations
  private activeRecoveries: Map<string, NodeJS.Timeout> = new Map();

  // Error patterns and detection
  private errorPatterns: Map<string, { count: number; firstOccurred: number; pattern: RegExp }> = new Map();

  constructor() {
    this.initializeHealthTracking();
  }

  /**
   * Initialize health tracking for all services
   */
  private initializeHealthTracking(): void {
    const services = ['coinbase-ws', 'data-manager', 'animation-buffer', 'chart-adapter'];

    services.forEach(service => {
      this.serviceHealth.set(service, {
        service,
        status: 'offline',
        lastSeen: Date.now(),
        errorCount: 0,
        uptime: 0
      });

      // Start health check timer
      const timer = setInterval(() => {
        this.checkServiceHealth(service);
      }, 30000); // Check every 30 seconds

      this.healthCheckTimers.set(service, timer);
    });
  }

  /**
   * Report an error from a service
   */
  reportError(
    service: string,
    type: ErrorEvent['type'],
    message: string,
    details?: any,
    severity: ErrorEvent['severity'] = 'medium'
  ): string {
    const errorId = `${service}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const error: ErrorEvent = {
      id: errorId,
      timestamp: Date.now(),
      service,
      type,
      severity,
      message,
      details,
      resolved: false,
      recoveryAttempts: 0
    };

    this.errors.set(errorId, error);

    // Update service health
    this.updateServiceHealth(service, 'error');

    // Detect error patterns
    this.detectErrorPattern(service, message);

    // Notify callbacks
    this.notifyErrorCallbacks(error);

    // Log error
    this.logError(error);

    // Attempt automatic recovery for critical errors
    if (severity === 'critical') {
      this.attemptRecovery(service, errorId);
    }

    return errorId;
  }

  /**
   * Update service health status
   */
  updateServiceHealth(service: string, event: 'healthy' | 'error' | 'timeout' | 'offline'): void {
    const health = this.serviceHealth.get(service);
    if (!health) return;

    const now = Date.now();

    switch (event) {
      case 'healthy':
        health.status = 'healthy';
        health.lastSeen = now;
        health.errorCount = Math.max(0, health.errorCount - 1);
        break;
      case 'error':
        health.errorCount++;
        health.lastSeen = now;
        if (health.errorCount >= 5) {
          health.status = 'unhealthy';
        } else if (health.errorCount >= 3) {
          health.status = 'degraded';
        }
        break;
      case 'timeout':
        health.lastSeen = now;
        health.status = 'degraded';
        break;
      case 'offline':
        health.status = 'offline';
        break;
    }

    this.notifyHealthCallbacks();
  }

  /**
   * Check service health based on last seen time
   */
  private checkServiceHealth(service: string): void {
    const health = this.serviceHealth.get(service);
    if (!health) return;

    const now = Date.now();
    const timeSinceLastSeen = now - health.lastSeen;

    // If we haven't heard from service in 2 minutes, mark as degraded
    if (timeSinceLastSeen > 2 * 60 * 1000 && health.status === 'healthy') {
      health.status = 'degraded';
      this.notifyHealthCallbacks();
    }

    // If we haven't heard from service in 5 minutes, mark as offline
    if (timeSinceLastSeen > 5 * 60 * 1000 && health.status !== 'offline') {
      health.status = 'offline';
      this.notifyHealthCallbacks();
    }
  }

  /**
   * Detect error patterns
   */
  private detectErrorPattern(service: string, message: string): void {
    const patternKey = `${service}:${message.substring(0, 50)}`;
    const existing = this.errorPatterns.get(patternKey);

    if (existing) {
      existing.count++;

      // If we see the same error 5+ times in 5 minutes, it's a pattern
      if (existing.count >= 5 && (Date.now() - existing.firstOccurred) <= 5 * 60 * 1000) {
        console.warn(`[ErrorHandling] Error pattern detected for ${service}: ${message}`);

        // Report pattern as critical error
        this.reportError(
          service,
          'unknown',
          `Error pattern detected: ${message}`,
          { originalCount: existing.count, timeSpan: Date.now() - existing.firstOccurred },
          'critical'
        );
      }
    } else {
      this.errorPatterns.set(patternKey, {
        count: 1,
        firstOccurred: Date.now(),
        pattern: new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      });
    }
  }

  /**
   * Attempt automatic recovery
   */
  private attemptRecovery(service: string, errorId?: string): void {
    const strategy = this.recoveryStrategies.get(service);
    if (!strategy) return;

    // Check if recovery is already in progress
    if (this.activeRecoveries.has(service)) {
      console.log(`[ErrorHandling] Recovery already in progress for ${service}`);
      return;
    }

    const error = errorId ? this.errors.get(errorId) : null;
    const attemptNumber = error ? error.recoveryAttempts + 1 : 1;

    if (attemptNumber > strategy.maxAttempts) {
      console.error(`[ErrorHandling] Max recovery attempts exceeded for ${service}`);
      this.updateServiceHealth(service, 'offline');
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      strategy.baseDelay * Math.pow(strategy.backoffMultiplier, attemptNumber - 1),
      strategy.maxDelay
    );

    console.log(`[ErrorHandling] Attempting recovery for ${service} (attempt ${attemptNumber}/${strategy.maxAttempts}) in ${delay}ms`);

    const recoveryTimer = setTimeout(() => {
      this.activeRecoveries.delete(service);
      this.executeRecovery(service, attemptNumber, errorId);
    }, delay);

    this.activeRecoveries.set(service, recoveryTimer);

    // Update error attempt count
    if (error) {
      error.recoveryAttempts = attemptNumber;
    }
  }

  /**
   * Execute recovery action
   */
  private async executeRecovery(service: string, attemptNumber: number, errorId?: string): Promise<void> {
    try {
      console.log(`[ErrorHandling] Executing recovery for ${service} (attempt ${attemptNumber})`);

      let recoverySuccessful = false;

      switch (service) {
        case 'coinbase-ws':
          recoverySuccessful = await this.recoverWebSocketService();
          break;
        case 'data-manager':
          recoverySuccessful = await this.recoverDataManager();
          break;
        case 'animation-buffer':
          recoverySuccessful = await this.recoverAnimationBuffer();
          break;
        default:
          console.warn(`[ErrorHandling] No recovery strategy defined for ${service}`);
          break;
      }

      if (recoverySuccessful) {
        console.log(`[ErrorHandling] Recovery successful for ${service}`);
        this.updateServiceHealth(service, 'healthy');

        // Mark error as resolved
        if (errorId) {
          const error = this.errors.get(errorId);
          if (error) {
            error.resolved = true;
          }
        }
      } else {
        console.warn(`[ErrorHandling] Recovery failed for ${service}, will retry`);
        this.attemptRecovery(service, errorId);
      }
    } catch (error) {
      console.error(`[ErrorHandling] Recovery execution failed for ${service}:`, error);
      this.attemptRecovery(service, errorId);
    }
  }

  /**
   * Recover WebSocket service
   */
  private async recoverWebSocketService(): Promise<boolean> {
    try {
      // Dynamic import to avoid circular dependency
      const { coinbaseWebSocketService } = await import('./coinbaseWebSocketService');

      // Disconnect and reconnect
      coinbaseWebSocketService.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const success = await coinbaseWebSocketService.connect();
      return success;
    } catch (error) {
      console.error('[ErrorHandling] WebSocket recovery failed:', error);
      return false;
    }
  }

  /**
   * Recover data manager
   */
  private async recoverDataManager(): Promise<boolean> {
    try {
      // Dynamic import to avoid circular dependency
      const { realTimeDataManager } = await import('./realTimeDataManager');

      await realTimeDataManager.refresh();
      return realTimeDataManager.isReady();
    } catch (error) {
      console.error('[ErrorHandling] Data manager recovery failed:', error);
      return false;
    }
  }

  /**
   * Recover animation buffer
   */
  private async recoverAnimationBuffer(): Promise<boolean> {
    try {
      // Dynamic import to avoid circular dependency
      const { animationBufferService } = await import('./animationBufferService');

      animationBufferService.cleanup();
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms

      // The service will reinitialize automatically when needed
      return true;
    } catch (error) {
      console.error('[ErrorHandling] Animation buffer recovery failed:', error);
      return false;
    }
  }

  /**
   * Subscribe to error events
   */
  subscribeToErrors(callback: (error: ErrorEvent) => void): () => void {
    this.errorCallbacks.push(callback);

    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index >= 0) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to health updates
   */
  subscribeToHealth(callback: (health: Map<string, ConnectionHealth>) => void): () => void {
    this.healthCallbacks.push(callback);

    // Send current health state
    callback(new Map(this.serviceHealth));

    return () => {
      const index = this.healthCallbacks.indexOf(callback);
      if (index >= 0) {
        this.healthCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify error callbacks
   */
  private notifyErrorCallbacks(error: ErrorEvent): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('[ErrorHandling] Error in error callback:', err);
      }
    });
  }

  /**
   * Notify health callbacks
   */
  private notifyHealthCallbacks(): void {
    const healthSnapshot = new Map(this.serviceHealth);
    this.healthCallbacks.forEach(callback => {
      try {
        callback(healthSnapshot);
      } catch (err) {
        console.error('[ErrorHandling] Error in health callback:', err);
      }
    });
  }

  /**
   * Log error (can be extended to send to external logging service)
   */
  private logError(error: ErrorEvent): void {
    const logLevel = error.severity === 'critical' ? 'error' :
                     error.severity === 'high' ? 'warn' : 'info';

    console[logLevel](`[${error.service}] ${error.type}: ${error.message}`, error.details);

    // TODO: Send to external logging service in production
    // Example: sendToLogService(error);
  }

  /**
   * Get service health
   */
  getServiceHealth(service?: string): Map<string, ConnectionHealth> | ConnectionHealth | null {
    if (service) {
      return this.serviceHealth.get(service) || null;
    }
    return new Map(this.serviceHealth);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50, service?: string): ErrorEvent[] {
    let errors = Array.from(this.errors.values());

    if (service) {
      errors = errors.filter(error => error.service === service);
    }

    return errors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByService: Map<string, number>;
    errorsByType: Map<string, number>;
    errorsBySeverity: Map<string, number>;
    resolvedErrors: number;
    unresolvedErrors: number;
  } {
    const errors = Array.from(this.errors.values());

    const errorsByService = new Map<string, number>();
    const errorsByType = new Map<string, number>();
    const errorsBySeverity = new Map<string, number>();

    let resolvedErrors = 0;
    let unresolvedErrors = 0;

    errors.forEach(error => {
      // By service
      errorsByService.set(error.service, (errorsByService.get(error.service) || 0) + 1);

      // By type
      errorsByType.set(error.type, (errorsByType.get(error.type) || 0) + 1);

      // By severity
      errorsBySeverity.set(error.severity, (errorsBySeverity.get(error.severity) || 0) + 1);

      // Resolution status
      if (error.resolved) {
        resolvedErrors++;
      } else {
        unresolvedErrors++;
      }
    });

    return {
      totalErrors: errors.length,
      errorsByService,
      errorsByType,
      errorsBySeverity,
      resolvedErrors,
      unresolvedErrors
    };
  }

  /**
   * Force recovery for a service
   */
  forceRecovery(service: string): void {
    // Cancel existing recovery if in progress
    const existingTimer = this.activeRecoveries.get(service);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.activeRecoveries.delete(service);
    }

    // Start immediate recovery
    this.attemptRecovery(service);
  }

  /**
   * Clear resolved errors older than specified time
   */
  clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;

    for (const [id, error] of this.errors.entries()) {
      if (error.resolved && error.timestamp < cutoff) {
        this.errors.delete(id);
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Clear health check timers
    this.healthCheckTimers.forEach(timer => clearInterval(timer));
    this.healthCheckTimers.clear();

    // Clear active recovery timers
    this.activeRecoveries.forEach(timer => clearTimeout(timer));
    this.activeRecoveries.clear();

    // Clear callbacks
    this.errorCallbacks = [];
    this.healthCallbacks = [];

    // Clear data
    this.errors.clear();
    this.serviceHealth.clear();
    this.errorPatterns.clear();
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();
export default errorHandlingService;