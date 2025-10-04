/**
 * WebSocket Type Definitions for LeaperFX
 */

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'data' | 'error' | 'ping' | 'pong' | 'heartbeat';
  symbol?: string;
  data?: any;
  error?: string;
  timestamp: number;
  clientId?: string;
  storeId?: string;
}

export interface WebSocketSubscription {
  symbols: string[];
  timeframes?: string[];
  clientId: string;
  storeId?: string;
  lastActivity: number;
  subscriptionType: 'market_data' | 'rates' | 'alerts' | 'all';
}

export interface WebSocketClient {
  id: string;
  socket: any; // WebSocket instance
  subscriptions: WebSocketSubscription[];
  storeId?: string;
  connectedAt: number;
  lastActivity: number;
  isActive: boolean;
  userAgent?: string;
  ipAddress?: string;
}

export interface WebSocketHub {
  clients: Map<string, WebSocketClient>;
  subscriptions: Map<string, Set<string>>; // symbol -> clientIds
  messageQueue: WebSocketMessage[];
  isRunning: boolean;
  stats: {
    totalConnections: number;
    activeConnections: number;
    messagesSent: number;
    messagesReceived: number;
    errors: number;
  };
}

export interface WebSocketEvent {
  type: 'connect' | 'disconnect' | 'subscribe' | 'unsubscribe' | 'message' | 'error';
  clientId: string;
  storeId?: string;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface HeartbeatMessage extends WebSocketMessage {
  type: 'heartbeat';
  data: {
    serverTime: number;
    activeConnections: number;
    activeSubscriptions: number;
  };
}

export interface DataUpdateMessage extends WebSocketMessage {
  type: 'data';
  data: {
    symbol: string;
    update: any;
    source: string;
  };
}

export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  error: string;
  code?: string;
  details?: any;
}

export interface SubscribeMessage extends WebSocketMessage {
  type: 'subscribe';
  data: {
    symbols: string[];
    subscriptionType: 'market_data' | 'rates' | 'alerts' | 'all';
    storeId?: string;
    frequency?: number;
  };
}

export interface UnsubscribeMessage extends WebSocketMessage {
  type: 'unsubscribe';
  data: {
    symbols?: string[];
    subscriptionType?: 'market_data' | 'rates' | 'alerts' | 'all';
    all?: boolean;
  };
}

// Default export removed to avoid TypeScript errors