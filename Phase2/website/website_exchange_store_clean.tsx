import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Shield, TrendingUp, Calculator, Users, Star, ChevronDown, Menu, X, ArrowRightLeft, DollarSign, Globe, Award, CheckCircle } from 'lucide-react';
import websiteService from '../src/services/websiteService';

const CurrencyExchangeWebsite = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFromCurrency, setSelectedFromCurrency] = useState('USD');
  const [selectedToCurrency, setSelectedToCurrency] = useState('CAD');
  const [amount, setAmount] = useState('1000');
  const [convertedAmount, setConvertedAmount] = useState('1350');
  // Rate notification features removed for production
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentStep, setCurrentStep] = useState(0);
  const [showAlgorithmSteps, setShowAlgorithmSteps] = useState(false);
  
  // Interactive parameter adjustment variables removed for production

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
    
    // Track website analytics
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

  // Rate lock algorithm removed for production

  // Rate lock calculation function removed for production

  // Rate alert submission function removed for production

  // Rate lock acceptance function removed for production

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
        // Track calculator usage
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

      {/* Rate lock loading overlay removed for production */}

      {/* Rate lock modal removed for production */}
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 pt-12">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 pb-20 transform transition-all max-h-[95vh] overflow-y-auto relative">
            <div className="absolute right-2 top-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-md animate-pulse flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Scroll for more content
            </div>
            <div className="absolute right-2 bottom-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-md animate-pulse flex items-center z-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              More content below
            </div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">🔒 Rate Lock Available!</h3>
                <p className="text-gray-600">Advanced algorithmic pricing just for you</p>
              </div>
              <div className="flex items-center">
                <div className="mr-4 px-4 py-2 text-base font-medium bg-gray-100 text-gray-500 rounded-lg border-2 border-dashed border-gray-300 flex items-center">
                  <Calculator className="h-4 w-4 mr-2" /> Algorithm Visualization - Coming Soon
                </div>
                <button
                  onClick={() => setShowRateLock(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {true ? (
              <>
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
              </>
            ) : (
              /* Step-by-Step Algorithm Visualization */
              <div className="bg-white rounded-xl border-2 border-blue-400 p-6 mb-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Algorithm Visualization
                </div>
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    How Our Rate Lock Algorithm Works
                  </h4>
                  <p className="text-gray-600">
                    Follow the steps below to understand how we calculate your optimal rate lock.
                  </p>
                </div>
                
                {/* Step Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ 
                      width: `${(currentStep + 1) * (100 / 9)}%`,
                      transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease',
                      boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
                    }}
                  ></div>
                </div>
                
                {/* Step Content with enhanced animations */}
                <div 
                  className="bg-blue-50 rounded-lg p-6 mb-6 overflow-hidden"
                  style={{
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                >
                  {currentStep === 0 && (
                    <div 
                      className="space-y-4"
                      style={{
                        opacity: 1,
                        transform: 'translateY(0)',
                        transition: 'opacity 0.5s ease, transform 0.5s ease'
                      }}
                    >
                      <h5 className="text-lg font-semibold text-blue-800">Step 1: Gather Input Data</h5>
                      <p>Before we calculate your optimal rate, we need to gather all the relevant information:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="font-medium text-gray-700">Your Target Rate:</p>
                          <p className="text-xl font-bold text-blue-600">{alertForm.desiredRate || (exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] * 1.02).toFixed(4)}</p>
                          <p className="text-xs text-gray-500 mt-1">The rate you're hoping to get</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="font-medium text-gray-700">Current Market Rate:</p>
                          <p className="text-xl font-bold text-gray-800">{exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency]}</p>
                          <p className="text-xs text-gray-500 mt-1">Today's exchange rate</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="font-medium text-gray-700">Exchange Amount:</p>
                          <p className="text-xl font-bold text-gray-800">{alertForm.amount || '1,000'} {alertForm.fromCurrency}</p>
                          <p className="text-xs text-gray-500 mt-1">How much you want to exchange</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <p className="font-medium text-gray-700">Lock Duration:</p>
                          <p 
                            className="text-xl font-bold"
                            style={{ 
                              color: timeUntilExchange > 15 ? '#ef4444' : timeUntilExchange > 7 ? '#f59e0b' : '#1f2937',
                              transition: 'color 0.3s ease'
                            }}
                          >
                            {timeUntilExchange} days
                          </p>
                          <div className="mt-2">
                            <input
                              type="range"
                              min="1"
                              max="30"
                              step="1"
                              value={timeUntilExchange}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setTimeUntilExchange(newValue);
                                // Recalculate with new parameter
                                const currentRate = exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] || 1.35;
                                const targetRate = parseFloat(alertForm.desiredRate) || currentRate * 1.02;
                                const newCalculation = calculateOptimalLockRate({
                                  customerTargetRate: targetRate,
                                  currentMarketRate: currentRate,
                                  timeUntilExchange: newValue,
                                  marketVolatility: marketVolatility,
                                  availableInventory: availableInventory,
                                  demandForecast: demandForecast
                                });
                                setLockCalculation(newCalculation);
                              }}
                              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>1 day</span>
                              <span>30 days</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Adjust to see how duration affects your rate</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-blue-800">Step 2: Calculate Time Premium</h5>
                      <p>The longer we lock your rate, the more risk we take on. We calculate a time premium based on the lock duration:</p>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4">
                        <div className="flex items-center">
                          <div className="w-2/3">
                            <p className="font-medium">Time Premium Calculation:</p>
                            <p className="text-sm text-gray-600 mt-1">7 days × 0.08% per day = {lockCalculation.breakdown.timePremium}%</p>
                            <p className="text-xs text-gray-500 mt-2">Longer durations mean higher premiums, capped at 1%</p>
                          </div>
                          <div className="w-1/3 text-right">
                            <p className="text-xl font-bold text-blue-600">+{lockCalculation.breakdown.timePremium}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-blue-800">Step 3: Calculate Volatility Premium</h5>
                      <p>Currency markets can be volatile. We analyze current market conditions to determine a volatility premium:</p>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4">
                        <div className="flex items-center">
                          <div className="w-2/3">
                            <p className="font-medium">Volatility Premium Calculation:</p>
                            <p className="text-sm text-gray-600 mt-1">Market volatility ({(marketVolatility * 100).toFixed(2)}%) × 30% = {lockCalculation.breakdown.volatilityPremium}%</p>
                            <p className="text-xs text-gray-500 mt-2">Higher market volatility means higher premiums</p>
                          </div>
                          <div className="w-1/3 text-right">
                            <p className="text-xl font-bold text-blue-600">+{lockCalculation.breakdown.volatilityPremium}%</p>
                          </div>
                        </div>
                        
                        {/* Interactive Volatility Slider */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="font-medium text-gray-700 mb-2">Adjust Market Volatility:</p>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-10">0.5%</span>
                            <input
                              type="range"
                              min="0.005"
                              max="0.05"
                              step="0.001"
                              value={marketVolatility}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value);
                                setMarketVolatility(newValue);
                                // Recalculate with new parameter
                                const currentRate = exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] || 1.35;
                                const targetRate = parseFloat(alertForm.desiredRate) || currentRate * 1.02;
                                const newCalculation = calculateOptimalLockRate({
                                  customerTargetRate: targetRate,
                                  currentMarketRate: currentRate,
                                  timeUntilExchange: timeUntilExchange,
                                  marketVolatility: newValue,
                                  availableInventory: availableInventory,
                                  demandForecast: demandForecast
                                });
                                setLockCalculation(newCalculation);
                              }}
                              className="flex-1 h-2 mx-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-gray-500 w-10 text-right">5.0%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Current: <span 
                              style={{ 
                                fontWeight: 'bold',
                                color: marketVolatility > 0.03 ? '#ef4444' : marketVolatility > 0.02 ? '#f59e0b' : '#10b981',
                                transition: 'color 0.3s ease'
                              }}
                            >
                              {(marketVolatility * 100).toFixed(2)}%
                            </span> daily volatility
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-blue-800">Step 4: Calculate Inventory Factor</h5>
                      <p>Our available inventory affects pricing. When we have less of a currency, we need to charge more:</p>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4">
                        <div className="flex items-center">
                          <div className="w-2/3">
                            <p className="font-medium">Inventory Factor Calculation:</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Available: <span
                                style={{ 
                                  fontWeight: 'bold',
                                  color: availableInventory < 25000 ? '#ef4444' : availableInventory < 50000 ? '#f59e0b' : '#10b981',
                                  transition: 'color 0.3s ease'
                                }}
                              >
                                ${availableInventory.toLocaleString()}
                              </span> {alertForm.toCurrency}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {availableInventory < 25000 ? 'Low inventory (0.3%)' : 
                               availableInventory < 50000 ? 'Medium inventory (0.2%)' : 
                               'High inventory (0.1%)'}
                            </p>
                          </div>
                          <div className="w-1/3 text-right">
                            <p className="text-xl font-bold text-blue-600">+{lockCalculation.breakdown.inventoryFactor}%</p>
                          </div>
                        </div>
                        
                        {/* Interactive Inventory Slider */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="font-medium text-gray-700 mb-2">Adjust Available Inventory:</p>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">$10,000</span>
                            <input
                              type="range"
                              min="10000"
                              max="100000"
                              step="5000"
                              value={availableInventory}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value);
                                setAvailableInventory(newValue);
                                // Recalculate with new parameter
                                const currentRate = exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] || 1.35;
                                const targetRate = parseFloat(alertForm.desiredRate) || currentRate * 1.02;
                                const newCalculation = calculateOptimalLockRate({
                                  customerTargetRate: targetRate,
                                  currentMarketRate: currentRate,
                                  timeUntilExchange: timeUntilExchange,
                                  marketVolatility: marketVolatility,
                                  availableInventory: newValue,
                                  demandForecast: demandForecast
                                });
                                setLockCalculation(newCalculation);
                              }}
                              className="flex-1 h-2 mx-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-gray-500 w-16 text-right">$100,000</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span className="text-red-500">Low inventory = Higher premium</span>
                            <span className="text-green-500">High inventory = Lower premium</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-blue-800">Step 5: Calculate Demand Factor</h5>
                      <p>Current market demand affects our pricing. Higher demand means higher premiums:</p>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4">
                        <div className="flex items-center">
                          <div className="w-2/3">
                            <p className="font-medium">Demand Factor Calculation:</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Current demand: {((demandForecast - 1) * 100).toFixed(0)}% {
                                demandForecast > 1.2 ? 'Very high (120%+)' : 
                                demandForecast > 1.1 ? 'High (110-120%)' : 
                                'Normal (<110%)'
                              }
                            </p>
                            <p className="text-xs text-gray-500 mt-2">Higher demand means higher premiums</p>
                          </div>
                          <div className="w-1/3 text-right">
                            <p className="text-xl font-bold text-blue-600">+{lockCalculation.breakdown.demandFactor}%</p>
                          </div>
                        </div>
                        
                        {/* Interactive Demand Slider */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="font-medium text-gray-700 mb-2">Adjust Market Demand:</p>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 w-16">Normal</span>
                            <input
                              type="range"
                              min="1"
                              max="1.4"
                              step="0.05"
                              value={demandForecast}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value);
                                setDemandForecast(newValue);
                                // Recalculate with new parameter
                                const currentRate = exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] || 1.35;
                                const targetRate = parseFloat(alertForm.desiredRate) || currentRate * 1.02;
                                const newCalculation = calculateOptimalLockRate({
                                  customerTargetRate: targetRate,
                                  currentMarketRate: currentRate,
                                  timeUntilExchange: timeUntilExchange,
                                  marketVolatility: marketVolatility,
                                  availableInventory: availableInventory,
                                  demandForecast: newValue
                                });
                                setLockCalculation(newCalculation);
                              }}
                              className="flex-1 h-2 mx-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-gray-500 w-16 text-right">Very High</span>
                          </div>
                          <div className="text-center text-xs text-gray-500 mt-2">
                            Current demand: <span 
                              style={{ 
                                fontWeight: 'bold',
                                color: demandForecast > 1.2 ? '#10b981' : demandForecast > 1.1 ? '#f59e0b' : '#6b7280',
                                transition: 'color 0.3s ease'
                              }}
                            >
                              {((demandForecast - 1) * 100).toFixed(0)}%
                            </span> above normal
                            <br />
                            <span className="text-amber-600">Higher demand allows us to charge higher premiums</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 5 && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-blue-800">Step 6: Calculate Customer Favor</h5>
                      <p>We analyze how your target rate compares to the market rate to determine a customer favor premium:</p>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4">
                        <div className="flex items-center">
                          <div className="w-2/3">
                            <p className="font-medium">Customer Favor Calculation:</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Target vs Market: {((parseFloat(alertForm.desiredRate) - exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency]) / exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] * 100).toFixed(2)}%
                            </p>
                            <p className="text-xs text-gray-500 mt-2">50% of the benefit you're seeking</p>
                          </div>
                          <div className="w-1/3 text-right">
                            <p className="text-xl font-bold text-blue-600">+{lockCalculation.breakdown.customerFavorPremium}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 6 && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-blue-800">Step 7: Calculate Base Rate</h5>
                      <p>We determine a base rate by weighing the current market rate and your target rate:</p>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4">
                        <div className="flex items-center">
                          <div className="w-2/3">
                            <p className="font-medium">Base Rate Calculation:</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {Math.abs(parseFloat(alertForm.desiredRate) - exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency]) / exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] < 0.03 ? 
                                `70% Market (${exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency]}) + 30% Target (${alertForm.desiredRate})` : 
                                `Using market rate (${exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency]})`}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">We weight toward your target if it's reasonable (within 3% of market)</p>
                          </div>
                          <div className="w-1/3 text-right">
                            <p className="text-xl font-bold text-blue-600">{lockCalculation.breakdown.baseRate}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 7 && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-blue-800">Step 8: Apply Total Premium</h5>
                      <p>We add all premium factors to the base rate to calculate the proposed rate:</p>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4">
                        <div className="flex items-center">
                          <div className="w-2/3">
                            <p className="font-medium">Total Premium Calculation:</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Time ({lockCalculation.breakdown.timePremium}%) + 
                              Volatility ({lockCalculation.breakdown.volatilityPremium}%) + 
                              Inventory ({lockCalculation.breakdown.inventoryFactor}%) + 
                              Demand ({lockCalculation.breakdown.demandFactor}%) + 
                              Customer ({lockCalculation.breakdown.customerFavorPremium}%)
                            </p>
                          </div>
                          <div className="w-1/3 text-right">
                            <p className="text-xl font-bold text-blue-600">+{lockCalculation.breakdown.totalPremium}%</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Proposed Rate:</p>
                            <p className="text-xl font-bold text-blue-600">
                              {lockCalculation.breakdown.baseRate} × (1 + {lockCalculation.breakdown.totalPremium / 100}) = {(lockCalculation.breakdown.baseRate * (1 + lockCalculation.breakdown.totalPremium / 100)).toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentStep === 8 && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-semibold text-blue-800">Step 9: Finalize Optimal Rate</h5>
                      <p>We ensure the rate meets our minimum profit requirements and is reasonable for the market:</p>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 mt-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Proposed Rate:</p>
                            <p className="font-bold text-blue-600">{(lockCalculation.breakdown.baseRate * (1 + lockCalculation.breakdown.totalPremium / 100)).toFixed(4)}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Minimum Acceptable Rate:</p>
                            <p className="font-bold text-gray-700">{(exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] * 0.985 * 1.015).toFixed(4)}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Maximum Reasonable Rate:</p>
                            <p className="font-bold text-gray-700">{(exchangeRates[alertForm.fromCurrency]?.[alertForm.toCurrency] * 1.04).toFixed(4)}</p>
                          </div>
                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <p className="font-medium">Final Optimal Rate:</p>
                              <p className="text-2xl font-bold text-green-600">{lockCalculation.optimalRate}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">The final rate ensures our minimum profit while staying reasonable for the market</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Navigation Controls - Fixed at bottom */}
                <div className="sticky bottom-0 bg-white pt-6 pb-4 border-t border-gray-200 mt-10 z-40 shadow-lg rounded-b-lg">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                        currentStep === 0 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>
                    
                    <div className="text-center bg-blue-50 px-4 py-2 rounded-full">
                      <span className="font-bold text-blue-700">
                        Step {currentStep + 1} of 9
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setCurrentStep(Math.min(8, currentStep + 1))}
                      disabled={currentStep === 8}
                      className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                        currentStep === 8
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      Next
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Scroll to Top Button */}
                <button
                  onClick={() => {
                    const modalContent = document.querySelector('.max-h-\\[85vh\\]');
                    if (modalContent) modalContent.scrollTop = 0;
                  }}
                  className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  title="Scroll to top"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              </div>
            )}

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

            {/* Payment Method Explanation Panel */}
            <div className="mt-10 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-300 shadow-md">
              <h4 className="text-base font-bold text-blue-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                💳 How Payment Works:
              </h4>
              <ul className="text-sm text-gray-700 space-y-3">
                <li className="flex items-start bg-white bg-opacity-50 p-2 rounded-lg">
                  <span className="text-green-500 font-bold mr-2 text-lg">✓</span>
                  <span><strong>No immediate payment required</strong> - Your payment method is saved but not charged yet</span>
                </li>
                <li className="flex items-start bg-white bg-opacity-50 p-2 rounded-lg">
                  <span className="text-green-500 font-bold mr-2 text-lg">✓</span>
                  <span>When the algorithm finds your optimal rate, it will <strong>automatically execute the transaction</strong> using your saved payment information</span>
                </li>
                <li className="flex items-start bg-white bg-opacity-50 p-2 rounded-lg">
                  <span className="text-green-500 font-bold mr-2 text-lg">✓</span>
                  <span>The transaction is processed quickly and securely, ensuring you get the exact rate shown</span>
                </li>
                <li className="flex items-start bg-white bg-opacity-50 p-2 rounded-lg">
                  <span className="text-green-500 font-bold mr-2 text-lg">✓</span>
                  <span>You'll receive an immediate confirmation via email with all transaction details</span>
                </li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-600 text-center mt-6 mb-10 p-3 bg-gray-100 rounded-lg font-medium">
              * Rate lock requires 50% deposit • Final exchange within 7 days • Subject to inventory availability
            </p>
          </div>
        </div>
      )}

      {/* Rate Alert Modal - Disabled for Production */}
      {false && (
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
                Professional Currency Exchange
                <span className="text-blue-200"> Solutions</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Institutional-grade currency exchange services with competitive rates, advanced analytics, and professional support.
                Trusted by businesses and individuals for secure, efficient transactions.
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

                {/* Rate Alert - Coming Soon */}
                <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-lg font-semibold flex items-center justify-center mb-2 border-2 border-dashed border-gray-300">
                  🔔 Rate Alerts - Coming Soon!
                </div>

                {/* Professional Call-to-Action */}
                <div className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 py-3 rounded-lg font-semibold border-2 border-dashed border-gray-300 flex items-center justify-center">
                  Advanced Rate Lock - Coming Soon
                </div>

                <p className="text-xs text-gray-500 text-center mt-2">
                  Algorithmic rate optimization and predictive analytics in development
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
              <div className="bg-white text-gray-500 px-8 py-4 rounded-lg font-bold text-lg shadow-lg border-2 border-dashed border-gray-300">
                🎯 Rate Alerts - Coming Soon!
              </div>
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
              Professional currency exchange solutions with institutional-grade security and support
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
                description: "Advanced rate monitoring and notification system to help you time your exchanges perfectly.",
                features: ["Custom rate targets", "Email & SMS alerts", "Smart notifications", "Market trend analysis"],
                isComingSoon: true
              },
              {
                title: "Business Intelligence",
                description: "Advanced analytics and insights for optimizing your currency exchange strategies and risk management.",
                features: ["Market analysis", "Risk assessment", "Performance insights", "Strategic recommendations"],
                isComingSoon: true
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
                {service.isComingSoon && (
                  <div className="mt-4 w-full bg-gray-100 text-gray-500 py-2 rounded-lg font-medium text-center border-2 border-dashed border-gray-300">
                    Coming Soon!
                  </div>
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
                <div className="text-gray-400 text-sm">Professional Currency Exchange Services</div>
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