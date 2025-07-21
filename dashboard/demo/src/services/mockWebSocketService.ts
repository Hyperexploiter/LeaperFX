// src/services/mockWebSocketService.ts

// Types for WebSocket events
export type WebSocketEventType = 'rate_update' | 'inventory_update' | 'transaction_created' | 'alert';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}

export interface WebSocketSubscriber {
  (event: WebSocketEvent): void;
}

/**
 * Mock WebSocket Service
 * 
 *  simulate a WebSocket connection for real-time updates lol
 *  this needs connect to  WebSocket server.
 */
class MockWebSocketService {
  private subscribers: WebSocketSubscriber[] = [];
  private connected: boolean = false;
  private simulationInterval: number | null = null;
  
  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('Connecting to mock WebSocket server...');
      
      // Simulate connection delay
      setTimeout(() => {
        this.connected = true;
        console.log('Connected to mock WebSocket server');
        this.startSimulation();
        resolve(true);
      }, 1000);
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    console.log('Disconnecting from mock WebSocket server...');
    this.connected = false;
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    console.log('Disconnected from mock WebSocket server');
  }
  
  /**
   * Subscribe to WebSocket events
   */
  subscribe(callback: WebSocketSubscriber): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  /**
   * Start simulation of WebSocket events
   */
  private startSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    
    // Simulate WebSocket events every 10 seconds
    this.simulationInterval = window.setInterval(() => {
      if (!this.connected) return;
      
      // Generate random event type
      const eventTypes: WebSocketEventType[] = ['rate_update', 'inventory_update', 'transaction_created', 'alert'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Generate mock data based on event type
      let mockData: any;
      
      switch (randomType) {
        case 'rate_update':
          mockData = {
            currency: ['USD', 'EUR', 'GBP', 'JPY'][Math.floor(Math.random() * 4)],
            buyRate: (1 + Math.random() * 0.1).toFixed(4),
            sellRate: (1 + Math.random() * 0.2).toFixed(4),
          };
          break;
          
        case 'inventory_update':
          mockData = {
            currency: ['USD', 'EUR', 'GBP', 'JPY'][Math.floor(Math.random() * 4)],
            amount: Math.floor(Math.random() * 10000),
            action: Math.random() > 0.5 ? 'increase' : 'decrease',
          };
          break;
          
        case 'transaction_created':
          mockData = {
            id: Math.floor(Math.random() * 1000),
            fromCurrency: ['USD', 'EUR', 'GBP', 'CAD'][Math.floor(Math.random() * 4)],
            toCurrency: ['CAD', 'USD', 'EUR', 'GBP'][Math.floor(Math.random() * 4)],
            amount: Math.floor(Math.random() * 1000),
            profit: (Math.random() * 20).toFixed(2),
          };
          break;
          
        case 'alert':
          mockData = {
            level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
            message: [
              'USD inventory running low',
              'New exchange rate available',
              'System maintenance scheduled',
              'High transaction volume detected',
            ][Math.floor(Math.random() * 4)],
          };
          break;
      }
      
      // Create event
      const event: WebSocketEvent = {
        type: randomType,
        data: mockData,
        timestamp: new Date().toISOString(),
      };
      
      // Notify subscribers
      this.notifySubscribers(event);
      
    }, 10000); // Every 10 seconds
  }
  
  /**
   * Notify all subscribers of an event
   */
  private notifySubscribers(event: WebSocketEvent): void {
    console.log('WebSocket event:', event);
    this.subscribers.forEach(callback => callback(event));
  }
  
  /**
   * Send a message to the WebSocket server
   * In a real implementation, this would send data to the server
   */
  send(data: any): void {
    console.log('Sending data to mock WebSocket server:', data);
    
    // Simulate response after delay
    setTimeout(() => {
      const responseEvent: WebSocketEvent = {
        type: 'alert',
        data: {
          level: 'info',
          message: 'Message received by server',
        },
        timestamp: new Date().toISOString(),
      };
      
      this.notifySubscribers(responseEvent);
    }, 500);
  }
}

// Create singleton instance
const mockWebSocketService = new MockWebSocketService();

export default mockWebSocketService;