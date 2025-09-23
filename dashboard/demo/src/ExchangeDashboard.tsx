import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Sun, Moon, Plus, X, Loader, AlertTriangle, ArrowUp, TrendingUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis, XAxis, CartesianGrid } from 'recharts';
import { fetchLatestRates, fetchSupportedCurrencies, fetchHistoricalRate, RateData, SupportedCurrency } from './services/exchangeRateService';
import webSocketService, { WebSocketEvent } from './services/webSocketService';

import logoWhite from './assets/logo_white.jpg';
import logoBlack from './assets/logo_black.PNG';
import saadatWhite from './assets/saadat_white.PNG';
import saadatBlack from './assets/saadat_black.PNG';

// --- Type Definitions for TypeScript ---
interface CurrencyInfo { name: string; code: string; }
interface ChartData { name:string; value: number; }

// --- Sub-Component Prop Types ---
interface TickerProps { rates: RateData | null; baseCurrency: string; calculateRates: (currency: string) => { customerBuys: string; change24h: string }; }
interface DarkModeToggleProps { darkMode: boolean; setDarkMode: (value: boolean) => void; }

// --- Configuration ---
const BASE_CURRENCY = 'CAD';
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const DEFAULT_SPREAD_PERCENT = 1.5;

// --- Sub-Components ---

const Ticker: React.FC<TickerProps> = ({ rates, baseCurrency, calculateRates }) => {
  if (!rates) return null;
  const tickerItems = Object.keys(rates).filter(key => ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF', 'CNY'].includes(key));
  if (tickerItems.length === 0) return null;

  const tickerContent = tickerItems.map(currency => {
    const { customerBuys, change24h } = calculateRates(currency);
    const change = parseFloat(change24h);
    const isPositive = !isNaN(change) && change >= 0;
    const arrow = isPositive ? '▲' : '▼';
    const color = isPositive ? 'text-emerald-400' : 'text-rose-400';
    return (
        <div key={currency} className="flex items-center mx-8 text-base flex-shrink-0">
          <span className="font-semibold text-orange-400">{currency}</span>
          <span className="font-semibold text-slate-400">/{baseCurrency}</span>
          <span className="ml-3 text-slate-100 font-mono text-lg">{customerBuys}</span>
          <span className={`ml-2 font-semibold ${color}`}>{arrow} {isNaN(change) ? '' : `${Math.abs(change).toFixed(2)}%`}</span>
        </div>
    );
  });

  return (
    <div className="bg-slate-950 text-slate-100 py-3 overflow-hidden w-full shadow-xl rounded-xl border border-slate-800">
      <div className="flex whitespace-nowrap animate-ticker-scroll hover:pause-animation px-4">
        {tickerContent}
        {tickerContent} {/* Duplicate for seamless loop */}
      </div>
    </div>
  );
};

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ darkMode, setDarkMode }) => (
  <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle dark mode">
    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
  </button>
);

const LiveClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="font-medium text-base text-nowrap bg-white/30 dark:bg-gray-800/30 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 dark:border-gray-700/50">
            {time.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
        </div>
    );
};

// Large Yield Chart section with Intraday and 1Y views
const YieldChart: React.FC = () => {
  const [view, setView] = useState<'intraday' | '1y'>('intraday');
  const [data, setData] = useState<Array<{ time: string; value: number }>>([]);

  const generateData = useCallback((mode: 'intraday' | '1y') => {
    const now = new Date();
    const points = mode === 'intraday' ? 90 : 240; // 90 x 5min ~ 7.5h, 240 x 1d ~ 8 months
    const base = 3 + Math.random(); // 3-4% baseline yield
    const arr: Array<{ time: string; value: number }> = [];
    for (let i = 0; i < points; i++) {
      const t = new Date(
        now.getTime() - (points - i) * (mode === 'intraday' ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000)
      );
      const drift = Math.sin(i / 18) * 0.05 + (Math.random() - 0.5) * 0.03; // gentle movement
      const val = parseFloat((base + drift).toFixed(3));
      arr.push({
        time: mode === 'intraday'
          ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : t.toLocaleDateString('en-CA', { month: 'short' }),
        value: val
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    setData(generateData(view));
  }, [view, generateData]);

  // live update every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const nextVal = parseFloat((last.value * (1 + (Math.random() - 0.5) * 0.002)).toFixed(3));
        const now = new Date();
        const nextLabel = view === 'intraday'
          ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : now.toLocaleDateString('en-CA', { month: 'short' });
        return [...prev.slice(1), { time: nextLabel, value: nextVal }];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [view]);

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl mb-8">
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="text-xl font-semibold text-cyan-400">Market Yields</h2>
          <p className="text-sm text-slate-400">One Year and Intraday simulated views</p>
        </div>
        <div className="space-x-2">
          <button
            className={`px-3 py-1 rounded-md text-sm border ${view === 'intraday' ? 'bg-cyan-600/20 text-cyan-300 border-cyan-700' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            onClick={() => setView('intraday')}
          >
            Intraday
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm border ${view === '1y' ? 'bg-cyan-600/20 text-cyan-300 border-cyan-700' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            onClick={() => setView('1y')}
          >
            1Y
          </button>
        </div>
      </div>
      <div className="h-72 md:h-80 px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
            <XAxis dataKey="time" hide={view === 'intraday'} tick={{ fill: '#94a3b8' }} />
            <YAxis tick={{ fill: '#94a3b8' }} domain={[ (dataMin: number) => dataMin - 0.1, (dataMax: number) => dataMax + 0.1 ]} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(2,6,23,0.9)', border: '1px solid rgba(8,145,178,0.3)', borderRadius: 8 }} labelStyle={{ color: '#67e8f9' }} itemStyle={{ color: '#e2e8f0' }} />
            <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#yieldGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- Market Watch (right sidebar) ---

type Trend = 'up' | 'down';

interface MarketItem {
  name: string;
  symbol: string;
  value: string;
  change: string;
  changePercent?: string;
  trend: Trend;
}

const generateMiniData = (trend: Trend, points = 20) => {
  const base = trend === 'up' ? 1.0 + Math.random() * 0.2 : 1.2 - Math.random() * 0.2;
  return Array.from({ length: points }, (_, i) => ({
    time: i,
    value: base + (trend === 'up' ? i : -i) * 0.002 + (Math.random() - 0.5) * 0.006
  }));
};

const MarketWatchCard: React.FC<{ item: MarketItem }> = ({ item }) => {
  const color = item.trend === 'up' ? '#10b981' : '#ef4444';
  const gradientId = `mw-${item.symbol}-grad`;
  const data = useMemo(() => generateMiniData(item.trend, 18), [item.trend]);

  return (
    <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-3 hover:border-cyan-600/30 hover:bg-slate-900/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-orange-400 font-semibold text-sm truncate">{item.symbol}</div>
          <div className="text-slate-100 font-mono font-bold text-lg truncate">{item.value}</div>
          <div className="text-slate-400 text-xs mt-1 truncate">{item.name}</div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-16 h-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[ 'dataMin - 0.02', 'dataMax + 0.02' ] as any} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={`text-right ${item.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            <div className="flex items-center space-x-1 justify-end">
              <span className="text-xs">{item.trend === 'up' ? '▲' : '▼'}</span>
              <span className="font-semibold text-sm">{item.change}</span>
              {item.changePercent && (
                <span className="text-xs opacity-80">({item.changePercent})</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ExchangeDashboard(): React.ReactElement {
  const [liveRates, setLiveRates] = useState<RateData | null>(null);
  const [historicalRates, setHistoricalRates] = useState<RateData | null>(null);
  const [allSupportedCurrencies, setAllSupportedCurrencies] = useState<SupportedCurrency[]>([]);
  const [displayedCurrencies, setDisplayedCurrencies] = useState<string[]>(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF']);
  const [currencyToAdd, setCurrencyToAdd] = useState<string>('CNY');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

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

  const getRates = useCallback(async () => {
    setError(null);
    if(!isLoading) setIsLoading(true);
    
    const [latest, historical] = await Promise.all([
      fetchLatestRates(BASE_CURRENCY),
      fetchHistoricalRate(BASE_CURRENCY)
    ]);
    
    if (latest) setLiveRates(latest);
    else setError("Failed to fetch latest rates.");
    
    if (historical) setHistoricalRates(historical);

    setIsLoading(false);
  }, [isLoading]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const currencies = await fetchSupportedCurrencies();
      setAllSupportedCurrencies(currencies);
      if (currencies.length > 0 && !displayedCurrencies.includes('CNY')) setCurrencyToAdd('CNY');
      await getRates();
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
     const interval = setInterval(getRates, REFRESH_INTERVAL_MS);
     return () => clearInterval(interval);
  }, [getRates]);

  // Set up WebSocket connection for real-time rate updates from store owner
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        // Connect to WebSocket server
        await webSocketService.connect();
        
        // Subscribe to WebSocket events
        const unsubscribe = webSocketService.subscribe((event: WebSocketEvent) => {
          // Only handle rate_update events
          if (event.type === 'rate_update') {
            
            const { currency, buyRate, sellRate } = event.data;
            
            // Update liveRates with the new rate
            setLiveRates(prevRates => {
              if (!prevRates) return prevRates;
              
              // Calculate the new rate value based on the buy/sell rates
              // The API uses rates relative to CAD, so we need to convert
              // For simplicity, we'll use the average of buy and sell rates
              const avgRate = (parseFloat(buyRate) + parseFloat(sellRate)) / 2;
              const newRate = 1 / avgRate; // Invert because the API uses inverse rates
              
              // Create a new rates object with the updated rate
              return {
                ...prevRates,
                [currency]: newRate
              };
            });
          }
        });
        
        // Clean up WebSocket connection on component unmount
        return () => {
          unsubscribe();
          webSocketService.disconnect();
        };
      } catch (err) {
        console.error('Failed to set up WebSocket connection:', err);
      }
    };
    
    setupWebSocket();
  }, []);

  // Real-time data simulation: gently update rates every 3s
  useEffect(() => {
    if (!liveRates) return;
    const interval = setInterval(() => {
      setLiveRates(prev => {
        if (!prev) return prev;
        const updated: RateData = { ...prev };
        Object.keys(updated).forEach(k => {
          if (k === BASE_CURRENCY) return;
          const drift = 1 + (Math.random() - 0.5) * 0.002; // ±0.1%
          updated[k] = updated[k] / drift; // adjust inverse rate subtly
        });
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [liveRates]);

  const handleAddCurrency = () => {
    if (currencyToAdd && !displayedCurrencies.includes(currencyToAdd)) {
      setDisplayedCurrencies(prev => [...prev, currencyToAdd]);
    }
  };

  const handleRemoveCurrency = (currencyCode: string) => {
    setDisplayedCurrencies(prev => prev.filter(c => c !== currencyCode));
  };

  const calculateRates = useCallback((foreignCurrency: string) => {
    if (!liveRates?.[foreignCurrency]) return { customerBuys: 'N/A', customerSells: 'N/A', spread: 'N/A', change24h: 'N/A', chartData: [] };
    
    const marketRate = 1 / liveRates[foreignCurrency];
    const spreadAmount = marketRate * (DEFAULT_SPREAD_PERCENT / 100);
    const weBuyAt = marketRate - spreadAmount;
    const weSellAt = marketRate + spreadAmount;
    const spread = ((weSellAt - weBuyAt) / weBuyAt) * 100;

    let change24h: string | number = 'N/A';
    if (historicalRates?.[foreignCurrency]) {
      const yesterdayRate = 1 / historicalRates[foreignCurrency];
      change24h = ((marketRate - yesterdayRate) / yesterdayRate) * 100;
    }

    const chartData: ChartData[] = [];
    if (historicalRates?.[foreignCurrency]) {
        const startRate = 1 / historicalRates[foreignCurrency];
        const endRate = marketRate;
        const points = 7; 
        for (let i = 0; i < points; i++) {
            const linearValue = startRate + (endRate - startRate) * (i / (points - 1));
            const jitter = (i > 0 && i < points - 1) ? (Math.random() - 0.5) * (Math.abs(endRate - startRate) * 0.15) : 0;
            chartData.push({ name: `p${i}`, value: linearValue + jitter });
        }
    }

    return {
      customerBuys: weSellAt.toFixed(4),
      customerSells: weBuyAt.toFixed(4),
      spread: spread.toFixed(2),
      change24h: typeof change24h === 'number' ? change24h.toFixed(2) : 'N/A',
      chartData,
    };
  }, [liveRates, historicalRates]);

  const marketData = useMemo<MarketItem[]>(() => ([
    { name: 'GOLD/CAD', symbol: 'GOLD', value: '3,592.80', change: '+12.40', changePercent: '0.35%', trend: 'up' },
    { name: 'SILVER/CAD', symbol: 'SILVER', value: '43.25', change: '+0.92', changePercent: '2.17%', trend: 'up' },
    { name: 'BTC/CAD', symbol: 'BTC', value: '86,420', change: '-1,240', changePercent: '-1.42%', trend: 'down' },
    { name: 'ETH/CAD', symbol: 'ETH', value: '3,580', change: '+85', changePercent: '2.43%', trend: 'up' },
    { name: 'CA 10Y YIELD', symbol: 'CA10Y', value: '3.15%', change: '+0.01', changePercent: '0.32%', trend: 'up' },
    { name: 'US 10Y YIELD', symbol: 'US10Y', value: '4.28%', change: '+0.03', changePercent: '0.71%', trend: 'up' }
  ]), []);

  const availableToAdd = allSupportedCurrencies.filter(c => !displayedCurrencies.includes(c.value) && c.value !== BASE_CURRENCY);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-screen-xl mx-auto">
        <header className="flex flex-col justify-center items-center mb-6 text-center">
            <div className="flex items-center gap-6 mb-4">
                <img src={darkMode ? logoBlack : logoWhite} alt="Company Logo" className="h-32 w-auto rounded-xl" />
                <img src={darkMode ? saadatBlack : saadatWhite} alt="Saadat Name" className="h-24 w-auto" />
            </div>
        </header>
      
        <div className="mb-8">
            <Ticker rates={liveRates} baseCurrency={BASE_CURRENCY} calculateRates={calculateRates}/>
        </div>
        
        <main>
            <div className="w-full bg-slate-900/60 rounded-xl shadow-lg p-3 mb-8 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                {/* COMMENTED OUT - Add Currency Section (keeping for future use)
                <div className="flex items-center gap-2">
                    <label htmlFor="currency-select" className="font-semibold text-nowrap">Add Currency:</label>
                    <select id="currency-select" value={currencyToAdd} onChange={(e) => setCurrencyToAdd(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" disabled={!allSupportedCurrencies.length || isLoading}>
                        {availableToAdd.map(c => <option key={c.value} value={c.value}>{c.label.split(' - ')[0]}</option>)}
                    </select>
                    <button onClick={handleAddCurrency} disabled={isLoading} className="flex items-center p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"><Plus className="h-4 w-4" /></button>
                </div>
                */}
                <div className="flex items-center gap-4">
                    <LiveClock />
                    <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                </div>
            </div>

          {isLoading && <div className="flex justify-center items-center p-10 bg-white/50 dark:bg-gray-800/50 rounded-lg shadow-md backdrop-blur-md"><Loader className="h-12 w-12 mr-4 animate-spin text-blue-600" /><span className="text-lg">Loading rates...</span></div>}
          {error && !isLoading && <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg shadow-md flex items-center" role="alert"><AlertTriangle className="h-6 w-6 mr-3" /><div><p className="font-bold">Error:</p><p>{error}</p></div></div>}
          
          {!isLoading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main currencies grid */}
              <div className="lg:col-span-9">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {displayedCurrencies.map((currency) => {
                    const { customerBuys, customerSells, spread, change24h, chartData } = calculateRates(currency);
                    const info = getCurrencyInfo(currency);
                    const isPositive = parseFloat(change24h) >= 0;

                    return (
                      <div key={currency} className="bg-slate-900/60 rounded-2xl shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-2 transition-all duration-300 ease-in-out border border-slate-800 group overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <img src={`https://flagcdn.com/w40/${info.code}.png`} width="40" alt={`${info.name} flag`} className="mr-4 rounded-full shadow-md"/>
                              <div><h3 className="text-xl font-bold text-orange-400">{currency}</h3><p className="text-sm text-cyan-300/90">{info.name}</p></div>
                            </div>
                            <button onClick={() => handleRemoveCurrency(currency)} className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X className="h-5 w-5" /></button>
                          </div>
                          <div className="space-y-4 text-lg">
                            <div className="flex justify-between items-baseline"><span className="text-slate-300">We Buy</span><span className="font-mono font-bold text-sky-400">{customerSells}</span></div>
                            <div className="flex justify-between items-baseline"><span className="text-slate-300">We Sell</span><span className="font-mono font-bold text-emerald-400">{customerBuys}</span></div>
                          </div>
                        </div>
                        <div className="px-6 pt-2 pb-4">
                          <div className="h-20 -mx-6 -mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id={`color-${currency}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <YAxis hide={true} domain={['dataMin - (dataMax - dataMin) * 0.2', 'dataMax + (dataMax - dataMin) * 0.2']} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem' }} labelStyle={{ color: '#d1d5db' }}/>
                                <Area type="monotone" dataKey="value" stroke={isPositive ? '#10B981' : '#EF4444'} strokeWidth={2} fillOpacity={1} fill={`url(#color-${currency})`} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="bg-slate-950/40 px-6 py-3 border-t border-slate-800 flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-semibold">24h Change</span>
                          {change24h === '0.00' ? (
                            <span className="text-xs text-slate-400/80">Market awaiting update</span>
                          ) : change24h !== 'N/A' ? (
                            <div className={`flex items-center font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              <span className="mr-1">{isPositive ? '▲' : '▼'}</span>
                              {change24h}%
                            </div>
                          ) : ( <span className="text-slate-500">N/A</span> )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl p-4">
                  <h3 className="text-cyan-400 font-semibold mb-3">Market Watch</h3>
                  <div className="space-y-3">
                    {marketData.map((item, idx) => (
                      <MarketWatchCard key={`${item.symbol}-${idx}`} item={item} />
                    ))}
                  </div>
                </div>
                <YieldChart />
              </div>
            </div>
          )}
        </main>
    </div>
    </div>
  );
}