// src/services/mockInventoryService.ts
import mockWebSocketService from './mockWebSocketService';

// Types
export interface InventoryItem {
  id: number;
  currency: string;
  amount: number;
  buyRate: number;
  sellRate: number;
  lastUpdated: string;
}

export interface AddStockParams {
  currency: string;
  amount: number;
  buyRate: number;
}

/**
 * Mock Inventory Service
 * 
 * This service simulates database operations for inventory management.
 * In a real implementation, this would make API calls to a backend server.
 */
class MockInventoryService {
  private inventory: InventoryItem[] = [
    { id: 1, currency: 'USD', amount: 5000, buyRate: 1.32, sellRate: 1.38, lastUpdated: '2025-07-20' },
    { id: 2, currency: 'EUR', amount: 3000, buyRate: 1.45, sellRate: 1.52, lastUpdated: '2025-07-20' },
    { id: 3, currency: 'GBP', amount: 2000, buyRate: 1.70, sellRate: 1.78, lastUpdated: '2025-07-20' },
    { id: 4, currency: 'JPY', amount: 200000, buyRate: 0.0088, sellRate: 0.0092, lastUpdated: '2025-07-20' },
    { id: 5, currency: 'AUD', amount: 1500, buyRate: 0.88, sellRate: 0.92, lastUpdated: '2025-07-20' },
  ];
  
  /**
   * Get all inventory items
   */
  getInventory(): Promise<InventoryItem[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve([...this.inventory]);
      }, 500);
    });
  }
  
  /**
   * Get inventory item by currency
   */
  getInventoryByCurrency(currency: string): Promise<InventoryItem | null> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const item = this.inventory.find(item => item.currency === currency);
        resolve(item || null);
      }, 300);
    });
  }
  
  /**
   * Add stock to inventory
   */
  addStock(params: AddStockParams): Promise<InventoryItem> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const { currency, amount, buyRate } = params;
        const existingItem = this.inventory.find(item => item.currency === currency);
        
        let updatedItem: InventoryItem;
        
        if (existingItem) {
          // Update existing item
          updatedItem = {
            ...existingItem,
            amount: existingItem.amount + amount,
            buyRate,
            sellRate: buyRate * 1.05, // Example markup
            lastUpdated: new Date().toISOString().split('T')[0]
          };
          
          // Update inventory
          this.inventory = this.inventory.map(item => 
            item.id === existingItem.id ? updatedItem : item
          );
        } else {
          // Create new item
          updatedItem = {
            id: Math.max(...this.inventory.map(item => item.id)) + 1,
            currency,
            amount,
            buyRate,
            sellRate: buyRate * 1.05, // Example markup
            lastUpdated: new Date().toISOString().split('T')[0]
          };
          
          // Add to inventory
          this.inventory.push(updatedItem);
        }
        
        // Notify via WebSocket
        mockWebSocketService.send({
          type: 'inventory_update',
          data: {
            currency,
            amount,
            action: 'increase',
            buyRate,
            sellRate: updatedItem.sellRate
          }
        });
        
        resolve(updatedItem);
      }, 800);
    });
  }
  
  /**
   * Update inventory item
   */
  updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    return new Promise((resolve, reject) => {
      // Simulate API delay
      setTimeout(() => {
        const itemIndex = this.inventory.findIndex(item => item.id === id);
        
        if (itemIndex === -1) {
          reject(new Error(`Inventory item with ID ${id} not found`));
          return;
        }
        
        const updatedItem = {
          ...this.inventory[itemIndex],
          ...updates,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        // Update inventory
        this.inventory[itemIndex] = updatedItem;
        
        // Notify via WebSocket
        mockWebSocketService.send({
          type: 'inventory_update',
          data: {
            currency: updatedItem.currency,
            amount: updatedItem.amount,
            action: 'update',
            buyRate: updatedItem.buyRate,
            sellRate: updatedItem.sellRate
          }
        });
        
        resolve(updatedItem);
      }, 600);
    });
  }
  
  /**
   * Adjust inventory after a transaction
   */
  adjustInventoryAfterTransaction(fromCurrency: string, toCurrency: string, fromAmount: number, toAmount: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate API delay
      setTimeout(async () => {
        try {
          // Find inventory items
          const fromItem = this.inventory.find(item => item.currency === fromCurrency);
          const toItem = this.inventory.find(item => item.currency === toCurrency);
          
          if (!fromItem || !toItem) {
            reject(new Error('Currency not found in inventory'));
            return;
          }
          
          // Update inventory
          if (fromCurrency !== 'CAD') {
            // Customer is selling foreign currency, we're buying
            await this.updateInventoryItem(fromItem.id, {
              amount: fromItem.amount + fromAmount
            });
          }
          
          if (toCurrency !== 'CAD') {
            // Customer is buying foreign currency, we're selling
            await this.updateInventoryItem(toItem.id, {
              amount: toItem.amount - toAmount
            });
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 700);
    });
  }
  
  /**
   * Get low inventory alerts
   */
  getLowInventoryAlerts(): Promise<InventoryItem[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const lowInventory = this.inventory.filter(item => item.amount < 2000);
        resolve(lowInventory);
      }, 400);
    });
  }
}

// Create singleton instance
const mockInventoryService = new MockInventoryService();

export default mockInventoryService;