/**
 * Signal Detection Engine for market event triggers
 * Implements pause-on-signal logic for attention-grabbing moments
 * Configurable thresholds for price, volatility, and order book events
 */

import { RingBuffer } from './RingBuffer';

export interface SignalConfig {
  priceChangeThreshold: number;      // % change threshold
  priceChangeWindow: number;         // Time window in minutes
  volatilityMultiplier: number;      // σ multiplier for volatility spike
  bookImbalanceThreshold: number;    // Order book imbalance threshold
  minSignalDuration: number;         // Minimum signal duration in seconds
  cooldownPeriod: number;            // Cooldown between signals in seconds
}

export interface MarketSignal {
  id: string;
  type: 'price_spike' | 'volatility_spike' | 'book_imbalance' | 'news_event';
  symbol: string;
  timestamp: number;
  magnitude: number;
  direction: 'up' | 'down' | 'neutral';
  metadata: {
    priceChange?: number;
    volatility?: number;
    imbalance?: number;
    headline?: string;
  };
  priority: number;
  duration: number;
}

export interface OrderBookData {
  bids: { price: number; volume: number }[];
  asks: { price: number; volume: number }[];
  timestamp: number;
}

/**
 * Core signal detection engine
 * Monitors multiple data streams for significant events
 */
export class SignalDetectionEngine {
  private config: SignalConfig;
  private activeSignals: Map<string, MarketSignal> = new Map();
  private signalHistory: MarketSignal[] = [];
  private lastSignalTime: Map<string, number> = new Map();

  // Baseline metrics for comparison
  private baselineVolatility: Map<string, number> = new Map();
  private rollingMeans: Map<string, number> = new Map();

  constructor(config: SignalConfig) {
    this.config = config;
  }

  /**
   * Detect price spike signals
   * Monitors rapid price movements over configured window
   */
  detectPriceSpike(
    symbol: string,
    buffer: RingBuffer,
    currentPrice: number
  ): MarketSignal | null {
    // Check cooldown
    if (!this.checkCooldown(symbol)) return null;

    const windowSizeMs = this.config.priceChangeWindow * 60 * 1000;
    const stats = buffer.getStats(Math.min(100, buffer.getSize()));

    // Get price from window start
    const data = buffer.getRawData();
    const currentTime = Date.now();

    let windowStartPrice: number | null = null;
    let windowStartIndex = -1;

    // Find price at window start
    for (let i = data.timestamps.length - 1; i >= 0; i--) {
      if (currentTime - data.timestamps[i] >= windowSizeMs) {
        windowStartPrice = data.values[i];
        windowStartIndex = i;
        break;
      }
    }

    if (windowStartPrice === null || windowStartIndex === -1) return null;

    // Calculate percentage change
    const priceChange = ((currentPrice - windowStartPrice) / windowStartPrice) * 100;
    const absChange = Math.abs(priceChange);

    // Check if threshold exceeded
    if (absChange >= this.config.priceChangeThreshold) {
      const signal: MarketSignal = {
        id: `${symbol}_price_${Date.now()}`,
        type: 'price_spike',
        symbol,
        timestamp: currentTime,
        magnitude: absChange,
        direction: priceChange > 0 ? 'up' : 'down',
        metadata: {
          priceChange,
          volatility: stats.volatility
        },
        priority: this.calculatePriority(absChange, this.config.priceChangeThreshold),
        duration: this.config.minSignalDuration * 1000
      };

      this.registerSignal(signal);
      return signal;
    }

    return null;
  }

  /**
   * Detect volatility spike signals
   * Monitors standard deviation changes
   */
  detectVolatilitySpike(
    symbol: string,
    buffer: RingBuffer
  ): MarketSignal | null {
    // Check cooldown
    if (!this.checkCooldown(symbol)) return null;

    const stats = buffer.getStats();

    // Get or calculate baseline volatility
    let baseline = this.baselineVolatility.get(symbol);
    if (!baseline) {
      baseline = stats.stdDev;
      this.baselineVolatility.set(symbol, baseline);
      return null;
    }

    // Update baseline with exponential moving average
    baseline = baseline * 0.95 + stats.stdDev * 0.05;
    this.baselineVolatility.set(symbol, baseline);

    // Check for volatility spike
    const volatilityRatio = stats.stdDev / baseline;

    if (volatilityRatio >= this.config.volatilityMultiplier) {
      const signal: MarketSignal = {
        id: `${symbol}_vol_${Date.now()}`,
        type: 'volatility_spike',
        symbol,
        timestamp: Date.now(),
        magnitude: volatilityRatio,
        direction: stats.velocity > 0 ? 'up' : stats.velocity < 0 ? 'down' : 'neutral',
        metadata: {
          volatility: stats.stdDev,
          priceChange: stats.velocity * 100
        },
        priority: this.calculatePriority(volatilityRatio, this.config.volatilityMultiplier),
        duration: this.config.minSignalDuration * 1000
      };

      this.registerSignal(signal);
      return signal;
    }

    return null;
  }

  /**
   * Detect order book imbalance signals
   * Monitors bid/ask volume disparities
   */
  detectBookImbalance(
    symbol: string,
    orderBook: OrderBookData
  ): MarketSignal | null {
    // Check cooldown
    if (!this.checkCooldown(symbol)) return null;

    // Calculate total volumes
    const bidVolume = orderBook.bids.reduce((sum, bid) => sum + bid.volume, 0);
    const askVolume = orderBook.asks.reduce((sum, ask) => sum + ask.volume, 0);
    const totalVolume = bidVolume + askVolume;

    if (totalVolume === 0) return null;

    // Calculate imbalance ratio
    const imbalance = (bidVolume - askVolume) / totalVolume;
    const absImbalance = Math.abs(imbalance);

    if (absImbalance >= this.config.bookImbalanceThreshold) {
      const signal: MarketSignal = {
        id: `${symbol}_book_${Date.now()}`,
        type: 'book_imbalance',
        symbol,
        timestamp: Date.now(),
        magnitude: absImbalance,
        direction: imbalance > 0 ? 'up' : 'down',
        metadata: {
          imbalance: imbalance * 100
        },
        priority: this.calculatePriority(absImbalance, this.config.bookImbalanceThreshold),
        duration: this.config.minSignalDuration * 1000
      };

      this.registerSignal(signal);
      return signal;
    }

    return null;
  }

  /**
   * Register news event signal
   * External trigger for news-based signals
   */
  registerNewsEvent(
    symbol: string,
    headline: string,
    sentiment: number
  ): MarketSignal {
    const signal: MarketSignal = {
      id: `${symbol}_news_${Date.now()}`,
      type: 'news_event',
      symbol,
      timestamp: Date.now(),
      magnitude: Math.abs(sentiment),
      direction: sentiment > 0 ? 'up' : sentiment < 0 ? 'down' : 'neutral',
      metadata: {
        headline
      },
      priority: Math.min(10, Math.abs(sentiment) * 2),
      duration: this.config.minSignalDuration * 1500 // News gets longer duration
    };

    this.registerSignal(signal);
    return signal;
  }

  /**
   * Calculate signal priority (0-10 scale)
   * Higher magnitude relative to threshold = higher priority
   */
  private calculatePriority(magnitude: number, threshold: number): number {
    const ratio = magnitude / threshold;
    return Math.min(10, Math.round(ratio * 5));
  }

  /**
   * Check if symbol is in cooldown period
   */
  private checkCooldown(symbol: string): boolean {
    const lastSignal = this.lastSignalTime.get(symbol);
    if (!lastSignal) return true;

    const timeSinceLastSignal = Date.now() - lastSignal;
    return timeSinceLastSignal >= this.config.cooldownPeriod * 1000;
  }

  /**
   * Register new signal and manage active signals
   */
  private registerSignal(signal: MarketSignal): void {
    this.activeSignals.set(signal.id, signal);
    this.signalHistory.push(signal);
    this.lastSignalTime.set(signal.symbol, signal.timestamp);

    // Schedule signal expiration
    setTimeout(() => {
      this.activeSignals.delete(signal.id);
    }, signal.duration);

    // Keep history limited
    if (this.signalHistory.length > 1000) {
      this.signalHistory = this.signalHistory.slice(-500);
    }
  }

  /**
   * Get all active signals sorted by priority
   */
  getActiveSignals(): MarketSignal[] {
    return Array.from(this.activeSignals.values())
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get highest priority signal
   */
  getTopSignal(): MarketSignal | null {
    const signals = this.getActiveSignals();
    return signals.length > 0 ? signals[0] : null;
  }

  /**
   * Clear signal manually
   */
  clearSignal(signalId: string): void {
    this.activeSignals.delete(signalId);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SignalConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset baselines and history
   */
  reset(): void {
    this.activeSignals.clear();
    this.signalHistory = [];
    this.lastSignalTime.clear();
    this.baselineVolatility.clear();
    this.rollingMeans.clear();
  }

  /**
   * Get signal statistics
   */
  getStats(): {
    totalSignals: number;
    activeSignals: number;
    signalsByType: Record<string, number>;
    averageMagnitude: number;
  } {
    const signalsByType: Record<string, number> = {};

    for (const signal of this.signalHistory) {
      signalsByType[signal.type] = (signalsByType[signal.type] || 0) + 1;
    }

    const totalMagnitude = this.signalHistory.reduce(
      (sum, signal) => sum + signal.magnitude, 0
    );

    return {
      totalSignals: this.signalHistory.length,
      activeSignals: this.activeSignals.size,
      signalsByType,
      averageMagnitude: this.signalHistory.length > 0
        ? totalMagnitude / this.signalHistory.length
        : 0
    };
  }
}

/**
 * Signal aggregator for multi-symbol monitoring
 * Manages detection across entire dashboard
 */
export class SignalAggregator {
  private engines: Map<string, SignalDetectionEngine> = new Map();
  private globalConfig: SignalConfig;
  private signalCallback?: (signal: MarketSignal) => void;

  constructor(config: SignalConfig, onSignal?: (signal: MarketSignal) => void) {
    this.globalConfig = config;
    this.signalCallback = onSignal;
  }

  /**
   * Get or create detection engine for symbol
   */
  getEngine(symbol: string): SignalDetectionEngine {
    let engine = this.engines.get(symbol);
    if (!engine) {
      engine = new SignalDetectionEngine(this.globalConfig);
      this.engines.set(symbol, engine);
    }
    return engine;
  }

  /**
   * Process data and check for signals
   */
  processData(
    symbol: string,
    buffer: RingBuffer,
    currentPrice: number,
    orderBook?: OrderBookData
  ): MarketSignal | null {
    const engine = this.getEngine(symbol);

    // Check all signal types
    const priceSignal = engine.detectPriceSpike(symbol, buffer, currentPrice);
    if (priceSignal) {
      if (this.signalCallback) this.signalCallback(priceSignal);
      return priceSignal;
    }

    const volatilitySignal = engine.detectVolatilitySpike(symbol, buffer);
    if (volatilitySignal) {
      if (this.signalCallback) this.signalCallback(volatilitySignal);
      return volatilitySignal;
    }

    if (orderBook) {
      const bookSignal = engine.detectBookImbalance(symbol, orderBook);
      if (bookSignal) {
        if (this.signalCallback) this.signalCallback(bookSignal);
        return bookSignal;
      }
    }

    return null;
  }

  /**
   * Get all active signals across all symbols
   */
  getAllActiveSignals(): MarketSignal[] {
    const allSignals: MarketSignal[] = [];

    for (const engine of this.engines.values()) {
      allSignals.push(...engine.getActiveSignals());
    }

    return allSignals.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get top signal across all symbols
   */
  getGlobalTopSignal(): MarketSignal | null {
    const signals = this.getAllActiveSignals();
    return signals.length > 0 ? signals[0] : null;
  }

  /**
   * Update global configuration
   */
  updateConfig(config: Partial<SignalConfig>): void {
    this.globalConfig = { ...this.globalConfig, ...config };

    // Update all engines
    for (const engine of this.engines.values()) {
      engine.updateConfig(config);
    }
  }

  /**
   * Reset all engines
   */
  resetAll(): void {
    for (const engine of this.engines.values()) {
      engine.reset();
    }
  }
}