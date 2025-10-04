import React, { useState, useCallback } from 'react';
import { Clock, RotateCw, Timer, Zap, Star, StarOff, AlertTriangle } from 'lucide-react';

interface TimingPanelProps {
  configuration: any;
  onConfigurationChange: (category: string, key: string, value: any) => void;
  previewMode: boolean;
  onPreviewChange?: (category: string, key: string, value: any) => void;
  favorites: Set<string>;
  onToggleFavorite: (key: string) => void;
  searchQuery?: string;
}

interface TimingSetting {
  key: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  category: 'refresh' | 'animation' | 'rotation' | 'performance';
  icon: React.ReactNode;
  performanceImpact: 'low' | 'medium' | 'high';
  defaultValue: number;
}

const TIMING_SETTINGS: TimingSetting[] = [
  // Refresh Intervals
  {
    key: 'marketDataRefresh',
    label: 'Market Data Refresh',
    description: 'How often to fetch new market data from providers',
    value: 5000,
    min: 1000,
    max: 60000,
    step: 1000,
    unit: 'ms',
    category: 'refresh',
    icon: <RotateCw className="w-4 h-4" />,
    performanceImpact: 'medium',
    defaultValue: 5000
  },
  {
    key: 'sparklineRefresh',
    label: 'Sparkline Refresh',
    description: 'Update frequency for real-time charts and sparklines',
    value: 100,
    min: 50,
    max: 1000,
    step: 50,
    unit: 'ms',
    category: 'refresh',
    icon: <Zap className="w-4 h-4" />,
    performanceImpact: 'high',
    defaultValue: 100
  },
  {
    key: 'websocketHeartbeat',
    label: 'WebSocket Heartbeat',
    description: 'Keep-alive interval for real-time connections',
    value: 30000,
    min: 10000,
    max: 120000,
    step: 5000,
    unit: 'ms',
    category: 'refresh',
    icon: <Clock className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: 30000
  },

  // Animation Timings
  {
    key: 'bluePulseSpeed',
    label: 'Blue Pulse Animation',
    description: 'Speed of the blue pulse overlay animation',
    value: 6000,
    min: 2000,
    max: 12000,
    step: 500,
    unit: 'ms',
    category: 'animation',
    icon: <div className="w-4 h-4 rounded-full border-2 border-current animate-pulse" />,
    performanceImpact: 'low',
    defaultValue: 6000
  },
  {
    key: 'priceFlashDuration',
    label: 'Price Flash Duration',
    description: 'How long price changes flash on screen',
    value: 600,
    min: 200,
    max: 2000,
    step: 100,
    unit: 'ms',
    category: 'animation',
    icon: <Zap className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: 600
  },
  {
    key: 'chartTransitionDuration',
    label: 'Chart Transitions',
    description: 'Smooth transition speed for chart updates',
    value: 300,
    min: 100,
    max: 1000,
    step: 50,
    unit: 'ms',
    category: 'animation',
    icon: <div className="w-4 h-4 border-b-2 border-current" />,
    performanceImpact: 'medium',
    defaultValue: 300
  },

  // Rotation Intervals
  {
    key: 'commodityRotation',
    label: 'Commodity Rotation',
    description: 'How often to rotate commodity cards in market watch',
    value: 21000,
    min: 10000,
    max: 120000,
    step: 5000,
    unit: 'ms',
    category: 'rotation',
    icon: <RotateCw className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: 21000
  },
  {
    key: 'cryptoBulletinRotation',
    label: 'Crypto Bulletin Rotation',
    description: 'Interval for switching between gainers and losers',
    value: 60000,
    min: 30000,
    max: 300000,
    step: 15000,
    unit: 'ms',
    category: 'rotation',
    icon: <Timer className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: 60000
  },

  // Performance Timings
  {
    key: 'frameRateTarget',
    label: 'Target Frame Rate',
    description: 'Desired FPS for smooth animations and updates',
    value: 60,
    min: 30,
    max: 120,
    step: 15,
    unit: 'fps',
    category: 'performance',
    icon: <Zap className="w-4 h-4" />,
    performanceImpact: 'high',
    defaultValue: 60
  },
  {
    key: 'debounceInterval',
    label: 'Input Debounce',
    description: 'Delay before processing rapid input changes',
    value: 300,
    min: 100,
    max: 1000,
    step: 50,
    unit: 'ms',
    category: 'performance',
    icon: <Timer className="w-4 h-4" />,
    performanceImpact: 'medium',
    defaultValue: 300
  }
];

const categoryColors = {
  refresh: '#00D4FF',
  animation: '#FFA500',
  rotation: '#00FF88',
  performance: '#FF4444'
};

const categoryIcons = {
  refresh: <RotateCw className="w-4 h-4" />,
  animation: <Zap className="w-4 h-4" />,
  rotation: <Timer className="w-4 h-4" />,
  performance: <div className="w-4 h-4 border-2 border-current" />
};

export const TimingPanel: React.FC<TimingPanelProps> = ({
  configuration,
  onConfigurationChange,
  previewMode,
  onPreviewChange,
  favorites,
  onToggleFavorite,
  searchQuery
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['refresh', 'animation', 'rotation', 'performance'])
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

  const handleValueChange = useCallback((setting: TimingSetting, value: number) => {
    const changeHandler = previewMode ? onPreviewChange : onConfigurationChange;
    changeHandler?.('timing', setting.key, value);
  }, [previewMode, onConfigurationChange, onPreviewChange]);

  const resetToDefault = useCallback((setting: TimingSetting) => {
    handleValueChange(setting, setting.defaultValue);
  }, [handleValueChange]);

  const getCurrentValue = useCallback((setting: TimingSetting) => {
    return configuration?.timing?.[setting.key] ?? setting.value;
  }, [configuration]);

  const getPerformanceColor = (impact: string) => {
    switch (impact) {
      case 'low': return '#00FF88';
      case 'medium': return '#FFB000';
      case 'high': return '#FF4444';
      default: return '#666';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}s`;
    }
    return `${value}${unit}`;
  };

  const filteredSettings = searchQuery
    ? TIMING_SETTINGS.filter(setting =>
        setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : TIMING_SETTINGS;

  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, TimingSetting[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className="w-6 h-6" style={{ color: '#FFA500' }} />
          <div>
            <h2 className="text-xl font-bold font-mono" style={{ color: '#FFA500' }}>
              TIMING CONFIGURATION
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Control refresh rates, animations, and performance timings
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-gray-400">
          {filteredSettings.length} timing settings
        </div>
      </div>

      {/* Global Controls */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => {
            TIMING_SETTINGS.forEach(setting => {
              handleValueChange(setting, setting.defaultValue);
            });
          }}
          className="flex items-center justify-center space-x-2 px-4 py-3 border text-sm font-mono hover:border-orange-400/60 transition-all"
          style={{
            borderColor: 'rgba(255, 165, 0, 0.3)',
            background: 'rgba(255, 165, 0, 0.05)'
          }}
        >
          <RotateCw className="w-4 h-4" style={{ color: '#FFA500' }} />
          <span style={{ color: '#FFA500' }}>RESET ALL</span>
        </button>

        <button
          onClick={() => {
            // Apply performance preset
            const performanceSettings = {
              marketDataRefresh: 10000,
              sparklineRefresh: 200,
              frameRateTarget: 30,
              chartTransitionDuration: 500
            };
            Object.entries(performanceSettings).forEach(([key, value]) => {
              const setting = TIMING_SETTINGS.find(s => s.key === key);
              if (setting) handleValueChange(setting, value);
            });
          }}
          className="flex items-center justify-center space-x-2 px-4 py-3 border text-sm font-mono hover:border-green-400/60 transition-all"
          style={{
            borderColor: 'rgba(0, 255, 136, 0.3)',
            background: 'rgba(0, 255, 136, 0.05)'
          }}
        >
          <Timer className="w-4 h-4" style={{ color: '#00FF88' }} />
          <span style={{ color: '#00FF88' }}>PERFORMANCE</span>
        </button>

        <button
          onClick={() => {
            // Apply responsive preset
            const responsiveSettings = {
              marketDataRefresh: 2000,
              sparklineRefresh: 50,
              frameRateTarget: 120,
              chartTransitionDuration: 150
            };
            Object.entries(responsiveSettings).forEach(([key, value]) => {
              const setting = TIMING_SETTINGS.find(s => s.key === key);
              if (setting) handleValueChange(setting, value);
            });
          }}
          className="flex items-center justify-center space-x-2 px-4 py-3 border text-sm font-mono hover:border-cyan-400/60 transition-all"
          style={{
            borderColor: 'rgba(0, 212, 255, 0.3)',
            background: 'rgba(0, 212, 255, 0.05)'
          }}
        >
          <Zap className="w-4 h-4" style={{ color: '#00D4FF' }} />
          <span style={{ color: '#00D4FF' }}>RESPONSIVE</span>
        </button>
      </div>

      {/* Settings Categories */}
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
                    {settings.length} timing parameters
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
              <div className="border-t space-y-3 p-4" style={{ borderColor: 'rgba(0, 212, 255, 0.2)' }}>
                {settings.map((setting) => {
                  const currentValue = getCurrentValue(setting);
                  const isModified = currentValue !== setting.defaultValue;
                  const isFavorite = favorites.has(`timing.${setting.key}`);

                  return (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between p-4 border rounded-none hover:bg-white/5 transition-all"
                      style={{
                        borderColor: isModified ? 'rgba(255, 165, 0, 0.3)' : 'rgba(0, 212, 255, 0.1)',
                        background: isModified ? 'rgba(255, 165, 0, 0.05)' : 'transparent'
                      }}
                    >
                      {/* Setting Info */}
                      <div className="flex-1 min-w-0 mr-6">
                        <div className="flex items-center space-x-3 mb-2">
                          <div style={{ color: categoryColors[setting.category] }}>
                            {setting.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold font-mono text-sm text-white">
                                {setting.label}
                              </h4>
                              {isModified && (
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: '#FFA500' }}
                                  title="Modified from default"
                                />
                              )}
                              <button
                                onClick={() => onToggleFavorite(`timing.${setting.key}`)}
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

                        {/* Performance Impact Indicator */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Performance Impact:</span>
                          <div className="flex items-center space-x-1">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getPerformanceColor(setting.performanceImpact) }}
                            />
                            <span
                              className="text-xs uppercase font-mono"
                              style={{ color: getPerformanceColor(setting.performanceImpact) }}
                            >
                              {setting.performanceImpact}
                            </span>
                          </div>
                          {setting.performanceImpact === 'high' && (
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex-shrink-0 w-64">
                        <div className="space-y-2">
                          {/* Slider */}
                          <div className="relative">
                            <input
                              type="range"
                              min={setting.min}
                              max={setting.max}
                              step={setting.step}
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
                              .slider::-moz-range-thumb {
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

                          {/* Value Display and Input */}
                          <div className="flex items-center justify-between">
                            <input
                              type="number"
                              min={setting.min}
                              max={setting.max}
                              step={setting.step}
                              value={currentValue}
                              onChange={(e) => handleValueChange(setting, Number(e.target.value))}
                              className="w-20 px-2 py-1 text-sm font-mono border bg-transparent text-center"
                              style={{
                                borderColor: 'rgba(0, 212, 255, 0.3)',
                                background: 'rgba(0, 20, 40, 0.3)',
                                color: '#fff'
                              }}
                            />
                            <span className="text-sm font-mono text-gray-400 mx-2">
                              {setting.unit}
                            </span>
                            <span className="text-sm font-mono" style={{ color: categoryColors[setting.category] }}>
                              {formatValue(currentValue, setting.unit)}
                            </span>
                            {isModified && (
                              <button
                                onClick={() => resetToDefault(setting)}
                                className="ml-2 px-2 py-1 text-xs border hover:border-orange-400/60 transition-colors"
                                style={{
                                  borderColor: 'rgba(255, 165, 0, 0.3)',
                                  color: '#FFA500'
                                }}
                                title={`Reset to default (${formatValue(setting.defaultValue, setting.unit)})`}
                              >
                                RESET
                              </button>
                            )}
                          </div>

                          {/* Range Indicators */}
                          <div className="flex justify-between text-xs text-gray-500 font-mono">
                            <span>{formatValue(setting.min, setting.unit)}</span>
                            <span>default: {formatValue(setting.defaultValue, setting.unit)}</span>
                            <span>{formatValue(setting.max, setting.unit)}</span>
                          </div>
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

export default TimingPanel;