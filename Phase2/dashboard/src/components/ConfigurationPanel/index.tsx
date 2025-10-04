import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Search, Settings, Download, Upload, RotateCcw, Save, Eye, EyeOff, Star, StarOff } from 'lucide-react';
import { TimingPanel } from './TimingPanel';
import { DisplayPanel } from './DisplayPanel';
import { ColorsPanel } from './ColorsPanel';
import { PerformancePanel } from './PerformancePanel';
import { ProvidersPanel } from './ProvidersPanel';
import { useConfigurationState } from './hooks/useConfigurationState';
import { useConfigurationPreview } from './hooks/useConfigurationPreview';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

interface ConfigurationPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onApply?: (config: any) => void;
}

type TabId = 'timing' | 'display' | 'colors' | 'performance' | 'providers';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
}

const TABS: TabConfig[] = [
  {
    id: 'timing',
    label: 'Timing',
    icon: <div className="w-3 h-3 border border-current rounded-full" />,
    component: TimingPanel
  },
  {
    id: 'display',
    label: 'Display',
    icon: <div className="w-3 h-3 border border-current" />,
    component: DisplayPanel
  },
  {
    id: 'colors',
    label: 'Colors',
    icon: <div className="w-3 h-3 bg-current rounded-full" />,
    component: ColorsPanel
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: <div className="w-3 h-3 border-l-2 border-current" />,
    component: PerformancePanel
  },
  {
    id: 'providers',
    label: 'Providers',
    icon: <div className="w-3 h-3 border-2 border-current rounded-sm" />,
    component: ProvidersPanel
  }
];

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  isVisible,
  onClose,
  onApply
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('timing');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState('default');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const {
    configuration,
    profiles,
    updateConfiguration,
    createProfile,
    deleteProfile,
    loadProfile,
    exportConfiguration,
    importConfiguration,
    resetToDefaults,
    undoChanges,
    redoChanges,
    canUndo,
    canRedo,
    changeHistory
  } = useConfigurationState();

  const {
    previewConfiguration,
    isPreviewActive,
    enablePreview,
    disablePreview,
    applyPreview
  } = useConfigurationPreview();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => handleSave(),
    onUndo: () => undoChanges(),
    onRedo: () => redoChanges(),
    onTogglePreview: () => togglePreviewMode(),
    onClose: onClose,
    enabled: isVisible
  });

  // Auto-save detection
  useEffect(() => {
    const hasChanges = changeHistory.length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [changeHistory]);

  const handleSave = useCallback(() => {
    if (isPreviewActive) {
      applyPreview();
    }
    onApply?.(configuration);
    setHasUnsavedChanges(false);
  }, [configuration, isPreviewActive, applyPreview, onApply]);

  const togglePreviewMode = useCallback(() => {
    if (isPreviewMode) {
      disablePreview();
    } else {
      enablePreview(configuration);
    }
    setIsPreviewMode(!isPreviewMode);
  }, [isPreviewMode, configuration, enablePreview, disablePreview]);

  const handleExport = useCallback(() => {
    const config = exportConfiguration();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaper-fx-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportConfiguration]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        importConfiguration(config);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error('Failed to import configuration:', error);
      }
    };
    reader.readAsText(file);
  }, [importConfiguration]);

  const toggleFavorite = useCallback((settingKey: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(settingKey)) {
        newFavorites.delete(settingKey);
      } else {
        newFavorites.add(settingKey);
      }
      return newFavorites;
    });
  }, []);

  const filteredSettings = useMemo(() => {
    if (!searchQuery) return null;

    const query = searchQuery.toLowerCase();
    const allSettings: any = {};

    // Collect all settings from configuration
    Object.entries(configuration).forEach(([category, settings]) => {
      Object.entries(settings as any).forEach(([key, value]) => {
        if (key.toLowerCase().includes(query) || category.toLowerCase().includes(query)) {
          if (!allSettings[category]) allSettings[category] = {};
          allSettings[category][key] = value;
        }
      });
    });

    return allSettings;
  }, [configuration, searchQuery]);

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div
        className="w-[90vw] h-[85vh] max-w-7xl max-h-[900px] bloomberg-terminal-card"
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
          border: '0.5px solid rgba(0, 212, 255, 0.3)',
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.15), inset 0 0 60px rgba(0, 20, 40, 0.3)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'rgba(0, 212, 255, 0.2)' }}
        >
          <div className="flex items-center space-x-4">
            <Settings className="w-6 h-6" style={{ color: '#FFA500' }} />
            <h1
              className="text-xl font-bold font-mono"
              style={{ color: '#FFA500', textShadow: '0 0 8px rgba(255, 165, 0, 0.4)' }}
            >
              LEAPER FX CONFIGURATION
            </h1>
            {hasUnsavedChanges && (
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: '#FFB000' }}
                title="Unsaved changes"
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Profile Selector */}
            <select
              value={selectedProfile}
              onChange={(e) => {
                setSelectedProfile(e.target.value);
                loadProfile(e.target.value);
              }}
              className="px-3 py-1 text-sm font-mono border bg-transparent"
              style={{
                borderColor: 'rgba(0, 212, 255, 0.3)',
                color: '#00D4FF',
                background: 'rgba(0, 20, 40, 0.3)'
              }}
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id} className="bg-black">
                  {profile.name}
                </option>
              ))}
            </select>

            {/* Preview Toggle */}
            <button
              onClick={togglePreviewMode}
              className={`flex items-center space-x-1 px-3 py-1 text-sm font-mono border transition-all ${
                isPreviewMode ? 'border-orange-400 text-orange-400' : 'border-cyan-400 text-cyan-400'
              }`}
              style={{
                background: isPreviewMode ? 'rgba(255, 165, 0, 0.1)' : 'rgba(0, 212, 255, 0.1)'
              }}
            >
              {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isPreviewMode ? 'Exit Preview' : 'Live Preview'}</span>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={undoChanges}
                disabled={!canUndo}
                className="p-2 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400/60 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={redoChanges}
                disabled={!canRedo}
                className="p-2 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400/60 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
              </button>

              <button
                onClick={handleExport}
                className="p-2 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400/60"
                title="Export Configuration"
              >
                <Download className="w-4 h-4" />
              </button>

              <label className="p-2 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400/60 cursor-pointer">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleSave}
                className="px-4 py-2 border text-sm font-mono font-bold"
                style={{
                  borderColor: hasUnsavedChanges ? '#FFA500' : 'rgba(0, 212, 255, 0.3)',
                  color: hasUnsavedChanges ? '#FFA500' : '#00D4FF',
                  background: hasUnsavedChanges ? 'rgba(255, 165, 0, 0.1)' : 'rgba(0, 212, 255, 0.1)'
                }}
                title="Save Configuration (Ctrl+S)"
              >
                <Save className="w-4 h-4 inline mr-1" />
                {hasUnsavedChanges ? 'SAVE CHANGES' : 'SAVED'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100%-80px)]">
          {/* Sidebar */}
          <div
            className="w-64 border-r flex flex-col"
            style={{
              borderColor: 'rgba(0, 212, 255, 0.2)',
              background: 'linear-gradient(180deg, rgba(0, 8, 20, 0.8) 0%, rgba(0, 20, 40, 0.6) 100%)'
            }}
          >
            {/* Search */}
            <div className="p-4 border-b" style={{ borderColor: 'rgba(0, 212, 255, 0.2)' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm font-mono border bg-transparent text-white placeholder-gray-500"
                  style={{
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    background: 'rgba(0, 20, 40, 0.3)'
                  }}
                />
              </div>

              {searchQuery && (
                <div className="mt-2 text-xs" style={{ color: '#666' }}>
                  {Object.keys(filteredSettings || {}).length} results found
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex-1 overflow-y-auto">
              {!searchQuery ? (
                <div className="p-2">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 text-left border-l-2 transition-all font-mono text-sm ${
                        activeTab === tab.id
                          ? 'border-orange-400 bg-orange-400/10 text-orange-400'
                          : 'border-transparent hover:border-cyan-400/50 hover:bg-cyan-400/5 text-gray-300'
                      }`}
                    >
                      <div className={activeTab === tab.id ? 'text-orange-400' : 'text-cyan-400'}>
                        {tab.icon}
                      </div>
                      <span>{tab.label.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-2">
                  {/* Search Results */}
                  {filteredSettings && Object.entries(filteredSettings).map(([category, settings]) => (
                    <div key={category} className="mb-4">
                      <div
                        className="text-xs font-bold uppercase mb-2 px-2"
                        style={{ color: '#FFA500' }}
                      >
                        {category}
                      </div>
                      {Object.entries(settings as any).map(([key]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between px-3 py-2 text-sm hover:bg-cyan-400/5 border-l-2 border-transparent hover:border-cyan-400/50"
                        >
                          <span className="text-gray-300 font-mono">{key}</span>
                          <button
                            onClick={() => toggleFavorite(`${category}.${key}`)}
                            className="text-gray-500 hover:text-yellow-400"
                          >
                            {favorites.has(`${category}.${key}`) ? (
                              <Star className="w-3 h-3 fill-current" />
                            ) : (
                              <StarOff className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Bar */}
            <div
              className="p-3 border-t text-xs font-mono"
              style={{
                borderColor: 'rgba(0, 212, 255, 0.2)',
                background: 'rgba(0, 8, 20, 0.8)'
              }}
            >
              <div className="flex justify-between items-center text-gray-400">
                <span>Profile: {selectedProfile}</span>
                <span>{Object.keys(configuration).length} categories</span>
              </div>
              {isPreviewActive && (
                <div className="mt-1 text-orange-400 animate-pulse">
                  ● Live Preview Active
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {ActiveComponent && (
                <ActiveComponent
                  configuration={configuration}
                  onConfigurationChange={updateConfiguration}
                  previewMode={isPreviewMode}
                  onPreviewChange={previewConfiguration}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  searchQuery={searchQuery}
                />
              )}
            </div>

            {/* Performance Impact Indicator */}
            <div
              className="border-t p-4"
              style={{
                borderColor: 'rgba(0, 212, 255, 0.2)',
                background: 'rgba(0, 8, 20, 0.6)'
              }}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400">Performance Impact:</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#00FF88' }}
                    />
                    <span className="text-green-400">LOW</span>
                  </div>
                </div>
                <div className="text-gray-400">
                  {changeHistory.length} changes • {favorites.size} favorites
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;