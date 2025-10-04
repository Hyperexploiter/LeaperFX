/**
 * LeaperFX Dashboard Configuration System - Main Index
 * Centralized exports for all configuration functionality
 * Maintains <12ms frame budget performance with zero-cost abstractions
 */

// ===== CORE CONFIGURATION =====
export {
  DashboardConfig,
  TimingConfig,
  DisplayConfig,
  ColorsConfig,
  PerformanceConfig,
  ProvidersConfig,
  FeaturesConfig,
  DEFAULT_CONFIG,
  PERFORMANCE_CONSTANTS,
  ENV_MAPPING,
  ConfigPath,
} from './DashboardConfig';

// ===== CONFIGURATION MANAGER =====
export {
  ConfigurationManager,
  ConfigChangeEvent,
  ValidationResult,
  ConfigPerformanceMetrics,
  configManager,
  getConfig,
  setConfig,
  getConfigSection,
} from '../services/ConfigurationManager';

// ===== ENVIRONMENT PROFILES =====
export {
  Environment,
  PROFILE_REGISTRY,
  PRODUCTION_CONFIG,
  PRODUCTION_CONSTANTS,
  PRODUCTION_VALIDATION,
  DEVELOPMENT_CONFIG,
  DEVELOPMENT_CONSTANTS,
  DEV_DEBUG_CONFIG,
  DEV_HOT_RELOAD,
  DEMO_CONFIG,
  DEMO_CONSTANTS,
  DEMO_PRESENTATION,
  DEMO_SIMULATION,
  detectEnvironment,
  getProfile,
  getEnvironmentFeatures,
  ENVIRONMENT_FEATURES,
} from './profiles';

// ===== PERFORMANCE OPTIMIZATIONS =====
export {
  TIMING_CONSTANTS,
  COLOR_LOOKUP,
  LAYOUT_CONSTANTS,
  MATH_CONSTANTS,
  FORMAT_LOOKUP,
  PERFORMANCE_THRESHOLDS,
  GRAPHICS_CONSTANTS,
  ObjectPool,
  OBJECT_POOLS,
  FAST_UTILS,
} from './PerformanceOptimizations';

// ===== ENVIRONMENT VARIABLES =====
export {
  ENV_VAR_REGISTRY,
  EnvironmentVariableReader,
  generateEnvVarDocs,
} from './EnvironmentVariables';

// ===== RE-EXPORT COMMON PATTERNS =====

/**
 * Quick access to most commonly used configuration values
 * Pre-calculated for hot path performance
 */
export const QUICK_CONFIG = {
  // Critical timing values (most accessed)
  CRITICAL_REFRESH: DEFAULT_CONFIG.timing.refreshIntervals.critical,
  HIGH_REFRESH: DEFAULT_CONFIG.timing.refreshIntervals.high,
  FRAME_TIME: PERFORMANCE_CONSTANTS.FRAME_TIME_MS,
  RENDER_BUDGET: PERFORMANCE_CONSTANTS.FRAME_TIME_BUDGET,

  // Display constants
  SPARKLINE_WIDTH: DEFAULT_CONFIG.display.dimensions.sparklineWidth,
  SPARKLINE_HEIGHT: DEFAULT_CONFIG.display.dimensions.sparklineHeight,
  MAX_POINTS: DEFAULT_CONFIG.display.counts.maxSparklinePoints,

  // Color constants
  BULLISH_COLOR: DEFAULT_CONFIG.colors.trends.bullish,
  BEARISH_COLOR: DEFAULT_CONFIG.colors.trends.bearish,
  NEUTRAL_COLOR: DEFAULT_CONFIG.colors.trends.neutral,

  // Performance limits
  MAX_RENDER_TIME: DEFAULT_CONFIG.performance.engine.maxRenderTime,
  TARGET_FPS: DEFAULT_CONFIG.performance.engine.targetFPS,
  BATCH_SIZE: DEFAULT_CONFIG.performance.engine.batchSize,
} as const;

/**
 * Configuration sections for easy access
 */
export const CONFIG_SECTIONS = {
  timing: () => configManager.getSection('timing'),
  display: () => configManager.getSection('display'),
  colors: () => configManager.getSection('colors'),
  performance: () => configManager.getSection('performance'),
  providers: () => configManager.getSection('providers'),
  features: () => configManager.getSection('features'),
} as const;

/**
 * Performance-optimized configuration getters
 * Use these in hot paths for zero-cost access
 */
export const PERF_CONFIG = {
  // Timing getters
  getCriticalRefresh: () => QUICK_CONFIG.CRITICAL_REFRESH,
  getHighRefresh: () => QUICK_CONFIG.HIGH_REFRESH,
  getFrameTime: () => QUICK_CONFIG.FRAME_TIME,
  getRenderBudget: () => QUICK_CONFIG.RENDER_BUDGET,

  // Display getters
  getSparklineWidth: () => QUICK_CONFIG.SPARKLINE_WIDTH,
  getSparklineHeight: () => QUICK_CONFIG.SPARKLINE_HEIGHT,
  getMaxPoints: () => QUICK_CONFIG.MAX_POINTS,

  // Color getters
  getBullishColor: () => QUICK_CONFIG.BULLISH_COLOR,
  getBearishColor: () => QUICK_CONFIG.BEARISH_COLOR,
  getNeutralColor: () => QUICK_CONFIG.NEUTRAL_COLOR,

  // Performance getters
  getMaxRenderTime: () => QUICK_CONFIG.MAX_RENDER_TIME,
  getTargetFPS: () => QUICK_CONFIG.TARGET_FPS,
  getBatchSize: () => QUICK_CONFIG.BATCH_SIZE,
} as const;

/**
 * Runtime configuration utilities
 */
export const CONFIG_UTILS = {
  /**
   * Initialize configuration system
   */
  init: () => {
    const env = detectEnvironment();
    console.log(`LeaperFX Dashboard initialized with ${env} configuration`);
    return configManager;
  },

  /**
   * Hot reload configuration (development only)
   */
  hotReload: () => {
    if (detectEnvironment() === 'development') {
      EnvironmentVariableReader.clearCache();
      configManager.reset();
      console.log('Configuration hot reloaded');
    }
  },

  /**
   * Validate performance settings
   */
  validatePerformance: () => {
    const maxRender = getConfig('performance.engine.maxRenderTime');
    const targetFPS = getConfig('performance.engine.targetFPS');
    const frameTime = 1000 / targetFPS;

    if (maxRender > frameTime * 0.8) {
      console.warn(`Render budget (${maxRender}ms) is >80% of frame time (${frameTime.toFixed(1)}ms)`);
      return false;
    }

    return true;
  },

  /**
   * Get environment-specific features
   */
  getFeatures: () => getEnvironmentFeatures(),

  /**
   * Generate configuration report
   */
  generateReport: () => {
    const env = detectEnvironment();
    const metrics = configManager.getMetrics();
    const features = getEnvironmentFeatures();

    return {
      environment: env,
      metrics,
      features,
      performanceValid: CONFIG_UTILS.validatePerformance(),
      timestamp: new Date().toISOString(),
    };
  },
} as const;

/**
 * Default export for convenience
 */
export default {
  config: configManager,
  quick: QUICK_CONFIG,
  sections: CONFIG_SECTIONS,
  perf: PERF_CONFIG,
  utils: CONFIG_UTILS,
};