/**
 * Performance Optimizations and Zero-Cost Abstractions
 * Pre-calculated values and lookup tables for <12ms frame budget
 */

import { DEFAULT_CONFIG } from './DashboardConfig';

/**
 * Pre-calculated timing constants for hot paths
 * Eliminates runtime calculations in render loops
 */
export const TIMING_CONSTANTS = {
  // Frame timing (60fps at 4K)
  FRAME_TIME_MS: 16.666666666666668,
  FRAME_BUDGET_MS: 12,
  FRAME_BUFFER_MS: 4.666666666666668, // Remaining budget after 12ms

  // Millisecond conversions (pre-calculated)
  SECOND_MS: 1000,
  MINUTE_MS: 60000,
  HOUR_MS: 3600000,

  // Animation frame indices for 60fps
  ANIMATION_60FPS_INDICES: (() => {
    const indices = [];
    for (let i = 0; i < 60; i++) {
      indices.push(i * 16.666666666666668);
    }
    return Object.freeze(indices);
  })(),

  // Common timing calculations
  SPARKLINE_UPDATE_INTERVAL: DEFAULT_CONFIG.timing.refreshIntervals.critical,
  FOREX_UPDATE_INTERVAL: DEFAULT_CONFIG.timing.refreshIntervals.high,
  COMMODITY_UPDATE_INTERVAL: DEFAULT_CONFIG.timing.refreshIntervals.low,
} as const;

/**
 * Color lookup tables for ultra-fast access
 * Eliminates string parsing and CSS color computation
 */
export const COLOR_LOOKUP = {
  // RGB values for trend colors (pre-parsed)
  BULLISH_RGB: [16, 185, 129] as const,    // #10B981
  BEARISH_RGB: [239, 68, 68] as const,     // #EF4444
  NEUTRAL_RGB: [107, 114, 128] as const,   // #6B7280

  // Hex colors for direct CSS usage
  TREND_COLORS: {
    up: DEFAULT_CONFIG.colors.trends.bullish,
    down: DEFAULT_CONFIG.colors.trends.bearish,
    flat: DEFAULT_CONFIG.colors.trends.neutral,
  } as const,

  // Category color mapping
  CATEGORY_COLORS: {
    forex: DEFAULT_CONFIG.colors.sparklines.forex,
    crypto: DEFAULT_CONFIG.colors.sparklines.crypto,
    commodity: DEFAULT_CONFIG.colors.sparklines.commodity,
    index: DEFAULT_CONFIG.colors.sparklines.index,
  } as const,

  // Status color array for quick indexing
  STATUS_COLORS_ARRAY: [
    DEFAULT_CONFIG.colors.status.connected,    // 0: connected
    DEFAULT_CONFIG.colors.status.disconnected, // 1: disconnected
    DEFAULT_CONFIG.colors.status.loading,      // 2: loading
    DEFAULT_CONFIG.colors.status.error,        // 3: error
    DEFAULT_CONFIG.colors.status.stale,        // 4: stale
  ] as const,
} as const;

/**
 * Layout dimension lookup tables
 * Pre-calculated pixel values for layout engine
 */
export const LAYOUT_CONSTANTS = {
  // Grid dimensions
  FOREX_GRID: {
    columns: DEFAULT_CONFIG.display.layouts.forexColumns,
    itemWidth: DEFAULT_CONFIG.display.dimensions.cardMinWidth,
    gap: DEFAULT_CONFIG.display.dimensions.gridGap,
    totalWidth: (DEFAULT_CONFIG.display.dimensions.cardMinWidth * DEFAULT_CONFIG.display.layouts.forexColumns) +
                (DEFAULT_CONFIG.display.dimensions.gridGap * (DEFAULT_CONFIG.display.layouts.forexColumns - 1)),
  } as const,

  CRYPTO_GRID: {
    columns: DEFAULT_CONFIG.display.layouts.cryptoColumns,
    itemWidth: DEFAULT_CONFIG.display.dimensions.cardMinWidth,
    gap: DEFAULT_CONFIG.display.dimensions.gridGap,
    totalWidth: (DEFAULT_CONFIG.display.dimensions.cardMinWidth * DEFAULT_CONFIG.display.layouts.cryptoColumns) +
                (DEFAULT_CONFIG.display.dimensions.gridGap * (DEFAULT_CONFIG.display.layouts.cryptoColumns - 1)),
  } as const,

  // Sparkline constants
  SPARKLINE: {
    width: DEFAULT_CONFIG.display.dimensions.sparklineWidth,
    height: DEFAULT_CONFIG.display.dimensions.sparklineHeight,
    aspectRatio: DEFAULT_CONFIG.display.dimensions.sparklineWidth / DEFAULT_CONFIG.display.dimensions.sparklineHeight,
    maxPoints: DEFAULT_CONFIG.display.counts.maxSparklinePoints,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  } as const,

  // Card dimensions with padding
  CARD: {
    minWidth: DEFAULT_CONFIG.display.dimensions.cardMinWidth,
    maxWidth: DEFAULT_CONFIG.display.dimensions.cardMaxWidth,
    borderRadius: DEFAULT_CONFIG.display.dimensions.borderRadius,
    // Pre-calculated with standard padding
    contentWidth: DEFAULT_CONFIG.display.dimensions.cardMinWidth - 32, // 16px padding each side
    contentHeight: 200, // Standard card content height
  } as const,
} as const;

/**
 * Mathematical constants and lookup tables
 * Pre-calculated values for performance-critical operations
 */
export const MATH_CONSTANTS = {
  // Decimal precision lookup for number formatting
  DECIMAL_FACTORS: [1, 10, 100, 1000, 10000, 100000] as const,

  // Percentage change thresholds (pre-calculated)
  CHANGE_THRESHOLDS: {
    MINIMAL: 0.001,   // 0.1%
    SMALL: 0.005,     // 0.5%
    MEDIUM: 0.01,     // 1%
    LARGE: 0.02,      // 2%
    EXTREME: 0.05,    // 5%
  } as const,

  // Common angle calculations (radians)
  ANGLES: {
    QUARTER_PI: Math.PI / 4,
    HALF_PI: Math.PI / 2,
    THREE_QUARTER_PI: (3 * Math.PI) / 4,
    TWO_PI: Math.PI * 2,
  } as const,

  // Smooth step function values (0 to 1 in 0.1 increments)
  SMOOTH_STEP_TABLE: (() => {
    const table = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      table.push(t * t * (3 - 2 * t)); // Smooth step formula
    }
    return Object.freeze(table);
  })(),
} as const;

/**
 * Number formatting lookup tables
 * Eliminates runtime string operations
 */
export const FORMAT_LOOKUP = {
  // Currency symbols
  CURRENCY_SYMBOLS: {
    USD: '$',
    CAD: 'C$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CHF: 'Fr',
    AUD: 'A$',
    CNY: '¥',
    BTC: '₿',
    ETH: 'Ξ',
  } as const,

  // Decimal formatters (pre-created)
  DECIMAL_FORMATTERS: {
    0: new Intl.NumberFormat('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    1: new Intl.NumberFormat('en-CA', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    2: new Intl.NumberFormat('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    3: new Intl.NumberFormat('en-CA', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    4: new Intl.NumberFormat('en-CA', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
  } as const,

  // Percentage formatter
  PERCENTAGE_FORMATTER: new Intl.NumberFormat('en-CA', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),

  // Compact number formatter for large values
  COMPACT_FORMATTER: new Intl.NumberFormat('en-CA', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }),
} as const;

/**
 * Performance monitoring thresholds
 * Pre-defined values for performance alerts
 */
export const PERFORMANCE_THRESHOLDS = {
  // Render timing thresholds (ms)
  RENDER: {
    EXCELLENT: 8,     // < 8ms
    GOOD: 12,         // < 12ms
    WARNING: 16,      // < 16ms (frame drop risk)
    CRITICAL: 20,     // > 20ms (definite frame drop)
  } as const,

  // Memory usage thresholds (MB)
  MEMORY: {
    LOW: 50,          // < 50MB
    MEDIUM: 100,      // < 100MB
    HIGH: 200,        // < 200MB
    CRITICAL: 300,    // > 300MB
  } as const,

  // FPS thresholds
  FPS: {
    EXCELLENT: 58,    // > 58fps
    GOOD: 55,         // > 55fps
    WARNING: 50,      // > 50fps
    CRITICAL: 45,     // < 45fps
  } as const,
} as const;

/**
 * WebGL/Canvas optimization constants
 * Pre-calculated values for graphics operations
 */
export const GRAPHICS_CONSTANTS = {
  // WebGL context attributes for maximum performance
  WEBGL_CONTEXT_ATTRIBUTES: {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    desynchronized: true,
    powerPreference: 'high-performance' as const,
    preserveDrawingBuffer: false,
  } as const,

  // Canvas context attributes
  CANVAS_CONTEXT_ATTRIBUTES: {
    alpha: true,
    desynchronized: true,
    willReadFrequently: false,
  } as const,

  // Common vertex buffer sizes
  BUFFER_SIZES: {
    SMALL: 1024,      // Small sparklines
    MEDIUM: 4096,     // Standard sparklines
    LARGE: 16384,     // Complex charts
  } as const,

  // Color channel constants for fast color manipulation
  COLOR_CHANNELS: {
    RED_SHIFT: 16,
    GREEN_SHIFT: 8,
    BLUE_SHIFT: 0,
    ALPHA_SHIFT: 24,
    RGB_MASK: 0xFFFFFF,
    ALPHA_MASK: 0xFF000000,
  } as const,
} as const;

/**
 * Memory pool for object reuse
 * Eliminates garbage collection pressure
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  acquire(): T {
    const obj = this.pool.pop();
    return obj || this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }

  size(): number {
    return this.pool.length;
  }
}

/**
 * Common object pools for performance
 */
export const OBJECT_POOLS = {
  // Vector2D pool for position calculations
  vector2D: new ObjectPool(
    () => ({ x: 0, y: 0 }),
    (v) => { v.x = 0; v.y = 0; },
    50
  ),

  // Rectangle pool for bounds calculations
  rectangle: new ObjectPool(
    () => ({ x: 0, y: 0, width: 0, height: 0 }),
    (r) => { r.x = 0; r.y = 0; r.width = 0; r.height = 0; },
    20
  ),

  // Color pool for color calculations
  color: new ObjectPool(
    () => ({ r: 0, g: 0, b: 0, a: 1 }),
    (c) => { c.r = 0; c.g = 0; c.b = 0; c.a = 1; },
    30
  ),
} as const;

/**
 * Fast utility functions with zero allocation
 */
export const FAST_UTILS = {
  /**
   * Fast number formatting without string allocation
   */
  formatNumber: (value: number, decimals: keyof typeof FORMAT_LOOKUP.DECIMAL_FORMATTERS): string => {
    return FORMAT_LOOKUP.DECIMAL_FORMATTERS[decimals].format(value);
  },

  /**
   * Fast percentage change calculation
   */
  percentageChange: (oldValue: number, newValue: number): number => {
    return oldValue === 0 ? 0 : (newValue - oldValue) / oldValue;
  },

  /**
   * Fast trend classification
   */
  getTrend: (change: number): 'up' | 'down' | 'flat' => {
    if (change > MATH_CONSTANTS.CHANGE_THRESHOLDS.MINIMAL) return 'up';
    if (change < -MATH_CONSTANTS.CHANGE_THRESHOLDS.MINIMAL) return 'down';
    return 'flat';
  },

  /**
   * Fast color interpolation
   */
  interpolateColor: (color1: readonly number[], color2: readonly number[], t: number): string => {
    const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
    const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
    const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);
    return `rgb(${r},${g},${b})`;
  },

  /**
   * Fast clamping
   */
  clamp: (value: number, min: number, max: number): number => {
    return value < min ? min : value > max ? max : value;
  },

  /**
   * Fast linear interpolation
   */
  lerp: (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
  },
} as const;

export default {
  TIMING_CONSTANTS,
  COLOR_LOOKUP,
  LAYOUT_CONSTANTS,
  MATH_CONSTANTS,
  FORMAT_LOOKUP,
  PERFORMANCE_THRESHOLDS,
  GRAPHICS_CONSTANTS,
  OBJECT_POOLS,
  FAST_UTILS,
};