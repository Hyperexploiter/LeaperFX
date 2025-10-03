import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Terminal, DollarSign, TrendingUp, Activity } from 'lucide-react';
import PaymentMethodBreakdown from './PaymentMethodBreakdown';
import TerminalPerformance from './TerminalPerformance';
import CryptoAnalytics from './CryptoAnalytics';
import RevenueAnalysis from './RevenueAnalysis';
import PaymentTrends from './PaymentTrends';
import paymentProcessingService from '../../../paymentProcessingService';
import type { PaymentAnalytics as PaymentAnalyticsType, UnifiedPaymentResult } from '../../../types';

interface PaymentAnalyticsProps {
  className?: string;
}

type AnalyticsView = 'overview' | 'methods' | 'terminals' | 'crypto' | 'revenue' | 'trends';

interface AnalyticsTab {
  id: AnalyticsView;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({ className = '' }) => {
  const [activeView, setActiveView] = useState<AnalyticsView>('overview');
  const [analytics, setAnalytics] = useState<PaymentAnalyticsType | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<UnifiedPaymentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const tabs: AnalyticsTab[] = [
    { id: 'overview', name: 'Overview', icon: BarChart3, description: 'Complete payment analytics overview' },
    { id: 'methods', name: 'Payment Methods', icon: PieChart, description: 'Payment method distribution and performance' },
    { id: 'terminals', name: 'Terminal Performance', icon: Terminal, description: 'Device utilization and success rates' },
    { id: 'crypto', name: 'Crypto Analytics', icon: DollarSign, description: 'Cryptocurrency transaction analysis' },
    { id: 'revenue', name: 'Revenue Analysis', icon: TrendingUp, description: 'Commission and fee optimization' },
    { id: 'trends', name: 'Payment Trends', icon: Activity, description: 'Time-based patterns and peak hours' }
  ];

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get payment analytics from the service
        const analyticsData = paymentProcessingService.getPaymentAnalytics();
        const paymentHistoryData = paymentProcessingService.getPaymentHistory(200);

        setAnalytics(analyticsData);
        setPaymentHistory(paymentHistoryData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to load payment analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();

    // Listen for real-time payment events
    const handlePaymentEvent = () => {
      loadAnalyticsData();
    };

    window.addEventListener('payment_completed', handlePaymentEvent);
    window.addEventListener('payment_failed', handlePaymentEvent);

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalyticsData, 30000);

    return () => {
      window.removeEventListener('payment_completed', handlePaymentEvent);
      window.removeEventListener('payment_failed', handlePaymentEvent);
      clearInterval(interval);
    };
  }, []);

  const renderAnalyticsView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading payment analytics...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Analytics Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (!analytics) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      );
    }

    switch (activeView) {
      case 'overview':
        return <OverviewDashboard analytics={analytics} paymentHistory={paymentHistory} />;
      case 'methods':
        return <PaymentMethodBreakdown analytics={analytics} paymentHistory={paymentHistory} />;
      case 'terminals':
        return <TerminalPerformance analytics={analytics} paymentHistory={paymentHistory} />;
      case 'crypto':
        return <CryptoAnalytics analytics={analytics} paymentHistory={paymentHistory} />;
      case 'revenue':
        return <RevenueAnalysis analytics={analytics} paymentHistory={paymentHistory} />;
      case 'trends':
        return <PaymentTrends analytics={analytics} paymentHistory={paymentHistory} />;
      default:
        return <div className="text-center py-12"><p className="text-gray-500">View not found</p></div>;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Analytics Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive payment system analysis and business intelligence
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-900">
              {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 py-2 border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-1" aria-label="Analytics tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`group inline-flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                activeView === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              title={tab.description}
            >
              <tab.icon
                className={`mr-2 h-4 w-4 ${
                  activeView === tab.id ? 'text-blue-500' : 'text-gray-400'
                }`}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderAnalyticsView()}
      </div>
    </div>
  );
};

// Overview Dashboard Component
const OverviewDashboard: React.FC<{
  analytics: PaymentAnalyticsType;
  paymentHistory: UnifiedPaymentResult[];
}> = ({ analytics, paymentHistory }) => {
  const todayTotal = analytics.today.totalVolume;
  const todayTransactions = analytics.today.totalTransactions;
  const successRate = paymentHistory.length > 0
    ? (paymentHistory.filter(p => p.success).length / paymentHistory.length) * 100
    : 0;
  const avgTransactionValue = todayTransactions > 0 ? todayTotal / todayTransactions : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Today's Volume</p>
              <p className="text-2xl font-bold">${todayTotal.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Transactions</p>
              <p className="text-2xl font-bold">{todayTransactions}</p>
            </div>
            <Activity className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Success Rate</p>
              <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Avg. Transaction</p>
              <p className="text-2xl font-bold">${avgTransactionValue.toFixed(0)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Distribution</h3>
          <div className="space-y-3">
            {analytics.byMethod.map((method, index) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {method.method.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    ${method.volume.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{method.count} txns</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Terminal Payments</span>
              <span className="text-sm font-medium text-green-600">{analytics.today.terminalPayments} successful</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Crypto Payments</span>
              <span className="text-sm font-medium text-blue-600">{analytics.today.cryptoPayments} processed</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cash Payments</span>
              <span className="text-sm font-medium text-purple-600">{analytics.today.cashPayments} recorded</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failed Payments</span>
              <span className={`text-sm font-medium ${analytics.today.failedPayments > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {analytics.today.failedPayments} errors
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('exportPaymentReport'))}
            className="bg-white border border-blue-200 rounded-lg p-3 text-center hover:bg-blue-50 transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-700">Export Report</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('refreshAnalytics'))}
            className="bg-white border border-blue-200 rounded-lg p-3 text-center hover:bg-blue-50 transition-colors"
          >
            <Activity className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-700">Refresh Data</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('viewComplianceReports'))}
            className="bg-white border border-blue-200 rounded-lg p-3 text-center hover:bg-blue-50 transition-colors"
          >
            <Terminal className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-700">Compliance</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('optimizeSettings'))}
            className="bg-white border border-blue-200 rounded-lg p-3 text-center hover:bg-blue-50 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-700">Optimize</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalytics;