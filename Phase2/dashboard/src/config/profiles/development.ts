/**
 * Development Environment Profile
 * Fast iteration, debug features, and developer-friendly settings
 * Optimized for development workflow and debugging
 */

import { DashboardConfig } from '../DashboardConfig';

/**
 * Development configuration overrides
 * Prioritizes fast feedback and debug capabilities
 */
export const DEVELOPMENT_CONFIG: Partial<DashboardConfig> = {
  timing: {
    refreshIntervals: {
      critical: 500,      // 500ms - Faster updates for testing
      high: 2000,         // 2s - Quick feedback
      medium: 5000,       // 5s - Faster than production
      low: 10000,         // 10s - Quick commodity updates
      background: 30000,  // 30s - More frequent background
    },
    animations: {
      sparklineFrame: 16.67,    // 60fps maintained
      signalPulse: 600,         // Faster pulse for quick feedback
      rotationFade: 150,        // Quick fade transitions
      countupDuration: 300,     // Fast number changes
      glowDuration: 800,        // Quick glow effects
      tickerScroll: 60000,      // 1m ticker (fast testing)
    },
    rotations: {
      commodityPanel: 8000,     // 8s rotation (fast testing)
      moversMode: 10000,        // 10s mode switch
      moversFeature: 5000,      // 5s individual feature
      forexHighlight: 7000,     // 7s forex highlight
      cryptoSpotlight: 6000,    // 6s crypto spotlight
    },
    debounce: {
      priceUpdate: 20,          // 20ms - Minimal debounce
      signalCheck: 50,          // 50ms - Quick signal detection
      layoutReflow: 100,        // 100ms - Quick layout response
      configChange: 100,        // 100ms - Quick config changes
    },
  },
  display: {
    counts: {
      maxSparklinePoints: 150,  // Fewer points for faster rendering
      visibleForexPairs: 8,     // Fewer items for cleaner testing
      visibleCryptoPairs: 6,
      commodityFixedSlots: 2,
      commoditySpotlightSlots: 2,
      topMoversCount: 4,
      tickerItems: 10,          // Fewer ticker items
    },
  },
  performance: {
    engine: {
      maxRenderTime: 16,        // 16ms - Relaxed for development
      targetFPS: 60,            // Maintain 60fps
      frameInterval: 16.67,
      batchSize: 20,            // Smaller batches for easier debugging
      throttleWindow: 50,       // Shorter throttle for responsiveness
    },
    sparklines: {
      decimationFactor: 1,      // No decimation for full data visibility
      cacheTimeout: 2000,       // Short cache for quick updates
      maxGPUTextures: 16,       // Fewer textures for debugging
      compositorSlots: 8,       // Fewer slots
    },
    signals: {
      detectionInterval: 250,   // 250ms - Fast signal detection
      historyWindow: 120000,    // 2min history (short for testing)
      priorityThreshold: 5,     // Lower threshold for more signals
      maxActiveSignals: 15,     // More signals for testing
    },
    memory: {
      dataRetention: 600000,    // 10min retention (short for dev)
      bufferSize: 200,          // Smaller buffer for testing
      cacheSize: 25,            // Small cache
      gcInterval: 10000,        // Frequent GC for memory debugging
    },
  },
  providers: {
    timeouts: {
      connection: 3000,         // Short timeouts for quick feedback
      response: 2000,
      websocket: 5000,
      retry: 1000,              // Quick retries
    },
    fallbacks: {
      maxRetries: 2,            // Fewer retries for quick feedback
      backoffMultiplier: 1.2,   // Minimal backoff
      circuitBreakerThreshold: 8, // High threshold for development
      healthCheckInterval: 45000, // Less frequent health checks
    },
    websocket: {
      reconnectInterval: 3000,  // Quick reconnection
      pingInterval: 45000,      // Less frequent pings
      maxMessageQueue: 2000,    // Larger queue for development
      bufferSize: 16384,        // Larger buffer
    },
  },
  features: {
    enabled: {
      sparklines: true,
      signals: true,
      rotation: true,
      realtime: true,
      animations: true,
      debug: true,              // Enable debug mode
    },
    experimental: {
      webWorkers: true,         // Enable experimental features
      offscreenCanvas: true,
      gpuAcceleration: true,
      wasmDecoding: true,       // Test experimental WASM
    },
    accessibility: {
      reducedMotion: false,     // Full animations for testing
      highContrast: false,
      screenReader: false,
      keyboardNav: true,
    },
  },
} as const;

/**
 * Development-specific constants
 */
export const DEVELOPMENT_CONSTANTS = {
  MAX_CONCURRENT_REQUESTS: 20,    // Higher concurrency for testing
  ERROR_RETRY_LIMIT: 2,           // Quick failure for debugging
  DATA_STALENESS_THRESHOLD: 10000, // 10s staleness (quick feedback)
  PERFORMANCE_MONITOR_INTERVAL: 1000, // 1s performance monitoring
  ALERT_THRESHOLD_MS: 20,         // Higher threshold for dev
  LOG_LEVEL: 'debug',             // Verbose logging
  MOCK_DATA_ENABLED: true,        // Enable mock data
} as const;

/**
 * Development debugging helpers
 */
export const DEV_DEBUG_CONFIG = {
  enablePerformancePanel: true,
  enableNetworkLogging: true,
  enableStateLogging: true,
  enableRenderTimings: true,
  enableMemoryTracking: true,
  enableSignalLogging: true,
  showFPSCounter: true,
  showDataSources: true,
  highlightRerenders: false,      // Can be overwhelming
} as const;

/**
 * Development hot-reload configuration
 */
export const DEV_HOT_RELOAD = {
  configReloadEnabled: true,
  dataSourceReloadEnabled: true,
  componentReloadEnabled: true,
  preserveState: true,
  clearCacheOnReload: false,
} as const;

export default DEVELOPMENT_CONFIG;