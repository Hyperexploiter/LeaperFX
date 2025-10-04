/**
 * LeaperFX Dashboard Configuration System
 * Centralized configuration maintaining <12ms frame budget at 4K 60Hz
 * Zero-cost abstractions with performance-optimized const assertions
 */

/**
 * Core timing configurations for frame budget optimization
 */
export interface TimingConfig {
  readonly refreshIntervals: {
    readonly critical: number;      // 1000ms - Critical real-time data (crypto)
    readonly high: number;         // 5000ms - High priority (major forex)
    readonly medium: number;       // 10000ms - Medium priority (indices)
    readonly low: number;          // 30000ms - Low priority (commodities)
    readonly background: number;   // 60000ms - Background updates
  };
  readonly animations: {
    readonly sparklineFrame: number;     // 16.67ms - 60fps target
    readonly signalPulse: number;        // 800ms - Signal indicator pulse
    readonly rotationFade: number;       // 300ms - Content rotation fade
    readonly countupDuration: number;    // 600ms - Number counter animation
    readonly glowDuration: number;       // 1200ms - Price change glow
    readonly tickerScroll: number;       // 120000ms - Ticker scroll cycle
  };
  readonly rotations: {
    readonly commodityPanel: number;     // 21000ms - Commodity spotlight rotation
    readonly moversMode: number;         // 24000ms - Top movers mode switch
    readonly moversFeature: number;      // 12000ms - Individual mover feature
    readonly forexHighlight: number;     // 18000ms - Forex pair highlight
    readonly cryptoSpotlight: number;    // 15000ms - Crypto spotlight
  };
  readonly debounce: {
    readonly priceUpdate: number;        // 50ms - Price update debounce
    readonly signalCheck: number;        // 100ms - Signal detection debounce
    readonly layoutReflow: number;       // 200ms - Layout recalculation debounce
    readonly configChange: number;       // 250ms - Configuration change debounce
  };
}

/**
 * Display and layout configurations
 */
export interface DisplayConfig {
  readonly dimensions: {
    readonly sparklineWidth: number;      // 200px - Standard sparkline width
    readonly sparklineHeight: number;     // 60px - Standard sparkline height
    readonly cardMinWidth: number;        // 280px - Minimum card width
    readonly cardMaxWidth: number;        // 400px - Maximum card width
    readonly gridGap: number;             // 16px - Grid gap spacing
    readonly borderRadius: number;        // 8px - Standard border radius
  };
  readonly counts: {
    readonly maxSparklinePoints: number;  // 300 - Maximum sparkline data points
    readonly visibleForexPairs: number;   // 12 - Visible forex pairs in grid
    readonly visibleCryptoPairs: number;  // 8 - Visible crypto pairs
    readonly commodityFixedSlots: number; // 3 - Fixed commodity display slots
    readonly commoditySpotlightSlots: number; // 3 - Dynamic commodity slots
    readonly topMoversCount: number;      // 6 - Number of top movers shown
    readonly tickerItems: number;         // 20 - Items in ticker rotation
  };
  readonly layouts: {
    readonly forexColumns: number;        // 3 - Forex grid columns
    readonly cryptoColumns: number;       // 2 - Crypto grid columns
    readonly commodityColumns: number;    // 2 - Commodity grid columns
    readonly indicesColumns: number;      // 2 - Indices grid columns
    readonly responsiveBreakpoint: number; // 1200px - Mobile breakpoint
  };
  readonly precision: {
    readonly forexDecimals: number;       // 4 - Forex pair decimal places
    readonly cryptoDecimals: number;      // 2 - Crypto pair decimal places
    readonly commodityDecimals: number;   // 2 - Commodity decimal places
    readonly percentDecimals: number;     // 2 - Percentage decimal places
    readonly indexDecimals: number;       // 2 - Index decimal places
  };
}

/**
 * Color and theming configurations
 */
export interface ColorsConfig {
  readonly trends: {
    readonly bullish: string;           // '#10B981' - Green for up trends
    readonly bearish: string;           // '#EF4444' - Red for down trends
    readonly neutral: string;           // '#6B7280' - Gray for neutral
    readonly bullishLight: string;      // '#D1FAE5' - Light green background
    readonly bearishLight: string;      // '#FEE2E2' - Light red background
  };
  readonly accents: {
    readonly primary: string;           // '#3B82F6' - Primary blue
    readonly secondary: string;         // '#8B5CF6' - Purple accent
    readonly warning: string;           // '#F59E0B' - Orange warning
    readonly success: string;           // '#059669' - Green success
    readonly info: string;              // '#0EA5E9' - Blue info
  };
  readonly status: {
    readonly connected: string;         // '#10B981' - Green for connected
    readonly disconnected: string;      // '#EF4444' - Red for disconnected
    readonly loading: string;           // '#F59E0B' - Orange for loading
    readonly error: string;             // '#DC2626' - Dark red for errors
    readonly stale: string;             // '#9CA3AF' - Gray for stale data
  };
  readonly sparklines: {
    readonly forex: string;             // '#3B82F6' - Blue for forex
    readonly crypto: string;            // '#F59E0B' - Orange for crypto
    readonly commodity: string;         // '#EAB308' - Yellow for commodities
    readonly index: string;             // '#8B5CF6' - Purple for indices
  };
  readonly backgrounds: {
    readonly card: string;              // '#FFFFFF' - White card background
    readonly cardDark: string;          // '#1F2937' - Dark card background
    readonly grid: string;              // '#F9FAFB' - Light grid background
    readonly gridDark: string;          // '#111827' - Dark grid background
  };
}

/**
 * Performance optimization configurations
 */
export interface PerformanceConfig {
  readonly engine: {
    readonly maxRenderTime: number;      // 12 - Maximum render time in ms
    readonly targetFPS: number;          // 60 - Target frames per second
    readonly frameInterval: number;      // 16.67 - Frame interval in ms
    readonly batchSize: number;          // 50 - Update batch size
    readonly throttleWindow: number;     // 100 - Throttle window in ms
  };
  readonly sparklines: {
    readonly decimationFactor: number;   // 2 - Data decimation factor
    readonly cacheTimeout: number;       // 5000ms - Path cache timeout
    readonly maxGPUTextures: number;     // 32 - Maximum GPU textures
    readonly compositorSlots: number;    // 16 - Compositor slots
  };
  readonly signals: {
    readonly detectionInterval: number;  // 500ms - Signal detection interval
    readonly historyWindow: number;      // 300000ms - 5 min signal history
    readonly priorityThreshold: number;  // 7 - High priority signal threshold
    readonly maxActiveSignals: number;   // 10 - Maximum concurrent signals
  };
  readonly memory: {
    readonly dataRetention: number;      // 3600000ms - 1 hour data retention
    readonly bufferSize: number;         // 1000 - Ring buffer size
    readonly cacheSize: number;          // 100 - Configuration cache size
    readonly gcInterval: number;         // 60000ms - Garbage collection hint
  };
}

/**
 * Data provider configurations
 */
export interface ProvidersConfig {
  readonly priorities: {
    readonly forex: readonly string[];     // ['polygon', 'fxapi'] - Forex providers
    readonly crypto: readonly string[];    // ['coinbase'] - Crypto providers
    readonly commodity: readonly string[];  // ['twelvedata', 'polygon'] - Commodity providers
    readonly index: readonly string[];     // ['polygon', 'alpaca'] - Index providers
    readonly yield: readonly string[];     // ['boc'] - Yield providers
  };
  readonly timeouts: {
    readonly connection: number;         // 5000ms - Connection timeout
    readonly response: number;           // 3000ms - Response timeout
    readonly websocket: number;          // 10000ms - WebSocket timeout
    readonly retry: number;              // 2000ms - Retry delay
  };
  readonly fallbacks: {
    readonly maxRetries: number;         // 3 - Maximum retry attempts
    readonly backoffMultiplier: number;  // 1.5 - Exponential backoff multiplier
    readonly circuitBreakerThreshold: number; // 5 - Circuit breaker threshold
    readonly healthCheckInterval: number; // 30000ms - Health check interval
  };
  readonly websocket: {
    readonly reconnectInterval: number;  // 5000ms - Reconnection interval
    readonly pingInterval: number;       // 30000ms - Ping interval
    readonly maxMessageQueue: number;    // 1000 - Maximum queued messages
    readonly bufferSize: number;         // 8192 - WebSocket buffer size
  };
}

/**
 * Feature flags and toggles
 */
export interface FeaturesConfig {
  readonly enabled: {
    readonly sparklines: boolean;        // true - Enable sparkline charts
    readonly signals: boolean;           // true - Enable signal detection
    readonly rotation: boolean;          // true - Enable content rotation
    readonly realtime: boolean;          // true - Enable real-time updates
    readonly animations: boolean;        // true - Enable animations
    readonly debug: boolean;             // false - Enable debug mode
  };
  readonly experimental: {
    readonly webWorkers: boolean;        // false - Enable web workers
    readonly offscreenCanvas: boolean;   // true - Enable offscreen canvas
    readonly gpuAcceleration: boolean;   // true - Enable GPU acceleration
    readonly wasmDecoding: boolean;      // false - Enable WASM data decoding
  };
  readonly accessibility: {
    readonly reducedMotion: boolean;     // false - Respect prefers-reduced-motion
    readonly highContrast: boolean;      // false - Enable high contrast mode
    readonly screenReader: boolean;      // false - Enhanced screen reader support
    readonly keyboardNav: boolean;       // true - Enable keyboard navigation
  };
}

/**
 * Main dashboard configuration interface
 */
export interface DashboardConfig {
  readonly timing: TimingConfig;
  readonly display: DisplayConfig;
  readonly colors: ColorsConfig;
  readonly performance: PerformanceConfig;
  readonly providers: ProvidersConfig;
  readonly features: FeaturesConfig;
}

/**
 * Performance-optimized default configuration
 * Uses const assertions for zero-cost abstraction
 */
export const DEFAULT_CONFIG = {
  timing: {
    refreshIntervals: {
      critical: 1000,     // 1s - Crypto real-time
      high: 5000,         // 5s - Major forex pairs
      medium: 10000,      // 10s - Indices
      low: 30000,         // 30s - Commodities
      background: 60000,  // 1m - Background updates
    },
    animations: {
      sparklineFrame: 16.67,    // 60fps frame time
      signalPulse: 800,         // Signal pulse duration
      rotationFade: 300,        // Content fade time
      countupDuration: 600,     // Number animation
      glowDuration: 1200,       // Price change glow
      tickerScroll: 120000,     // 2m ticker cycle
    },
    rotations: {
      commodityPanel: 21000,    // 21s commodity rotation
      moversMode: 24000,        // 24s movers mode switch
      moversFeature: 12000,     // 12s individual feature
      forexHighlight: 18000,    // 18s forex highlight
      cryptoSpotlight: 15000,   // 15s crypto spotlight
    },
    debounce: {
      priceUpdate: 50,          // 50ms price debounce
      signalCheck: 100,         // 100ms signal debounce
      layoutReflow: 200,        // 200ms layout debounce
      configChange: 250,        // 250ms config debounce
    },
  },
  display: {
    dimensions: {
      sparklineWidth: 200,      // Standard sparkline width
      sparklineHeight: 60,      // Standard sparkline height
      cardMinWidth: 280,        // Minimum card width
      cardMaxWidth: 400,        // Maximum card width
      gridGap: 16,              // Grid gap spacing
      borderRadius: 8,          // Border radius
    },
    counts: {
      maxSparklinePoints: 300,  // Max sparkline points
      visibleForexPairs: 12,    // Visible forex pairs
      visibleCryptoPairs: 8,    // Visible crypto pairs
      commodityFixedSlots: 3,   // Fixed commodity slots
      commoditySpotlightSlots: 3, // Dynamic commodity slots
      topMoversCount: 6,        // Top movers shown
      tickerItems: 20,          // Ticker rotation items
    },
    layouts: {
      forexColumns: 3,          // Forex grid columns
      cryptoColumns: 2,         // Crypto grid columns
      commodityColumns: 2,      // Commodity grid columns
      indicesColumns: 2,        // Indices grid columns
      responsiveBreakpoint: 1200, // Mobile breakpoint
    },
    precision: {
      forexDecimals: 4,         // Forex decimal places
      cryptoDecimals: 2,        // Crypto decimal places
      commodityDecimals: 2,     // Commodity decimal places
      percentDecimals: 2,       // Percentage decimal places
      indexDecimals: 2,         // Index decimal places
    },
  },
  colors: {
    trends: {
      bullish: '#10B981',       // Green up
      bearish: '#EF4444',       // Red down
      neutral: '#6B7280',       // Gray neutral
      bullishLight: '#D1FAE5',  // Light green bg
      bearishLight: '#FEE2E2',  // Light red bg
    },
    accents: {
      primary: '#3B82F6',       // Primary blue
      secondary: '#8B5CF6',     // Purple accent
      warning: '#F59E0B',       // Orange warning
      success: '#059669',       // Green success
      info: '#0EA5E9',          // Blue info
    },
    status: {
      connected: '#10B981',     // Green connected
      disconnected: '#EF4444',  // Red disconnected
      loading: '#F59E0B',       // Orange loading
      error: '#DC2626',         // Dark red error
      stale: '#9CA3AF',         // Gray stale
    },
    sparklines: {
      forex: '#3B82F6',         // Blue forex
      crypto: '#F59E0B',        // Orange crypto
      commodity: '#EAB308',     // Yellow commodity
      index: '#8B5CF6',         // Purple index
    },
    backgrounds: {
      card: '#FFFFFF',          // White card
      cardDark: '#1F2937',      // Dark card
      grid: '#F9FAFB',          // Light grid
      gridDark: '#111827',      // Dark grid
    },
  },
  performance: {
    engine: {
      maxRenderTime: 12,        // 12ms max render time
      targetFPS: 60,            // 60fps target
      frameInterval: 16.67,     // Frame interval
      batchSize: 50,            // Update batch size
      throttleWindow: 100,      // Throttle window
    },
    sparklines: {
      decimationFactor: 2,      // Data decimation
      cacheTimeout: 5000,       // Path cache timeout
      maxGPUTextures: 32,       // GPU texture limit
      compositorSlots: 16,      // Compositor slots
    },
    signals: {
      detectionInterval: 500,   // Signal detection rate
      historyWindow: 300000,    // 5min signal history
      priorityThreshold: 7,     // High priority threshold
      maxActiveSignals: 10,     // Max concurrent signals
    },
    memory: {
      dataRetention: 3600000,   // 1 hour data retention
      bufferSize: 1000,         // Ring buffer size
      cacheSize: 100,           // Config cache size
      gcInterval: 60000,        // GC hint interval
    },
  },
  providers: {
    priorities: {
      forex: ['polygon', 'fxapi'] as const,
      crypto: ['coinbase'] as const,
      commodity: ['twelvedata', 'polygon'] as const,
      index: ['polygon', 'alpaca'] as const,
      yield: ['boc'] as const,
    },
    timeouts: {
      connection: 5000,         // Connection timeout
      response: 3000,           // Response timeout
      websocket: 10000,         // WebSocket timeout
      retry: 2000,              // Retry delay
    },
    fallbacks: {
      maxRetries: 3,            // Max retries
      backoffMultiplier: 1.5,   // Backoff multiplier
      circuitBreakerThreshold: 5, // Circuit breaker
      healthCheckInterval: 30000, // Health check rate
    },
    websocket: {
      reconnectInterval: 5000,  // Reconnect interval
      pingInterval: 30000,      // Ping interval
      maxMessageQueue: 1000,    // Max queued messages
      bufferSize: 8192,         // Buffer size
    },
  },
  features: {
    enabled: {
      sparklines: true,         // Enable sparklines
      signals: true,            // Enable signals
      rotation: true,           // Enable rotation
      realtime: true,           // Enable real-time
      animations: true,         // Enable animations
      debug: false,             // Debug mode
    },
    experimental: {
      webWorkers: false,        // Web workers
      offscreenCanvas: true,    // Offscreen canvas
      gpuAcceleration: true,    // GPU acceleration
      wasmDecoding: false,      // WASM decoding
    },
    accessibility: {
      reducedMotion: false,     // Reduced motion
      highContrast: false,      // High contrast
      screenReader: false,      // Screen reader
      keyboardNav: true,        // Keyboard nav
    },
  },
} as const satisfies DashboardConfig;

/**
 * Type-safe configuration keys for runtime access
 */
export type ConfigPath =
  | `timing.${keyof TimingConfig}`
  | `display.${keyof DisplayConfig}`
  | `colors.${keyof ColorsConfig}`
  | `performance.${keyof PerformanceConfig}`
  | `providers.${keyof ProvidersConfig}`
  | `features.${keyof FeaturesConfig}`;

/**
 * Pre-calculated performance values for hot paths
 * Avoids runtime calculations in render loops
 */
export const PERFORMANCE_CONSTANTS = {
  // Frame timing (calculated once)
  FRAME_TIME_MS: 1000 / DEFAULT_CONFIG.performance.engine.targetFPS,
  FRAME_TIME_BUDGET: DEFAULT_CONFIG.performance.engine.maxRenderTime,

  // Common calculations
  SPARKLINE_ASPECT_RATIO: DEFAULT_CONFIG.display.dimensions.sparklineWidth / DEFAULT_CONFIG.display.dimensions.sparklineHeight,
  GRID_TOTAL_COLUMNS: DEFAULT_CONFIG.display.layouts.forexColumns + DEFAULT_CONFIG.display.layouts.cryptoColumns,

  // Timing intervals (pre-calculated for setInterval)
  CRITICAL_INTERVAL: DEFAULT_CONFIG.timing.refreshIntervals.critical,
  HIGH_INTERVAL: DEFAULT_CONFIG.timing.refreshIntervals.high,
  MEDIUM_INTERVAL: DEFAULT_CONFIG.timing.refreshIntervals.medium,
  LOW_INTERVAL: DEFAULT_CONFIG.timing.refreshIntervals.low,

  // Animation timing
  ANIMATION_DURATION_MS: DEFAULT_CONFIG.timing.animations.countupDuration,
  GLOW_DURATION_MS: DEFAULT_CONFIG.timing.animations.glowDuration,

  // Memory thresholds
  MAX_BUFFER_SIZE: DEFAULT_CONFIG.performance.memory.bufferSize,
  DATA_RETENTION_MS: DEFAULT_CONFIG.performance.memory.dataRetention,
} as const;

/**
 * Environment variable mapping for runtime configuration
 */
export const ENV_MAPPING = {
  // Timing overrides
  'VITE_REFRESH_CRITICAL': 'timing.refreshIntervals.critical',
  'VITE_REFRESH_HIGH': 'timing.refreshIntervals.high',
  'VITE_REFRESH_MEDIUM': 'timing.refreshIntervals.medium',
  'VITE_REFRESH_LOW': 'timing.refreshIntervals.low',

  // Rotation timing
  'VITE_COMMODITIES_ROTATE_MS': 'timing.rotations.commodityPanel',
  'VITE_MOVERS_MODE_MS': 'timing.rotations.moversMode',
  'VITE_MOVERS_FEATURE_MS': 'timing.rotations.moversFeature',

  // Display counts
  'VITE_FOREX_VISIBLE': 'display.counts.visibleForexPairs',
  'VITE_CRYPTO_VISIBLE': 'display.counts.visibleCryptoPairs',
  'VITE_COMMODITY_FIXED': 'display.counts.commodityFixedSlots',
  'VITE_COMMODITY_SPOTLIGHT': 'display.counts.commoditySpotlightSlots',

  // Performance tuning
  'VITE_TARGET_FPS': 'performance.engine.targetFPS',
  'VITE_MAX_RENDER_TIME': 'performance.engine.maxRenderTime',
  'VITE_BATCH_SIZE': 'performance.engine.batchSize',

  // Feature flags
  'VITE_ENABLE_SPARKLINES': 'features.enabled.sparklines',
  'VITE_ENABLE_SIGNALS': 'features.enabled.signals',
  'VITE_ENABLE_ROTATION': 'features.enabled.rotation',
  'VITE_ENABLE_ANIMATIONS': 'features.enabled.animations',
  'VITE_DEBUG_MODE': 'features.enabled.debug',

  // Experimental features
  'VITE_ENABLE_WEBWORKERS': 'features.experimental.webWorkers',
  'VITE_ENABLE_GPU_ACCEL': 'features.experimental.gpuAcceleration',
  'VITE_ENABLE_WASM': 'features.experimental.wasmDecoding',
} as const;

export default DEFAULT_CONFIG;