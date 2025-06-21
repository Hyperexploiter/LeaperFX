import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Clock, DollarSign, TrendingUp, Shield, Zap, AlertTriangle, BarChart3, Layers } from 'lucide-react';
import './Demo.css';

const DeFiFXDemo = () => {
  const [currentView, setCurrentView] = useState('customer');
  const [orderStatus, setOrderStatus] = useState('idle');
  const [orderAmount, setOrderAmount] = useState(5000);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [storeInventory] = useState({
    EUR: 2000,
    USD: 8000,
    GBP: 1500,
    JPY: 300000
  });

  const [transactionSteps, setTransactionSteps] = useState<any[]>([]);
  const [technicalDetails, setTechnicalDetails] = useState<any[]>([]);
  const [showTechnical, setShowTechnical] = useState(false);

  const exchangeRates: { [key: string]: number } = {
    EUR: 0.73,
    USD: 0.75,
    GBP: 0.58,
    JPY: 110
  };

  const simulateTransaction = () => {
    setOrderStatus('processing');
    setTransactionSteps([]);
    setTechnicalDetails([]);

    const requiredAmount = Math.round(orderAmount * exchangeRates[selectedCurrency]);
    const inventoryGap = Math.max(0, requiredAmount - storeInventory[selectedCurrency as keyof typeof storeInventory]);

    const steps = [
      { id: 1, text: `Customer payment received: $${orderAmount} CAD`, status: "pending", delay: 500 },
      { id: 2, text: "KYC verification completed", status: "pending", delay: 1000 },
      { id: 3, text: "Funds secured in smart contract escrow", status: "pending", delay: 1500 },
      { id: 4, text: `Inventory check: Need ${requiredAmount.toLocaleString()} ${selectedCurrency}, have ${storeInventory[selectedCurrency as keyof typeof storeInventory].toLocaleString()}`, status: "pending", delay: 2000 },
      { id: 5, text: `Liquidity gap detected: ${inventoryGap.toLocaleString()} ${selectedCurrency} shortfall`, status: "pending", delay: 2500 },
      { id: 6, text: "Initiating Aave V3 flash loan", status: "pending", delay: 3000 },
      { id: 7, text: `Flash loan approved: $${Math.round(inventoryGap / exchangeRates[selectedCurrency] * 1.1)} USDC`, status: "pending", delay: 3500 },
      { id: 8, text: "Executing USDC → " + selectedCurrency + " swap on Uniswap V3", status: "pending", delay: 4000 },
      { id: 9, text: "Optimal route found: USDC → WETH → " + selectedCurrency, status: "pending", delay: 4500 },
      { id: 10, text: "Swap executed with 0.05% slippage", status: "pending", delay: 5000 },
      { id: 11, text: `Full ${requiredAmount.toLocaleString()} ${selectedCurrency} now available`, status: "pending", delay: 5500 },
      { id: 12, text: "Customer notified - ready for pickup", status: "pending", delay: 6000 },
      { id: 13, text: "Customer confirms receipt", status: "pending", delay: 6500 },
      { id: 14, text: "Escrow releases customer payment", status: "pending", delay: 7000 },
      { id: 15, text: "Flash loan + fees auto-repaid", status: "pending", delay: 7500 },
      { id: 16, text: "Profit margin secured: $" + Math.round(orderAmount * 0.015), status: "pending", delay: 8000 },
      { id: 17, text: "Transaction complete ✓", status: "pending", delay: 8500 }
    ];

    const technical = [
      { id: 1, text: "Smart contract deployed on Polygon", details: "Contract: 0xa1b2...c3d4", delay: 500 },
      { id: 2, text: "Chainlink price feed queried", details: "ETH/USD: $2,245.67", delay: 1000 },
      { id: 3, text: "Gas optimization applied", details: "Est. gas: 180,000 units", delay: 1500 },
      { id: 4, text: "Multi-sig wallet authorization", details: "2/3 signatures confirmed", delay: 2000 },
      { id: 5, text: "Aave pool liquidity check", details: "Available: $2.3M USDC", delay: 2500 },
      { id: 6, text: "Flash loan parameters set", details: "Amount: $6,850 USDC, Fee: 0.09%", delay: 3000 },
      { id: 7, text: "DEX aggregator analysis", details: "Uniswap V3 best rate: 1.8342 EUR/USDC", delay: 3500 },
      { id: 8, text: "Slippage protection enabled", details: "Max slippage: 0.5%", delay: 4000 },
      { id: 9, text: "MEV protection activated", details: "Private mempool routing", delay: 4500 },
      { id: 10, text: "Transaction mined", details: "Block: 48,923,156 | Gas used: 174,582", delay: 5000 },
      { id: 11, text: "Circle API integration", details: "USDC → EUR via Circle", delay: 5500 },
      { id: 12, text: "Compliance check passed", details: "AML screening: Clear", delay: 6000 },
      { id: 13, text: "FINTRAC report generated", details: "Transaction ID: FTR-2025-001847", delay: 6500 },
      { id: 14, text: "Yield farming activated", details: "Excess funds → Compound V3", delay: 7000 },
      { id: 15, text: "Settlement finalized", details: "Net profit: $75.83", delay: 7500 }
    ];

    // Animate main steps
    steps.forEach((step, index) => {
      setTimeout(() => {
        setTransactionSteps(prev => {
          const updated = [...prev];
          updated[index] = { ...step, status: "completed" };
          return updated;
        });

        if (index === steps.length - 1) {
          setOrderStatus('completed');
        }
      }, step.delay);
    });

    // Add steps progressively
    steps.forEach((step, index) => {
      setTimeout(() => {
        setTransactionSteps(prev => [...prev, { ...step, status: index === 0 ? "processing" : "pending" }]);
      }, step.delay - 400);
    });

    // Animate technical details
    technical.forEach((detail, index) => {
      setTimeout(() => {
        setTechnicalDetails(prev => [...prev, { ...detail, status: "completed" }]);
      }, detail.delay);
    });
  };

  const resetDemo = () => {
    setOrderStatus('idle');
    setTransactionSteps([]);
    setTechnicalDetails([]);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          DeFi FX Liquidity Platform
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Institutional-grade liquidity infrastructure for currency exchange businesses
        </p>

        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setCurrentView('customer')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentView === 'customer' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            Customer Interface
          </button>
          <button
            onClick={() => setCurrentView('owner')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentView === 'owner' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            Operations Dashboard
          </button>
          <button
            onClick={() => setCurrentView('technical')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentView === 'technical' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            Technical Architecture
          </button>
        </div>
      </div>

      {currentView === 'customer' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Order Interface</h2>

          <div className="grid lg:grid-cols-3 gap-8">
            <div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to exchange
                </label>
                <div className="flex space-x-4">
                  <input
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(Number(e.target.value))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Amount"
                  />
                  <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>CAD</option>
                    <option>USD</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  For
                </label>
                <div className="flex space-x-4">
                  <input
                    type="number"
                    value={Math.round(orderAmount * exchangeRates[selectedCurrency])}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Inventory Gap:</strong> Store has {storeInventory[selectedCurrency as keyof typeof storeInventory].toLocaleString()} {selectedCurrency},
                      but you need {Math.round(orderAmount * exchangeRates[selectedCurrency]).toLocaleString()} {selectedCurrency}.
                      <br />
                      <strong>Shortfall:</strong> {Math.max(0, Math.round(orderAmount * exchangeRates[selectedCurrency]) - storeInventory[selectedCurrency as keyof typeof storeInventory]).toLocaleString()} {selectedCurrency}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Smart Liquidity Solution</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Flash loan: ${Math.round(Math.max(0, Math.round(orderAmount * exchangeRates[selectedCurrency]) - storeInventory[selectedCurrency as keyof typeof storeInventory]) / exchangeRates[selectedCurrency] * 1.1)} USDC</div>
                  <div>• Swap fee: ~0.3%</div>
                  <div>• Total time: ~2.5 minutes</div>
                  <div>• Success rate: 99.7%</div>
                </div>
              </div>

              <button
                onClick={simulateTransaction}
                disabled={orderStatus === 'processing'}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {orderStatus === 'processing' ? (
                  <span className="flex items-center justify-center">
                    <Clock className="animate-spin h-5 w-5 mr-2" />
                    Processing Transaction...
                  </span>
                ) : (
                  'Execute Smart Transaction'
                )}
              </button>

              {orderStatus === 'completed' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                    <span className="text-green-800 font-semibold">
                      Transaction Complete!
                    </span>
                  </div>
                  <div className="text-sm text-green-700">
                    Your {Math.round(orderAmount * exchangeRates[selectedCurrency]).toLocaleString()} {selectedCurrency} is ready for pickup.
                    <br />Store profit: ${Math.round(orderAmount * 0.015)}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showTechnical}
                    onChange={(e) => setShowTechnical(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Show technical details</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Flow</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactionSteps.map((step) => (
                  <div key={step.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                      step.status === 'completed' ? 'bg-green-100' :
                      step.status === 'processing' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : step.status === 'processing' ? (
                        <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                    <span className={`text-sm ${
                      step.status === 'completed' ? 'text-green-800 font-medium' :
                      step.status === 'processing' ? 'text-blue-800 font-medium' : 'text-gray-500'
                    }`}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {showTechnical && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Layers className="inline h-5 w-5 mr-2" />
                  Technical Execution
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {technicalDetails.map((detail) => (
                    <div key={detail.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-400">
                      <div className="font-medium text-gray-900 text-sm">{detail.text}</div>
                      <div className="text-xs text-gray-600 mt-1 font-mono">{detail.details}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {orderStatus === 'completed' && (
            <div className="mt-6 text-center">
              <button
                onClick={resetDemo}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reset Demo
              </button>
            </div>
          )}
        </div>
      )}

      {currentView === 'owner' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Operations Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Daily Revenue</p>
                    <p className="text-2xl font-bold text-blue-900">$18,450</p>
                    <p className="text-xs text-blue-700">+23% vs yesterday</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Order Fulfillment</p>
                    <p className="text-2xl font-bold text-green-900">100%</p>
                    <p className="text-xs text-green-700">47/47 orders today</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-center">
                  <Zap className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Avg Processing</p>
                    <p className="text-2xl font-bold text-purple-900">2.1min</p>
                    <p className="text-xs text-purple-700">15% faster than target</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">DeFi Yield (24h)</p>
                    <p className="text-2xl font-bold text-yellow-900">$127</p>
                    <p className="text-xs text-yellow-700">4.2% APY on idle funds</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Inventory</h3>
                <div className="space-y-3">
                  {Object.entries(storeInventory).map(([currency, value]) => {
                    const numericAmount = value as number;
                    const isLow = numericAmount < 5000 && currency !== 'JPY';
                    return (
                      <div key={currency} className={`flex justify-between items-center p-3 rounded-lg ${
                        isLow ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center">
                          <span className="font-medium">{currency}</span>
                          {isLow && <AlertTriangle className="h-4 w-4 text-orange-500 ml-2" />}
                        </div>
                        <span className={`${isLow ? 'text-orange-700' : 'text-gray-600'}`}>
                          {currency === 'JPY' ? numericAmount.toLocaleString() : `${numericAmount.toLocaleString()}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Smart Inventory Alerts</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• EUR: Low stock - auto-reorder triggered</div>
                    <div>• GBP: Optimal levels maintained</div>
                    <div>• USD: Excess detected - yield farming active</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">DeFi Liquidity Pool</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-semibold">Pool Status: Active</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total pool size:</span>
                      <span className="font-medium">$125,000 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available liquidity:</span>
                      <span className="font-medium">$78,500 USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Currently deployed:</span>
                      <span className="font-medium">$46,500 USDC</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Flash Loan Capacity</span>
                      <span className="text-sm text-green-600">$500K available</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Pool Utilization</span>
                      <span className="text-sm text-blue-600">37.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '37%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Management</h3>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center mb-1">
                      <Shield className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-semibold text-green-800">All Systems Operational</span>
                    </div>
                    <div className="text-xs text-green-700">
                      Last security audit: 2 days ago ✓
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-2">Circuit Breakers</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Max single transaction:</span>
                        <span>$50,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily volume limit:</span>
                        <span>$500,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Slippage tolerance:</span>
                        <span>0.5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium mb-2">Compliance Status</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        <span>FINTRAC reporting: Current</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        <span>KYC verification: 100%</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        <span>AML screening: Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Smart Transactions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flash Loan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">14:23</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€3,500</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$2,100 USDC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">$67.50</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">13:45</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£2,200</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$1,800 USDC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">$45.30</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">12:18</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€8,000</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$6,500 USDC</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">$156.00</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentView === 'technical' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Architecture</h2>

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Contract Stack</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Escrow Contract</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Multi-sig security (2/3 signatures)</div>
                      <div>• Time-locked releases</div>
                      <div>• Emergency pause mechanism</div>
                      <div>• Upgradeable via proxy pattern</div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Flash Loan Integration</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Aave V3 protocol integration</div>
                      <div>• Automatic fee calculation</div>
                      <div>• Slippage protection</div>
                      <div>• MEV protection via private mempool</div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">DEX Aggregation</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Uniswap V3 integration</div>
                      <div>• 1inch aggregator backup</div>
                      <div>• Real-time rate comparison</div>
                      <div>• Gas optimization</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Infrastructure</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Blockchain Infrastructure</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Polygon mainnet (low fees)</div>
                      <div>• Alchemy RPC endpoints</div>
                      <div>• Chainlink price feeds</div>
                      <div>• Hardware security modules</div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Fiat Integration</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Circle API for USDC conversion</div>
                      <div>• Coinbase Commerce integration</div>
                      <div>• Real-time settlement</div>
                      <div>• Bank-grade security</div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Compliance & Monitoring</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>• Automated FINTRAC reporting</div>
                      <div>• Real-time AML screening</div>
                      <div>• Chainalysis integration</div>
                      <div>• 24/7 system monitoring</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Flow Diagram</h3>
              <div className="flex items-center justify-between text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">1</div>
                  <div>Customer<br />Order</div>
                </div>
                <ArrowRight className="text-gray-400" />
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mb-2">2</div>
                  <div>Smart Contract<br />Escrow</div>
                </div>
                <ArrowRight className="text-gray-400" />
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-2">3</div>
                  <div>Flash Loan<br />Execution</div>
                </div>
                <ArrowRight className="text-gray-400" />
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold mb-2">4</div>
                  <div>DEX Swap<br />& Settlement</div>
                </div>
                <ArrowRight className="text-gray-400" />
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mb-2">5</div>
                  <div>Customer<br />Delivery</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">The Competitive Advantage</h2>
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-4xl font-bold mb-2">100%</div>
            <div className="text-indigo-200">Order fulfillment rate</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">$500K</div>
            <div className="text-indigo-200">Instant liquidity access</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">2.1min</div>
            <div className="text-indigo-200">Average processing time</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">99.7%</div>
            <div className="text-indigo-200">System uptime</div>
          </div>
        </div>
        <p className="text-xl text-indigo-100 mb-4">
          Enterprise-grade DeFi infrastructure. Zero inventory constraints. Unlimited growth potential.
        </p>
        <div className="text-lg text-indigo-200">
          The future of currency exchange is here. Are you ready to lead it?
        </div>
      </div>
    </div>
  );
};

export default DeFiFXDemo;