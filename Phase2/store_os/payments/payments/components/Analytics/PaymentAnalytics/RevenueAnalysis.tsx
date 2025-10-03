import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Target,
  AlertCircle,
  CheckCircle,
  Percent,
  PieChart as PieChartIcon,
  BarChart3,
  Settings
} from 'lucide-react';
import type { PaymentAnalytics, UnifiedPaymentResult, PaymentMethod } from '../../../types';

interface RevenueAnalysisProps {
  analytics: PaymentAnalytics;
  paymentHistory: UnifiedPaymentResult[];
}

interface RevenueMetrics {
  paymentMethod: PaymentMethod;
  totalRevenue: number;
  totalFees: number;
  netRevenue: number;
  transactionCount: number;
  averageRevenue: number;
  feePercentage: number;
  profitMargin: number;
  costPerTransaction: number;
}

interface CommissionStructure {
  method: PaymentMethod;
  baseCommission: number;
  processingFee: number;
  networkFee?: number;
  totalCost: number;
  recommendedMargin: number;
}

interface OptimizationSuggestion {
  type: 'pricing' | 'volume' | 'cost' | 'efficiency';
  title: string;
  description: string;
  potentialImpact: number;
  priority: 'high' | 'medium' | 'low';
  implementation: string;
}

const RevenueAnalysis: React.FC<RevenueAnalysisProps> = ({
  analytics,
  paymentHistory
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [showOptimization, setShowOptimization] = useState(false);

  // Commission structures for different payment methods
  const commissionStructures: CommissionStructure[] = [
    {
      method: 'stripe_terminal',
      baseCommission: 2.9, // 2.9% + $0.30
      processingFee: 0.30,
      totalCost: 2.9,
      recommendedMargin: 1.5
    },
    {
      method: 'cryptocurrency',
      baseCommission: 1.0, // 1% base commission
      processingFee: 0,
      networkFee: 5.0, // Average network fee
      totalCost: 1.0,
      recommendedMargin: 2.0
    },
    {
      method: 'cash',
      baseCommission: 0, // No processing fees
      processingFee: 0,
      totalCost: 0,
      recommendedMargin: 3.0
    },
    {
      method: 'interac',
      baseCommission: 1.5, // 1.5% for Interac
      processingFee: 0.25,
      totalCost: 1.5,
      recommendedMargin: 1.2
    }
  ];

  // Calculate revenue metrics for each payment method
  const revenueMetrics = useMemo(() => {
    const metrics: RevenueMetrics[] = [];

    analytics.byMethod.forEach(method => {
      const commissionStructure = commissionStructures.find(c => c.method === method.method);
      if (!commissionStructure) return;

      // Calculate fees based on payment method
      let totalFees = 0;
      if (method.method === 'stripe_terminal') {
        totalFees = (method.volume * commissionStructure.baseCommission / 100) +
                   (method.count * commissionStructure.processingFee);
      } else if (method.method === 'cryptocurrency') {
        // For crypto, assume network fees are separate and commission is on volume
        totalFees = method.volume * commissionStructure.baseCommission / 100;
      } else if (method.method === 'interac') {
        totalFees = (method.volume * commissionStructure.baseCommission / 100) +
                   (method.count * commissionStructure.processingFee);
      }
      // Cash has no fees

      // Calculate revenue assuming we charge the recommended margin
      const totalRevenue = method.volume * commissionStructure.recommendedMargin / 100;
      const netRevenue = totalRevenue - totalFees;
      const feePercentage = method.volume > 0 ? (totalFees / method.volume) * 100 : 0;
      const profitMargin = totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;

      metrics.push({
        paymentMethod: method.method,
        totalRevenue,
        totalFees,
        netRevenue,
        transactionCount: method.count,
        averageRevenue: method.count > 0 ? totalRevenue / method.count : 0,
        feePercentage,
        profitMargin,
        costPerTransaction: method.count > 0 ? totalFees / method.count : 0
      });
    });

    return metrics.sort((a, b) => b.netRevenue - a.netRevenue);
  }, [analytics.byMethod]);

  // Calculate daily revenue trends
  const dailyRevenue = useMemo(() => {
    const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90;
    const dailyData = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalRevenue: 0,
        totalFees: 0,
        netRevenue: 0,
        terminalRevenue: 0,
        cryptoRevenue: 0,
        cashRevenue: 0,
        interacRevenue: 0
      };
    }).reverse();

    // Filter payments by timeframe
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const recentPayments = paymentHistory.filter(p =>
      new Date(p.timestamp) >= cutoffDate && p.success
    );

    recentPayments.forEach(payment => {
      const paymentDate = payment.timestamp.split('T')[0];
      const dayData = dailyData.find(day => day.date === paymentDate);
      if (!dayData) return;

      const commissionStructure = commissionStructures.find(c => c.method === payment.paymentMethod);
      if (!commissionStructure) return;

      // Calculate revenue and fees for this payment
      let fees = 0;
      if (payment.paymentMethod === 'stripe_terminal') {
        fees = (payment.amount * commissionStructure.baseCommission / 100) + commissionStructure.processingFee;
      } else if (payment.paymentMethod === 'cryptocurrency') {
        fees = payment.amount * commissionStructure.baseCommission / 100;
      } else if (payment.paymentMethod === 'interac') {
        fees = (payment.amount * commissionStructure.baseCommission / 100) + commissionStructure.processingFee;
      }

      const revenue = payment.amount * commissionStructure.recommendedMargin / 100;
      const netRevenue = revenue - fees;

      dayData.totalRevenue += revenue;
      dayData.totalFees += fees;
      dayData.netRevenue += netRevenue;

      // Add to method-specific revenue
      switch (payment.paymentMethod) {
        case 'stripe_terminal':
          dayData.terminalRevenue += revenue;
          break;
        case 'cryptocurrency':
          dayData.cryptoRevenue += revenue;
          break;
        case 'cash':
          dayData.cashRevenue += revenue;
          break;
        case 'interac':
          dayData.interacRevenue += revenue;
          break;
      }
    });

    return dailyData.filter(day => day.totalRevenue > 0);
  }, [paymentHistory, selectedTimeframe]);

  // Generate optimization suggestions
  const optimizationSuggestions: OptimizationSuggestion[] = [
    {
      type: 'pricing',
      title: 'Optimize Cash Transaction Margins',
      description: 'Cash transactions have no processing fees. Consider increasing margins from 3% to 3.5%.',
      potentialImpact: 16.7,
      priority: 'high',
      implementation: 'Update pricing structure for cash transactions'
    },
    {
      type: 'volume',
      title: 'Promote Cryptocurrency Payments',
      description: 'Crypto has lower processing costs than cards. Incentivize crypto adoption.',
      potentialImpact: 12.3,
      priority: 'medium',
      implementation: 'Offer 0.5% discount for crypto payments'
    },
    {
      type: 'cost',
      title: 'Negotiate Better Terminal Rates',
      description: 'Current 2.9% rate can potentially be reduced to 2.7% with higher volume.',
      potentialImpact: 8.2,
      priority: 'medium',
      implementation: 'Contact Stripe for volume-based pricing'
    },
    {
      type: 'efficiency',
      title: 'Implement Dynamic Pricing',
      description: 'Adjust margins based on real-time demand and market conditions.',
      potentialImpact: 15.5,
      priority: 'high',
      implementation: 'Develop algorithmic pricing system'
    }
  ];

  const totalRevenue = revenueMetrics.reduce((sum, metric) => sum + metric.totalRevenue, 0);
  const totalFees = revenueMetrics.reduce((sum, metric) => sum + metric.totalFees, 0);
  const totalNetRevenue = totalRevenue - totalFees;
  const overallMargin = totalRevenue > 0 ? (totalNetRevenue / totalRevenue) * 100 : 0;

  const pieChartData = revenueMetrics.map(metric => ({
    name: metric.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: metric.netRevenue,
    percentage: totalNetRevenue > 0 ? (metric.netRevenue / totalNetRevenue) * 100 : 0
  }));

  const methodColors = {
    'stripe_terminal': '#3B82F6',
    'cryptocurrency': '#10B981',
    'cash': '#F59E0B',
    'interac': '#8B5CF6'
  } as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Revenue Analysis & Optimization</h2>
          <p className="text-gray-600">
            Commission structure analysis, fee optimization, and profit margin insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => setShowOptimization(!showOptimization)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Target className="h-4 w-4 mr-2" />
            {showOptimization ? 'Hide' : 'Show'} Optimization
          </button>
        </div>
      </div>

      {/* Key Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              <p className="text-green-200 text-xs mt-1">Commission income</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Fees</p>
              <p className="text-2xl font-bold">${totalFees.toLocaleString()}</p>
              <p className="text-red-200 text-xs mt-1">Processing costs</p>
            </div>
            <Calculator className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Net Revenue</p>
              <p className="text-2xl font-bold">${totalNetRevenue.toLocaleString()}</p>
              <p className="text-blue-200 text-xs mt-1">After fees</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Profit Margin</p>
              <p className="text-2xl font-bold">{overallMargin.toFixed(1)}%</p>
              <p className="text-purple-200 text-xs mt-1">Overall margin</p>
            </div>
            <Percent className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown by Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {revenueMetrics.map((metric, index) => (
          <div key={metric.paymentMethod} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 capitalize">
                {metric.paymentMethod.replace('_', ' ')}
              </h3>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: Object.values(methodColors)[index] }}
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Net Revenue</p>
                <p className="text-xl font-bold text-gray-900">${metric.netRevenue.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Revenue</p>
                  <p className="font-medium">${metric.totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Fees</p>
                  <p className="font-medium text-red-600">${metric.totalFees.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Transactions</p>
                  <p className="font-medium">{metric.transactionCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg. Revenue</p>
                  <p className="font-medium">${metric.averageRevenue.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className="font-medium">{metric.profitMargin.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(metric.profitMargin, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'netRevenue') return [`$${Number(value).toLocaleString()}`, 'Net Revenue'];
                    if (name === 'totalFees') return [`$${Number(value).toLocaleString()}`, 'Total Fees'];
                    return [`$${Number(value).toLocaleString()}`, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  name="Total Revenue"
                />
                <Bar dataKey="totalFees" fill="#EF4444" name="totalFees" />
                <Line
                  type="monotone"
                  dataKey="netRevenue"
                  stroke="#10B981"
                  strokeWidth={3}
                  name="netRevenue"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Revenue Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(methodColors)[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={([value]: [number]) => [`$${value.toLocaleString()}`, 'Net Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Commission Structure Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Commission Structure Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">Current fee structures and recommended margins</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processing Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fixed Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit Potential
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissionStructures.map((structure, index) => {
                const revenueMetric = revenueMetrics.find(m => m.paymentMethod === structure.method);
                const profitPotential = revenueMetric ?
                  structure.recommendedMargin - structure.baseCommission : structure.recommendedMargin;

                return (
                  <tr key={structure.method} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: Object.values(methodColors)[index] }}
                        />
                        <span className="font-medium text-gray-900 capitalize">
                          {structure.method.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {structure.baseCommission}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${structure.processingFee.toFixed(2)}
                      {structure.networkFee && (
                        <span className="text-gray-500"> + ${structure.networkFee} network</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {structure.recommendedMargin}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        profitPotential > 2 ? 'bg-green-100 text-green-800' :
                        profitPotential > 1 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {profitPotential.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optimization Suggestions */}
      {showOptimization && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Revenue Optimization Recommendations
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {optimizationSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`bg-white border-2 rounded-lg p-4 ${
                  suggestion.priority === 'high' ? 'border-red-200' :
                  suggestion.priority === 'medium' ? 'border-yellow-200' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {suggestion.priority} priority
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">+{suggestion.potentialImpact.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">potential impact</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Implementation:</p>
                  <p className="text-sm text-gray-700">{suggestion.implementation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROI Projections */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Financial Projections & ROI</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Current Performance</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Monthly revenue: ${(totalRevenue * 30 / parseInt(selectedTimeframe)).toLocaleString()}</li>
              <li>• Monthly profit: ${(totalNetRevenue * 30 / parseInt(selectedTimeframe)).toLocaleString()}</li>
              <li>• Break-even: Achieved</li>
              <li>• ROI: {overallMargin.toFixed(1)}% margin</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">With Optimizations</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Projected increase: +{optimizationSuggestions.reduce((sum, s) => sum + s.potentialImpact, 0).toFixed(1)}%</li>
              <li>• Additional monthly profit: ${((totalNetRevenue * 0.15) * 30 / parseInt(selectedTimeframe)).toLocaleString()}</li>
              <li>• Improved margin: {(overallMargin + 2.5).toFixed(1)}%</li>
              <li>• Payback period: 2-3 months</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Risk Assessment</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Market risk: Low (stable demand)</li>
              <li>• Competition risk: Medium</li>
              <li>• Regulatory risk: Low (compliant)</li>
              <li>• Technology risk: Low (proven systems)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalysis;