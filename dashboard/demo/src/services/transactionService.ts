// Real Transaction Service - Production Ready
import databaseService from './databaseService';
import type { Transaction as DBTransaction } from './databaseService';

// Types
export interface Transaction {
  id: string;
  date: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  commission: number;
  profit: number;
  
  // FINTRAC Compliance Fields
  status?: 'pending' | 'locked' | 'completed' | 'submitted';
  requiresLCTR?: boolean;
  requiresEnhancedRecords?: boolean;
  lctrDeadline?: string;
  daysUntilDeadline?: number;
  customerId?: string;
  riskScore?: number;
  riskRating?: 'low' | 'medium' | 'high' | 'critical';
  riskFactors?: string[];
  requiresEnhancedDueDiligence?: boolean;
  requiresOngoingMonitoring?: boolean;
  reportSubmitted?: boolean;
  reportId?: string;
  reportSubmissionDate?: string;
  complianceStatus?: 'none' | 'enhanced_records' | 'lctr_required' | 'completed';
}

export interface CreateTransactionParams {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  commission: number;
  
  // Optional customer linkage at creation time
  customerId?: string | null;
  
  // FINTRAC Compliance Fields
  status?: 'pending' | 'locked' | 'completed' | 'submitted';
  requiresLCTR?: boolean;
  requiresEnhancedRecords?: boolean;
  lctrDeadline?: string;
  daysUntilDeadline?: number;
}

/**
 * Real Transaction Service
 * 
 * This service provides database operations for transaction management.
 * Uses IndexedDB for persistent storage without requiring a backend server.
 */
class TransactionService {
  private async ensureInitialized(): Promise<void> {
    await databaseService.init();
  }

  private mapDBTransactionToTransaction(dbTransaction: DBTransaction): Transaction {
    const daysUntilDeadline = dbTransaction.lctrDeadline ? 
      Math.ceil((new Date(dbTransaction.lctrDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
      undefined;

    return {
      id: dbTransaction.id,
      date: dbTransaction.date,
      fromCurrency: dbTransaction.fromCurrency,
      toCurrency: dbTransaction.toCurrency,
      fromAmount: dbTransaction.fromAmount,
      toAmount: dbTransaction.toAmount,
      commission: dbTransaction.commission,
      profit: dbTransaction.profit,
      status: dbTransaction.status,
      customerId: (dbTransaction as any).customerId,
      requiresLCTR: dbTransaction.complianceStatus === 'lctr_required',
      requiresEnhancedRecords: dbTransaction.complianceStatus === 'enhanced_records',
      lctrDeadline: dbTransaction.lctrDeadline,
      daysUntilDeadline,
      riskScore: dbTransaction.riskScore,
      complianceStatus: dbTransaction.complianceStatus
    };
  }

  /**
   * Get all transactions
   */
  async getTransactions(): Promise<Transaction[]> {
    await this.ensureInitialized();
    const dbTransactions = await databaseService.getTransactions();
    return dbTransactions.map(tx => this.mapDBTransactionToTransaction(tx));
  }
  
  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    await this.ensureInitialized();
    const transactions = await databaseService.getTransactions();
    const transaction = transactions.find(tx => tx.id === id);
    return transaction ? this.mapDBTransactionToTransaction(transaction) : null;
  }
  
  /**
   * Create a new transaction
   */
  async createTransaction(params: CreateTransactionParams): Promise<Transaction> {
    await this.ensureInitialized();
    
    const now = new Date();
    
    // Check if transaction requires FINTRAC compliance
    const requiresCompliance = this.checkComplianceRequirements(params.fromAmount, params.fromCurrency);
    
    const dbTransaction = await databaseService.createTransaction({
      date: now.toISOString().slice(0, 16).replace('T', ' '), // Format: YYYY-MM-DD HH:MM
      fromCurrency: params.fromCurrency,
      toCurrency: params.toCurrency,
      fromAmount: params.fromAmount,
      toAmount: params.toAmount,
      commission: params.commission,
      profit: params.commission, // Profit = commission for now
      status: requiresCompliance.requiresLCTR ? 'locked' : 'completed',
      complianceStatus: requiresCompliance.requiresLCTR ? 'lctr_required' : 
                       requiresCompliance.requiresEnhancedRecords ? 'enhanced_records' : 'none',
      lctrDeadline: requiresCompliance.requiresLCTR ? 
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() : // 15 days from now
        undefined,
      // Persist initial customer assignment if provided
      customerId: params.customerId || undefined
    });

    // If compliance is required, trigger the event
    if (requiresCompliance.requiresLCTR || requiresCompliance.requiresEnhancedRecords) {
      // Store in localStorage for dashboard pickup
      localStorage.setItem('pendingComplianceTransaction', JSON.stringify({
        id: dbTransaction.id,
        timestamp: new Date().toISOString()
      }));

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('fintracComplianceRequired', {
        detail: {
          transactionId: dbTransaction.id,
          requiresLCTR: requiresCompliance.requiresLCTR
        }
      }));
    }

    return this.mapDBTransactionToTransaction(dbTransaction);
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    await this.ensureInitialized();

    // Preserve existing complianceStatus unless explicitly changed or implied by flags
    const current = await this.getTransactionById(id);
    if (!current) return null;

    let newComplianceStatus = current.complianceStatus;
    if (updates.requiresLCTR === true) {
      newComplianceStatus = 'lctr_required';
    } else if (updates.requiresEnhancedRecords === true) {
      newComplianceStatus = 'enhanced_records';
    } else if (typeof updates.complianceStatus !== 'undefined') {
      newComplianceStatus = updates.complianceStatus;
    }

    const dbUpdates: Partial<DBTransaction> = {
      ...updates,
      complianceStatus: newComplianceStatus
    };

    await databaseService.updateTransaction(id, dbUpdates);

    const updatedTransaction = await this.getTransactionById(id);
    return updatedTransaction;
  }
  
  /**
   * Get transactions for a specific date range
   */
  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    await this.ensureInitialized();
    const allTransactions = await this.getTransactions();
    
    return allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return txDate >= start && txDate <= end;
    });
  }
  
  /**
   * Get today's transactions
   */
  async getTodaysTransactions(): Promise<Transaction[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return this.getTransactionsByDateRange(today, tomorrow);
  }

  /**
   * Get transactions requiring FINTRAC compliance
   */
  async getComplianceTransactions(): Promise<Transaction[]> {
    await this.ensureInitialized();
    const allTransactions = await this.getTransactions();
    
    return allTransactions.filter(tx => 
      tx.complianceStatus === 'lctr_required' || 
      tx.complianceStatus === 'enhanced_records'
    );
  }

  /**
   * Get FINTRAC compliance transactions (alias for backwards compatibility)
   */
  async getFintracComplianceTransactions(): Promise<Transaction[]> {
    return this.getComplianceTransactions();
  }

  /**
   * Link a customer to an existing transaction (post-facto assignment)
   */
  async linkCustomerToTransaction(transactionId: string, customerId: string): Promise<Transaction | null> {
    await this.ensureInitialized();
    
    try {
      // Get the existing transaction
      const transaction = await this.getTransactionById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Update transaction with customer ID
      const updatedTransaction = await this.updateTransaction(transactionId, {
        customerId: customerId
      });

      // Broadcast update to interested subscribers (Transactions, Compliance, Analytics)
      try {
        const { default: webSocketService } = await import('./webSocketService');
        webSocketService.send({
          type: 'transaction_updated',
          data: { id: transactionId, customerId }
        });
      } catch (e) {
        // Non-fatal: log but do not block the flow
        console.warn('WebSocket broadcast failed for transaction update:', e);
      }

      return updatedTransaction;
    } catch (error) {
      console.error('Error linking customer to transaction:', error);
      throw error;
    }
  }

  /**
   * Get transactions without customer assignments (orphaned transactions)
   */
  async getTransactionsWithoutCustomers(): Promise<Transaction[]> {
    await this.ensureInitialized();
    const allTransactions = await this.getTransactions();
    
    return allTransactions.filter(tx => !tx.customerId);
  }

  /**
   * Get transactions by customer ID
   */
  async getTransactionsByCustomerId(customerId: string): Promise<Transaction[]> {
    await this.ensureInitialized();
    const allTransactions = await this.getTransactions();
    
    return allTransactions.filter(tx => tx.customerId === customerId);
  }

  /**
   * Check if a transaction requires FINTRAC compliance
   */
  private checkComplianceRequirements(amount: number, currency: string): {
    requiresLCTR: boolean;
    requiresEnhancedRecords: boolean;
  } {
    // Convert to CAD equivalent for compliance checking
    let cadAmount = amount;
    if (currency !== 'CAD') {
      // Simple conversion - in production you'd use real exchange rates
      const exchangeRates: { [key: string]: number } = {
        'USD': 1.35,
        'EUR': 1.45,
        'GBP': 1.70,
        'JPY': 0.009,
        'AUD': 0.95,
        'CHF': 1.47
      };
      cadAmount = amount * (exchangeRates[currency] || 1);
    }

    return {
      requiresLCTR: cadAmount >= 10000, // $10,000 CAD threshold for LCTR
      requiresEnhancedRecords: cadAmount >= 3000 // $3,000 CAD threshold for enhanced records
    };
  }

  /**
   * Get daily analytics data
   */
  async getDailyAnalytics(): Promise<any[]> {
    await this.ensureInitialized();
    const transactions = await this.getTransactions();
    
    // Group by date and calculate daily totals
    const dailyData: { [key: string]: { volume: number; transactions: number; profit: number } } = {};
    
    transactions.forEach(tx => {
      const date = tx.date.split(' ')[0]; // Get date part only
      if (!dailyData[date]) {
        dailyData[date] = { volume: 0, transactions: 0, profit: 0 };
      }
      dailyData[date].volume += tx.toAmount;
      dailyData[date].transactions += 1;
      dailyData[date].profit += tx.profit;
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get currency performance data
   */
  async getCurrencyPerformance(): Promise<any[]> {
    await this.ensureInitialized();
    const transactions = await this.getTransactions();
    
    // Group by currency and calculate totals
    const currencyData: { [key: string]: { transactions: number; volume: number; profit: number } } = {};
    
    transactions.forEach(tx => {
      const currency = tx.toCurrency; // Track by destination currency
      if (!currencyData[currency]) {
        currencyData[currency] = { transactions: 0, volume: 0, profit: 0 };
      }
      currencyData[currency].transactions += 1;
      currencyData[currency].volume += tx.toAmount;
      currencyData[currency].profit += tx.profit;
    });

    return Object.entries(currencyData).map(([currency, data]) => ({
      currency,
      ...data
    })).sort((a, b) => b.volume - a.volume);
  }
}

// Export singleton instance
const transactionService = new TransactionService();
export default transactionService;