import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CreditCard, DollarSign, Smartphone, Banknote, TrendingUp, TrendingDown } from 'lucide-react';
import type { PaymentAnalytics, UnifiedPaymentResult, PaymentMethod } from '../../../types';

interface PaymentMethodBreakdownProps {
  analytics: PaymentAnalytics;
  paymentHistory: UnifiedPaymentResult[];
}

const PaymentMethodBreakdown: React.FC<PaymentMethodBreakdownProps> = ({
  analytics,
  paymentHistory
}) => {
  // Color scheme for payment methods
  const methodColors = {
    stripe_terminal: '#3B82F6', // Blue
    cryptocurrency: '#10B981', // Green
    cash: '#F59E0B', // Amber
    interac: '#8B5CF6' // Purple
  } as const;

  // Icons for payment methods
  const methodIcons = {
    stripe_terminal: CreditCard,
    cryptocurrency: DollarSign,
    cash: Banknote,
    interac: Smartphone
  } as const;

  // Method display names
  const methodNames = {
    stripe_terminal: 'Terminal/Card',
    cryptocurrency: 'Cryptocurrency',
    cash: 'Cash',
    interac: 'Interac'
  } as const;

  // Prepare data for charts
  const pieChartData = useMemo(() => {
    return analytics.byMethod.map(method => ({
      name: methodNames[method.method],
      value: method.volume,
      count: method.count,
      method: method.method,
      color: methodColors[method.method] || '#6B7280'
    }));
  }, [analytics.byMethod]);

  const barChartData = useMemo(() => {
    return analytics.byMethod.map(method => ({
      name: methodNames[method.method],
      volume: method.volume,
      count: method.count,
      avgAmount: method.averageAmount,
      method: method.method
    }));
  }, [analytics.byMethod]);

  // Calculate success rates by method
  const successRates = useMemo(() => {
    const methodStats = {} as Record<PaymentMethod, { total: number; successful: number }>;

    paymentHistory.forEach(payment => {
      if (!methodStats[payment.paymentMethod]) {
        methodStats[payment.paymentMethod] = { total: 0, successful: 0 };
      }
      methodStats[payment.paymentMethod].total++;
      if (payment.success) {
        methodStats[payment.paymentMethod].successful++;
      }
    });

    return Object.entries(methodStats).map(([method, stats]) => ({
      method: method as PaymentMethod,
      name: methodNames[method as PaymentMethod],
      successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
      total: stats.total,
      successful: stats.successful,
      failed: stats.total - stats.successful
    }));
  }, [paymentHistory]);

  // Calculate trends (comparing last 7 days vs previous 7 days)
  const methodTrends = useMemo(() => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const trends = {} as Record<PaymentMethod, { current: number; previous: number; change: number }>;

    paymentHistory.forEach(payment => {
      const paymentDate = new Date(payment.timestamp);

      if (!trends[payment.paymentMethod]) {
        trends[payment.paymentMethod] = { current: 0, previous: 0, change: 0 };
      }

      if (paymentDate >= last7Days && payment.success) {
        trends[payment.paymentMethod].current += payment.amount;
      } else if (paymentDate >= previous7Days && paymentDate < last7Days && payment.success) {
        trends[payment.paymentMethod].previous += payment.amount;
      }
    });

    // Calculate percentage change
    Object.keys(trends).forEach(method => {
      const trend = trends[method as PaymentMethod];
      if (trend.previous > 0) {
        trend.change = ((trend.current - trend.previous) / trend.previous) * 100;
      } else if (trend.current > 0) {
        trend.change = 100; // New method or first transactions
      }
    });

    return trends;
  }, [paymentHistory]);

  const totalVolume = analytics.byMethod.reduce((sum, method) => sum + method.volume, 0);
  const totalTransactions = analytics.byMethod.reduce((sum, method) => sum + method.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Method Analysis</h2>
        <p className="text-gray-600">
          Comprehensive breakdown of payment method performance, distribution, and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analytics.byMethod.map((method) => {
          const Icon = methodIcons[method.method];
          const trend = methodTrends[method.method];
          const percentage = totalVolume > 0 ? (method.volume / totalVolume) * 100 : 0;

          return (
            <div key={method.method} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${methodColors[method.method]}20` }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: methodColors[method.method] }}
                    />
                  </div>
                  <h3 className="ml-3 text-sm font-medium text-gray-900">
                    {methodNames[method.method]}
                  </h3>
                </div>
                {trend && (
                  <div className="flex items-center">
                    {trend.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : trend.change < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span
                      className={`text-xs font-medium ml-1 ${
                        trend.change > 0 ? 'text-green-600' :
                        trend.change < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {trend.change !== 0 ? `${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${method.volume.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{percentage.toFixed(1)}% of total volume</p>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transactions:</span>
                  <span className="font-medium">{method.count}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Avg. Amount:</span>
                  <span className="font-medium">${method.averageAmount.toFixed(0)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Volume Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={([value]: [number]) => [`$${value.toLocaleString()}`, 'Volume']}
                  labelFormatter={(label) => `Payment Method: ${label}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Transaction Count vs Volume */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Volume vs Transaction Count</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'volume') return [`$${Number(value).toLocaleString()}`, 'Volume'];
                    if (name === 'count') return [value, 'Transactions'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="volume" fill="#3B82F6" name="Volume ($)" />
                <Bar yAxisId="right" dataKey="count" fill="#10B981" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Success Rates Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Payment Method Performance</h3>
          <p className="text-sm text-gray-600 mt-1">Success rates, failure analysis, and reliability metrics</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Successful
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Failed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reliability
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {successRates.map((rate) => {
                const reliability = rate.successRate >= 95 ? 'excellent' :
                                 rate.successRate >= 90 ? 'good' :
                                 rate.successRate >= 80 ? 'fair' : 'poor';

                const reliabilityColor = reliability === 'excellent' ? 'text-green-600 bg-green-100' :
                                       reliability === 'good' ? 'text-blue-600 bg-blue-100' :
                                       reliability === 'fair' ? 'text-yellow-600 bg-yellow-100' :
                                       'text-red-600 bg-red-100';

                return (
                  <tr key={rate.method} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="p-2 rounded-lg mr-3"
                          style={{ backgroundColor: `${methodColors[rate.method]}20` }}
                        >
                          {React.createElement(methodIcons[rate.method], {
                            className: "h-4 w-4",
                            style: { color: methodColors[rate.method] }
                          })}
                        </div>
                        <span className="font-medium text-gray-900">{rate.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${rate.successRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {rate.successRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {rate.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {rate.successful}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {rate.failed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reliabilityColor}`}>
                        {reliability}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Business Intelligence Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Performance Insights</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              {analytics.byMethod.length > 0 && (
                <li>
                  • {methodNames[analytics.byMethod[0].method]} is your top performing method with
                  ${analytics.byMethod[0].volume.toLocaleString()} in volume
                </li>
              )}
              <li>
                • Average transaction value across all methods:
                ${totalTransactions > 0 ? (totalVolume / totalTransactions).toFixed(0) : '0'}
              </li>
              {successRates.some(r => r.successRate < 90) && (
                <li>
                  • Some payment methods show reliability issues - consider investigating
                  {successRates.filter(r => r.successRate < 90).map(r => r.name).join(', ')}
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Optimization Opportunities</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>
                • Consider promoting {analytics.byMethod.length > 1 && analytics.byMethod[1] ?
                  methodNames[analytics.byMethod[1].method] : 'alternative methods'} for higher diversity
              </li>
              <li>
                • Monitor crypto adoption trends for potential fee optimization
              </li>
              <li>
                • Implement dynamic routing to prefer higher-success-rate methods
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodBreakdown;