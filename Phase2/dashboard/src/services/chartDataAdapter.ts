/**
 * Chart Data Adapter Service
 *
 * Transforms real-time data from various sources into formats compatible with
 * different chart libraries (Recharts, TradingView, etc.)
 */

import { RealTimePrice, OHLCVData, TimeFrame } from './coinbaseWebSocketService';

// Chart data interfaces
export interface RechartsDataPoint {
  time: string | number;
  value: number;
  name?: string;
}

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceAnimationData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  smoothed: number[];
}

export interface MarketItemData {
  name: string;
  symbol: string;
  value: string;
  change: string;
  changePercent?: string;
  trend: 'up' | 'down';
  miniChartData: RechartsDataPoint[];
}

/**
 * Chart Data Adapter Class
 */
class ChartDataAdapter {
  private priceBuffers: Map<string, number[]> = new Map();
  private smoothingFactors: Map<TimeFrame, number> = new Map([
    ['1m', 0.3],
    ['5m', 0.4],
    ['15m', 0.5],
    ['1h', 0.6],
    ['4h', 0.7],
    ['1d', 0.8]
  ]);

  constructor() {
    this.initializeBuffers();
  }

  /**
   * Initialize price buffers for smoothing
   */
  private initializeBuffers(): void {
    const cryptoSymbols = [
      'BTC-USD', 'ETH-USD', 'SOL-USD', 'AVAX-USD', 'MATIC-USD',
      'ADA-USD', 'DOT-USD', 'LINK-USD', 'UNI-USD', 'XRP-USD'
    ];

    cryptoSymbols.forEach(symbol => {
      this.priceBuffers.set(symbol, []);
    });
  }

  /**
   * Transform real-time price data to Recharts format
   */
  transformPriceToRechartsData(
    prices: RealTimePrice[],
    maxPoints: number = 50
  ): RechartsDataPoint[] {
    return prices
      .slice(-maxPoints)
      .map((price, index) => ({
        time: index,
        value: price.price,
        name: new Date(price.timestamp).toLocaleTimeString()
      }));
  }

  /**
   * Transform OHLCV data to candlestick format
   */
  transformOHLCVToCandlestick(ohlcvData: OHLCVData[]): CandlestickData[] {
    return ohlcvData.map(data => ({
      time: data.timestamp,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume
    }));
  }

  /**
   * Generate smooth price animation data
   */
  generatePriceAnimationData(
    symbol: string,
    currentPrice: RealTimePrice,
    previousPrice?: RealTimePrice
  ): PriceAnimationData {
    const buffer = this.priceBuffers.get(symbol) || [];
    const smoothingFactor = 0.3; // EMA smoothing factor

    // Add current price to buffer
    buffer.push(currentPrice.price);
    if (buffer.length > 100) {
      buffer.shift(); // Keep only last 100 prices
    }
    this.priceBuffers.set(symbol, buffer);

    // Generate smoothed data using EMA
    const smoothed: number[] = [];
    if (buffer.length > 0) {
      smoothed[0] = buffer[0];
      for (let i = 1; i < buffer.length; i++) {
        smoothed[i] = smoothingFactor * buffer[i] + (1 - smoothingFactor) * smoothed[i - 1];
      }
    }

    const previous = previousPrice?.price || currentPrice.price;
    const change = currentPrice.price - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      current: currentPrice.price,
      previous,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      smoothed
    };
  }

  /**
   * Generate mini chart data for market cards
   */
  generateMiniChartData(
    symbol: string,
    trend: 'up' | 'down',
    points: number = 20
  ): RechartsDataPoint[] {
    const buffer = this.priceBuffers.get(symbol) || [];

    if (buffer.length >= points) {
      // Use real data if available
      return buffer.slice(-points).map((price, index) => ({
        time: index,
        value: price
      }));
    } else {
      // Generate synthetic data for demonstration
      const baseValue = buffer.length > 0 ? buffer[buffer.length - 1] : 100;
      const data: RechartsDataPoint[] = [];

      for (let i = 0; i < points; i++) {
        const progress = i / (points - 1);
        const trendFactor = trend === 'up' ? progress * 0.05 : -progress * 0.05;
        const noise = (Math.random() - 0.5) * 0.02;
        const value = baseValue * (1 + trendFactor + noise);

        data.push({
          time: i,
          value: Math.max(0, value)
        });
      }

      return data;
    }
  }

  /**
   * Transform real-time price to market item data
   */
  transformToMarketItemData(
    priceData: RealTimePrice,
    displayName?: string
  ): MarketItemData {
    const trend = priceData.changePercent24h >= 0 ? 'up' : 'down';
    const miniChartData = this.generateMiniChartData(priceData.symbol, trend);

    return {
      name: displayName || priceData.symbol.replace('-USD', '').replace('-CAD', ''),
      symbol: priceData.symbol.replace('-USD', '/CAD').replace('-', '/'),
      value: this.formatPrice(priceData.price),
      change: this.formatChange(priceData.changePercent24h),
      changePercent: `${Math.abs(priceData.changePercent24h).toFixed(2)}%`,
      trend,
      miniChartData
    };
  }

  /**
   * Format price for display
   */
  private formatPrice(price: number): string {
    if (price >= 1000) {
      return price.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } else if (price >= 1) {
      return price.toFixed(2);
    } else {
      return price.toFixed(4);
    }
  }

  /**
   * Format price change for display
   */
  private formatChange(changePercent: number): string {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}`;
  }

  /**
   * Generate Bloomberg Terminal style chart data
   */
  generateBloombergChartData(
    ohlcvData: OHLCVData[],
    timeframe: TimeFrame,
    maxPoints: number = 100
  ): RechartsDataPoint[] {
    const data = ohlcvData.slice(-maxPoints);
    const smoothingFactor = this.smoothingFactors.get(timeframe) || 0.5;

    if (data.length === 0) return [];

    // Apply EMA smoothing for Bloomberg-style presentation
    const smoothedData: RechartsDataPoint[] = [];
    let ema = data[0].close;

    data.forEach((bar, index) => {
      ema = smoothingFactor * bar.close + (1 - smoothingFactor) * ema;

      smoothedData.push({
        time: this.formatTimeLabel(bar.timestamp, timeframe),
        value: ema,
        name: new Date(bar.timestamp).toLocaleString()
      });
    });

    return smoothedData;
  }

  /**
   * Format time label based on timeframe
   */
  private formatTimeLabel(timestamp: number, timeframe: TimeFrame): string {
    const date = new Date(timestamp);

    switch (timeframe) {
      case '1m':
      case '5m':
      case '15m':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '1h':
      case '4h':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
               date.toLocaleTimeString([], { hour: '2-digit' });
      case '1d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  }

  /**
   * Generate currency exchange rate chart data
   */
  generateCurrencyChartData(
    startRate: number,
    endRate: number,
    points: number = 12
  ): RechartsDataPoint[] {
    const data: RechartsDataPoint[] = [];

    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const linearValue = startRate + (endRate - startRate) * progress;

      // Add Bloomberg-style smooth wave movement
      const waveOffset = Math.sin(progress * Math.PI * 2) * (Math.abs(endRate - startRate) * 0.08);
      const smoothJitter = (i > 0 && i < points - 1) ?
        (Math.random() - 0.5) * (Math.abs(endRate - startRate) * 0.05) : 0;

      data.push({
        time: `p${i}`,
        value: linearValue + waveOffset + smoothJitter
      });
    }

    return data;
  }

  /**
   * Create animated price transition data
   */
  createAnimatedTransition(
    fromPrice: number,
    toPrice: number,
    steps: number = 30
  ): number[] {
    const transition: number[] = [];
    const difference = toPrice - fromPrice;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      // Use easing function for smooth animation
      const easedProgress = this.easeOutCubic(progress);
      const currentPrice = fromPrice + (difference * easedProgress);
      transition.push(currentPrice);
    }

    return transition;
  }

  /**
   * Easing function for smooth animations
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Calculate volume-weighted average price (VWAP)
   */
  calculateVWAP(ohlcvData: OHLCVData[]): number {
    if (ohlcvData.length === 0) return 0;

    let totalVolumePrice = 0;
    let totalVolume = 0;

    ohlcvData.forEach(bar => {
      const typicalPrice = (bar.high + bar.low + bar.close) / 3;
      totalVolumePrice += typicalPrice * bar.volume;
      totalVolume += bar.volume;
    });

    return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
  }

  /**
   * Calculate simple moving average
   */
  calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }

    return sma;
  }

  /**
   * Calculate exponential moving average
   */
  calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    if (prices.length === 0) return ema;

    // First EMA value is the first price
    ema[0] = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Generate tick chart data for high-frequency updates
   */
  generateTickChart(
    prices: number[],
    timestamps: number[],
    maxTicks: number = 1000
  ): RechartsDataPoint[] {
    const ticks = Math.min(prices.length, maxTicks);
    const data: RechartsDataPoint[] = [];

    for (let i = Math.max(0, prices.length - ticks); i < prices.length; i++) {
      data.push({
        time: new Date(timestamps[i]).toLocaleTimeString(),
        value: prices[i]
      });
    }

    return data;
  }

  /**
   * Clear buffers (useful for memory management)
   */
  clearBuffers(): void {
    this.priceBuffers.clear();
    this.initializeBuffers();
  }

  /**
   * Get buffer statistics
   */
  getBufferStats(): { [symbol: string]: { count: number; latest: number | null } } {
    const stats: { [symbol: string]: { count: number; latest: number | null } } = {};

    this.priceBuffers.forEach((buffer, symbol) => {
      stats[symbol] = {
        count: buffer.length,
        latest: buffer.length > 0 ? buffer[buffer.length - 1] : null
      };
    });

    return stats;
  }
}

// Export singleton instance
export const chartDataAdapter = new ChartDataAdapter();
export default chartDataAdapter;