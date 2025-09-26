/**
 * Unified Data Aggregator Service
 * Consolidates all market data feeds with proper CAD conversion
 * Handles forex, crypto, commodities, and indices with fallback logic
 */

import { INSTRUMENT_CATALOG, InstrumentDefinition, UPDATE_CADENCE_CONFIG } from '../config/instrumentCatalog';
import coinbaseWebSocketService from './coinbaseWebSocketService';
import realTimeDataManager from './realTimeDataManager';
import { fetchLatestRates } from '../../services/exchangeRateService';

interface MarketDataPoint {
  symbol: string;
  price: number;
  priceCAD: number;
  timestamp: number;
  source: string;
  change24h?: number;
  changePercent24h?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
}

interface DataSourceStatus {
  source: string;
  connected: boolean;
  lastUpdate: number;
  errorCount: number;
  health: 'healthy' | 'degraded' | 'error';
}

interface FXRateCache {
  [pair: string]: {
    rate: number;
    timestamp: number;
    ttl: number; // Time to live in ms
  };
}

/**
 * Unified Data Aggregator - Single source of truth for all market data
 */
class UnifiedDataAggregator {
  private instruments: Map<string, InstrumentDefinition> = new Map();
  private marketData: Map<string, MarketDataPoint> = new Map();
  private fxRateCache: FXRateCache = {};
  private dataSourceStatus: Map<string, DataSourceStatus> = new Map();
  private subscribers: Map<string, Set<(data: MarketDataPoint) => void>> = new Map();
  private updateTimers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  // Critical FX rates for CAD conversion
  private readonly CRITICAL_FX_PAIRS = ['USD/CAD', 'EUR/USD', 'GBP/USD'];
  private readonly FX_CACHE_TTL = 300000; // 5 minutes for FX rates
  private readonly FALLBACK_USD_CAD = 1.35; // Emergency fallback rate

  // WebSocket connections for different providers
  private wsConnections: Map<string, WebSocket> = new Map();

  // API endpoints (to be moved to .env in production)
  private API_ENDPOINTS!: { fxapi: string; twelvedata: string; alpaca: string; polygon: string; finnhub: string; };

  constructor() {
    // Initialize API endpoints from environment (Vite first), with sensible defaults
    this.API_ENDPOINTS = {
      fxapi: this.getEnv('VITE_FXAPI_URL') || 'https://api.fxapi.com/v1',
      twelvedata: this.getEnv('VITE_TWELVEDATA_URL') || 'https://api.twelvedata.com',
      alpaca: this.getEnv('VITE_ALPACA_URL') || 'https://data.alpaca.markets/v2',
      polygon: this.getEnv('VITE_POLYGON_URL') || 'https://api.polygon.io',
      finnhub: this.getEnv('VITE_FINNHUB_URL') || 'https://finnhub.io/api/v1'
    };

    // Load instruments into map for quick lookup
    INSTRUMENT_CATALOG.forEach(instrument => {
      this.instruments.set(instrument.symbol, instrument);
    });
  }

  // Resolve env with Vite (import.meta.env) first, then window.__ENV__, then process.env
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
   * Initialize all data sources
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[UnifiedDataAggregator] Initializing...');

    try {
      // 1. Initialize critical FX rates first
      await this.initializeFXRates();

      // 2. Connect to Coinbase for crypto (already exists)
      await this.connectCoinbase();

      // 3. Connect to forex data provider
      await this.connectForexProvider();

      // 4. Connect to commodities provider
      await this.connectCommoditiesProvider();

      // 5. Connect to indices provider
      await this.connectIndicesProvider();

      // 6. Start update schedulers
      this.startUpdateSchedulers();


      this.isInitialized = true;
      console.log('[UnifiedDataAggregator] Initialized successfully');
    } catch (error) {
      console.error('[UnifiedDataAggregator] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize critical FX rates for CAD conversion
   */
  private async initializeFXRates(): Promise<void> {
    console.log('[UnifiedDataAggregator] Fetching initial FX rates...');

    try {
      // Fetch live rates from CAD base
      const cadRates = await fetchLatestRates('CAD');

      if (cadRates) {
        // Populate all X/CAD pairs for every forex instrument in the catalog
        const now = Date.now();
        const seenPairs = new Set<string>();
        INSTRUMENT_CATALOG.forEach(inst => {
          if (inst.category === 'forex' && inst.quoteCurrency === 'CAD') {
            const base = inst.baseCurrency as keyof typeof cadRates;
            const cadBase = (cadRates as any)[base];
            if (typeof cadBase === 'number' && cadBase > 0) {
              const pair = `${inst.baseCurrency}/CAD`;
              this.fxRateCache[pair] = {
                rate: 1 / cadBase, // inverse of CAD/base
                timestamp: now,
                ttl: this.FX_CACHE_TTL
              };
              seenPairs.add(pair);
            }
          }
        });

        // Ensure critical majors are present even if not in catalog
        const ensure = (pair: string, invFrom?: number) => {
          if (!this.fxRateCache[pair]) {
            const [base] = pair.split('/');
            const v = invFrom ?? (1 / ((cadRates as any)[base] || 0));
            if (Number.isFinite(v) && v > 0) {
              this.fxRateCache[pair] = { rate: v, timestamp: now, ttl: this.FX_CACHE_TTL };
            }
          }
        };
        ensure('USD/CAD', 1 / ((cadRates as any).USD || 0.74));
        ensure('EUR/CAD', 1 / ((cadRates as any).EUR || 0.68));
        ensure('GBP/CAD', 1 / ((cadRates as any).GBP || 0.58));
        ensure('JPY/CAD', 1 / ((cadRates as any).JPY || 108));
        ensure('CHF/CAD', 1 / ((cadRates as any).CHF || 0.66));
        ensure('AUD/CAD', 1 / ((cadRates as any).AUD || 1.14));
        ensure('CNY/CAD', 1 / ((cadRates as any).CNY || 5.23));
        ensure('HKD/CAD', 1 / ((cadRates as any).HKD || 5.71));
        ensure('INR/CAD', 1 / ((cadRates as any).INR || 63.7));
        ensure('KRW/CAD', 1 / ((cadRates as any).KRW || 1012));
        ensure('THB/CAD', 1 / ((cadRates as any).THB || 23.56));
        ensure('AED/CAD', 1 / ((cadRates as any).AED || 2.68));
        ensure('SAR/CAD', 1 / ((cadRates as any).SAR || 2.73));
        ensure('TRY/CAD', 1 / ((cadRates as any).TRY || 29.6));
        ensure('MXN/CAD', 1 / ((cadRates as any).MXN || 13.53));
        ensure('BRL/CAD', 1 / ((cadRates as any).BRL || 3.95));
        ensure('NZD/CAD', 1 / ((cadRates as any).NZD || 1.22));
        ensure('ZAR/CAD', 1 / ((cadRates as any).ZAR || 12.89));

        // Also fetch USD rates for cross-rate calculations (e.g., EUR/USD)
        const usdRates = await fetchLatestRates('USD');
        if (usdRates) {
          this.fxRateCache['EUR/USD'] = {
            rate: usdRates.EUR || 0.92,
            timestamp: now,
            ttl: this.FX_CACHE_TTL
          };
          this.fxRateCache['GBP/USD'] = {
            rate: usdRates.GBP || 0.79,
            timestamp: now,
            ttl: this.FX_CACHE_TTL
          };
        }

        console.log('[UnifiedDataAggregator] Live FX rates loaded successfully');
      } else {
        // Fallback to hardcoded rates if API fails
        console.warn('[UnifiedDataAggregator] Using fallback FX rates');
        this.useFallbackRates();
      }
    } catch (error) {
      console.error('[UnifiedDataAggregator] Failed to fetch FX rates:', error);
      this.useFallbackRates();
    }
  }

  /**
   * Use fallback rates when API is unavailable
   */
  private useFallbackRates(): void {
    // Conservative, slightly stale but realistic CAD pairs to avoid 1.35 default
    const fallbackRates = {
      'USD/CAD': 1.35,
      'EUR/USD': 1.08,
      'GBP/USD': 1.27,
      'EUR/CAD': 1.46,
      'GBP/CAD': 1.71,
      'JPY/CAD': 0.0092,
      'CHF/CAD': 1.52,
      'AUD/CAD': 0.88,
      'CNY/CAD': 0.19,
      'HKD/CAD': 0.17,
      'INR/CAD': 0.016,
      'KRW/CAD': 0.0010,
      'THB/CAD': 0.043,
      'AED/CAD': 0.37,
      'SAR/CAD': 0.36,
      'TRY/CAD': 0.034,
      'MXN/CAD': 0.079,
      'BRL/CAD': 0.25,
      'NZD/CAD': 0.82,
      'ZAR/CAD': 0.078
    } as Record<string, number>;

    Object.entries(fallbackRates).forEach(([pair, rate]) => {
      this.fxRateCache[pair] = {
        rate,
        timestamp: Date.now(),
        ttl: this.FX_CACHE_TTL
      };
    });
  }

  /**
   * Connect to Coinbase WebSocket for crypto
   */
  private async connectCoinbase(): Promise<void> {
    const cryptoInstruments = this.getInstrumentsByCategory('crypto');

    for (const instrument of cryptoInstruments) {
      if (instrument.wsSymbol) {
        // Subscribe through existing Coinbase service
        coinbaseWebSocketService.subscribePriceUpdates(
          instrument.wsSymbol,
          (data) => this.handleCryptoUpdate(instrument, data)
        );
      }
    }

    this.updateSourceStatus('coinbase', 'healthy');
  }

  /**
   * Connect to forex data provider
   */
  private async connectForexProvider(): Promise<void> {
    // Placeholder for forex WebSocket/API connection
    // In production, implement actual connection to fxapi.com or similar
    console.log('[UnifiedDataAggregator] Connecting to forex provider...');

    // Simulate connection
    this.updateSourceStatus('fxapi', 'healthy');

    // Start polling for forex data
    const forexInstruments = this.getInstrumentsByCategory('forex');
    forexInstruments.forEach(instrument => {
      this.scheduleUpdate(instrument);
    });
  }

  /**
   * Connect to commodities data provider
   */
  private async connectCommoditiesProvider(): Promise<void> {
    console.log('[UnifiedDataAggregator] Connecting to commodities provider...');

    // Placeholder for commodities connection (twelvedata, etc.)
    this.updateSourceStatus('twelvedata', 'healthy');

    // Start polling for commodity data
    const commodityInstruments = this.getInstrumentsByCategory('commodity');
    commodityInstruments.forEach(instrument => {
      this.scheduleUpdate(instrument);
    });
  }

  /**
   * Connect to indices provider
   */
  private async connectIndicesProvider(): Promise<void> {
    console.log('[UnifiedDataAggregator] Connecting to indices provider...');

    // Placeholder for indices connection
    this.updateSourceStatus('alpaca', 'healthy');

    // Start polling for index data
    const indexInstruments = this.getInstrumentsByCategory('index');
    indexInstruments.forEach(instrument => {
      this.scheduleUpdate(instrument);
    });
  }

  /**
   * Handle crypto price update from Coinbase
   */
  private handleCryptoUpdate(instrument: InstrumentDefinition, data: any): void {
    const usdPrice = data.price;
    const cadRate = this.getCADRate('USD');
    const cadPrice = usdPrice * cadRate;

    const marketData: MarketDataPoint = {
      symbol: instrument.symbol,
      price: usdPrice,
      priceCAD: cadPrice,
      timestamp: data.timestamp || Date.now(),
      source: 'coinbase',
      change24h: data.change24h,
      changePercent24h: data.changePercent24h,
      volume24h: data.volume24h,
      high24h: data.high24h ? data.high24h * cadRate : undefined,
      low24h: data.low24h ? data.low24h * cadRate : undefined
    };

    // Stamp source as healthy on each update
    this.updateSourceStatus('coinbase', 'healthy');

    this.updateMarketData(instrument.symbol, marketData);
  }

  /**
   * Schedule periodic updates for an instrument
   */
  private scheduleUpdate(instrument: InstrumentDefinition): void {
    // Clear existing timer if any
    if (this.updateTimers.has(instrument.symbol)) {
      clearInterval(this.updateTimers.get(instrument.symbol)!);
    }

    // Calculate actual update frequency based on conditions
    const baseFrequency = instrument.updateFrequency;
    const adjustedFrequency = this.getAdjustedUpdateFrequency(baseFrequency);

    const timer = setInterval(() => {
      this.fetchInstrumentData(instrument);
    }, adjustedFrequency);

    this.updateTimers.set(instrument.symbol, timer);

    // Fetch initial data
    this.fetchInstrumentData(instrument);
  }

  /**
   * Fetch data for a specific instrument
   */
  private async fetchInstrumentData(instrument: InstrumentDefinition): Promise<void> {
    try {
      let rawPrice = 0; // in instrument's base currency unit (USD for commodities)
      let change24h: number | undefined;
      let changePercent24h: number | undefined;
      let volume24h: number | undefined;

      if (instrument.category === 'forex') {
        // Use cached FX rates for X/CAD pairs and cross rates
        const cached = this.fxRateCache[instrument.symbol];
        if (cached && this.isFXRateValid(cached)) {
          rawPrice = cached.rate;
        } else if (instrument.quoteCurrency === 'CAD') {
          rawPrice = this.getCADRate(instrument.baseCurrency);
        } else if (instrument.symbol.includes('/USD')) {
          const pair = instrument.symbol;
          const cache = this.fxRateCache[pair];
          if (cache) rawPrice = cache.rate;
        }
        // Mark FX source healthy
        this.updateSourceStatus('fxapi', 'healthy');
      } else if (instrument.category === 'commodity') {
        // Try TwelveData (price in USD)
        const apiKey = this.getEnv('VITE_TWELVEDATA_KEY');
        if (!apiKey) {
          // No key present: mark provider error so the status widget reflects reality
          this.handleDataSourceError('twelvedata');
        }
        if (apiKey && instrument.wsSymbol) {
          const symbol = /USD$/.test(instrument.wsSymbol) ? instrument.wsSymbol.replace('USD', '/USD') : instrument.wsSymbol;
          try {
            // First, try the simple price endpoint
            const url = `${this.API_ENDPOINTS.twelvedata}/price?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              const priceUSD = parseFloat(json?.price ?? json?.data?.price ?? '0');
              if (Number.isFinite(priceUSD) && priceUSD > 0) {
                rawPrice = priceUSD;
                this.updateSourceStatus('twelvedata', 'healthy');
              } else {
                this.handleDataSourceError('twelvedata');
              }
            } else {
              // Try time_series as a fallback
              this.handleDataSourceError('twelvedata');
              const tsUrl = `${this.API_ENDPOINTS.twelvedata}/time_series?symbol=${encodeURIComponent(symbol)}&interval=1min&outputsize=1&apikey=${apiKey}`;
              const tsRes = await fetch(tsUrl);
              if (tsRes.ok) {
                const tsJson = await tsRes.json();
                const close = parseFloat(tsJson?.values?.[0]?.close ?? tsJson?.data?.[0]?.close ?? '0');
                if (Number.isFinite(close) && close > 0) {
                  rawPrice = close;
                  this.updateSourceStatus('twelvedata', 'healthy');
                } else {
                  this.handleDataSourceError('twelvedata');
                }
              }
            }
          } catch (e) {
            // Mark degraded on exception
            this.handleDataSourceError('twelvedata');
          }
        }
        if (!rawPrice) {
          const mock = this.generateMockData(instrument);
          rawPrice = mock.price;
          change24h = mock.change24h;
          changePercent24h = mock.changePercent24h;
          volume24h = mock.volume24h;
        }

        // Apply unit conversion if metadata specifies conversionFactor (e.g., grams/kg)
        const cf = instrument.metadata?.conversionFactor;
        if (typeof cf === 'number' && cf > 0) {
          rawPrice = rawPrice * cf;
        }
      } else if (instrument.category === 'index') {
        // Special handling for Canadian bond yields
        if (instrument.subCategory === 'bond_yield') {
          try {
            // Bank of Canada Valet API: group bond_yields latest observation
            const url = `https://www.bankofcanada.ca/valet/observations/group/bond_yields?recent=1`;
            const res = await fetch(url);
            if (res.ok) {
              const json = await res.json();
              const obs = json?.observations?.[0] || {};
              // Try common keys; otherwise pick first numeric value
              const candidateKeys = Object.keys(obs).filter(k => k !== 'd');
              let val: number | null = null;
              for (const k of candidateKeys) {
                const v = parseFloat(obs[k]?.v ?? obs[k]);
                if (Number.isFinite(v)) { val = v; break; }
              }
              if (val !== null) {
                rawPrice = val; // already percentage
                this.updateSourceStatus('bankofcanada', 'healthy');
              } else {
                this.handleDataSourceError('bankofcanada');
              }
            } else {
              this.handleDataSourceError('bankofcanada');
            }
          } catch {
            this.handleDataSourceError('bankofcanada');
          }
        } else {
          // Try Alpaca first for US stocks/indices represented as tickers
          const alpacaKey = this.getEnv('VITE_ALPACA_KEY_ID') || this.getEnv('VITE_ALPACA_KEY');
          const alpacaSecret = this.getEnv('VITE_ALPACA_SECRET_KEY') || this.getEnv('VITE_ALPACA_SECRET');
          let gotReal = false;
          if (!alpacaKey || !alpacaSecret) {
            this.handleDataSourceError('alpaca');
          }
          try {
            const symbol = instrument.wsSymbol || instrument.symbol.replace('/CAD', '');
            if (alpacaKey && alpacaSecret && symbol) {
              const url = `${this.API_ENDPOINTS.alpaca}/stocks/${encodeURIComponent(symbol)}/quotes/latest`;
              const res = await fetch(url, {
                headers: {
                  'apca-api-key-id': alpacaKey,
                  'apca-api-secret-key': alpacaSecret
                }
              });
              if (res.ok) {
                const json = await res.json();
                const ap = parseFloat(json?.quote?.ap ?? json?.ap ?? '0');
                const bp = parseFloat(json?.quote?.bp ?? json?.bp ?? '0');
                const mid = (Number.isFinite(ap) && Number.isFinite(bp) && (ap > 0 || bp > 0)) ? ((ap || bp) + (bp || ap)) / 2 : 0;
                if (mid > 0) {
                  rawPrice = mid; // likely USD
                  this.updateSourceStatus('alpaca', 'healthy');
                  gotReal = true;
                } else {
                  this.handleDataSourceError('alpaca');
                }
              } else {
                this.handleDataSourceError('alpaca');
              }
            }
          } catch {
            this.handleDataSourceError('alpaca');
          }

          // Fallback to Polygon last trade if available
          if (!gotReal) {
            const polygonKey = this.getEnv('VITE_POLYGON_KEY');
            if (polygonKey) {
              try {
                const symbol = (instrument.wsSymbol || instrument.symbol.replace('/CAD', '')).toUpperCase();
                const url = `${this.API_ENDPOINTS.polygon}/v2/last/trade/${encodeURIComponent(symbol)}?apiKey=${polygonKey}`;
                const res = await fetch(url);
                if (res.ok) {
                  const json = await res.json();
                  const price = parseFloat(json?.results?.p ?? json?.price ?? '0');
                  if (Number.isFinite(price) && price > 0) {
                    rawPrice = price;
                    this.updateSourceStatus('polygon', 'healthy');
                    gotReal = true;
                  } else {
                    this.handleDataSourceError('polygon');
                  }
                } else {
                  this.handleDataSourceError('polygon');
                }
              } catch {
                this.handleDataSourceError('polygon');
              }
            }
          }

          if (!rawPrice) {
            const mock = this.generateMockData(instrument);
            rawPrice = mock.price;
            change24h = mock.change24h;
            changePercent24h = mock.changePercent24h;
            volume24h = mock.volume24h;
          }
        }
      } else {
        // Default mock
        const mock = this.generateMockData(instrument);
        rawPrice = mock.price;
        change24h = mock.change24h;
        changePercent24h = mock.changePercent24h;
        volume24h = mock.volume24h;
      }

      // Convert to CAD
      let priceCAD = this.convertToCAD(rawPrice, instrument.baseCurrency, instrument.category);

      // Apply unit rounding rules for commodities before display
      if (instrument.category === 'commodity') {
        let decimals: number | undefined = instrument.metadata?.roundingDecimals;
        if (typeof decimals !== 'number') {
          const unit = (instrument.metadata?.unit || '').toLowerCase();
          if (unit === 'gram' || unit === 'g') decimals = 2;
          else if (unit === 'kg' || unit === 'kilogram') decimals = 0;
          else if (unit === 'oz_t' || unit === 'ounce' || unit === 'oz') decimals = 2;
        }
        if (typeof decimals === 'number' && isFinite(decimals)) {
          priceCAD = parseFloat(priceCAD.toFixed(decimals));
        }
      }

      const marketData: MarketDataPoint = {
        symbol: instrument.symbol,
        price: rawPrice,
        priceCAD,
        timestamp: Date.now(),
        source: instrument.dataSource,
        change24h,
        changePercent24h,
        volume24h
      };

      this.updateMarketData(instrument.symbol, marketData);
    } catch (error) {
      console.error(`[UnifiedDataAggregator] Failed to fetch ${instrument.symbol}:`, error);
      this.handleDataSourceError(instrument.dataSource);
    }
  }

  /**
   * Convert price to CAD based on instrument type
   */
  private convertToCAD(price: number, baseCurrency: string, category: string): number {
    // If already in CAD, return as is
    if (baseCurrency === 'CAD') return price;

    // For forex pairs ending in CAD, price is already in CAD
    if (category === 'forex' && baseCurrency !== 'CAD') {
      // Check if we have direct CAD pair
      const directPair = `${baseCurrency}/CAD`;
      if (this.fxRateCache[directPair]) {
        return price; // Already in CAD
      }
    }

    // For USD-based instruments (crypto, commodities, US indices)
    if (category === 'crypto' || category === 'commodity' ||
        (category === 'index' && baseCurrency !== 'TSX')) {
      const usdCadRate = this.getCADRate('USD');
      return price * usdCadRate;
    }

    // For other currencies, use cross rates
    const cadRate = this.getCADRate(baseCurrency);
    return price * cadRate;
  }

  /**
   * Get CAD conversion rate for a currency
   */
  private getCADRate(currency: string): number {
    // Direct CAD pairs
    const directPair = `${currency}/CAD`;
    if (this.fxRateCache[directPair]) {
      if (this.isFXRateValid(this.fxRateCache[directPair])) {
        return this.fxRateCache[directPair].rate;
      }
    }

    // USD cross rate
    if (currency !== 'USD') {
      const usdPair = `${currency}/USD`;
      const usdCadPair = 'USD/CAD';

      if (this.fxRateCache[usdPair] && this.fxRateCache[usdCadPair]) {
        const toUsd = this.fxRateCache[usdPair].rate;
        const usdToCad = this.fxRateCache[usdCadPair].rate;
        return toUsd * usdToCad;
      }
    }

    // Special case for USD
    if (currency === 'USD') {
      return this.fxRateCache['USD/CAD']?.rate || this.FALLBACK_USD_CAD;
    }

    // Fallback
    console.warn(`[UnifiedDataAggregator] No FX rate found for ${currency}/CAD, using fallback`);
    return this.FALLBACK_USD_CAD;
  }

  /**
   * Check if FX rate is still valid
   */
  private isFXRateValid(cache: { rate: number; timestamp: number; ttl: number }): boolean {
    return Date.now() - cache.timestamp < cache.ttl;
  }

  /**
   * Update market data and notify subscribers
   */
  private updateMarketData(symbol: string, data: MarketDataPoint): void {
    this.marketData.set(symbol, data);

    // Notify subscribers
    const subscribers = this.subscribers.get(symbol);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[UnifiedDataAggregator] Subscriber error for ${symbol}:`, error);
        }
      });
    }

    // Push to high-performance engine via realTimeDataManager
    if (realTimeDataManager.isReady()) {
      const engineSymbol = symbol.replace('/CAD', '').replace('-USD', '');
      // realTimeDataManager will handle the engine push internally
    }
  }

  /**
   * Get adjusted update frequency based on conditions
   */
  private getAdjustedUpdateFrequency(baseFrequency: number): number {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    let multiplier = UPDATE_CADENCE_CONFIG.storeOpen;

    // Check if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      multiplier = UPDATE_CADENCE_CONFIG.weekend;
    }
    // Check if after hours (simplified - use actual store hours in production)
    else if (hour < 9 || hour > 19) {
      multiplier = UPDATE_CADENCE_CONFIG.storeClosed;
    }

    return baseFrequency / multiplier;
  }

  /**
   * Start all update schedulers
   */
  private startUpdateSchedulers(): void {
    // FX rate refresh scheduler
    setInterval(() => {
      this.refreshFXRates();
    }, this.FX_CACHE_TTL);

    // Health check scheduler
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  /**
   * Refresh FX rates
   */
  private async refreshFXRates(): Promise<void> {
    console.log('[UnifiedDataAggregator] Refreshing FX rates...');
    await this.initializeFXRates(); // Now uses live data from exchangeRateService
  }

  /**
   * Perform health check on all data sources
   */
  private performHealthCheck(): void {
    this.dataSourceStatus.forEach((status, source) => {
      const timeSinceUpdate = Date.now() - status.lastUpdate;

      if (timeSinceUpdate > 300000) { // 5 minutes
        status.health = 'error';
      } else if (timeSinceUpdate > 60000) { // 1 minute
        status.health = 'degraded';
      } else {
        status.health = 'healthy';
      }
    });
  }

  /**
   * Connect to realTimeDataManager for engine integration
   */
  private connectToRealTimeDataManager(): void {
    // Subscribe to our own market data and push to engine
    // This ensures the engine gets all data from the unified aggregator
    INSTRUMENT_CATALOG.forEach(instrument => {
      if (instrument.showInDashboard) {
        this.subscribe(instrument.symbol, (data) => {
          // Push to engine via realTimeDataManager if it has a pushData function set
          if (realTimeDataManager.isReady()) {
            // Convert symbol to engine format
            const engineSymbol = instrument.symbol
              .replace('/CAD', '')
              .replace('-USD', '')
              .replace('/', ''); // BTC/CAD -> BTC, EUR/CAD -> EUR

            // The realTimeDataManager will handle this if it has an engine connected
            // For now, we'll need the dashboard to pass the pushData function to us
          }
        });
      }
    });

    console.log('[UnifiedDataAggregator] Ready for engine integration');
  }

  /**
   * Set engine push function for direct data flow
   */
  setEnginePushFunction(pushData: (symbol: string, value: number, timestamp?: number) => void): () => void {
    // Direct push to engine, bypassing realTimeDataManager if needed
    const unsubs: Array<() => void> = [];
    INSTRUMENT_CATALOG.forEach(instrument => {
      if (instrument.showInDashboard) {
        const unsub = this.subscribe(instrument.symbol, (data) => {
          const engineSymbol = instrument.symbol
            .replace('/CAD', '')
            .replace('-USD', '')
            .replace('/', '');

          pushData(engineSymbol, data.priceCAD, data.timestamp);
        });
        unsubs.push(unsub);
      }
    });

    console.log('[UnifiedDataAggregator] Engine push function connected');
    return () => {
      unsubs.forEach(fn => {
        try { fn(); } catch {}
      });
    };
  }

  /**
   * Subscribe to market data updates
   */
  subscribe(symbol: string, callback: (data: MarketDataPoint) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }

    this.subscribers.get(symbol)!.add(callback);

    // Send current data if available
    const currentData = this.marketData.get(symbol);
    if (currentData) {
      callback(currentData);
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(symbol);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Get current market data for a symbol
   */
  getMarketData(symbol: string): MarketDataPoint | undefined {
    return this.marketData.get(symbol);
  }

  /**
   * Get all market data
   */
  getAllMarketData(): Map<string, MarketDataPoint> {
    return new Map(this.marketData);
  }

  /**
   * Get instruments by category
   */
  private getInstrumentsByCategory(category: string): InstrumentDefinition[] {
    return Array.from(this.instruments.values()).filter(i => i.category === category);
  }

  /**
   * Update data source status
   */
  private updateSourceStatus(source: string, health: 'healthy' | 'degraded' | 'error'): void {
    const status = this.dataSourceStatus.get(source) || {
      source,
      connected: health === 'healthy',
      lastUpdate: Date.now(),
      errorCount: 0,
      health
    };

    status.health = health;
    status.lastUpdate = Date.now();
    status.connected = health === 'healthy';

    this.dataSourceStatus.set(source, status);
  }

  /**
   * Handle data source error
   */
  private handleDataSourceError(source: string): void {
    const status = this.dataSourceStatus.get(source);
    if (status) {
      status.errorCount++;
      if (status.errorCount > 5) {
        status.health = 'error';
        status.connected = false;
      } else {
        status.health = 'degraded';
      }
    }
  }

  /**
   * Generate mock data for testing (remove in production)
   */
  private generateMockData(instrument: InstrumentDefinition): any {
    const basePrice = Math.random() * 1000 + 100;
    const change = (Math.random() - 0.5) * 10;

    return {
      price: basePrice,
      change24h: change,
      changePercent24h: (change / basePrice) * 100,
      volume24h: Math.random() * 1000000,
      high24h: basePrice * 1.02,
      low24h: basePrice * 0.98
    };
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'error';
    sources: Map<string, DataSourceStatus>;
    fxRatesAge: number;
  } {
    const healthCounts = { healthy: 0, degraded: 0, error: 0 };

    this.dataSourceStatus.forEach(status => {
      healthCounts[status.health]++;
    });

    let overall: 'healthy' | 'degraded' | 'error';
    if (healthCounts.error > 0) {
      overall = 'error';
    } else if (healthCounts.degraded > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    const fxRatesAge = Date.now() - (this.fxRateCache['USD/CAD']?.timestamp || 0);

    return {
      overall,
      sources: new Map(this.dataSourceStatus),
      fxRatesAge
    };
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    console.log('[UnifiedDataAggregator] Shutting down...');

    // Clear all timers
    this.updateTimers.forEach(timer => clearInterval(timer));
    this.updateTimers.clear();

    // Close WebSocket connections
    this.wsConnections.forEach(ws => ws.close());
    this.wsConnections.clear();

    // Clear subscribers
    this.subscribers.clear();

    this.isInitialized = false;
    console.log('[UnifiedDataAggregator] Shutdown complete');
  }
}

// Export singleton instance
export const unifiedDataAggregator = new UnifiedDataAggregator();
export default unifiedDataAggregator;