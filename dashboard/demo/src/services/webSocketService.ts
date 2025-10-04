// Real WebSocket Service - Production Ready

// Types for WebSocket events
export type WebSocketEventType = 
  | 'rate_update' 
  | 'inventory_update' 
  | 'transaction_created' 
  | 'transaction_updated'
  | 'alert'
  | 'rate_lock_created'
  | 'rate_lock_completed'
  | 'rate_lock_expired'
  | 'rate_lock_cancelled'
  | 'rate_alert_set'
  | 'rate_alert_triggered'
  | 'compliance_required'
  | 'system_status'
  | 'qr_code_generated'
  | 'form_session_created'
  | 'form_submission_received'
  | 'form_status_updated'
  | 'form_transaction_assigned'
  | 'form_document_uploaded'
  | 'form_document_approved'
  | 'form_document_rejected'
  | 'form_audit_log'
  | 'customer_compliance_updated'
  | 'customer_created'
  | 'customer_updated'
  | 'transaction_receipt_generated'
  | 'fintrac_report_submitted';

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
 * WebSocket Service
 * 
 * This service provides real WebSocket connectivity for real-time updates.
 * Falls back to polling mode if WebSocket is not available.
 */
class WebSocketService {
  private subscribers: WebSocketSubscriber[] = [];
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isPollingMode: boolean = false;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private eventQueue: WebSocketEvent[] = [];
  
  // Local event bus for in-app communication when no server WebSocket is available
  private localEventBus: { [key: string]: WebSocketEvent[] } = {};
  
  /**
   * Connect to the WebSocket server or start local mode
   */
  connect(url?: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Only use local mode for server-side rendering or tests
      // In browser, always try to connect to real WebSocket
      if (!url && typeof window === 'undefined') {
        this.startLocalMode();
        resolve(true);
        return;
      }

      // Detect if we're on GitHub Pages or other static hosting
      if (typeof window !== 'undefined' &&
          (window.location.hostname.includes('github.io') ||
           window.location.hostname.includes('vercel.app') ||
           window.location.hostname.includes('netlify.app'))) {
        console.log('[WebSocket] Static hosting detected, using local mode');
        this.startLocalMode();
        resolve(true);
        return;
      }

      // Try to connect to WebSocket server
      const wsUrl = url || this.getWebSocketUrl();

      // If URL is falsy (e.g., static hosting), switch to local mode
      if (!wsUrl) {
        console.log('[WebSocket] No WS URL available, falling back to local mode');
        this.startLocalMode();
        resolve(true);
        return;
      }
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve(true);
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Validate the parsed data structure
            if (!data || typeof data !== 'object' || !data.type) {
              console.warn('Invalid WebSocket message format:', data);
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
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.ws.onclose = () => {
          this.connected = false;
          this.stopHeartbeat();
          this.scheduleReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.ws?.close();
          // Fall back to local mode if WebSocket fails
          this.startLocalMode();
          resolve(true);
        };
        
        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.connected) {
            this.ws?.close();
            this.startLocalMode();
            resolve(true);
          }
        }, 5000);
        
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        this.startLocalMode();
        resolve(true);
      }
    });
  }
  
  /**
   * Start local mode for in-app communication
   */
  private startLocalMode(): void {
    this.connected = true;
    this.isPollingMode = true;
    
    // Start polling for local events
    this.pollingTimer = setInterval(() => {
      this.processEventQueue();
    }, 1000);
  }
  
  /**
   * Get WebSocket URL based on current environment
   */
  private getWebSocketUrl(): string | null {
    if (typeof window !== 'undefined') {
      const host = window.location.host || window.location.hostname || '';

      // Check for unified API base URL first
      const apiBaseUrl = this.getEnv('VITE_API_BASE_URL');
      if (apiBaseUrl) {
        // Convert HTTP base URL to WebSocket URL
        const wsUrl = apiBaseUrl.replace(/^https?:/, window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '/websocket';
        return wsUrl;
      }

      // Disable remote websocket attempts on static hosting like GitHub Pages
      if (host.includes('github.io')) {
        return null;
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${host}/ws`;
    }
    return 'ws://localhost:3001/ws';
  }

  /**
   * Get environment variable with proper fallback
   */
  private getEnv(key: string): string | undefined {
    try {
      const viteEnv = (typeof import.meta !== 'undefined') ? (import.meta as any).env : undefined;
      const win: any = (typeof window !== 'undefined') ? (window as any) : {};
      const nodeEnv: any = (typeof process !== 'undefined') ? (process as any).env : undefined;
      return (viteEnv && viteEnv[key]) || (win.__ENV__ && win.__ENV__[key]) || (nodeEnv && nodeEnv[key]);
    } catch {
      return undefined;
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
      this.startLocalMode();
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * Process queued events in local mode
   */
  private processEventQueue(): void {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    events.forEach(event => {
      this.notifySubscribers(event);
    });
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
    
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
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
   * Send data to WebSocket server or queue locally
   */
  send(data: Omit<WebSocketEvent, 'timestamp'>): void {
    const event: WebSocketEvent = {
      ...data,
      timestamp: new Date().toISOString(),
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    if (this.ws && this.connected && this.ws.readyState === WebSocket.OPEN) {
      // Send via WebSocket
      try {
        this.ws.send(JSON.stringify(event));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        // Fall back to local queue
        this.eventQueue.push(event);
      }
    } else {
      // Queue locally and process immediately in local mode
      this.eventQueue.push(event);
      if (this.isPollingMode) {
        // Process immediately in local mode
        setTimeout(() => this.processEventQueue(), 100);
      }
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
        console.error('Error in WebSocket subscriber:', error);
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
      mode: this.isPollingMode ? 'local' : 'websocket',
      subscriberCount: this.subscribers.length,
      queueSize: this.eventQueue.length
    };
  }
  
  /**
   * Broadcast system event
   */
  broadcastSystemEvent(type: WebSocketEventType, data: any): void {
    this.send({
      type,
      data: {
        ...data,
        source: 'system',
        environment: process.env.NODE_ENV || 'development'
      }
    });
  }
  
  /**
   * Get event history (for debugging)
   */
  getEventHistory(limit: number = 100): WebSocketEvent[] {
    return Object.values(this.localEventBus)
      .flat()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

// Export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;