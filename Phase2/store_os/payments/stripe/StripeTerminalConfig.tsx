import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wifi,
  WifiOff,
  Settings,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { paymentServices } from '../../index';
import type { TerminalDevice, ConnectionStatus, TerminalConfiguration } from '../../types';

interface StripeTerminalConfigProps {
  onRefresh?: () => void;
}

const StripeTerminalConfig: React.FC<StripeTerminalConfigProps> = ({ onRefresh }) => {
  const [devices, setDevices] = useState<TerminalDevice[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [config, setConfig] = useState<TerminalConfiguration>({
    apiKey: '',
    environment: 'test',
    merchantDisplayName: '',
    locationId: '',
    autoConnect: true,
    defaultReceiptEmail: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDevicesAndStatus();
  }, []);

  const loadDevicesAndStatus = async () => {
    setIsLoading(true);
    try {
      const status = paymentServices.terminal.getConnectionStatus();
      setConnectionStatus(status);

      if (paymentServices.main.getSystemStatus().stripeTerminal.initialized) {
        const availableDevices = await paymentServices.terminal.discoverDevices();
        setDevices(availableDevices);
      }
    } catch (err) {
      setError('Failed to load terminal status');
      console.error('Error loading terminal status:', err);
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

  const handleConnectDevice = async (deviceId: string) => {
    setIsConnecting(true);
    setError(null);
    try {
      const connected = await paymentServices.terminal.connectToDevice(deviceId);
      if (connected) {
        setSuccess('Device connected successfully');
        loadDevicesAndStatus();
        onRefresh?.();
      } else {
        setError('Failed to connect to device');
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Connection failed');
      console.error('Error connecting to device:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await paymentServices.terminal.disconnect();
      setSuccess('Device disconnected');
      loadDevicesAndStatus();
      onRefresh?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to disconnect');
      console.error('Error disconnecting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const initialized = await paymentServices.terminal.initialize(config);
      if (initialized) {
        setSuccess('Configuration saved successfully');
        loadDevicesAndStatus();
        onRefresh?.();
      } else {
        setError('Failed to initialize with new configuration');
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save configuration');
      console.error('Error saving config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'not_connected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
      case 'needs_reboot':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Terminal Status</h3>

        {connectionStatus && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(connectionStatus.status)}
              <span className="ml-2 font-medium text-gray-900 capitalize">
                {connectionStatus.status.replace('_', ' ')}
              </span>
            </div>

            {connectionStatus.device && (
              <div className="text-sm text-gray-600">
                Connected to: {connectionStatus.device.label}
              </div>
            )}

            {connectionStatus.status === 'connected' && (
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                <WifiOff className="h-4 w-4 mr-1" />
                Disconnect
              </button>
            )}
          </div>
        )}

        {connectionStatus?.connectionError && (
          <div className="mt-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
            {connectionStatus.connectionError}
          </div>
        )}
      </div>

      {/* Configuration Section */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Terminal Configuration</h3>
          <button
            onClick={handleSaveConfig}
            disabled={isLoading || !config.apiKey || !config.merchantDisplayName}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Config
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className="w-full pr-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="sk_test_..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Environment
            </label>
            <select
              value={config.environment}
              onChange={(e) => setConfig(prev => ({ ...prev, environment: e.target.value as 'test' | 'live' }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merchant Display Name *
            </label>
            <input
              type="text"
              value={config.merchantDisplayName}
              onChange={(e) => setConfig(prev => ({ ...prev, merchantDisplayName: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your Business Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location ID
            </label>
            <input
              type="text"
              value={config.locationId}
              onChange={(e) => setConfig(prev => ({ ...prev, locationId: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tml_..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Receipt Email
            </label>
            <input
              type="email"
              value={config.defaultReceiptEmail}
              onChange={(e) => setConfig(prev => ({ ...prev, defaultReceiptEmail: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="receipts@yourstore.com"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoConnect"
              checked={config.autoConnect}
              onChange={(e) => setConfig(prev => ({ ...prev, autoConnect: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoConnect" className="ml-2 block text-sm text-gray-900">
              Auto-connect to available devices
            </label>
          </div>
        </div>
      </div>

      {/* Devices Section */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Available Devices</h3>
          <button
            onClick={handleDiscoverDevices}
            disabled={isDiscovering}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
            Discover Devices
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">No devices found</p>
            <p className="mt-2">Make sure your terminal devices are powered on and nearby</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => (
              <div key={device.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{device.label}</h4>
                    <p className="text-sm text-gray-500">{device.deviceType}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDeviceStatusColor(device.status)}`}>
                    {device.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div>Serial: {device.serialNumber}</div>
                  <div>Software: {device.softwareVersion}</div>
                  {device.ipAddress && <div>IP: {device.ipAddress}</div>}
                  {device.batteryLevel && (
                    <div>Battery: {device.batteryLevel}%</div>
                  )}
                  <div>Last Seen: {new Date(device.lastSeen).toLocaleString()}</div>
                </div>

                {device.capabilities && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {device.capabilities.contactless && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Contactless</span>
                    )}
                    {device.capabilities.chip && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Chip</span>
                    )}
                    {device.capabilities.magstripe && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Magstripe</span>
                    )}
                    {device.capabilities.pinEntry && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">PIN Entry</span>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  {connectionStatus?.device?.id === device.id ? (
                    <span className="flex items-center text-green-600 text-sm font-medium">
                      <Wifi className="h-4 w-4 mr-1" />
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnectDevice(device.id)}
                      disabled={isConnecting || device.status === 'offline'}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Wifi className="h-4 w-4 mr-1" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

export default StripeTerminalConfig;