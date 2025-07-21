# Dashboard Integration Guide

This document explains how the ExchangeDashboard (client-facing) and StoreOwnerDashboard (owner-facing) are integrated in the Leaper-Fx Currency Exchange application.

## Table of Contents

1. [Overview](#overview)
2. [Dashboard Roles](#dashboard-roles)
3. [Integration Points](#integration-points)
4. [WebSocket Communication](#websocket-communication)
5. [Testing the Integration](#testing-the-integration)
6. [Troubleshooting](#troubleshooting)

## Overview

The Leaper-Fx Currency Exchange application consists of two main dashboards:

1. **ExchangeDashboard**: The public-facing dashboard that displays currency exchange rates to clients
2. **StoreOwnerDashboard**: The private dashboard that allows store owners to manage rates, inventory, and transactions

These dashboards are integrated to allow real-time updates: when the store owner updates currency rates in the StoreOwnerDashboard, those changes are immediately reflected in the ExchangeDashboard.

## Dashboard Roles

### ExchangeDashboard

- Displays current exchange rates for various currencies
- Shows buy/sell rates, 24-hour changes, and charts
- Accessible to the public without authentication
- Receives real-time rate updates from the StoreOwnerDashboard

### StoreOwnerDashboard

- Allows store owners to manage currency rates, inventory, and transactions
- Provides analytics and business intelligence
- Requires authentication to access
- Sends real-time rate updates to the ExchangeDashboard when rates are changed

## Integration Points

The main integration points between the two dashboards are:

1. **Routing**: Both dashboards are part of the same React application, with routing handled by React Router
2. **Authentication**: The StoreOwnerDashboard requires authentication, while the ExchangeDashboard does not
3. **WebSocket Communication**: Real-time updates are sent from the StoreOwnerDashboard to the ExchangeDashboard via WebSocket

## WebSocket Communication

The WebSocket communication between the dashboards is implemented using the `mockWebSocketService`. Here's how it works:

### In StoreOwnerDashboard

When a store owner updates a currency rate:

1. The `handleRateUpdate` function in `StoreOwnerDashboard.tsx` is called
2. This function updates the rate in the inventory system
3. It then sends a WebSocket message with type 'rate_update' and data containing the currency, buyRate, and sellRate

```typescript
// From StoreOwnerDashboard.tsx
mockWebSocketService.send({
  type: 'rate_update',
  data: {
    currency,
    buyRate,
    sellRate
  }
});
```

### In ExchangeDashboard

The ExchangeDashboard listens for these WebSocket messages:

1. A WebSocket connection is established in a useEffect hook
2. The component subscribes to WebSocket events, filtering for 'rate_update' events
3. When a 'rate_update' event is received, the liveRates state is updated with the new rate

```typescript
// From ExchangeDashboard.tsx
useEffect(() => {
  const setupWebSocket = async () => {
    await mockWebSocketService.connect();
    const unsubscribe = mockWebSocketService.subscribe((event: WebSocketEvent) => {
      if (event.type === 'rate_update') {
        const { currency, buyRate, sellRate } = event.data;
        setLiveRates(prevRates => {
          if (!prevRates) return prevRates;
          const avgRate = (parseFloat(buyRate) + parseFloat(sellRate)) / 2;
          const newRate = 1 / avgRate;
          return {
            ...prevRates,
            [currency]: newRate
          };
        });
      }
    });
    return () => {
      unsubscribe();
      mockWebSocketService.disconnect();
    };
  };
  setupWebSocket();
}, []);
```

## Testing the Integration

To test the integration between the dashboards:

1. **Start the application**:
   ```
   cd /Users/hyperexploiter/PycharmProjects/Leaper-Fx/dashboard/demo
   npm run dev
   ```

2. **Open the ExchangeDashboard**:
   - Navigate to `http://localhost:5173/` in your browser
   - Verify that currency rates are displayed

3. **Log in to the StoreOwnerDashboard**:
   - Directly navigate to `http://localhost:5173/login` in your browser
   - Enter the credentials (username: "owner", password: "password")
   - Verify that you are redirected to the StoreOwnerDashboard

   > **Note:** The store owner login button has been removed from the public ExchangeDashboard to maintain a clean interface for customers. Store owners must access the login page directly via the URL.

4. **Update a currency rate**:
   - In the StoreOwnerDashboard, go to the Inventory Management section
   - Find the RateEditor component
   - Edit a currency rate (e.g., change the buy and sell rates for USD)
   - Save the changes

5. **Verify the update in the ExchangeDashboard**:
   - Open a new browser tab and navigate to `http://localhost:5173/`
   - Verify that the rate for the currency you updated has changed
   - Check the browser console for WebSocket messages (you should see "Received rate update via WebSocket")

## Troubleshooting

If the integration is not working as expected, check the following:

1. **WebSocket Connection**:
   - Check the browser console for WebSocket connection messages
   - Verify that "Connected to WebSocket for real-time rate updates" is logged
   - If not, check that the mockWebSocketService is properly imported and initialized

2. **Rate Updates**:
   - When updating a rate in the StoreOwnerDashboard, check the console for "Sending data to mock WebSocket server"
   - In the ExchangeDashboard, check for "Received rate update via WebSocket"
   - If these messages are not appearing, check the WebSocket event handling code

3. **Rate Calculation**:
   - The ExchangeDashboard and StoreOwnerDashboard use different rate formats
   - ExchangeDashboard uses rates relative to CAD (e.g., 1 CAD = X USD)
   - StoreOwnerDashboard uses buy/sell rates (e.g., buy USD at X CAD, sell USD at Y CAD)
   - Verify that the rate conversion in the WebSocket handler is correct

4. **Authentication**:
   - If you cannot access the StoreOwnerDashboard, check that you're using the correct credentials
   - Verify that the AuthContext is properly set up and the login functionality is working

If issues persist, check the implementation of the mockWebSocketService and ensure that it's correctly sending and receiving messages.