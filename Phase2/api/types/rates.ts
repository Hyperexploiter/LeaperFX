/**
 * Rate Management Type Definitions for LeaperFX
 */

export interface ExchangeRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  spread: number;
  buyRate: number;
  sellRate: number;
  timestamp: number;
  source: 'market' | 'manual' | 'calculated';
  storeId?: string;
  isActive: boolean;
  lastUpdated: number;
}

export interface RateThreshold {
  id: string;
  currencyPair: string;
  minSpread: number;
  maxSpread: number;
  alertThreshold: number;
  autoUpdateEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RateUpdateRequest {
  currencyPair: string;
  spread?: number;
  buyRate?: number;
  sellRate?: number;
  source: 'manual' | 'calculated';
  storeId?: string;
}

export interface RateSubscription {
  clientId: string;
  currencyPairs: string[];
  frequency: number; // milliseconds
  lastUpdate: number;
  storeId?: string;
}

export interface MarketRateData {
  symbol: string;
  price: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  volume?: number;
  change24h?: number;
  changePercent24h?: number;
  source: string;
}

export interface RateCalculationConfig {
  defaultSpread: number;
  minSpread: number;
  maxSpread: number;
  volatilityFactor: number;
  liquidityFactor: number;
  updateFrequency: number;
}

export interface StoreRateProfile {
  storeId: string;
  storeName: string;
  defaultSpreads: Record<string, number>;
  rateThresholds: RateThreshold[];
  autoUpdateEnabled: boolean;
  lastRateUpdate: number;
  isActive: boolean;
}

export interface RateUpdateEvent {
  type: 'rate_update' | 'threshold_alert' | 'rate_lock' | 'rate_unlock';
  currencyPair: string;
  oldRate?: ExchangeRate;
  newRate?: ExchangeRate;
  storeId?: string;
  timestamp: number;
  source: string;
}

export interface RateAlert {
  id: string;
  storeId?: string;
  currencyPair: string;
  alertType: 'threshold_breach' | 'rate_stale' | 'source_failure';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  acknowledged: boolean;
}

export interface RateLockRequest {
  currencyPair: string;
  lockDuration: number; // seconds
  storeId?: string;
  reason?: string;
}

export interface RateLock {
  id: string;
  currencyPair: string;
  lockedRate: ExchangeRate;
  lockDuration: number;
  lockedAt: number;
  expiresAt: number;
  storeId?: string;
  isActive: boolean;
  reason?: string;
}

export interface RateHistory {
  currencyPair: string;
  rates: Array<{
    rate: number;
    spread: number;
    timestamp: number;
    source: string;
  }>;
  startTime: number;
  endTime: number;
  storeId?: string;
}

export interface RateEngineStatus {
  isRunning: boolean;
  lastUpdate: number;
  activeSources: string[];
  activeSubscriptions: number;
  rateCount: number;
  alertCount: number;
  lockCount: number;
  performance: {
    avgUpdateTime: number;
    maxUpdateTime: number;
    errorRate: number;
  };
}

// WebSocket message types for real-time updates
export interface RateWebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'rate_update' | 'alert' | 'heartbeat' | 'error';
  data?: any;
  error?: string;
  timestamp: number;
  clientId?: string;
  storeId?: string;
}

export interface RateSubscribeMessage extends RateWebSocketMessage {
  type: 'subscribe';
  data: {
    currencyPairs: string[];
    storeId?: string;
    frequency?: number;
  };
}

export interface RateUpdateMessage extends RateWebSocketMessage {
  type: 'rate_update';
  data: {
    rates: ExchangeRate[];
    source: string;
  };
}

export interface RateAlertMessage extends RateWebSocketMessage {
  type: 'alert';
  data: RateAlert;
}

// Default export removed to avoid TypeScript errors