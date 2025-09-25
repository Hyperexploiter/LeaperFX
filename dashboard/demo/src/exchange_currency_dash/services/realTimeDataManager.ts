/**
 * Real-Time Data Manager
 *
 * Centralized state management for real-time price data with multi-timeframe support
 * Integrates WebSocket services, animation buffers, and chart adapters
 */

import coinbaseWebSocketService, { RealTimePrice, OHLCVData, TimeFrame } from './coinbaseWebSocketService';
import chartDataAdapter, { RechartsDataPoint, MarketItemData } from './chartDataAdapter';
import animationBufferService from './animationBufferService';
import errorHandlingService from './errorHandlingService';

export interface SymbolSubscription {
  symbol: string;
  timeframes: TimeFrame[];
  priceCallback?: (price: RealTimePrice) => void;
  ohlcvCallbacks?: Map<TimeFrame, (data: OHLCVData) => void>;
}

export interface MarketState {
  prices: Map<string, RealTimePrice>;
  ohlcvData: Map<string, Map<TimeFrame, OHLCVData[]>>;
  chartData: Map<string, Map<TimeFrame, RechartsDataPoint[]>>;
  marketItems: Map<string, MarketItemData>;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: number;
}

export interface DataManagerConfig {
  maxHistoryPoints: number;
  animationDuration: number;
  smoothingFactor: number;
  reconnectAttempts: number;
  updateFrequency: number;
}

/**
 * Real-Time Data Manager Class
 */
class RealTimeDataManager {
  private subscriptions: Map<string, SymbolSubscription> = new Map();
  private unsubscribeFunctions: Map<string, (() => void)[]> = new Map();
  private state: MarketState;
  private stateCallbacks: ((state: MarketState) => void)[] = [];
  private isInitialized: boolean = false;

  // Configuration
  private config: DataManagerConfig = {
    maxHistoryPoints: 100,
    animationDuration: 800,
    smoothingFactor: 0.3,
    reconnectAttempts: 5,
    updateFrequency: 1000 // 1 second state broadcast
  };

  // State broadcasting
  private stateUpdateTimer: NodeJS.Timeout | null = null;

  // Crypto symbol mapping
  private cryptoSymbolMap: Map<string, string> = new Map([
    ['BTC/CAD', 'BTC-USD'],
    ['ETH/CAD', 'ETH-USD'],
    ['SOL/CAD', 'SOL-USD'],
    ['AVAX/CAD', 'AVAX-USD'],
    ['MATIC/CAD', 'MATIC-USD'],
    ['ADA/CAD', 'ADA-USD'],
    ['DOT/CAD', 'DOT-USD'],
    ['LINK/CAD', 'LINK-USD'],
    ['UNI/CAD', 'UNI-USD'],
    ['XRP/CAD', 'XRP-USD']
  ]);

  constructor() {
    this.state = {
      prices: new Map(),
      ohlcvData: new Map(),
      chartData: new Map(),
      marketItems: new Map(),
      connectionStatus: 'disconnected',
      lastUpdate: Date.now()
    };
  }

  /**
   * Initialize the data manager
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      console.log('[RealTimeDataManager] Initializing...');

      // Update service health
      errorHandlingService.updateServiceHealth('data-manager', 'healthy');

      // Connect to Coinbase WebSocket
      this.state.connectionStatus = 'connecting';
      await coinbaseWebSocketService.connect();
      this.state.connectionStatus = 'connected';

      // Update connection health
      errorHandlingService.updateServiceHealth('coinbase-ws', 'healthy');

      // Initialize default subscriptions
      await this.initializeDefaultSubscriptions();

      // Start state broadcasting
      this.startStateBroadcast();

      this.isInitialized = true;
      console.log('[RealTimeDataManager] Initialized successfully');

      return true;
    } catch (error) {
      console.error('[RealTimeDataManager] Initialization failed:', error);
      this.state.connectionStatus = 'error';

      // Report error to error handling service
      errorHandlingService.reportError(
        'data-manager',
        'connection',
        `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'critical'
      );

      return false;
    }
  }

  /**
   * Initialize default cryptocurrency subscriptions
   */
  private async initializeDefaultSubscriptions(): Promise<void> {
    const defaultTimeframes: TimeFrame[] = ['1m', '5m', '15m', '1h'];

    for (const [displaySymbol, wsSymbol] of this.cryptoSymbolMap.entries()) {
      await this.subscribeToSymbol(displaySymbol, wsSymbol, defaultTimeframes);
    }
  }

  /**
   * Subscribe to a symbol with multiple timeframes
   */
  async subscribeToSymbol(
    displaySymbol: string,
    wsSymbol: string,
    timeframes: TimeFrame[]
  ): Promise<void> {
    if (this.subscriptions.has(displaySymbol)) {
      console.warn(`[RealTimeDataManager] Already subscribed to ${displaySymbol}`);
      return;
    }

    const subscription: SymbolSubscription = {
      symbol: wsSymbol,
      timeframes,
      ohlcvCallbacks: new Map()
    };

    // Set up price subscription
    const priceUnsubscribe = coinbaseWebSocketService.subscribePriceUpdates(
      wsSymbol,
      (priceData: RealTimePrice) => this.handlePriceUpdate(displaySymbol, priceData)
    );

    // Set up OHLCV subscriptions for each timeframe
    const ohlcvUnsubscribes: (() => void)[] = [priceUnsubscribe];

    for (const timeframe of timeframes) {
      const ohlcvUnsubscribe = coinbaseWebSocketService.subscribeOHLCVUpdates(
        wsSymbol,
        timeframe,
        (ohlcvData: OHLCVData) => this.handleOHLCVUpdate(displaySymbol, timeframe, ohlcvData)
      );

      ohlcvUnsubscribes.push(ohlcvUnsubscribe);
    }

    // Store subscription and unsubscribe functions
    this.subscriptions.set(displaySymbol, subscription);
    this.unsubscribeFunctions.set(displaySymbol, ohlcvUnsubscribes);

    console.log(`[RealTimeDataManager] Subscribed to ${displaySymbol} (${wsSymbol})`);
  }

  /**
   * Handle real-time price updates
   */
  private handlePriceUpdate(displaySymbol: string, priceData: RealTimePrice): void {
    try {
      // Store price data
      this.state.prices.set(displaySymbol, priceData);

      // Convert to CAD (simplified - in production, use real FX rates)
      const cadPrice = priceData.price * 1.35; // Approximate USD to CAD conversion

      const cadPriceData: RealTimePrice = {
        ...priceData,
        price: cadPrice,
        high24h: priceData.high24h * 1.35,
        low24h: priceData.low24h * 1.35
      };

      // Generate market item data
      const marketItem = chartDataAdapter.transformToMarketItemData(
        cadPriceData,
        displaySymbol.replace('/CAD', '')
      );
      this.state.marketItems.set(displaySymbol, marketItem);

      // Animate price change
      const currentPrice = animationBufferService.getSmoothedPrice(displaySymbol);
      animationBufferService.animatePrice(
        displaySymbol,
        cadPrice,
        currentPrice || undefined,
        {
          duration: this.config.animationDuration,
          easing: 'easeOutCubic',
          smoothingFactor: this.config.smoothingFactor
        }
      );

      // Update service health on successful price update
      errorHandlingService.updateServiceHealth('data-manager', 'healthy');

      this.updateStateTimestamp();
    } catch (error) {
      console.error(`[RealTimeDataManager] Error handling price update for ${displaySymbol}:`, error);
      errorHandlingService.reportError(
        'data-manager',
        'data',
        `Price update failed for ${displaySymbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { symbol: displaySymbol, priceData },
        'medium'
      );
    }
  }

  /**
   * Handle OHLCV data updates
   */
  private handleOHLCVUpdate(
    displaySymbol: string,
    timeframe: TimeFrame,
    ohlcvData: OHLCVData
  ): void {
    // Initialize symbol data if not exists
    if (!this.state.ohlcvData.has(displaySymbol)) {
      this.state.ohlcvData.set(displaySymbol, new Map());
      this.state.chartData.set(displaySymbol, new Map());
    }

    const symbolOHLCV = this.state.ohlcvData.get(displaySymbol)!;
    const symbolCharts = this.state.chartData.get(displaySymbol)!;

    // Update OHLCV data
    let timeframeData = symbolOHLCV.get(timeframe) || [];

    // Find existing bar or add new one
    const existingIndex = timeframeData.findIndex(bar => bar.timestamp === ohlcvData.timestamp);
    if (existingIndex >= 0) {
      timeframeData[existingIndex] = ohlcvData;
    } else {
      timeframeData.push(ohlcvData);
      timeframeData.sort((a, b) => a.timestamp - b.timestamp);
    }

    // Keep only last N points
    if (timeframeData.length > this.config.maxHistoryPoints) {
      timeframeData = timeframeData.slice(-this.config.maxHistoryPoints);
    }

    symbolOHLCV.set(timeframe, timeframeData);

    // Generate chart data
    const chartData = chartDataAdapter.generateBloombergChartData(
      timeframeData,
      timeframe,
      this.config.maxHistoryPoints
    );

    symbolCharts.set(timeframe, chartData);

    this.updateStateTimestamp();
  }

  /**
   * Subscribe to state changes
   */
  subscribeToState(callback: (state: MarketState) => void): () => void {
    this.stateCallbacks.push(callback);

    // Send current state
    callback({ ...this.state });

    // Return unsubscribe function
    return () => {
      const index = this.stateCallbacks.indexOf(callback);
      if (index >= 0) {
        this.stateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Start state broadcasting
   */
  private startStateBroadcast(): void {
    if (this.stateUpdateTimer) return;

    this.stateUpdateTimer = setInterval(() => {
      this.broadcastState();
    }, this.config.updateFrequency);
  }

  /**
   * Broadcast state to all subscribers
   */
  private broadcastState(): void {
    const stateSnapshot = { ...this.state };
    this.stateCallbacks.forEach(callback => {
      try {
        callback(stateSnapshot);
      } catch (error) {
        console.error('[RealTimeDataManager] Error in state callback:', error);
      }
    });
  }

  /**
   * Update state timestamp
   */
  private updateStateTimestamp(): void {
    this.state.lastUpdate = Date.now();
  }

  /**
   * Get current price for symbol
   */
  getCurrentPrice(symbol: string): RealTimePrice | null {
    return this.state.prices.get(symbol) || null;
  }

  /**
   * Get OHLCV data for symbol and timeframe
   */
  getOHLCVData(symbol: string, timeframe: TimeFrame): OHLCVData[] {
    const symbolData = this.state.ohlcvData.get(symbol);
    return symbolData?.get(timeframe) || [];
  }

  /**
   * Get chart data for symbol and timeframe
   */
  getChartData(symbol: string, timeframe: TimeFrame): RechartsDataPoint[] {
    const symbolData = this.state.chartData.get(symbol);
    return symbolData?.get(timeframe) || [];
  }

  /**
   * Get market item data
   */
  getMarketItem(symbol: string): MarketItemData | null {
    return this.state.marketItems.get(symbol) || null;
  }

  /**
   * Get all market items
   */
  getAllMarketItems(): MarketItemData[] {
    return Array.from(this.state.marketItems.values());
  }

  /**
   * Add new symbol subscription
   */
  async addSymbol(displaySymbol: string, wsSymbol: string, timeframes?: TimeFrame[]): Promise<void> {
    const effectiveTimeframes = timeframes || ['1m', '5m', '15m', '1h'];

    // Add to Coinbase WebSocket service
    coinbaseWebSocketService.addSymbol(wsSymbol);

    // Subscribe to updates
    await this.subscribeToSymbol(displaySymbol, wsSymbol, effectiveTimeframes);

    // Update symbol map
    this.cryptoSymbolMap.set(displaySymbol, wsSymbol);
  }

  /**
   * Remove symbol subscription
   */
  removeSymbol(displaySymbol: string): void {
    const subscription = this.subscriptions.get(displaySymbol);
    if (!subscription) return;

    // Unsubscribe from all callbacks
    const unsubscribes = this.unsubscribeFunctions.get(displaySymbol);
    if (unsubscribes) {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    }

    // Remove from Coinbase WebSocket service
    coinbaseWebSocketService.removeSymbol(subscription.symbol);

    // Clean up state
    this.subscriptions.delete(displaySymbol);
    this.unsubscribeFunctions.delete(displaySymbol);
    this.state.prices.delete(displaySymbol);
    this.state.ohlcvData.delete(displaySymbol);
    this.state.chartData.delete(displaySymbol);
    this.state.marketItems.delete(displaySymbol);
    this.cryptoSymbolMap.delete(displaySymbol);

    this.updateStateTimestamp();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): MarketState['connectionStatus'] {
    return this.state.connectionStatus;
  }

  /**
   * Get service statistics
   */
  getStatistics(): {
    subscriptions: number;
    pricesTracked: number;
    totalOHLCVBars: number;
    connectionStatus: string;
    lastUpdate: string;
    webSocketStats: any;
    animationStats: any;
  } {
    let totalBars = 0;
    this.state.ohlcvData.forEach(symbolData => {
      symbolData.forEach(timeframeData => {
        totalBars += timeframeData.length;
      });
    });

    return {
      subscriptions: this.subscriptions.size,
      pricesTracked: this.state.prices.size,
      totalOHLCVBars: totalBars,
      connectionStatus: this.state.connectionStatus,
      lastUpdate: new Date(this.state.lastUpdate).toISOString(),
      webSocketStats: coinbaseWebSocketService.getStatus(),
      animationStats: animationBufferService.getStats()
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DataManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update animation buffer config
    animationBufferService.updateConfig({
      duration: this.config.animationDuration,
      smoothingFactor: this.config.smoothingFactor
    });

    // Restart state broadcast with new frequency
    if (this.stateUpdateTimer && newConfig.updateFrequency) {
      clearInterval(this.stateUpdateTimer);
      this.stateUpdateTimer = null;
      this.startStateBroadcast();
    }
  }

  /**
   * Force refresh all data
   */
  async refresh(): Promise<void> {
    console.log('[RealTimeDataManager] Forcing refresh...');

    // Disconnect and reconnect WebSocket
    coinbaseWebSocketService.disconnect();

    this.state.connectionStatus = 'connecting';
    await coinbaseWebSocketService.connect();
    this.state.connectionStatus = 'connected';

    // Re-initialize subscriptions
    await this.initializeDefaultSubscriptions();

    this.updateStateTimestamp();
    this.broadcastState();
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    console.log('[RealTimeDataManager] Cleaning up...');

    // Stop state broadcasting
    if (this.stateUpdateTimer) {
      clearInterval(this.stateUpdateTimer);
      this.stateUpdateTimer = null;
    }

    // Unsubscribe from all symbols
    this.unsubscribeFunctions.forEach(unsubscribes => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    });

    // Disconnect WebSocket
    coinbaseWebSocketService.disconnect();

    // Clean up animation buffer
    animationBufferService.cleanup();

    // Clear state
    this.subscriptions.clear();
    this.unsubscribeFunctions.clear();
    this.stateCallbacks = [];
    this.isInitialized = false;

    this.state = {
      prices: new Map(),
      ohlcvData: new Map(),
      chartData: new Map(),
      marketItems: new Map(),
      connectionStatus: 'disconnected',
      lastUpdate: Date.now()
    };
  }

  /**
   * Get current state snapshot
   */
  getState(): MarketState {
    return { ...this.state };
  }

  /**
   * Check if manager is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.state.connectionStatus === 'connected';
  }
}

// Export singleton instance
export const realTimeDataManager = new RealTimeDataManager();
export default realTimeDataManager;