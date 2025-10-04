/**
 * API Type Definitions for LeaperFX Backend
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
  requestId: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: number;
  requestId: string;
}

// Configuration Types
export interface ConfigurationValue {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: string;
  description?: string;
  lastModified: number;
  version: number;
}

export interface ConfigurationProfile {
  id: string;
  name: string;
  description?: string;
  values: Record<string, any>;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface ConfigurationUpdate {
  key: string;
  value: any;
  category?: string;
  description?: string;
}

// Data Provider Types
export interface MarketDataRequest {
  symbols: string[];
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export interface MarketDataPoint {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  change?: number;
  changePercent?: number;
}

export interface ForexRate {
  pair: string;
  rate: number;
  timestamp: number;
  source: string;
  bid?: number;
  ask?: number;
  spread?: number;
}

export interface CryptoPrice {
  symbol: string;
  price: number;
  timestamp: number;
  volume24h?: number;
  change24h?: number;
  changePercent24h?: number;
  marketCap?: number;
  source: string;
}

export interface CommodityPrice {
  symbol: string;
  price: number;
  timestamp: number;
  unit: string;
  change24h?: number;
  changePercent24h?: number;
  source: string;
}

export interface IndexData {
  symbol: string;
  value: number;
  timestamp: number;
  change?: number;
  changePercent?: number;
  source: string;
}

export interface YieldData {
  instrument: string;
  yield: number;
  timestamp: number;
  maturity: string;
  change?: number;
  source: string;
}

// API Key Management
export interface ApiKeyInfo {
  name: string;
  provider: string;
  hasKey: boolean;
  lastUsed?: number;
  requestsToday?: number;
  rateLimit?: number;
  status: 'active' | 'inactive' | 'expired' | 'invalid';
}

// Rate Limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'data' | 'error' | 'ping' | 'pong';
  symbol?: string;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface WebSocketSubscription {
  symbols: string[];
  timeframes?: string[];
  clientId: string;
  lastActivity: number;
}

// Health Check
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  services: {
    database: 'up' | 'down' | 'degraded';
    providers: Record<string, 'up' | 'down' | 'degraded'>;
    cache: 'up' | 'down' | 'degraded';
    rateLimit: 'up' | 'down' | 'degraded';
  };
  performance: {
    responseTimeMs: number;
    memoryUsageMB: number;
    cpuUsagePercent?: number;
  };
  version: string;
  uptime: number;
}

// Provider-specific types
export interface PolygonResponse {
  status: string;
  results?: any[];
  count?: number;
  next_url?: string;
}

export interface CoinbaseWebSocketData {
  type: string;
  product_id: string;
  price?: string;
  time?: string;
  sequence?: number;
  best_bid?: string;
  best_ask?: string;
  [key: string]: any;
}

export interface TwelveDataResponse {
  meta?: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
  };
  values?: any[];
  status?: string;
  message?: string;
}

export interface BankOfCanadaResponse {
  observations?: Array<{
    d: string;
    [key: string]: string;
  }>;
  seriesDetail?: {
    [key: string]: {
      label: string;
      description: string;
    };
  };
}

// Security
export interface SecurityContext {
  requestId: string;
  clientId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  rateLimitInfo: RateLimitInfo;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface RequestMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  timestamp: number;
  rateLimited: boolean;
  cached: boolean;
}

// Environment Types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT?: string;
  POLYGON_API_KEY?: string;
  TWELVEDATA_API_KEY?: string;
  COINBASE_API_KEY?: string;
  COINBASE_API_SECRET?: string;
  COINBASE_API_PASSPHRASE?: string;
  OPENWEATHER_API_KEY?: string;
  KV_URL?: string;
  KV_REST_API_URL?: string;
  KV_REST_API_TOKEN?: string;
  KV_REST_API_READ_ONLY_TOKEN?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  API_SECRET_KEY?: string;
  CORS_ORIGIN?: string;
  RATE_LIMIT_REQUESTS?: string;
  RATE_LIMIT_WINDOW?: string;
}

export default {
  ApiResponse,
  ErrorResponse,
  ConfigurationValue,
  ConfigurationProfile,
  MarketDataRequest,
  MarketDataPoint,
  ForexRate,
  CryptoPrice,
  CommodityPrice,
  IndexData,
  YieldData,
  HealthStatus,
  SecurityContext,
  RequestMetrics,
};