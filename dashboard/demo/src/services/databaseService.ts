// Simple IndexedDB-based database service for production use
// This provides persistent storage without requiring a backend server

// Flag to track if IndexedDB is available and working
let isIndexedDBAvailable = true;

// In-memory fallback storage
const memoryStorage: {
  transactions: Transaction[];
  inventory: InventoryItem[];
  customers: Customer[];
  compliance: ComplianceRecord[];
  website_activities: any[];
  [key: string]: any[];
} = {
  transactions: [],
  inventory: [],
  customers: [],
  compliance: [],
  website_activities: []
};

export interface Transaction {
  id: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  commission: number;
  profit: number;
  status: 'pending' | 'completed' | 'locked' | 'submitted';
  customerId?: string;
  customerInfo?: any;
  complianceStatus?: 'none' | 'enhanced_records' | 'lctr_required' | 'completed';
  lctrDeadline?: string;
  riskScore?: number;
  timestamp: number;
}

export interface InventoryItem {
  id: string;
  currency: string;
  amount: number;
  buyRate: number;
  sellRate: number;
  lastUpdated: string;
  timestamp: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: any;
  identification?: any;
  riskAssessment?: any;
  transactions: string[];
  createdAt: string;
  timestamp: number;
}

export interface ComplianceRecord {
  id: string;
  transactionId: string;
  type: 'lctr' | 'enhanced_records';
  status: 'pending' | 'submitted' | 'completed';
  customerInfo: any;
  riskAssessment: any;
  submissionDate?: string;
  deadline: string;
  timestamp: number;
}

class DatabaseService {
  private db: IDBDatabase | null = null;
  private dbName = 'LeaperFxDB';
  private version = 1;

  async init(): Promise<void> {
    // Check if IndexedDB is available in the browser
    if (!window.indexedDB) {
      isIndexedDBAvailable = false;
      return Promise.resolve();
    }

    try {
      return new Promise((resolve) => {
        const request = indexedDB.open(this.dbName, this.version);

        request.onerror = (event) => {
          console.error('Error opening IndexedDB:', event);
          isIndexedDBAvailable = false;
          resolve(); // Resolve anyway to allow the application to continue
        };

        request.onsuccess = () => {
          this.db = request.result;
          isIndexedDBAvailable = true;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          try {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create transactions store
            if (!db.objectStoreNames.contains('transactions')) {
              const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
              transactionStore.createIndex('date', 'date', { unique: false });
              transactionStore.createIndex('status', 'status', { unique: false });
              transactionStore.createIndex('complianceStatus', 'complianceStatus', { unique: false });
            }

            // Create inventory store
            if (!db.objectStoreNames.contains('inventory')) {
              const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
              inventoryStore.createIndex('currency', 'currency', { unique: true });
            }

            // Create customers store
            if (!db.objectStoreNames.contains('customers')) {
              const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
              customerStore.createIndex('email', 'email', { unique: false });
              customerStore.createIndex('phone', 'phone', { unique: false });
            }

            // Create compliance store
            if (!db.objectStoreNames.contains('compliance')) {
              const complianceStore = db.createObjectStore('compliance', { keyPath: 'id' });
              complianceStore.createIndex('transactionId', 'transactionId', { unique: false });
              complianceStore.createIndex('status', 'status', { unique: false });
              complianceStore.createIndex('deadline', 'deadline', { unique: false });
            }

            // Create website activities store
            if (!db.objectStoreNames.contains('website_activities')) {
              const websiteStore = db.createObjectStore('website_activities', { keyPath: 'id' });
              websiteStore.createIndex('type', 'type', { unique: false });
              websiteStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Create generic storage store for form sessions and other dynamic data
            if (!db.objectStoreNames.contains('generic_storage')) {
              db.createObjectStore('generic_storage', { keyPath: 'key' });
            }
          } catch (error) {
            console.error('Error during database upgrade:', error);
            isIndexedDBAvailable = false;
          }
        };
      });
    } catch (error) {
      console.error('Unexpected error initializing IndexedDB:', error);
      isIndexedDBAvailable = false;
      return Promise.resolve(); // Allow the application to continue
    }
  }

  // Interface for object store operations (both real and mock)
  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<any> {
    // If IndexedDB is not available, use in-memory fallback
    if (!isIndexedDBAvailable) {
      return this.getMockStore(storeName, mode);
    }

    try {
      if (!this.db) {
        await this.init();
      }
      
      if (!this.db || !isIndexedDBAvailable) {
        return this.getMockStore(storeName, mode);
      }
      
      const transaction = this.db.transaction([storeName], mode);
      return transaction.objectStore(storeName);
    } catch (error) {
      console.error(`Error getting store ${storeName}, using in-memory fallback:`, error);
      isIndexedDBAvailable = false; // Mark as unavailable for future calls
      return this.getMockStore(storeName, mode);
    }
  }
  
  // Get a mock store for in-memory fallback
  private getMockStore(storeName: string, _mode: IDBTransactionMode): any {
    return {
      // Mock methods that would be available on IDBObjectStore
      get: async (id: string) => {
        return memoryStorage[storeName].find(item => item.id === id) || null;
      },
      
      getAll: async () => {
        return [...memoryStorage[storeName]];
      },
      
      add: async (item: any) => {
        memoryStorage[storeName].push(item);
        return { result: item };
      },
      
      put: async (item: any) => {
        const index = memoryStorage[storeName].findIndex(i => i.id === item.id);
        if (index !== -1) {
          memoryStorage[storeName][index] = item;
        } else {
          memoryStorage[storeName].push(item);
        }
        return { result: item };
      },
      
      // Mock index method
      index: (indexName: string) => {
        return {
          get: async (key: any) => {
            return memoryStorage[storeName].find(item => item[indexName] === key) || null;
          }
        };
      }
    };
  }

  // Transaction methods
  async createTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateId(),
      timestamp: Date.now()
    };

    const store = await this.getStore('transactions', 'readwrite');
    await this.promisifyRequest(store.add(newTransaction));
    return newTransaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    const store = await this.getStore('transactions');
    const request = store.getAll();
    const result = await this.promisifyRequest(request) as Transaction[];
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const store = await this.getStore('transactions', 'readwrite');
    const transaction = await this.promisifyRequest(store.get(id));
    if (transaction) {
      const updatedTransaction = { ...transaction, ...updates };
      await this.promisifyRequest(store.put(updatedTransaction));
    }
  }

  // Inventory methods
  async getInventory(): Promise<InventoryItem[]> {
    const store = await this.getStore('inventory');
    const result = await this.promisifyRequest(store.getAll()) as InventoryItem[];
    return result.sort((a, b) => a.currency.localeCompare(b.currency));
  }

  async addInventoryItem(item: Omit<InventoryItem, 'id' | 'timestamp'>): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now()
    };

    const store = await this.getStore('inventory', 'readwrite');
    await this.promisifyRequest(store.add(newItem));
    return newItem;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    const store = await this.getStore('inventory', 'readwrite');
    const item = await this.promisifyRequest(store.get(id));
    if (item) {
      const updatedItem = { ...item, ...updates, lastUpdated: new Date().toISOString() };
      await this.promisifyRequest(store.put(updatedItem));
    }
  }

  async addStock(currency: string, amount: number, buyRate: number): Promise<void> {
    const store = await this.getStore('inventory', 'readwrite');
    const index = store.index('currency');
    const existing = await this.promisifyRequest(index.get(currency)) as InventoryItem | null;

    if (existing) {
      // Update existing inventory
      existing.amount += amount;
      existing.buyRate = buyRate;
      existing.sellRate = buyRate * 1.015; // 1.5% markup
      existing.lastUpdated = new Date().toISOString();
      await this.promisifyRequest(store.put(existing));
    } else {
      // Create new inventory item
      await this.addInventoryItem({
        currency,
        amount,
        buyRate,
        sellRate: buyRate * 1.015,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  // Customer methods
  async createCustomer(customer: Omit<Customer, 'id' | 'timestamp'>): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: this.generateId(),
      timestamp: Date.now()
    };

    const store = await this.getStore('customers', 'readwrite');
    await this.promisifyRequest(store.add(newCustomer));
    return newCustomer;
  }

  async getCustomers(): Promise<Customer[]> {
    const store = await this.getStore('customers');
    const result = await this.promisifyRequest(store.getAll()) as Customer[];
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Compliance methods
  async createComplianceRecord(record: Omit<ComplianceRecord, 'id' | 'timestamp'>): Promise<ComplianceRecord> {
    const newRecord: ComplianceRecord = {
      ...record,
      id: this.generateId(),
      timestamp: Date.now()
    };

    const store = await this.getStore('compliance', 'readwrite');
    await this.promisifyRequest(store.add(newRecord));
    return newRecord;
  }

  async getComplianceRecords(): Promise<ComplianceRecord[]> {
    const store = await this.getStore('compliance');
    const result = await this.promisifyRequest(store.getAll()) as ComplianceRecord[];
    return result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }

  async updateComplianceRecord(id: string, updates: Partial<ComplianceRecord>): Promise<void> {
    const store = await this.getStore('compliance', 'readwrite');
    const record = await this.promisifyRequest(store.get(id));
    if (record) {
      const updatedRecord = { ...record, ...updates };
      await this.promisifyRequest(store.put(updatedRecord));
    }
  }

  // Website activities methods
  async trackWebsiteActivity(activity: any): Promise<void> {
    const newActivity = {
      ...activity,
      id: this.generateId(),
      timestamp: Date.now()
    };

    const store = await this.getStore('website_activities', 'readwrite');
    await this.promisifyRequest(store.add(newActivity));
  }

  async getWebsiteActivities(): Promise<any[]> {
    const store = await this.getStore('website_activities');
    const result = await this.promisifyRequest(store.getAll()) as any[];
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  // CSV Import methods
  async importFromCSV(data: any[], type: 'inventory' | 'customers' | 'clients'): Promise<void> {
    if (type === 'inventory') {
      for (const row of data) {
        await this.addInventoryItem({
          currency: row.currency,
          amount: parseFloat(row.amount) || 0,
          buyRate: parseFloat(row.buyRate) || 0,
          sellRate: parseFloat(row.sellRate) || parseFloat(row.buyRate) * 1.015,
          lastUpdated: new Date().toISOString()
        });
      }
    } else if (type === 'customers' || type === 'clients') {
      // Import customers through customerService to ensure consistency
      const customerService = await import('./customerService');
      const service = customerService.default;
      
      for (const row of data) {
        await service.createCustomer({
          firstName: row.firstName || '',
          lastName: row.lastName || '',
          email: row.email || '',
          phone: row.phone || '',
          dateOfBirth: row.dateOfBirth || '',
          occupation: row.occupation || '',
          address: row.address || '',
          city: row.city || '',
          postalCode: row.postalCode || '',
          country: row.country || 'Canada',
          idType: row.idType || '',
          idNumber: row.idNumber || ''
        });
      }
    }
  }

  // Initialize database tables (production ready - no mock data)
  async initializeDefaultData(): Promise<void> {
    try {
      // Simply ensure the database is initialized - no mock data for production
      await this.getInventory(); // Just to ensure connection is working
      // Database is ready, no default data insertion for production use
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  // Generic storage methods for any data type
  async setItem(key: string, value: any): Promise<void> {
    try {
      if (!isIndexedDBAvailable) {
        // Fallback to localStorage for development/testing
        localStorage.setItem(key, JSON.stringify(value));
        return;
      }

      // Create or use a generic storage store
      const db = await this.ensureDatabase();
      if (!db.objectStoreNames.contains('generic_storage')) {
        // If generic_storage doesn't exist, use localStorage fallback
        localStorage.setItem(key, JSON.stringify(value));
        return;
      }

      const transaction = db.transaction(['generic_storage'], 'readwrite');
      const store = transaction.objectStore('generic_storage');
      await this.promisifyRequest(store.put({ key, value }));
    } catch (error) {
      console.error('Error setting item:', error);
      // Fallback to localStorage
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  async getItem(key: string): Promise<any> {
    try {
      if (!isIndexedDBAvailable) {
        // Fallback to localStorage for development/testing
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }

      // Get from generic storage store
      const db = await this.ensureDatabase();
      if (!db.objectStoreNames.contains('generic_storage')) {
        // If generic_storage doesn't exist, use localStorage fallback
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }

      const transaction = db.transaction(['generic_storage'], 'readonly');
      const store = transaction.objectStore('generic_storage');
      const result = await this.promisifyRequest(store.get(key));
      return result ? result.value : null;
    } catch (error) {
      console.error('Error getting item:', error);
      // Fallback to localStorage
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  }

  // Ensure database is initialized and return it (public wrapper)
  async ensureDatabase(): Promise<IDBDatabase> {
    return this._ensureDatabase();
  }

  // Internal helper to initialize and return the DB
  private async _ensureDatabase(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    return this.db;
  }

  // Utility methods
  private generateId(): string {
    // Use crypto.randomUUID() for collision-proof, cryptographically secure IDs
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers (though should not be needed in modern environments)
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const databaseService = new DatabaseService();
export default databaseService;