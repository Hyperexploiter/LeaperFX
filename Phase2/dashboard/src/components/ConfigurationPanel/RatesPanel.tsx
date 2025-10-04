import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Bell, BellOff, Edit3, Save, X, Clock } from 'lucide-react';
import rateManagerService, { RateData, RateOverride, RateThreshold, RateAlert } from '../../services/rateManagerService';

interface RatesPanelProps {
  configuration: any;
  onConfigurationChange: (key: string, value: any) => void;
  previewMode: boolean;
  onPreviewChange: (config: any) => void;
  favorites: Set<string>;
  onToggleFavorite: (key: string) => void;
  searchQuery: string;
}

export const RatesPanel: React.FC<RatesPanelProps> = ({
  searchQuery
}) => {
  const [rates, setRates] = useState<RateData[]>([]);
  const [alerts, setAlerts] = useState<RateAlert[]>([]);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editOverride, setEditOverride] = useState<RateOverride>({
    isActive: false
  });
  const [thresholds, setThresholds] = useState<Map<string, RateThreshold>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Initialize and subscribe to rate updates
  useEffect(() => {
    const initializeRates = async () => {
      setIsLoading(true);
      try {
        await rateManagerService.initialize();
        const currentRates = await rateManagerService.getCurrentRates();
        setRates(currentRates);

        const currentThresholds = rateManagerService.getThresholds();
        const thresholdMap = new Map<string, RateThreshold>();
        currentThresholds.forEach(threshold => {
          thresholdMap.set(threshold.symbol, threshold);
        });
        setThresholds(thresholdMap);

        const currentAlerts = rateManagerService.getAlerts(false);
        setAlerts(currentAlerts);
      } catch (error) {
        console.error('Failed to initialize rate manager:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRates();

    // Subscribe to all rate updates
    const unsubscribe = rateManagerService.subscribeToAll((currency, data) => {
      setRates(prevRates => {
        const newRates = [...prevRates];
        const index = newRates.findIndex(r => r.symbol === currency);
        if (index >= 0) {
          newRates[index] = data;
        } else {
          newRates.push(data);
        }
        return newRates;
      });
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleEditRate = useCallback((currency: string) => {
    const rate = rates.find(r => r.symbol === currency);
    if (rate) {
      setEditingRate(currency);
      setEditOverride({
        buyRate: rate.storeRate || rate.marketRate,
        sellRate: rate.storeRate || rate.marketRate,
        spread: rate.spread || 0.02,
        isActive: rate.isOverridden,
        reason: 'Manual override'
      });
    }
  }, [rates]);

  const handleSaveRate = useCallback(async () => {
    if (editingRate) {
      const success = await rateManagerService.setStoreRate(editingRate, editOverride);
      if (success) {
        setEditingRate(null);
        setEditOverride({ isActive: false });
      }
    }
  }, [editingRate, editOverride]);

  const handleCancelEdit = useCallback(() => {
    setEditingRate(null);
    setEditOverride({ isActive: false });
  }, []);

  const handleRemoveOverride = useCallback(async (currency: string) => {
    const success = await rateManagerService.removeStoreRate(currency);
    if (success) {
      // Rate will be updated via WebSocket subscription
    }
  }, []);

  // Remove unused function for now to fix TypeScript errors
  // const handleSetThreshold = useCallback(async (currency: string, threshold: Partial<RateThreshold>) => {
  //   const fullThreshold: RateThreshold = {
  //     symbol: currency,
  //     minThreshold: threshold.minThreshold || 0,
  //     maxThreshold: threshold.maxThreshold || 0,
  //     alertEnabled: threshold.alertEnabled || false,
  //     autoApply: threshold.autoApply || false
  //   };

  //   const success = await rateManagerService.setRateThreshold(fullThreshold);
  //   if (success) {
  //     setThresholds(prev => new Map(prev.set(currency, fullThreshold)));
  //   }
  // }, []);

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    const success = await rateManagerService.acknowledgeAlert(alertId);
    if (success) {
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    }
  }, []);

  const filteredRates = rates.filter(rate =>
    !searchQuery ||
    rate.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rate.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number, currency: string): string => {
    if (!Number.isFinite(value)) return 'N/A';

    if (currency === 'CAD') {
      return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      }).format(value);
    }

    return value.toFixed(4);
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cyan-400 font-mono">Loading rate data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono" style={{ color: '#FFA500' }}>
            RATE MANAGEMENT
          </h2>
          <p className="text-sm text-gray-400 font-mono mt-1">
            Monitor and override market rates in real-time
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono text-gray-400">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Last Update: {formatTimestamp(lastUpdate)}</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            rateManagerService.getStatus().connected ? 'bg-green-400' : 'bg-red-400'
          }`} />
        </div>
      </div>

      {/* Alerts */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold font-mono text-orange-400">ACTIVE ALERTS</h3>
          {alerts.filter(a => !a.acknowledged).slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className={`p-3 border-l-4 flex items-center justify-between ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-500/10' :
                alert.severity === 'high' ? 'border-orange-500 bg-orange-500/10' :
                'border-yellow-500 bg-yellow-500/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className={`w-4 h-4 ${
                  alert.severity === 'critical' ? 'text-red-400' :
                  alert.severity === 'high' ? 'text-orange-400' :
                  'text-yellow-400'
                }`} />
                <div>
                  <div className="text-sm font-mono text-white">{alert.symbol}</div>
                  <div className="text-xs text-gray-300">{alert.message}</div>
                </div>
              </div>
              <button
                onClick={() => handleAcknowledgeAlert(alert.id)}
                className="px-2 py-1 text-xs border border-gray-500 text-gray-300 hover:border-white hover:text-white"
              >
                ACK
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rate Grid */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold font-mono text-cyan-400">CURRENCY RATES</h3>
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredRates.map(rate => {
            const threshold = thresholds.get(rate.symbol);
            const isEditing = editingRate === rate.symbol;

            return (
              <div
                key={rate.symbol}
                className={`p-4 border ${
                  rate.isOverridden
                    ? 'border-orange-400/50 bg-orange-400/5'
                    : 'border-cyan-400/30 bg-cyan-400/5'
                } hover:border-opacity-70 transition-all`}
              >
                {isEditing ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-orange-400">{rate.symbol}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={handleSaveRate}
                          className="p-1 text-green-400 hover:text-green-300"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-400">Buy Rate</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editOverride.buyRate || ''}
                          onChange={(e) => setEditOverride(prev => ({
                            ...prev,
                            buyRate: parseFloat(e.target.value) || 0
                          }))}
                          className="w-full px-2 py-1 text-sm bg-black/50 border border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Sell Rate</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editOverride.sellRate || ''}
                          onChange={(e) => setEditOverride(prev => ({
                            ...prev,
                            sellRate: parseFloat(e.target.value) || 0
                          }))}
                          className="w-full px-2 py-1 text-sm bg-black/50 border border-gray-600 text-white"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editOverride.isActive}
                          onChange={(e) => setEditOverride(prev => ({
                            ...prev,
                            isActive: e.target.checked
                          }))}
                        />
                        <label className="text-xs text-gray-400">Active Override</label>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-cyan-400">{rate.symbol}</span>
                        {rate.isOverridden && (
                          <div className="px-1 py-0.5 text-xs bg-orange-400/20 text-orange-400 border border-orange-400/30">
                            OVERRIDE
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditRate(rate.symbol)}
                          className="p-1 text-gray-400 hover:text-cyan-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {threshold?.alertEnabled ? (
                          <Bell className="w-4 h-4 text-green-400" />
                        ) : (
                          <BellOff className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Market Rate</span>
                        <span className="text-sm font-mono text-white">
                          {formatCurrency(rate.marketRate, 'CAD')}
                        </span>
                      </div>

                      {rate.storeRate && rate.storeRate !== rate.marketRate && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Store Rate</span>
                          <span className="text-sm font-mono text-orange-400">
                            {formatCurrency(rate.storeRate, 'CAD')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Source</span>
                        <span className="text-xs font-mono text-gray-300">{rate.source}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Updated</span>
                        <span className="text-xs font-mono text-gray-300">
                          {formatTimestamp(rate.timestamp)}
                        </span>
                      </div>
                    </div>

                    {rate.isOverridden && (
                      <button
                        onClick={() => handleRemoveOverride(rate.symbol)}
                        className="w-full py-1 text-xs border border-red-400/30 text-red-400 hover:border-red-400/60 hover:bg-red-400/10"
                      >
                        Remove Override
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Status */}
      <div className="mt-6 p-4 border border-gray-600 bg-black/30">
        <h3 className="text-sm font-bold font-mono text-cyan-400 mb-3">SERVICE STATUS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <div className="text-gray-400">Connection</div>
            <div className={`font-bold ${
              rateManagerService.getStatus().connected ? 'text-green-400' : 'text-red-400'
            }`}>
              {rateManagerService.getStatus().connected ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Cached Rates</div>
            <div className="text-white font-bold">{rateManagerService.getStatus().cachedRates}</div>
          </div>
          <div>
            <div className="text-gray-400">Subscribers</div>
            <div className="text-white font-bold">{rateManagerService.getStatus().activeSubscribers}</div>
          </div>
          <div>
            <div className="text-gray-400">Alerts</div>
            <div className="text-orange-400 font-bold">{rateManagerService.getStatus().unacknowledgedAlerts}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatesPanel;