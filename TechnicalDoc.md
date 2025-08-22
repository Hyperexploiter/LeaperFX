# LeaperFX Technical Overview

This document provides a high-level technical overview of the LeaperFX currency exchange management system.

## System Architecture

LeaperFX is built using a modern web application architecture with the following key components:

1. **Client-Side Application**: A React-based single-page application (SPA) that provides the user interface for both the public client dashboard and the private store owner dashboard.

2. **Local Storage**: Uses browser's IndexedDB for persistent storage without requiring a backend server, with fallback to in-memory storage when IndexedDB is not available.

3. **WebSocket Service**: Provides real-time updates between components, with fallback to polling when WebSocket is not available.

4. **Service Layer**: A set of JavaScript/TypeScript services that handle business logic, data access, and integration between components.

The system is designed to be deployed as a standalone web application that can run entirely in the browser, making it easy to deploy and maintain for small currency exchange businesses.

## Key Components

### Dashboard Components

1. **Client Dashboard (ExchangeDashboard)**
   - Public-facing dashboard for customers
   - Displays current exchange rates
   - Allows customers to calculate currency conversions
   - Provides rate lock and rate alert functionality

2. **Store Owner Dashboard (StoreOwnerDashboard)**
   - Private dashboard for store owners
   - Requires authentication
   - Provides inventory management
   - Tracks transaction history
   - Offers business intelligence and analytics
   - Ensures FINTRAC compliance

3. **Customer Mobile Form**
   - Mobile-friendly form for collecting customer information
   - Used for FINTRAC compliance
   - Can be accessed via QR code

### Service Layer

1. **Authentication Service**
   - Handles user authentication for the Store Owner Dashboard
   - Manages secure token-based sessions
   - Provides login/logout functionality

2. **Database Service**
   - Manages data persistence using IndexedDB
   - Provides fallback to in-memory storage when IndexedDB is not available
   - Handles CRUD operations for all data entities

3. **WebSocket Service**
   - Enables real-time updates between components
   - Provides fallback to polling when WebSocket is not available
   - Manages event subscriptions and notifications

4. **Business Logic Services**
   - Exchange Rate Service: Manages currency exchange rates
   - Inventory Service: Tracks currency inventory
   - Transaction Service: Handles currency exchange transactions
   - Analytics Service: Provides business intelligence
   - Website Service: Manages integration with the website
   - Compliance Service: Ensures FINTRAC compliance

## Technology Stack

### Frontend

- **React 19.1.0**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript for improved developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Vite**: Build tool and development server
- **React Router**: Client-side routing
- **Recharts**: Charting library for data visualization
- **Lucide React**: Icon library
- **IndexedDB**: Browser-based database for persistent storage

### Development Tools

- **npm**: Package manager
- **ESLint**: Code linting
- **TypeScript**: Static type checking
- **Vite**: Development server with hot module replacement
- **Git**: Version control

## Integration Points

1. **Website Integration**
   - The dashboard can be integrated with a website for customer-facing features
   - Rate locks and rate alerts can be created on the website and managed in the dashboard
   - QR codes can be generated to direct customers to the mobile form

2. **Data Import/Export**
   - CSV import for inventory and customer data
   - CSV export for transaction history and reports

3. **FINTRAC Compliance**
   - Integration with FINTRAC compliance requirements
   - Customer information collection
   - Transaction reporting

## Data Flow

1. **Exchange Rate Updates**
   - Exchange rates are updated in the Store Owner Dashboard
   - Updates are propagated to the Client Dashboard via WebSocket
   - Rate changes trigger notifications for rate alerts

2. **Transaction Processing**
   - Transactions are created in the Store Owner Dashboard
   - Inventory is updated based on transaction details
   - Transaction data is used for analytics and reporting
   - FINTRAC compliance checks are triggered for relevant transactions

3. **Inventory Management**
   - Inventory is updated when new stock is added
   - Inventory levels affect business insights and recommendations
   - Low inventory triggers alerts

4. **Customer Data Flow**
   - Customer information is collected via the mobile form
   - Data is associated with transactions for compliance purposes
   - Customer data is used for analytics and reporting

## Security Considerations

1. **Authentication**
   - Secure password hashing with salt
   - Token-based authentication with expiration
   - Session management

2. **Data Protection**
   - All sensitive data is stored locally
   - No external API dependencies for core functionality
   - Fallback mechanisms for data persistence

3. **Error Handling**
   - Comprehensive error handling throughout the application
   - Fallback mechanisms for critical services
   - User-friendly error messages

## Deployment Architecture

The application is designed to be deployed as a static web application, which can be hosted on any web server or CDN. The recommended deployment process is:

1. Build the application using Vite
2. Deploy the built files to a web server or CDN
3. Configure the web server for proper routing (SPA routing)
4. Set up appropriate security headers

For more detailed deployment instructions, see the [Production Deployment Guide](dashboard/documentation/PRODUCTION_DEPLOYMENT_GUIDE.md).