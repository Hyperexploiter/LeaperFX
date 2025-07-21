// src/services/mockAnalyticsService.ts
import mockTransactionService from './mockTransactionService';
import mockInventoryService from './mockInventoryService';

// Types
export interface DailyPerformance {
  date: string;
  transactions: number;
  volume: number;
  profit: number;
}

export interface CurrencyPerformance {
  currency: string;
  transactions: number;
  volume: number;
  profit: number;
}

export interface BusinessInsight {
  type: 'info' | 'warning' | 'opportunity';
  title: string;
  description: string;
  priority: number; // 1-10, higher is more important
}

/**
 * Mock Analytics Service
 * 
 * This service simulates business intelligence and analytics operations.
 * In a real implementation, this would make API calls to a backend server.
 */
class MockAnalyticsService {
  /**
   * Get daily performance data for the last 7 days
   */
  getDailyPerformance(): Promise<DailyPerformance[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(async () => {
        // Get transactions
        const transactions = await mockTransactionService.getTransactions();
        
        // Create a map of daily performance
        const dailyMap = new Map<string, DailyPerformance>();
        
        // Get dates for the last 7 days
        const dates: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD
        }
        
        // Initialize daily performance for each date
        dates.forEach(date => {
          dailyMap.set(date, {
            date,
            transactions: 0,
            volume: 0,
            profit: 0
          });
        });
        
        // Calculate daily performance from transactions
        transactions.forEach(tx => {
          const txDate = tx.date.split(' ')[0]; // YYYY-MM-DD
          if (dailyMap.has(txDate)) {
            const daily = dailyMap.get(txDate)!;
            daily.transactions += 1;
            daily.volume += tx.fromAmount;
            daily.profit += tx.profit;
          }
        });
        
        // Convert map to array and sort by date
        const dailyPerformance = Array.from(dailyMap.values())
          .sort((a, b) => a.date.localeCompare(b.date));
        
        resolve(dailyPerformance);
      }, 800);
    });
  }
  
  /**
   * Get currency performance data
   */
  getCurrencyPerformance(): Promise<CurrencyPerformance[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(async () => {
        // Get transaction summary
        const summary = await mockTransactionService.getTransactionSummary();
        
        // Convert to array of currency performance
        const currencyPerformance: CurrencyPerformance[] = Object.entries(summary.byCurrency)
          .map(([currency, data]) => ({
            currency,
            transactions: data.transactions,
            volume: data.volume,
            profit: data.profit
          }))
          .sort((a, b) => b.volume - a.volume); // Sort by volume, highest first
        
        resolve(currencyPerformance);
      }, 600);
    });
  }
  
  /**
   * Get business insights and recommendations
   */
  getBusinessInsights(): Promise<BusinessInsight[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(async () => {
        const insights: BusinessInsight[] = [];
        
        // Get inventory and transaction data
        const inventory = await mockInventoryService.getInventory();
        const lowInventory = await mockInventoryService.getLowInventoryAlerts();
        const currencyPerformance = await this.getCurrencyPerformance();
        const dailyPerformance = await this.getDailyPerformance();
        
        // Add low inventory insights
        lowInventory.forEach(item => {
          insights.push({
            type: 'warning',
            title: `${item.currency} inventory running low`,
            description: `Current ${item.currency} inventory is ${item.amount.toLocaleString()} units. Consider restocking soon to maintain service levels.`,
            priority: item.amount < 1000 ? 9 : 7
          });
        });
        
        // Add high-performing currency insights
        if (currencyPerformance.length > 0) {
          const topCurrency = currencyPerformance[0];
          insights.push({
            type: 'info',
            title: `${topCurrency.currency} is your top performing currency`,
            description: `${topCurrency.currency} accounts for ${((topCurrency.volume / currencyPerformance.reduce((sum, curr) => sum + curr.volume, 0)) * 100).toFixed(1)}% of your total volume. Ensure adequate inventory levels.`,
            priority: 6
          });
        }
        
        // Add daily performance insights
        if (dailyPerformance.length > 0) {
          // Find the day with highest volume
          const highestVolumeDay = dailyPerformance.reduce(
            (max, day) => day.volume > max.volume ? day : max,
            dailyPerformance[0]
          );
          
          // Convert date to day of week
          const dayOfWeek = new Date(highestVolumeDay.date).toLocaleDateString('en-US', { weekday: 'long' });
          
          insights.push({
            type: 'info',
            title: `${dayOfWeek} is your highest volume day`,
            description: `Consider optimizing staffing and inventory levels for ${dayOfWeek} to meet higher demand.`,
            priority: 5
          });
        }
        
        // Add opportunity insights
        if (inventory.length > 0) {
          // Find currency with highest buy/sell spread
          const highestSpreadCurrency = inventory.reduce(
            (max, curr) => (curr.sellRate - curr.buyRate) > (max.sellRate - max.buyRate) ? curr : max,
            inventory[0]
          );
          
          const spreadPercentage = ((highestSpreadCurrency.sellRate - highestSpreadCurrency.buyRate) / highestSpreadCurrency.buyRate * 100).toFixed(1);
          
          insights.push({
            type: 'opportunity',
            title: `${highestSpreadCurrency.currency} has your highest profit margin`,
            description: `${highestSpreadCurrency.currency} has a ${spreadPercentage}% spread. Consider promoting this currency to increase profits.`,
            priority: 8
          });
        }
        
        // Sort insights by priority
        insights.sort((a, b) => b.priority - a.priority);
        
        resolve(insights);
      }, 1000);
    });
  }
  
  /**
   * Get profit analysis data
   */
  getProfitAnalysis(): Promise<{
    totalProfit: number;
    averageProfitPerTransaction: number;
    profitTrend: number; // Percentage change from previous period
    topProfitCurrency: string;
  }> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(async () => {
        // Get transaction data
        const transactions = await mockTransactionService.getTransactions();
        const summary = await mockTransactionService.getTransactionSummary();
        
        // Calculate total profit
        const totalProfit = transactions.reduce((sum, tx) => sum + tx.profit, 0);
        
        // Calculate average profit per transaction
        const averageProfitPerTransaction = totalProfit / transactions.length;
        
        // Calculate profit trend (mock data)
        const profitTrend = 12.5; // 12.5% increase from previous period
        
        // Find top profit currency
        let topProfitCurrency = '';
        let maxProfit = 0;
        
        Object.entries(summary.byCurrency).forEach(([currency, data]) => {
          if (data.profit > maxProfit) {
            maxProfit = data.profit;
            topProfitCurrency = currency;
          }
        });
        
        resolve({
          totalProfit,
          averageProfitPerTransaction,
          profitTrend,
          topProfitCurrency
        });
      }, 700);
    });
  }
}

// Create singleton instance
const mockAnalyticsService = new MockAnalyticsService();

export default mockAnalyticsService;