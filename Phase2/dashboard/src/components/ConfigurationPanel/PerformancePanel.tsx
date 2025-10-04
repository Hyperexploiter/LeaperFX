import React, { useState, useCallback } from 'react';
import { Zap, Activity, Cpu, MemoryStick, Gauge, Star, StarOff, RotateCcw, AlertTriangle, TrendingUp } from 'lucide-react';

interface PerformancePanelProps {
  configuration: any;
  onConfigurationChange: (category: string, key: string, value: any) => void;
  previewMode: boolean;
  onPreviewChange?: (category: string, key: string, value: any) => void;
  favorites: Set<string>;
  onToggleFavorite: (key: string) => void;
  searchQuery?: string;
}

interface PerformanceSetting {
  key: string;
  label: string;
  description: string;
  type: 'number' | 'boolean' | 'select';
  value: any;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  category: 'engine' | 'thresholds' | 'monitoring' | 'optimization';
  icon: React.ReactNode;
  performanceImpact: 'low' | 'medium' | 'high' | 'critical';
  defaultValue: any;
  warning?: string;
  recommendedRange?: [number, number];
}

const PERFORMANCE_SETTINGS: PerformanceSetting[] = [
  // Engine Settings
  {
    key: 'bufferCapacity',
    label: 'Buffer Capacity',
    description: 'Maximum number of data points stored in memory buffers',
    type: 'number',
    value: 5000,
    min: 1000,
    max: 20000,
    step: 500,
    category: 'engine',
    icon: <MemoryStick className="w-4 h-4" />,
    performanceImpact: 'high',
    defaultValue: 5000,
    recommendedRange: [3000, 8000],
    warning: 'High values may cause memory issues on low-end devices'
  },
  {
    key: 'targetFPS',
    label: 'Target Frame Rate',
    description: 'Desired frames per second for smooth animations',
    type: 'number',
    value: 60,
    min: 15,
    max: 120,
    step: 15,
    unit: 'fps',
    category: 'engine',
    icon: <Gauge className="w-4 h-4" />,
    performanceImpact: 'critical',
    defaultValue: 60,
    recommendedRange: [30, 60]
  },
  {
    key: 'renderMode',
    label: 'Render Mode',
    description: 'Chart rendering optimization level',
    type: 'select',
    value: 'balanced',
    options: [
      { value: 'performance', label: 'Performance (Low Quality)' },
      { value: 'balanced', label: 'Balanced (Medium Quality)' },
      { value: 'quality', label: 'Quality (High Quality)' },
      { value: 'ultra', label: 'Ultra (Maximum Quality)' }
    ],
    category: 'engine',
    icon: <Activity className="w-4 h-4" />,
    performanceImpact: 'high',
    defaultValue: 'balanced'
  },
  {
    key: 'enableWebGL',
    label: 'Enable WebGL',
    description: 'Use hardware acceleration for chart rendering',
    type: 'boolean',
    value: true,
    category: 'engine',
    icon: <Cpu className="w-4 h-4" />,
    performanceImpact: 'medium',
    defaultValue: true,
    warning: 'Disable if experiencing graphics issues'
  },
  {
    key: 'memoryManagement',
    label: 'Aggressive Memory Management',
    description: 'Enable aggressive garbage collection and memory cleanup',
    type: 'boolean',
    value: false,
    category: 'engine',
    icon: <MemoryStick className="w-4 h-4" />,
    performanceImpact: 'medium',
    defaultValue: false
  },

  // Thresholds
  {
    key: 'fpsThresholdWarning',
    label: 'FPS Warning Threshold',
    description: 'FPS below this triggers performance warnings',
    type: 'number',
    value: 45,
    min: 15,
    max: 60,
    step: 5,
    unit: 'fps',
    category: 'thresholds',
    icon: <AlertTriangle className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: 45
  },
  {
    key: 'fpsThresholdCritical',
    label: 'FPS Critical Threshold',
    description: 'FPS below this triggers performance degradation',
    type: 'number',
    value: 30,
    min: 10,
    max: 45,
    step: 5,
    unit: 'fps',
    category: 'thresholds',
    icon: <AlertTriangle className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: 30
  },
  {
    key: 'memoryThreshold',
    label: 'Memory Usage Threshold',
    description: 'Memory usage above this triggers cleanup',
    type: 'number',
    value: 80,
    min: 50,
    max: 95,
    step: 5,
    unit: '%',
    category: 'thresholds',
    icon: <MemoryStick className="w-4 h-4" />,
    performanceImpact: 'medium',
    defaultValue: 80
  },
  {
    key: 'dataPointsThreshold',
    label: 'Data Points Threshold',
    description: 'Number of data points before buffer cleanup',
    type: 'number',
    value: 4500,
    min: 1000,
    max: 10000,
    step: 250,
    category: 'thresholds',
    icon: <Activity className="w-4 h-4" />,
    performanceImpact: 'medium',
    defaultValue: 4500
  },

  // Monitoring
  {
    key: 'enablePerformanceMonitoring',
    label: 'Performance Monitoring',
    description: 'Track and display real-time performance metrics',
    type: 'boolean',
    value: true,
    category: 'monitoring',
    icon: <TrendingUp className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: true
  },
  {
    key: 'monitoringInterval',
    label: 'Monitoring Interval',
    description: 'How often to update performance metrics',
    type: 'number',
    value: 1000,
    min: 500,
    max: 5000,
    step: 250,
    unit: 'ms',
    category: 'monitoring',
    icon: <Activity className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: 1000
  },
  {
    key: 'enableMemoryProfiling',
    label: 'Memory Profiling',
    description: 'Track detailed memory usage patterns',
    type: 'boolean',
    value: false,
    category: 'monitoring',
    icon: <MemoryStick className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: false,
    warning: 'May impact performance when enabled'
  },
  {
    key: 'performanceAlerts',
    label: 'Performance Alerts',
    description: 'Show notifications when performance degrades',
    type: 'boolean',
    value: true,
    category: 'monitoring',
    icon: <AlertTriangle className="w-4 h-4" />,
    performanceImpact: 'low',
    defaultValue: true
  },

  // Optimization
  {
    key: 'enableVirtualization',
    label: 'Enable Virtualization',
    description: 'Use virtual scrolling for large data sets',
    type: 'boolean',
    value: true,
    category: 'optimization',
    icon: <Activity className="w-4 h-4" />,
    performanceImpact: 'high',
    defaultValue: true
  },
  {
    key: 'debounceDelay',
    label: 'Input Debounce Delay',
    description: 'Delay before processing rapid input changes',
    type: 'number',
    value: 300,
    min: 100,
    max: 1000,
    step: 50,
    unit: 'ms',
    category: 'optimization',
    icon: <Zap className="w-4 h-4" />,
    performanceImpact: 'medium',
    defaultValue: 300
  },
  {
    key: 'batchUpdates',
    label: 'Batch Updates',
    description: 'Group multiple updates together for efficiency',
    type: 'boolean',
    value: true,
    category: 'optimization',
    icon: <Activity className="w-4 h-4" />,
    performanceImpact: 'medium',
    defaultValue: true
  },
  {
    key: 'preloadData',
    label: 'Preload Data',
    description: 'Preload data for smoother user experience',
    type: 'boolean',
    value: true,
    category: 'optimization',
    icon: <TrendingUp className="w-4 h-4" />,
    performanceImpact: 'medium',
    defaultValue: true
  },
  {
    key: 'enableCaching',
    label: 'Enable Caching',
    description: 'Cache computed values and API responses',
    type: 'boolean',
    value: true,
    category: 'optimization',
    icon: <MemoryStick className="w-4 h-4" />,
    performanceImpact: 'high',
    defaultValue: true
  }
];

const PERFORMANCE_PRESETS = [
  {
    name: 'Ultra Performance',
    description: 'Maximum speed, minimal visual quality',
    settings: {
      targetFPS: 30,
      renderMode: 'performance',
      bufferCapacity: 2000,
      enableWebGL: false,
      memoryManagement: true
    },
    icon: <Zap className="w-4 h-4" />,
    color: '#FF4444'
  },
  {
    name: 'Balanced',
    description: 'Good balance of performance and quality',
    settings: {
      targetFPS: 60,
      renderMode: 'balanced',
      bufferCapacity: 5000,
      enableWebGL: true,
      memoryManagement: false
    },
    icon: <Activity className="w-4 h-4" />,
    color: '#FFB000'
  },
  {
    name: 'High Quality',
    description: 'Best visual quality, requires good hardware',
    settings: {
      targetFPS: 60,
      renderMode: 'quality',
      bufferCapacity: 8000,
      enableWebGL: true,
      memoryManagement: false
    },
    icon: <TrendingUp className="w-4 h-4" />,
    color: '#00FF88'
  },
  {
    name: 'Ultra Quality',
    description: 'Maximum quality for high-end systems',
    settings: {
      targetFPS: 120,
      renderMode: 'ultra',
      bufferCapacity: 12000,
      enableWebGL: true,
      memoryManagement: false
    },
    icon: <Gauge className="w-4 h-4" />,
    color: '#00D4FF'
  }
];

const categoryColors = {
  engine: '#FF4444',
  thresholds: '#FFB000',
  monitoring: '#00D4FF',
  optimization: '#00FF88'
};

const categoryIcons = {
  engine: <Cpu className="w-4 h-4" />,
  thresholds: <AlertTriangle className="w-4 h-4" />,
  monitoring: <TrendingUp className="w-4 h-4" />,
  optimization: <Zap className="w-4 h-4" />
};

const getPerformanceColor = (impact: string) => {
  switch (impact) {
    case 'low': return '#00FF88';
    case 'medium': return '#FFB000';
    case 'high': return '#FFA500';
    case 'critical': return '#FF4444';
    default: return '#666';
  }
};

export const PerformancePanel: React.FC<PerformancePanelProps> = ({
  configuration,
  onConfigurationChange,
  previewMode,
  onPreviewChange,
  favorites,
  onToggleFavorite,
  searchQuery
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['engine', 'thresholds', 'monitoring', 'optimization'])
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

  const handleValueChange = useCallback((setting: PerformanceSetting, value: any) => {
    const changeHandler = previewMode ? onPreviewChange : onConfigurationChange;
    changeHandler?.('performance', setting.key, value);
  }, [previewMode, onConfigurationChange, onPreviewChange]);

  const resetToDefault = useCallback((setting: PerformanceSetting) => {
    handleValueChange(setting, setting.defaultValue);
  }, [handleValueChange]);

  const getCurrentValue = useCallback((setting: PerformanceSetting) => {
    return configuration?.performance?.[setting.key] ?? setting.value;
  }, [configuration]);

  const applyPreset = useCallback((preset: typeof PERFORMANCE_PRESETS[0]) => {
    Object.entries(preset.settings).forEach(([key, value]) => {
      const setting = PERFORMANCE_SETTINGS.find(s => s.key === key);
      if (setting) {
        handleValueChange(setting, value);
      }
    });
  }, [handleValueChange]);

  const filteredSettings = searchQuery
    ? PERFORMANCE_SETTINGS.filter(setting =>
        setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : PERFORMANCE_SETTINGS;

  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, PerformanceSetting[]>);

  const renderControl = (setting: PerformanceSetting) => {
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
                  {currentValue}{setting.unit || ''}
                </span>
              </div>
            </div>

            {/* Recommended range indicator */}
            {setting.recommendedRange && setting.min !== undefined && setting.max !== undefined && (
              <div className="relative h-1 bg-gray-700 rounded">
                <div
                  className="absolute h-full bg-green-500 rounded opacity-50"
                  style={{
                    left: `${((setting.recommendedRange[0] - setting.min) / (setting.max - setting.min)) * 100}%`,
                    width: `${((setting.recommendedRange[1] - setting.recommendedRange[0]) / (setting.max - setting.min)) * 100}%`
                  }}
                />
                <div
                  className="absolute w-1 h-1 bg-white rounded-full transform -translate-x-0.5"
                  style={{
                    left: `${((currentValue - setting.min) / (setting.max - setting.min)) * 100}%`
                  }}
                />
              </div>
            )}

            {/* Range indicators */}
            {setting.min !== undefined && setting.max !== undefined && (
              <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>{setting.min}{setting.unit || ''}</span>
                {setting.recommendedRange && (
                  <span className="text-green-400">
                    recommended: {setting.recommendedRange[0]}-{setting.recommendedRange[1]}{setting.unit || ''}
                  </span>
                )}
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
          <Zap className="w-6 h-6" style={{ color: '#FFA500' }} />
          <div>
            <h2 className="text-xl font-bold font-mono" style={{ color: '#FFA500' }}>
              PERFORMANCE CONFIGURATION
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Engine settings, thresholds, monitoring, and optimization
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-gray-400">
          {filteredSettings.length} performance settings
        </div>
      </div>

      {/* Performance Presets */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-mono uppercase" style={{ color: '#FFA500' }}>
          Performance Presets
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {PERFORMANCE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="flex items-center justify-between p-3 border text-left hover:border-opacity-60 transition-all"
              style={{
                borderColor: `${preset.color}40`,
                background: `${preset.color}10`
              }}
            >
              <div className="flex items-center space-x-3">
                <div style={{ color: preset.color }}>
                  {preset.icon}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {preset.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Performance Categories */}
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
                    {settings.length} performance parameters
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
                  const isFavorite = favorites.has(`performance.${setting.key}`);

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
                              {isModified && (
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: '#FFA500' }}
                                  title="Modified from default"
                                />
                              )}
                              <button
                                onClick={() => onToggleFavorite(`performance.${setting.key}`)}
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

                        {/* Performance Impact & Warning */}
                        <div className="space-y-2">
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
                            {setting.performanceImpact === 'critical' && (
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                            )}
                          </div>

                          {setting.warning && (
                            <div className="flex items-start space-x-2 p-2 border-l-2 border-yellow-500 bg-yellow-500/10">
                              <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-yellow-400">
                                {setting.warning}
                              </span>
                            </div>
                          )}
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

export default PerformancePanel;