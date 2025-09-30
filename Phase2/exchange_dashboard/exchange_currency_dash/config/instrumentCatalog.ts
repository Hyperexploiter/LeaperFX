/**
 * Production Instrument Catalog for Canadian FX Shop
 * Defines all tradeable instruments, data sources, and update cadences
 */

export interface InstrumentDefinition {
  symbol: string;           // Display symbol
  wsSymbol?: string;        // WebSocket/API symbol (if different)
  name: string;             // Full name
  category: 'forex' | 'crypto' | 'commodity' | 'index';
  subCategory?: string;     // e.g., 'precious_metal', 'energy', 'major_pair'
  baseCurrency: string;     // Base currency code
  quoteCurrency: string;    // Quote currency (CAD for store display)
  dataSource: 'coinbase' | 'fxapi' | 'twelvedata' | 'alpaca' | 'polygon' | 'finnhub' | 'bankofcanada';
  updateFrequency: number;  // Update interval in ms
  priority: 'critical' | 'high' | 'medium' | 'low';
  tradeable: boolean;       // Can the store trade this?
  showInDashboard: boolean; // Display in main dashboard?
  metadata?: Record<string, any>;
}

/**
 * FOREX PAIRS - Critical for FX Shop Operations
 */
export const FOREX_INSTRUMENTS: InstrumentDefinition[] = [
  // Major Pairs vs CAD
  {
    symbol: 'USD/CAD',
    name: 'US Dollar / Canadian Dollar',
    category: 'forex',
    subCategory: 'major_pair',
    baseCurrency: 'USD',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 5000, // 5 seconds
    priority: 'critical',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'EUR/CAD',
    name: 'Euro / Canadian Dollar',
    category: 'forex',
    subCategory: 'major_pair',
    baseCurrency: 'EUR',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 5000,
    priority: 'critical',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'GBP/CAD',
    name: 'British Pound / Canadian Dollar',
    category: 'forex',
    subCategory: 'major_pair',
    baseCurrency: 'GBP',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 5000,
    priority: 'critical',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'JPY/CAD',
    name: 'Japanese Yen / Canadian Dollar',
    category: 'forex',
    subCategory: 'major_pair',
    baseCurrency: 'JPY',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 10000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'CHF/CAD',
    name: 'Swiss Franc / Canadian Dollar',
    category: 'forex',
    subCategory: 'major_pair',
    baseCurrency: 'CHF',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 10000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'AUD/CAD',
    name: 'Australian Dollar / Canadian Dollar',
    category: 'forex',
    subCategory: 'major_pair',
    baseCurrency: 'AUD',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 10000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true
  },

  // Cross Rates (for conversion calculations)
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'forex',
    subCategory: 'cross_rate',
    baseCurrency: 'EUR',
    quoteCurrency: 'USD',
    dataSource: 'fxapi',
    updateFrequency: 5000,
    priority: 'high',
    tradeable: false,
    showInDashboard: false // Used for calculations only
  },

  // Asian Currencies
  {
    symbol: 'CNY/CAD',
    name: 'Chinese Yuan / Canadian Dollar',
    category: 'forex',
    subCategory: 'asia',
    baseCurrency: 'CNY',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'HKD/CAD',
    name: 'Hong Kong Dollar / Canadian Dollar',
    category: 'forex',
    subCategory: 'asia',
    baseCurrency: 'HKD',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'INR/CAD',
    name: 'Indian Rupee / Canadian Dollar',
    category: 'forex',
    subCategory: 'asia',
    baseCurrency: 'INR',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'KRW/CAD',
    name: 'South Korean Won / Canadian Dollar',
    category: 'forex',
    subCategory: 'asia',
    baseCurrency: 'KRW',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'THB/CAD',
    name: 'Thai Baht / Canadian Dollar',
    category: 'forex',
    subCategory: 'asia',
    baseCurrency: 'THB',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'low',
    tradeable: true,
    showInDashboard: false
  },
  {
    symbol: 'PKR/CAD',
    name: 'Pakistani Rupee / Canadian Dollar',
    category: 'forex',
    subCategory: 'asia',
    baseCurrency: 'PKR',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true
  },

  // Middle Eastern Currencies
  {
    symbol: 'AED/CAD',
    name: 'UAE Dirham / Canadian Dollar',
    category: 'forex',
    subCategory: 'middle_east',
    baseCurrency: 'AED',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'SAR/CAD',
    name: 'Saudi Riyal / Canadian Dollar',
    category: 'forex',
    subCategory: 'middle_east',
    baseCurrency: 'SAR',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'TRY/CAD',
    name: 'Turkish Lira / Canadian Dollar',
    category: 'forex',
    subCategory: 'middle_east',
    baseCurrency: 'TRY',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 30000, // More volatile
    priority: 'medium',
    tradeable: true,
    showInDashboard: true
  },

  // Americas
  {
    symbol: 'MXN/CAD',
    name: 'Mexican Peso / Canadian Dollar',
    category: 'forex',
    subCategory: 'americas',
    baseCurrency: 'MXN',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'BRL/CAD',
    name: 'Brazilian Real / Canadian Dollar',
    category: 'forex',
    subCategory: 'americas',
    baseCurrency: 'BRL',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true
  },

  // Oceania & Africa
  {
    symbol: 'NZD/CAD',
    name: 'New Zealand Dollar / Canadian Dollar',
    category: 'forex',
    subCategory: 'oceania',
    baseCurrency: 'NZD',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true
  },
  {
    symbol: 'ZAR/CAD',
    name: 'South African Rand / Canadian Dollar',
    category: 'forex',
    subCategory: 'africa',
    baseCurrency: 'ZAR',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'low',
    tradeable: true,
    showInDashboard: false
  },
  {
    symbol: 'NGN/CAD',
    name: 'Nigerian Naira / Canadian Dollar',
    category: 'forex',
    subCategory: 'africa',
    baseCurrency: 'NGN',
    quoteCurrency: 'CAD',
    dataSource: 'fxapi',
    updateFrequency: 60000,
    priority: 'low',
    tradeable: true,
    showInDashboard: false
  }
];

/**
 * CRYPTOCURRENCY - Via Coinbase/Stripe Integration
 */
export const CRYPTO_INSTRUMENTS: InstrumentDefinition[] = [
  {
    symbol: 'BTC/CAD',
    wsSymbol: 'BTC-USD',
    name: 'Bitcoin / Canadian Dollar',
    category: 'crypto',
    subCategory: 'major',
    baseCurrency: 'BTC',
    quoteCurrency: 'CAD',
    dataSource: 'coinbase',
    updateFrequency: 1000, // Real-time via WebSocket
    priority: 'high',
    tradeable: true,
    showInDashboard: true,
    metadata: { chainId: 'bitcoin', decimals: 8 }
  },
  {
    symbol: 'ETH/CAD',
    wsSymbol: 'ETH-USD',
    name: 'Ethereum / Canadian Dollar',
    category: 'crypto',
    subCategory: 'major',
    baseCurrency: 'ETH',
    quoteCurrency: 'CAD',
    dataSource: 'coinbase',
    updateFrequency: 1000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true,
    metadata: { chainId: 'ethereum', decimals: 18 }
  },
  {
    symbol: 'SOL/CAD',
    wsSymbol: 'SOL-USD',
    name: 'Solana / Canadian Dollar',
    category: 'crypto',
    subCategory: 'layer1',
    baseCurrency: 'SOL',
    quoteCurrency: 'CAD',
    dataSource: 'coinbase',
    updateFrequency: 1000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true,
    metadata: { chainId: 'solana', decimals: 9 }
  },
  {
    symbol: 'AVAX/CAD',
    wsSymbol: 'AVAX-USD',
    name: 'Avalanche / Canadian Dollar',
    category: 'crypto',
    subCategory: 'layer1',
    baseCurrency: 'AVAX',
    quoteCurrency: 'CAD',
    dataSource: 'coinbase',
    updateFrequency: 1000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true,
    metadata: { chainId: 'avalanche', decimals: 18 }
  },
  {
    symbol: 'USDC/CAD',
    wsSymbol: 'USDC-USD',
    name: 'USD Coin / Canadian Dollar',
    category: 'crypto',
    subCategory: 'stablecoin',
    baseCurrency: 'USDC',
    quoteCurrency: 'CAD',
    dataSource: 'coinbase',
    updateFrequency: 5000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true,
    metadata: { chainId: 'ethereum', decimals: 6, isStablecoin: true }
  }
];

/**
 * COMMODITIES - Precious Metals & Energy
 */
export const COMMODITY_INSTRUMENTS: InstrumentDefinition[] = [
  // Precious Metals - Troy Ounce pricing (Primary)
  {
    symbol: 'XAU/CAD',
    wsSymbol: 'XAUUSD',
    name: 'Gold (Troy Ounce) / CAD',
    category: 'commodity',
    subCategory: 'precious_metal',
    baseCurrency: 'XAU',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 15000, // 15 seconds during store hours
    priority: 'critical',
    tradeable: true,
    showInDashboard: true,
    metadata: { unit: 'oz_t', purity: '999.9', gramsPerUnit: 31.1035 }
  },

  // Gold - Alternate weight units for retail
  {
    symbol: 'XAU-G/CAD',
    wsSymbol: 'XAUUSD',
    name: 'Gold (Gram) / CAD',
    category: 'commodity',
    subCategory: 'precious_metal_retail',
    baseCurrency: 'XAU',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 30000,
    priority: 'high',
    tradeable: true,
    showInDashboard: true,
    metadata: { unit: 'gram', purity: '999.9', baseUnit: 'oz_t', conversionFactor: 0.0321507 }
  },
  {
    symbol: 'XAU-KG/CAD',
    wsSymbol: 'XAUUSD',
    name: 'Gold (Kilogram) / CAD',
    category: 'commodity',
    subCategory: 'precious_metal_bulk',
    baseCurrency: 'XAU',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 60000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: false,
    metadata: { unit: 'kg', purity: '999.9', baseUnit: 'oz_t', conversionFactor: 32.1507 }
  },
  // Silver - Troy Ounce (Primary)
  {
    symbol: 'XAG/CAD',
    wsSymbol: 'XAGUSD',
    name: 'Silver (Troy Ounce) / CAD',
    category: 'commodity',
    subCategory: 'precious_metal',
    baseCurrency: 'XAG',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 20000, // 20 seconds
    priority: 'high',
    tradeable: true,
    showInDashboard: true,
    metadata: { unit: 'oz_t', purity: '999', gramsPerUnit: 31.1035 }
  },

  // Silver - Alternate weight units
  {
    symbol: 'XAG-G/CAD',
    wsSymbol: 'XAGUSD',
    name: 'Silver (Gram) / CAD',
    category: 'commodity',
    subCategory: 'precious_metal_retail',
    baseCurrency: 'XAG',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 30000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true,
    metadata: { unit: 'gram', purity: '999', baseUnit: 'oz_t', conversionFactor: 0.0321507 }
  },
  {
    symbol: 'XAG-KG/CAD',
    wsSymbol: 'XAGUSD',
    name: 'Silver (Kilogram) / CAD',
    category: 'commodity',
    subCategory: 'precious_metal_bulk',
    baseCurrency: 'XAG',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 60000,
    priority: 'low',
    tradeable: true,
    showInDashboard: false,
    metadata: { unit: 'kg', purity: '999', baseUnit: 'oz_t', conversionFactor: 32.1507 }
  },
  {
    symbol: 'XPT/CAD',
    wsSymbol: 'XPTUSD',
    name: 'Platinum (Troy Ounce) / CAD',
    category: 'commodity',
    subCategory: 'precious_metal',
    baseCurrency: 'XPT',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 60000,
    priority: 'medium',
    tradeable: true,
    showInDashboard: true,
    metadata: { unit: 'oz_t', purity: '999.5' }
  },
  {
    symbol: 'XPD/CAD',
    wsSymbol: 'XPDUSD',
    name: 'Palladium (Troy Ounce) / CAD',
    category: 'commodity',
    subCategory: 'precious_metal',
    baseCurrency: 'XPD',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 60000,
    priority: 'low',
    tradeable: false,
    showInDashboard: true,
    metadata: { unit: 'oz_t', purity: '999.5' }
  },

  // Energy - More aggressive updates during volatility
  {
    symbol: 'WTI/CAD',
    wsSymbol: 'CL=F', // WTI Crude futures
    name: 'WTI Crude Oil / CAD',
    category: 'commodity',
    subCategory: 'energy',
    baseCurrency: 'WTI',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 15000, // 15 seconds - WTI is highly volatile
    priority: 'high',
    tradeable: false,
    showInDashboard: true,
    metadata: { unit: 'barrel', contract: 'futures', marketHours: 'extended' }
  },
  {
    symbol: 'BRENT/CAD',
    wsSymbol: 'BZ=F', // Brent Crude futures
    name: 'Brent Crude Oil / CAD',
    category: 'commodity',
    subCategory: 'energy',
    baseCurrency: 'BRENT',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 20000, // 20 seconds
    priority: 'medium',
    tradeable: false,
    showInDashboard: true,
    metadata: { unit: 'barrel', contract: 'futures', marketHours: 'extended' }
  },
  {
    symbol: 'NG/CAD',
    wsSymbol: 'NG=F', // Natural Gas futures
    name: 'Natural Gas / CAD',
    category: 'commodity',
    subCategory: 'energy',
    baseCurrency: 'NG',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 30000, // 30 seconds - less volatile than oil
    priority: 'low',
    tradeable: false,
    showInDashboard: true,
    metadata: { unit: 'mmBtu', contract: 'futures', marketHours: 'extended' }
  }
];

/**
 * EQUITY INDICES
 */
export const INDEX_INSTRUMENTS: InstrumentDefinition[] = [
  // Canadian Indices
  {
    symbol: 'TSX',
    wsSymbol: '^GSPTSE',
    name: 'S&P/TSX Composite Index',
    category: 'index',
    subCategory: 'canadian',
    baseCurrency: 'TSX',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 30000,
    priority: 'high',
    tradeable: false,
    showInDashboard: true,
    metadata: { exchange: 'TSE', country: 'CA' }
  },
  {
    symbol: 'TSX60',
    wsSymbol: '^TX60',
    name: 'S&P/TSX 60 Index',
    category: 'index',
    subCategory: 'canadian',
    baseCurrency: 'TSX60',
    quoteCurrency: 'CAD',
    dataSource: 'twelvedata',
    updateFrequency: 60000,
    priority: 'medium',
    tradeable: false,
    showInDashboard: true,
    metadata: { exchange: 'TSE', country: 'CA' }
  },

  // US Indices (converted to CAD)
  {
    symbol: 'SPX/CAD',
    wsSymbol: 'SPY', // Using SPY ETF as proxy
    name: 'S&P 500 (CAD)',
    category: 'index',
    subCategory: 'us',
    baseCurrency: 'SPX',
    quoteCurrency: 'CAD',
    dataSource: 'alpaca',
    updateFrequency: 10000,
    priority: 'high',
    tradeable: false,
    showInDashboard: true,
    metadata: { exchange: 'NYSE', country: 'US' }
  },
  {
    symbol: 'DJI/CAD',
    wsSymbol: 'DIA', // Using DIA ETF as proxy
    name: 'Dow Jones (CAD)',
    category: 'index',
    subCategory: 'us',
    baseCurrency: 'DJI',
    quoteCurrency: 'CAD',
    dataSource: 'alpaca',
    updateFrequency: 10000,
    priority: 'medium',
    tradeable: false,
    showInDashboard: true,
    metadata: { exchange: 'NYSE', country: 'US' }
  },
  {
    symbol: 'NASDAQ/CAD',
    wsSymbol: 'QQQ', // Using QQQ ETF as proxy
    name: 'NASDAQ 100 (CAD)',
    category: 'index',
    subCategory: 'us',
    baseCurrency: 'NASDAQ',
    quoteCurrency: 'CAD',
    dataSource: 'alpaca',
    updateFrequency: 10000,
    priority: 'medium',
    tradeable: false,
    showInDashboard: true,
    metadata: { exchange: 'NASDAQ', country: 'US' }
  },
  {
    symbol: 'CA-30Y-YIELD',
    wsSymbol: 'CA_30Y',
    name: 'Canada 30-Year Government Bond Yield',
    category: 'index',
    subCategory: 'bond_yield',
    baseCurrency: 'CAD',
    quoteCurrency: 'CAD',
    dataSource: 'bankofcanada',
    updateFrequency: 60000,
    priority: 'high',
    tradeable: false,
    showInDashboard: true,
    metadata: { unit: 'percent', decimals: 3, series: 'CGB.30Y' }
  }
];

/**
 * Complete instrument catalog
 */
export const INSTRUMENT_CATALOG = [
  ...FOREX_INSTRUMENTS,
  ...CRYPTO_INSTRUMENTS,
  ...COMMODITY_INSTRUMENTS,
  ...INDEX_INSTRUMENTS
];

/**
 * Dashboard display configuration
 */
export const DASHBOARD_LAYOUT = {
  forex: {
    title: 'Foreign Exchange',
    columns: 3,
    instruments: FOREX_INSTRUMENTS.filter(i => i.showInDashboard && i.tradeable),
    refreshRate: 5000
  },
  crypto: {
    title: 'Cryptocurrency',
    columns: 2,
    instruments: CRYPTO_INSTRUMENTS.filter(i => i.showInDashboard),
    refreshRate: 1000
  },
  commodities: {
    title: 'Precious Metals & Energy',
    columns: 2,
    instruments: COMMODITY_INSTRUMENTS.filter(i => i.showInDashboard),
    refreshRate: 30000
  },
  indices: {
    title: 'Market Indices',
    columns: 2,
    instruments: INDEX_INSTRUMENTS.filter(i => i.showInDashboard),
    refreshRate: 10000
  }
};

/**
 * Data source priorities (for fallback)
 */
export const DATA_SOURCE_PRIORITY = [
  'coinbase',    // Real-time crypto
  'fxapi',       // Primary forex
  'twelvedata',  // Commodities & backup
  'alpaca',      // US markets
  'polygon',     // Backup for everything
  'finnhub',     // Last resort
  'bankofcanada'
];

/**
 * Store operating hours (for reduced update frequencies)
 */
export const STORE_HOURS = {
  timezone: 'America/Montreal',
  regular: {
    monday: { open: '09:00', close: '19:00' },
    tuesday: { open: '09:00', close: '19:00' },
    wednesday: { open: '09:00', close: '19:00' },
    thursday: { open: '09:00', close: '21:00' },
    friday: { open: '09:00', close: '21:00' },
    saturday: { open: '10:00', close: '17:00' },
    sunday: { open: '12:00', close: '17:00' }
  },
  holidays: [
    '2025-12-25', // Christmas
    '2026-01-01', // New Year
    // Add more holidays as needed
  ]
};

/**
 * Update frequency modifiers based on time and market conditions
 */
export const UPDATE_CADENCE_CONFIG = {
  // During store hours: normal frequency
  storeOpen: 1.0,

  // After hours: reduce frequency by 50%
  storeClosed: 0.5,

  // Weekends: reduce frequency by 75%
  weekend: 0.25,

  // Market volatility multipliers
  volatility: {
    low: 0.75,    // Reduce updates when calm
    normal: 1.0,  // Normal updates
    high: 1.5,    // Increase updates during volatility
    extreme: 2.0  // Max updates during major events
  }
};

export default INSTRUMENT_CATALOG;
