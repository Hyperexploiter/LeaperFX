import React, { useState, useCallback } from 'react';
import { Palette, Pipette, Sun, Moon, Eye, RotateCcw, Star, StarOff, Copy, Download } from 'lucide-react';

interface ColorsPanelProps {
  configuration: any;
  onConfigurationChange: (category: string, key: string, value: any) => void;
  previewMode: boolean;
  onPreviewChange?: (category: string, key: string, value: any) => void;
  favorites: Set<string>;
  onToggleFavorite: (key: string) => void;
  searchQuery?: string;
}

interface ColorSetting {
  key: string;
  label: string;
  description: string;
  value: string;
  category: 'accent' | 'status' | 'background' | 'text' | 'chart';
  icon: React.ReactNode;
  defaultValue: string;
  variants?: { name: string; value: string }[];
}

const COLOR_SETTINGS: ColorSetting[] = [
  // Accent Colors
  {
    key: 'primaryAccent',
    label: 'Primary Accent',
    description: 'Main orange accent color for headers and highlights',
    value: '#FFA500',
    category: 'accent',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FFA500' }} />,
    defaultValue: '#FFA500',
    variants: [
      { name: 'Orange Classic', value: '#FFA500' },
      { name: 'Orange Bright', value: '#FF8C00' },
      { name: 'Orange Deep', value: '#FF7F00' },
      { name: 'Amber', value: '#FFBF00' }
    ]
  },
  {
    key: 'secondaryAccent',
    label: 'Secondary Accent',
    description: 'Cyan accent color for borders and secondary elements',
    value: '#00D4FF',
    category: 'accent',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00D4FF' }} />,
    defaultValue: '#00D4FF',
    variants: [
      { name: 'Cyan Classic', value: '#00D4FF' },
      { name: 'Cyan Bright', value: '#00E6FF' },
      { name: 'Cyan Electric', value: '#00BFFF' },
      { name: 'Ice Blue', value: '#87CEEB' }
    ]
  },
  {
    key: 'borderAccent',
    label: 'Border Accent',
    description: 'Color for card borders and dividers',
    value: '#0096C7',
    category: 'accent',
    icon: <div className="w-4 h-4 border-2" style={{ borderColor: '#0096C7' }} />,
    defaultValue: '#0096C7'
  },

  // Status Colors
  {
    key: 'positiveColor',
    label: 'Positive/Gains',
    description: 'Color for positive price movements and gains',
    value: '#00FF88',
    category: 'status',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#00FF88' }} />,
    defaultValue: '#00FF88',
    variants: [
      { name: 'Green Classic', value: '#00FF88' },
      { name: 'Green Bright', value: '#00FF7F' },
      { name: 'Lime', value: '#32CD32' },
      { name: 'Emerald', value: '#50C878' }
    ]
  },
  {
    key: 'negativeColor',
    label: 'Negative/Losses',
    description: 'Color for negative price movements and losses',
    value: '#FF4444',
    category: 'status',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FF4444' }} />,
    defaultValue: '#FF4444',
    variants: [
      { name: 'Red Classic', value: '#FF4444' },
      { name: 'Red Bright', value: '#FF3333' },
      { name: 'Crimson', value: '#DC143C' },
      { name: 'Dark Red', value: '#8B0000' }
    ]
  },
  {
    key: 'warningColor',
    label: 'Warning/Alert',
    description: 'Color for warnings and degraded status',
    value: '#FFB000',
    category: 'status',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FFB000' }} />,
    defaultValue: '#FFB000',
    variants: [
      { name: 'Yellow Classic', value: '#FFB000' },
      { name: 'Gold', value: '#FFD700' },
      { name: 'Amber', value: '#FFBF00' },
      { name: 'Orange Yellow', value: '#FFCC00' }
    ]
  },
  {
    key: 'neutralColor',
    label: 'Neutral/No Change',
    description: 'Color for neutral states and no price movement',
    value: '#888888',
    category: 'status',
    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#888888' }} />,
    defaultValue: '#888888'
  },

  // Background Colors
  {
    key: 'backgroundColor',
    label: 'Background',
    description: 'Main dashboard background color',
    value: '#000000',
    category: 'background',
    icon: <div className="w-4 h-4 rounded" style={{ backgroundColor: '#000000', border: '1px solid #333' }} />,
    defaultValue: '#000000'
  },
  {
    key: 'cardBackground',
    label: 'Card Background',
    description: 'Background gradient for dashboard cards',
    value: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
    category: 'background',
    icon: <div className="w-4 h-4 rounded" style={{
      background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
      border: '1px solid #333'
    }} />,
    defaultValue: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)'
  },
  {
    key: 'sidebarBackground',
    label: 'Sidebar Background',
    description: 'Background for sidebar and panels',
    value: 'linear-gradient(180deg, rgba(0, 8, 20, 0.8) 0%, rgba(0, 20, 40, 0.6) 100%)',
    category: 'background',
    icon: <div className="w-4 h-4 rounded" style={{
      background: 'linear-gradient(180deg, rgba(0, 8, 20, 0.8) 0%, rgba(0, 20, 40, 0.6) 100%)',
      border: '1px solid #333'
    }} />,
    defaultValue: 'linear-gradient(180deg, rgba(0, 8, 20, 0.8) 0%, rgba(0, 20, 40, 0.6) 100%)'
  },

  // Text Colors
  {
    key: 'primaryText',
    label: 'Primary Text',
    description: 'Main text color for content',
    value: '#FFFFFF',
    category: 'text',
    icon: <div className="text-xs font-mono" style={{ color: '#FFFFFF' }}>Aa</div>,
    defaultValue: '#FFFFFF'
  },
  {
    key: 'secondaryText',
    label: 'Secondary Text',
    description: 'Secondary text color for labels and descriptions',
    value: '#B0B0B0',
    category: 'text',
    icon: <div className="text-xs font-mono" style={{ color: '#B0B0B0' }}>Aa</div>,
    defaultValue: '#B0B0B0'
  },
  {
    key: 'mutedText',
    label: 'Muted Text',
    description: 'Muted text color for timestamps and metadata',
    value: '#666666',
    category: 'text',
    icon: <div className="text-xs font-mono" style={{ color: '#666666' }}>Aa</div>,
    defaultValue: '#666666'
  },

  // Chart Colors
  {
    key: 'chartLineColor',
    label: 'Chart Line',
    description: 'Default color for chart lines and sparklines',
    value: '#FFFFFF',
    category: 'chart',
    icon: <div className="w-4 h-4 border-b-2" style={{ borderColor: '#FFFFFF' }} />,
    defaultValue: '#FFFFFF'
  },
  {
    key: 'chartGridColor',
    label: 'Chart Grid',
    description: 'Color for chart grid lines and axes',
    value: 'rgba(255, 255, 255, 0.05)',
    category: 'chart',
    icon: <div className="w-4 h-4 grid grid-cols-2 gap-px border" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />,
    defaultValue: 'rgba(255, 255, 255, 0.05)'
  },
  {
    key: 'chartGlowColor',
    label: 'Chart Glow',
    description: 'Glow effect color for active chart elements',
    value: '#FFD700',
    category: 'chart',
    icon: <div className="w-4 h-4 rounded-full" style={{
      backgroundColor: '#FFD700',
      boxShadow: '0 0 8px #FFD700'
    }} />,
    defaultValue: '#FFD700'
  }
];

const THEME_PRESETS = [
  {
    name: 'Classic Bloomberg',
    description: 'Traditional Bloomberg Terminal colors',
    colors: {
      primaryAccent: '#FFA500',
      secondaryAccent: '#00D4FF',
      positiveColor: '#00FF88',
      negativeColor: '#FF4444',
      backgroundColor: '#000000'
    }
  },
  {
    name: 'Neon Terminal',
    description: 'High contrast neon color scheme',
    colors: {
      primaryAccent: '#FF0080',
      secondaryAccent: '#00FFE6',
      positiveColor: '#39FF14',
      negativeColor: '#FF073A',
      backgroundColor: '#0A0A0A'
    }
  },
  {
    name: 'Professional Blue',
    description: 'Corporate blue theme',
    colors: {
      primaryAccent: '#0078D4',
      secondaryAccent: '#40E0D0',
      positiveColor: '#107C10',
      negativeColor: '#D13438',
      backgroundColor: '#1E1E1E'
    }
  },
  {
    name: 'Amber Terminal',
    description: 'Retro amber monochrome theme',
    colors: {
      primaryAccent: '#FFBF00',
      secondaryAccent: '#FFD700',
      positiveColor: '#90EE90',
      negativeColor: '#FFA07A',
      backgroundColor: '#000000'
    }
  }
];

const categoryColors = {
  accent: '#FFA500',
  status: '#00FF88',
  background: '#00D4FF',
  text: '#FFB000',
  chart: '#FF4444'
};

const categoryIcons = {
  accent: <Palette className="w-4 h-4" />,
  status: <div className="w-4 h-4 rounded-full border-2 border-current" />,
  background: <Sun className="w-4 h-4" />,
  text: <div className="text-xs font-bold">A</div>,
  chart: <div className="w-4 h-4 border-b-2 border-current" />
};

export const ColorsPanel: React.FC<ColorsPanelProps> = ({
  configuration,
  onConfigurationChange,
  previewMode,
  onPreviewChange,
  favorites,
  onToggleFavorite,
  searchQuery
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['accent', 'status', 'background', 'text', 'chart'])
  );
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState('#000000');

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

  const handleValueChange = useCallback((setting: ColorSetting, value: string) => {
    const changeHandler = previewMode ? onPreviewChange : onConfigurationChange;
    changeHandler?.('colors', setting.key, value);
  }, [previewMode, onConfigurationChange, onPreviewChange]);

  const resetToDefault = useCallback((setting: ColorSetting) => {
    handleValueChange(setting, setting.defaultValue);
  }, [handleValueChange]);

  const getCurrentValue = useCallback((setting: ColorSetting) => {
    return configuration?.colors?.[setting.key] ?? setting.value;
  }, [configuration]);

  const applyThemePreset = useCallback((preset: typeof THEME_PRESETS[0]) => {
    Object.entries(preset.colors).forEach(([key, value]) => {
      const setting = COLOR_SETTINGS.find(s => s.key === key);
      if (setting) {
        handleValueChange(setting, value);
      }
    });
  }, [handleValueChange]);

  const copyColorToClipboard = useCallback((color: string) => {
    navigator.clipboard.writeText(color);
  }, []);

  const exportColorTheme = useCallback(() => {
    const colors = COLOR_SETTINGS.reduce((acc, setting) => {
      acc[setting.key] = getCurrentValue(setting);
      return acc;
    }, {} as Record<string, string>);

    const theme = {
      name: 'Custom Theme',
      timestamp: new Date().toISOString(),
      colors
    };

    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaper-fx-theme-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getCurrentValue]);

  const filteredSettings = searchQuery
    ? COLOR_SETTINGS.filter(setting =>
        setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        setting.key.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COLOR_SETTINGS;

  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, ColorSetting[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Palette className="w-6 h-6" style={{ color: '#FFA500' }} />
          <div>
            <h2 className="text-xl font-bold font-mono" style={{ color: '#FFA500' }}>
              COLOR CONFIGURATION
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Customize colors, themes, and visual styling
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportColorTheme}
            className="flex items-center space-x-1 px-3 py-2 text-xs border hover:border-cyan-400/60 transition-colors"
            style={{
              borderColor: 'rgba(0, 212, 255, 0.3)',
              color: '#00D4FF'
            }}
          >
            <Download className="w-3 h-3" />
            <span>EXPORT THEME</span>
          </button>
          <div className="text-xs font-mono text-gray-400">
            {filteredSettings.length} color settings
          </div>
        </div>
      </div>

      {/* Theme Presets */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold font-mono uppercase" style={{ color: '#FFA500' }}>
          Theme Presets
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyThemePreset(preset)}
              className="flex items-center justify-between p-3 border text-left hover:border-orange-400/60 transition-all"
              style={{
                borderColor: 'rgba(255, 165, 0, 0.2)',
                background: 'rgba(0, 20, 40, 0.3)'
              }}
            >
              <div className="flex-1">
                <div className="font-bold text-sm text-white mb-1">
                  {preset.name}
                </div>
                <div className="text-xs text-gray-400">
                  {preset.description}
                </div>
              </div>
              <div className="flex space-x-1 ml-3">
                {Object.values(preset.colors).slice(0, 4).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 rounded border border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="p-4 border rounded-none" style={{
        borderColor: 'rgba(0, 212, 255, 0.2)',
        background: 'linear-gradient(135deg, rgba(0, 8, 20, 0.6) 0%, rgba(0, 20, 40, 0.4) 100%)'
      }}>
        <div className="flex items-center space-x-2 mb-3">
          <Eye className="w-4 h-4" style={{ color: '#00D4FF' }} />
          <h3 className="text-sm font-bold font-mono uppercase" style={{ color: '#00D4FF' }}>
            Live Preview
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 border" style={{
            borderColor: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'secondaryAccent')!),
            background: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'cardBackground')!)
          }}>
            <div style={{ color: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'primaryAccent')!) }}>
              Currency Pair
            </div>
            <div style={{ color: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'primaryText')!) }}>
              1.2345
            </div>
            <div style={{ color: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'positiveColor')!) }}>
              +2.34%
            </div>
          </div>
          <div className="p-3 border" style={{
            borderColor: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'secondaryAccent')!),
            background: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'cardBackground')!)
          }}>
            <div style={{ color: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'primaryAccent')!) }}>
              Status
            </div>
            <div style={{ color: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'warningColor')!) }}>
              Warning
            </div>
            <div style={{ color: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'secondaryText')!) }}>
              Secondary
            </div>
          </div>
          <div className="p-3 border" style={{
            borderColor: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'secondaryAccent')!),
            background: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'cardBackground')!)
          }}>
            <div style={{ color: getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'primaryAccent')!) }}>
              Chart
            </div>
            <div className="w-full h-2 mt-1" style={{
              background: `linear-gradient(to right, ${getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'chartGlowColor')!)}, ${getCurrentValue(COLOR_SETTINGS.find(s => s.key === 'negativeColor')!)})`
            }} />
          </div>
        </div>
      </div>

      {/* Color Categories */}
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
                    {category} Colors
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {settings.length} color parameters
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
                  const isFavorite = favorites.has(`colors.${setting.key}`);

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
                          <div>{setting.icon}</div>
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
                                onClick={() => onToggleFavorite(`colors.${setting.key}`)}
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

                      {/* Color Controls */}
                      <div className="flex-shrink-0 w-80">
                        <div className="space-y-3">
                          {/* Color Preview and Picker */}
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setActiveColorPicker(
                                activeColorPicker === setting.key ? null : setting.key
                              )}
                              className="w-12 h-8 border-2 border-gray-600 rounded cursor-pointer hover:border-gray-400 transition-colors"
                              style={{ backgroundColor: currentValue }}
                              title="Click to open color picker"
                            />

                            <input
                              type="text"
                              value={currentValue}
                              onChange={(e) => handleValueChange(setting, e.target.value)}
                              className="flex-1 px-3 py-2 font-mono text-sm border bg-transparent text-white"
                              style={{
                                borderColor: 'rgba(0, 212, 255, 0.3)',
                                background: 'rgba(0, 20, 40, 0.3)'
                              }}
                              placeholder="#000000"
                            />

                            <button
                              onClick={() => copyColorToClipboard(currentValue)}
                              className="p-2 border border-gray-600 hover:border-gray-400 transition-colors"
                              title="Copy color"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Color Picker */}
                          {activeColorPicker === setting.key && (
                            <div className="border p-3" style={{
                              borderColor: 'rgba(0, 212, 255, 0.3)',
                              background: 'rgba(0, 20, 40, 0.8)'
                            }}>
                              <input
                                type="color"
                                value={currentValue.startsWith('#') ? currentValue : '#000000'}
                                onChange={(e) => handleValueChange(setting, e.target.value)}
                                className="w-full h-8 border-0 rounded cursor-pointer"
                              />
                            </div>
                          )}

                          {/* Color Variants */}
                          {setting.variants && (
                            <div className="space-y-2">
                              <div className="text-xs font-mono text-gray-400 uppercase">
                                Variants
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {setting.variants.map((variant) => (
                                  <button
                                    key={variant.name}
                                    onClick={() => handleValueChange(setting, variant.value)}
                                    className="flex items-center space-x-2 p-2 text-xs border hover:border-gray-400 transition-colors"
                                    style={{
                                      borderColor: currentValue === variant.value ? '#FFA500' : 'rgba(0, 212, 255, 0.2)',
                                      background: currentValue === variant.value ? 'rgba(255, 165, 0, 0.1)' : 'transparent'
                                    }}
                                  >
                                    <div
                                      className="w-3 h-3 rounded border border-gray-600"
                                      style={{ backgroundColor: variant.value }}
                                    />
                                    <span className="text-gray-300">{variant.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500 font-mono">
                              Default: {setting.defaultValue}
                            </div>
                            {isModified && (
                              <button
                                onClick={() => resetToDefault(setting)}
                                className="flex items-center space-x-1 px-2 py-1 text-xs border hover:border-orange-400/60 transition-colors"
                                style={{
                                  borderColor: 'rgba(255, 165, 0, 0.3)',
                                  color: '#FFA500'
                                }}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>RESET</span>
                              </button>
                            )}
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

export default ColorsPanel;