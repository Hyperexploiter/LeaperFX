/**
 * Data Source Status Component
 * Shows real-time health status of all data feeds
 */

import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import unifiedDataAggregator from '../services/unifiedDataAggregator';

interface SourceStatus {
  source: string;
  connected: boolean;
  lastUpdate: number;
  errorCount: number;
  health: 'healthy' | 'degraded' | 'error';
}

interface HealthMetrics {
  overall: 'healthy' | 'degraded' | 'error';
  sources: Map<string, SourceStatus>;
  fxRatesAge: number;
}

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  coinbase: 'Coinbase (Crypto)',
  fxapi: 'FX API (Forex)',
  twelvedata: 'TwelveData (Commodities)',
  alpaca: 'Alpaca (US Markets)',
  polygon: 'Polygon (Backup)',
  finnhub: 'Finnhub (Fallback)',
  bankofcanada: 'Bank of Canada (Yields)'
};

const DataSourceStatus: React.FC = () => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    const updateStatus = () => {
      const metrics = unifiedDataAggregator.getHealthStatus();
      setHealthMetrics(metrics);
      setLastRefresh(Date.now());
    };

    // Initial fetch
    updateStatus();

    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (health: 'healthy' | 'degraded' | 'error') => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (health: 'healthy' | 'degraded' | 'error') => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
    }
  };

  const formatTimeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const formatFXAge = (ageMs: number) => {
    const minutes = Math.floor(ageMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min old`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hr old`;
  };

  if (!healthMetrics) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
        <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-xs text-gray-400">Initializing feeds...</span>
      </div>
    );
  }

  const sourcesArray = Array.from(healthMetrics.sources.entries());
  const healthyCount = sourcesArray.filter(([_, s]) => s.health === 'healthy').length;
  const totalCount = sourcesArray.length;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      {/* Compact Status Bar */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Overall Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(healthMetrics.overall)} animate-pulse`} />
            <span className="text-xs font-medium text-gray-300">
              Data Feeds
            </span>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{healthyCount}/{totalCount} active</span>
            <span className="text-gray-600">|</span>
            <span>FX: {formatFXAge(healthMetrics.fxRatesAge)}</span>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {healthMetrics.overall === 'healthy' ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : healthMetrics.overall === 'degraded' ? (
            <Activity className="w-4 h-4 text-yellow-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <RefreshCw className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-800">
          <div className="px-3 py-2 space-y-2">
            {sourcesArray.map(([sourceKey, status]) => (
              <div
                key={sourceKey}
                className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-800/30"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.health)}
                  <span className="text-xs font-medium text-gray-300">
                    {SOURCE_DISPLAY_NAMES[sourceKey] || sourceKey}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {status.errorCount > 0 && (
                    <span className="text-red-400">
                      {status.errorCount} errors
                    </span>
                  )}
                  <span>{formatTimeSince(status.lastUpdate)}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${status.connected ? 'bg-green-500' : 'bg-gray-600'}`} />
                </div>
              </div>
            ))}

            {/* Last Refresh */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-700">
              <span className="text-xs text-gray-500">Last checked</span>
              <span className="text-xs text-gray-400">{formatTimeSince(lastRefresh)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourceStatus;

/**
 * Minimal Status Badge Component for Header
 */
export const DataStatusBadge: React.FC = () => {
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'error'>('healthy');

  useEffect(() => {
    const updateHealth = () => {
      const metrics = unifiedDataAggregator.getHealthStatus();
      setHealth(metrics.overall);
    };

    updateHealth();
    const interval = setInterval(updateHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const getColor = () => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const getIcon = () => {
    switch (health) {
      case 'healthy':
        return <Wifi className="w-3 h-3" />;
      case 'degraded':
        return <Activity className="w-3 h-3" />;
      case 'error':
        return <WifiOff className="w-3 h-3" />;
    }
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${getColor()}`}>
      {getIcon()}
      <span className="text-xs font-medium capitalize">{health}</span>
    </div>
  );
};