# SAADAT Currency Exchange Dashboard

A comprehensive currency exchange management system with separate dashboards for customers and store owners.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation & Setup
```bash
# Clone the repository and navigate to the dashboard demo
cd /path/to/Leaper-Fx/dashboard/demo

# Install dependencies
npm install

# Start development server
npm run dev

# Or start with npm start
npm start
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
dashboard/demo/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ClientManagement/    # Customer management
│   │   ├── DraggableCalculator/ # Smart calculator with drag functionality
│   │   ├── SmartCalculator/     # Exchange rate calculator
│   │   ├── Modal/               # Modal components
│   │   ├── RateEditor/          # Rate management interface
│   │   └── ...
│   ├── services/            # Business logic and API services
│   │   ├── databaseService.ts       # IndexedDB database management
│   │   ├── exchangeRateService.ts   # External API rate fetching
│   │   ├── webSocketService.ts      # Real-time communication
│   │   ├── customerService.ts       # Customer management
│   │   ├── transactionService.ts    # Transaction processing
│   │   └── ...
│   ├── contexts/            # React contexts (Auth, etc.)
│   ├── assets/              # Images and static files
│   ├── App.tsx              # Main application component
│   ├── ExchangeDashboard.tsx    # Customer-facing dashboard
│   ├── StoreOwnerDashboard.tsx  # Store owner management dashboard
│   └── main.tsx             # Application entry point
├── dist/                    # Build output directory
├── package.json             # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🎯 Application Features

### Customer Dashboard (`/`)
- **Real-time Exchange Rates**: Live currency rates with automatic updates
- **Rate Ticker**: Scrolling ticker showing major currency pairs
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on desktop and mobile devices

### Store Owner Dashboard (`/owner`)
- **Authentication Required**: Secure login system
- **Smart Calculator**: Exchange rate calculator with customer management
- **Inventory Management**: Track currency stock and rates
- **Transaction History**: View and manage all transactions
- **Client Management**: Add, edit, and manage customer information
- **FINTRAC Compliance**: Built-in compliance tracking and reporting
- **Business Analytics**: Performance insights and reporting
- **Rate Control**: Modify exchange rates in real-time

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm start           # Alternative start command

# Production
npm run build       # Build for production
npm run preview     # Preview production build locally

# Testing
npm run build       # Also runs build verification
```

## 🌐 Application Routes

| Route | Component | Description | Access |
|-------|-----------|-------------|---------|
| `/` | ExchangeDashboard | Customer-facing exchange rates | Public |
| `/login` | Login | Store owner authentication | Public |
| `/owner` | StoreOwnerDashboard | Store management interface | Protected |
| `/owner-simple` | StoreOwnerDashboardSimple | Simplified owner interface | Protected |
| `/customer-form` | CustomerMobileForm | Customer information form | Public |

## 🔐 Authentication

### Default Credentials
- **Username**: `admin`
- **Password**: `password123`

### Login Process
1. Navigate to `/login`
2. Enter credentials
3. Redirected to `/owner` dashboard
4. Session persists until logout

## 💾 Data Storage

The application uses **IndexedDB** for local data persistence with automatic fallback to in-memory storage:

- **Transactions**: All exchange transactions
- **Customers**: Customer information and compliance data
- **Inventory**: Currency stock and rates
- **Compliance**: FINTRAC reporting data

## 🔄 Real-time Features

### WebSocket Communication
- **Rate Updates**: Store owner rate changes instantly appear on customer dashboard
- **Transaction Notifications**: Real-time transaction processing
- **Inventory Updates**: Live stock level monitoring
- **Compliance Alerts**: Automatic FINTRAC compliance notifications

### Connection Handling
- Automatic reconnection on connection loss
- Graceful fallback to local mode when WebSocket unavailable
- Error handling and user feedback

## 🛠️ Development Guide

### Key Components

#### ExchangeDashboard
- Fetches rates from external API (frankfurter.app)
- Subscribes to WebSocket for real-time updates
- Responsive design with dark mode support

#### StoreOwnerDashboard
- Tabbed interface for different management functions
- Real-time WebSocket integration
- FINTRAC compliance automation

#### SmartCalculator
- Exchange rate calculations with commission
- Customer selection and creation
- Transaction processing with compliance checks

### Service Architecture

#### exchangeRateService
- External API integration (frankfurter.app)
- Rate fetching and caching
- Historical data retrieval

#### webSocketService
- Real-time communication between dashboards
- Connection management with fallback
- Event subscription system

#### databaseService
- IndexedDB wrapper with TypeScript support
- Automatic schema management
- Memory fallback for compatibility

## 🚨 Troubleshooting

### Common Issues

#### "Exchange dashboard not running affects calculator"
**Fixed**: WebSocket service import inconsistencies have been resolved. Both dashboards now use consistent static imports.

#### Build Warnings
The build may show warnings about dynamic imports. These are informational and don't affect functionality:
```
(!) Some services are both dynamically and statically imported
```

#### Database Issues
If IndexedDB fails, the app automatically falls back to memory storage:
```javascript
// Check browser console for:
"IndexedDB not available, using memory storage"
```

#### WebSocket Connection Issues
The app gracefully handles WebSocket failures:
```javascript
// Check browser console for:
"WebSocket connection failed, using local mode"
```

### Performance Optimization

#### Large Bundle Size
The build warns about large chunks (>500KB). This is expected for a full-featured dashboard:
- Consider code splitting for production deployment
- Use dynamic imports for rarely-used features
- Enable gzip compression on your server

#### Memory Usage
- IndexedDB provides efficient storage
- WebSocket connections are properly cleaned up
- Components use proper cleanup in useEffect hooks

## 🔧 Configuration

### Environment Variables
Create `.env` file for custom configuration:
```env
VITE_API_BASE_URL=https://api.frankfurter.app
VITE_WS_URL=ws://localhost:8080
```

### Tailwind CSS
Customize styling in `tailwind.config.js`:
```javascript
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Custom theme extensions
    }
  }
}
```

## 📱 Mobile Support

- Responsive design works on all screen sizes
- Touch-friendly interface elements
- Mobile-optimized forms and modals
- Progressive Web App (PWA) ready

## 🔒 Security Features

- JWT-based authentication
- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure data storage

## 📊 FINTRAC Compliance

Built-in compliance features:
- Automatic transaction monitoring
- Customer information collection
- LCTR (Large Cash Transaction Report) generation
- Risk assessment automation
- Deadline tracking and alerts

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Deployment Options
- Static hosting (Netlify, Vercel, GitHub Pages)
- Docker containerization
- Traditional web server (Apache, Nginx)

### Build Output
- `dist/` directory contains all production files
- Optimized and minified assets
- Source maps for debugging

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use consistent import patterns (static imports preferred)
3. Add proper error handling
4. Include JSDoc comments for complex functions
5. Test on both desktop and mobile

## 📞 Support

For technical issues:
1. Check browser console for errors
2. Verify network connectivity
3. Clear browser cache and IndexedDB
4. Check this README for common solutions

---

**Last Updated**: August 2025
**Version**: 1.0.0
**Node Version**: 16+
**Browser Support**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+