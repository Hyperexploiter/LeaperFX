# LeaperFX Dashboard Configuration System

A centralized, high-performance configuration system maintaining sub-12ms frame budget at 4K 60Hz.

## Overview

The configuration system provides:
- **Zero-cost abstractions** with pre-calculated values
- **Runtime configuration** updates with change events
- **Environment-based profiles** (production, development, demo)
- **Type safety** with comprehensive TypeScript interfaces
- **VITE_* environment variable** integration
- **Performance monitoring** and validation

## Quick Start

```typescript
import { getConfig, setConfig, configManager } from './config';

// Get configuration values (optimized for hot paths)
const refreshRate = getConfig('timing.refreshIntervals.critical');
const maxRenderTime = getConfig('performance.engine.maxRenderTime');

// Set configuration at runtime
setConfig('display.counts.visibleForexPairs', 15);

// Subscribe to changes
const unsubscribe = configManager.subscribe('timing.*', (event) => {
  console.log(`Config changed: ${event.path} = ${event.newValue}`);
});
```

## Architecture

### Core Components

1. **DashboardConfig.ts** - Central configuration interfaces and defaults
2. **ConfigurationManager.ts** - Singleton manager with runtime updates
3. **profiles/** - Environment-specific configurations
4. **PerformanceOptimizations.ts** - Zero-cost abstractions and lookup tables
5. **EnvironmentVariables.ts** - VITE_* variable mapping and validation

### Configuration Structure

```typescript
interface DashboardConfig {
  timing: {
    refreshIntervals: { critical, high, medium, low, background };
    animations: { sparklineFrame, signalPulse, rotationFade, etc. };
    rotations: { commodityPanel, moversMode, moversFeature, etc. };
    debounce: { priceUpdate, signalCheck, layoutReflow, etc. };
  };
  display: {
    dimensions: { sparklineWidth, sparklineHeight, cardMinWidth, etc. };
    counts: { maxSparklinePoints, visibleForexPairs, etc. };
    layouts: { forexColumns, cryptoColumns, etc. };
    precision: { forexDecimals, cryptoDecimals, etc. };
  };
  colors: {
    trends: { bullish, bearish, neutral, etc. };
    accents: { primary, secondary, warning, etc. };
    status: { connected, disconnected, loading, etc. };
    sparklines: { forex, crypto, commodity, index };
    backgrounds: { card, cardDark, grid, gridDark };
  };
  performance: {
    engine: { maxRenderTime, targetFPS, frameInterval, etc. };
    sparklines: { decimationFactor, cacheTimeout, etc. };
    signals: { detectionInterval, historyWindow, etc. };
    memory: { dataRetention, bufferSize, cacheSize, etc. };
  };
  providers: {
    priorities: { forex, crypto, commodity, index, yield };
    timeouts: { connection, response, websocket, retry };
    fallbacks: { maxRetries, backoffMultiplier, etc. };
    websocket: { reconnectInterval, pingInterval, etc. };
  };
  features: {
    enabled: { sparklines, signals, rotation, realtime, etc. };
    experimental: { webWorkers, offscreenCanvas, etc. };
    accessibility: { reducedMotion, highContrast, etc. };
  };
}
```

## Environment Profiles

### Production Profile
- Conservative update intervals
- Enhanced error handling
- Optimized for stability
- Debug features disabled

### Development Profile
- Fast update intervals
- Debug features enabled
- Experimental features available
- Hot reload support

### Demo Profile
- Eye-catching visuals
- Enhanced animations
- Presentation-optimized timing
- Larger display elements

## Environment Variables

Configure the dashboard using VITE_* environment variables:

### Timing Configuration
```bash
VITE_REFRESH_CRITICAL=1000          # Critical data refresh (ms)
VITE_REFRESH_HIGH=5000             # High priority refresh (ms)
VITE_COMMODITIES_ROTATE_MS=21000   # Commodity rotation interval
VITE_MOVERS_MODE_MS=24000          # Top movers mode switch
```

### Display Configuration
```bash
VITE_FOREX_VISIBLE=12              # Visible forex pairs
VITE_CRYPTO_VISIBLE=8              # Visible crypto pairs
VITE_SPARKLINE_POINTS=300          # Max sparkline points
VITE_FOREX_COLUMNS=3               # Forex grid columns
```

### Performance Configuration
```bash
VITE_TARGET_FPS=60                 # Target frame rate
VITE_MAX_RENDER_TIME=12            # Max render budget (ms)
VITE_BATCH_SIZE=50                 # Update batch size
VITE_BUFFER_SIZE=1000              # Ring buffer size
```

### Feature Flags
```bash
VITE_ENABLE_SPARKLINES=true        # Enable sparkline charts
VITE_ENABLE_SIGNALS=true           # Enable signal detection
VITE_ENABLE_WEBWORKERS=false       # Enable web workers
VITE_DEBUG_MODE=false              # Enable debug mode
```

## Performance Optimizations

### Zero-Cost Abstractions

```typescript
import { QUICK_CONFIG, PERF_CONFIG } from './config';

// Pre-calculated constants (zero runtime cost)
const frameTime = QUICK_CONFIG.FRAME_TIME;
const renderBudget = QUICK_CONFIG.RENDER_BUDGET;

// Optimized getters for hot paths
const maxRenderTime = PERF_CONFIG.getMaxRenderTime();
const sparklineWidth = PERF_CONFIG.getSparklineWidth();
```

### Lookup Tables

```typescript
import { COLOR_LOOKUP, FORMAT_LOOKUP } from './config';

// Pre-parsed RGB values
const bullishRGB = COLOR_LOOKUP.BULLISH_RGB; // [16, 185, 129]

// Pre-created formatters
const formatter = FORMAT_LOOKUP.DECIMAL_FORMATTERS[2]; // 2 decimal places
```

### Object Pools

```typescript
import { OBJECT_POOLS } from './config';

// Reuse objects to prevent GC pressure
const point = OBJECT_POOLS.vector2D.acquire();
point.x = 100;
point.y = 200;
// ... use point
OBJECT_POOLS.vector2D.release(point);
```

## Usage Examples

### Basic Configuration Access

```typescript
import { getConfig, getConfigSection } from './config';

// Get specific values
const refreshRate = getConfig('timing.refreshIntervals.critical');
const sparklineHeight = getConfig('display.dimensions.sparklineHeight');

// Get entire sections
const timingConfig = getConfigSection('timing');
const colorsConfig = getConfigSection('colors');
```

### Runtime Configuration Updates

```typescript
import { setConfig, configManager } from './config';

// Update configuration
setConfig('display.counts.visibleForexPairs', 15);
setConfig('performance.engine.maxRenderTime', 10);

// Batch updates for performance
configManager.batchUpdate({
  'timing.refreshIntervals.high': 3000,
  'display.counts.maxSparklinePoints': 250,
  'features.enabled.animations': false,
});
```

### Change Event Subscription

```typescript
import { configManager } from './config';

// Subscribe to specific changes
const unsubscribe = configManager.subscribe(
  'performance.engine.maxRenderTime',
  (event) => {
    console.log(`Render budget changed: ${event.newValue}ms`);
    // Update render engine settings
  }
);

// Subscribe to section changes
configManager.subscribe('timing.*', (event) => {
  console.log(`Timing config changed: ${event.path}`);
});

// Cleanup
unsubscribe();
```

### Environment Detection

```typescript
import { detectEnvironment, getProfile } from './config';

const env = detectEnvironment(); // 'production' | 'development' | 'demo'
const profile = getProfile(env);

if (env === 'development') {
  // Enable development features
  setConfig('features.enabled.debug', true);
}
```

### Performance Monitoring

```typescript
import { configManager } from './config';

// Get performance metrics
const metrics = configManager.getMetrics();
console.log(`Get operations: ${metrics.getOperations}`);
console.log(`Cache hit rate: ${metrics.cacheHitRate * 100}%`);

// Validate performance settings
const isValid = CONFIG_UTILS.validatePerformance();
if (!isValid) {
  console.warn('Performance settings may cause frame drops');
}
```

## Integration Patterns

### Component Integration

```typescript
import React, { useEffect, useState } from 'react';
import { getConfig, configManager } from './config';

export const SparklineChart: React.FC = () => {
  const [width, setWidth] = useState(getConfig('display.dimensions.sparklineWidth'));
  const [height, setHeight] = useState(getConfig('display.dimensions.sparklineHeight'));

  useEffect(() => {
    const unsubscribe = configManager.subscribe('display.dimensions.*', (event) => {
      if (event.path.includes('sparklineWidth')) {
        setWidth(event.newValue);
      } else if (event.path.includes('sparklineHeight')) {
        setHeight(event.newValue);
      }
    });

    return unsubscribe;
  }, []);

  return <canvas width={width} height={height} />;
};
```

### Service Integration

```typescript
import { getConfig, configManager } from './config';

export class DataService {
  private refreshInterval: number;

  constructor() {
    this.refreshInterval = getConfig('timing.refreshIntervals.high');

    // Update interval when configuration changes
    configManager.subscribe('timing.refreshIntervals.high', (event) => {
      this.refreshInterval = event.newValue;
      this.restartPolling();
    });
  }

  private restartPolling() {
    clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.fetchData();
    }, this.refreshInterval);
  }
}
```

## Best Practices

### Performance
1. Use `QUICK_CONFIG` for frequently accessed values
2. Use `PERF_CONFIG` getters in hot paths
3. Subscribe to specific paths, not wildcards
4. Batch configuration updates when possible
5. Use object pools for temporary objects

### Configuration Design
1. Group related settings logically
2. Provide sensible defaults
3. Validate configuration changes
4. Document all configuration options
5. Use environment variables for deployment-specific settings

### Runtime Updates
1. Debounce rapid configuration changes
2. Validate changes before applying
3. Provide rollback mechanisms
4. Monitor performance impact
5. Log configuration changes in development

## Troubleshooting

### Performance Issues
- Check `maxRenderTime` is within frame budget
- Verify sparkline point count is reasonable
- Monitor memory usage and GC pressure
- Use performance profiler for hot paths

### Configuration Errors
- Validate environment variable formats
- Check configuration path syntax
- Verify type compatibility
- Use development profile for debugging

### Environment Variables
- Ensure VITE_ prefix for build-time variables
- Check variable types and ranges
- Verify environment detection logic
- Test configuration inheritance

## Migration Guide

### From Hardcoded Values
1. Identify hardcoded configuration values
2. Map to appropriate configuration paths
3. Replace with `getConfig()` calls
4. Add environment variable overrides
5. Test with different profiles

### Adding New Configuration
1. Add to interface definitions
2. Set default values
3. Add environment variable mapping
4. Update validation logic
5. Document the new setting

This configuration system ensures optimal performance while providing flexibility for different deployment environments and runtime scenarios.