import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Shield, TrendingUp, Calculator, Users, Star, ChevronDown, Menu, X, ArrowRightLeft, DollarSign, Globe, Award, CheckCircle } from 'lucide-react';
import websiteService from '../dashboard/demo/src/services/websiteService';

const CurrencyExchangeWebsite = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFromCurrency, setSelectedFromCurrency] = useState('USD');
  const [selectedToCurrency, setSelectedToCurrency] = useState('CAD');
  const [amount, setAmount] = useState('1000');
  const [convertedAmount, setConvertedAmount] = useState('1350');
  const [showRateAlert, setShowRateAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({
    fromCurrency: 'USD',
    toCurrency: 'CAD',
    desiredRate: '',
    amount: '',
    email: '',
    phone: ''
  });
  const [showRateLock, setShowRateLock] = useState(false);
  const [lockCalculation, setLockCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute for live feel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Track website visitor and page views
  useEffect(() => {
    // Track visitor
    websiteService.trackVisitor();
    
    // Track page view
    websiteService.trackPageView();
    
    // Log for development
    console.log('Website visitor and page view tracked');
  }, []);

  // Add notification system
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Smooth scroll navigation
  const scrollToSection = (sectionId) => {
    setIsMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Advanced Rate Lock Algorithm - Optimal_Lock_Rate Function
  const calculateOptimalLockRate = (params) => {
    const {
      customerTargetRate,
      currentMarketRate,
      storeCostBasis = currentMarketRate * 0.985, // Assume 1.5% spread
      timeUntilExchange = 7, // days
      marketVolatility = 0.02, // 2% daily volatility
      minimumProfitMargin = 0.015, // 1.5% minimum profit
      availableInventory = 50000, // USD in stock
      demandForecast = 1.1 // 10% above normal
    } = params;

    // 1. Time premium calculation (risk increases with time)
    const timePremium = Math.min(timeUntilExchange * 0.0008, 0.01); // Max 1% time premium

    // 2. Volatility premium (higher volatility = higher premium)
    const volatilityPremium = marketVolatility * 0.3; // 30% of daily volatility

    // 3. Inventory adjustment (scarcity pricing)
    const inventoryFactor = availableInventory < 25000 ? 0.003 :
                           availableInventory < 50000 ? 0.002 : 0.001;

    // 4. Demand surge adjustment
    const demandFactor = demandForecast > 1.2 ? 0.005 :
                        demandForecast > 1.1 ? 0.003 : 0.001;

    // 5. Customer favor calculation (how much better than market)
    const customerBenefit = Math.max(0, customerTargetRate - currentMarketRate) / currentMarketRate;
    const customerFavorPremium = customerBenefit * 0.5; // 50% of the benefit they get

    // Calculate base rate (weighted toward customer target if reasonable)
    const rateGap = Math.abs(customerTargetRate - currentMarketRate) / currentMarketRate;
    const baseRate = rateGap < 0.03 ? // If within 3% of market
      (currentMarketRate * 0.7 + customerTargetRate * 0.3) : // Weight toward market
      currentMarketRate; // Use market rate if customer target is unrealistic

    // Total premium calculation
    const totalPremium = timePremium + volatilityPremium + inventoryFactor +
                        demandFactor + customerFavorPremium;

    // Ensure minimum profit above cost basis
    const minAcceptableRate = storeCostBasis * (1 + minimumProfitMargin);

    // Calculate optimal lock rate
    const proposedRate = baseRate * (1 + totalPremium);
    const optimalRate = Math.max(proposedRate, minAcceptableRate);

    // Cap at reasonable maximum (current market + 4%)
    const maxReasonableRate = currentMarketRate * 1.04;
    const finalRate = Math.min(optimalRate, maxReasonableRate);

    // Calculate value proposition for customer
    const potentialSavings = customerTargetRate > finalRate ?
      (customerTargetRate - finalRate) / customerTargetRate : 0;

    return {
      optimalRate: parseFloat(finalRate.toFixed(4)),
      breakdown: {
        baseRate: parseFloat(baseRate.toFixed(4)),
        timePremium: parseFloat((timePremium * 100).toFixed(3)),
        volatilityPremium: parseFloat((volatilityPremium * 100).toFixed(3)),
        inventoryFactor: parseFloat((inventoryFactor * 100).toFixed(3)),
        demandFactor: parseFloat((demandFactor * 100).toFixed(3)),
        customerFavorPremium: parseFloat((customerFavorPremium * 100).toFixed(3)),
        totalPremium: parseFloat((totalPremium * 100).toFixed(3)),
        minProfit: parseFloat(((finalRate - storeCostBasis) / storeCostBasis * 100).toFixed(2)),
        potentialCustomerSavings: parseFloat((potentialSavings * 100).toFixed(2))
      },
      businessMetrics: {
        profitPerUnit: parseFloat((finalRate - storeCostBasis).toFixed(4)),
        riskScore: Math.min(10, timeUntilExchange * marketVolatility * 100).toFixed(1),
        inventoryImpact: availableInventory,
        recommendedAction: finalRate > currentMarketRate * 1.02 ? 'OFFER' : 'WAIT'
      }
    };
  };

  // Handle Rate Lock Calculation with loading state and error handling
  const handleCalculateRateLock = async () => {
    try {
      setIsCalculating(true);

      // Track calculator use
      websiteService.trackCalculatorUse();

      // Simulate API calculation time for realism
      await new Promise(resolve => setTimeout(resolve, 1500));

      const currentRate = exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] || 1.35;
      const targetRate = parseFloat(alertForm.desiredRate) || currentRate * 1.02;

      const calculation = calculateOptimalLockRate({
        customerTargetRate: targetRate,
        currentMarketRate: currentRate,
        timeUntilExchange: 7,
        marketVolatility: 0.015 + (Math.random() * 0.02), // 1.5-3.5% volatility
        availableInventory: Math.random() * 75000 + 25000,
        demandForecast: 1 + (Math.random() * 0.4)
      });

      setLockCalculation(calculation);
      setShowRateLock(true);
      addNotification('Rate lock calculation complete! Review your personalized offer.', 'success');
    } catch (error) {
      console.error('Error calculating rate lock:', error);
      addNotification('Failed to calculate rate lock. Please try again.', 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // Enhanced form submission with validation
  const handleSubmitAlert = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!alertForm.email) {
      addNotification('Email address is required for rate alerts.', 'error');
      return;
    }

    if (!alertForm.desiredRate) {
      addNotification('Please enter your desired rate.', 'error');
      return;
    }

    try {
      // Set loading state
      const loadingNotificationId = Date.now();
      setNotifications(prev => [...prev, { 
        id: loadingNotificationId, 
        message: 'Setting up your rate alert...', 
        type: 'info' 
      }]);

      // Create rate alert using websiteService
      await websiteService.createRateAlert({
        fromCurrency: alertForm.fromCurrency,
        toCurrency: alertForm.toCurrency,
        targetRate: parseFloat(alertForm.desiredRate),
        amount: alertForm.amount ? parseFloat(alertForm.amount) : undefined,
        customerEmail: alertForm.email,
        customerPhone: alertForm.phone || undefined,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      });

      // Remove loading notification
      setNotifications(prev => prev.filter(n => n.id !== loadingNotificationId));

      // Show success notification
      addNotification(`🎉 Rate alert set! We'll notify ${alertForm.email} when ${alertForm.fromCurrency}/${alertForm.toCurrency} hits ${alertForm.desiredRate}`, 'success');
      
      // Close modal and reset form
      setShowRateAlert(false);
      setAlertForm({
        fromCurrency: 'USD',
        toCurrency: 'CAD',
        desiredRate: '',
        amount: '',
        email: '',
        phone: ''
      });
    } catch (error) {
      console.error('Error creating rate alert:', error);
      addNotification('Failed to set rate alert. Please try again.', 'error');
    }
  };

  // Handle rate lock acceptance
  const handleLockRate = async () => {
    try {
      // Set loading state
      const loadingNotificationId = Date.now();
      setNotifications(prev => [...prev, { 
        id: loadingNotificationId, 
        message: 'Processing your rate lock...', 
        type: 'info' 
      }]);

      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create rate lock using websiteService
      await websiteService.createRateLock({
        fromCurrency: alertForm.fromCurrency,
        toCurrency: alertForm.toCurrency,
        amount: parseFloat(alertForm.amount || '1000'),
        rate: lockCalculation.optimalRate,
        customerEmail: alertForm.email,
        customerPhone: alertForm.phone || undefined,
        expiresAt: expiresAt.toISOString()
      });

      // Remove loading notification
      setNotifications(prev => prev.filter(n => n.id !== loadingNotificationId));

      // Show success notification
      addNotification('🔒 Rate locked successfully! Please visit our store within 7 days to complete your exchange.', 'success');
      
      // Track website activity
      websiteService.trackCalculatorUse();
      
      // Close modal
      setShowRateLock(false);
    } catch (error) {
      console.error('Error creating rate lock:', error);
      addNotification('Failed to lock rate. Please try again.', 'error');
    }
  };

  // Contact form handler
  const handleContactForm = (type) => {
    if (type === 'call') {
      addNotification('📞 Calling (514) 555-0123...', 'info');
    } else if (type === 'directions') {
      addNotification('🗺️ Opening directions to 123 Sainte-Catherine Street West...', 'info');
    } else if (type === 'visit') {
      addNotification('📍 We\'re open today until 6:00 PM. See you soon!', 'success');
    }
  };

  // Sample exchange rates (would be real-time in production)
  const exchangeRates = {
    USD: { CAD: 1.35, EUR: 0.85, GBP: 0.73, JPY: 110 },
    EUR: { CAD: 1.58, USD: 1.18, GBP: 0.86, JPY: 130 },
    GBP: { CAD: 1.84, USD: 1.37, EUR: 1.16, JPY: 151 },
    CAD: { USD: 0.74, EUR: 0.63, GBP: 0.54, JPY: 81 },
    JPY: { CAD: 0.012, USD: 0.009, EUR: 0.008, GBP: 0.007 }
  };

  const currencies = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' }
  ];

  const handleCalculate = () => {
    const rate = exchangeRates[selectedFromCurrency]?.[selectedToCurrency] || 1;
    const result = (parseFloat(amount) * rate).toFixed(2);
    setConvertedAmount(result);
    
    // Track calculator use (debounced to avoid excessive tracking)
    // We use a simple approach here - only track if amount is valid and not empty
    if (parseFloat(amount) > 0) {
      // Use a flag in sessionStorage to limit tracking to once per session
      const hasTrackedCalculator = sessionStorage.getItem('hasTrackedCalculator');
      if (!hasTrackedCalculator) {
        websiteService.trackCalculatorUse();
        sessionStorage.setItem('hasTrackedCalculator', 'true');
        console.log('Calculator use tracked');
      }
    }
  };

  useEffect(() => {
    handleCalculate();
  }, [selectedFromCurrency, selectedToCurrency, amount]);

  const swapCurrencies = () => {
    setSelectedFromCurrency(selectedToCurrency);
    setSelectedToCurrency(selectedFromCurrency);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 max-w-sm ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'info' ? 'bg-blue-500 text-white' :
              'bg-gray-500 text-white'
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        ))}
      </div>

      {/* Loading Overlay for Rate Lock Calculation */}
      {isCalculating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculating Optimal Rate...</h3>
            <p className="text-gray-600">Our algorithm is analyzing market conditions, inventory levels, and risk factors to find your best rate.</p>
          </div>
        </div>
      )}

      {/* Rate Lock Results Modal */}
      {showRateLock && lockCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">🔒 Rate Lock Available!</h3>
                <p className="text-gray-600">Advanced algorithmic pricing just for you</p>
              </div>
              <button
                onClick={() => setShowRateLock(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Main Offer */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-green-200">
              <div className="text-center">
                <h4 className="text-3xl font-bold text-gray-900 mb-2">
                  Lock Rate: 1 {alertForm.fromCurrency} = {lockCalculation.optimalRate} {alertForm.toCurrency}
                </h4>
                <p className="text-lg text-gray-600 mb-4">
                  Valid for 7 days • Amount: {alertForm.amount || '1,000'} {alertForm.fromCurrency}
                </p>

                {lockCalculation.breakdown.potentialCustomerSavings > 0 && (
                  <div className="bg-green-100 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-semibold">
                      💰 You save {lockCalculation.breakdown.potentialCustomerSavings}% vs your target rate!
                    </p>
                    <p className="text-green-700 text-sm">
                      That's ${((parseFloat(alertForm.amount) || 1000) * (parseFloat(alertForm.desiredRate) - lockCalculation.optimalRate)).toFixed(2)} in your pocket
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Algorithm Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">📊 Pricing Factors</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Rate:</span>
                    <span className="font-medium">{lockCalculation.breakdown.baseRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Premium:</span>
                    <span className="font-medium">+{lockCalculation.breakdown.timePremium}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volatility Premium:</span>
                    <span className="font-medium">+{lockCalculation.breakdown.volatilityPremium}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inventory Factor:</span>
                    <span className="font-medium">+{lockCalculation.breakdown.inventoryFactor}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demand Adjustment:</span>
                    <span className="font-medium">+{lockCalculation.breakdown.demandFactor}%</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Premium:</span>
                    <span className="text-blue-600">+{lockCalculation.breakdown.totalPremium}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">📈 Business Intelligence</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Risk Score:</span>
                    <span className={`font-medium ${lockCalculation.businessMetrics.riskScore < 5 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {lockCalculation.businessMetrics.riskScore}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Our Profit Margin:</span>
                    <span className="font-medium text-green-600">{lockCalculation.breakdown.minProfit}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inventory Available:</span>
                    <span className="font-medium">${lockCalculation.businessMetrics.inventoryImpact.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommendation:</span>
                    <span className={`font-medium ${lockCalculation.businessMetrics.recommendedAction === 'OFFER' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {lockCalculation.businessMetrics.recommendedAction}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h5 className="font-semibold text-gray-900 mb-3">🎯 Rate Comparison</h5>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Current Market</p>
                  <p className="font-bold text-gray-900">{exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Target</p>
                  <p className="font-bold text-blue-600">{alertForm.desiredRate || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Our Lock Rate</p>
                  <p className="font-bold text-green-600">{lockCalculation.optimalRate}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleLockRate}
                className="flex-1 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                🔒 Lock This Rate Now
              </button>
              <button
                onClick={() => setShowRateLock(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Let Me Think
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              * Rate lock requires 50% deposit • Final exchange within 7 days • Subject to inventory availability
            </p>
          </div>
        </div>
      )}

      {/* Rate Alert Modal */}
      {showRateAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">💰 Rate Alert</h3>
                <p className="text-gray-600">Get notified when rates hit your target!</p>
              </div>
              <button
                onClick={() => setShowRateAlert(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Currency Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <select
                    value={alertForm.fromCurrency}
                    onChange={(e) => setAlertForm({...alertForm, fromCurrency: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map(curr => (
                      <option key={curr.code} value={curr.code}>{curr.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <select
                    value={alertForm.toCurrency}
                    onChange={(e) => setAlertForm({...alertForm, toCurrency: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map(curr => (
                      <option key={curr.code} value={curr.code}>{curr.code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rate and Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desired Rate</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={alertForm.desiredRate}
                    onChange={(e) => setAlertForm({...alertForm, desiredRate: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1.3500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={alertForm.amount}
                    onChange={(e) => setAlertForm({...alertForm, amount: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={alertForm.email}
                  onChange={(e) => setAlertForm({...alertForm, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={alertForm.phone}
                  onChange={(e) => setAlertForm({...alertForm, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="(514) 555-0123"
                />
              </div>

              {/* Current vs Desired Rate */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Rate:</span>
                  <span className="font-semibold">1 {alertForm.fromCurrency} = {exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] || 'N/A'} {alertForm.toCurrency}</span>
                </div>
                {alertForm.desiredRate && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Your Target:</span>
                    <span className={`font-semibold ${
                      parseFloat(alertForm.desiredRate) > (exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] || 0) 
                        ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      1 {alertForm.fromCurrency} = {alertForm.desiredRate} {alertForm.toCurrency}
                    </span>
                  </div>
                )}
              </div>

              {/* Fun Message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  🎯 <strong>Smart move!</strong> We'll watch the markets for you and send a notification
                  when rates hit your sweet spot. No more constantly checking rates!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSubmitAlert}
                  disabled={!alertForm.email || !alertForm.desiredRate}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    alertForm.email && alertForm.desiredRate
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  🔔 Set Rate Alert
                </button>

                <button
                  onClick={handleCalculateRateLock}
                  disabled={!alertForm.desiredRate}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    alertForm.desiredRate
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  🔒 Check Rate Lock
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Rate Alert:</strong> Free notifications when market hits your target<br/>
                  <strong>Rate Lock:</strong> Secure your rate now with our advanced algorithm
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Saadat Exchange</h1>
                <p className="text-sm text-gray-600">Trusted Currency Solutions</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection('rates')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Exchange Rates
              </button>
              <button onClick={() => scrollToSection('services')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Services
              </button>
              <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                About Us
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Contact
              </button>
            </nav>

            {/* Contact Info */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={() => handleContactForm('call')}
                className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Phone className="h-4 w-4 mr-1" />
                <span>(514) 555-0123</span>
              </button>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Open: 9AM-6PM</span>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-blue-600"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-4">
                <button onClick={() => scrollToSection('rates')} className="text-gray-700 hover:text-blue-600 font-medium px-4 text-left">
                  Exchange Rates
                </button>
                <button onClick={() => scrollToSection('services')} className="text-gray-700 hover:text-blue-600 font-medium px-4 text-left">
                  Services
                </button>
                <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-blue-600 font-medium px-4 text-left">
                  About Us
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-blue-600 font-medium px-4 text-left">
                  Contact
                </button>
                <div className="border-t border-gray-200 pt-4 px-4 space-y-2">
                  <button
                    onClick={() => handleContactForm('call')}
                    className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    <span>(514) 555-0123</span>
                  </button>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Open: 9AM-6PM</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Best Exchange Rates in
                <span className="text-blue-200"> Montreal</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Get competitive rates, fast service, and trusted currency exchange.
                Over 50 currencies available with real-time rates updated every minute.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-sm">FINTRAC Registered</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="text-sm">15+ Years Experience</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-300 mr-2" />
                  <span className="text-sm">10,000+ Happy Customers</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleContactForm('visit')}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Visit Our Store
                </button>
                <button
                  onClick={() => scrollToSection('rates')}
                  className="border-2 border-blue-400 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-400 hover:bg-opacity-20 transition-colors"
                >
                  Check Live Rates
                </button>
              </div>
            </div>

            {/* Currency Calculator */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 text-gray-900">
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
                <Calculator className="h-6 w-6 inline mr-2" />
                Currency Calculator
              </h3>

              <div className="space-y-4">
                {/* From Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <div className="flex">
                    <select
                      value={selectedFromCurrency}
                      onChange={(e) => setSelectedFromCurrency(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {currencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.flag} {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-32 p-3 border-t border-r border-b border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Amount"
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    onClick={swapCurrencies}
                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <ArrowRightLeft className="h-5 w-5" />
                  </button>
                </div>

                {/* To Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <div className="flex">
                    <select
                      value={selectedToCurrency}
                      onChange={(e) => setSelectedToCurrency(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {currencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.flag} {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>
                    <div className="w-32 p-3 border-t border-r border-b border-gray-300 rounded-r-lg bg-gray-50 flex items-center justify-center font-semibold text-lg">
                      {convertedAmount}
                    </div>
                  </div>
                </div>

                {/* Exchange Rate Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Exchange Rate:</span>
                    <span className="font-semibold">
                      1 {selectedFromCurrency} = {exchangeRates[selectedFromCurrency]?.[selectedToCurrency] || 'N/A'} {selectedToCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-green-600 font-medium">Live • Just now</span>
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3">
                  Get This Rate In-Store
                </button>

                {/* Rate Alert Button */}
                <button
                  onClick={() => setShowRateAlert(true)}
                  className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center mb-2"
                >
                  🔔 Rate Not Right? Set Alert!
                </button>

                {/* Demo Button for Client Presentation */}
                <button
                  onClick={() => {
                    setAlertForm({
                      fromCurrency: selectedFromCurrency,
                      toCurrency: selectedToCurrency,
                      desiredRate: (exchangeRates[selectedFromCurrency]?.[selectedToCurrency] * 1.025).toFixed(4),
                      amount: amount,
                      email: 'demo@client.com',
                      phone: '(514) 555-0123'
                    });
                    handleCalculateRateLock();
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center"
                >
                  🚀 DEMO: See Rate Lock Magic!
                </button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  🎯 Try our revolutionary rate lock algorithm • ⚡ Demo with realistic data
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Saadat Exchange?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've been serving Montreal's currency exchange needs for over 15 years.
              Here's what makes us the trusted choice for thousands of customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <TrendingUp className="h-8 w-8 text-green-600" />,
                title: "Best Rates",
                description: "Competitive exchange rates updated in real-time. We guarantee you'll get more for your money."
              },
              {
                icon: <Clock className="h-8 w-8 text-blue-600" />,
                title: "Fast Service",
                description: "Quick transactions with minimal wait times. Most exchanges completed in under 5 minutes."
              },
              {
                icon: <Shield className="h-8 w-8 text-purple-600" />,
                title: "Fully Licensed",
                description: "FINTRAC registered and fully compliant with all Canadian regulations for your security."
              },
              {
                icon: <Globe className="h-8 w-8 text-orange-600" />,
                title: "50+ Currencies",
                description: "Wide selection of currencies available including major and exotic currencies from around the world."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Exchange Rates */}
      <section id="rates" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Live Exchange Rates
            </h2>
            <p className="text-xl text-gray-600">
              Updated every minute • All rates in Canadian Dollars
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Currency</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">We Buy</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">We Sell</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { flag: '🇺🇸', code: 'USD', name: 'US Dollar', buy: '1.3520', sell: '1.3580', trend: 'up' },
                    { flag: '🇪🇺', code: 'EUR', name: 'Euro', buy: '1.5780', sell: '1.5850', trend: 'up' },
                    { flag: '🇬🇧', code: 'GBP', name: 'British Pound', buy: '1.8350', sell: '1.8420', trend: 'down' },
                    { flag: '🇯🇵', code: 'JPY', name: 'Japanese Yen', buy: '0.0120', sell: '0.0125', trend: 'up' },
                    { flag: '🇦🇺', code: 'AUD', name: 'Australian Dollar', buy: '1.0480', sell: '1.0520', trend: 'down' },
                    { flag: '🇨🇭', code: 'CHF', name: 'Swiss Franc', buy: '1.4720', sell: '1.4780', trend: 'up' }
                  ].map((currency, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{currency.flag}</span>
                          <div>
                            <div className="font-semibold text-gray-900">{currency.code}</div>
                            <div className="text-sm text-gray-600">{currency.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-green-600">
                        {currency.buy}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-blue-600">
                        {currency.sell}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          currency.trend === 'up' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {currency.trend === 'up' ? '↗' : '↘'} {currency.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-6 py-4 text-sm text-gray-600 text-center">
              <div className="flex items-center justify-center space-x-4">
                <span>Last updated: {currentTime.toLocaleTimeString()}</span>
                <span>•</span>
                <span>Rates subject to change</span>
                <span>•</span>
                <span>Minimum transaction amounts may apply</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Alert Feature Section */}
      <section className="py-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-6">
              <span className="text-3xl">🎯</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tired of Checking Rates All Day?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-yellow-100">
              We get it. Exchange rates change constantly and you've got better things to do than refresh rate websites every 5 minutes.
              <strong> Let us watch the markets for you!</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl mb-3">📱</div>
                <h3 className="font-bold text-lg mb-2">Set Your Target</h3>
                <p className="text-yellow-100 text-sm">Tell us your ideal rate and amount</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-bold text-lg mb-2">We Watch 24/7</h3>
                <p className="text-yellow-100 text-sm">Our system monitors rates in real-time</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🔔</div>
                <h3 className="font-bold text-lg mb-2">Get Notified</h3>
                <p className="text-yellow-100 text-sm">Instant alert when your rate hits!</p>
              </div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 inline-block mb-8">
              <p className="text-lg font-semibold mb-2">💡 Pro Tip from Our Traders:</p>
              <p className="text-yellow-100">
                "Set alerts 2-3% better than current rates. Markets are volatile - your target rate often hits within days!"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowRateAlert(true)}
                className="bg-white text-orange-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-50 transition-colors shadow-lg"
              >
                🎯 Set My Rate Alert (FREE!)
              </button>
              <div className="text-center sm:text-left self-center">
                <p className="text-sm text-yellow-100 font-medium">
                  ✨ Over 1,000 alerts set this month<br />
                  💰 Average savings: $47 per exchange
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600">
              Complete currency solutions for individuals and businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Currency Exchange",
                description: "Exchange over 50 currencies at competitive rates with fast, professional service.",
                features: ["50+ currencies", "Live rates", "Large transactions", "Business accounts"]
              },
              {
                title: "Money Transfer",
                description: "International money transfers coming soon! We're working on bringing you the best rates and fastest service.",
                features: ["Coming Q2 2025", "Worldwide coverage", "Competitive fees", "Secure transfers"],
                isComingSoon: true
              },
              {
                title: "Rate Alerts",
                description: "Set custom rate alerts and get notified when exchange rates hit your target price.",
                features: ["Custom rate targets", "Email & SMS alerts", "Free service", "Smart notifications"],
                isNew: true
              },
              {
                title: "Corporate Services",
                description: "Specialized services for businesses including bulk exchanges and account management.",
                features: ["Volume discounts", "Dedicated account manager", "Custom rates", "Credit terms"]
              }
            ].map((service, index) => (
              <div key={index} className={`bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow relative ${
                service.isComingSoon ? 'border-2 border-dashed border-orange-300' : ''
              }`}>
                {service.isComingSoon && (
                  <div className="absolute -top-3 -right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Coming Soon!
                  </div>
                )}
                {service.isNew && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    🆕 New!
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                      <CheckCircle className={`h-4 w-4 mr-2 flex-shrink-0 ${
                        service.isComingSoon ? 'text-orange-500' : 'text-green-500'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {service.isNew && (
                  <button
                    onClick={() => setShowRateAlert(true)}
                    className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    🔔 Set Rate Alert Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <div className="flex justify-center items-center space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-lg font-semibold text-gray-700">4.9/5 from 500+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Business Owner",
                content: "I've been using Saadat Exchange for my import business for 3 years. Their rate alerts saved me thousands - I set a target and got notified when USD hit exactly where I needed it!",
                rating: 5
              },
              {
                name: "Mohammed Al-Rahman",
                role: "International Student",
                content: "As a student sending money home regularly, every dollar matters. The rate alert system is genius - I just set my target and wait for the notification. No more stress!",
                rating: 5
              },
              {
                name: "Jennifer Martinez",
                role: "Frequent Traveler",
                content: "I travel for work monthly and the rate alerts are a game-changer. I set alerts for all my upcoming trips and always get better rates than my colleagues using banks.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Location */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Visit Our Store</h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-blue-400 mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Address</h3>
                    <p className="text-gray-300">123 Sainte-Catherine Street West<br />Montreal, QC H3B 1B1</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-blue-400 mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Phone</h3>
                    <p className="text-gray-300">(514) 555-0123</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-6 w-6 text-blue-400 mr-4 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Business Hours</h3>
                    <div className="text-gray-300 space-y-1">
                      <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p>Saturday: 10:00 AM - 4:00 PM</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-12 pt-8 border-t border-gray-800">
                <h3 className="font-semibold text-lg mb-4">Licensed & Insured</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <Shield className="h-4 w-4 mr-2 text-green-400" />
                    FINTRAC Registered MSB
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <Award className="h-4 w-4 mr-2 text-yellow-400" />
                    Better Business Bureau A+
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-gray-800 rounded-xl p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
                <p className="text-gray-400 mb-4">
                  Located in the heart of downtown Montreal<br />
                  Easy parking • Metro accessible
                </p>
                <button
                  onClick={() => handleContactForm('directions')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">Saadat Exchange</div>
                <div className="text-gray-400 text-sm">Montreal's Trusted Currency Exchange</div>
              </div>
            </div>

            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>&copy; 2025 Saadat Exchange. All rights reserved.</p>
              <p className="mt-1">Licensed Money Services Business • FINTRAC Registration #M20123456</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CurrencyExchangeWebsite;