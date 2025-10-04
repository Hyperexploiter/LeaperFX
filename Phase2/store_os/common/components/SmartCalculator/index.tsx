import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, User, Plus, Wifi, WifiOff } from 'lucide-react';
import { fetchLatestRates } from '../../services/exchangeRateService';
import webSocketService from '../../services/webSocketService';
import { Modal, Toast } from '../Modal';
import PaymentProcessingModal from '../../tabs/Transactions/components/PaymentProcessingModal';
import type { PaymentMethod } from '../../features/payments/types';

// SmartCalculator Component
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
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  const [lastRateUpdate, setLastRateUpdate] = useState<string | null>(null);
  
  // Customer-related state
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);
  const [newCustomerData, setNewCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    occupation: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Canada',
    idType: '',
    idNumber: ''
  });
  
  // Modal and Toast states
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [pendingTransactionData, setPendingTransactionData] = useState<any>(null);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'warning' | 'info', message: string, visible: boolean}>({
    type: 'success',
    message: '',
    visible: false
  });
  
  // Helper functions for toast notifications
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setToast({ type, message, visible: true });
  };
  
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };
  
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
  
  // Load customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const { default: customerService } = await import('../../services/customerService');
        const customerData = await customerService.getAllCustomers();
        setCustomers(customerData || []);
      } catch (err) {
        console.error('Error loading customers:', err);
        setCustomers([]);
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    
    loadCustomers();
  }, []);

  // Initialize WebSocket connection and fetch initial rates
  useEffect(() => {
    let rateUpdateUnsubscribe: (() => void) | null = null;

    const initializeRatesAndWebSocket = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Initialize WebSocket connection
        const connected = await webSocketService.connect();
        setIsWebSocketConnected(connected);

        // Subscribe to real-time rate updates
        rateUpdateUnsubscribe = webSocketService.subscribeToRateUpdates((rateData) => {
          console.log('🔄 Received real-time rate update:', rateData);

          if (rateData.currency && (rateData.rate || (rateData.buyRate && rateData.sellRate))) {
            const rate = rateData.rate || (parseFloat(rateData.buyRate) + parseFloat(rateData.sellRate)) / 2;

            setRates(prevRates => ({
              ...prevRates,
              [rateData.currency]: rate
            }));

            setLastRateUpdate(new Date().toLocaleTimeString());
            showToast('info', `Rate updated: ${rateData.currency} = ${rate.toFixed(4)}`);
          }
        });

        // Fetch initial rates from unified API
        const baseCurrency = 'CAD';
        const latestRates = await fetchLatestRates(baseCurrency);

        if (latestRates) {
          setRates(latestRates);
          console.log('✅ Initial rates loaded from unified API');
        } else {
          setError('Failed to fetch initial exchange rates');
        }
      } catch (err) {
        setError('An error occurred while initializing rates');
        console.error('Rate initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRatesAndWebSocket();

    // Cleanup function
    return () => {
      if (rateUpdateUnsubscribe) {
        rateUpdateUnsubscribe();
      }
      // Don't disconnect WebSocket here as other components might be using it
    };
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

  const handleAddCustomer = async () => {
    if (!newCustomerData.firstName.trim() || !newCustomerData.lastName.trim()) {
      showToast('error', 'First name and last name are required');
      return;
    }

    try {
      const { default: customerService } = await import('../../services/customerService');
      const newCustomer = await customerService.createCustomer(newCustomerData);
      
      if (newCustomer) {
        setCustomers(prev => [...prev, newCustomer]);
        setSelectedCustomer(newCustomer.id);
        setNewCustomerData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          occupation: '',
          address: '',
          city: '',
          postalCode: '',
          country: 'Canada',
          idType: '',
          idNumber: ''
        });
        setShowAddCustomerModal(false);
        showToast('success', 'Customer added successfully');
      }
    } catch (err) {
      console.error('Error adding customer:', err);
      showToast('error', 'Failed to add customer');
    }
  };
  
  const handleAddToSale = async () => {
    if (!calculatedAmount || !profit) {
      showToast('error', 'Please calculate the exchange rate first');
      return;
    }

    const fromAmountValue = parseFloat(amount);
    const toAmountValue = parseFloat(calculatedAmount);
    const commissionValue = parseFloat(profit);

    // Store transaction data for payment processing
    setPendingTransactionData({
      fromCurrency,
      toCurrency,
      fromAmount: fromAmountValue,
      toAmount: toAmountValue,
      commission: commissionValue,
      customerId: selectedCustomer || null
    });

    // Show payment modal
    setShowPaymentModal(true);
  };

  const handlePaymentCompleted = async (paymentData: any) => {
    if (!pendingTransactionData) return;

    setIsLoading(true);
    setError(null);

    try {
      // Import the transaction service dynamically to avoid circular dependencies
      const { default: transactionService } = await import('../../services/transactionService');

      const { fromAmount, toAmount, commission } = pendingTransactionData;

      // Check if transaction requires FINTRAC compliance
      const requiresLCTR = toAmount >= 10000;
      const requiresEnhancedRecords = toAmount >= 3000;

      // Calculate LCTR deadline (15 days from now)
      const now = new Date();
      const lctrDeadline = new Date(now);
      lctrDeadline.setDate(lctrDeadline.getDate() + 15);

      // Create transaction with payment data and FINTRAC compliance fields
      const transaction = await transactionService.createTransaction({
        ...pendingTransactionData,

        // Payment Information
        paymentMethod: paymentData.paymentMethod,
        paymentResult: paymentData.paymentResult,
        paymentReferenceId: paymentData.paymentReferenceId,
        paymentDetails: paymentData.paymentDetails,

        // FINTRAC Compliance Fields
        status: requiresLCTR || requiresEnhancedRecords ? 'locked' : 'completed',
        requiresLCTR,
        requiresEnhancedRecords,
        lctrDeadline: lctrDeadline.toISOString().split('T')[0],
        daysUntilDeadline: 15
      });

      // Reset form
      setCalculatedAmount('');
      setProfit('');
      setPendingTransactionData(null);

      // Show success message with modal and toast
      setShowSuccessModal(true);

      // If transaction requires compliance, show additional information
      if (requiresLCTR || requiresEnhancedRecords) {
        showToast('warning', 'This transaction requires FINTRAC compliance. Please collect customer information.');

        // In a real implementation, we would use a global state management solution
        // to communicate between components. For now, we'll use localStorage as a simple solution.
        localStorage.setItem('pendingComplianceTransaction', JSON.stringify({
          id: transaction.id,
          amount: toAmount,
          requiresLCTR,
          timestamp: new Date().toISOString()
        }));

        // Dispatch a custom event that the StoreOwnerDashboard can listen for
        const event = new CustomEvent('fintracComplianceRequired', {
          detail: {
            transactionId: transaction.id,
            requiresLCTR
          }
        });
        window.dispatchEvent(event);
      } else {
        const paymentMethodName = paymentData.paymentMethod === 'cash' ? 'cash' :
                                paymentData.paymentMethod === 'stripe_terminal' ? 'card' :
                                paymentData.paymentMethod === 'cryptocurrency' ? 'crypto' : 'payment';
        showToast('success', `Transaction completed successfully with ${paymentMethodName} payment!`);
      }
    } catch (err) {
      setError('Failed to add transaction');
      setShowErrorModal(true);
      showToast('error', 'Failed to add transaction');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Smart Calculator</h2>
        <div className="flex items-center space-x-4">
          {/* WebSocket Connection Status */}
          <div className="flex items-center space-x-2">
            {isWebSocketConnected ? (
              <Wifi className="h-4 w-4 text-green-500" title="Connected to real-time updates" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" title="No real-time connection" />
            )}
            <span className={`text-xs ${isWebSocketConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isWebSocketConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading rates...</span>
            </div>
          )}

          {/* Last update timestamp */}
          {lastRateUpdate && (
            <div className="text-xs text-gray-500">
              Last update: {lastRateUpdate}
            </div>
          )}
        </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <div className="flex gap-2">
              <select 
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoadingCustomers}
              >
                <option value="">Select a customer (optional)</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName} {customer.email ? `(${customer.email})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                title="Add New Customer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {isLoadingCustomers && (
              <p className="text-sm text-gray-500 mt-1">Loading customers...</p>
            )}
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
                  'Complete Sale'
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

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Transaction Added Successfully"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Your exchange transaction has been successfully added to the system.
          </p>
          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Continue
          </button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Transaction Failed"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-600 mb-6">
            There was an error processing your transaction. Please try again.
          </p>
          <button
            onClick={() => setShowErrorModal(false)}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Add Customer Modal - FINTRAC Compliant Form */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add New Customer - FINTRAC Compliance"
        size="2xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAddCustomer(); }} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-700">
              <strong>FINTRAC Compliance:</strong> All fields marked with * are required for transactions ≥$3,000 CAD.
              Additional fields may be required for transactions ≥$10,000 CAD.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={newCustomerData.firstName}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={newCustomerData.lastName}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input
                type="date"
                value={newCustomerData.dateOfBirth}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
              <input
                type="text"
                value={newCustomerData.occupation}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, occupation: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer occupation"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={newCustomerData.address}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={newCustomerData.city}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
              <input
                type="text"
                value={newCustomerData.postalCode}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, postalCode: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="A1A 1A1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                type="text"
                value={newCustomerData.country}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type *</label>
              <select
                value={newCustomerData.idType}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, idType: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select ID Type</option>
                <option value="drivers_license">Driver's License</option>
                <option value="passport">Passport</option>
                <option value="provincial_id">Provincial ID Card</option>
                <option value="other_government">Other Government ID</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
              <input
                type="text"
                value={newCustomerData.idNumber}
                onChange={(e) => setNewCustomerData(prev => ({ ...prev, idNumber: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter identification number"
                required
              />
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Important:</strong> This customer information will be used for FINTRAC compliance reporting.
                  Ensure all details are accurate and complete.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowAddCustomerModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Add Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingTransactionData(null);
        }}
        amount={pendingTransactionData?.toAmount || 0}
        currency={pendingTransactionData?.toCurrency || 'CAD'}
        onPaymentCompleted={handlePaymentCompleted}
      />

      {/* Toast Notification */}
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
};

export default SmartCalculator;