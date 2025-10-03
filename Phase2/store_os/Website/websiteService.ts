// src/services/websiteService.ts
import webSocketService from './webSocketService';
import transactionService from './transactionService';
import inventoryService from './inventoryService';
// import analyticsService from './analyticsService'; // Not currently used

// Types
export interface RateLock {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  transactionId?: string;
}

export interface RateAlert {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  targetRate: number;
  amount?: number;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  status: 'active' | 'triggered' | 'expired';
  triggeredAt?: string;
  expiresAt?: string;
}

export interface WebsiteOrder {
  id: string;
  type: 'rate_lock' | 'rate_alert' | 'direct_exchange';
  rateLockId?: string;
  rateAlertId?: string;
  transactionId?: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface WebsiteMetrics {
  visitors: number;
  pageViews: number;
  calculatorUses: number;
  rateLocks: number;
  rateAlerts: number;
  conversionRate: number;
}

/**
 * Website Service
 * 
 * This service handles website-specific functionality and integrates
 * with the dashboard services for real-time updates.
 */
class WebsiteService {
  private rateLocks: RateLock[] = [];
  private rateAlerts: RateAlert[] = [];
  private websiteOrders: WebsiteOrder[] = [];
  private websiteMetrics: WebsiteMetrics = {
    visitors: 0,
    pageViews: 0,
    calculatorUses: 0,
    rateLocks: 0,
    rateAlerts: 0,
    conversionRate: 0
  };
  
  constructor() {
    // Initialize with some sample data
    this.initializeSampleData();
    
    // Start the expiration checker for rate locks
    this.startExpirationChecker();
  }
  
  /**
   * Initialize sample data for testing
   */
  private initializeSampleData(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Sample rate locks
    this.rateLocks = [
      {
        id: 'rl-001',
        fromCurrency: 'USD',
        toCurrency: 'CAD',
        amount: 5000,
        rate: 1.35,
        customerEmail: 'john.doe@example.com',
        customerPhone: '(514) 555-0123',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        expiresAt: tomorrow.toISOString(),
        status: 'active'
      },
      {
        id: 'rl-002',
        fromCurrency: 'EUR',
        toCurrency: 'CAD',
        amount: 3000,
        rate: 1.52,
        customerEmail: 'jane.smith@example.com',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        expiresAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        status: 'active'
      }
    ];
    
    // Sample rate alerts
    this.rateAlerts = [
      {
        id: 'ra-001',
        fromCurrency: 'USD',
        toCurrency: 'CAD',
        targetRate: 1.38,
        amount: 10000,
        customerEmail: 'michael.brown@example.com',
        customerPhone: '(514) 555-0456',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        status: 'active'
      },
      {
        id: 'ra-002',
        fromCurrency: 'GBP',
        toCurrency: 'CAD',
        targetRate: 1.85,
        customerEmail: 'sarah.wilson@example.com',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'triggered',
        triggeredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ];
    
    // Sample website orders
    this.websiteOrders = [
      {
        id: 'wo-001',
        type: 'rate_lock',
        rateLockId: 'rl-001',
        customerEmail: 'john.doe@example.com',
        customerPhone: '(514) 555-0123',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        status: 'pending'
      },
      {
        id: 'wo-002',
        type: 'rate_alert',
        rateAlertId: 'ra-001',
        customerEmail: 'michael.brown@example.com',
        customerPhone: '(514) 555-0456',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        status: 'pending'
      }
    ];
    
    // Sample website metrics
    this.websiteMetrics = {
      visitors: 1250,
      pageViews: 3750,
      calculatorUses: 875,
      rateLocks: 42,
      rateAlerts: 68,
      conversionRate: 8.8
    };
  }
  
  /**
   * Start the expiration checker for rate locks
   */
  private startExpirationChecker(): void {
    // Check for expired rate locks every hour
    setInterval(() => {
      const now = new Date();
      
      // Check for expired rate locks
      this.rateLocks.forEach(lock => {
        if (lock.status === 'active' && new Date(lock.expiresAt) < now) {
          this.expireRateLock(lock.id);
        }
      });
    }, 60 * 60 * 1000); // Every hour
  }
  
  /**
   * Get all rate locks
   */
  getRateLocks(): Promise<RateLock[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve([...this.rateLocks]);
      }, 500);
    });
  }
  
  /**
   * Get rate lock by ID
   */
  getRateLockById(id: string): Promise<RateLock | null> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const rateLock = this.rateLocks.find(lock => lock.id === id);
        resolve(rateLock || null);
      }, 300);
    });
  }
  
  /**
   * Create a new rate lock
   */
  createRateLock(params: Omit<RateLock, 'id' | 'createdAt' | 'status'>): Promise<RateLock> {
    return new Promise(async (resolve) => {
      // Simulate API delay
      setTimeout(async () => {
        const now = new Date();
        
        // Create new rate lock
        const newRateLock: RateLock = {
          id: `rl-${Date.now()}`,
          ...params,
          createdAt: now.toISOString(),
          status: 'active'
        };
        
        // Add to rate locks
        this.rateLocks.push(newRateLock);
        
        // Create website order
        const newOrder: WebsiteOrder = {
          id: `wo-${Date.now()}`,
          type: 'rate_lock',
          rateLockId: newRateLock.id,
          customerEmail: newRateLock.customerEmail,
          customerPhone: newRateLock.customerPhone,
          createdAt: now.toISOString(),
          status: 'pending'
        };
        
        this.websiteOrders.push(newOrder);
        
        // Update metrics
        this.websiteMetrics.rateLocks++;
        this.updateConversionRate();
        
        // Reserve inventory for the rate lock
        try {
          await this.reserveInventoryForRateLock(newRateLock);
        } catch (error) {
          console.error('Error reserving inventory:', error);
        }
        
        // Notify via WebSocket
        webSocketService.send({
          type: 'rate_lock_created',
          data: {
            id: newRateLock.id,
            fromCurrency: newRateLock.fromCurrency,
            toCurrency: newRateLock.toCurrency,
            amount: newRateLock.amount,
            rate: newRateLock.rate,
            expiresAt: newRateLock.expiresAt
          }
        });
        
        resolve(newRateLock);
      }, 800);
    });
  }
  
  /**
   * Reserve inventory for a rate lock
   */
  private async reserveInventoryForRateLock(rateLock: RateLock): Promise<void> {
    // Get inventory item
    const inventoryItem = await inventoryService.getInventoryByCurrency(rateLock.toCurrency);
    
    if (!inventoryItem) {
      throw new Error(`Inventory item for ${rateLock.toCurrency} not found`);
    }
    
    // Check if there's enough inventory
    if (inventoryItem.amount < rateLock.amount) {
      throw new Error(`Not enough ${rateLock.toCurrency} in inventory`);
    }
    
    // Update inventory to reserve the amount
    // In a real implementation, we would have a separate "reserved" field
    // For now, we'll just reduce the available amount
    await inventoryService.updateInventoryItem(inventoryItem.id, {
      amount: inventoryItem.amount - rateLock.amount
    });
    
    // Notify via WebSocket
    webSocketService.send({
      type: 'inventory_update',
      data: {
        currency: rateLock.toCurrency,
        amount: rateLock.amount,
        action: 'reserve',
        reason: `Rate lock ${rateLock.id}`
      }
    });
  }
  
  /**
   * Release reserved inventory for a rate lock
   */
  private async releaseReservedInventory(rateLock: RateLock): Promise<void> {
    // Get inventory item
    const inventoryItem = await inventoryService.getInventoryByCurrency(rateLock.toCurrency);
    
    if (!inventoryItem) {
      throw new Error(`Inventory item for ${rateLock.toCurrency} not found`);
    }
    
    // Update inventory to release the reserved amount
    await inventoryService.updateInventoryItem(inventoryItem.id, {
      amount: inventoryItem.amount + rateLock.amount
    });
    
    // Notify via WebSocket
    webSocketService.send({
      type: 'inventory_update',
      data: {
        currency: rateLock.toCurrency,
        amount: rateLock.amount,
        action: 'release',
        reason: `Rate lock ${rateLock.id} ${rateLock.status}`
      }
    });
  }
  
  /**
   * Complete a rate lock (convert to transaction)
   */
  completeRateLock(id: string): Promise<RateLock> {
    return new Promise(async (resolve, reject) => {
      // Simulate API delay
      setTimeout(async () => {
        const rateLockIndex = this.rateLocks.findIndex(lock => lock.id === id);
        
        if (rateLockIndex === -1) {
          reject(new Error(`Rate lock with ID ${id} not found`));
          return;
        }
        
        const rateLock = this.rateLocks[rateLockIndex];
        
        if (rateLock.status !== 'active') {
          reject(new Error(`Rate lock with ID ${id} is not active`));
          return;
        }
        
        try {
          // Create transaction
          const transaction = await transactionService.createTransaction({
            fromCurrency: rateLock.fromCurrency,
            toCurrency: rateLock.toCurrency,
            fromAmount: rateLock.amount,
            toAmount: rateLock.amount * rateLock.rate,
            commission: rateLock.amount * rateLock.rate * 0.015 // 1.5% commission
          });
          
          // Update rate lock
          const updatedRateLock: RateLock = {
            ...rateLock,
            status: 'completed',
            transactionId: transaction.id
          };
          
          this.rateLocks[rateLockIndex] = updatedRateLock;
          
          // Update website order
          const orderIndex = this.websiteOrders.findIndex(order => 
            order.type === 'rate_lock' && order.rateLockId === id
          );
          
          if (orderIndex !== -1) {
            this.websiteOrders[orderIndex] = {
              ...this.websiteOrders[orderIndex],
              status: 'completed',
              transactionId: transaction.id
            };
          }
          
          // Notify via WebSocket
          webSocketService.send({
            type: 'rate_lock_completed',
            data: {
              id: updatedRateLock.id,
              transactionId: transaction.id
            }
          });
          
          resolve(updatedRateLock);
        } catch (error) {
          reject(error);
        }
      }, 800);
    });
  }
  
  /**
   * Expire a rate lock
   */
  private expireRateLock(id: string): Promise<RateLock> {
    return new Promise(async (resolve, reject) => {
      const rateLockIndex = this.rateLocks.findIndex(lock => lock.id === id);
      
      if (rateLockIndex === -1) {
        reject(new Error(`Rate lock with ID ${id} not found`));
        return;
      }
      
      const rateLock = this.rateLocks[rateLockIndex];
      
      if (rateLock.status !== 'active') {
        reject(new Error(`Rate lock with ID ${id} is not active`));
        return;
      }
      
      try {
        // Release reserved inventory
        await this.releaseReservedInventory(rateLock);
        
        // Update rate lock
        const updatedRateLock: RateLock = {
          ...rateLock,
          status: 'expired'
        };
        
        this.rateLocks[rateLockIndex] = updatedRateLock;
        
        // Update website order
        const orderIndex = this.websiteOrders.findIndex(order => 
          order.type === 'rate_lock' && order.rateLockId === id
        );
        
        if (orderIndex !== -1) {
          this.websiteOrders[orderIndex] = {
            ...this.websiteOrders[orderIndex],
            status: 'cancelled'
          };
        }
        
        // Notify via WebSocket
        webSocketService.send({
          type: 'rate_lock_expired',
          data: {
            id: updatedRateLock.id
          }
        });
        
        resolve(updatedRateLock);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Cancel a rate lock
   */
  cancelRateLock(id: string): Promise<RateLock> {
    return new Promise(async (resolve, reject) => {
      // Simulate API delay
      setTimeout(async () => {
        const rateLockIndex = this.rateLocks.findIndex(lock => lock.id === id);
        
        if (rateLockIndex === -1) {
          reject(new Error(`Rate lock with ID ${id} not found`));
          return;
        }
        
        const rateLock = this.rateLocks[rateLockIndex];
        
        if (rateLock.status !== 'active') {
          reject(new Error(`Rate lock with ID ${id} is not active`));
          return;
        }
        
        try {
          // Release reserved inventory
          await this.releaseReservedInventory(rateLock);
          
          // Update rate lock
          const updatedRateLock: RateLock = {
            ...rateLock,
            status: 'cancelled'
          };
          
          this.rateLocks[rateLockIndex] = updatedRateLock;
          
          // Update website order
          const orderIndex = this.websiteOrders.findIndex(order => 
            order.type === 'rate_lock' && order.rateLockId === id
          );
          
          if (orderIndex !== -1) {
            this.websiteOrders[orderIndex] = {
              ...this.websiteOrders[orderIndex],
              status: 'cancelled'
            };
          }
          
          // Notify via WebSocket
          webSocketService.send({
            type: 'rate_lock_cancelled',
            data: {
              id: updatedRateLock.id
            }
          });
          
          resolve(updatedRateLock);
        } catch (error) {
          reject(error);
        }
      }, 800);
    });
  }
  
  /**
   * Get all rate alerts
   */
  getRateAlerts(): Promise<RateAlert[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve([...this.rateAlerts]);
      }, 500);
    });
  }
  
  /**
   * Get rate alert by ID
   */
  getRateAlertById(id: string): Promise<RateAlert | null> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const rateAlert = this.rateAlerts.find(alert => alert.id === id);
        resolve(rateAlert || null);
      }, 300);
    });
  }
  
  /**
   * Create a new rate alert
   */
  createRateAlert(params: Omit<RateAlert, 'id' | 'createdAt' | 'status' | 'triggeredAt'>): Promise<RateAlert> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const now = new Date();
        
        // Create new rate alert
        const newRateAlert: RateAlert = {
          id: `ra-${Date.now()}`,
          ...params,
          createdAt: now.toISOString(),
          status: 'active'
        };
        
        // Add to rate alerts
        this.rateAlerts.push(newRateAlert);
        
        // Create website order
        const newOrder: WebsiteOrder = {
          id: `wo-${Date.now()}`,
          type: 'rate_alert',
          rateAlertId: newRateAlert.id,
          customerEmail: newRateAlert.customerEmail,
          customerPhone: newRateAlert.customerPhone,
          createdAt: now.toISOString(),
          status: 'pending'
        };
        
        this.websiteOrders.push(newOrder);
        
        // Update metrics
        this.websiteMetrics.rateAlerts++;
        this.updateConversionRate();
        
        // Notify via WebSocket
        webSocketService.send({
          type: 'rate_alert_set',
          data: {
            id: newRateAlert.id,
            fromCurrency: newRateAlert.fromCurrency,
            toCurrency: newRateAlert.toCurrency,
            targetRate: newRateAlert.targetRate,
            amount: newRateAlert.amount
          }
        });
        
        resolve(newRateAlert);
      }, 800);
    });
  }
  
  /**
   * Trigger a rate alert
   */
  triggerRateAlert(id: string): Promise<RateAlert> {
    return new Promise((resolve, reject) => {
      // Simulate API delay
      setTimeout(() => {
        const rateAlertIndex = this.rateAlerts.findIndex(alert => alert.id === id);
        
        if (rateAlertIndex === -1) {
          reject(new Error(`Rate alert with ID ${id} not found`));
          return;
        }
        
        const rateAlert = this.rateAlerts[rateAlertIndex];
        
        if (rateAlert.status !== 'active') {
          reject(new Error(`Rate alert with ID ${id} is not active`));
          return;
        }
        
        // Update rate alert
        const updatedRateAlert: RateAlert = {
          ...rateAlert,
          status: 'triggered',
          triggeredAt: new Date().toISOString()
        };
        
        this.rateAlerts[rateAlertIndex] = updatedRateAlert;
        
        // Notify via WebSocket
        webSocketService.send({
          type: 'rate_alert_triggered',
          data: {
            id: updatedRateAlert.id,
            fromCurrency: updatedRateAlert.fromCurrency,
            toCurrency: updatedRateAlert.toCurrency,
            targetRate: updatedRateAlert.targetRate,
            customerEmail: updatedRateAlert.customerEmail
          }
        });
        
        resolve(updatedRateAlert);
      }, 800);
    });
  }
  
  /**
   * Get all website orders
   */
  getWebsiteOrders(): Promise<WebsiteOrder[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve([...this.websiteOrders]);
      }, 500);
    });
  }
  
  /**
   * Get website order by ID
   */
  getWebsiteOrderById(id: string): Promise<WebsiteOrder | null> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const order = this.websiteOrders.find(order => order.id === id);
        resolve(order || null);
      }, 300);
    });
  }
  
  /**
   * Get website metrics
   */
  getWebsiteMetrics(): Promise<WebsiteMetrics> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve({ ...this.websiteMetrics });
      }, 500);
    });
  }
  
  /**
   * Track a website visitor
   */
  trackVisitor(): void {
    this.websiteMetrics.visitors++;
    this.updateConversionRate();
  }
  
  /**
   * Track a page view
   */
  trackPageView(): void {
    this.websiteMetrics.pageViews++;
  }
  
  /**
   * Track a calculator use
   */
  trackCalculatorUse(): void {
    this.websiteMetrics.calculatorUses++;
    this.updateConversionRate();
  }
  
  /**
   * Update conversion rate
   */
  private updateConversionRate(): void {
    const totalConversions = this.websiteMetrics.rateLocks + this.websiteMetrics.rateAlerts;
    const totalVisitors = this.websiteMetrics.visitors;
    
    if (totalVisitors > 0) {
      this.websiteMetrics.conversionRate = (totalConversions / totalVisitors) * 100;
    }
  }
}

// Create singleton instance
const websiteService = new WebsiteService();

export default websiteService;