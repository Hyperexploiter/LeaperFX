import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Sun, Moon, Plus, X, Loader, AlertTriangle, ArrowUp, TrendingUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { fetchLatestRates, fetchSupportedCurrencies, fetchHistoricalRate, RateData, SupportedCurrency } from './services/exchangeRateService';
import mockWebSocketService, { WebSocketEvent } from './services/mockWebSocketService';

import logoWhite from './assets/logo_white.jpg';
import logoBlack from './assets/logo_black.PNG';
import saadatWhite from './assets/saadat_white.PNG';
import saadatBlack from './assets/saadat_black.PNG';

// --- Type Definitions for TypeScript ---
interface CurrencyInfo { name: string; code: string; }
interface ChartData { name:string; value: number; }

// --- Sub-Component Prop Types ---
interface TickerProps { rates: RateData | null; baseCurrency: string; calculateRates: (currency: string) => { customerBuys: string }; }
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
    const { customerBuys } = calculateRates(currency);
    return (
        <div key={currency} className="flex items-center mx-8 text-base flex-shrink-0">
          <span className="font-semibold text-gray-400">{currency}/{baseCurrency}</span>
          <span className="ml-3 text-green-400 font-mono text-lg">{customerBuys}</span>
          <ArrowUp className="h-5 w-5 text-green-400 ml-1.5" />
        </div>
    );
  });

  return (
    <div className="bg-gray-900 dark:bg-black text-white py-4 overflow-hidden w-full shadow-lg rounded-xl">
      <div className="flex whitespace-nowrap animate-ticker-scroll hover:pause-animation">
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
    console.log("Fetching rates from Frankfurter...");
    setError(null);
    if(!isLoading) setIsLoading(true);
    
    const [latest, historical] = await Promise.all([
      fetchLatestRates(BASE_CURRENCY),
      fetchHistoricalRate(BASE_CURRENCY)
    ]);
    
    if (latest) setLiveRates(latest);
    else setError("Failed to fetch latest rates.");
    
    if (historical) setHistoricalRates(historical);
    else console.warn("Could not fetch historical rates for 24h change.");

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
        await mockWebSocketService.connect();
        console.log('Connected to WebSocket for real-time rate updates');
        
        // Subscribe to WebSocket events
        const unsubscribe = mockWebSocketService.subscribe((event: WebSocketEvent) => {
          // Only handle rate_update events
          if (event.type === 'rate_update') {
            console.log('Received rate update via WebSocket:', event.data);
            
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
          mockWebSocketService.disconnect();
          console.log('Disconnected from WebSocket');
        };
      } catch (err) {
        console.error('Failed to set up WebSocket connection:', err);
      }
    };
    
    setupWebSocket();
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

  const availableToAdd = allSupportedCurrencies.filter(c => !displayedCurrencies.includes(c.value) && c.value !== BASE_CURRENCY);

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-black text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
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
            <div className="w-full bg-white/30 dark:bg-gray-800/30 rounded-xl shadow-lg p-3 mb-8 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 flex flex-wrap items-center justify-between gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedCurrencies.map((currency) => {
                const { customerBuys, customerSells, spread, change24h, chartData } = calculateRates(currency);
                const info = getCurrencyInfo(currency);
                const isPositive = parseFloat(change24h) >= 0;

                return (
                  <div key={currency} className="bg-white/50 dark:bg-gray-800/50 rounded-2xl shadow-lg hover:shadow-2xl dark:hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-300 ease-in-out border border-white/20 dark:border-gray-700/50 group backdrop-blur-xl overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <img src={`https://flagcdn.com/w40/${info.code}.png`} width="40" alt={`${info.name} flag`} className="mr-4 rounded-full shadow-md"/>
                          <div><h3 className="text-xl font-bold">{currency}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{info.name}</p></div>
                        </div>
                        <button onClick={() => handleRemoveCurrency(currency)} className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X className="h-5 w-5" /></button>
                      </div>
                      <div className="space-y-4 text-lg">
                        <div className="flex justify-between items-baseline"><span className="text-gray-600 dark:text-gray-300">We Buy</span><span className="font-bold text-blue-600 dark:text-blue-400">{customerSells}</span></div>
                        <div className="flex justify-between items-baseline"><span className="text-gray-600 dark:text-gray-300">We Sell</span><span className="font-bold text-green-600 dark:text-green-400">{customerBuys}</span></div>
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
                    <div className="bg-gray-50/50 dark:bg-gray-900/30 px-6 py-3 border-t border-gray-200 dark:border-gray-700/50 flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-semibold">24h Change</span>
                      {change24h === '0.00' ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Market awaiting update</span>
                      ) : change24h !== 'N/A' ? (
                        <div className={`flex items-center font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                          {change24h}%
                        </div>
                      ) : ( <span className="text-gray-500">N/A</span> )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
    </div>
    </div>
  );
}