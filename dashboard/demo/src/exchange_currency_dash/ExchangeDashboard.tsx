import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Clock, Sun, Moon, Plus, X, Loader, AlertTriangle, ArrowUp, TrendingUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis, XAxis, CartesianGrid } from 'recharts';
// Note: Frankfurter-based exchangeRateService removed from UI for shipping velocity.
// All FX rates now come from unifiedDataAggregator (Polygon-first) and will be revisited
// when we move to a proper backend.
import webSocketService, { WebSocketEvent } from '../services/webSocketService';
import { RealTimeCryptoSection } from './components/RealTimeCryptoSection';
import { useMarketHealth } from './hooks/useRealTimeData';
import { useHighPerformanceEngine } from './hooks/useHighPerformanceEngine';
import { HighPerformanceSparkline } from './components/HighPerformanceSparkline';
import { SignalEffects, TickerTakeover, PerformanceMonitor } from './components/SignalEffects';
import type { RotationItem } from './services/RotationScheduler';
import { FOREX_INSTRUMENTS, CRYPTO_INSTRUMENTS, COMMODITY_INSTRUMENTS } from './config/instrumentCatalog';
import { getSparklineTheme } from './services/themePresets';
import realTimeDataManager from './services/realTimeDataManager';
import unifiedDataAggregator from './services/unifiedDataAggregator';
import DataSourceStatus from './components/DataSourceStatus';
import MarketIndicesGrid from './components/MarketIndicesGrid';
import LiveClock from './components/LiveClock';
import TopMoversGrid from './components/TopMoversGrid';
import './styles/sexymodal.css';

// Lightweight error boundary to prevent blank page on runtime errors
class LocalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }>{
  constructor(props: any){
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any){
    return { hasError: true, message: String(error?.message || error) };
  }
  componentDidCatch(error: any, info: any){
    console.error('ExchangeDashboard crashed:', error, info);
  }
  render(){
    if(this.state.hasError){
      return (
        <div className="min-h-screen bg-black text-gray-300 flex items-center justify-center p-6">
          <div className="max-w-lg w-full border border-red-500/40 bg-red-900/10 rounded p-4">
            <div className="text-red-400 font-bold mb-2">Dashboard failed to render</div>
            <div className="text-sm">{this.state.message || 'Unknown error'}</div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}


// --- Type Definitions for TypeScript ---
interface CurrencyInfo { name: string; code: string; }
interface ChartData { name:string; value: number; }

// --- Sub-Component Prop Types ---
// Legacy TickerProps removed (Frankfurter UI removed). See AggregatorTicker below.
interface DarkModeToggleProps { darkMode: boolean; setDarkMode: (value: boolean) => void; }
interface ConnectionStatusProps {
  isConnected: boolean;
  health: 'healthy' | 'degraded' | 'unhealthy';
  error?: string | null;
}

// --- Configuration ---
const BASE_CURRENCY = 'CAD';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const DEFAULT_SPREAD_PERCENT = 1.5;

// --- Market Watch (right sidebar) ---

type Trend = 'up' | 'down';

interface MarketItem {
  name: string;
  symbol: string;
  value: string;
  change: string;
  changePercent?: string;
  trend: Trend;
  engineSymbol?: string; // for sparkline buffers
}

const generateMiniData = (trend: Trend, points = 20) => {
  const base = trend === 'up' ? 1.0 + Math.random() * 0.2 : 1.2 - Math.random() * 0.2;
  return Array.from({ length: points }, (_, i) => ({
    time: i,
    value: base + (trend === 'up' ? i : -i) * 0.002 + (Math.random() - 0.5) * 0.006
  }));
};

// Dynamic Bulletin Component
interface CryptoMarketData { symbol: string; name: string; change: number; }

const DynamicBulletin: React.FC = () => {
  const [showGainers, setShowGainers] = useState(true);
  const [currentData, setCurrentData] = useState<CryptoMarketData[]>([]);
  const [cryptoMap, setCryptoMap] = useState<Record<string, { name: string; change: number }>>({});

  // Subscribe to crypto aggregator and compute top gainers/losers
  useEffect(() => {
    const symbols = CRYPTO_INSTRUMENTS.map(i => i.symbol);
    const unsubs = symbols.map(sym => unifiedDataAggregator.subscribe(sym, (md) => {
      const base = sym.split('/')[0];
      const chg = typeof md.changePercent24h === 'number' && Number.isFinite(md.changePercent24h)
        ? md.changePercent24h
        : 0;
      setCryptoMap(prev => ({ ...prev, [sym]: { name: base, change: chg } }));
    }));
    return () => { unsubs.forEach(u => { try { u(); } catch {} }); };
  }, []);

  // Rotate between gainers and losers every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowGainers(prev => {
        const newShow = !prev;
        const list = Object.entries(cryptoMap).map(([sym, v]) => ({ symbol: sym.split('/')[0], name: v.name, change: v.change }));
        const gainers = list.filter(x => x.change >= 0).sort((a, b) => b.change - a.change).slice(0, 5);
        const losers = list.filter(x => x.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
        setCurrentData(newShow ? gainers : losers);
        return newShow;
      });
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [cryptoMap]);

  // Seed initial list from current snapshot
  useEffect(() => {
    const list = Object.entries(cryptoMap).map(([sym, v]) => ({ symbol: sym.split('/')[0], name: v.name, change: v.change }));
    const gainers = list.filter(x => x.change >= 0).sort((a, b) => b.change - a.change).slice(0, 5);
    const losers = list.filter(x => x.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
    setCurrentData(showGainers ? gainers : losers);
  }, [cryptoMap, showGainers]);

  const formatCryptoList = (data: CryptoMarketData[]) => {
    return data.map(item =>
      `${item.symbol} ${item.change > 0 ? '+' : ''}${item.change.toFixed(1)}%`
    ).join(' | ');
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Toronto'
    }) + ' EST';
  };

  return (
    <div className="mt-3 bg-black border transition-all duration-1000 flex flex-col min-h-[200px]" style={{
      background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
      border: '0.5px solid rgba(255, 165, 0, 0.2)',
      borderLeftWidth: '4px',
      borderLeftColor: '#FFA500'
    }}>
      <div className="p-3">
        <div className="flex flex-col sm:flex-row items-start sm:space-x-3">
          {/* Triangle separator left */}
          <div className="flex items-center">
            <svg width="12" height="20" viewBox="0 0 12 20" className="mr-2">
              <path d="M0 0 L12 10 L0 20 Z" fill="#FFA500" opacity="0.6"/>
            </svg>
          </div>

          <span className="text-xs font-bold uppercase transition-colors duration-500" style={{
            color: '#FFA500',
            fontFamily: 'monospace',
            minWidth: '120px'
          }}>
            {showGainers ? 'TOP GAINERS' : 'TOP LOSERS'}
          </span>

          {/* Triangle separator middle */}
          <div className="flex items-center">
            <svg width="12" height="20" viewBox="0 0 12 20" className="mx-2">
              <path d="M0 0 L12 10 L0 20 Z" fill="#00D4FF" opacity="0.4"/>
            </svg>
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-white mb-1 transition-all duration-500">
              {showGainers ? 'Crypto Market Surge' : 'Crypto Market Decline'}
            </p>
            <p className="text-xs font-mono transition-all duration-500" style={{ color: '#FFA500' }}>
              {formatCryptoList(currentData)}
            </p>
          </div>

          <span className="text-xs ml-auto" style={{ color: '#00D4FF', fontFamily: 'monospace' }}>
            {getCurrentTime()}
          </span>
        </div>
      </div>
      {/* Additional space filler to extend to full height */}
      <div className="flex-1"></div>
    </div>
  );
};

const MarketWatchCard: React.FC<{ item: MarketItem; getBuffer: (symbol: string) => any }> = ({ item, getBuffer }) => {
  const color = item.trend === 'up' ? '#00FF88' : '#FF4444';
  const gradientId = `mw-${item.symbol}-grad`;
  const [data, setData] = useState(() => generateMiniData(item.trend, 20));

  // Synchronized chart updates every 3 seconds with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        if (prevData.length === 0) return prevData;

        const lastValue = prevData[prevData.length - 1].value;
        const trendMultiplier = item.trend === 'up' ? 1.001 : 0.999;
        const volatility = (Math.random() - 0.5) * 0.004;

        // Add smooth wave-like movement
        const waveOffset = Math.sin(Date.now() / 8000 + Math.random() * Math.PI) * 0.003;
        const newValue = Math.max(0, lastValue * trendMultiplier * (1 + volatility + waveOffset));

        return [...prevData.slice(1), { time: prevData.length, value: newValue }];
      });
    }, 3000); // Synchronized with other charts

    return () => clearInterval(interval);
  }, [item.trend, item.symbol]);

  // Regenerate data when trend changes
  useEffect(() => {
    setData(generateMiniData(item.trend, 20));
  }, [item.trend]);

  return (
    <div className="bg-black border h-[110px]" style={{
      background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
      border: '0.5px solid rgba(0, 212, 255, 0.15)',
      boxShadow: '0 0 15px rgba(0, 212, 255, 0.03)'
    }}>
      <div className="p-2 h-full flex items-center justify-between">
        <div className="flex-1">
          <div className="font-bold text-xs" style={{ color: '#FFA500', fontFamily: 'monospace' }}>{item.symbol}</div>
          <div className={`font-mono font-bold text-sm mt-0.5 ${item.value === '—' ? 'text-gray-500' : 'text-white'}`}>{item.value}</div>
          <div className="font-bold text-xs mt-1" style={{ color: item.trend === 'up' ? '#00FF88' : '#FF4444' }}>
            {item.value !== '—' ? (item.trend === 'up' ? '▲' : '▼') : '•'} {item.change}
            {item.changePercent && item.value !== '—' && (
              <span className="ml-1" style={{ color: '#666' }}>({item.changePercent})</span>
            )}
            {item.value === '—' && (
              <span className="ml-1 text-[10px] uppercase" style={{ color: '#666' }}>
                No Data
              </span>
            )}
          </div>
        </div>
        <div className="w-24 h-12 flex items-center">
          {(() => { const th = getSparklineTheme('commodity'); return (
          <HighPerformanceSparkline
            symbol={item.engineSymbol || item.symbol}
            buffer={getBuffer(item.engineSymbol || item.symbol)}
            width={96}
            height={48}
            color={item.trend === 'up' ? th.colorUp : th.colorDown}
            glowIntensity={th.glowIntensity}
            showStats={false}
            isSignalActive={false}
            volatilityAdaptive={true}
            baseLineWidth={th.baseLineWidth}
            maxLineWidth={th.maxLineWidth}
            smoothingFactor={th.smoothingFactor}
            renderMode={'areaNeon'}
            lineColor={'#FFFFFF'}
            expandOnHover={false}
          />) })()}
        </div>
      </div>
    </div>
  );
};

export default function ExchangeDashboard(): React.ReactElement {
  // Aggregator-backed FX snapshot for displayed currencies (shipping velocity on GH Pages)
  const [fxMap, setFxMap] = useState<Record<string, { rate: number; prev: number | null; ts: number }>>({});
  const [displayedCurrencies, setDisplayedCurrencies] = useState<string[]>(['USD', 'EUR', 'GBP', 'JPY', 'CHF']);
  const [currencyToAdd, setCurrencyToAdd] = useState<string>('CNY');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [commodityRotationIndex, setCommodityRotationIndex] = useState<number>(0);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState<boolean>(false);

  // Real-time data integration
  const { health, isConnected, error: marketError } = useMarketHealth();

  // High-performance engine
  const engine = useHighPerformanceEngine({
    bufferCapacity: 5000,
    targetFPS: 60,
    debugMode: false,
    sparklineConfig: {
      strokeColor: '#FFD700',
      fillGradient: { start: 'rgba(255, 215, 0, 0.6)', end: 'rgba(255, 140, 0, 0.1)' },
      glowIntensity: 3
    },
    signalConfig: {
      priceChangeThreshold: 2.0,
      priceChangeWindow: 5,
      volatilityMultiplier: 2.5,
      bookImbalanceThreshold: 0.7,
      minSignalDuration: 8,
      cooldownPeriod: 30
    }
  });

  // Connect engine to centralized data manager - run once on mount
  useEffect(() => {
    // Use stable pushData reference to avoid re-subscribing
    const pushData = engine.pushData;

    // Initialize UI data feeds via realTimeDataManager (no engine push)
    realTimeDataManager.connect();

    // Initialize unified aggregator and connect it to the engine as the single producer
    const unsubscribe = unifiedDataAggregator.setEnginePushFunction(pushData);

    // Debug: confirm engine wiring
    try {
      const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env?.VITE_DEBUG_MODE : undefined;
      const win = (typeof window !== 'undefined') ? (window as any).__ENV__?.VITE_DEBUG_MODE : undefined;
      const node = (typeof process !== 'undefined') ? (process as any).env?.VITE_DEBUG_MODE : undefined;
      const debug = String(vite ?? win ?? node ?? '').toLowerCase() === 'true';
      if (debug) console.debug('[Dashboard] Engine connected to UnifiedDataAggregator');
    } catch {}

    unifiedDataAggregator.initialize().catch(err => console.error('Aggregator init failed', err));

    return () => {
      try { unsubscribe?.(); } catch {}
      // Ensure background schedulers and provider timers are stopped when unmounting
      try { unifiedDataAggregator.shutdown(); } catch {}
    };
  }, []); // Empty dependency array - run once on mount

  // Keyboard shortcuts (avoid depending on entire engine object)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P for performance monitor
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowPerformanceMonitor(prev => !prev);
      }

      // Ctrl/Cmd + Shift + S for simulated signal
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        // Simulate a high-priority signal
        const testSignal = {
          id: `test_${Date.now()}`,
          type: 'price_spike' as const,
          symbol: displayedCurrencies[0],
          timestamp: Date.now(),
          magnitude: 5,
          direction: 'up' as const,
          metadata: {
            priceChange: 3.5,
            volatility: 0.8
          },
          priority: 8,
          duration: 10000
        };
        engine.services.signalAggregator?.getEngine(displayedCurrencies[0]).registerNewsEvent(
          displayedCurrencies[0],
          'Test Signal Alert',
          3.5
        );
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [displayedCurrencies]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    const isSystemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setDarkMode(isSystemDark);
  }, []);

  const currencyInfo: { [key: string]: CurrencyInfo } = {
    USD: { name: 'US Dollar', code: 'us' }, EUR: { name: 'Euro', code: 'eu' },
    GBP: { name: 'British Pound', code: 'gb' }, JPY: { name: 'Japanese Yen', code: 'jp' },
    CHF: { name: 'Swiss Franc', code: 'ch' }, AUD: { name: 'Australian Dollar', code: 'au' },
    CAD: { name: 'Canadian Dollar', code: 'ca' }, CNY: { name: 'Chinese Yuan', code: 'cn' },
    INR: { name: 'Indian Rupee', code: 'in' }, MXN: { name: 'Mexican Peso', code: 'mx' },
  };

  const getCurrencyInfo = (code: string): CurrencyInfo => currencyInfo[code] || { name: code, code: '' };

  // Frankfurter fetching removed — aggregator is the single source of truth for FX.

  // Subscribe to aggregator FX for displayed currencies
  useEffect(() => {
    const unsubs: Array<() => void> = [];
    displayedCurrencies.forEach((ccy) => {
      const symbol = `${ccy}/CAD`;
      const unsub = unifiedDataAggregator.subscribe(symbol, (md) => {
        const value = Number.isFinite(md.priceCAD) ? md.priceCAD : Number.isFinite(md.price) ? md.price : NaN;
        if (!Number.isFinite(value)) return;
        setFxMap((prev) => {
          const prevEntry = prev[ccy];
          return { ...prev, [ccy]: { rate: value, prev: prevEntry ? prevEntry.rate : null, ts: md.timestamp } };
        });
      });
      unsubs.push(unsub);
    });
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => { unsubs.forEach(fn => { try { fn(); } catch {} }); clearTimeout(timer); };
  }, [displayedCurrencies]);

  // Set up WebSocket connection for real-time rate updates from store owner
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;
    (async () => {
      try {
        await webSocketService.connect();
        unsubscribe = webSocketService.subscribe((event: WebSocketEvent) => {
          if (!active) return;
          if (event.type === 'rate_update') {
            const { currency, buyRate, sellRate } = event.data;
            const avgRate = (parseFloat(buyRate) + parseFloat(sellRate)) / 2;
            if (Number.isFinite(avgRate) && avgRate > 0) {
              setFxMap(prev => {
                const prevEntry = prev[currency];
                return { ...prev, [currency]: { rate: avgRate, prev: prevEntry ? prevEntry.rate : null, ts: Date.now() } };
              });
            }
          }
        });
      } catch (err) {
        console.error('Failed to set up WebSocket connection:', err);
      }
    })();
    return () => {
      active = false;
      try { unsubscribe?.(); } catch {}
      try { webSocketService.disconnect(); } catch {}
    };
  }, []);

  // Define all commodities data
  // Aggregator-backed commodities snapshot (shipping velocity on GH Pages)
  const [commoditiesMap, setCommoditiesMap] = useState<Record<string, MarketItem>>({});

  // Map instrument symbols to UI labels (compact)
  const commoditySymbols = useMemo(() => {
    // Choose a core set for display
    const wanted = ['XAU/CAD', 'XAG/CAD', 'XPT/CAD', 'WTI/CAD', 'BRENT/CAD', 'NG/CAD'];
    const known = new Set(COMMODITY_INSTRUMENTS.map(i => i.symbol));
    return wanted.filter(w => known.has(w));
  }, []);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    const toLabel = (sym: string) => {
      if (sym.startsWith('XAU')) return 'GOLD';
      if (sym.startsWith('XAG')) return 'SILVER';
      if (sym.startsWith('XPT')) return 'PLAT.';
      if (sym.startsWith('XPD')) return 'PALL.';
      if (sym.startsWith('WTI')) return 'CRUDE';
      if (sym.startsWith('BRENT')) return 'BRENT';
      if (sym.startsWith('NG')) return 'NAT.GAS';
      return sym.replace('/CAD','');
    };
    commoditySymbols.forEach((symbol) => {
      const unsub = unifiedDataAggregator.subscribe(symbol, (md) => {
        const price = Number.isFinite(md.priceCAD) ? md.priceCAD : Number.isFinite(md.price) ? md.price : NaN;
        if (!Number.isFinite(price)) return;
        const chgPct = typeof md.changePercent24h === 'number' && Number.isFinite(md.changePercent24h) ? md.changePercent24h : 0;
        const trend: Trend = chgPct >= 0 ? 'up' : 'down';
        setCommoditiesMap(prev => ({
          ...prev,
          [symbol]: {
            name: toLabel(symbol),
            symbol: toLabel(symbol),
            engineSymbol: symbol.replace('/',''),
            value: price >= 1000 ? price.toFixed(0) : price >= 1 ? price.toFixed(2) : price.toFixed(4),
            change: `${chgPct >= 0 ? '+' : ''}${Math.abs(chgPct).toFixed(2)}`,
            changePercent: `${Math.abs(chgPct).toFixed(2)}%`,
            trend
          }
        }));
      });
      unsubs.push(unsub);
    });
    return () => { unsubs.forEach(u => { try { u(); } catch {} }); };
  }, [commoditySymbols]);

  const allCommodities = useMemo<MarketItem[]>(() => {
    const list: MarketItem[] = [];
    commoditySymbols.forEach(sym => { const it = commoditiesMap[sym]; if (it) list.push(it); });
    // Fallback “No Data” cards if nothing yet
    if (list.length === 0) {
      return commoditySymbols.slice(0, 6).map(sym => ({ name: sym.replace('/CAD',''), symbol: sym.replace('/CAD',''), value: '—', change: '—', changePercent: undefined, trend: 'down' as Trend }));
    }
    return list;
  }, [commoditiesMap, commoditySymbols]);


  // Initialize rotation scheduler for commodities (depend on stable callbacks only)
  const { initializeRotation, startRotation, stopRotation } = engine;
  useEffect(() => {
    const rotationItems: RotationItem[] = allCommodities.map((item, index) => ({
      id: `commodity_${item.symbol}`,
      symbol: item.symbol,
      category: 'commodity',
      weight: item.trend === 'up' ? 1.5 : 1.0,
      lastShown: 0,
      showCount: 0,
      pinned: index < 3, // Pin first 3 commodities
      signalActive: false
    }));

    initializeRotation('commodities', rotationItems, {
      fixedSlots: 3,
      spotlightSlots: 3,
      rotationInterval: 21,
      fairnessWindow: 2,
      sectorDiversity: false
    });

    startRotation('commodities', 21000);

    return () => stopRotation('commodities');
  }, [initializeRotation, startRotation, stopRotation, allCommodities]);

  // Old rotation logic - kept for compatibility
  useEffect(() => {
    const interval = setInterval(() => {
      setCommodityRotationIndex((prev) => (prev + 1) % 1);
    }, 21000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCurrency = () => {
    if (currencyToAdd && !displayedCurrencies.includes(currencyToAdd)) {
      setDisplayedCurrencies(prev => [...prev, currencyToAdd]);
    }
  };

  const handleRemoveCurrency = (currencyCode: string) => {
    setDisplayedCurrencies(prev => prev.filter(c => c !== currencyCode));
  };

  const calculateRates = useCallback((foreignCurrency: string) => {
    const fx = fxMap[foreignCurrency];
    if (!fx || !Number.isFinite(fx.rate)) return { customerBuys: '—', customerSells: '—', spread: '—', change24h: '—', chartData: [] };

    const marketRate = fx.rate; // already X/CAD from aggregator
    const spreadAmount = marketRate * (DEFAULT_SPREAD_PERCENT / 100);
    const weBuyAt = marketRate - spreadAmount;
    const weSellAt = marketRate + spreadAmount;
    const spread = ((weSellAt - weBuyAt) / weBuyAt) * 100;

    // NOTE: We will replace this with true 24h delta from backend later
    const change24h: string | number = fx.prev && fx.prev > 0 ? ((marketRate - fx.prev) / fx.prev) * 100 : '—';

    // Generate a synthetic Bloomberg-style mini-chart for visual continuity
    const startRate = fx.prev && fx.prev > 0 ? fx.prev : marketRate * 0.99;
    const endRate = marketRate;
    const points = 12;
    const chartData: ChartData[] = [];
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const linearValue = startRate + (endRate - startRate) * progress;
      const timeOffset = Date.now() / 15000;
      const waveOffset = Math.sin(progress * Math.PI * 1.5 + timeOffset) * (Math.abs(endRate - startRate) * 0.06);
      const momentum = Math.sin((progress * Math.PI * 0.8) + timeOffset * 0.5) * (Math.abs(endRate - startRate) * 0.04);
      const smoothJitter = (i > 0 && i < points - 1) ? (Math.random() - 0.5) * (Math.abs(endRate - startRate) * 0.03) : 0;
      chartData.push({ name: `p${i}`, value: linearValue + waveOffset + momentum + smoothJitter });
    }

    return {
      customerBuys: weSellAt.toFixed(4),
      customerSells: weBuyAt.toFixed(4),
      spread: spread.toFixed(2),
      change24h: typeof change24h === 'number' ? change24h.toFixed(2) : '—',
      chartData,
    };
  }, [fxMap]);

  // Get visible commodities (6 at a time with rotation)
  const visibleCommodities = useMemo(() => {
    if (allCommodities.length <= 6) return allCommodities;
    const rotated = allCommodities.slice(commodityRotationIndex).concat(allCommodities.slice(0, commodityRotationIndex));
    return rotated.slice(0, 6);
  }, [allCommodities, commodityRotationIndex]);

  const availableToAdd = useMemo(() => {
    // Build options from instrument catalog (X/CAD pairs only)
    const opts = Array.from(new Set(FOREX_INSTRUMENTS.filter(i => i.quoteCurrency === 'CAD').map(i => i.baseCurrency)))
      .filter(ccy => !displayedCurrencies.includes(ccy) && ccy !== BASE_CURRENCY)
      .map(ccy => ({ value: ccy, label: ccy }));
    return opts;
  }, [displayedCurrencies]);

  return (
    <LocalErrorBoundary>
    <div className="h-screen bg-black text-gray-100 font-sans overflow-hidden">
      <div className="h-screen flex flex-col min-h-0">
        <main className="flex-1 flex flex-col px-2 py-2 overflow-hidden">
          {/* Header row with connection + data source status */}
          <div className="flex items-center justify-between mb-2">
            <ConnectionStatus isConnected={isConnected} health={health} error={marketError} />
            <div className="ml-2">
              <DataSourceStatus />
            </div>
          </div>
          {isLoading && <div className="flex justify-center items-center p-10 bg-gray-900 rounded-lg shadow-md"><Loader className="h-12 w-12 mr-4 animate-spin text-cyan-400" /><span className="text-lg text-white">Loading rates...</span></div>}
          {error && !isLoading && <div className="bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 rounded-lg shadow-md flex items-center" role="alert"><AlertTriangle className="h-6 w-6 mr-3" /><div><p className="font-bold">Error:</p><p>{error}</p></div></div>}
          
          {!isLoading && !error && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col xl:flex-row gap-3">
                {/* Left column - Currency rectangles + Daily Bulletin */}
                <div className="flex-1 min-w-0 flex flex-col space-y-3 overflow-hidden">
                  <div className="space-y-2 overflow-visible">
                  {displayedCurrencies.map((currency) => {
                    const { customerBuys, customerSells, spread, change24h, chartData } = calculateRates(currency);
                    const info = getCurrencyInfo(currency);
                    // Handle N/A values properly - show neutral state when no data
                    const changeValue = parseFloat(change24h);
                    const isPositive = Number.isFinite(changeValue) ? changeValue >= 0 : null;

                    const noData = customerBuys === '—' && customerSells === '—';
                    return (
                      <div key={currency} className="h-[105px] relative group overflow-hidden transition-all duration-200" style={{
                        background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
                        border: '0.5px solid rgba(0, 212, 255, 0.15)',
                        boxShadow: '0 0 20px rgba(0, 212, 255, 0.05), inset 0 0 30px rgba(0, 20, 40, 0.3)'
                      }}>
                        <button onClick={() => handleRemoveCurrency(currency)} className="absolute top-2 right-2 z-10 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                        <div className="h-full flex items-center px-4">
                          {/* Left section - Currency info */}
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              <img src={`https://flagcdn.com/w40/${info.code}.png`} width="24" alt={`${info.name} flag`} className="mr-2"/>
                              <h3 className="text-base font-bold" style={{
                                color: '#FFA500',
                                fontFamily: 'monospace'
                              }}>{currency}</h3>
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span style={{ color: '#4A90E2' }}>We Buy: </span>
                                <span className={`font-mono font-bold ${noData ? 'text-gray-500' : 'text-white'}`}>{customerSells}</span>
                              </div>
                              <div className="text-sm">
                                <span style={{ color: '#4A90E2' }}>We Sell: </span>
                                <span className="font-mono font-bold" style={{ color: noData ? '#888888' : '#00FF88' }}>{customerBuys}</span>
                              </div>
                              {noData && (
                                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#666' }}>No Data</div>
                              )}
                            </div>
                          </div>

                          {/* Center section - High-Performance Sparkline */}
                          <div className="w-[120px] h-[50px] mx-4" style={{
                            background: 'linear-gradient(135deg, rgba(0, 8, 20, 0.6) 0%, rgba(0, 20, 40, 0.4) 100%)',
                            border: '0.5px solid rgba(0, 212, 255, 0.2)',
                            borderRadius: '0px',
                            boxShadow: 'inset 0 0 10px rgba(0, 20, 40, 0.3)'
                          }}>
                            {(() => { const th = getSparklineTheme('forex'); return (
                            <HighPerformanceSparkline
                              symbol={`${currency}CAD`}
                              buffer={engine.getBuffer(`${currency}CAD`)}
                              width={120}
                              height={50}
                              color={isPositive === null ? '#888888' : (isPositive ? th.colorUp : th.colorDown)}
                              glowIntensity={th.glowIntensity}
                              showStats={false}
                              isSignalActive={engine.engineState.topSignal?.symbol === currency}
                              volatilityAdaptive={true}
                              baseLineWidth={th.baseLineWidth}
                              maxLineWidth={th.maxLineWidth}
                              smoothingFactor={th.smoothingFactor}
                              renderMode={'areaNeon'}
                              lineColor={'#FFFFFF'}
                              expandOnHover={false}
                            />) })()}
                          </div>

                          {/* Keep old chart as fallback - hidden */}
                          <div className="hidden">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                <defs>
                                  <linearGradient id={`bloomberg-gradient-${currency}`} x1="0" y1="0" x2="0" y2="1">
                                    {isPositive === null ? (
                                      <>
                                        <stop offset="0%" stopColor="#888888" stopOpacity={0.9}/>
                                        <stop offset="25%" stopColor="#777777" stopOpacity={0.7}/>
                                        <stop offset="50%" stopColor="#666666" stopOpacity={0.5}/>
                                        <stop offset="75%" stopColor="#555555" stopOpacity={0.3}/>
                                        <stop offset="100%" stopColor="#444444" stopOpacity={0.1}/>
                                      </>
                                    ) : isPositive ? (
                                      <>
                                        <stop offset="0%" stopColor="#FFD700" stopOpacity={0.9}/>
                                        <stop offset="25%" stopColor="#FFB000" stopOpacity={0.7}/>
                                        <stop offset="50%" stopColor="#FF8C00" stopOpacity={0.5}/>
                                        <stop offset="75%" stopColor="#FF6B00" stopOpacity={0.3}/>
                                        <stop offset="100%" stopColor="#FF4500" stopOpacity={0.1}/>
                                      </>
                                    ) : (
                                      <>
                                        <stop offset="0%" stopColor="#8B0000" stopOpacity={0.9}/>
                                        <stop offset="25%" stopColor="#A52A2A" stopOpacity={0.7}/>
                                        <stop offset="50%" stopColor="#DC143C" stopOpacity={0.5}/>
                                        <stop offset="75%" stopColor="#FF4444" stopOpacity={0.3}/>
                                        <stop offset="100%" stopColor="#FF6666" stopOpacity={0.1}/>
                                      </>
                                    )}
                                  </linearGradient>
                                  <filter id={`glow-${currency}`}>
                                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                                    <feMerge>
                                      <feMergeNode in="coloredBlur"/>
                                      <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                  </filter>
                                </defs>
                                <CartesianGrid
                                  stroke="rgba(255, 255, 255, 0.05)"
                                  strokeWidth={0.5}
                                  vertical={false}
                                  horizontal={true}
                                  strokeDasharray="1 1"
                                />
                                <YAxis hide domain={['dataMin', 'dataMax']} />
                                <Area
                                  type="monotoneX"
                                  dataKey="value"
                                  stroke={isPositive === null ? '#888888' : (isPositive ? '#FFD700' : '#8B0000')}
                                  strokeWidth={1.5}
                                  fillOpacity={1}
                                  fill={`url(#bloomberg-gradient-${currency})`}
                                  dot={false}
                                  filter={`url(#glow-${currency})`}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Right section - 24h change */}
                          <div className="text-right">
                            <div className="font-mono font-extrabold text-lg tabular-nums" style={{
                              color: isPositive === null ? '#888888' : (isPositive ? '#00FF88' : '#FF4444'),
                              textShadow: isPositive === null ? 'none' : (isPositive ? '0 0 3px rgba(0, 255, 136, 0.45)' : '0 0 3px rgba(255, 68, 68, 0.45)')
                            }}>
                              {isPositive !== null && <span className="mr-1 align-middle text-[10px]">{isPositive ? '▲' : '▼'}</span>}
                              {change24h !== 'N/A' ? `${change24h}%` : '—'}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#666', letterSpacing: '0.08em' }}>24H</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>

                  {/* Indices & Yields Grid - Under currency column */}
                  <div className="pt-2">
                    <MarketIndicesGrid getBuffer={engine.getBuffer} />
                  </div>
                </div>

                {/* Middle column - Real-Time Crypto Section + Dynamic Bulletin */}
                <div className="flex-1 min-w-0">
                  <RealTimeCryptoSection />
                  {/* Top Movers Grid with integrated spotlight */}
                  <div className="mt-4">
                    <TopMoversGrid getBuffer={engine.getBuffer} />
                  </div>
                </div>

                {/* Right column - commodities squares (one per line) */}
                <div className="flex-shrink-0 w-[200px] flex flex-col gap-2">
                  {/* Fixed height container for commodity rotation */}
                  <div className="h-[690px] overflow-hidden flex flex-col gap-2">
                    {visibleCommodities.map((item, idx) => (
                      <MarketWatchCard key={`${item.symbol}-${idx}`} item={item} getBuffer={engine.getBuffer} />
                    ))}
                  </div>
                  {/* Weather & Time Widget - Combined */}
                  <div className="bg-black border h-[100px] mt-auto" style={{
                    background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
                    border: '0.5px solid rgba(0, 150, 255, 0.2)',
                    boxShadow: '0 0 15px rgba(0, 150, 255, 0.03)'
                  }}>
                    <div className="p-2 h-full flex flex-col">
                      {/* Time Display */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-[10px]" style={{ color: '#FFA500', fontFamily: 'monospace' }}>CURRENT TIME</div>
                        <LiveClock />
                      </div>

                      {/* Weather Display */}
                      <div className="flex items-center justify-between flex-1">
                        <div className="flex-1">
                          <div className="font-bold text-[10px] mb-1" style={{ color: '#FFA500', fontFamily: 'monospace' }}>WEATHER</div>
                          <div className="text-white font-mono font-bold text-xs">Toronto</div>
                          <div className="text-[10px]" style={{ color: '#00FF88' }}>Clear</div>
                        </div>
                        <div className="flex items-center">
                          <span style={{ fontSize: '18px', marginRight: '4px' }}>☀️</span>
                          <div>
                            <div className="font-mono font-bold text-sm" style={{ color: '#FFD700' }}>22°C</div>
                            <div className="text-[8px]" style={{ color: '#666' }}>H:24° L:18°</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Performance Monitor Overlay */}
          <PerformanceMonitor
            fps={engine.engineState.fps}
            frameTime={engine.engineState.frameTime}
            visible={showPerformanceMonitor}
          />

          {/* Spotlight now integrated in TopMoversGrid */}

          {/* Ticker Takeover for high-priority signals */}
          <TickerTakeover
            signal={engine.engineState.topSignal}
            duration={10000}
          />
        </main>

        {/* Bottom ticker with logo - Origin point for price ticker */}
        <footer className="bg-black relative" style={{
          borderTop: '0.5px solid rgba(0, 212, 255, 0.4)',
          background: 'black'
        }}>
          <div className="flex items-center h-8">
            <div className="px-4 flex items-center justify-center h-full" style={{
              borderRight: '0.5px solid rgba(0, 212, 255, 0.4)',
              background: 'black',
              minWidth: '180px'
            }}>
              <div className="font-bold text-sm tracking-wider" style={{
                color: '#FFA500',
                textShadow: '0 0 8px rgba(255, 165, 0, 0.4)',
                fontFamily: 'monospace'
              }}>SAADAT EXCHANGE</div>
            </div>
            <div className="flex-1 h-full">
              <AggregatorTicker currencies={displayedCurrencies} fxMap={fxMap} />
            </div>
          </div>
        </footer>
      </div>
    </div>
    </LocalErrorBoundary>
  );
}

// Use a function declaration to avoid any bundler/hoisting pitfalls in production builds
function ConnectionStatus({ isConnected, health, error }: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (!isConnected) return '#FF4444';
    switch (health) {
      case 'healthy': return '#00FF88';
      case 'degraded': return '#FFB000';
      case 'unhealthy': return '#FF4444';
      default: return '#666';
    }
  };

  const getStatusText = () => {
    if (!isConnected) return 'DISCONNECTED';
    switch (health) {
      case 'healthy': return 'LIVE';
      case 'degraded': return 'DEGRADED';
      case 'unhealthy': return 'UNHEALTHY';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 border border-opacity-30"
      style={{
        borderColor: getStatusColor(),
        background: `rgba(${getStatusColor() === '#00FF88' ? '0, 255, 136' : getStatusColor() === '#FFB000' ? '255, 176, 0' : '255, 68, 68'}, 0.1)`
      }}
    >
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }} />
      <span className="text-xs font-mono font-bold" style={{ color: getStatusColor() }}>{getStatusText()}</span>
      {error && (
        <span className="text-xs text-red-400 ml-2" title={error}>⚠</span>
      )}
    </div>
  );
}

// Aggregator-backed ticker for shipping velocity on static hosting (GH Pages)
// Revisit when backend/service layer is available.
function AggregatorTicker({ currencies, fxMap }: { currencies: string[]; fxMap: Record<string, { rate: number; prev: number | null; ts: number }> }) {
  const items = useMemo(() => {
    return currencies.map((ccy) => {
      const entry = fxMap[ccy];
      const rate = entry?.rate ?? null;
      const prev = entry?.prev ?? null;
      const dir = rate && prev ? (rate >= prev ? 'up' : 'down') : null;
      const display = rate ? rate.toFixed(rate >= 2 ? 2 : 4) : '—';
      return { ccy, rate: display, dir } as { ccy: string; rate: string; dir: 'up' | 'down' | null };
    });
  }, [currencies, fxMap]);

  const row = (
    <div className="flex items-center gap-6 whitespace-nowrap px-4 py-1 text-xs font-mono">
      {items.map((it) => (
        <span key={it.ccy} className="flex items-center gap-1">
          <span style={{ color: '#FFD700' }}>{it.ccy}</span>
          {it.dir === 'up' ? <span style={{ color: '#00FF88' }}>▲</span> : it.dir === 'down' ? <span style={{ color: '#FF4444' }}>▼</span> : <span className="text-gray-500">•</span>}
          <span className="text-white">{it.rate}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden w-full h-full">
      <div className="absolute inset-0 flex animate-ticker-scroll">
        {row}
        {row}
      </div>
    </div>
  );
}
