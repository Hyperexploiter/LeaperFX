// src/services/mockTransactionService.ts
import mockWebSocketService from './mockWebSocketService';
import mockInventoryService from './mockInventoryService';

// Types
export interface Transaction {
  id: number;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  commission: number;
  profit: number;
}

export interface CreateTransactionParams {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  commission: number;
}

/**
 * Mock Transaction Service
 * 
 * This service simulates database operations for transaction management.
 * In a real implementation, this would make API calls to a backend server.
 */
class MockTransactionService {
  private transactions: Transaction[] = [
    { id: 1, date: '2025-07-20 14:30', fromCurrency: 'USD', toCurrency: 'CAD', fromAmount: 1000, toAmount: 1350, commission: 20.25, profit: 20.25 },
    { id: 2, date: '2025-07-20 12:15', fromCurrency: 'EUR', toCurrency: 'CAD', fromAmount: 500, toAmount: 725, commission: 10.88, profit: 10.88 },
    { id: 3, date: '2025-07-19 16:45', fromCurrency: 'CAD', toCurrency: 'GBP', fromAmount: 2000, toAmount: 1176.47, commission: 17.65, profit: 17.65 },
    { id: 4, date: '2025-07-19 10:30', fromCurrency: 'JPY', toCurrency: 'CAD', fromAmount: 50000, toAmount: 440, commission: 6.60, profit: 6.60 },
    { id: 5, date: '2025-07-18 15:20', fromCurrency: 'CAD', toCurrency: 'USD', fromAmount: 3000, toAmount: 2222.22, commission: 33.33, profit: 33.33 },
  ];
  
  /**
   * Get all transactions
   */
  getTransactions(): Promise<Transaction[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve([...this.transactions]);
      }, 500);
    });
  }
  
  /**
   * Get transaction by ID
   */
  getTransactionById(id: number): Promise<Transaction | null> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const transaction = this.transactions.find(tx => tx.id === id);
        resolve(transaction || null);
      }, 300);
    });
  }
  
  /**
   * Get transactions for a specific date range
   */
  getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const filteredTransactions = this.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return txDate >= start && txDate <= end;
        });
        
        resolve(filteredTransactions);
      }, 400);
    });
  }
  
  /**
   * Get today's transactions
   */
  getTodaysTransactions(): Promise<Transaction[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filteredTransactions = this.transactions.filter(tx => 
          tx.date.startsWith(today)
        );
        
        resolve(filteredTransactions);
      }, 300);
    });
  }
  
  /**
   * Create a new transaction
   */
  createTransaction(params: CreateTransactionParams): Promise<Transaction> {
    return new Promise(async (resolve) => {
      // Simulate API delay
      setTimeout(async () => {
        const { fromCurrency, toCurrency, fromAmount, toAmount, commission } = params;
        
        // Create new transaction
        const newTransaction: Transaction = {
          id: Math.max(...this.transactions.map(tx => tx.id)) + 1,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16), // YYYY-MM-DD HH:MM
          fromCurrency,
          toCurrency,
          fromAmount,
          toAmount,
          commission,
          profit: commission, // In this simple example, profit equals commission
        };
        
        // Add to transactions
        this.transactions.unshift(newTransaction); // Add to beginning of array
        
        // Update inventory
        try {
          await mockInventoryService.adjustInventoryAfterTransaction(
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount
          );
        } catch (error) {
          console.error('Error adjusting inventory:', error);
        }
        
        // Notify via WebSocket
        mockWebSocketService.send({
          type: 'transaction_created',
          data: {
            id: newTransaction.id,
            fromCurrency,
            toCurrency,
            fromAmount,
            toAmount,
            profit: newTransaction.profit
          }
        });
        
        resolve(newTransaction);
      }, 800);
    });
  }
  
  /**
   * Get transaction summary
   */
  getTransactionSummary(): Promise<{
    totalTransactions: number;
    totalVolume: number;
    totalProfit: number;
    byCurrency: { [key: string]: { transactions: number; volume: number; profit: number } };
  }> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        // Initialize summary
        const summary = {
          totalTransactions: this.transactions.length,
          totalVolume: 0,
          totalProfit: 0,
          byCurrency: {} as { [key: string]: { transactions: number; volume: number; profit: number } }
        };
        
        // Calculate summary
        this.transactions.forEach(tx => {
          // Add to total volume and profit
          summary.totalVolume += tx.fromAmount;
          summary.totalProfit += tx.profit;
          
          // Add to currency summary
          const fromCurrency = tx.fromCurrency;
          if (!summary.byCurrency[fromCurrency]) {
            summary.byCurrency[fromCurrency] = {
              transactions: 0,
              volume: 0,
              profit: 0
            };
          }
          
          summary.byCurrency[fromCurrency].transactions += 1;
          summary.byCurrency[fromCurrency].volume += tx.fromAmount;
          summary.byCurrency[fromCurrency].profit += tx.profit;
        });
        
        resolve(summary);
      }, 600);
    });
  }
}

// Create singleton instance
const mockTransactionService = new MockTransactionService();

export default mockTransactionService;