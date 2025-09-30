# Real-Time Data Architecture Documentation

## Overview

This document outlines the comprehensive real-time data architecture implemented for the Bloomberg Terminal-style dashboard. The architecture provides production-ready, scalable real-time cryptocurrency data feeds with advanced animation, buffering, and error handling capabilities.

## Architecture Components

### 1. Coinbase WebSocket Service (`coinbaseWebSocketService.ts`)
- **Purpose**: Connects to Coinbase Pro WebSocket API for real-time crypto data
- **Features**:
  - Multi-symbol subscription management
  - OHLCV data aggregation for multiple timeframes (1m, 5m, 15m, 1h, 4h, 1d)
  - Automatic reconnection with exponential backoff
  - Real-time price updates with change calculations
  - Subscription lifecycle management

```typescript
// Example usage
import coinbaseWebSocketService from './services/coinbaseWebSocketService';

// Connect and subscribe to price updates
await coinbaseWebSocketService.connect();
const unsubscribe = coinbaseWebSocketService.subscribePriceUpdates(
  'BTC-USD',
  (priceData) => console.log('New price:', priceData.price)
);
```

### 2. Chart Data Adapter (`chartDataAdapter.ts`)
- **Purpose**: Transforms raw WebSocket data into chart-compatible formats
- **Features**:
  - Recharts integration with smooth data transitions
  - Bloomberg Terminal-style chart formatting
  - Technical indicators (EMA, SMA, VWAP)
  - Animated price transitions with easing functions
  - Mini-chart data generation for market cards

```typescript
// Example usage
import chartDataAdapter from './services/chartDataAdapter';

const chartData = chartDataAdapter.generateBloombergChartData(
  ohlcvData,
  '15m',
  100
);
```

### 3. Animation Buffer Service (`animationBufferService.ts`)
- **Purpose**: Provides smooth animation buffering for real-time price updates
- **Features**:
  - 60 FPS animation loop with requestAnimationFrame
  - Multiple easing functions (cubic, sine, spring, bounce)
  - Price smoothing with EMA
  - Buffered transitions to prevent jarring price jumps
  - Subscription-based animation callbacks

```typescript
// Example usage
import animationBufferService from './services/animationBufferService';

animationBufferService.animatePrice('BTC-USD', 45000, 44500, {
  duration: 800,
  easing: 'easeOutCubic',
  smoothingFactor: 0.3
});

const unsubscribe = animationBufferService.subscribe('BTC-USD', (price) => {
  updatePriceDisplay(price);
});
```

### 4. Real-Time Data Manager (`realTimeDataManager.ts`)
- **Purpose**: Centralized state management for all real-time data
- **Features**:
  - Unified data state with Map-based storage
  - Multi-timeframe OHLCV data management
  - Automatic USD to CAD conversion
  - State broadcasting to React components
  - Symbol subscription management

```typescript
// Example usage
import realTimeDataManager from './services/realTimeDataManager';

await realTimeDataManager.initialize();
const unsubscribe = realTimeDataManager.subscribeToState((state) => {
  // Handle state updates
  updateDashboard(state);
});
```

### 5. Error Handling Service (`errorHandlingService.ts`)
- **Purpose**: Comprehensive error handling and recovery mechanisms
- **Features**:
  - Service health monitoring
  - Automatic recovery strategies with exponential backoff
  - Error pattern detection
  - Connection health tracking
  - Configurable recovery policies per service

```typescript
// Example usage
import errorHandlingService from './services/errorHandlingService';

// Report an error
const errorId = errorHandlingService.reportError(
  'coinbase-ws',
  'connection',
  'WebSocket connection failed',
  { code: 1006 },
  'critical'
);

// Subscribe to health updates
const unsubscribe = errorHandlingService.subscribeToHealth((health) => {
  console.log('Service health:', health);
});
```

### 6. React Integration Hook (`useRealTimeData.ts`)
- **Purpose**: React hook for easy consumption of real-time data
- **Features**:
  - Automatic initialization and cleanup
  - State synchronization with React components
  - Specialized hooks for different use cases
  - Animation integration
  - Error handling integration

```typescript
// Example usage
import { useRealTimeData, useCryptoData, useAnimatedPrice } from './hooks/useRealTimeData';

function CryptoComponent() {
  const { cryptoData, isLoading, error } = useCryptoData();
  const { price, trend, isAnimating } = useAnimatedPrice({
    symbol: 'BTC-USD',
    enableAnimation: true
  });

  return (
    <div>
      {isAnimating && <span>Updating...</span>}
      <span>BTC Price: ${price?.toLocaleString()}</span>
    </div>
  );
}
```

### 7. Real-Time Crypto Section Component (`RealTimeCryptoSection.tsx`)
- **Purpose**: Production-ready React component for crypto display
- **Features**:
  - Real-time price updates with animations
  - Mini-charts with trend visualization
  - Automatic symbol rotation
  - Loading and error states
  - Responsive design

## Integration with ExchangeDashboard

### Step 1: Import and Initialize Services

```typescript
// Add to ExchangeDashboard.tsx imports
import { useCryptoData, useMarketHealth } from './hooks/useRealTimeData';
import RealTimeCryptoSection from './components/RealTimeCryptoSection';
import errorHandlingService from './services/errorHandlingService';
```

### Step 2: Replace Static Crypto Data

Replace the existing static crypto section with the real-time component:

```typescript
// Replace existing crypto section with:
<RealTimeCryptoSection />
```

### Step 3: Add Health Monitoring

```typescript
function ExchangeDashboard() {
  const { health, statistics } = useMarketHealth();

  // Display connection status in header
  const connectionIndicator = (
    <div className={`w-2 h-2 rounded-full ${
      health === 'healthy' ? 'bg-green-400' :
      health === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
    }`} />
  );

  return (
    // ... existing JSX with connection indicator in header
  );
}
```

## Production Configuration

### Environment Variables

Create `.env` file with:

```env
# Coinbase WebSocket URL (optional, defaults to wss://ws-feed.exchange.coinbase.com)
REACT_APP_COINBASE_WS_URL=wss://ws-feed.exchange.coinbase.com

# Animation settings
REACT_APP_ANIMATION_DURATION=800
REACT_APP_SMOOTHING_FACTOR=0.3

# Error handling
REACT_APP_MAX_RECONNECT_ATTEMPTS=5
REACT_APP_HEALTH_CHECK_INTERVAL=30000
```

### Performance Optimization

1. **Memory Management**: Services automatically clean up old data
2. **Connection Pooling**: Single WebSocket connection for all symbols
3. **Data Compression**: Efficient Map-based storage
4. **Animation Throttling**: 60 FPS cap with requestAnimationFrame
5. **Error Recovery**: Exponential backoff prevents connection storms

### Monitoring and Logging

```typescript
// Get service statistics
const stats = realTimeDataManager.getStatistics();
console.log('Active subscriptions:', stats.subscriptions);
console.log('Prices tracked:', stats.pricesTracked);
console.log('Connection status:', stats.connectionStatus);

// Get error statistics
const errorStats = errorHandlingService.getErrorStatistics();
console.log('Total errors:', errorStats.totalErrors);
console.log('Unresolved errors:', errorStats.unresolvedErrors);
```

## Data Flow Architecture

```
Coinbase WebSocket API
        ↓
CoinbaseWebSocketService (Raw data ingestion)
        ↓
ChartDataAdapter (Data transformation)
        ↓
AnimationBufferService (Smooth transitions)
        ↓
RealTimeDataManager (State management)
        ↓
useRealTimeData Hook (React integration)
        ↓
React Components (UI rendering)
```

## Error Recovery Strategies

### WebSocket Connection Failures
1. Automatic reconnection with exponential backoff
2. Connection health monitoring
3. Fallback to polling if WebSocket fails
4. Service degradation notifications

### Data Processing Errors
1. Error pattern detection
2. Automatic data validation
3. Graceful fallback to cached data
4. Recovery attempt logging

### Animation System Failures
1. Animation buffer cleanup and restart
2. Fallback to instant updates
3. Performance monitoring
4. Memory leak prevention

## Scalability Considerations

### Horizontal Scaling
- Multiple WebSocket connections for different exchanges
- Load balancing across data providers
- Distributed state management
- Microservice architecture ready

### Vertical Scaling
- Efficient memory usage with Map structures
- Lazy loading of historical data
- Connection pooling
- Batch processing of updates

### Real-Time Performance
- Sub-100ms update latency
- 60 FPS smooth animations
- Optimized React rendering
- Minimal DOM updates

## Testing Strategy

### Unit Tests
- Service isolation testing
- Data transformation validation
- Error handling verification
- Animation timing tests

### Integration Tests
- End-to-end data flow testing
- WebSocket connection testing
- State synchronization testing
- Error recovery testing

### Performance Tests
- Memory usage monitoring
- Animation performance testing
- Connection stability testing
- Load testing with multiple symbols

## Deployment Checklist

- [ ] Environment variables configured
- [ ] WebSocket connection tested
- [ ] Error handling tested
- [ ] Performance monitoring enabled
- [ ] Logging configured
- [ ] Health checks implemented
- [ ] Fallback mechanisms tested
- [ ] Documentation updated

## Troubleshooting Guide

### Common Issues

1. **WebSocket Connection Fails**
   - Check network connectivity
   - Verify Coinbase API status
   - Check firewall/proxy settings
   - Review error logs

2. **Animations Not Working**
   - Check browser support for requestAnimationFrame
   - Verify animation service initialization
   - Check performance settings
   - Review animation buffer logs

3. **Data Not Updating**
   - Verify WebSocket subscription status
   - Check data transformation pipeline
   - Review state management logs
   - Validate React component mounting

4. **High Memory Usage**
   - Check for memory leaks in subscriptions
   - Verify data cleanup schedules
   - Monitor buffer sizes
   - Review component lifecycle

## Future Enhancements

1. **Additional Data Sources**: Binance, Kraken, etc.
2. **Advanced Charting**: TradingView integration
3. **Machine Learning**: Price prediction models
4. **Mobile Support**: React Native components
5. **Real-Time Alerts**: Push notifications
6. **Portfolio Tracking**: User account integration

This architecture provides a solid foundation for real-time financial data display with production-ready error handling, performance optimization, and scalability features.