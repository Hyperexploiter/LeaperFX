import { useState, useCallback, useRef, useEffect } from 'react';

export interface ConfigurationProfile {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  configuration: Record<string, any>;
}

export interface ConfigurationChange {
  id: string;
  timestamp: number;
  category: string;
  key: string;
  oldValue: any;
  newValue: any;
  action: 'update' | 'reset' | 'import' | 'apply-preset';
}

const DEFAULT_CONFIGURATION = {
  timing: {
    marketDataRefresh: 5000,
    sparklineRefresh: 100,
    websocketHeartbeat: 30000,
    bluePulseSpeed: 6000,
    priceFlashDuration: 600,
    chartTransitionDuration: 300,
    commodityRotation: 21000,
    cryptoBulletinRotation: 60000,
    frameRateTarget: 60,
    debounceInterval: 300
  },
  display: {
    currencyCardHeight: 105,
    sparklineWidth: 120,
    sparklineHeight: 50,
    commodityCardHeight: 110,
    rightSidebarWidth: 200,
    maxDisplayedCurrencies: 8,
    visibleCommodities: 6,
    cryptoDisplayCount: 8,
    topMoversCount: 8,
    sparklineDataPoints: 20,
    layoutMode: 'three-column',
    cardSpacing: 'normal',
    responsiveBreakpoints: true,
    stickyHeaders: false,
    showCountryFlags: true,
    showSparklines: true,
    showPerformanceMonitor: false,
    showMarketStatus: true,
    showDataSourceStatus: true,
    showWeatherWidget: true,
    compactMode: false,
    hideZeroChanges: false
  },
  colors: {
    primaryAccent: '#FFA500',
    secondaryAccent: '#00D4FF',
    borderAccent: '#0096C7',
    positiveColor: '#00FF88',
    negativeColor: '#FF4444',
    warningColor: '#FFB000',
    neutralColor: '#888888',
    backgroundColor: '#000000',
    cardBackground: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
    sidebarBackground: 'linear-gradient(180deg, rgba(0, 8, 20, 0.8) 0%, rgba(0, 20, 40, 0.6) 100%)',
    primaryText: '#FFFFFF',
    secondaryText: '#B0B0B0',
    mutedText: '#666666',
    chartLineColor: '#FFFFFF',
    chartGridColor: 'rgba(255, 255, 255, 0.05)',
    chartGlowColor: '#FFD700'
  },
  performance: {
    bufferCapacity: 5000,
    targetFPS: 60,
    renderMode: 'balanced',
    enableWebGL: true,
    memoryManagement: false,
    fpsThresholdWarning: 45,
    fpsThresholdCritical: 30,
    memoryThreshold: 80,
    dataPointsThreshold: 4500,
    enablePerformanceMonitoring: true,
    monitoringInterval: 1000,
    enableMemoryProfiling: false,
    performanceAlerts: true,
    enableVirtualization: true,
    debounceDelay: 300,
    batchUpdates: true,
    preloadData: true,
    enableCaching: true
  },
  providers: {
    polygonPriority: 1,
    alphaPriority: 2,
    finnhubPriority: 3,
    webSocketPriority: 1,
    apiTimeout: 10000,
    webSocketTimeout: 5000,
    retryTimeout: 2000,
    healthCheckInterval: 30000,
    enableHealthMonitoring: true,
    healthThreshold: 90,
    degradedThreshold: 70,
    maxFailures: 5,
    enableAutoFallback: true,
    fallbackStrategy: 'priority-order',
    maxRetries: 3,
    recoveryTime: 60000,
    enableCaching: true
  }
};

const DEFAULT_PROFILES: ConfigurationProfile[] = [
  {
    id: 'default',
    name: 'Default Configuration',
    description: 'Standard Bloomberg Terminal style configuration',
    timestamp: Date.now(),
    configuration: DEFAULT_CONFIGURATION
  },
  {
    id: 'performance',
    name: 'Performance Optimized',
    description: 'Optimized for speed and low resource usage',
    timestamp: Date.now(),
    configuration: {
      ...DEFAULT_CONFIGURATION,
      timing: {
        ...DEFAULT_CONFIGURATION.timing,
        marketDataRefresh: 10000,
        sparklineRefresh: 200,
        frameRateTarget: 30
      },
      performance: {
        ...DEFAULT_CONFIGURATION.performance,
        targetFPS: 30,
        renderMode: 'performance',
        bufferCapacity: 2000,
        enableWebGL: false,
        memoryManagement: true
      }
    }
  },
  {
    id: 'quality',
    name: 'High Quality',
    description: 'Maximum visual quality and responsiveness',
    timestamp: Date.now(),
    configuration: {
      ...DEFAULT_CONFIGURATION,
      timing: {
        ...DEFAULT_CONFIGURATION.timing,
        marketDataRefresh: 2000,
        sparklineRefresh: 50,
        frameRateTarget: 120
      },
      performance: {
        ...DEFAULT_CONFIGURATION.performance,
        targetFPS: 120,
        renderMode: 'ultra',
        bufferCapacity: 12000
      }
    }
  }
];

export const useConfigurationState = () => {
  const [configuration, setConfiguration] = useState<Record<string, any>>(DEFAULT_CONFIGURATION);
  const [profiles, setProfiles] = useState<ConfigurationProfile[]>(DEFAULT_PROFILES);
  const [changeHistory, setChangeHistory] = useState<ConfigurationChange[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const undoStackRef = useRef<ConfigurationChange[]>([]);
  const redoStackRef = useRef<ConfigurationChange[]>([]);

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('leaper-fx-configuration');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setConfiguration(parsed);
      }

      const savedProfiles = localStorage.getItem('leaper-fx-profiles');
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        setProfiles(parsed);
      }

      const savedHistory = localStorage.getItem('leaper-fx-change-history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setChangeHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load configuration from localStorage:', error);
    }
  }, []);

  // Save configuration to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('leaper-fx-configuration', JSON.stringify(configuration));
    } catch (error) {
      console.error('Failed to save configuration to localStorage:', error);
    }
  }, [configuration]);

  // Save profiles to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('leaper-fx-profiles', JSON.stringify(profiles));
    } catch (error) {
      console.error('Failed to save profiles to localStorage:', error);
    }
  }, [profiles]);

  // Save change history to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('leaper-fx-change-history', JSON.stringify(changeHistory));
    } catch (error) {
      console.error('Failed to save change history to localStorage:', error);
    }
  }, [changeHistory]);

  const addToHistory = useCallback((change: Omit<ConfigurationChange, 'id' | 'timestamp'>) => {
    const newChange: ConfigurationChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    setChangeHistory(prev => [...prev, newChange]);
    undoStackRef.current.push(newChange);
    redoStackRef.current = []; // Clear redo stack when new change is made
  }, []);

  const updateConfiguration = useCallback((category: string, key: string, value: any) => {
    setConfiguration(prev => {
      const oldValue = prev[category]?.[key];

      // Don't update if value hasn't changed
      if (oldValue === value) return prev;

      const newConfig = {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };

      // Add to history
      addToHistory({
        category,
        key,
        oldValue,
        newValue: value,
        action: 'update'
      });

      return newConfig;
    });
  }, [addToHistory]);

  const resetToDefaults = useCallback(() => {
    const changes: Omit<ConfigurationChange, 'id' | 'timestamp'>[] = [];

    // Record all changes for history
    Object.entries(configuration).forEach(([category, settings]) => {
      Object.entries(settings as Record<string, any>).forEach(([key, value]) => {
        const defaultValue = (DEFAULT_CONFIGURATION as any)[category]?.[key];
        if (defaultValue !== undefined && defaultValue !== value) {
          changes.push({
            category,
            key,
            oldValue: value,
            newValue: defaultValue,
            action: 'reset'
          });
        }
      });
    });

    setConfiguration(DEFAULT_CONFIGURATION);

    // Add batch change to history
    changes.forEach(change => {
      addToHistory(change);
    });
  }, [configuration, addToHistory]);

  const createProfile = useCallback((name: string, description: string = '') => {
    const newProfile: ConfigurationProfile = {
      id: crypto.randomUUID(),
      name,
      description,
      timestamp: Date.now(),
      configuration: { ...configuration }
    };

    setProfiles(prev => [...prev, newProfile]);
    return newProfile.id;
  }, [configuration]);

  const deleteProfile = useCallback((profileId: string) => {
    setProfiles(prev => prev.filter(profile => profile.id !== profileId));
  }, []);

  const loadProfile = useCallback((profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    const changes: Omit<ConfigurationChange, 'id' | 'timestamp'>[] = [];

    // Record all changes for history
    Object.entries(configuration).forEach(([category, settings]) => {
      Object.entries(settings as Record<string, any>).forEach(([key, value]) => {
        const profileValue = profile.configuration[category]?.[key];
        if (profileValue !== undefined && profileValue !== value) {
          changes.push({
            category,
            key,
            oldValue: value,
            newValue: profileValue,
            action: 'apply-preset'
          });
        }
      });
    });

    setConfiguration(profile.configuration);

    // Add batch change to history
    changes.forEach(change => {
      addToHistory(change);
    });
  }, [profiles, configuration, addToHistory]);

  const exportConfiguration = useCallback(() => {
    return {
      timestamp: Date.now(),
      version: '1.0.0',
      configuration,
      profiles: profiles.filter(p => p.id !== 'default'), // Don't export default profile
      changeHistory: changeHistory.slice(-100) // Only export last 100 changes
    };
  }, [configuration, profiles, changeHistory]);

  const importConfiguration = useCallback((importData: any) => {
    try {
      if (importData.configuration) {
        const changes: Omit<ConfigurationChange, 'id' | 'timestamp'>[] = [];

        // Record all changes for history
        Object.entries(configuration).forEach(([category, settings]) => {
          Object.entries(settings as Record<string, any>).forEach(([key, value]) => {
            const importValue = importData.configuration[category]?.[key];
            if (importValue !== undefined && importValue !== value) {
              changes.push({
                category,
                key,
                oldValue: value,
                newValue: importValue,
                action: 'import'
              });
            }
          });
        });

        setConfiguration(importData.configuration);

        // Add batch change to history
        changes.forEach(change => {
          addToHistory(change);
        });
      }

      if (importData.profiles) {
        setProfiles(prev => [
          ...prev.filter(p => p.id === 'default'), // Keep default profile
          ...importData.profiles
        ]);
      }

      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }, [configuration, addToHistory]);

  const undoChanges = useCallback(() => {
    const lastChange = undoStackRef.current.pop();
    if (!lastChange) return;

    redoStackRef.current.push(lastChange);

    setConfiguration(prev => ({
      ...prev,
      [lastChange.category]: {
        ...prev[lastChange.category],
        [lastChange.key]: lastChange.oldValue
      }
    }));
  }, []);

  const redoChanges = useCallback(() => {
    const lastUndone = redoStackRef.current.pop();
    if (!lastUndone) return;

    undoStackRef.current.push(lastUndone);

    setConfiguration(prev => ({
      ...prev,
      [lastUndone.category]: {
        ...prev[lastUndone.category],
        [lastUndone.key]: lastUndone.newValue
      }
    }));
  }, []);

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  return {
    configuration,
    profiles,
    changeHistory,
    updateConfiguration,
    resetToDefaults,
    createProfile,
    deleteProfile,
    loadProfile,
    exportConfiguration,
    importConfiguration,
    undoChanges,
    redoChanges,
    canUndo,
    canRedo
  };
};