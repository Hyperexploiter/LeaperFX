/**
 * Example Migration Guide
 * Shows how to migrate from hardcoded values to centralized configuration
 * Demonstrates performance optimizations and best practices
 */

import React from 'react';
import { getConfig, QUICK_CONFIG, PERF_CONFIG, configManager } from './index';

// ===== BEFORE: Hardcoded Values =====

// OLD: Hardcoded timing values scattered throughout codebase
const OLD_CRITICAL_REFRESH = 1000;
const OLD_HIGH_REFRESH = 5000;
const OLD_COMMODITY_ROTATION = 21000;
const OLD_SPARKLINE_WIDTH = 200;
const OLD_SPARKLINE_HEIGHT = 60;
const OLD_MAX_RENDER_TIME = 12;

// OLD: Component with hardcoded values
class OldSparklineRenderer {
  private width = 200;           // Hardcoded
  private height = 60;           // Hardcoded
  private maxPoints = 300;       // Hardcoded
  private updateInterval = 1000; // Hardcoded

  render() {
    const startTime = performance.now();

    // Rendering logic...

    const renderTime = performance.now() - startTime;
    if (renderTime > 12) { // Hardcoded threshold
      console.warn('Render time exceeded budget');
    }
  }
}

// ===== AFTER: Configuration-Driven =====

// NEW: Import centralized configuration
import {
  DashboardConfig,
  getConfig,
  getConfigSection,
  QUICK_CONFIG,
  PERF_CONFIG,
  configManager,
  COLOR_LOOKUP,
  TIMING_CONSTANTS,
} from './index';

// NEW: Component with centralized configuration
class NewSparklineRenderer {
  private width: number;
  private height: number;
  private maxPoints: number;
  private updateInterval: number;
  private maxRenderTime: number;

  constructor() {
    // Initialize from configuration
    this.width = getConfig('display.dimensions.sparklineWidth');
    this.height = getConfig('display.dimensions.sparklineHeight');
    this.maxPoints = getConfig('display.counts.maxSparklinePoints');
    this.updateInterval = getConfig('timing.refreshIntervals.critical');
    this.maxRenderTime = getConfig('performance.engine.maxRenderTime');

    // Subscribe to configuration changes
    this.setupConfigSubscriptions();
  }

  private setupConfigSubscriptions() {
    // React to dimension changes
    configManager.subscribe('display.dimensions.*', (event) => {
      if (event.path.includes('sparklineWidth')) {
        this.width = event.newValue;
        this.invalidateCache();
      } else if (event.path.includes('sparklineHeight')) {
        this.height = event.newValue;
        this.invalidateCache();
      }
    });

    // React to performance changes
    configManager.subscribe('performance.engine.maxRenderTime', (event) => {
      this.maxRenderTime = event.newValue;
    });
  }

  render() {
    const startTime = performance.now();

    // Rendering logic using configured values...

    const renderTime = performance.now() - startTime;
    if (renderTime > this.maxRenderTime) {
      console.warn(`Render time (${renderTime.toFixed(1)}ms) exceeded budget (${this.maxRenderTime}ms)`);
    }
  }

  private invalidateCache() {
    // Invalidate any cached rendering data when dimensions change
  }
}

// ===== PERFORMANCE OPTIMIZED VERSION =====

// OPTIMIZED: Use pre-calculated values for hot paths
class OptimizedSparklineRenderer {
  private width: number;
  private height: number;
  private maxPoints: number;
  private maxRenderTime: number;

  constructor() {
    // Use quick config for frequently accessed values
    this.width = QUICK_CONFIG.SPARKLINE_WIDTH;
    this.height = QUICK_CONFIG.SPARKLINE_HEIGHT;
    this.maxPoints = QUICK_CONFIG.MAX_POINTS;
    this.maxRenderTime = QUICK_CONFIG.MAX_RENDER_TIME;
  }

  render() {
    const startTime = performance.now();

    // Use performance-optimized getters in hot paths
    const frameTime = TIMING_CONSTANTS.FRAME_TIME_MS;
    const renderBudget = PERF_CONFIG.getRenderBudget();

    // Rendering logic...

    const renderTime = performance.now() - startTime;
    if (renderTime > renderBudget) {
      console.warn(`Frame budget exceeded: ${renderTime.toFixed(1)}ms`);
    }
  }
}

// ===== DATA SERVICE MIGRATION =====

// OLD: Service with hardcoded intervals
class OldDataService {
  private criticalInterval = 1000;  // Hardcoded
  private highInterval = 5000;      // Hardcoded
  private mediumInterval = 10000;   // Hardcoded

  startPolling() {
    setInterval(() => this.fetchCriticalData(), this.criticalInterval);
    setInterval(() => this.fetchHighPriorityData(), this.highInterval);
    setInterval(() => this.fetchMediumPriorityData(), this.mediumInterval);
  }

  private fetchCriticalData() { /* ... */ }
  private fetchHighPriorityData() { /* ... */ }
  private fetchMediumPriorityData() { /* ... */ }
}

// NEW: Service with configuration-driven intervals
class NewDataService {
  private timers: NodeJS.Timeout[] = [];

  constructor() {
    this.startPolling();
    this.setupConfigurationWatching();
  }

  private startPolling() {
    this.stopPolling(); // Clear existing timers

    const timingConfig = getConfigSection('timing');

    this.timers.push(
      setInterval(
        () => this.fetchCriticalData(),
        timingConfig.refreshIntervals.critical
      )
    );

    this.timers.push(
      setInterval(
        () => this.fetchHighPriorityData(),
        timingConfig.refreshIntervals.high
      )
    );

    this.timers.push(
      setInterval(
        () => this.fetchMediumPriorityData(),
        timingConfig.refreshIntervals.medium
      )
    );
  }

  private setupConfigurationWatching() {
    // Restart polling when timing configuration changes
    configManager.subscribe('timing.refreshIntervals.*', () => {
      console.log('Refresh intervals changed, restarting polling');
      this.startPolling();
    });
  }

  private stopPolling() {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];
  }

  private fetchCriticalData() { /* ... */ }
  private fetchHighPriorityData() { /* ... */ }
  private fetchMediumPriorityData() { /* ... */ }

  dispose() {
    this.stopPolling();
  }
}

// ===== COMPONENT MIGRATION =====

// OLD: React component with hardcoded values
function OldForexCard() {
  const [updateInterval] = React.useState(5000); // Hardcoded
  const cardWidth = 280; // Hardcoded
  const refreshRate = 5000; // Hardcoded

  React.useEffect(() => {
    const timer = setInterval(() => {
      // Fetch data
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  return (
    <div style={{ width: cardWidth }}>
      {/* Content */}
    </div>
  );
}

// NEW: React component with configuration
function NewForexCard() {
  const [updateInterval, setUpdateInterval] = React.useState(
    getConfig('timing.refreshIntervals.high')
  );
  const [cardWidth, setCardWidth] = React.useState(
    getConfig('display.dimensions.cardMinWidth')
  );

  React.useEffect(() => {
    // Subscribe to configuration changes
    const unsubscribe = configManager.subscribe('timing.refreshIntervals.high', (event) => {
      setUpdateInterval(event.newValue);
    });

    const unsubscribeWidth = configManager.subscribe('display.dimensions.cardMinWidth', (event) => {
      setCardWidth(event.newValue);
    });

    return () => {
      unsubscribe();
      unsubscribeWidth();
    };
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      // Fetch data
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  return (
    <div style={{ width: cardWidth }}>
      {/* Content */}
    </div>
  );
}

// ===== PERFORMANCE COMPARISON =====

// OLD: Multiple property accesses and string manipulation
function oldFormatPrice(value: number, currency: string) {
  let decimals = 2;
  if (currency === 'JPY') decimals = 0;
  if (currency.includes('/')) decimals = 4; // Forex pair

  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// NEW: Pre-calculated formatters and lookup tables
import { FORMAT_LOOKUP, FAST_UTILS } from './index';

function newFormatPrice(value: number, category: 'forex' | 'crypto' | 'commodity') {
  // Use pre-created formatters
  const decimalsConfig = getConfigSection('display').precision;

  switch (category) {
    case 'forex':
      return FORMAT_LOOKUP.DECIMAL_FORMATTERS[decimalsConfig.forexDecimals].format(value);
    case 'crypto':
      return FORMAT_LOOKUP.DECIMAL_FORMATTERS[decimalsConfig.cryptoDecimals].format(value);
    case 'commodity':
      return FORMAT_LOOKUP.DECIMAL_FORMATTERS[decimalsConfig.commodityDecimals].format(value);
    default:
      return FAST_UTILS.formatNumber(value, 2);
  }
}

// ===== COLOR MIGRATION =====

// OLD: Hardcoded colors and string parsing
const oldColors = {
  bullish: '#10B981',
  bearish: '#EF4444',
  neutral: '#6B7280',
};

function oldGetTrendColor(change: number): string {
  if (change > 0.001) return oldColors.bullish;
  if (change < -0.001) return oldColors.bearish;
  return oldColors.neutral;
}

// NEW: Pre-calculated color lookups
function newGetTrendColor(change: number): string {
  const trend = FAST_UTILS.getTrend(change);
  return COLOR_LOOKUP.TREND_COLORS[trend];
}

// Even faster: Direct RGB access for canvas rendering
function getRGBTrendColor(change: number): readonly number[] {
  if (change > 0.001) return COLOR_LOOKUP.BULLISH_RGB;
  if (change < -0.001) return COLOR_LOOKUP.BEARISH_RGB;
  return COLOR_LOOKUP.NEUTRAL_RGB;
}

// ===== MIGRATION CHECKLIST =====

/**
 * Migration Checklist:
 *
 * 1. ✅ Identify hardcoded values
 * 2. ✅ Map to configuration paths
 * 3. ✅ Replace with getConfig() calls
 * 4. ✅ Add configuration subscriptions for dynamic updates
 * 5. ✅ Use performance-optimized accessors in hot paths
 * 6. ✅ Implement validation and error handling
 * 7. ✅ Add environment variable overrides
 * 8. ✅ Test with different profiles
 * 9. ✅ Monitor performance impact
 * 10. ✅ Document configuration options
 */

export {
  NewSparklineRenderer,
  OptimizedSparklineRenderer,
  NewDataService,
  NewForexCard,
  newFormatPrice,
  newGetTrendColor,
  getRGBTrendColor,
};