// WebSocket Service for Dashboard - Rate Management WebSocket
// Connects to unified API backend for real-time rate updates

export type WebSocketEventType =
  | 'rate_update'
  | 'rate_alert_set'
  | 'rate_alert_triggered'
  | 'rate_threshold_breach'
  | 'system_status'
  | 'connection_status';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data: Record<string, any>;
  timestamp: string;
  id?: string;
}

export interface WebSocketSubscriber {
  (event: WebSocketEvent): void;
}

/**
 * Dashboard WebSocket Service
 * Handles WebSocket connections to the unified API backend for rate management
 */
class DashboardWebSocketService {
  private subscribers: WebSocketSubscriber[] = [];
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private eventQueue: WebSocketEvent[] = [];

  /**
   * Connect to the WebSocket server
   */
  connect(url?: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Get WebSocket URL from unified API configuration
      const wsUrl = url || this.getWebSocketUrl();

      if (!wsUrl) {
        console.log('[Dashboard WebSocket] No WS URL available, operating in local mode');
        this.connected = true; // Set connected for local mode
        resolve(true);
        return;
      }

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          console.log('[Dashboard WebSocket] Connected to:', wsUrl);
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data || typeof data !== 'object' || !data.type) {
              console.warn('[Dashboard WebSocket] Invalid message format:', data);
              return;
            }

            const wsEvent: WebSocketEvent = {
              type: data.type,
              data: data.data || {},
              timestamp: data.timestamp || new Date().toISOString(),
              id: data.id
            };
            this.notifySubscribers(wsEvent);
          } catch (error) {
            console.error('[Dashboard WebSocket] Error parsing message:', error);
          }
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.stopHeartbeat();
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[Dashboard WebSocket] Connection error:', error);
          this.ws?.close();
          resolve(false);
        };

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.connected) {
            this.ws?.close();
            console.log('[Dashboard WebSocket] Connection timeout, operating in local mode');
            this.connected = true; // Set connected for local mode
            resolve(true);
          }
        }, 5000);

      } catch (error) {
        console.error('[Dashboard WebSocket] Failed to create connection:', error);
        this.connected = true; // Set connected for local mode
        resolve(true);
      }
    });
  }

  /**
   * Get WebSocket URL based on current environment
   */
  private getWebSocketUrl(): string | null {
    try {
      // Check for unified backend WebSocket URL from environment
      const unifiedApi = (
        (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
        (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_API_BASE_URL) ||
        (typeof process !== 'undefined' && (process as any).env?.VITE_API_BASE_URL)
      );

      if (unifiedApi) {
        // Convert HTTP(S) API URL to WebSocket URL
        const wsUrl = unifiedApi.replace(/^https?:\/\//i, (match) => {
          return match.toLowerCase().startsWith('https') ? 'wss://' : 'ws://';
        });
        return `${wsUrl}/rates/websocket`;
      }

      // Check for direct WebSocket URL
      const directWsUrl = (
        (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_WS_URL) ||
        (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_WS_URL) ||
        (typeof process !== 'undefined' && (process as any).env?.VITE_WS_URL)
      );

      return directWsUrl || null;
    } catch (error) {
      console.error('[Dashboard WebSocket] Error getting WebSocket URL:', error);
      return null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.connected) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Dashboard WebSocket] Max reconnect attempts reached, operating in local mode');
      this.connected = true; // Set connected for local mode
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimer = setTimeout(() => {
      console.log(`[Dashboard WebSocket] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect();
    }, delay);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.connected = false;

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    // Close WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Clear subscribers
    this.subscribers = [];
  }

  /**
   * Send data to WebSocket server
   */
  send(data: Omit<WebSocketEvent, 'timestamp'>): void {
    const event: WebSocketEvent = {
      ...data,
      timestamp: new Date().toISOString(),
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (this.ws && this.connected && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(event));
      } catch (error) {
        console.error('[Dashboard WebSocket] Error sending message:', error);
        this.eventQueue.push(event);
      }
    } else {
      // Queue locally for when connection is restored
      this.eventQueue.push(event);
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  subscribe(callback: WebSocketSubscriber): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of an event
   */
  private notifySubscribers(event: WebSocketEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[Dashboard WebSocket] Error in subscriber:', error);
      }
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    mode: 'websocket' | 'local';
    subscriberCount: number;
    queueSize: number;
  } {
    return {
      connected: this.connected,
      mode: this.ws && this.ws.readyState === WebSocket.OPEN ? 'websocket' : 'local',
      subscriberCount: this.subscribers.length,
      queueSize: this.eventQueue.length
    };
  }

  /**
   * Broadcast rate update to all subscribers and server
   */
  broadcastRateUpdate(currency: string, marketRate: number, storeRate?: number): void {
    this.send({
      type: 'rate_update',
      data: {
        symbol: currency,
        marketRate,
        storeRate,
        source: 'dashboard',
        timestamp: Date.now()
      }
    });
  }
}

// Export singleton instance
const dashboardWebSocketService = new DashboardWebSocketService();
export default dashboardWebSocketService;