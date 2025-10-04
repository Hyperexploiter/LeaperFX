/**
 * Market Data Type Definitions for LeaperFX
 */

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

export interface MarketDataRequest {
  symbols: string[];
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  limit?: number;
  startTime?: number;
  endTime?: number;
}

export interface DataProviderStatus {
  name: string;
  isActive: boolean;
  lastUpdate: number;
  errorCount: number;
  avgResponseTime: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}

export interface MarketDataAggregation {
  symbols: string[];
  providers: DataProviderStatus[];
  lastAggregation: number;
  dataQuality: number; // 0-1 score
  completeness: number; // percentage of requested data received
}

// Default export removed to avoid TypeScript errors