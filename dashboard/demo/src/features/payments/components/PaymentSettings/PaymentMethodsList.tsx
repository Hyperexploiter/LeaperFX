import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Smartphone,
  Zap,
  DollarSign,
  Settings,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter
} from 'lucide-react';
import { paymentServices } from '../../index';
import type { PaymentMethod, PaymentAnalytics, TransactionSummary } from '../../types';

interface PaymentMethodConfig {
  method: PaymentMethod;
  enabled: boolean;
  displayName: string;
  description: string;
  icon: React.ComponentType<any>;
  processingFee: string;
  settlementTime: string;
  minimumAmount: number;
  maximumAmount: number;
  currencies: string[];
  features: string[];
  risks: string[];
}

const PaymentMethodsList: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([
    {
      method: 'stripe_terminal',
      enabled: true,
      displayName: 'Credit/Debit Cards',
      description: 'Accept card payments via Stripe Terminal',
      icon: CreditCard,
      processingFee: '2.9% + 30¢',
      settlementTime: '1-2 business days',
      minimumAmount: 0.50,
      maximumAmount: 999999,
      currencies: ['CAD', 'USD'],
      features: ['EMV Chip', 'Contactless', 'PIN Verification', 'Receipts'],
      risks: ['Chargebacks', 'Fraud']
    },
    {
      method: 'interac',
      enabled: true,
      displayName: 'Interac Debit',
      description: 'Canadian Interac debit payments',
      icon: Smartphone,
      processingFee: '1.5% + 5¢',
      settlementTime: 'Real-time',
      minimumAmount: 0.01,
      maximumAmount: 3000,
      currencies: ['CAD'],
      features: ['PIN Required', 'Real-time Settlement', 'Low Cost'],
      risks: ['Network Downtime']
    },
    {
      method: 'cryptocurrency',
      enabled: false,
      displayName: 'Cryptocurrency',
      description: 'Accept Bitcoin, Ethereum, and other cryptocurrencies',
      icon: Zap,
      processingFee: 'Network fees only',
      settlementTime: '10 minutes - 1 hour',
      minimumAmount: 1,
      maximumAmount: 50000,
      currencies: ['BTC', 'ETH', 'SOL', 'AVAX', 'USDC'],
      features: ['Irreversible', 'Global', 'Low Fees', 'No Chargebacks'],
      risks: ['Price Volatility', 'Regulatory Changes', 'Technical Complexity']
    },
    {
      method: 'cash',
      enabled: true,
      displayName: 'Cash',
      description: 'Traditional cash payments with manual recording',
      icon: DollarSign,
      processingFee: 'None',
      settlementTime: 'Immediate',
      minimumAmount: 0.01,
      maximumAmount: 10000,
      currencies: ['CAD'],
      features: ['No Processing Fees', 'Immediate Settlement', 'Offline'],
      risks: ['Theft', 'Counterfeiting', 'Manual Errors', 'FINTRAC Reporting']
    }
  ]);

  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionSummary[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const analyticsData = paymentServices.main.getAnalytics();
      setAnalytics(analyticsData);

      // Load recent transactions
      const historyData = paymentServices.main.getPaymentHistory({
        startDate: getDateRange(selectedPeriod).start,
        endDate: getDateRange(selectedPeriod).end
      });
      setRecentTransactions(historyData.items);
    } catch (err) {
      setError('Failed to load payment analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (period: 'day' | 'week' | 'month') => {
    const end = new Date().toISOString();
    const start = new Date();

    switch (period) {
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return { start: start.toISOString(), end };
  };

  const handleToggleMethod = async (method: PaymentMethod) => {
    setMethods(prev => prev.map(m =>
      m.method === method ? { ...m, enabled: !m.enabled } : m
    ));

    setSuccess(`${methods.find(m => m.method === method)?.displayName} ${
      methods.find(m => m.method === method)?.enabled ? 'disabled' : 'enabled'
    }`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const getMethodStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-600' : 'text-gray-400';
  };

  const getMethodStatusBg = (enabled: boolean) => {
    return enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Analytics Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-900">Payment Methods Analytics</h3>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-green-700" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'day' | 'week' | 'month')}
              className="px-3 py-1 border border-green-300 rounded-md text-sm bg-white"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.summary.totalVolume)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.summary.totalTransactions}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercent(analytics.summary.successRate)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.summary.averageAmount)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Method Performance */}
        {analytics && analytics.byMethod.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-green-900 mb-3">Performance by Method</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {analytics.byMethod.map((methodStats) => {
                const methodConfig = methods.find(m => m.method === methodStats.method);
                const Icon = methodConfig?.icon || CreditCard;

                return (
                  <div key={methodStats.method} className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center mb-2">
                      <Icon className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {methodConfig?.displayName || methodStats.method}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Volume: {formatCurrency(methodStats.volume)}</div>
                      <div>Count: {methodStats.count}</div>
                      <div>Success: {formatPercent(methodStats.successRate)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods Configuration */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods Configuration</h3>

        <div className="space-y-4">
          {methods.map((method) => {
            const Icon = method.icon;

            return (
              <div
                key={method.method}
                className={`border rounded-lg p-6 transition-all ${getMethodStatusBg(method.enabled)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${method.enabled ? 'bg-white' : 'bg-gray-100'}`}>
                      <Icon className={`h-6 w-6 ${getMethodStatusColor(method.enabled)}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{method.displayName}</h4>
                        <button
                          onClick={() => handleToggleMethod(method.method)}
                          className="flex items-center"
                        >
                          {method.enabled ? (
                            <ToggleRight className="h-8 w-8 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <p className="text-gray-600 mb-4">{method.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Processing Fee</span>
                          <div className="text-sm text-gray-900">{method.processingFee}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Settlement Time</span>
                          <div className="text-sm text-gray-900">{method.settlementTime}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Amount Range</span>
                          <div className="text-sm text-gray-900">
                            {formatCurrency(method.minimumAmount)} - {formatCurrency(method.maximumAmount)}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Currencies</span>
                          <div className="text-sm text-gray-900">
                            {method.currencies.join(', ')}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500 block mb-2">Features</span>
                          <div className="flex flex-wrap gap-1">
                            {method.features.map((feature) => (
                              <span
                                key={feature}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium text-gray-500 block mb-2">Risk Factors</span>
                          <div className="flex flex-wrap gap-1">
                            {method.risks.map((risk) => (
                              <span
                                key={risk}
                                className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md"
                              >
                                {risk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Compliance Requirements</h3>
            <p className="mt-1 text-sm text-blue-700">
              All payment methods must comply with FINTRAC regulations. Cash transactions over $3,000 require enhanced records,
              and transactions over $10,000 require Large Cash Transaction Reports (LCTR).
            </p>
            <p className="mt-2 text-sm text-blue-700">
              Cryptocurrency transactions may have additional regulatory requirements depending on the amount and customer risk profile.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsList;