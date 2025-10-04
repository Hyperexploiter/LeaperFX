import React, { useState, useCallback } from 'react';
import { Globe, Wifi, Clock, AlertCircle, Star, StarOff, RotateCcw, Activity, Shield, TrendingUp } from 'lucide-react';

interface ProvidersPanelProps {
  configuration: any;
  onConfigurationChange: (category: string, key: string, value: any) => void;
  previewMode: boolean;
  onPreviewChange?: (category: string, key: string, value: any) => void;
  favorites: Set<string>;
  onToggleFavorite: (key: string) => void;
  searchQuery?: string;
}

interface ProviderSetting {
  key: string;
  label: string;
  description: string;
  type: 'number' | 'boolean' | 'select' | 'priority';
  value: any;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  category: 'priorities' | 'timeouts' | 'health' | 'fallback';
  icon: React.ReactNode;
  reliability: 'high' | 'medium' | 'low';
  defaultValue: any;
  provider?: string;
}

const PROVIDER_SETTINGS: ProviderSetting[] = [
  // API Priorities
  {
    key: 'polygonPriority',
    label: 'Polygon.io Priority',
    description: 'Priority level for Polygon.io data feeds',
    type: 'priority',
    value: 1,
    min: 1,
    max: 5,
    category: 'priorities',
    icon: <Globe className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: 1,
    provider: 'polygon'
  },
  {
    key: 'alphaPriority',
    label: 'Alpha Vantage Priority',
    description: 'Priority level for Alpha Vantage data feeds',
    type: 'priority',
    value: 2,
    min: 1,
    max: 5,
    category: 'priorities',
    icon: <Globe className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: 2,
    provider: 'alpha'
  },
  {
    key: 'finnhubPriority',
    label: 'Finnhub Priority',
    description: 'Priority level for Finnhub data feeds',
    type: 'priority',
    value: 3,
    min: 1,
    max: 5,
    category: 'priorities',
    icon: <Globe className="w-4 h-4" />,
    reliability: 'medium',
    defaultValue: 3,
    provider: 'finnhub'
  },
  {
    key: 'webSocketPriority',
    label: 'WebSocket Priority',
    description: 'Priority level for real-time WebSocket connections',
    type: 'priority',
    value: 1,
    min: 1,
    max: 5,
    category: 'priorities',
    icon: <Wifi className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: 1,
    provider: 'websocket'
  },

  // Timeouts
  {
    key: 'apiTimeout',
    label: 'API Request Timeout',
    description: 'Maximum time to wait for API responses',
    type: 'number',
    value: 10000,
    min: 1000,
    max: 30000,
    step: 1000,
    unit: 'ms',
    category: 'timeouts',
    icon: <Clock className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: 10000
  },
  {
    key: 'webSocketTimeout',
    label: 'WebSocket Timeout',
    description: 'Connection timeout for WebSocket streams',
    type: 'number',
    value: 5000,
    min: 1000,
    max: 15000,
    step: 500,
    unit: 'ms',
    category: 'timeouts',
    icon: <Wifi className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: 5000
  },
  {
    key: 'retryTimeout',
    label: 'Retry Timeout',
    description: 'Wait time before retrying failed requests',
    type: 'number',
    value: 2000,
    min: 500,
    max: 10000,
    step: 500,
    unit: 'ms',
    category: 'timeouts',
    icon: <Clock className="w-4 h-4" />,
    reliability: 'medium',
    defaultValue: 2000
  },
  {
    key: 'healthCheckInterval',
    label: 'Health Check Interval',
    description: 'How often to check provider health status',
    type: 'number',
    value: 30000,
    min: 10000,
    max: 120000,
    step: 5000,
    unit: 'ms',
    category: 'timeouts',
    icon: <Activity className="w-4 h-4" />,
    reliability: 'medium',
    defaultValue: 30000
  },

  // Health Monitoring
  {
    key: 'enableHealthMonitoring',
    label: 'Enable Health Monitoring',
    description: 'Monitor and track provider health status',
    type: 'boolean',
    value: true,
    category: 'health',
    icon: <Activity className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: true
  },
  {
    key: 'healthThreshold',
    label: 'Health Threshold',
    description: 'Success rate threshold for healthy providers',
    type: 'number',
    value: 90,
    min: 50,
    max: 100,
    step: 5,
    unit: '%',
    category: 'health',
    icon: <TrendingUp className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: 90
  },
  {
    key: 'degradedThreshold',
    label: 'Degraded Threshold',
    description: 'Success rate threshold for degraded providers',
    type: 'number',
    value: 70,
    min: 30,
    max: 90,
    step: 5,
    unit: '%',
    category: 'health',
    icon: <AlertCircle className="w-4 h-4" />,
    reliability: 'medium',
    defaultValue: 70
  },
  {
    key: 'maxFailures',
    label: 'Max Consecutive Failures',
    description: 'Number of failures before marking provider as unhealthy',
    type: 'number',
    value: 5,
    min: 2,
    max: 20,
    step: 1,
    category: 'health',
    icon: <AlertCircle className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: 5
  },

  // Fallback & Recovery
  {
    key: 'enableAutoFallback',
    label: 'Auto Fallback',
    description: 'Automatically switch to backup providers when primary fails',
    type: 'boolean',
    value: true,
    category: 'fallback',
    icon: <Shield className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: true
  },
  {
    key: 'fallbackStrategy',
    label: 'Fallback Strategy',
    description: 'How to handle provider failures',
    type: 'select',
    value: 'priority-order',
    options: [
      { value: 'priority-order', label: 'Priority Order' },
      { value: 'load-balance', label: 'Load Balance' },
      { value: 'fastest-first', label: 'Fastest First' },
      { value: 'manual', label: 'Manual Override' }
    ],
    category: 'fallback',
    icon: <Shield className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: 'priority-order'
  },
  {
    key: 'maxRetries',
    label: 'Max Retry Attempts',
    description: 'Maximum number of retry attempts per request',
    type: 'number',
    value: 3,
    min: 1,
    max: 10,
    step: 1,
    category: 'fallback',
    icon: <Activity className="w-4 h-4" />,
    reliability: 'medium',
    defaultValue: 3
  },
  {
    key: 'recoveryTime',
    label: 'Recovery Time',
    description: 'Time to wait before retrying failed providers',
    type: 'number',
    value: 60000,
    min: 10000,
    max: 300000,
    step: 10000,
    unit: 'ms',
    category: 'fallback',
    icon: <Clock className="w-4 h-4" />,
    reliability: 'medium',
    defaultValue: 60000
  },
  {
    key: 'enableCaching',
    label: 'Enable Response Caching',
    description: 'Cache API responses to reduce provider load',
    type: 'boolean',
    value: true,
    category: 'fallback',
    icon: <Activity className="w-4 h-4" />,
    reliability: 'high',
    defaultValue: true
  }
];

const PROVIDER_STATUS = {
  polygon: { name: 'Polygon.io', status: 'healthy', latency: 45, uptime: 99.9 },
  alpha: { name: 'Alpha Vantage', status: 'healthy', latency: 120, uptime: 99.5 },
  finnhub: { name: 'Finnhub', status: 'degraded', latency: 250, uptime: 95.2 },
  websocket: { name: 'WebSocket', status: 'healthy', latency: 15, uptime: 99.8 }
};

const categoryColors = {
  priorities: '#FFA500',
  timeouts: '#00D4FF',
  health: '#00FF88',
  fallback: '#FF4444'
};

const categoryIcons = {
  priorities: <TrendingUp className="w-4 h-4" />,
  timeouts: <Clock className="w-4 h-4" />,
  health: <Activity className="w-4 h-4" />,
  fallback: <Shield className="w-4 h-4" />
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return '#00FF88';
    case 'degraded': return '#FFB000';
    case 'unhealthy': return '#FF4444';
    default: return '#666';
  }
};

const getReliabilityColor = (reliability: string) => {
  switch (reliability) {
    case 'high': return '#00FF88';
    case 'medium': return '#FFB000';
    case 'low': return '#FF4444';
    default: return '#666';
  }
};

export const ProvidersPanel: React.FC<ProvidersPanelProps> = ({
  configuration,
  onConfigurationChange,
  previewMode,
  onPreviewChange,
  favorites,
  onToggleFavorite,
  searchQuery
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['priorities', 'timeouts', 'health', 'fallback'])
  );

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleValueChange = useCallback((setting: ProviderSetting, value: any) => {
    const changeHandler = previewMode ? onPreviewChange : onConfigurationChange;
    changeHandler?.('providers', setting.key, value);
  }, [previewMode, onConfigurationChange, onPreviewChange]);

  const resetToDefault = useCallback((setting: ProviderSetting) => {
    handleValueChange(setting, setting.defaultValue);
  }, [handleValueChange]);

  const getCurrentValue = useCallback((setting: ProviderSetting) => {
    return configuration?.providers?.[setting.key] ?? setting.value;
  }, [configuration]);

  const filteredSettings = searchQuery
    ? PROVIDER_SETTINGS.filter(setting =>
        setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : PROVIDER_SETTINGS;

  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, ProviderSetting[]>);

  const renderControl = (setting: ProviderSetting) => {
    const currentValue = getCurrentValue(setting);

    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={currentValue}
                onChange={(e) => handleValueChange(setting, e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-12 h-6 rounded-full transition-all duration-200 ${
                  currentValue
                    ? 'shadow-lg'
                    : 'bg-gray-600'
                }`}
                style={{
                  backgroundColor: currentValue ? categoryColors[setting.category] : undefined,
                  boxShadow: currentValue ? `0 0 10px ${categoryColors[setting.category]}40` : undefined
                }}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-0.5 ${
                    currentValue ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
            <span className="text-sm font-mono text-gray-300">
              {currentValue ? 'ENABLED' : 'DISABLED'}
            </span>
          </label>
        );

      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleValueChange(setting, e.target.value)}
            className="w-full px-3 py-2 font-mono border bg-transparent text-white"
            style={{
              borderColor: 'rgba(0, 212, 255, 0.3)',
              background: 'rgba(0, 20, 40, 0.3)'
            }}
          >
            {setting.options?.map(option => (
              <option key={option.value} value={option.value} className="bg-black">
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'priority':
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map(priority => (
                <button
                  key={priority}
                  onClick={() => handleValueChange(setting, priority)}
                  className={`w-8 h-8 rounded border-2 text-sm font-bold transition-all ${
                    currentValue === priority
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  style={{
                    borderColor: currentValue === priority ? categoryColors[setting.category] : 'rgba(0, 212, 255, 0.3)',
                    backgroundColor: currentValue === priority ? categoryColors[setting.category] : 'transparent'
                  }}
                >
                  {priority}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              1 = Highest Priority, 5 = Lowest Priority
            </div>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-3">
            {/* Slider */}
            {setting.min !== undefined && setting.max !== undefined && (
              <div className="relative">
                <input
                  type="range"
                  min={setting.min}
                  max={setting.max}
                  step={setting.step || 1}
                  value={currentValue}
                  onChange={(e) => handleValueChange(setting, Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, ${categoryColors[setting.category]} 0%, ${categoryColors[setting.category]} ${
                      ((currentValue - setting.min) / (setting.max - setting.min)) * 100
                    }%, rgba(255,255,255,0.1) ${
                      ((currentValue - setting.min) / (setting.max - setting.min)) * 100
                    }%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
                <style jsx>{`
                  .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: ${categoryColors[setting.category]};
                    border: 2px solid #000;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                  }
                `}</style>
              </div>
            )}

            {/* Number input */}
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min={setting.min}
                max={setting.max}
                step={setting.step || 1}
                value={currentValue}
                onChange={(e) => handleValueChange(setting, Number(e.target.value))}
                className="w-24 px-3 py-2 font-mono border bg-transparent text-center text-white"
                style={{
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                  background: 'rgba(0, 20, 40, 0.3)'
                }}
              />
              {setting.unit && (
                <span className="text-sm font-mono text-gray-400">
                  {setting.unit}
                </span>
              )}
              <div className="flex-1 text-right">
                <span className="text-sm font-mono" style={{ color: categoryColors[setting.category] }}>
                  {setting.unit === 'ms' && currentValue >= 1000
                    ? `${(currentValue / 1000).toFixed(1)}s`
                    : `${currentValue}${setting.unit || ''}`
                  }
                </span>
              </div>
            </div>

            {/* Range indicators */}
            {setting.min !== undefined && setting.max !== undefined && (
              <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>{setting.min}{setting.unit || ''}</span>
                <span>default: {setting.defaultValue}{setting.unit || ''}</span>
                <span>{setting.max}{setting.unit || ''}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6" style={{ color: '#FFA500' }} />
          <div>
            <h2 className="text-xl font-bold font-mono" style={{ color: '#FFA500' }}>
              PROVIDERS CONFIGURATION
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              API priorities, timeouts, health monitoring, and fallback strategies
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-gray-400">
          {filteredSettings.length} provider settings
        </div>
      </div>

      {/* Provider Status Overview */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-mono uppercase" style={{ color: '#FFA500' }}>
          Provider Status Overview
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PROVIDER_STATUS).map(([key, provider]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 border"
              style={{
                borderColor: `${getStatusColor(provider.status)}40`,
                background: `${getStatusColor(provider.status)}10`
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(provider.status) }}
                />
                <div>
                  <div className="font-bold text-sm text-white">
                    {provider.name}
                  </div>
                  <div className="text-xs" style={{ color: getStatusColor(provider.status) }}>
                    {provider.status.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="text-right text-xs font-mono text-gray-400">
                <div>{provider.latency}ms</div>
                <div>{provider.uptime}% uptime</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Categories */}
      <div className="space-y-4">
        {Object.entries(groupedSettings).map(([category, settings]) => (
          <div
            key={category}
            className="border rounded-none overflow-hidden"
            style={{
              borderColor: 'rgba(0, 212, 255, 0.2)',
              background: 'linear-gradient(135deg, rgba(0, 8, 20, 0.6) 0%, rgba(0, 20, 40, 0.4) 100%)'
            }}
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div style={{ color: categoryColors[category as keyof typeof categoryColors] }}>
                  {categoryIcons[category as keyof typeof categoryIcons]}
                </div>
                <div className="text-left">
                  <h3 className="font-bold font-mono uppercase text-sm" style={{
                    color: categoryColors[category as keyof typeof categoryColors]
                  }}>
                    {category} Settings
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {settings.length} provider parameters
                  </p>
                </div>
              </div>
              <div
                className={`transform transition-transform ${
                  expandedCategories.has(category) ? 'rotate-90' : ''
                }`}
                style={{ color: categoryColors[category as keyof typeof categoryColors] }}
              >
                ▶
              </div>
            </button>

            {/* Category Content */}
            {expandedCategories.has(category) && (
              <div className="border-t space-y-4 p-4" style={{ borderColor: 'rgba(0, 212, 255, 0.2)' }}>
                {settings.map((setting) => {
                  const currentValue = getCurrentValue(setting);
                  const isModified = currentValue !== setting.defaultValue;
                  const isFavorite = favorites.has(`providers.${setting.key}`);

                  return (
                    <div
                      key={setting.key}
                      className="flex items-start justify-between p-4 border rounded-none hover:bg-white/5 transition-all"
                      style={{
                        borderColor: isModified ? 'rgba(255, 165, 0, 0.3)' : 'rgba(0, 212, 255, 0.1)',
                        background: isModified ? 'rgba(255, 165, 0, 0.05)' : 'transparent'
                      }}
                    >
                      {/* Setting Info */}
                      <div className="flex-1 min-w-0 mr-6">
                        <div className="flex items-center space-x-3 mb-3">
                          <div style={{ color: categoryColors[setting.category] }}>
                            {setting.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold font-mono text-sm text-white">
                                {setting.label}
                              </h4>
                              {setting.provider && (
                                <span
                                  className="px-2 py-1 text-xs font-mono border rounded"
                                  style={{
                                    borderColor: 'rgba(0, 212, 255, 0.3)',
                                    background: 'rgba(0, 212, 255, 0.1)',
                                    color: '#00D4FF'
                                  }}
                                >
                                  {setting.provider.toUpperCase()}
                                </span>
                              )}
                              {isModified && (
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: '#FFA500' }}
                                  title="Modified from default"
                                />
                              )}
                              <button
                                onClick={() => onToggleFavorite(`providers.${setting.key}`)}
                                className="text-gray-500 hover:text-yellow-400 transition-colors"
                              >
                                {isFavorite ? (
                                  <Star className="w-3 h-3 fill-current text-yellow-400" />
                                ) : (
                                  <StarOff className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {setting.description}
                            </p>
                          </div>
                        </div>

                        {/* Reliability Indicator */}
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs text-gray-500">Reliability:</span>
                          <div className="flex items-center space-x-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getReliabilityColor(setting.reliability) }}
                            />
                            <span
                              className="text-xs uppercase font-mono"
                              style={{ color: getReliabilityColor(setting.reliability) }}
                            >
                              {setting.reliability}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex-shrink-0 w-80">
                        <div className="space-y-3">
                          {renderControl(setting)}

                          {isModified && (
                            <div className="flex justify-end">
                              <button
                                onClick={() => resetToDefault(setting)}
                                className="flex items-center space-x-1 px-3 py-1 text-xs border hover:border-orange-400/60 transition-colors"
                                style={{
                                  borderColor: 'rgba(255, 165, 0, 0.3)',
                                  color: '#FFA500'
                                }}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>RESET TO DEFAULT</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProvidersPanel;