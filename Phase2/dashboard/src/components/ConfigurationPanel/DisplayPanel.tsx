import React, { useState, useCallback } from 'react';
import { Monitor, Grid, Layers, Eye, BarChart3, Star, StarOff, RotateCcw } from 'lucide-react';

interface DisplayPanelProps {
  configuration: any;
  onConfigurationChange: (category: string, key: string, value: any) => void;
  previewMode: boolean;
  onPreviewChange?: (category: string, key: string, value: any) => void;
  favorites: Set<string>;
  onToggleFavorite: (key: string) => void;
  searchQuery?: string;
}

interface DisplaySetting {
  key: string;
  label: string;
  description: string;
  type: 'number' | 'boolean' | 'select' | 'multiselect';
  value: any;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  category: 'dimensions' | 'counts' | 'layout' | 'visibility';
  icon: React.ReactNode;
  defaultValue: any;
  dependsOn?: string;
}

const DISPLAY_SETTINGS: DisplaySetting[] = [
  // Dimensions
  {
    key: 'currencyCardHeight',
    label: 'Currency Card Height',
    description: 'Height of each currency exchange card',
    type: 'number',
    value: 105,
    min: 80,
    max: 150,
    step: 5,
    unit: 'px',
    category: 'dimensions',
    icon: <Monitor className="w-4 h-4" />,
    defaultValue: 105
  },
  {
    key: 'sparklineWidth',
    label: 'Sparkline Width',
    description: 'Width of inline sparkline charts',
    type: 'number',
    value: 120,
    min: 80,
    max: 200,
    step: 10,
    unit: 'px',
    category: 'dimensions',
    icon: <BarChart3 className="w-4 h-4" />,
    defaultValue: 120
  },
  {
    key: 'sparklineHeight',
    label: 'Sparkline Height',
    description: 'Height of inline sparkline charts',
    type: 'number',
    value: 50,
    min: 30,
    max: 100,
    step: 5,
    unit: 'px',
    category: 'dimensions',
    icon: <BarChart3 className="w-4 h-4" />,
    defaultValue: 50
  },
  {
    key: 'commodityCardHeight',
    label: 'Commodity Card Height',
    description: 'Height of market watch commodity cards',
    type: 'number',
    value: 110,
    min: 80,
    max: 150,
    step: 5,
    unit: 'px',
    category: 'dimensions',
    icon: <Grid className="w-4 h-4" />,
    defaultValue: 110
  },
  {
    key: 'rightSidebarWidth',
    label: 'Right Sidebar Width',
    description: 'Width of the commodity market watch sidebar',
    type: 'number',
    value: 200,
    min: 180,
    max: 300,
    step: 10,
    unit: 'px',
    category: 'dimensions',
    icon: <Layers className="w-4 h-4" />,
    defaultValue: 200
  },

  // Counts
  {
    key: 'maxDisplayedCurrencies',
    label: 'Max Displayed Currencies',
    description: 'Maximum number of currency pairs to show',
    type: 'number',
    value: 8,
    min: 4,
    max: 20,
    step: 1,
    category: 'counts',
    icon: <Grid className="w-4 h-4" />,
    defaultValue: 8
  },
  {
    key: 'visibleCommodities',
    label: 'Visible Commodities',
    description: 'Number of commodity cards visible at once',
    type: 'number',
    value: 6,
    min: 3,
    max: 12,
    step: 1,
    category: 'counts',
    icon: <Grid className="w-4 h-4" />,
    defaultValue: 6
  },
  {
    key: 'cryptoDisplayCount',
    label: 'Crypto Display Count',
    description: 'Number of cryptocurrencies to show in main section',
    type: 'number',
    value: 8,
    min: 4,
    max: 16,
    step: 1,
    category: 'counts',
    icon: <Grid className="w-4 h-4" />,
    defaultValue: 8
  },
  {
    key: 'topMoversCount',
    label: 'Top Movers Count',
    description: 'Number of items to show in top movers grid',
    type: 'number',
    value: 8,
    min: 4,
    max: 16,
    step: 1,
    category: 'counts',
    icon: <BarChart3 className="w-4 h-4" />,
    defaultValue: 8
  },
  {
    key: 'sparklineDataPoints',
    label: 'Sparkline Data Points',
    description: 'Number of data points in sparkline charts',
    type: 'number',
    value: 20,
    min: 10,
    max: 100,
    step: 5,
    category: 'counts',
    icon: <BarChart3 className="w-4 h-4" />,
    defaultValue: 20
  },

  // Layout
  {
    key: 'layoutMode',
    label: 'Layout Mode',
    description: 'Overall dashboard layout configuration',
    type: 'select',
    value: 'three-column',
    options: [
      { value: 'single-column', label: 'Single Column' },
      { value: 'two-column', label: 'Two Column' },
      { value: 'three-column', label: 'Three Column' },
      { value: 'grid', label: 'Grid Layout' }
    ],
    category: 'layout',
    icon: <Layers className="w-4 h-4" />,
    defaultValue: 'three-column'
  },
  {
    key: 'cardSpacing',
    label: 'Card Spacing',
    description: 'Space between dashboard cards',
    type: 'select',
    value: 'normal',
    options: [
      { value: 'tight', label: 'Tight (8px)' },
      { value: 'normal', label: 'Normal (12px)' },
      { value: 'loose', label: 'Loose (16px)' },
      { value: 'wide', label: 'Wide (24px)' }
    ],
    category: 'layout',
    icon: <Grid className="w-4 h-4" />,
    defaultValue: 'normal'
  },
  {
    key: 'responsiveBreakpoints',
    label: 'Responsive Layout',
    description: 'Enable responsive layout adjustments',
    type: 'boolean',
    value: true,
    category: 'layout',
    icon: <Monitor className="w-4 h-4" />,
    defaultValue: true
  },
  {
    key: 'stickyHeaders',
    label: 'Sticky Headers',
    description: 'Keep section headers visible during scroll',
    type: 'boolean',
    value: false,
    category: 'layout',
    icon: <Layers className="w-4 h-4" />,
    defaultValue: false
  },

  // Visibility
  {
    key: 'showCountryFlags',
    label: 'Show Country Flags',
    description: 'Display country flags next to currency codes',
    type: 'boolean',
    value: true,
    category: 'visibility',
    icon: <Eye className="w-4 h-4" />,
    defaultValue: true
  },
  {
    key: 'showSparklines',
    label: 'Show Sparklines',
    description: 'Display real-time mini charts',
    type: 'boolean',
    value: true,
    category: 'visibility',
    icon: <BarChart3 className="w-4 h-4" />,
    defaultValue: true
  },
  {
    key: 'showPerformanceMonitor',
    label: 'Show Performance Monitor',
    description: 'Display FPS and performance metrics',
    type: 'boolean',
    value: false,
    category: 'visibility',
    icon: <Monitor className="w-4 h-4" />,
    defaultValue: false
  },
  {
    key: 'showMarketStatus',
    label: 'Show Market Status',
    description: 'Display market open/close status indicators',
    type: 'boolean',
    value: true,
    category: 'visibility',
    icon: <Eye className="w-4 h-4" />,
    defaultValue: true
  },
  {
    key: 'showDataSourceStatus',
    label: 'Show Data Source Status',
    description: 'Display real-time data connection status',
    type: 'boolean',
    value: true,
    category: 'visibility',
    icon: <Monitor className="w-4 h-4" />,
    defaultValue: true
  },
  {
    key: 'showWeatherWidget',
    label: 'Show Weather Widget',
    description: 'Display weather information in sidebar',
    type: 'boolean',
    value: true,
    category: 'visibility',
    icon: <Eye className="w-4 h-4" />,
    defaultValue: true
  },
  {
    key: 'compactMode',
    label: 'Compact Mode',
    description: 'Use compact display with reduced padding',
    type: 'boolean',
    value: false,
    category: 'visibility',
    icon: <Grid className="w-4 h-4" />,
    defaultValue: false
  },
  {
    key: 'hideZeroChanges',
    label: 'Hide Zero Changes',
    description: 'Hide currencies with no price movement',
    type: 'boolean',
    value: false,
    category: 'visibility',
    icon: <Eye className="w-4 h-4" />,
    defaultValue: false
  }
];

const categoryColors = {
  dimensions: '#00D4FF',
  counts: '#FFA500',
  layout: '#00FF88',
  visibility: '#FF4444'
};

const categoryIcons = {
  dimensions: <Monitor className="w-4 h-4" />,
  counts: <Grid className="w-4 h-4" />,
  layout: <Layers className="w-4 h-4" />,
  visibility: <Eye className="w-4 h-4" />
};

export const DisplayPanel: React.FC<DisplayPanelProps> = ({
  configuration,
  onConfigurationChange,
  previewMode,
  onPreviewChange,
  favorites,
  onToggleFavorite,
  searchQuery
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['dimensions', 'counts', 'layout', 'visibility'])
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

  const handleValueChange = useCallback((setting: DisplaySetting, value: any) => {
    const changeHandler = previewMode ? onPreviewChange : onConfigurationChange;
    changeHandler?.('display', setting.key, value);
  }, [previewMode, onConfigurationChange, onPreviewChange]);

  const resetToDefault = useCallback((setting: DisplaySetting) => {
    handleValueChange(setting, setting.defaultValue);
  }, [handleValueChange]);

  const getCurrentValue = useCallback((setting: DisplaySetting) => {
    return configuration?.display?.[setting.key] ?? setting.value;
  }, [configuration]);

  const filteredSettings = searchQuery
    ? DISPLAY_SETTINGS.filter(setting =>
        setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DISPLAY_SETTINGS;

  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, DisplaySetting[]>);

  const renderControl = (setting: DisplaySetting) => {
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
                    ? 'bg-orange-500 shadow-lg shadow-orange-500/30'
                    : 'bg-gray-600'
                }`}
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
            {/* Slider for numbers with min/max */}
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
            )}

            {/* Number input and display */}
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
          <Monitor className="w-6 h-6" style={{ color: '#FFA500' }} />
          <div>
            <h2 className="text-xl font-bold font-mono" style={{ color: '#FFA500' }}>
              DISPLAY CONFIGURATION
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Control layout, dimensions, counts, and visibility settings
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-gray-400">
          {filteredSettings.length} display settings
        </div>
      </div>

      {/* Global Layout Presets */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            const compactSettings = {
              currencyCardHeight: 85,
              sparklineHeight: 35,
              cardSpacing: 'tight',
              compactMode: true,
              rightSidebarWidth: 180
            };
            Object.entries(compactSettings).forEach(([key, value]) => {
              const setting = DISPLAY_SETTINGS.find(s => s.key === key);
              if (setting) handleValueChange(setting, value);
            });
          }}
          className="flex flex-col items-center justify-center space-y-2 p-4 border text-sm font-mono hover:border-cyan-400/60 transition-all"
          style={{
            borderColor: 'rgba(0, 212, 255, 0.3)',
            background: 'rgba(0, 212, 255, 0.05)'
          }}
        >
          <Grid className="w-5 h-5" style={{ color: '#00D4FF' }} />
          <span style={{ color: '#00D4FF' }}>COMPACT LAYOUT</span>
          <span className="text-xs text-gray-400">Space efficient</span>
        </button>

        <button
          onClick={() => {
            const comfortableSettings = {
              currencyCardHeight: 120,
              sparklineHeight: 60,
              cardSpacing: 'loose',
              compactMode: false,
              rightSidebarWidth: 240
            };
            Object.entries(comfortableSettings).forEach(([key, value]) => {
              const setting = DISPLAY_SETTINGS.find(s => s.key === key);
              if (setting) handleValueChange(setting, value);
            });
          }}
          className="flex flex-col items-center justify-center space-y-2 p-4 border text-sm font-mono hover:border-green-400/60 transition-all"
          style={{
            borderColor: 'rgba(0, 255, 136, 0.3)',
            background: 'rgba(0, 255, 136, 0.05)'
          }}
        >
          <Layers className="w-5 h-5" style={{ color: '#00FF88' }} />
          <span style={{ color: '#00FF88' }}>COMFORTABLE</span>
          <span className="text-xs text-gray-400">Extra spacing</span>
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
                    {settings.length} display parameters
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
                  const isFavorite = favorites.has(`display.${setting.key}`);

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
                                onClick={() => onToggleFavorite(`display.${setting.key}`)}
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

export default DisplayPanel;