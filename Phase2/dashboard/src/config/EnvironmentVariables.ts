/**
 * Environment Variables Configuration System
 * VITE_* environment variable mapping with type safety and validation
 * Runtime configuration override system
 */

import { DashboardConfig } from './DashboardConfig';

/**
 * Environment variable configuration mapping
 * Maps VITE_* variables to configuration paths with type information
 */
interface EnvVarMapping {
  readonly path: string;
  readonly type: 'string' | 'number' | 'boolean';
  readonly validator?: (value: any) => boolean;
  readonly transformer?: (value: string) => any;
  readonly description: string;
}

/**
 * Complete VITE_* environment variable registry
 * Comprehensive mapping of all configuration overrides
 */
export const ENV_VAR_REGISTRY: Record<string, EnvVarMapping> = {
  // ===== TIMING CONFIGURATION =====
  VITE_REFRESH_CRITICAL: {
    path: 'timing.refreshIntervals.critical',
    type: 'number',
    validator: (v) => v >= 100 && v <= 5000,
    description: 'Critical data refresh interval (100-5000ms)',
  },

  VITE_REFRESH_HIGH: {
    path: 'timing.refreshIntervals.high',
    type: 'number',
    validator: (v) => v >= 1000 && v <= 30000,
    description: 'High priority data refresh interval (1-30s)',
  },

  VITE_REFRESH_MEDIUM: {
    path: 'timing.refreshIntervals.medium',
    type: 'number',
    validator: (v) => v >= 5000 && v <= 60000,
    description: 'Medium priority data refresh interval (5-60s)',
  },

  VITE_REFRESH_LOW: {
    path: 'timing.refreshIntervals.low',
    type: 'number',
    validator: (v) => v >= 10000 && v <= 300000,
    description: 'Low priority data refresh interval (10s-5m)',
  },

  VITE_REFRESH_BACKGROUND: {
    path: 'timing.refreshIntervals.background',
    type: 'number',
    validator: (v) => v >= 30000 && v <= 600000,
    description: 'Background data refresh interval (30s-10m)',
  },

  // ===== ROTATION TIMING =====
  VITE_COMMODITIES_ROTATE_MS: {
    path: 'timing.rotations.commodityPanel',
    type: 'number',
    validator: (v) => v >= 5000 && v <= 120000,
    description: 'Commodity panel rotation interval (5s-2m)',
  },

  VITE_MOVERS_MODE_MS: {
    path: 'timing.rotations.moversMode',
    type: 'number',
    validator: (v) => v >= 10000 && v <= 180000,
    description: 'Top movers mode switch interval (10s-3m)',
  },

  VITE_MOVERS_FEATURE_MS: {
    path: 'timing.rotations.moversFeature',
    type: 'number',
    validator: (v) => v >= 3000 && v <= 60000,
    description: 'Individual mover feature duration (3s-1m)',
  },

  VITE_FOREX_HIGHLIGHT_MS: {
    path: 'timing.rotations.forexHighlight',
    type: 'number',
    validator: (v) => v >= 5000 && v <= 120000,
    description: 'Forex pair highlight duration (5s-2m)',
  },

  VITE_CRYPTO_SPOTLIGHT_MS: {
    path: 'timing.rotations.cryptoSpotlight',
    type: 'number',
    validator: (v) => v >= 3000 && v <= 60000,
    description: 'Crypto spotlight duration (3s-1m)',
  },

  // ===== ANIMATION TIMING =====
  VITE_ANIMATION_COUNTUP_MS: {
    path: 'timing.animations.countupDuration',
    type: 'number',
    validator: (v) => v >= 100 && v <= 2000,
    description: 'Number counter animation duration (100ms-2s)',
  },

  VITE_ANIMATION_GLOW_MS: {
    path: 'timing.animations.glowDuration',
    type: 'number',
    validator: (v) => v >= 200 && v <= 3000,
    description: 'Price change glow duration (200ms-3s)',
  },

  VITE_ANIMATION_FADE_MS: {
    path: 'timing.animations.rotationFade',
    type: 'number',
    validator: (v) => v >= 50 && v <= 1000,
    description: 'Content rotation fade duration (50ms-1s)',
  },

  VITE_TICKER_SCROLL_MS: {
    path: 'timing.animations.tickerScroll',
    type: 'number',
    validator: (v) => v >= 30000 && v <= 300000,
    description: 'Ticker scroll cycle duration (30s-5m)',
  },

  // ===== DISPLAY CONFIGURATION =====
  VITE_FOREX_VISIBLE: {
    path: 'display.counts.visibleForexPairs',
    type: 'number',
    validator: (v) => v >= 4 && v <= 20,
    description: 'Number of visible forex pairs (4-20)',
  },

  VITE_CRYPTO_VISIBLE: {
    path: 'display.counts.visibleCryptoPairs',
    type: 'number',
    validator: (v) => v >= 2 && v <= 15,
    description: 'Number of visible crypto pairs (2-15)',
  },

  VITE_COMMODITY_FIXED: {
    path: 'display.counts.commodityFixedSlots',
    type: 'number',
    validator: (v) => v >= 1 && v <= 8,
    description: 'Fixed commodity display slots (1-8)',
  },

  VITE_COMMODITY_SPOTLIGHT: {
    path: 'display.counts.commoditySpotlightSlots',
    type: 'number',
    validator: (v) => v >= 1 && v <= 8,
    description: 'Dynamic commodity spotlight slots (1-8)',
  },

  VITE_TOP_MOVERS_COUNT: {
    path: 'display.counts.topMoversCount',
    type: 'number',
    validator: (v) => v >= 3 && v <= 12,
    description: 'Number of top movers shown (3-12)',
  },

  VITE_TICKER_ITEMS: {
    path: 'display.counts.tickerItems',
    type: 'number',
    validator: (v) => v >= 5 && v <= 50,
    description: 'Items in ticker rotation (5-50)',
  },

  VITE_SPARKLINE_POINTS: {
    path: 'display.counts.maxSparklinePoints',
    type: 'number',
    validator: (v) => v >= 50 && v <= 1000,
    description: 'Maximum sparkline data points (50-1000)',
  },

  // ===== LAYOUT CONFIGURATION =====
  VITE_FOREX_COLUMNS: {
    path: 'display.layouts.forexColumns',
    type: 'number',
    validator: (v) => v >= 1 && v <= 6,
    description: 'Forex grid columns (1-6)',
  },

  VITE_CRYPTO_COLUMNS: {
    path: 'display.layouts.cryptoColumns',
    type: 'number',
    validator: (v) => v >= 1 && v <= 5,
    description: 'Crypto grid columns (1-5)',
  },

  VITE_RESPONSIVE_BREAKPOINT: {
    path: 'display.layouts.responsiveBreakpoint',
    type: 'number',
    validator: (v) => v >= 768 && v <= 2560,
    description: 'Mobile responsive breakpoint (768-2560px)',
  },

  // ===== PERFORMANCE CONFIGURATION =====
  VITE_TARGET_FPS: {
    path: 'performance.engine.targetFPS',
    type: 'number',
    validator: (v) => v >= 30 && v <= 120,
    description: 'Target frames per second (30-120)',
  },

  VITE_MAX_RENDER_TIME: {
    path: 'performance.engine.maxRenderTime',
    type: 'number',
    validator: (v) => v >= 8 && v <= 32,
    description: 'Maximum render time budget (8-32ms)',
  },

  VITE_BATCH_SIZE: {
    path: 'performance.engine.batchSize',
    type: 'number',
    validator: (v) => v >= 10 && v <= 200,
    description: 'Update batch size (10-200)',
  },

  VITE_THROTTLE_WINDOW: {
    path: 'performance.engine.throttleWindow',
    type: 'number',
    validator: (v) => v >= 16 && v <= 500,
    description: 'Throttle window duration (16-500ms)',
  },

  VITE_BUFFER_SIZE: {
    path: 'performance.memory.bufferSize',
    type: 'number',
    validator: (v) => v >= 100 && v <= 5000,
    description: 'Ring buffer size (100-5000)',
  },

  VITE_DATA_RETENTION_MS: {
    path: 'performance.memory.dataRetention',
    type: 'number',
    validator: (v) => v >= 300000 && v <= 86400000,
    description: 'Data retention duration (5m-24h)',
  },

  // ===== SPARKLINE PERFORMANCE =====
  VITE_SPARKLINE_DECIMATION: {
    path: 'performance.sparklines.decimationFactor',
    type: 'number',
    validator: (v) => v >= 1 && v <= 10,
    description: 'Sparkline data decimation factor (1-10)',
  },

  VITE_SPARKLINE_CACHE_MS: {
    path: 'performance.sparklines.cacheTimeout',
    type: 'number',
    validator: (v) => v >= 1000 && v <= 30000,
    description: 'Sparkline path cache timeout (1-30s)',
  },

  VITE_GPU_TEXTURES: {
    path: 'performance.sparklines.maxGPUTextures',
    type: 'number',
    validator: (v) => v >= 8 && v <= 64,
    description: 'Maximum GPU textures (8-64)',
  },

  // ===== SIGNAL DETECTION =====
  VITE_SIGNAL_INTERVAL_MS: {
    path: 'performance.signals.detectionInterval',
    type: 'number',
    validator: (v) => v >= 100 && v <= 5000,
    description: 'Signal detection interval (100ms-5s)',
  },

  VITE_SIGNAL_HISTORY_MS: {
    path: 'performance.signals.historyWindow',
    type: 'number',
    validator: (v) => v >= 60000 && v <= 3600000,
    description: 'Signal history window (1m-1h)',
  },

  VITE_SIGNAL_THRESHOLD: {
    path: 'performance.signals.priorityThreshold',
    type: 'number',
    validator: (v) => v >= 1 && v <= 10,
    description: 'High priority signal threshold (1-10)',
  },

  VITE_MAX_SIGNALS: {
    path: 'performance.signals.maxActiveSignals',
    type: 'number',
    validator: (v) => v >= 1 && v <= 50,
    description: 'Maximum concurrent signals (1-50)',
  },

  // ===== PROVIDER CONFIGURATION =====
  VITE_CONNECTION_TIMEOUT: {
    path: 'providers.timeouts.connection',
    type: 'number',
    validator: (v) => v >= 1000 && v <= 30000,
    description: 'Data provider connection timeout (1-30s)',
  },

  VITE_RESPONSE_TIMEOUT: {
    path: 'providers.timeouts.response',
    type: 'number',
    validator: (v) => v >= 500 && v <= 15000,
    description: 'Data provider response timeout (500ms-15s)',
  },

  VITE_WEBSOCKET_TIMEOUT: {
    path: 'providers.timeouts.websocket',
    type: 'number',
    validator: (v) => v >= 5000 && v <= 60000,
    description: 'WebSocket connection timeout (5-60s)',
  },

  VITE_RETRY_DELAY: {
    path: 'providers.timeouts.retry',
    type: 'number',
    validator: (v) => v >= 500 && v <= 10000,
    description: 'Provider retry delay (500ms-10s)',
  },

  VITE_MAX_RETRIES: {
    path: 'providers.fallbacks.maxRetries',
    type: 'number',
    validator: (v) => v >= 0 && v <= 10,
    description: 'Maximum retry attempts (0-10)',
  },

  VITE_BACKOFF_MULTIPLIER: {
    path: 'providers.fallbacks.backoffMultiplier',
    type: 'number',
    validator: (v) => v >= 1.0 && v <= 5.0,
    description: 'Exponential backoff multiplier (1.0-5.0)',
  },

  VITE_CIRCUIT_BREAKER: {
    path: 'providers.fallbacks.circuitBreakerThreshold',
    type: 'number',
    validator: (v) => v >= 1 && v <= 20,
    description: 'Circuit breaker failure threshold (1-20)',
  },

  VITE_HEALTH_CHECK_MS: {
    path: 'providers.fallbacks.healthCheckInterval',
    type: 'number',
    validator: (v) => v >= 5000 && v <= 300000,
    description: 'Health check interval (5s-5m)',
  },

  // ===== FEATURE FLAGS =====
  VITE_ENABLE_SPARKLINES: {
    path: 'features.enabled.sparklines',
    type: 'boolean',
    description: 'Enable sparkline charts',
  },

  VITE_ENABLE_SIGNALS: {
    path: 'features.enabled.signals',
    type: 'boolean',
    description: 'Enable market signal detection',
  },

  VITE_ENABLE_ROTATION: {
    path: 'features.enabled.rotation',
    type: 'boolean',
    description: 'Enable content rotation',
  },

  VITE_ENABLE_REALTIME: {
    path: 'features.enabled.realtime',
    type: 'boolean',
    description: 'Enable real-time data updates',
  },

  VITE_ENABLE_ANIMATIONS: {
    path: 'features.enabled.animations',
    type: 'boolean',
    description: 'Enable UI animations',
  },

  VITE_DEBUG_MODE: {
    path: 'features.enabled.debug',
    type: 'boolean',
    description: 'Enable debug mode',
  },

  // ===== EXPERIMENTAL FEATURES =====
  VITE_ENABLE_WEBWORKERS: {
    path: 'features.experimental.webWorkers',
    type: 'boolean',
    description: 'Enable Web Workers for data processing',
  },

  VITE_ENABLE_OFFSCREEN: {
    path: 'features.experimental.offscreenCanvas',
    type: 'boolean',
    description: 'Enable OffscreenCanvas rendering',
  },

  VITE_ENABLE_GPU_ACCEL: {
    path: 'features.experimental.gpuAcceleration',
    type: 'boolean',
    description: 'Enable GPU acceleration',
  },

  VITE_ENABLE_WASM: {
    path: 'features.experimental.wasmDecoding',
    type: 'boolean',
    description: 'Enable WebAssembly data decoding',
  },

  // ===== ACCESSIBILITY =====
  VITE_REDUCED_MOTION: {
    path: 'features.accessibility.reducedMotion',
    type: 'boolean',
    description: 'Respect prefers-reduced-motion',
  },

  VITE_HIGH_CONTRAST: {
    path: 'features.accessibility.highContrast',
    type: 'boolean',
    description: 'Enable high contrast mode',
  },

  VITE_SCREEN_READER: {
    path: 'features.accessibility.screenReader',
    type: 'boolean',
    description: 'Enhanced screen reader support',
  },

  VITE_KEYBOARD_NAV: {
    path: 'features.accessibility.keyboardNav',
    type: 'boolean',
    description: 'Enable keyboard navigation',
  },

  // ===== ENVIRONMENT OVERRIDE =====
  VITE_ENVIRONMENT: {
    path: 'environment',
    type: 'string',
    validator: (v) => ['production', 'development', 'demo'].includes(v),
    description: 'Force environment profile (production|development|demo)',
  },
} as const;

/**
 * Environment variable reader with type safety and validation
 */
export class EnvironmentVariableReader {
  private static cache = new Map<string, any>();

  /**
   * Read environment variable with type coercion and validation
   */
  static read(key: string): any {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const mapping = ENV_VAR_REGISTRY[key];
    if (!mapping) {
      console.warn(`Unknown environment variable: ${key}`);
      return undefined;
    }

    const rawValue = this.getRawValue(key);
    if (rawValue === undefined) {
      return undefined;
    }

    let value: any;

    // Type coercion
    try {
      if (mapping.transformer) {
        value = mapping.transformer(rawValue);
      } else {
        switch (mapping.type) {
          case 'boolean':
            value = rawValue.toLowerCase() === 'true';
            break;
          case 'number':
            value = parseFloat(rawValue);
            if (isNaN(value)) {
              throw new Error(`Invalid number: ${rawValue}`);
            }
            break;
          case 'string':
            value = rawValue;
            break;
          default:
            value = rawValue;
        }
      }
    } catch (error) {
      console.error(`Failed to parse environment variable ${key}:`, error);
      return undefined;
    }

    // Validation
    if (mapping.validator && !mapping.validator(value)) {
      console.error(`Environment variable ${key} validation failed:`, value);
      console.error(`Expected: ${mapping.description}`);
      return undefined;
    }

    // Cache the result
    this.cache.set(key, value);
    return value;
  }

  /**
   * Get raw environment variable value from various sources
   */
  private static getRawValue(key: string): string | undefined {
    // Check Vite environment variables
    if (typeof import.meta !== 'undefined') {
      const viteEnv = (import.meta as any).env?.[key];
      if (viteEnv !== undefined) return String(viteEnv);
    }

    // Check window-injected environment (for runtime override)
    if (typeof window !== 'undefined') {
      const windowEnv = (window as any).__ENV__?.[key];
      if (windowEnv !== undefined) return String(windowEnv);
    }

    // Check Node.js environment
    if (typeof process !== 'undefined') {
      const nodeEnv = (process as any).env?.[key];
      if (nodeEnv !== undefined) return String(nodeEnv);
    }

    return undefined;
  }

  /**
   * Read all environment variables for configuration section
   */
  static readSection(sectionPrefix: string): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key of Object.keys(ENV_VAR_REGISTRY)) {
      if (key.startsWith(sectionPrefix)) {
        const value = this.read(key);
        if (value !== undefined) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  /**
   * Clear cache (useful for hot reload)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get all available environment variables
   */
  static getAvailableVars(): string[] {
    return Object.keys(ENV_VAR_REGISTRY);
  }

  /**
   * Get documentation for environment variable
   */
  static getDocumentation(key: string): string | undefined {
    return ENV_VAR_REGISTRY[key]?.description;
  }

  /**
   * Validate all environment variables
   */
  static validateAll(): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const key of Object.keys(ENV_VAR_REGISTRY)) {
      const value = this.read(key);
      if (value !== undefined) {
        valid.push(key);
      } else {
        const rawValue = this.getRawValue(key);
        if (rawValue !== undefined) {
          invalid.push(key);
        }
      }
    }

    return { valid, invalid };
  }
}

/**
 * Generate environment variable documentation
 */
export function generateEnvVarDocs(): string {
  const sections: Record<string, Array<{ key: string; mapping: EnvVarMapping }>> = {};

  // Group by section
  for (const [key, mapping] of Object.entries(ENV_VAR_REGISTRY)) {
    const section = key.split('_')[1] || 'GENERAL';
    if (!sections[section]) sections[section] = [];
    sections[section].push({ key, mapping });
  }

  let docs = '# LeaperFX Dashboard Environment Variables\n\n';
  docs += 'Configure the dashboard using these VITE_* environment variables:\n\n';

  for (const [section, vars] of Object.entries(sections)) {
    docs += `## ${section}\n\n`;
    for (const { key, mapping } of vars) {
      docs += `### \`${key}\`\n`;
      docs += `- **Type**: ${mapping.type}\n`;
      docs += `- **Description**: ${mapping.description}\n`;
      docs += `- **Path**: \`${mapping.path}\`\n\n`;
    }
  }

  return docs;
}

export default EnvironmentVariableReader;