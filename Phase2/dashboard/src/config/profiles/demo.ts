/**
 * Demo Environment Profile
 * Eye-catching, presentation-ready configuration
 * Optimized for demonstrations and showcasing features
 */

import { DashboardConfig } from '../DashboardConfig';

/**
 * Demo configuration overrides
 * Prioritizes visual impact and feature demonstration
 */
export const DEMO_CONFIG: Partial<DashboardConfig> = {
  timing: {
    refreshIntervals: {
      critical: 750,      // 750ms - Smooth but visible updates
      high: 3000,         // 3s - Good demonstration pace
      medium: 8000,       // 8s - Visible changes
      low: 15000,         // 15s - Demonstrable updates
      background: 45000,  // 45s - Background activity
    },
    animations: {
      sparklineFrame: 16.67,    // 60fps for smooth demo
      signalPulse: 1200,        // Prominent pulse effect
      rotationFade: 500,        // Noticeable fade transitions
      countupDuration: 1000,    // Dramatic number animations
      glowDuration: 2000,       // Extended glow for emphasis
      tickerScroll: 90000,      // 1.5m ticker for demo rhythm
    },
    rotations: {
      commodityPanel: 12000,    // 12s rotation (demo-friendly)
      moversMode: 18000,        // 18s mode switch (enough time to see)
      moversFeature: 8000,      // 8s individual feature
      forexHighlight: 15000,    // 15s forex highlight
      cryptoSpotlight: 10000,   // 10s crypto spotlight
    },
    debounce: {
      priceUpdate: 75,          // 75ms - Smooth but responsive
      signalCheck: 150,         // 150ms - Visible signal detection
      layoutReflow: 250,        // 250ms - Smooth layout changes
      configChange: 200,        // 200ms - Responsive config
    },
  },
  display: {
    dimensions: {
      sparklineWidth: 240,      // Larger sparklines for visibility
      sparklineHeight: 80,      // Taller for better presentation
      cardMinWidth: 320,        // Larger cards
      cardMaxWidth: 450,        // Wider cards for content
      gridGap: 20,              // More spacing for clarity
      borderRadius: 12,         // Rounded corners for modern look
    },
    counts: {
      maxSparklinePoints: 400,  // More data points for smooth lines
      visibleForexPairs: 15,    // More visible items for richness
      visibleCryptoPairs: 10,
      commodityFixedSlots: 4,   // More slots for variety
      commoditySpotlightSlots: 4,
      topMoversCount: 8,        // More movers for activity
      tickerItems: 25,          // Rich ticker content
    },
    layouts: {
      forexColumns: 3,          // Maintain readable grid
      cryptoColumns: 3,         // More columns for demo
      commodityColumns: 3,
      indicesColumns: 3,
      responsiveBreakpoint: 1400, // Higher breakpoint for demos
    },
  },
  colors: {
    trends: {
      bullish: '#00FF88',       // Vibrant green
      bearish: '#FF4757',       // Vibrant red
      neutral: '#7B68EE',       // Purple neutral
      bullishLight: '#E8FFF4',  // Bright light green
      bearishLight: '#FFE8EA',  // Bright light red
    },
    accents: {
      primary: '#4834FF',       // Vibrant blue
      secondary: '#FF6B9D',     // Pink accent
      warning: '#FFB800',       // Golden warning
      success: '#00D68F',       // Bright success
      info: '#00A8FF',          // Bright info
    },
    sparklines: {
      forex: '#4834FF',         // Vibrant blue
      crypto: '#FF9500',        // Bright orange
      commodity: '#FFD700',     // Gold color
      index: '#9C27B0',         // Purple
    },
  },
  performance: {
    engine: {
      maxRenderTime: 14,        // 14ms - Good for demos
      targetFPS: 60,            // Smooth 60fps
      frameInterval: 16.67,
      batchSize: 40,            // Larger batches for smoother updates
      throttleWindow: 75,       // Responsive throttling
    },
    sparklines: {
      decimationFactor: 1,      // No decimation for full detail
      cacheTimeout: 3000,       // Medium cache for smooth updates
      maxGPUTextures: 40,       // More textures for rich visuals
      compositorSlots: 20,      // More slots for complexity
    },
    signals: {
      detectionInterval: 400,   // 400ms - Visible signal activity
      historyWindow: 240000,    // 4min history window
      priorityThreshold: 6,     // Medium threshold for activity
      maxActiveSignals: 12,     // Good signal activity
    },
    memory: {
      dataRetention: 1800000,   // 30min retention for demos
      bufferSize: 800,          // Larger buffer for smooth data
      cacheSize: 75,            // Medium cache
      gcInterval: 45000,        // Less frequent GC for smoothness
    },
  },
  providers: {
    timeouts: {
      connection: 4000,         // Reasonable timeouts
      response: 3000,
      websocket: 8000,
      retry: 1500,              // Quick but not rushed retries
    },
    fallbacks: {
      maxRetries: 4,            // More attempts for demo stability
      backoffMultiplier: 1.3,   // Gentle backoff
      circuitBreakerThreshold: 6, // Medium threshold
      healthCheckInterval: 25000, // Regular health checks
    },
    websocket: {
      reconnectInterval: 6000,  // Medium reconnect interval
      pingInterval: 35000,      // Regular pings
      maxMessageQueue: 1500,    // Large queue for demo data
      bufferSize: 12288,        // Large buffer
    },
  },
  features: {
    enabled: {
      sparklines: true,         // All features enabled
      signals: true,
      rotation: true,
      realtime: true,
      animations: true,
      debug: false,             // Clean presentation
    },
    experimental: {
      webWorkers: false,        // Stable features only
      offscreenCanvas: true,    // Keep performance features
      gpuAcceleration: true,
      wasmDecoding: false,      // Stable only
    },
    accessibility: {
      reducedMotion: false,     // Full animations for impact
      highContrast: false,      // Standard contrast
      screenReader: false,      // Visual presentation focused
      keyboardNav: true,        // Keep navigation
    },
  },
} as const;

/**
 * Demo-specific constants
 */
export const DEMO_CONSTANTS = {
  MAX_CONCURRENT_REQUESTS: 15,    // Good throughput for demos
  ERROR_RETRY_LIMIT: 4,           // More resilient for presentations
  DATA_STALENESS_THRESHOLD: 20000, // 20s staleness threshold
  PERFORMANCE_MONITOR_INTERVAL: 3000, // 3s monitoring
  ALERT_THRESHOLD_MS: 18,         // Higher threshold for demos
  ANIMATION_MULTIPLIER: 1.2,      // 20% slower animations for visibility
  SIGNAL_BOOST_FACTOR: 1.5,       // Boost signal visibility
} as const;

/**
 * Demo presentation features
 */
export const DEMO_PRESENTATION = {
  enableWelcomeAnimation: true,
  enableFeatureHighlights: true,
  enableDataSourceLabels: true,
  enablePerformanceIndicators: false, // Clean presentation
  autoRotateFeatures: true,
  highlightActiveElements: true,
  showTransitionEffects: true,
  enableSmoothScrolling: true,
} as const;

/**
 * Demo data simulation for offline presentations
 */
export const DEMO_SIMULATION = {
  enableMockData: false,          // Use real data when possible
  mockVolatility: 'medium',       // Medium volatility for interest
  simulateSignals: true,          // Generate demo signals
  signalFrequency: 45000,         // Signal every 45s
  priceVariation: 0.02,          // 2% price variation
  trendDuration: 120000,         // 2min trend duration
} as const;

export default DEMO_CONFIG;