# Bloomberg Terminal-Style Exchange Currency Dashboard

A comprehensive, real-time financial dashboard built with React and TypeScript, featuring a Bloomberg Terminal-inspired design with live cryptocurrency data, exchange rates, and market information.

## Overview

This self-contained dashboard module provides a sophisticated financial trading interface with real-time data visualization, modeled after professional Bloomberg Terminal interfaces. The dashboard integrates multiple data sources and provides live market information with professional-grade styling and animations.

## Features

### Real-Time Data Integration
- **Live Cryptocurrency Prices**: Real-time BTC, ETH, and other major cryptocurrency prices from Coinbase WebSocket API
- **Exchange Rates**: Live currency exchange rates with historical comparison
- **Market Health Monitoring**: Connection status and data quality indicators
- **Animated Price Updates**: Smooth price transitions with visual feedback

### Professional Trading Interface
- **Bloomberg Terminal Styling**: Dark theme with professional color scheme (cyan, gold, green/red indicators)
- **Multi-Panel Layout**: Organized sections for currencies, crypto, commodities, and yields
- **Interactive Charts**: Recharts-powered visualizations with gradients and animations
- **Live Ticker**: Scrolling price ticker at the bottom with real-time updates

### Advanced Features
- **Market Watch**: Rotating commodity prices (Gold, Silver, Copper, Oil, etc.)
- **Yield Charts**: Canadian bond yields with intraday/yearly views and 30-second rotation
- **Weather Widget**: Current conditions and time display
- **Daily Bulletin**: Financial news updates
- **Currency Management**: Add/remove currencies with drag-and-drop interface

## Directory Structure

```
/src/exchange_currency_dash/
├── README.md                    # This documentation
├── index.ts                     # Main exports
├── ExchangeDashboard.tsx        # Main dashboard component
├── components/
│   └── RealTimeCryptoSection.tsx    # Cryptocurrency section with live data
├── services/
│   ├── coinbaseWebSocketService.ts  # Coinbase WebSocket integration
│   ├── chartDataAdapter.ts          # Data transformation utilities
│   ├── animationBufferService.ts    # Price animation handling
│   ├── realTimeDataManager.ts       # Real-time data coordination
│   └── errorHandlingService.ts      # Error handling and recovery
├── hooks/
│   └── useRealTimeData.ts           # React hooks for real-time data
├── styles/
│   └── sexymodal.css               # Bloomberg Terminal styling
└── types/
    └── (TypeScript type definitions)
```

## Components

### ExchangeDashboard (Main Component)
The primary dashboard component that orchestrates all sub-components and manages the overall layout.

**Key Features:**
- Multi-column responsive layout
- Real-time rate updates every 30 minutes
- WebSocket integration for live data
- Currency management (add/remove)
- Dark/light mode toggle
- Professional ticker display

### RealTimeCryptoSection
Displays live cryptocurrency data with animated price updates and mini-charts.

**Features:**
- Live price feeds from Coinbase
- Animated price transitions
- 24-hour change indicators
- Mini area charts with gradients
- Error handling and reconnection

### Services Architecture

#### coinbaseWebSocketService.ts
- WebSocket connection management
- Real-time price subscriptions
- Connection health monitoring
- Automatic reconnection logic

#### realTimeDataManager.ts
- Centralized data coordination
- Market state management
- Data validation and filtering
- Performance optimization

#### animationBufferService.ts
- Smooth price animations
- Buffer management for updates
- Visual feedback coordination

#### chartDataAdapter.ts
- Data transformation for charts
- OHLCV data processing
- Time series formatting

#### errorHandlingService.ts
- Comprehensive error handling
- Service recovery mechanisms
- User notification system

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with WebSocket support

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the project root:
   ```env
   # Optional: Add any API keys or configuration
   VITE_COINBASE_WS_URL=wss://ws-feed.exchange.coinbase.com
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   ```

### Integration

To use the dashboard in your application:

```typescript
// Import the main component
import { ExchangeDashboard } from './src/exchange_currency_dash';

// Use in your React app
function App() {
  return (
    <div className="App">
      <ExchangeDashboard />
    </div>
  );
}
```

### Custom Hooks

```typescript
// Use real-time data hooks
import { useCryptoData, useMarketHealth } from './src/exchange_currency_dash';

function MyComponent() {
  const cryptoData = useCryptoData(['BTC-USD', 'ETH-USD']);
  const { health, isConnected } = useMarketHealth();

  // Your component logic
}
```

## Real-Time Data Integration

### Data Sources
- **Coinbase Pro WebSocket API**: Live cryptocurrency prices
- **Exchange Rate API**: Currency conversion rates
- **Simulated Market Data**: Commodities and yields (for demo)

### WebSocket Connection
The dashboard maintains persistent WebSocket connections for real-time updates:

```typescript
// Connection is automatically managed
const wsService = coinbaseWebSocketService;
wsService.connect();
wsService.subscribe(['BTC-USD', 'ETH-USD'], callback);
```

### Data Flow
1. WebSocket receives price updates
2. animationBufferService queues smooth transitions
3. realTimeDataManager validates and distributes data
4. React components re-render with new data
5. Visual animations provide user feedback

## Styling and Theming

### Bloomberg Terminal Design
- **Primary Colors**: Cyan (#00D4FF), Gold (#FFD700), Orange (#FFA500)
- **Success/Loss**: Green (#00FF88), Red (#FF4444)
- **Background**: Gradient blacks and dark blues
- **Typography**: Monospace fonts for data, sans-serif for labels

### Responsive Design
- **Mobile First**: Optimized for all screen sizes
- **Breakpoints**: Tailwind CSS responsive utilities
- **Flexible Layout**: CSS Grid and Flexbox

### Custom Animations
- **Price Changes**: Color flashes and smooth transitions
- **Charts**: Gradient fills with glow effects
- **Loading States**: Professional spinner and skeleton screens

## Performance Optimizations

### Real-Time Updates
- **Debounced Updates**: Prevents excessive re-renders
- **Selective Subscriptions**: Only subscribe to needed data
- **Memory Management**: Proper cleanup of WebSocket connections

### Rendering Performance
- **React.memo**: Optimized component re-renders
- **useMemo/useCallback**: Cached expensive calculations
- **Virtual Scrolling**: For large data sets

### Bundle Size
- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Dynamic imports for non-critical features
- **Asset Optimization**: Compressed images and minified CSS

## Error Handling

### Network Resilience
- **Automatic Reconnection**: WebSocket reconnection with exponential backoff
- **Fallback Data**: Cached data during outages
- **User Notifications**: Clear error messages and recovery instructions

### Data Validation
- **Schema Validation**: Ensure data integrity
- **Sanitization**: Clean and validate incoming data
- **Graceful Degradation**: Partial functionality during issues

## Development

### Adding New Data Sources
1. Create service in `/services/`
2. Add type definitions in `/types/`
3. Create custom hook in `/hooks/`
4. Integrate with main dashboard

### Customizing Appearance
1. Modify `/styles/sexymodal.css` for global styles
2. Update color scheme in component styles
3. Adjust responsive breakpoints in Tailwind config

### Testing
```bash
# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## License

This project is part of the Leaper-Fx dashboard system.

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.

---

**Built with**: React 18, TypeScript, Tailwind CSS, Recharts, WebSocket API
**Compatible with**: Modern browsers, Node.js 18+
**Last Updated**: September 2025