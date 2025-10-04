/**
 * Rate Manager Service
 * Handles rate management operations with the unified API backend
 * Provides store owner capabilities for rate overrides and management
 */

import webSocketService, { WebSocketEvent } from '../../demo/src/services/webSocketService';
import errorHandler from './errorHandler';

export interface RateData {
  symbol: string;
  marketRate: number;
  storeRate?: number;
  timestamp: number;
  source: string;
  spread?: number;
  isOverridden: boolean;
}

export interface RateOverride {
  buyRate?: number;
  sellRate?: number;
  spread?: number;
  expiryTime?: number;
  isActive: boolean;
  reason?: string;
}

export interface RateThreshold {
  symbol: string;
  minThreshold: number;
  maxThreshold: number;
  alertEnabled: boolean;
  autoApply: boolean;
}

export interface RateAlert {
  id: string;
  symbol: string;
  alertType: 'threshold_breach' | 'rapid_change' | 'market_close' | 'system_error';
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
}

/**
 * Rate Manager Service - handles all rate management functionality
 */
class RateManagerService {
  private baseUrl: string;
  private subscribers: Map<string, Set<(data: RateData) => void>> = new Map();
  private rateCache: Map<string, RateData> = new Map();
  private thresholds: Map<string, RateThreshold> = new Map();
  private alerts: RateAlert[] = [];
  private isConnected: boolean = false;

  constructor() {
    // Use unified API base URL or fallback
    this.baseUrl = this.getEnv('VITE_API_BASE_URL') || '/api';
    this.initializeWebSocketListeners();
  }

  private getEnv(key: string): string | undefined {
    try {
      const viteEnv = (typeof import.meta !== 'undefined') ? (import.meta as any).env : undefined;
      const win: any = (typeof window !== 'undefined') ? (window as any) : {};
      const nodeEnv: any = (typeof process !== 'undefined') ? (process as any).env : undefined;
      return (viteEnv && viteEnv[key]) || (win.__ENV__ && win.__ENV__[key]) || (nodeEnv && nodeEnv[key]);
    } catch {
      return undefined;
    }
  }

  /**
   * Initialize WebSocket listeners for real-time rate updates
   */
  private initializeWebSocketListeners(): void {
    webSocketService.subscribe((event: WebSocketEvent) => {
      switch (event.type) {
        case 'rate_update':
          this.handleRateUpdate(event.data);
          break;
        case 'rate_alert_triggered':
          this.handleRateAlert(event.data);
          break;
        case 'system_status':
          this.handleSystemStatus(event.data);
          break;
      }
    });
  }

  /**
   * Handle incoming rate updates from WebSocket
   */
  private handleRateUpdate(data: any): void {
    const rateData: RateData = {
      symbol: data.symbol,
      marketRate: data.marketRate,
      storeRate: data.storeRate,
      timestamp: data.timestamp || Date.now(),
      source: data.source || 'websocket',
      spread: data.spread,
      isOverridden: data.isOverridden || false
    };

    this.rateCache.set(data.symbol, rateData);
    this.notifySubscribers(data.symbol, rateData);
  }

  /**
   * Handle rate alerts from WebSocket
   */
  private handleRateAlert(data: any): void {
    const alert: RateAlert = {
      id: data.id || `alert_${Date.now()}`,
      symbol: data.symbol,
      alertType: data.alertType,
      message: data.message,
      timestamp: data.timestamp || Date.now(),
      severity: data.severity || 'medium',
      acknowledged: false
    };

    this.alerts.unshift(alert);

    // Limit alerts to 100 most recent
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
  }

  /**
   * Handle system status updates
   */
  private handleSystemStatus(data: any): void {
    this.isConnected = data.connected || false;
  }

  /**
   * Get current rates for all currencies
   */
  async getCurrentRates(): Promise<RateData[]> {
    return await errorHandler.executeWithFallback(
      async () => {
        const response = await fetch(`${this.baseUrl}/rates/current`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rates = await response.json();

        // Update cache with fresh data
        rates.forEach((rate: RateData) => {
          this.rateCache.set(rate.symbol, rate);
        });

        return rates;
      },
      'rateManager',
      'current_rates'
    ) || Array.from(this.rateCache.values());
  }

  /**
   * Get rate data for a specific currency
   */
  async getRate(currency: string): Promise<RateData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/rates/${currency}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rate = await response.json();
      this.rateCache.set(currency, rate);
      return rate;
    } catch (error) {
      console.error(`[RateManagerService] Failed to fetch rate for ${currency}:`, error);
      return this.rateCache.get(currency) || null;
    }
  }

  /**
   * Set store rate override for a currency
   */
  async setStoreRate(currency: string, override: RateOverride): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rates/${currency}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(override),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Update cache with new override
      const cachedRate = this.rateCache.get(currency);
      if (cachedRate) {
        cachedRate.storeRate = override.buyRate || override.sellRate;
        cachedRate.isOverridden = override.isActive;
        cachedRate.timestamp = Date.now();
        this.notifySubscribers(currency, cachedRate);
      }

      return result.success;
    } catch (error) {
      console.error(`[RateManagerService] Failed to set store rate for ${currency}:`, error);
      return false;
    }
  }

  /**
   * Remove rate override for a currency
   */
  async removeStoreRate(currency: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rates/${currency}/override`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Update cache
      const cachedRate = this.rateCache.get(currency);
      if (cachedRate) {
        cachedRate.storeRate = undefined;
        cachedRate.isOverridden = false;
        cachedRate.timestamp = Date.now();
        this.notifySubscribers(currency, cachedRate);
      }

      return result.success;
    } catch (error) {
      console.error(`[RateManagerService] Failed to remove store rate for ${currency}:`, error);
      return false;
    }
  }

  /**
   * Set rate threshold for monitoring
   */
  async setRateThreshold(threshold: RateThreshold): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rates/thresholds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(threshold),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.thresholds.set(threshold.symbol, threshold);
      return true;
    } catch (error) {
      console.error(`[RateManagerService] Failed to set threshold for ${threshold.symbol}:`, error);
      return false;
    }
  }

  /**
   * Get rate thresholds
   */
  getThresholds(): RateThreshold[] {
    return Array.from(this.thresholds.values());
  }

  /**
   * Get recent rate alerts
   */
  getAlerts(acknowledged: boolean = false): RateAlert[] {
    return this.alerts.filter(alert => alert.acknowledged === acknowledged);
  }

  /**
   * Acknowledge a rate alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rates/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local alert
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }

      return true;
    } catch (error) {
      console.error(`[RateManagerService] Failed to acknowledge alert ${alertId}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to rate updates for a specific currency
   */
  subscribe(currency: string, callback: (data: RateData) => void): () => void {
    if (!this.subscribers.has(currency)) {
      this.subscribers.set(currency, new Set());
    }

    this.subscribers.get(currency)!.add(callback);

    // Send current data if available
    const currentData = this.rateCache.get(currency);
    if (currentData) {
      callback(currentData);
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(currency);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Subscribe to all rate updates
   */
  subscribeToAll(callback: (currency: string, data: RateData) => void): () => void {
    const unsubscribeFunctions: (() => void)[] = [];

    // Subscribe to existing currencies
    for (const currency of this.rateCache.keys()) {
      const unsub = this.subscribe(currency, (data) => callback(currency, data));
      unsubscribeFunctions.push(unsub);
    }

    // Return unsubscribe function for all
    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }

  /**
   * Notify subscribers of rate updates
   */
  private notifySubscribers(currency: string, data: RateData): void {
    const subscribers = this.subscribers.get(currency);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[RateManagerService] Subscriber error for ${currency}:`, error);
        }
      });
    }
  }

  /**
   * Get cached rate data
   */
  getCachedRate(currency: string): RateData | undefined {
    return this.rateCache.get(currency);
  }

  /**
   * Get all cached rate data
   */
  getAllCachedRates(): Map<string, RateData> {
    return new Map(this.rateCache);
  }

  /**
   * Get service status
   */
  getStatus(): {
    connected: boolean;
    cachedRates: number;
    activeSubscribers: number;
    unacknowledgedAlerts: number;
  } {
    let subscriberCount = 0;
    this.subscribers.forEach(subs => subscriberCount += subs.size);

    return {
      connected: this.isConnected,
      cachedRates: this.rateCache.size,
      activeSubscribers: subscriberCount,
      unacknowledgedAlerts: this.alerts.filter(a => !a.acknowledged).length
    };
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<boolean> {
    try {
      // Connect to WebSocket if not already connected
      if (!webSocketService.isConnected()) {
        const wsUrl = this.getEnv('VITE_API_BASE_URL')
          ? `${this.getEnv('VITE_API_BASE_URL').replace('http', 'ws')}/rates/websocket`
          : undefined;
        await webSocketService.connect(wsUrl);
      }

      // Fetch initial rate data
      await this.getCurrentRates();

      this.isConnected = true;
      console.log('[RateManagerService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[RateManagerService] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    this.subscribers.clear();
    this.rateCache.clear();
    this.thresholds.clear();
    this.alerts = [];
    this.isConnected = false;
    console.log('[RateManagerService] Shutdown complete');
  }
}

// Export singleton instance
export const rateManagerService = new RateManagerService();
export default rateManagerService;