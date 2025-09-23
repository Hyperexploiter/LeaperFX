import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Shield, Zap, Info } from 'lucide-react';
import StripeTerminalConfig from './StripeTerminalConfig';
import CryptoPaymentConfig from './CryptoPaymentConfig';
import PaymentMethodsList from './PaymentMethodsList';
import { paymentServices } from '../../index';
import type { PaymentSystemStatus } from '../../types';

type TabType = 'overview' | 'terminal' | 'crypto' | 'methods';

interface PaymentSettingsProps {
  className?: string;
}

const PaymentSettings: React.FC<PaymentSettingsProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [systemStatus, setSystemStatus] = useState<PaymentSystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = paymentServices.main.getSystemStatus();
      setSystemStatus(status);
    } catch (err) {
      setError('Failed to load system status');
      console.error('Error loading payment system status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: Info,
      description: 'System status and overview'
    },
    {
      id: 'terminal' as TabType,
      label: 'Stripe Terminal',
      icon: CreditCard,
      description: 'Terminal device configuration'
    },
    {
      id: 'crypto' as TabType,
      label: 'Cryptocurrency',
      icon: Zap,
      description: 'Crypto payment settings'
    },
    {
      id: 'methods' as TabType,
      label: 'Payment Methods',
      icon: Shield,
      description: 'Manage payment methods'
    }
  ];

  const SystemOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment System Status</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : systemStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Overall Status */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Overall Status</span>
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus.overall.status === 'fully_operational' ? 'bg-green-500' :
                  systemStatus.overall.status === 'partial_operational' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
              </div>
              <div className="text-lg font-semibold text-gray-900 capitalize">
                {systemStatus.overall.status.replace('_', ' ')}
              </div>
              <div className="text-sm text-gray-500">
                {systemStatus.overall.operationalSystems} of {systemStatus.overall.totalSystems} systems online
              </div>
            </div>

            {/* Stripe Terminal Status */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Stripe Terminal</span>
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus.stripeTerminal.initialized &&
                  systemStatus.stripeTerminal.health.status === 'healthy' ? 'bg-green-500' :
                  'bg-red-500'
                }`} />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {systemStatus.stripeTerminal.initialized ? 'Online' : 'Offline'}
              </div>
              <div className="text-sm text-gray-500">
                {systemStatus.stripeTerminal.availableDevices.length} device(s) available
              </div>
            </div>

            {/* Cryptocurrency Status */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Cryptocurrency</span>
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus.cryptocurrency.initialized &&
                  systemStatus.cryptocurrency.health.status === 'healthy' ? 'bg-green-500' :
                  'bg-red-500'
                }`} />
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {systemStatus.cryptocurrency.initialized ? 'Online' : 'Offline'}
              </div>
              <div className="text-sm text-gray-500">
                {systemStatus.cryptocurrency.supportedCurrencies.length} currencies supported
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('terminal')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Configure Terminal</div>
              <div className="text-sm text-gray-500">Setup Stripe terminal devices</div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('crypto')}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <Zap className="h-6 w-6 text-blue-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Crypto Settings</div>
              <div className="text-sm text-gray-500">Manage cryptocurrency options</div>
            </div>
          </button>
        </div>
      </div>

      {/* System Information */}
      {systemStatus && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Health Check</dt>
              <dd className="text-sm text-gray-900">
                {new Date(systemStatus.overall.lastHealthCheck).toLocaleString()}
              </dd>
            </div>
            {systemStatus.cryptocurrency.lastRateUpdate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Rate Update</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(systemStatus.cryptocurrency.lastRateUpdate).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SystemOverview />;
      case 'terminal':
        return <StripeTerminalConfig onRefresh={loadSystemStatus} />;
      case 'crypto':
        return <CryptoPaymentConfig onRefresh={loadSystemStatus} />;
      case 'methods':
        return <PaymentMethodsList />;
      default:
        return <SystemOverview />;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-md ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <Settings className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Payment Settings</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title={tab.description}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PaymentSettings;