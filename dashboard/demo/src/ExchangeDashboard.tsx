import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Sun, Moon, Plus, X, Loader, AlertTriangle, ArrowUp, TrendingUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis, XAxis, CartesianGrid } from 'recharts';
import { fetchLatestRates, fetchSupportedCurrencies, fetchHistoricalRate, RateData, SupportedCurrency } from './services/exchangeRateService';
import webSocketService, { WebSocketEvent } from './services/webSocketService';
import './styles/sexymodal.css';

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
    return (
        <div key={currency} className="flex items-center mx-4 text-xs flex-shrink-0">
          <span className="font-bold" style={{ color: '#00D4FF' }}>{currency}</span>
          <span className="font-semibold" style={{ color: '#666' }}>/{baseCurrency}</span>
          <span className="ml-2 text-white font-mono text-sm font-semibold">{customerBuys}</span>
          <span className={`ml-1.5 font-bold`} style={{ color: isPositive ? '#00FF00' : '#FF0000' }}>{arrow} {isNaN(change) ? '' : `${Math.abs(change).toFixed(2)}%`}</span>
        </div>
    );
  });

  return (
    <div className="bg-black text-white py-1.5 overflow-hidden w-full">
      <div className="flex whitespace-nowrap animate-ticker-scroll hover:pause-animation px-2">
        {tickerContent}
        {tickerContent} {/* Duplicate for seamless loop */}
      </div>
    </div>
  );
};

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ darkMode, setDarkMode }) => (
  <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 bg-black hover:bg-gray-900 transition-colors" style={{ border: '0.5px solid rgba(0, 212, 255, 0.3)', color: '#00D4FF' }} aria-label="Toggle dark mode">
    {darkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
  </button>
);

const LiveClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <div className="font-mono text-xs" style={{ color: '#00D4FF' }}>
            {time.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })}
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
    <div className="bg-black border" style={{ borderColor: 'rgba(0, 212, 255, 0.15)', borderWidth: '0.5px' }}>
      <div className="p-2">
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#00D4FF' }}>CAD 30-Year Yield</h2>
        <p className="text-xs" style={{ color: '#FFB000' }}>4.96 UNCH</p>
      </div>
      <div className="h-32 px-2 pb-2" style={{
        background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.15) 0%, rgba(0, 20, 35, 0.25) 50%, rgba(0, 8, 20, 0.35) 100%)'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" stopOpacity={0.7} />
                <stop offset="30%" stopColor="#FFB000" stopOpacity={0.5} />
                <stop offset="70%" stopColor="#FF8C00" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FF6B00" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0, 212, 255, 0.05)" vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="time" hide tick={{ fill: '#666', fontSize: 9 }} />
            <YAxis tick={{ fill: '#666', fontSize: 9 }} domain={[ (dataMin: number) => dataMin - 0.1, (dataMax: number) => dataMax + 0.1 ]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 8, 20, 0.98)',
                border: '0.5px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '2px',
                padding: '3px 6px'
              }}
              labelStyle={{ color: '#FFD700', fontSize: 10 }}
              itemStyle={{ color: '#FFB000', fontSize: 9 }}
            />
            <Area type="monotone" dataKey="value" stroke="#FFD700" strokeWidth={0.8} fill="url(#yieldGradient)" />
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
  const color = item.trend === 'up' ? '#00FF88' : '#FF4444';
  const gradientId = `mw-${item.symbol}-grad`;
  const data = useMemo(() => generateMiniData(item.trend, 20), [item.trend]);

  return (
    <div className="bg-black px-2 py-1.5 hover:bg-gray-950 transition-all duration-100" style={{
      borderBottom: '0.5px solid rgba(255, 215, 0, 0.08)',
      background: 'linear-gradient(90deg, rgba(0, 8, 20, 0.3) 0%, rgba(0, 0, 0, 1) 100%)'
    }}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs" style={{ color: '#FFD700', fontFamily: 'monospace' }}>{item.symbol}</div>
          <div className="text-white font-mono font-bold text-sm">{item.value}</div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-16 h-6" style={{
            background: 'linear-gradient(135deg, rgba(0, 20, 35, 0.2) 0%, rgba(0, 8, 20, 0.3) 100%)',
            borderRadius: '2px'
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  {/* Bloomberg Terminal yellow gradient for mini charts */}
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity={0.5} />
                    <stop offset="50%" stopColor="#FFB000" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF8800" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[ 'dataMin - 0.015', 'dataMax + 0.015' ] as any} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#FFD700"
                  strokeWidth={0.5}
                  fill={`url(#${gradientId})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-right min-w-[60px]">
            <div className="flex items-center justify-end" style={{ color: item.trend === 'up' ? '#00FF88' : '#FF4444' }}>
              <span className="text-xs font-bold font-mono">{item.trend === 'up' ? '▲' : '▼'} {item.change}</span>
            </div>
            {item.changePercent && (
              <span className="text-xs opacity-80 font-mono" style={{ color: '#888' }}>({item.changePercent})</span>
            )}
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
  const [darkMode, setDarkMode] = useState<boolean>(true);

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
        const points = 12; // More data points for smoother Bloomberg Terminal look
        for (let i = 0; i < points; i++) {
            const progress = i / (points - 1);
            const linearValue = startRate + (endRate - startRate) * progress;
            // Add smooth wave-like movement instead of random jitter
            const waveOffset = Math.sin(progress * Math.PI * 2) * (Math.abs(endRate - startRate) * 0.08);
            const smoothJitter = (i > 0 && i < points - 1) ? (Math.random() - 0.5) * (Math.abs(endRate - startRate) * 0.05) : 0;
            chartData.push({ name: `p${i}`, value: linearValue + waveOffset + smoothJitter });
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
    { name: 'GOLD', symbol: 'GOLD', value: '3547.35', change: '+14.51', changePercent: '0.41%', trend: 'up' },
    { name: 'SILVER', symbol: 'SILVER', value: '41.72', change: '+0.13', changePercent: '0.32%', trend: 'up' },
    { name: 'COPPER', symbol: 'COPPER', value: '403.65', change: '-1.45', changePercent: '0.36%', trend: 'down' },
    { name: 'ALUM.FUT', symbol: 'ALUM', value: '2678.50', change: '-5.50', changePercent: '0.21%', trend: 'down' },
    { name: 'PLAT.', symbol: 'PLAT', value: '1408.97', change: '-2.25', changePercent: '0.16%', trend: 'down' },
    { name: 'VIX', symbol: 'VIX', value: '17.14', change: '-0.03', changePercent: '0.17%', trend: 'down' }
  ]), []);

  const availableToAdd = allSupportedCurrencies.filter(c => !displayedCurrencies.includes(c.value) && c.value !== BASE_CURRENCY);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans overflow-hidden">
      <div className="h-screen flex flex-col">
        {/* Header Bar */}
        <header className="bg-black px-4 py-2" style={{ borderBottom: '0.5px solid rgba(0, 212, 255, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="font-bold text-2xl tracking-wider" style={{
              color: '#00D4FF',
              textShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
              fontFamily: 'monospace'
            }}>SAADAT EXCHANGE</div>
            <div className="flex items-center gap-4">
              <LiveClock />
              <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col p-4">
          {isLoading && <div className="flex justify-center items-center p-10 bg-gray-900 rounded-lg shadow-md"><Loader className="h-12 w-12 mr-4 animate-spin text-cyan-400" /><span className="text-lg text-white">Loading rates...</span></div>}
          {error && !isLoading && <div className="bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 rounded-lg shadow-md flex items-center" role="alert"><AlertTriangle className="h-6 w-6 mr-3" /><div><p className="font-bold">Error:</p><p>{error}</p></div></div>}
          
          {!isLoading && !error && (
            <div className="flex flex-1 gap-4">
              {/* Main currencies grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayedCurrencies.map((currency) => {
                    const { customerBuys, customerSells, spread, change24h, chartData } = calculateRates(currency);
                    const info = getCurrencyInfo(currency);
                    const isPositive = parseFloat(change24h) >= 0;

                    return (
                      <div key={currency} className="relative group overflow-hidden hover:scale-[1.02] transition-all duration-200" style={{
                        background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
                        border: '0.5px solid rgba(0, 150, 255, 0.2)',
                        boxShadow: '0 0 20px rgba(0, 150, 255, 0.05), inset 0 0 30px rgba(0, 20, 40, 0.3)'
                      }}>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <img src={`https://flagcdn.com/w40/${info.code}.png`} width="24" alt={`${info.name} flag`} className="mr-2 rounded-sm shadow-sm"/>
                              <div className="-mt-0.5">
                                <h3 className="text-base font-bold leading-tight" style={{
                                  color: '#FFA500',
                                  textShadow: '0 0 8px rgba(255, 165, 0, 0.4)',
                                  fontFamily: 'monospace',
                                  letterSpacing: '0.5px'
                                }}>{currency}</h3>
                                <p className="text-xs font-medium leading-tight -mt-0.5" style={{ color: '#4A90E2' }}>{info.name}</p>
                              </div>
                            </div>
                            <button onClick={() => handleRemoveCurrency(currency)} className="text-gray-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                          </div>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A90E2' }}>We Buy</span>
                              <span className="font-mono font-bold text-lg tabular-nums" style={{
                                background: 'linear-gradient(90deg, #FFFFFF 0%, #E0E0E0 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                              }}>{customerSells}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A90E2' }}>We Sell</span>
                              <span className="font-mono font-bold text-lg tabular-nums" style={{
                                background: 'linear-gradient(90deg, #00FF88 0%, #00D4FF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 0 20px rgba(0, 255, 136, 0.3)'
                              }}>{customerBuys}</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-3 pt-1 pb-3">
                          <div className="h-16 -mx-3 -mb-3" style={{
                            background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.15) 0%, rgba(0, 20, 35, 0.25) 50%, rgba(0, 8, 20, 0.35) 100%)',
                            borderTop: '0.5px solid rgba(0, 212, 255, 0.08)'
                          }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                  {/* Bloomberg Terminal signature yellow-orange gradient */}
                                  <linearGradient id={`bloomberg-gradient-${currency}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FFD700" stopOpacity={0.7}/>
                                    <stop offset="30%" stopColor="#FFB000" stopOpacity={0.5}/>
                                    <stop offset="70%" stopColor="#FF8C00" stopOpacity={0.3}/>
                                    <stop offset="100%" stopColor="#FF6B00" stopOpacity={0.05}/>
                                  </linearGradient>
                                  {/* Ultra-thin line gradient */}
                                  <linearGradient id={`bloomberg-stroke-${currency}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#FFD700" stopOpacity={0.9}/>
                                    <stop offset="50%" stopColor="#FFAA00" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#FF8800" stopOpacity={0.8}/>
                                  </linearGradient>
                                </defs>
                                <YAxis hide={true} domain={['dataMin - (dataMax - dataMin) * 0.15', 'dataMax + (dataMax - dataMin) * 0.15']} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: 'rgba(0, 8, 20, 0.98)',
                                    border: '0.5px solid rgba(255, 215, 0, 0.3)',
                                    borderRadius: '2px',
                                    padding: '3px 6px',
                                    backdropFilter: 'blur(15px)',
                                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.1)'
                                  }}
                                  labelStyle={{ color: '#FFD700', fontSize: 10, fontWeight: 'bold' }}
                                  itemStyle={{ color: '#FFB000', fontSize: 9 }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="value"
                                  stroke={`url(#bloomberg-stroke-${currency})`}
                                  strokeWidth={0.6}
                                  fillOpacity={1}
                                  fill={`url(#bloomberg-gradient-${currency})`}
                                  dot={false}
                                  activeDot={{ r: 1.5, stroke: '#FFD700', strokeWidth: 0.5, fill: '#FFB000' }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="px-3 py-1 flex justify-between items-center" style={{
                          background: 'linear-gradient(90deg, rgba(0, 8, 20, 0.9) 0%, rgba(0, 20, 40, 0.7) 100%)',
                          borderTop: '0.5px solid rgba(255, 215, 0, 0.15)'
                        }}>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{
                            color: '#FFD700',
                            fontFamily: 'monospace',
                            fontSize: '10px'
                          }}>24H</span>
                          {change24h === '0.00' ? (
                            <span className="text-xs font-mono" style={{ color: '#666' }}>—</span>
                          ) : change24h !== 'N/A' ? (
                            <div className={`flex items-center font-bold text-xs`} style={{
                              color: isPositive ? '#00FF88' : '#FF4444',
                              textShadow: isPositive ? '0 0 3px rgba(0, 255, 136, 0.5)' : '0 0 3px rgba(255, 68, 68, 0.5)',
                              fontFamily: 'monospace'
                            }}>
                              <span className="mr-0.5" style={{ fontSize: '8px' }}>{isPositive ? '▲' : '▼'}</span>
                              {change24h}%
                            </div>
                          ) : ( <span className="text-xs font-mono" style={{ color: '#666' }}>—</span> )}
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
                {/* Weather Forecast Widget */}
                <div className="bg-black border mt-2" style={{ borderColor: 'rgba(0, 212, 255, 0.15)', borderWidth: '0.5px' }}>
                  <div className="p-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#00D4FF', borderBottom: '0.5px solid rgba(0, 212, 255, 0.15)', paddingBottom: '4px' }}>Weather Toronto</h3>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <span style={{ fontSize: '20px' }}>☀️</span>
                        <div>
                          <div className="font-mono font-bold text-lg" style={{ color: '#FFD700' }}>22°C</div>
                          <div className="text-xs" style={{ color: '#666' }}>Clear Sky</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: '#FFB000' }}>H: 24°</div>
                        <div className="text-xs" style={{ color: '#4A90E2' }}>L: 18°</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom ticker with logo */}
        <footer className="bg-black relative" style={{ borderTop: '0.5px solid rgba(0, 212, 255, 0.2)' }}>
          <div className="flex items-center">
            <div className="px-3 py-1 flex items-center" style={{ borderRight: '0.5px solid rgba(0, 212, 255, 0.2)' }}>
              <img src={darkMode ? saadatBlack : saadatWhite} alt="SAADAT" className="h-6 w-auto" />
            </div>
            <div className="flex-1">
              <Ticker rates={liveRates} baseCurrency={BASE_CURRENCY} calculateRates={calculateRates}/>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}