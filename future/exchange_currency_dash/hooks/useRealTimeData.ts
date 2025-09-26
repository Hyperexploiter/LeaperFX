/**
 * useRealTimeData Hook
 *
 * React hook for consuming real-time cryptocurrency data with built-in state management
 * Provides seamless integration with the ExchangeDashboard components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import realTimeDataManager, { MarketState } from '../services/realTimeDataManager';
import animationBufferService from '../services/animationBufferService';
import { RealTimePrice, TimeFrame } from '../services/coinbaseWebSocketService';
import { MarketItemData, RechartsDataPoint } from '../services/chartDataAdapter';

export interface UseRealTimeDataOptions {
  symbols?: string[];
  timeframes?: TimeFrame[];
  enableAnimations?: boolean;
  autoInitialize?: boolean;
}

export interface UseRealTimeDataReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Data
  prices: Map<string, RealTimePrice>;
  marketItems: MarketItemData[];

  // Methods
  initialize: () => Promise<boolean>;
  refresh: () => Promise<void>;
  addSymbol: (displaySymbol: string, wsSymbol: string, timeframes?: TimeFrame[]) => Promise<void>;
  removeSymbol: (symbol: string) => void;
  getChartData: (symbol: string, timeframe: TimeFrame) => RechartsDataPoint[];
  getCurrentPrice: (symbol: string) => RealTimePrice | null;
  getAnimatedPrice: (symbol: string, callback: (price: number) => void) => () => void;

  // Statistics
  statistics: {
    subscriptions: number;
    pricesTracked: number;
    totalOHLCVBars: number;
    connectionStatus: string;
    lastUpdate: string;
  };
}

export interface UseCryptoDataReturn {
  cryptoData: MarketItemData[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseAnimatedPriceOptions {
  symbol: string;
  enableAnimation?: boolean;
  animationDuration?: number;
  smoothingFactor?: number;
}

export interface UseAnimatedPriceReturn {
  price: number | null;
  previousPrice: number | null;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  isAnimating: boolean;
}

/**
 * Main real-time data hook
 */
export function useRealTimeData(options: UseRealTimeDataOptions = {}): UseRealTimeDataReturn {
  const {
    symbols = [],
    timeframes = ['1m', '5m', '15m', '1h'],
    enableAnimations = true,
    autoInitialize = true
  } = options;

  const [state, setState] = useState<MarketState>({
    prices: new Map(),
    ohlcvData: new Map(),
    chartData: new Map(),
    marketItems: new Map(),
    connectionStatus: 'disconnected',
    lastUpdate: Date.now()
  });

  const [connectionError, setConnectionError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const initializationRef = useRef<Promise<boolean> | null>(null);

  // Initialize real-time data manager
  const initialize = useCallback(async (): Promise<boolean> => {
    if (initializationRef.current) {
      return initializationRef.current;
    }

    initializationRef.current = (async () => {
      try {
        setConnectionError(null);

        // Subscribe to state updates
        unsubscribeRef.current = realTimeDataManager.subscribeToState((newState) => {
          setState(newState);
        });

        const success = await realTimeDataManager.initialize();

        if (!success) {
          setConnectionError('Failed to initialize real-time data connection');
          return false;
        }

        // Add custom symbols if provided
        for (const symbol of symbols) {
          const wsSymbol = symbol.replace('/CAD', '-USD');
          await realTimeDataManager.addSymbol(symbol, wsSymbol, timeframes);
        }

        return true;
      } catch (error) {
        console.error('[useRealTimeData] Initialization error:', error);
        setConnectionError(error instanceof Error ? error.message : 'Unknown error');
        return false;
      }
    })();

    return initializationRef.current;
  }, [symbols, timeframes]);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [autoInitialize, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setConnectionError(null);
      await realTimeDataManager.refresh();
    } catch (error) {
      console.error('[useRealTimeData] Refresh error:', error);
      setConnectionError(error instanceof Error ? error.message : 'Refresh failed');
    }
  }, []);

  const addSymbol = useCallback(async (
    displaySymbol: string,
    wsSymbol: string,
    symbolTimeframes?: TimeFrame[]
  ): Promise<void> => {
    try {
      await realTimeDataManager.addSymbol(displaySymbol, wsSymbol, symbolTimeframes || timeframes);
    } catch (error) {
      console.error('[useRealTimeData] Add symbol error:', error);
      throw error;
    }
  }, [timeframes]);

  const removeSymbol = useCallback((symbol: string): void => {
    realTimeDataManager.removeSymbol(symbol);
  }, []);

  const getChartData = useCallback((symbol: string, timeframe: TimeFrame): RechartsDataPoint[] => {
    return realTimeDataManager.getChartData(symbol, timeframe);
  }, []);

  const getCurrentPrice = useCallback((symbol: string): RealTimePrice | null => {
    return realTimeDataManager.getCurrentPrice(symbol);
  }, []);

  const getAnimatedPrice = useCallback((
    symbol: string,
    callback: (price: number) => void
  ): (() => void) => {
    if (!enableAnimations) {
      const price = state.prices.get(symbol);
      if (price) callback(price.price);
      return () => {};
    }

    return animationBufferService.subscribe(symbol, callback);
  }, [enableAnimations, state.prices]);

  return {
    isConnected: state.connectionStatus === 'connected',
    isConnecting: state.connectionStatus === 'connecting',
    connectionError,
    prices: state.prices,
    marketItems: Array.from(state.marketItems.values()),
    initialize,
    refresh,
    addSymbol,
    removeSymbol,
    getChartData,
    getCurrentPrice,
    getAnimatedPrice,
    statistics: realTimeDataManager.getStatistics()
  };
}

/**
 * Hook specifically for crypto data in the dashboard
 */
export function useCryptoData(): UseCryptoDataReturn {
  const { marketItems, isConnected, connectionError, initialize, refresh } = useRealTimeData({
    autoInitialize: true,
    enableAnimations: true
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
      setIsLoading(false);
    }
  }, [isConnected]);

  const cryptoRefresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await refresh();
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  return {
    cryptoData: marketItems.filter(item =>
      ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'ADA', 'DOT', 'LINK', 'UNI', 'XRP'].includes(
        item.name
      )
    ),
    isLoading,
    error: connectionError,
    refresh: cryptoRefresh
  };
}

/**
 * Hook for animated price updates
 */
export function useAnimatedPrice(options: UseAnimatedPriceOptions): UseAnimatedPriceReturn {
  const { symbol, enableAnimation = true, animationDuration = 800, smoothingFactor = 0.3 } = options;

  const [price, setPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [change, setChange] = useState(0);
  const [changePercent, setChangePercent] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [isAnimating, setIsAnimating] = useState(false);

  const { getCurrentPrice, getAnimatedPrice } = useRealTimeData({ autoInitialize: true });

  useEffect(() => {
    if (!enableAnimation) {
      const currentPrice = getCurrentPrice(symbol);
      if (currentPrice) {
        setPrice(currentPrice.price);
        setChange(currentPrice.change24h);
        setChangePercent(currentPrice.changePercent24h);
        setTrend(currentPrice.changePercent24h >= 0 ? 'up' : 'down');
      }
      return;
    }

    // Update animation config
    animationBufferService.updateConfig({
      duration: animationDuration,
      smoothingFactor
    });

    const unsubscribe = getAnimatedPrice(symbol, (animatedPrice) => {
      setPreviousPrice(price);
      setPrice(animatedPrice);

      // Update trend
      if (price !== null) {
        const priceDiff = animatedPrice - price;
        setChange(priceDiff);
        setChangePercent(price !== 0 ? (priceDiff / price) * 100 : 0);
        setTrend(priceDiff > 0 ? 'up' : priceDiff < 0 ? 'down' : 'neutral');
      }

      setIsAnimating(animationBufferService.isAnimating(symbol));
    });

    return unsubscribe;
  }, [symbol, enableAnimation, animationDuration, smoothingFactor, getCurrentPrice, getAnimatedPrice, price]);

  return {
    price,
    previousPrice,
    change,
    changePercent,
    trend,
    isAnimating
  };
}

/**
 * Hook for chart data with automatic timeframe switching
 */
export function useChartData(symbol: string, defaultTimeframe: TimeFrame = '15m') {
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeFrame>(defaultTimeframe);
  const { getChartData, isConnected } = useRealTimeData({ autoInitialize: true });

  const chartData = getChartData(symbol, currentTimeframe);

  const switchTimeframe = useCallback((newTimeframe: TimeFrame) => {
    setCurrentTimeframe(newTimeframe);
  }, []);

  return {
    chartData,
    currentTimeframe,
    switchTimeframe,
    availableTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d'] as TimeFrame[],
    isConnected
  };
}

/**
 * Hook for market statistics and health monitoring
 */
export function useMarketHealth() {
  const { statistics, isConnected, connectionError } = useRealTimeData({ autoInitialize: true });
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'unhealthy'>('unhealthy');

  useEffect(() => {
    if (!isConnected) {
      setHealth('unhealthy');
    } else if (connectionError) {
      setHealth('degraded');
    } else if (statistics.pricesTracked > 0) {
      setHealth('healthy');
    } else {
      setHealth('degraded');
    }
  }, [isConnected, connectionError, statistics.pricesTracked]);

  return {
    health,
    isConnected,
    error: connectionError,
    statistics,
    lastUpdate: statistics.lastUpdate
  };
}

export default useRealTimeData;