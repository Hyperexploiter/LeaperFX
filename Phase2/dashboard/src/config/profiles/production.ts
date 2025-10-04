/**
 * Production Environment Profile
 * Conservative, reliable configuration for live trading environment
 * Optimized for stability and data accuracy
 */

import { DashboardConfig } from '../DashboardConfig';

/**
 * Production configuration overrides
 * Prioritizes reliability and conservative update intervals
 */
export const PRODUCTION_CONFIG: Partial<DashboardConfig> = {
  timing: {
    refreshIntervals: {
      critical: 2000,     // 2s - Conservative for production stability
      high: 5000,         // 5s - Standard major pairs
      medium: 15000,      // 15s - Indices (less aggressive)
      low: 60000,         // 1m - Commodities (conservative)
      background: 120000, // 2m - Background (reduced load)
    },
    animations: {
      sparklineFrame: 16.67,    // 60fps maintained
      signalPulse: 1000,        // Longer pulse for clarity
      rotationFade: 400,        // Slower fade for readability
      countupDuration: 800,     // Slower number transitions
      glowDuration: 1500,       // Longer glow for emphasis
      tickerScroll: 180000,     // 3m ticker cycle (less aggressive)
    },
    rotations: {
      commodityPanel: 30000,    // 30s rotation (more conservative)
      moversMode: 45000,        // 45s mode switch (longer focus)
      moversFeature: 20000,     // 20s individual feature
      forexHighlight: 25000,    // 25s forex highlight
      cryptoSpotlight: 15000,   // 15s crypto (unchanged - important)
    },
    debounce: {
      priceUpdate: 100,         // 100ms - Conservative debounce
      signalCheck: 200,         // 200ms - Prevent false signals
      layoutReflow: 300,        // 300ms - Prevent layout thrash
      configChange: 500,        // 500ms - Conservative config changes
    },
  },
  performance: {
    engine: {
      maxRenderTime: 10,        // 10ms - Conservative render budget
      targetFPS: 60,            // Maintain 60fps
      frameInterval: 16.67,     // Standard frame interval
      batchSize: 25,            // Smaller batches for stability
      throttleWindow: 150,      // Longer throttle window
    },
    sparklines: {
      decimationFactor: 3,      // More aggressive decimation
      cacheTimeout: 10000,      // Longer cache for stability
      maxGPUTextures: 24,       // Conservative GPU usage
      compositorSlots: 12,      // Fewer slots for reliability
    },
    signals: {
      detectionInterval: 1000,  // 1s detection (less aggressive)
      historyWindow: 600000,    // 10min history (longer window)
      priorityThreshold: 8,     // Higher threshold for signals
      maxActiveSignals: 5,      // Fewer concurrent signals
    },
    memory: {
      dataRetention: 7200000,   // 2 hours retention (longer)
      bufferSize: 500,          // Smaller buffer (conservative)
      cacheSize: 50,            // Smaller cache
      gcInterval: 30000,        // More frequent GC hints
    },
  },
  providers: {
    timeouts: {
      connection: 8000,         // Longer connection timeout
      response: 5000,           // Longer response timeout
      websocket: 15000,         // Longer WebSocket timeout
      retry: 3000,              // Longer retry delay
    },
    fallbacks: {
      maxRetries: 5,            // More retry attempts
      backoffMultiplier: 2.0,   // More aggressive backoff
      circuitBreakerThreshold: 3, // Lower circuit breaker threshold
      healthCheckInterval: 15000, // More frequent health checks
    },
    websocket: {
      reconnectInterval: 10000, // Longer reconnect interval
      pingInterval: 20000,      // More frequent pings
      maxMessageQueue: 500,     // Smaller message queue
      bufferSize: 4096,         // Smaller buffer
    },
  },
  features: {
    enabled: {
      sparklines: true,         // Enable all core features
      signals: true,
      rotation: true,
      realtime: true,
      animations: true,
      debug: false,             // No debug in production
    },
    experimental: {
      webWorkers: false,        // Disable experimental features
      offscreenCanvas: true,    // Keep proven optimizations
      gpuAcceleration: true,
      wasmDecoding: false,      // No experimental WASM
    },
    accessibility: {
      reducedMotion: false,     // Respect user preferences
      highContrast: false,
      screenReader: false,
      keyboardNav: true,        // Keep accessibility
    },
  },
} as const;

/**
 * Production-specific constants
 */
export const PRODUCTION_CONSTANTS = {
  MAX_CONCURRENT_REQUESTS: 10,    // Limit concurrent API requests
  ERROR_RETRY_LIMIT: 3,           // Conservative error handling
  DATA_STALENESS_THRESHOLD: 30000, // 30s staleness threshold
  PERFORMANCE_MONITOR_INTERVAL: 5000, // 5s performance monitoring
  ALERT_THRESHOLD_MS: 15,         // Alert if render > 15ms
} as const;

/**
 * Production environment validation
 */
export const PRODUCTION_VALIDATION = {
  requiredFeatures: [
    'sparklines',
    'signals',
    'rotation',
    'realtime'
  ] as const,
  forbiddenFeatures: [
    'debug',
    'webWorkers',
    'wasmDecoding'
  ] as const,
  performanceRequirements: {
    maxRenderTime: 12,
    minFPS: 55,
    maxMemoryMB: 100,
  },
} as const;

export default PRODUCTION_CONFIG;