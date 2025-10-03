import React, { useState } from 'react';
import {
  Monitor,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  CreditCard,
  Settings,
  Power,
  RotateCcw
} from 'lucide-react';
import type { TerminalDevice } from '../../types';

interface DeviceStatusProps {
  device: TerminalDevice;
  isConnected: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReboot?: () => void;
  compact?: boolean;
}

const DeviceStatus: React.FC<DeviceStatusProps> = ({
  device,
  isConnected,
  onConnect,
  onDisconnect,
  onReboot,
  compact = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      case 'needs_reboot':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4" />;
      case 'busy':
        return <Clock className="h-4 w-4" />;
      case 'offline':
        return <XCircle className="h-4 w-4" />;
      case 'needs_reboot':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getBatteryIcon = (level?: number) => {
    if (level === undefined) return null;

    if (level <= 20) {
      return <BatteryLow className="h-4 w-4 text-red-500" />;
    }
    return <Battery className="h-4 w-4 text-green-500" />;
  };

  const getSignalIcon = (device: TerminalDevice) => {
    // Simulate signal strength based on last seen
    const lastSeenTime = new Date(device.lastSeen).getTime();
    const now = Date.now();
    const minutesAgo = (now - lastSeenTime) / (1000 * 60);

    if (minutesAgo < 1) {
      return <SignalHigh className="h-4 w-4 text-green-500" />;
    } else if (minutesAgo < 5) {
      return <SignalMedium className="h-4 w-4 text-yellow-500" />;
    } else if (minutesAgo < 30) {
      return <SignalLow className="h-4 w-4 text-orange-500" />;
    }
    return <Signal className="h-4 w-4 text-red-500" />;
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getDeviceTypeDisplay = (deviceType: string) => {
    switch (deviceType) {
      case 'verifone_P400':
        return 'Verifone P400';
      case 'bbpos_wisepad3':
        return 'BBPOS WisePad3';
      case 'simulated_wisepos_e':
        return 'Simulated WisePOS E';
      default:
        return deviceType;
    }
  };

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('Device action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <Monitor className="h-5 w-5 text-gray-600" />
          <div>
            <div className="font-medium text-gray-900">{device.label}</div>
            <div className="text-sm text-gray-500">{getDeviceTypeDisplay(device.deviceType)}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
            {getStatusIcon(device.status)}
            <span className="ml-1 capitalize">{device.status}</span>
          </span>

          {isConnected && (
            <div className="flex items-center text-green-600">
              <Wifi className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <Monitor className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{device.label}</h4>
            <p className="text-sm text-gray-500">{getDeviceTypeDisplay(device.deviceType)}</p>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded-full">
            <Wifi className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(device.status)}`}>
            {getStatusIcon(device.status)}
            <span className="ml-2 capitalize">{device.status}</span>
          </span>

          <div className="flex items-center space-x-2">
            {getBatteryIcon(device.batteryLevel)}
            {device.batteryLevel && (
              <span className="text-sm text-gray-600">{device.batteryLevel}%</span>
            )}
            {getSignalIcon(device)}
          </div>
        </div>
      </div>

      {/* Device Information */}
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Serial Number:</span>
            <div className="text-gray-900">{device.serialNumber}</div>
          </div>
          <div>
            <span className="font-medium text-gray-500">Software:</span>
            <div className="text-gray-900">{device.softwareVersion}</div>
          </div>
        </div>

        {device.ipAddress && (
          <div className="text-sm">
            <span className="font-medium text-gray-500">IP Address:</span>
            <div className="text-gray-900">{device.ipAddress}</div>
          </div>
        )}

        <div className="text-sm">
          <span className="font-medium text-gray-500">Last Seen:</span>
          <div className="text-gray-900">{formatLastSeen(device.lastSeen)}</div>
        </div>
      </div>

      {/* Capabilities */}
      {device.capabilities && (
        <div className="mb-4">
          <span className="font-medium text-gray-500 text-sm block mb-2">Capabilities:</span>
          <div className="flex flex-wrap gap-1">
            {device.capabilities.contactless && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                <Zap className="h-3 w-3 mr-1" />
                Contactless
              </span>
            )}
            {device.capabilities.chip && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                <CreditCard className="h-3 w-3 mr-1" />
                Chip
              </span>
            )}
            {device.capabilities.magstripe && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                <Settings className="h-3 w-3 mr-1" />
                Magstripe
              </span>
            )}
            {device.capabilities.pinEntry && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                <Settings className="h-3 w-3 mr-1" />
                PIN Entry
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
        {isConnected ? (
          <button
            onClick={() => onDisconnect && handleAction(onDisconnect)}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
          >
            <WifiOff className="h-4 w-4 mr-1" />
            Disconnect
          </button>
        ) : (
          <button
            onClick={() => onConnect && handleAction(onConnect)}
            disabled={isLoading || device.status === 'offline'}
            className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
          >
            <Wifi className="h-4 w-4 mr-1" />
            Connect
          </button>
        )}

        {device.status === 'needs_reboot' && onReboot && (
          <button
            onClick={() => handleAction(onReboot)}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors disabled:opacity-50 text-sm"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reboot
          </button>
        )}

        <button
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          title="Device Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default DeviceStatus;