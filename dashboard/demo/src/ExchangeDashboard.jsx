import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Plus, Minus, Calculator, Clock, MapPin, Star, BarChart3, ArrowUpDown, CheckCircle, Phone, Navigation, Download, FileText } from 'lucide-react';

const ExchangeDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [todaysSales, setTodaysSales] = useState([
    {
      id: 1,
      time: '09:15:23',
      from: 'CAD',
      to: 'EUR',
      amount: 1500,
      received: 1013.51,
      profit: 57.00,
      commission: 57.00
    },
    {
      id: 2,
      time: '10:42:18',
      from: 'USD',
      to: 'CAD',
      amount: 800,
      received: 1056.00,
      profit: 44.35,
      commission: 44.35
    },
    {
      id: 3,
      time: '11:28:45',
      from: 'CAD',
      to: 'GBP',
      amount: 2200,
      received: 1257.14,
      profit: 88.00,
      commission: 88.00
    }
  ]);
  const [totalRevenue, setTotalRevenue] = useState(189.35);

  // Calculator state
  const [calcAmount, setCalcAmount] = useState('');
  const [calcFromCurrency, setCalcFromCurrency] = useState('CAD');
  const [calcToCurrency, setCalcToCurrency] = useState('EUR');
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [commission, setCommission] = useState(0);
  const [totalToCustomer, setTotalToCustomer] = useState(0);
  const [profit, setProfit] = useState(0);

  // Inventory state
  const [inventory, setInventory] = useState({
    EUR: { amount: 12500, buyRate: 1.42, sellRate: 1.48 },
    USD: { amount: 15800, buyRate: 1.32, sellRate: 1.38 },
    GBP: { amount: 8200, buyRate: 1.68, sellRate: 1.75 },
    JPY: { amount: 450000, buyRate: 0.0091, sellRate: 0.0095 },
    CHF: { amount: 3200, buyRate: 1.44, sellRate: 1.51 },
    AUD: { amount: 6500, buyRate: 0.88, sellRate: 0.93 }
  });

  const [editingRates, setEditingRates] = useState(false);
  const [tempRates, setTempRates] = useState({});

  // Commission rates (percentage)
  const commissionRates = {
    EUR: 3.8,
    USD: 4.2,
    GBP: 4.0,
    JPY: 3.5,
    CHF: 4.5,
    AUD: 4.8
  };

  const currencyInfo = {
    EUR: { name: 'Euro', flag: '🇪🇺', country: 'European Union' },
    USD: { name: 'US Dollar', flag: '🇺🇸', country: 'United States' },
    GBP: { name: 'British Pound', flag: '🇬🇧', country: 'United Kingdom' },
    JPY: { name: 'Japanese Yen', flag: '🇯🇵', country: 'Japan' },
    CHF: { name: 'Swiss Franc', flag: '🇨🇭', country: 'Switzerland' },
    AUD: { name: 'Australian Dollar', flag: '🇦🇺', country: 'Australia' },
    CAD: { name: 'Canadian Dollar', flag: '🇨🇦', country: 'Canada' }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (calcAmount && calcFromCurrency && calcToCurrency) {
      calculateExchange();
    }
  }, [calcAmount, calcFromCurrency, calcToCurrency]);

  const calculateExchange = () => {
    const amount = parseFloat(calcAmount) || 0;

    if (calcFromCurrency === 'CAD' && calcToCurrency !== 'CAD') {
      // Selling foreign currency to customer
      const rate = inventory[calcToCurrency]?.sellRate || 1;
      const foreignAmount = amount / rate;
      const commissionRate = commissionRates[calcToCurrency] || 4;
      const commissionAmount = amount * (commissionRate / 100);
      const netAmount = foreignAmount;
      const profitAmount = commissionAmount;

      setCalculatedAmount(netAmount);
      setCommission(commissionAmount);
      setTotalToCustomer(netAmount);
      setProfit(profitAmount);
    } else if (calcFromCurrency !== 'CAD' && calcToCurrency === 'CAD') {
      // Buying foreign currency from customer
      const rate = inventory[calcFromCurrency]?.buyRate || 1;
      const cadAmount = amount * rate;
      const commissionRate = commissionRates[calcFromCurrency] || 4;
      const commissionAmount = cadAmount * (commissionRate / 100);
      const netAmount = cadAmount - commissionAmount;
      const profitAmount = commissionAmount;

      setCalculatedAmount(netAmount);
      setCommission(commissionAmount);
      setTotalToCustomer(netAmount);
      setProfit(profitAmount);
    }
  };

  const addToSale = () => {
    if (!calcAmount || calcAmount <= 0) return;

    const sale = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      from: calcFromCurrency,
      to: calcToCurrency,
      amount: parseFloat(calcAmount),
      received: totalToCustomer,
      profit: profit,
      commission: commission
    };

    setTodaysSales(prev => [sale, ...prev]);
    setTotalRevenue(prev => prev + profit);

    // Update inventory based on what customer is giving us
    if (calcFromCurrency === 'CAD' && calcToCurrency !== 'CAD') {
      // Customer giving CAD, wants foreign currency - decrease foreign currency inventory
      setInventory(prev => ({
        ...prev,
        [calcToCurrency]: {
          ...prev[calcToCurrency],
          amount: prev[calcToCurrency].amount - totalToCustomer
        }
      }));
    } else if (calcFromCurrency !== 'CAD' && calcToCurrency === 'CAD') {
      // Customer giving foreign currency, wants CAD - increase foreign currency inventory
      setInventory(prev => ({
        ...prev,
        [calcFromCurrency]: {
          ...prev[calcFromCurrency],
          amount: prev[calcFromCurrency].amount + parseFloat(calcAmount)
        }
      }));
    } else if (calcFromCurrency !== 'CAD' && calcToCurrency !== 'CAD') {
      // Foreign to foreign exchange
      setInventory(prev => ({
        ...prev,
        [calcFromCurrency]: {
          ...prev[calcFromCurrency],
          amount: prev[calcFromCurrency].amount + parseFloat(calcAmount)
        },
        [calcToCurrency]: {
          ...prev[calcToCurrency],
          amount: prev[calcToCurrency].amount - totalToCustomer
        }
      }));
    }

    // Reset calculator
    setCalcAmount('');
    setCalculatedAmount(0);
    setCommission(0);
    setTotalToCustomer(0);
    setProfit(0);
  };

  const updateRate = (currency, type, value) => {
    setTempRates(prev => ({
      ...prev,
      [currency]: {
        ...prev[currency],
        [type]: parseFloat(value) || 0
      }
    }));
  };

  const updateSpread = (currency, spreadPercent) => {
    const buyRate = tempRates[currency]?.buyRate ?? inventory[currency].buyRate;
    const newSellRate = buyRate * (1 + spreadPercent / 100);
    setTempRates(prev => ({
      ...prev,
      [currency]: {
        ...prev[currency],
        sellRate: newSellRate
      }
    }));
  };

  const saveRates = () => {
    setInventory(prev => {
      const updated = { ...prev };
      Object.keys(tempRates).forEach(currency => {
        if (updated[currency]) {
          updated[currency] = { ...updated[currency], ...tempRates[currency] };
        }
      });
      return updated;
    });
    setEditingRates(false);
    setTempRates({});
  };

  const cancelEdit = () => {
    setEditingRates(false);
    setTempRates({});
  };

  const exportDailyStatement = () => {
    const today = new Date().toLocaleDateString();
    const content = `
CURRENCY EXCHANGE SAADAT
Daily Transaction Statement
================================================
Business: Currency Exchange SAADAT
Address: 1243 Phillips Square, Montreal, QC H3B 3H3
Phone: (514) 844-2523
Date: ${today}
Time Generated: ${currentTime.toLocaleString()}

DAILY SUMMARY
================================================
Total Transactions: ${todaysSales.length}
Total Revenue: $${totalRevenue.toFixed(2)} CAD
Average Transaction: $${todaysSales.length > 0 ? (totalRevenue / todaysSales.length).toFixed(2) : '0.00'} CAD

TRANSACTION DETAILS
================================================
${todaysSales.map(sale => `
${sale.time} | ${sale.from} → ${sale.to}
Amount: ${sale.amount.toFixed(2)} ${sale.from}
Received: ${sale.received.toFixed(2)} ${sale.to}
Commission: $${sale.commission.toFixed(2)}
Profit: $${sale.profit.toFixed(2)}
----------------------------------------`).join('')}

CURRENT INVENTORY STATUS
================================================
${Object.entries(inventory).map(([currency, data]) => `
${currency}: ${currency === 'JPY' ? data.amount.toLocaleString() : data.amount.toFixed(0)}
Buy: ${data.buyRate.toFixed(4)} | Sell: ${data.sellRate.toFixed(4)}
Spread: ${(((data.sellRate - data.buyRate) / data.buyRate) * 100).toFixed(2)}%
----------------------------------------`).join('')}

================================================
Generated by Exchange Management System
© ${new Date().getFullYear()} Currency Exchange SAADAT
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAADAT_Daily_Statement_${today.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                💱 Currency Exchange SAADAT
              </h1>
              <div className="flex flex-col space-y-1 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="mr-4">1243 Phillips Square, Montreal, QC H3B 3H3</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  <span className="mr-4">(514) 844-2523</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    <span className="text-yellow-600">3.06 Google Rating</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{currentTime.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
              <div className="text-gray-600">Today's Profit</div>
              <div className="text-sm text-gray-500 mt-1">Phillips Square Location</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-lg p-1 mb-6">
          <div className="flex space-x-1">
            {[
              { id: 'dashboard', label: 'Live Rates', icon: BarChart3 },
              { id: 'calculator', label: 'Smart Calculator', icon: Calculator },
              { id: 'sales', label: 'Today\'s Sales', icon: TrendingUp },
              { id: 'inventory', label: 'Inventory', icon: DollarSign }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Rates Display */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(inventory).map(([currency, data]) => (
              <div key={currency} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{currencyInfo[currency].flag}</span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{currency}</h3>
                      <p className="text-sm text-gray-600">{currencyInfo[currency].name}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    data.amount < 5000 && currency !== 'JPY' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {currency === 'JPY' ? data.amount.toLocaleString() : data.amount.toFixed(0)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">We Buy</span>
                    <span className="text-xl font-bold text-blue-600">{data.buyRate.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">We Sell</span>
                    <span className="text-xl font-bold text-green-600">{data.sellRate.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-600">Spread</span>
                    <span className="text-sm font-medium text-purple-600">
                      {(((data.sellRate - data.buyRate) / data.buyRate) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Smart Calculator */}
        {activeTab === 'calculator' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Smart Exchange Calculator</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer has</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      placeholder="Amount"
                    />
                    <select
                      value={calcFromCurrency}
                      onChange={(e) => setCalcFromCurrency(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(currencyInfo).map(currency => (
                        <option key={currency} value={currency}>
                          {currencyInfo[currency].flag} {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer wants</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={calculatedAmount.toFixed(2)}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-lg font-medium"
                    />
                    <select
                      value={calcToCurrency}
                      onChange={(e) => setCalcToCurrency(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(currencyInfo).map(currency => (
                        <option key={currency} value={currency}>
                          {currencyInfo[currency].flag} {currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {calcAmount && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-4">Transaction Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Exchange Rate:</span>
                      <span className="font-medium text-blue-900">
                        1 {calcFromCurrency} = {calcFromCurrency === 'CAD' ?
                          (1 / (inventory[calcToCurrency]?.sellRate || 1)).toFixed(4) :
                          (inventory[calcFromCurrency]?.buyRate || 1).toFixed(4)
                        } {calcToCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Commission ({commissionRates[calcToCurrency !== 'CAD' ? calcToCurrency : calcFromCurrency]}%):</span>
                      <span className="font-medium text-blue-900">${commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span className="text-blue-900">Your Profit:</span>
                      <span className="text-green-600">${profit.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={addToSale}
                    disabled={!calcAmount || calcAmount <= 0}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <CheckCircle className="inline h-5 w-5 mr-2" />
                    Add to Sales & Update Inventory
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today's Sales */}
        {activeTab === 'sales' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Today's Transactions</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={exportDailyStatement}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Daily Statement
                </button>
                <div className="text-right">
                  <div className="text-lg text-gray-600">{todaysSales.length} transactions</div>
                  <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)} profit</div>
                </div>
              </div>
            </div>

            {todaysSales.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet today. Use the Smart Calculator to start logging sales!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Given</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Received</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todaysSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="mr-1">{currencyInfo[sale.from].flag}</span>
                            {sale.from}
                            <ArrowUpDown className="h-4 w-4 mx-2 text-gray-400" />
                            <span className="mr-1">{currencyInfo[sale.to].flag}</span>
                            {sale.to}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.amount.toFixed(2)} {sale.from}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.received.toFixed(2)} {sale.to}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ${sale.commission.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ${sale.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Inventory Management */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Currency Inventory</h2>
              <button
                onClick={() => editingRates ? saveRates() : setEditingRates(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  editingRates 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {editingRates ? 'Save Changes' : 'Edit Rates'}
              </button>
              {editingRates && (
                <button
                  onClick={cancelEdit}
                  className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spread</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(inventory).map(([currency, data]) => (
                    <tr key={currency} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{currencyInfo[currency].flag}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{currency}</div>
                            <div className="text-sm text-gray-500">{currencyInfo[currency].name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {currency === 'JPY' ? data.amount.toLocaleString() : data.amount.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRates ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={tempRates[currency]?.buyRate ?? data.buyRate}
                            onChange={(e) => updateRate(currency, 'buyRate', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          data.buyRate.toFixed(4)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRates ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={tempRates[currency]?.sellRate ?? data.sellRate}
                            onChange={(e) => updateRate(currency, 'sellRate', e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          data.sellRate.toFixed(4)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                        {editingRates ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              step="0.1"
                              value={(((tempRates[currency]?.sellRate ?? data.sellRate) - (tempRates[currency]?.buyRate ?? data.buyRate)) / (tempRates[currency]?.buyRate ?? data.buyRate) * 100).toFixed(2)}
                              onChange={(e) => updateSpread(currency, parseFloat(e.target.value))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span>%</span>
                          </div>
                        ) : (
                          `${(((data.sellRate - data.buyRate) / data.buyRate) * 100).toFixed(2)}%`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          data.amount < 5000 && currency !== 'JPY'
                            ? 'bg-red-100 text-red-800'
                            : data.amount < 10000 && currency !== 'JPY'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {data.amount < 5000 && currency !== 'JPY' ? 'Low Stock' :
                           data.amount < 10000 && currency !== 'JPY' ? 'Medium' : 'Good'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeDashboard;