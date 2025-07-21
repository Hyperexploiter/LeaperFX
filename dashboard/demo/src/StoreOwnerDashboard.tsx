import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Calculator, DollarSign, BarChart2, Package, LogOut, Menu, X } from 'lucide-react';
import { fetchLatestRates } from './services/exchangeRateService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Import logo assets
import logoBlack from './assets/logo_black.PNG';
import saadatBlack from './assets/saadat_black.PNG';

// Type definitions
interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  active: boolean;
  onClick: () => void;
}

// Sub-components
const NavItem: React.FC<NavItemProps> = ({ icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-3 rounded-lg transition-colors ${
      active 
        ? 'bg-blue-100 text-blue-700' 
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <div className="mr-3">{icon}</div>
    <span className="font-medium">{text}</span>
  </button>
);

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  
  React.useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex items-center text-sm text-gray-500">
      <Clock className="h-4 w-4 mr-2" />
      {time.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
    </div>
  );
};

// Calculator Component
const SmartCalculator: React.FC = () => {
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('CAD');
  const [amount, setAmount] = useState<string>('100');
  const [commission, setCommission] = useState<string>('1.5');
  const [calculatedAmount, setCalculatedAmount] = useState<string>('');
  const [profit, setProfit] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rates, setRates] = useState<{[key: string]: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Currencies for the calculator
  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
  ];
  
  // Fetch exchange rates on component mount and when currencies change
  useEffect(() => {
    const getRates = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const baseCurrency = 'CAD';
        const latestRates = await fetchLatestRates(baseCurrency);
        
        if (latestRates) {
          setRates(latestRates);
        } else {
          setError('Failed to fetch exchange rates');
        }
      } catch (err) {
        setError('An error occurred while fetching exchange rates');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    getRates();
  }, []);
  
  const handleCalculate = () => {
    if (!rates) {
      setError('Exchange rates not available');
      return;
    }
    
    setError(null);
    const amountValue = parseFloat(amount);
    const commissionValue = parseFloat(commission) / 100;
    
    if (isNaN(amountValue) || isNaN(commissionValue)) {
      setError('Please enter valid numbers');
      return;
    }
    
    let exchangeRate: number;
    
    if (fromCurrency === 'CAD' && toCurrency !== 'CAD') {
      // CAD to foreign currency
      exchangeRate = rates[toCurrency];
    } else if (fromCurrency !== 'CAD' && toCurrency === 'CAD') {
      // Foreign currency to CAD
      exchangeRate = 1 / rates[fromCurrency];
    } else if (fromCurrency !== 'CAD' && toCurrency !== 'CAD') {
      // Foreign currency to foreign currency
      const fromRate = rates[fromCurrency];
      const toRate = rates[toCurrency];
      exchangeRate = toRate / fromRate;
    } else {
      // CAD to CAD
      exchangeRate = 1;
    }
    
    const baseConversion = amountValue * exchangeRate;
    const commissionAmount = baseConversion * commissionValue;
    const finalAmount = baseConversion + commissionAmount;
    
    setCalculatedAmount(finalAmount.toFixed(2));
    setProfit(commissionAmount.toFixed(2));
  };
  
  const handleAddToSale = async () => {
    if (!calculatedAmount || !profit) {
      setError('Please calculate the exchange rate first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Import the transaction service dynamically to avoid circular dependencies
      const { default: mockTransactionService } = await import('./services/mockTransactionService');
      
      await mockTransactionService.createTransaction({
        fromCurrency,
        toCurrency,
        fromAmount: parseFloat(amount),
        toAmount: parseFloat(calculatedAmount),
        commission: parseFloat(profit)
      });
      
      // Reset form
      setCalculatedAmount('');
      setProfit('');
      
      // Show success message
      alert('Transaction added successfully!');
    } catch (err) {
      setError('Failed to add transaction');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Smart Calculator</h2>
        {isLoading && (
          <div className="flex items-center text-blue-600">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading rates...</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Currency</label>
            <select 
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              placeholder="Enter amount"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
            <input 
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              placeholder="Enter commission percentage"
              step="0.01"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Currency</label>
            <select 
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleCalculate}
            disabled={isLoading || !rates}
            className={`w-full flex items-center justify-center py-2 px-4 rounded-lg text-white transition-colors ${
              isLoading || !rates ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {!rates ? 'Loading Rates...' : 'Calculate'}
          </button>
          
          {calculatedAmount ? (
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Calculated Amount:</span>
                <span className="font-bold text-gray-800">{calculatedAmount} {toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit:</span>
                <span className="font-bold text-green-600">{profit} {toCurrency}</span>
              </div>
              <button 
                onClick={handleAddToSale}
                disabled={isLoading}
                className={`w-full mt-4 flex items-center justify-center py-2 px-4 rounded-lg text-white transition-colors ${
                  isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Add to Sale'
                )}
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center text-gray-500">
              Enter values and click Calculate to see the result
            </div>
          )}
        </div>
      </div>
      
      {rates && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Current Exchange Rates (Base: CAD)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(rates).map(([currency, rate]) => (
              <div key={currency} className="bg-gray-50 p-2 rounded text-center">
                <span className="font-medium">{currency}:</span> {(1/rate).toFixed(4)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Inventory Management Component
const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [newStock, setNewStock] = useState({ currency: 'USD', amount: '', buyRate: '' });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingStock, setIsAddingStock] = useState<boolean>(false);
  
  // Fetch inventory data on component mount
  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Import the inventory service dynamically to avoid circular dependencies
        const { default: mockInventoryService } = await import('./services/mockInventoryService');
        
        const inventoryData = await mockInventoryService.getInventory();
        setInventory(inventoryData);
      } catch (err) {
        setError('Failed to fetch inventory data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInventory();
  }, []);
  
  // Set up WebSocket for real-time inventory updates
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        // Import the WebSocket service dynamically
        const { default: mockWebSocketService } = await import('./services/mockWebSocketService');
        
        // Connect to WebSocket
        await mockWebSocketService.connect();
        
        // Subscribe to inventory updates
        const unsubscribe = mockWebSocketService.subscribe((event) => {
          if (event.type === 'inventory_update') {
            // Refresh inventory data when an update is received
            const fetchInventory = async () => {
              try {
                const { default: mockInventoryService } = await import('./services/mockInventoryService');
                const inventoryData = await mockInventoryService.getInventory();
                setInventory(inventoryData);
              } catch (err) {
                console.error('Failed to refresh inventory:', err);
              }
            };
            
            fetchInventory();
          }
        });
        
        // Clean up WebSocket connection on component unmount
        return () => {
          unsubscribe();
          mockWebSocketService.disconnect();
        };
      } catch (err) {
        console.error('Failed to set up WebSocket:', err);
      }
    };
    
    setupWebSocket();
  }, []);
  
  const handleAddStock = async () => {
    const amount = parseFloat(newStock.amount);
    const buyRate = parseFloat(newStock.buyRate);
    
    if (isNaN(amount) || isNaN(buyRate)) {
      setError('Please enter valid numbers');
      return;
    }
    
    setIsAddingStock(true);
    setError(null);
    
    try {
      // Import the inventory service dynamically
      const { default: mockInventoryService } = await import('./services/mockInventoryService');
      
      // Add stock to inventory
      await mockInventoryService.addStock({
        currency: newStock.currency,
        amount,
        buyRate
      });
      
      // Reset form
      setNewStock({ currency: 'USD', amount: '', buyRate: '' });
      
      // Refresh inventory data
      const inventoryData = await mockInventoryService.getInventory();
      setInventory(inventoryData);
    } catch (err) {
      setError('Failed to add stock');
      console.error(err);
    } finally {
      setIsAddingStock(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Inventory Management</h2>
        {isLoading && (
          <div className="flex items-center text-blue-600">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Refreshing...</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Current Inventory</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {isLoading && inventory.length === 0 ? (
            <div className="flex justify-center items-center p-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No inventory data available
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.buyRate.toFixed(4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.sellRate.toFixed(4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.lastUpdated}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.amount < 1000 ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Low
                        </span>
                      ) : item.amount < 3000 ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Medium
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Good
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Stock</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select 
              value={newStock.currency}
              onChange={(e) => setNewStock({...newStock, currency: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isAddingStock}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="AUD">AUD</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input 
              type="number"
              value={newStock.amount}
              onChange={(e) => setNewStock({...newStock, amount: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount"
              disabled={isAddingStock}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buy Rate</label>
            <input 
              type="number"
              value={newStock.buyRate}
              onChange={(e) => setNewStock({...newStock, buyRate: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter buy rate"
              step="0.0001"
              disabled={isAddingStock}
            />
          </div>
        </div>
        <button 
          onClick={handleAddStock}
          disabled={isAddingStock}
          className={`mt-4 flex items-center justify-center py-2 px-4 rounded-lg text-white transition-colors ${
            isAddingStock ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isAddingStock ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : (
            'Add Stock'
          )}
        </button>
      </div>
    </div>
  );
};

// Transaction History Component
const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch transaction data on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Import the transaction service dynamically to avoid circular dependencies
        const { default: mockTransactionService } = await import('./services/mockTransactionService');
        
        const transactionData = await mockTransactionService.getTransactions();
        setTransactions(transactionData);
      } catch (err) {
        setError('Failed to fetch transaction data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);
  
  // Set up WebSocket for real-time transaction updates
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        // Import the WebSocket service dynamically
        const { default: mockWebSocketService } = await import('./services/mockWebSocketService');
        
        // Connect to WebSocket
        await mockWebSocketService.connect();
        
        // Subscribe to transaction updates
        const unsubscribe = mockWebSocketService.subscribe((event) => {
          if (event.type === 'transaction_created') {
            // Refresh transaction data when a new transaction is created
            const fetchTransactions = async () => {
              try {
                const { default: mockTransactionService } = await import('./services/mockTransactionService');
                const transactionData = await mockTransactionService.getTransactions();
                setTransactions(transactionData);
              } catch (err) {
                console.error('Failed to refresh transactions:', err);
              }
            };
            
            fetchTransactions();
          }
        });
        
        // Clean up WebSocket connection on component unmount
        return () => {
          unsubscribe();
          mockWebSocketService.disconnect();
        };
      } catch (err) {
        console.error('Failed to set up WebSocket:', err);
      }
    };
    
    setupWebSocket();
  }, []);
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
        {isLoading && (
          <div className="flex items-center text-blue-600">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading transactions...</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading && transactions.length === 0 ? (
          <div className="flex justify-center items-center p-12">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <p className="text-lg font-medium">No transactions found</p>
            <p className="mt-2">Use the Smart Calculator to create new transactions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Converted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{tx.fromCurrency}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{tx.toCurrency}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tx.fromAmount.toLocaleString()} {tx.fromCurrency}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tx.toAmount.toLocaleString()} {tx.toCurrency}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tx.commission.toFixed(2)} {tx.toCurrency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">{tx.profit.toFixed(2)} {tx.toCurrency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {transactions.length > 0 && (
        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <div>
            Showing {transactions.length} transactions
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Export CSV
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics Dashboard Component
const AnalyticsDashboard: React.FC = () => {
  const [dailyPerformance, setDailyPerformance] = useState<any[]>([]);
  const [currencyPerformance, setCurrencyPerformance] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [profitAnalysis, setProfitAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate totals from currency performance
  const totalTransactions = useMemo(() => 
    currencyPerformance.reduce((sum, curr) => sum + curr.transactions, 0), 
    [currencyPerformance]
  );
  
  const totalVolume = useMemo(() => 
    currencyPerformance.reduce((sum, curr) => sum + curr.volume, 0), 
    [currencyPerformance]
  );
  
  const totalProfit = useMemo(() => 
    currencyPerformance.reduce((sum, curr) => sum + curr.profit, 0), 
    [currencyPerformance]
  );
  
  // Fetch analytics data on component mount
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Import the analytics service dynamically to avoid circular dependencies
        const { default: mockAnalyticsService } = await import('./services/mockAnalyticsService');
        
        // Fetch all analytics data in parallel
        const [dailyData, currencyData, insightsData, profitData] = await Promise.all([
          mockAnalyticsService.getDailyPerformance(),
          mockAnalyticsService.getCurrencyPerformance(),
          mockAnalyticsService.getBusinessInsights(),
          mockAnalyticsService.getProfitAnalysis()
        ]);
        
        // Transform daily performance data for display
        const formattedDailyData = dailyData.map(day => ({
          name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
          value: day.volume
        }));
        
        setDailyPerformance(formattedDailyData);
        setCurrencyPerformance(currencyData);
        setInsights(insightsData);
        setProfitAnalysis(profitData);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);
  
  // Set up WebSocket for real-time analytics updates
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        // Import the WebSocket service dynamically
        const { default: mockWebSocketService } = await import('./services/mockWebSocketService');
        
        // Connect to WebSocket
        await mockWebSocketService.connect();
        
        // Subscribe to transaction and inventory updates
        const unsubscribe = mockWebSocketService.subscribe((event) => {
          if (event.type === 'transaction_created' || event.type === 'inventory_update') {
            // Refresh analytics data when transactions or inventory change
            const refreshAnalytics = async () => {
              try {
                const { default: mockAnalyticsService } = await import('./services/mockAnalyticsService');
                
                // Only refresh the affected data
                if (event.type === 'transaction_created') {
                  const [dailyData, currencyData, profitData] = await Promise.all([
                    mockAnalyticsService.getDailyPerformance(),
                    mockAnalyticsService.getCurrencyPerformance(),
                    mockAnalyticsService.getProfitAnalysis()
                  ]);
                  
                  // Transform daily performance data for display
                  const formattedDailyData = dailyData.map(day => ({
                    name: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
                    value: day.volume
                  }));
                  
                  setDailyPerformance(formattedDailyData);
                  setCurrencyPerformance(currencyData);
                  setProfitAnalysis(profitData);
                }
                
                // Refresh insights periodically
                const insightsData = await mockAnalyticsService.getBusinessInsights();
                setInsights(insightsData);
              } catch (err) {
                console.error('Failed to refresh analytics:', err);
              }
            };
            
            refreshAnalytics();
          }
        });
        
        // Clean up WebSocket connection on component unmount
        return () => {
          unsubscribe();
          mockWebSocketService.disconnect();
        };
      } catch (err) {
        console.error('Failed to set up WebSocket:', err);
      }
    };
    
    setupWebSocket();
  }, []);
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Business Intelligence</h2>
        {isLoading && (
          <div className="flex items-center text-blue-600">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading analytics...</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {isLoading && currencyPerformance.length === 0 ? (
        <div className="flex justify-center items-center p-16">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-100 transition-all hover:shadow-md">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Total Transactions</h3>
              <p className="text-2xl font-bold text-blue-900">{totalTransactions}</p>
              <p className="text-xs text-blue-700 mt-1">Last 7 days</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-100 transition-all hover:shadow-md">
              <h3 className="text-sm font-medium text-green-800 mb-1">Total Volume</h3>
              <p className="text-2xl font-bold text-green-900">${totalVolume.toLocaleString()}</p>
              <p className="text-xs text-green-700 mt-1">Last 7 days</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-100 transition-all hover:shadow-md">
              <h3 className="text-sm font-medium text-purple-800 mb-1">Total Profit</h3>
              <p className="text-2xl font-bold text-purple-900">${totalProfit.toLocaleString()}</p>
              <p className="text-xs text-purple-700 mt-1">Last 7 days</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Currency Performance</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {currencyPerformance.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  No currency performance data available
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currencyPerformance.map(item => (
                        <tr key={item.currency} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{item.currency}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.transactions}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${item.volume.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">${item.profit.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${(item.volume / totalVolume) * 100}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm text-gray-600">
                                {((item.volume / totalVolume) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Insights & Recommendations</h3>
            
            {insights.length === 0 ? (
              <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">
                No insights available at this time
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, index) => {
                  let bgColor = 'bg-blue-50';
                  let borderColor = 'border-blue-400';
                  let textColor = 'text-blue-800';
                  let textBodyColor = 'text-blue-700';
                  let icon = (
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  );
                  
                  if (insight.type === 'warning') {
                    bgColor = 'bg-yellow-50';
                    borderColor = 'border-yellow-400';
                    textColor = 'text-yellow-800';
                    textBodyColor = 'text-yellow-700';
                    icon = (
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    );
                  } else if (insight.type === 'opportunity') {
                    bgColor = 'bg-green-50';
                    borderColor = 'border-green-400';
                    textColor = 'text-green-800';
                    textBodyColor = 'text-green-700';
                    icon = (
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    );
                  }
                  
                  return (
                    <div key={index} className={`${bgColor} border-l-4 ${borderColor} p-4 rounded shadow-sm transition-all hover:shadow-md`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {icon}
                        </div>
                        <div className="ml-3">
                          <h3 className={`text-sm font-medium ${textColor}`}>{insight.title}</h3>
                          <div className={`mt-2 text-sm ${textBodyColor}`}>
                            <p>{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {profitAnalysis && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Profit Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Total Profit</h4>
                  <p className="text-xl font-bold text-gray-800 mt-1">${profitAnalysis.totalProfit.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Avg. Profit/Transaction</h4>
                  <p className="text-xl font-bold text-gray-800 mt-1">${profitAnalysis.averageProfitPerTransaction.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Profit Trend</h4>
                  <p className="text-xl font-bold text-green-600 mt-1">+{profitAnalysis.profitTrend}%</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Top Profit Currency</h4>
                  <p className="text-xl font-bold text-gray-800 mt-1">{profitAnalysis.topProfitCurrency}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function StoreOwnerDashboard(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case 'calculator':
        return <SmartCalculator />;
      case 'inventory':
        return <InventoryManagement />;
      case 'transactions':
        return <TransactionHistory />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <SmartCalculator />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-white shadow-md text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-lg transform ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } transition-transform duration-300 ease-in-out lg:static lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex justify-center mb-2">
              <img src={logoBlack} alt="Company Logo" className="h-16 w-auto rounded-xl" />
            </div>
            <div className="flex justify-center">
              <img src={saadatBlack} alt="Saadat Name" className="h-10 w-auto" />
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-gray-800">Owner Dashboard</h2>
              <LiveClock />
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <NavItem 
              icon={<Calculator className="h-5 w-5" />} 
              text="Smart Calculator" 
              active={activeTab === 'calculator'} 
              onClick={() => setActiveTab('calculator')} 
            />
            <NavItem 
              icon={<Package className="h-5 w-5" />} 
              text="Inventory Management" 
              active={activeTab === 'inventory'} 
              onClick={() => setActiveTab('inventory')} 
            />
            <NavItem 
              icon={<DollarSign className="h-5 w-5" />} 
              text="Transaction History" 
              active={activeTab === 'transactions'} 
              onClick={() => setActiveTab('transactions')} 
            />
            <NavItem 
              icon={<BarChart2 className="h-5 w-5" />} 
              text="Analytics" 
              active={activeTab === 'analytics'} 
              onClick={() => setActiveTab('analytics')} 
            />
          </nav>
          
          <div className="p-4 border-t">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:ml-64 p-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{
              activeTab === 'calculator' ? 'Smart Calculator' :
              activeTab === 'inventory' ? 'Inventory Management' :
              activeTab === 'transactions' ? 'Transaction History' :
              'Business Analytics'
            }</h1>
            <p className="text-gray-600">
              {
                activeTab === 'calculator' ? 'Calculate exchange rates with commission' :
                activeTab === 'inventory' ? 'Manage your currency inventory' :
                activeTab === 'transactions' ? 'View and manage transaction history' :
                'View business performance metrics'
              }
            </p>
          </header>
          
          <main>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}