import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Wifi,
  WifiOff,
  Power,
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings,
  Activity,
  Battery,
  CheckCircle
} from 'lucide-react';
import DeviceStatus from './DeviceStatus';
import ConnectionWizard from './ConnectionWizard';
import { paymentServices } from '../../index';
import type { TerminalDevice, ConnectionStatus, TerminalPaymentRequest } from '../../types';

interface TerminalManagerProps {
  className?: string;
}

type ViewMode = 'dashboard' | 'devices' | 'wizard' | 'test';

const TerminalManager: React.FC<TerminalManagerProps> = ({ className = '' }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [devices, setDevices] = useState<TerminalDevice[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isTestingPayment, setIsTestingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTerminalData();
  }, []);

  const loadTerminalData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const status = paymentServices.terminal.getConnectionStatus();
      setConnectionStatus(status);

      const availableDevices = await paymentServices.terminal.discoverDevices();
      setDevices(availableDevices);
    } catch (err) {
      setError('Failed to load terminal data');
      console.error('Error loading terminal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscoverDevices = async () => {
    setIsDiscovering(true);
    setError(null);
    try {
      const discoveredDevices = await paymentServices.terminal.discoverDevices();
      setDevices(discoveredDevices);
      setSuccess(`Found ${discoveredDevices.length} device(s)`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to discover devices');
      console.error('Error discovering devices:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleTestPayment = async () => {
    if (!connectionStatus?.device) {
      setError('No device connected for testing');
      return;
    }

    setIsTestingPayment(true);
    setError(null);
    try {
      const testRequest: TerminalPaymentRequest = {
        amount: 100, // $1.00 test payment (in cents)
        currency: 'CAD',
        description: 'Terminal test payment',
        metadata: { test: 'true' },
        receiptEmail: 'test@example.com'
      };

      const result = await paymentServices.terminal.processPayment(testRequest);

      if (result.success) {
        setSuccess('Test payment completed successfully!');
      } else {
        setError(`Test payment failed: ${result.error}`);
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError('Test payment failed');
      console.error('Error testing payment:', err);
    } finally {
      setIsTestingPayment(false);
    }
  };

  const getDashboardStats = () => {
    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const connectedDevice = connectionStatus?.device;
    const hasActiveConnection = connectionStatus?.status === 'connected';

    return {
      totalDevices: devices.length,
      onlineDevices,
      connectedDevices: hasActiveConnection ? 1 : 0,
      operationalStatus: hasActiveConnection ? 'operational' : 'disconnected'
    };
  };

  const renderDashboard = () => {
    const stats = getDashboardStats();

    return (
      <div className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDevices}</p>
              </div>
              <Monitor className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-2xl font-bold text-gray-900">{stats.onlineDevices}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.connectedDevices}</p>
              </div>
              {stats.connectedDevices > 0 ? (
                <Wifi className="h-8 w-8 text-green-500" />
              ) : (
                <WifiOff className="h-8 w-8 text-gray-400" />
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className={`text-lg font-semibold capitalize ${
                  stats.operationalStatus === 'operational' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.operationalStatus}
                </p>
              </div>
              {stats.operationalStatus === 'operational' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {connectionStatus && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Current Connection</h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  connectionStatus.status === 'connected' ? 'bg-green-500' :
                  connectionStatus.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                <span className="font-medium text-blue-900 capitalize">
                  {connectionStatus.status.replace('_', ' ')}
                </span>
              </div>

              {connectionStatus.device && (
                <div className="text-blue-800">
                  {connectionStatus.device.label} ({connectionStatus.device.deviceType})
                </div>
              )}
            </div>

            {connectionStatus.connectionError && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                {connectionStatus.connectionError}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setViewMode('wizard')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Plus className="h-6 w-6 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Connect Device</div>
                <div className="text-sm text-gray-500">Set up a new terminal</div>
              </div>
            </button>

            <button
              onClick={handleDiscoverDevices}
              disabled={isDiscovering}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-6 w-6 text-green-600 mr-3 ${isDiscovering ? 'animate-spin' : ''}`} />
              <div className="text-left">
                <div className="font-medium text-gray-900">Discover Devices</div>
                <div className="text-sm text-gray-500">Scan for terminals</div>
              </div>
            </button>

            <button
              onClick={handleTestPayment}
              disabled={isTestingPayment || !connectionStatus?.device}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-50"
            >
              <Power className={`h-6 w-6 text-purple-600 mr-3 ${isTestingPayment ? 'animate-pulse' : ''}`} />
              <div className="text-left">
                <div className="font-medium text-gray-900">Test Payment</div>
                <div className="text-sm text-gray-500">Run $1.00 test</div>
              </div>
            </button>
          </div>
        </div>

        {/* Connected Device Details */}
        {connectionStatus?.device && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Device</h3>
            <DeviceStatus device={connectionStatus.device} isConnected={true} />
          </div>
        )}
      </div>
    );
  };

  const renderDevicesList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">All Devices</h3>
        <button
          onClick={handleDiscoverDevices}
          disabled={isDiscovering}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Monitor className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl font-medium">No devices found</p>
          <p className="mt-2">Make sure your terminal devices are powered on and nearby</p>
          <button
            onClick={() => setViewMode('wizard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect New Device
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <DeviceStatus
              key={device.id}
              device={device}
              isConnected={connectionStatus?.device?.id === device.id}
              onConnect={() => {/* Handle connect logic */}}
              onDisconnect={() => {/* Handle disconnect logic */}}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'dashboard':
        return renderDashboard();
      case 'devices':
        return renderDevicesList();
      case 'wizard':
        return (
          <ConnectionWizard
            onComplete={() => {
              setViewMode('dashboard');
              loadTerminalData();
            }}
            onCancel={() => setViewMode('dashboard')}
          />
        );
      case 'test':
        return <div>Test mode - coming soon</div>;
      default:
        return renderDashboard();
    }
  };

  const tabs = [
    { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: Activity },
    { id: 'devices' as ViewMode, label: 'Devices', icon: Monitor },
    { id: 'wizard' as ViewMode, label: 'Setup', icon: Settings }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-md ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Monitor className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">Terminal Manager</h2>
          </div>

          {connectionStatus?.device && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Connected to {connectionStatus.device.label}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderContent()}
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mx-6 mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
};

export default TerminalManager;