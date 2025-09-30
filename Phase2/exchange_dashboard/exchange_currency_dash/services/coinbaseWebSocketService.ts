/**
 * Coinbase WebSocket Service
 *
 * Provides real-time cryptocurrency price feeds from Coinbase Pro WebSocket API
 * Handles subscriptions, reconnections, and data transformation for chart display
 */

// Types for Coinbase WebSocket messages
export interface CoinbaseTickerMessage {
  type: 'ticker';
  sequence: number;
  product_id: string;
  price: string;
  open_24h: string;
  volume_24h: string;
  low_24h: string;
  high_24h: string;
  volume_30d: string;
  best_bid: string;
  best_ask: string;
  side: 'buy' | 'sell';
  time: string;
  trade_id: number;
  last_size: string;
}

export interface CoinbaseMatchMessage {
  type: 'match';
  trade_id: number;
  sequence: number;
  maker_order_id: string;
  taker_order_id: string;
  time: string;
  product_id: string;
  size: string;
  price: string;
  side: 'buy' | 'sell';
}

export interface CoinbaseL2UpdateMessage {
  type: 'l2update';
  product_id: string;
  time: string;
  changes: [string, string, string][];
}

export interface CoinbaseHeartbeatMessage {
  type: 'heartbeat';
  sequence: number;
  last_trade_id: number;
  product_id: string;
  time: string;
}

export type CoinbaseMessage =
  | CoinbaseTickerMessage
  | CoinbaseMatchMessage
  | CoinbaseL2UpdateMessage
  | CoinbaseHeartbeatMessage;

// Processed data types for the dashboard
export interface RealTimePrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceSubscriber {
  symbol: string;
  callback: (data: RealTimePrice) => void;
}

export interface OHLCVSubscriber {
  symbol: string;
  timeframe: string;
  callback: (data: OHLCVData) => void;
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

/**
 * Coinbase WebSocket Service Class
 */
class CoinbaseWebSocketService {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastLogTs: Map<string, number> = new Map();

  // Subscribers
  private priceSubscribers: Map<string, PriceSubscriber[]> = new Map();
  private ohlcvSubscribers: Map<string, OHLCVSubscriber[]> = new Map();

  // Data storage
  private latestPrices: Map<string, RealTimePrice> = new Map();
  private ohlcvBuffers: Map<string, Map<string, OHLCVData[]>> = new Map(); // symbol -> timeframe -> data[]
  private priceHistory: Map<string, number[]> = new Map(); // For smooth animations

  // Subscription tracking
  private subscribedSymbols: Set<string> = new Set();

  // WebSocket URL
  private readonly WS_URL = 'wss://ws-feed.exchange.coinbase.com';

  // Default crypto pairs to monitor
  private readonly DEFAULT_SYMBOLS = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'AVAX-USD', 'MATIC-USD',
    'ADA-USD', 'DOT-USD', 'LINK-USD', 'UNI-USD', 'XRP-USD'
  ];

  constructor() {
    this.initializeBuffers();
  }

  /**
   * Initialize OHLCV buffers for all timeframes
   */
  private initializeBuffers(): void {
    const timeframes: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

    this.DEFAULT_SYMBOLS.forEach(symbol => {
      const symbolBuffers = new Map<string, OHLCVData[]>();
      timeframes.forEach(tf => {
        symbolBuffers.set(tf, []);
      });
      this.ohlcvBuffers.set(symbol, symbolBuffers);
      this.priceHistory.set(symbol, []);
    });
  }

  /**
   * Connect to Coinbase WebSocket
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[CoinbaseWS] Connecting to Coinbase WebSocket...');
        this.ws = new WebSocket(this.WS_URL);

        this.ws.onopen = () => {
          console.log('[CoinbaseWS] Connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.subscribeToDefaultChannels();
          this.startHeartbeat();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log('[CoinbaseWS] Connection closed:', event.code, event.reason);
          this.isConnected = false;
          this.stopHeartbeat();
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[CoinbaseWS] WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('[CoinbaseWS] Failed to create connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to default channels
   */
  private subscribeToDefaultChannels(): void {
    if (!this.ws || !this.isConnected) return;

    const payload = {
      type: 'subscribe',
      product_ids: this.DEFAULT_SYMBOLS,
      channels: ['ticker', 'matches']
    };

    // Guard against CONNECTING state: send when OPEN or once on 'open'
    if (this.ws.readyState === WebSocket.OPEN) {
      console.log('[CoinbaseWS] Subscribing to channels immediately:', payload);
      this.ws.send(JSON.stringify(payload));
    } else {
      console.log('[CoinbaseWS] WebSocket not OPEN, deferring subscription until open');
      const sendOnOpen = () => {
        try {
          this.ws?.send(JSON.stringify(payload));
          console.log('[CoinbaseWS] Subscribed after open event');
        } catch (e) {
          console.warn('[CoinbaseWS] Failed to send subscribe after open:', e);
        }
      };
      this.ws?.addEventListener('open', sendOnOpen as any, { once: true } as any);
    }

    this.DEFAULT_SYMBOLS.forEach(symbol => {
      this.subscribedSymbols.add(symbol);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message: CoinbaseMessage = JSON.parse(data);

      switch (message.type) {
        case 'ticker':
          this.processTicker(message as CoinbaseTickerMessage);
          break;
        case 'match':
          this.processMatch(message as CoinbaseMatchMessage);
          break;
        case 'l2update':
          // Handle order book updates if needed
          break;
        case 'heartbeat':
          // Keep connection alive
          break;
        default:
          // Handle subscription confirmations and errors
          if ('type' in message && message.type === 'subscriptions') {
            console.log('[CoinbaseWS] Subscription confirmed');
          }
          break;
      }
    } catch (error) {
      console.error('[CoinbaseWS] Error parsing message:', error, data);
    }
  }

  /**
   * Process ticker messages for real-time price updates
   */
  private processTicker(ticker: CoinbaseTickerMessage): void {
    const price = parseFloat(ticker.price);
    const open24h = parseFloat(ticker.open_24h);
    const change24h = price - open24h;
    const changePercent24h = open24h ? (change24h / open24h) * 100 : 0;

    const priceData: RealTimePrice = {
      symbol: ticker.product_id,
      price,
      change24h,
      changePercent24h,
      volume24h: parseFloat(ticker.volume_24h),
      high24h: parseFloat(ticker.high_24h),
      low24h: parseFloat(ticker.low_24h),
      timestamp: new Date(ticker.time).getTime()
    };

    // Debug: throttle logs per symbol to avoid console spam
    try {
      const debugFlag = (() => {
        try {
          const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env?.VITE_DEBUG_MODE : undefined;
          const win = (typeof window !== 'undefined') ? (window as any).__ENV__?.VITE_DEBUG_MODE : undefined;
          const node = (typeof process !== 'undefined') ? (process as any).env?.VITE_DEBUG_MODE : undefined;
          return String(vite ?? win ?? node ?? '').toLowerCase() === 'true';
        } catch { return false; }
      })();
      if (debugFlag && (ticker.product_id === 'BTC-USD' || ticker.product_id === 'ETH-USD')) {
        const now = Date.now();
        const last = this.lastLogTs.get(ticker.product_id) || 0;
        if (now - last > 30000) { // 30s throttle
          console.debug(`[CoinbaseWS] ${ticker.product_id} ${price.toFixed(2)} (Δ24h ${(changePercent24h).toFixed(2)}%) @ ${new Date(priceData.timestamp).toLocaleTimeString()}`);
          this.lastLogTs.set(ticker.product_id, now);
        }
      }
    } catch {}

    // Store latest price
    this.latestPrices.set(ticker.product_id, priceData);

    // Update price history for smooth animations
    this.updatePriceHistory(ticker.product_id, price);

    // Notify price subscribers
    this.notifyPriceSubscribers(ticker.product_id, priceData);
  }

  /**
   * Process match messages for OHLCV data
   */
  private processMatch(match: CoinbaseMatchMessage): void {
    const price = parseFloat(match.price);
    const volume = parseFloat(match.size);
    const timestamp = new Date(match.time).getTime();

    // Update OHLCV buffers for all timeframes
    this.updateOHLCVBuffers(match.product_id, price, volume, timestamp);
  }

  /**
   * Update price history for smooth animations
   */
  private updatePriceHistory(symbol: string, price: number): void {
    let history = this.priceHistory.get(symbol) || [];
    history.push(price);

    // Keep only last 100 prices for animation
    if (history.length > 100) {
      history = history.slice(-100);
    }

    this.priceHistory.set(symbol, history);
  }

  /**
   * Update OHLCV buffers for multiple timeframes
   */
  private updateOHLCVBuffers(symbol: string, price: number, volume: number, timestamp: number): void {
    const symbolBuffers = this.ohlcvBuffers.get(symbol);
    if (!symbolBuffers) return;

    const timeframes: { tf: TimeFrame; interval: number }[] = [
      { tf: '1m', interval: 60 * 1000 },
      { tf: '5m', interval: 5 * 60 * 1000 },
      { tf: '15m', interval: 15 * 60 * 1000 },
      { tf: '1h', interval: 60 * 60 * 1000 },
      { tf: '4h', interval: 4 * 60 * 60 * 1000 },
      { tf: '1d', interval: 24 * 60 * 60 * 1000 }
    ];

    timeframes.forEach(({ tf, interval }) => {
      const buffer = symbolBuffers.get(tf) || [];
      const barTimestamp = Math.floor(timestamp / interval) * interval;

      // Find or create current bar
      let currentBar = buffer.find(bar => bar.timestamp === barTimestamp);

      if (!currentBar) {
        // Create new bar
        currentBar = {
          timestamp: barTimestamp,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volume
        };
        buffer.push(currentBar);

        // Keep only last 1000 bars per timeframe
        if (buffer.length > 1000) {
          buffer.shift();
        }
      } else {
        // Update existing bar
        currentBar.high = Math.max(currentBar.high, price);
        currentBar.low = Math.min(currentBar.low, price);
        currentBar.close = price;
        currentBar.volume += volume;
      }

      // Sort by timestamp
      buffer.sort((a, b) => a.timestamp - b.timestamp);
      symbolBuffers.set(tf, buffer);

      // Notify OHLCV subscribers
      this.notifyOHLCVSubscribers(symbol, tf, currentBar);
    });
  }

  /**
   * Notify price subscribers
   */
  private notifyPriceSubscribers(symbol: string, data: RealTimePrice): void {
    const subscribers = this.priceSubscribers.get(symbol);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        try {
          subscriber.callback(data);
        } catch (error) {
          console.error('[CoinbaseWS] Error in price subscriber:', error);
        }
      });
    }
  }

  /**
   * Notify OHLCV subscribers
   */
  private notifyOHLCVSubscribers(symbol: string, timeframe: string, data: OHLCVData): void {
    const key = `${symbol}:${timeframe}`;
    const subscribers = this.ohlcvSubscribers.get(key);
    if (subscribers) {
      subscribers.forEach(subscriber => {
        try {
          subscriber.callback(data);
        } catch (error) {
          console.error('[CoinbaseWS] Error in OHLCV subscriber:', error);
        }
      });
    }
  }

  /**
   * Subscribe to real-time price updates
   */
  subscribePriceUpdates(symbol: string, callback: (data: RealTimePrice) => void): () => void {
    let subscribers = this.priceSubscribers.get(symbol);
    if (!subscribers) {
      subscribers = [];
      this.priceSubscribers.set(symbol, subscribers);
    }

    const subscriber: PriceSubscriber = { symbol, callback };
    subscribers.push(subscriber);

    // Send current price if available
    const currentPrice = this.latestPrices.get(symbol);
    if (currentPrice) {
      callback(currentPrice);
    }

    // Return unsubscribe function
    return () => {
      const subscribers = this.priceSubscribers.get(symbol);
      if (subscribers) {
        const index = subscribers.findIndex(s => s.callback === callback);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to OHLCV data updates
   */
  subscribeOHLCVUpdates(
    symbol: string,
    timeframe: TimeFrame,
    callback: (data: OHLCVData) => void
  ): () => void {
    const key = `${symbol}:${timeframe}`;
    let subscribers = this.ohlcvSubscribers.get(key);
    if (!subscribers) {
      subscribers = [];
      this.ohlcvSubscribers.set(key, subscribers);
    }

    const subscriber: OHLCVSubscriber = { symbol, timeframe, callback };
    subscribers.push(subscriber);

    // Send current data if available
    const symbolBuffers = this.ohlcvBuffers.get(symbol);
    const buffer = symbolBuffers?.get(timeframe);
    if (buffer && buffer.length > 0) {
      callback(buffer[buffer.length - 1]);
    }

    // Return unsubscribe function
    return () => {
      const subscribers = this.ohlcvSubscribers.get(key);
      if (subscribers) {
        const index = subscribers.findIndex(s => s.callback === callback);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get historical OHLCV data
   */
  getHistoricalOHLCV(symbol: string, timeframe: TimeFrame, limit: number = 100): OHLCVData[] {
    const symbolBuffers = this.ohlcvBuffers.get(symbol);
    const buffer = symbolBuffers?.get(timeframe);
    if (!buffer) return [];

    return buffer.slice(-limit);
  }

  /**
   * Get latest price
   */
  getLatestPrice(symbol: string): RealTimePrice | null {
    return this.latestPrices.get(symbol) || null;
  }

  /**
   * Get price history for animations
   */
  getPriceHistory(symbol: string, limit: number = 50): number[] {
    const history = this.priceHistory.get(symbol) || [];
    return history.slice(-limit);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        // Coinbase doesn't require ping/pong, heartbeat messages are sent automatically
        console.log('[CoinbaseWS] Connection alive, subscribed to:', Array.from(this.subscribedSymbols));
      }
    }, 30000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[CoinbaseWS] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[CoinbaseWS] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('[CoinbaseWS] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    console.log('[CoinbaseWS] Disconnecting...');
    this.isConnected = false;

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Clear subscribers
    this.priceSubscribers.clear();
    this.ohlcvSubscribers.clear();
    this.subscribedSymbols.clear();
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    subscribedSymbols: string[];
    priceSubscribers: number;
    ohlcvSubscribers: number;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      subscribedSymbols: Array.from(this.subscribedSymbols),
      priceSubscribers: Array.from(this.priceSubscribers.values()).reduce((total, subs) => total + subs.length, 0),
      ohlcvSubscribers: Array.from(this.ohlcvSubscribers.values()).reduce((total, subs) => total + subs.length, 0),
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Add new symbol to subscription
   */
  addSymbol(symbol: string): void {
    if (this.subscribedSymbols.has(symbol) || !this.ws || !this.isConnected) {
      return;
    }

    const subscribeMessage = {
      type: 'subscribe',
      product_ids: [symbol],
      channels: ['ticker', 'matches']
    };

    this.ws.send(JSON.stringify(subscribeMessage));
    this.subscribedSymbols.add(symbol);

    // Initialize buffers for new symbol
    const timeframes: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
    const symbolBuffers = new Map<string, OHLCVData[]>();
    timeframes.forEach(tf => {
      symbolBuffers.set(tf, []);
    });
    this.ohlcvBuffers.set(symbol, symbolBuffers);
    this.priceHistory.set(symbol, []);
  }

  /**
   * Remove symbol from subscription
   */
  removeSymbol(symbol: string): void {
    if (!this.subscribedSymbols.has(symbol) || !this.ws || !this.isConnected) {
      return;
    }

    const unsubscribeMessage = {
      type: 'unsubscribe',
      product_ids: [symbol],
      channels: ['ticker', 'matches']
    };

    this.ws.send(JSON.stringify(unsubscribeMessage));
    this.subscribedSymbols.delete(symbol);

    // Clean up data
    this.latestPrices.delete(symbol);
    this.ohlcvBuffers.delete(symbol);
    this.priceHistory.delete(symbol);
    this.priceSubscribers.delete(symbol);
  }
}

// Export singleton instance
export const coinbaseWebSocketService = new CoinbaseWebSocketService();
export default coinbaseWebSocketService;