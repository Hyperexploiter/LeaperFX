/**
 * WebSocket API Endpoint for Real-time Rate Updates
 * Handles WebSocket connections for live rate subscriptions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { webSocketHub } from '../../../lib/websocket-hub';
import { rateEngine } from '../../../lib/rate-engine';
import { security } from '../../../lib/security';

// Global WebSocket server instance
let wss: WebSocketServer | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set security headers
  security.setSecurityHeaders(res);

  // Set CORS headers
  const corsHeaders = security.getCorsHeaders(req.headers.origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // This endpoint provides WebSocket upgrade information
  if (req.method === 'GET') {
    const hubStats = webSocketHub.getStats();
    const engineStatus = rateEngine.getStatus();

    res.status(200).json({
      success: true,
      data: {
        websocketEndpoint: '/api/rates/websocket',
        supportedProtocols: ['rates', 'market_data', 'alerts'],
        connectionInfo: {
          activeConnections: hubStats.activeConnections,
          activeSubscriptions: hubStats.activeSubscriptions,
          isRunning: webSocketHub.isRunning(),
        },
        rateEngineStatus: {
          isRunning: engineStatus.isRunning,
          lastUpdate: engineStatus.lastUpdate,
          rateCount: engineStatus.rateCount,
        },
        usage: {
          messagesSent: hubStats.messagesSent,
          messagesReceived: hubStats.messagesReceived,
          errors: hubStats.errors,
        },
      },
      timestamp: Date.now(),
    });
    return;
  }

  // Handle WebSocket upgrade
  if (req.method === 'POST' && req.headers.upgrade === 'websocket') {
    try {
      // Initialize WebSocket server if not exists
      if (!wss) {
        wss = new WebSocketServer({
          port: 0, // Use any available port
          perMessageDeflate: false,
        });

        console.log('[WebSocket] WebSocket server initialized');
      }

      // Start WebSocket hub if not running
      if (!webSocketHub.isRunning()) {
        webSocketHub.start();
      }

      // Start rate engine if not running
      if (!rateEngine.getStatus().isRunning) {
        await rateEngine.start();
      }

      // Handle WebSocket connection
      wss.on('connection', (ws: WebSocket, request) => {
        const clientId = webSocketHub.handleConnection(ws, request);
        console.log(`[WebSocket] New client connected: ${clientId}`);
      });

      res.status(200).json({
        success: true,
        message: 'WebSocket server ready for connections',
        timestamp: Date.now(),
      });

    } catch (error) {
      console.error('[WebSocket] Upgrade error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to initialize WebSocket connection',
        timestamp: Date.now(),
      });
    }
    return;
  }

  // Method not allowed
  res.status(405).json({
    success: false,
    error: 'Method not allowed',
    allowedMethods: ['GET', 'POST (WebSocket upgrade)'],
    timestamp: Date.now(),
  });
}

// Configuration for Next.js API routes
export const config = {
  api: {
    bodyParser: false, // Required for WebSocket upgrades
    responseLimit: false,
  },
};

// WebSocket connection handler for development/testing
export function handleWebSocketConnection(req: any, socket: any, head: any) {
  if (!wss) {
    console.error('[WebSocket] WebSocket server not initialized');
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    const clientId = webSocketHub.handleConnection(ws, req);
    console.log(`[WebSocket] Client upgraded: ${clientId}`);
  });
}

// Utility functions for WebSocket management

/**
 * Broadcast rate update to all connected clients
 */
export function broadcastRateUpdate(rates: any[]) {
  if (webSocketHub.isRunning()) {
    webSocketHub.broadcastRateUpdate(rates);
  }
}

/**
 * Broadcast alert to all connected clients
 */
export function broadcastAlert(alert: any) {
  if (webSocketHub.isRunning()) {
    webSocketHub.broadcastAlert(alert);
  }
}

/**
 * Get WebSocket server statistics
 */
export function getWebSocketStats() {
  return {
    hubStats: webSocketHub.getStats(),
    serverRunning: wss !== null,
    connectedClients: webSocketHub.getClients().length,
  };
}

/**
 * Cleanup WebSocket resources
 */
export function cleanupWebSocket() {
  if (wss) {
    wss.close();
    wss = null;
  }

  if (webSocketHub.isRunning()) {
    webSocketHub.stop();
  }
}

// Example WebSocket client usage (for documentation)
export const WEBSOCKET_USAGE_EXAMPLE = {
  connect: `
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/api/rates/websocket');

ws.onopen = () => {
  console.log('Connected to LeaperFX WebSocket');

  // Subscribe to rates
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: {
      symbols: ['USDCAD', 'EURUSD', 'BTCUSD'],
      subscriptionType: 'rates',
      storeId: 'store123'  // optional
    },
    timestamp: Date.now()
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'data':
      if (message.data.type === 'rate_update') {
        console.log('Rate update:', message.data.rates);
      }
      break;
    case 'heartbeat':
      console.log('Server heartbeat:', message.data);
      break;
    case 'error':
      console.error('WebSocket error:', message.error);
      break;
  }
};
  `,

  messageTypes: {
    subscribe: {
      type: 'subscribe',
      data: {
        symbols: ['USDCAD', 'EURUSD'],
        subscriptionType: 'rates', // 'rates' | 'market_data' | 'alerts' | 'all'
        storeId: 'optional_store_id',
        frequency: 30000 // optional, milliseconds
      }
    },

    unsubscribe: {
      type: 'unsubscribe',
      data: {
        symbols: ['USDCAD'], // optional, specific symbols
        subscriptionType: 'rates', // optional
        all: false // set to true to unsubscribe from everything
      }
    },

    ping: {
      type: 'ping',
      timestamp: Date.now()
    }
  },

  serverMessages: {
    rateUpdate: {
      type: 'data',
      data: {
        type: 'rate_update',
        rates: [
          {
            baseCurrency: 'USD',
            targetCurrency: 'CAD',
            rate: 1.35,
            spread: 0.02,
            buyRate: 1.3635,
            sellRate: 1.3365,
            timestamp: Date.now()
          }
        ]
      }
    },

    heartbeat: {
      type: 'heartbeat',
      data: {
        serverTime: Date.now(),
        activeConnections: 5,
        activeSubscriptions: 12
      }
    },

    error: {
      type: 'error',
      error: 'Invalid subscription parameters',
      code: 'INVALID_PARAMS'
    }
  }
};