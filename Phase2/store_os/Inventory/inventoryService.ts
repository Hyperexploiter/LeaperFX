// Real Inventory Service - Production Ready
import databaseService from './databaseService';
import type { InventoryItem as DBInventoryItem } from './databaseService';

export interface InventoryItem {
  id: string;
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
 * Real Inventory Service
 * 
 * This service provides database operations for inventory management.
 * Uses IndexedDB for persistent storage without requiring a backend server.
 */
class InventoryService {
  private async ensureInitialized(): Promise<void> {
    await databaseService.init();
    // Initialize with default data if empty
    await databaseService.initializeDefaultData();
  }

  private mapDBInventoryToInventory(dbItem: DBInventoryItem): InventoryItem {
    return {
      id: dbItem.id,
      currency: dbItem.currency,
      amount: dbItem.amount,
      buyRate: dbItem.buyRate,
      sellRate: dbItem.sellRate,
      lastUpdated: dbItem.lastUpdated
    };
  }

  /**
   * Get all inventory items
   */
  async getInventory(): Promise<InventoryItem[]> {
    await this.ensureInitialized();
    const dbItems = await databaseService.getInventory();
    return dbItems.map(item => this.mapDBInventoryToInventory(item));
  }

  /**
   * Add stock to existing inventory or create new item
   */
  async addStock(params: AddStockParams): Promise<void> {
    await this.ensureInitialized();
    await databaseService.addStock(params.currency, params.amount, params.buyRate);
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    await this.ensureInitialized();
    await databaseService.updateInventoryItem(id, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Get inventory for a specific currency
   */
  async getInventoryByCurrency(currency: string): Promise<InventoryItem | null> {
    const inventory = await this.getInventory();
    return inventory.find(item => item.currency === currency) || null;
  }

  /**
   * Check if sufficient inventory exists for a transaction
   */
  async checkInventoryAvailability(currency: string, amount: number): Promise<boolean> {
    const item = await this.getInventoryByCurrency(currency);
    return item ? item.amount >= amount : false;
  }

  /**
   * Reserve inventory for a transaction (reduce available amount)
   */
  async reserveInventory(currency: string, amount: number): Promise<boolean> {
    const item = await this.getInventoryByCurrency(currency);
    if (!item || item.amount < amount) {
      return false;
    }

    await this.updateInventoryItem(item.id, {
      amount: item.amount - amount
    });

    return true;
  }

  /**
   * Get low inventory alerts
   */
  async getLowInventoryAlerts(): Promise<InventoryItem[]> {
    const inventory = await this.getInventory();
    return inventory.filter(item => item.amount < 1000); // Low threshold: 1000 units
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats(): Promise<{
    totalCurrencies: number;
    totalValue: number;
    lowStockCount: number;
    lastUpdated: string;
  }> {
    const inventory = await this.getInventory();
    const lowStock = await this.getLowInventoryAlerts();
    
    // Calculate total value (simplified - in production you'd use real exchange rates)
    const totalValue = inventory.reduce((sum, item) => {
      const cadValue = item.amount * item.sellRate; // Approximate CAD value
      return sum + cadValue;
    }, 0);

    const lastUpdated = inventory.length > 0 ? 
      Math.max(...inventory.map(item => new Date(item.lastUpdated).getTime())) : 
      Date.now();

    return {
      totalCurrencies: inventory.length,
      totalValue: Math.round(totalValue),
      lowStockCount: lowStock.length,
      lastUpdated: new Date(lastUpdated).toISOString()
    };
  }
}

// Export singleton instance
const inventoryService = new InventoryService();
export default inventoryService;