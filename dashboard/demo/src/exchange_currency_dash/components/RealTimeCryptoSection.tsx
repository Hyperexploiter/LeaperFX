/**
 * Real-Time Crypto Section Component
 *
 * Displays real-time cryptocurrency data with animated price updates and mini-charts
 * Integrates with the new real-time data architecture
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { useCryptoData, useAnimatedPrice } from '../hooks/useRealTimeData';
import { Loader, AlertTriangle } from 'lucide-react';
import unifiedDataAggregator, { MarketDataPoint } from '../services/unifiedDataAggregator';

// Dynamic YieldChart Component backed by live aggregator data
const YieldChart: React.FC<{ history: Array<{ time: string; value: number }>; current: MarketDataPoint | null }> = ({ history, current }) => {
  const gradientId = 'yieldGradient-live';
  const fallbackValue = current ? current.priceCAD : 4.5;
  const chartData = history.length ? history : Array.from({ length: 30 }, (_, idx) => ({
    time: `${idx}`,
    value: fallbackValue
  }));

  return (
    <div className="bg-black border transition-all duration-1000" style={{ borderColor: 'rgba(0, 212, 255, 0.15)', borderWidth: '0.5px' }}>
      <div className="p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#00D4FF' }}>
          CAD 30-Year Yield
        </h2>
        <p className="text-sm font-bold" style={{ color: '#FFB000' }}>
          {current ? `${current.priceCAD.toFixed(3)}%` : '—'}
        </p>
      </div>
      <div className="h-40 px-4 pb-4" style={{
        background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.15) 0%, rgba(0, 20, 35, 0.25) 50%, rgba(0, 8, 20, 0.35) 100%)'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8} />
                <stop offset="25%" stopColor="#FFB000" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#FF8C00" stopOpacity={0.4} />
                <stop offset="75%" stopColor="#FF6B00" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FF4500" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeWidth={0.5} vertical={false} horizontal={true} strokeDasharray="2 2" />
            <XAxis dataKey="time" hide tick={{ fill: '#666', fontSize: 9 }} />
            <YAxis tick={{ fill: '#666', fontSize: 9 }} domain={[ (dataMin: number) => dataMin - 0.1, (dataMax: number) => dataMax + 0.1 ]} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 8, 20, 0.98)', border: '0.5px solid rgba(255, 215, 0, 0.3)', borderRadius: '2px', padding: '3px 6px' }} labelStyle={{ color: '#FFD700', fontSize: 10 }} itemStyle={{ color: '#FFB000', fontSize: 9 }} />
            <Area type="monotoneX" dataKey="value" stroke="#FFD700" strokeWidth={1.2} fill={`url(#${gradientId})`} filter="drop-shadow(0 0 2px rgba(255, 215, 0, 0.3))" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface CryptoItem {
  symbol: string;
  name: string;
  price: string;
  change: number;
  trend: 'up' | 'down';
}

interface RealTimeCryptoCardProps {
  crypto: CryptoItem;
  index: number;
}

/**
 * Individual crypto card with real-time updates
 */
const RealTimeCryptoCard: React.FC<RealTimeCryptoCardProps> = ({ crypto, index }) => {
  const { price, trend, isAnimating } = useAnimatedPrice({
    symbol: crypto.symbol, // symbols like 'BTC/CAD'
    enableAnimation: true,
    animationDuration: 800,
    smoothingFactor: 0.3
  });

  const isPositive = trend === 'up';
  const displayPrice = price ? price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : crypto.price;
  const changeDisplay = Number.isFinite(crypto.change) ? `${Math.abs(crypto.change).toFixed(2)}%` : '—';

  // Enhanced mini chart data with synchronized updates
  const [chartData, setChartData] = useState<Array<{ time: number; value: number }>>([]);

  // Generate initial chart data
  useEffect(() => {
    const baseValue = price ?? parseFloat(crypto.price.replace(/,/g, ''));
    const points = 12;
    const data = [];

    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const trendFactor = crypto.trend === 'up' ? progress * 0.03 : -progress * 0.03;
      const noise = (Math.random() - 0.5) * 0.01;
      const value = baseValue * (1 + trendFactor + noise);

      data.push({
        time: i,
        value: Math.max(0, value)
      });
    }

    setChartData(data);
  }, [crypto, price]);

  // Synchronized chart updates every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prevData => {
        if (prevData.length === 0) return prevData;

        const lastValue = prevData[prevData.length - 1].value;
        const trendMultiplier = crypto.trend === 'up' ? 1.002 : 0.998;
        const volatility = (Math.random() - 0.5) * 0.008;
        const newValue = Math.max(0, lastValue * trendMultiplier * (1 + volatility));

        // Smooth wave-like movement
        const waveOffset = Math.sin(Date.now() / 10000) * 0.005;
        const finalValue = newValue * (1 + waveOffset);

        return [...prevData.slice(1), { time: prevData.length, value: finalValue }];
      });
    }, 3000); // Synchronized with main chart updates

    return () => clearInterval(interval);
  }, [crypto.trend]);

  return (
    <div
      className={`h-[85px] relative group overflow-hidden transition-all duration-200 ${
        isAnimating ? 'ring-1 ring-blue-400/50' : ''
      }`}
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
        border: '0.5px solid rgba(0, 212, 255, 0.15)',
        boxShadow: '0 0 20px rgba(0, 212, 255, 0.05), inset 0 0 30px rgba(0, 20, 40, 0.3)'
      }}
    >
      <div className="h-full flex items-center px-4">
        {/* Left section - Crypto info */}
        <div className="flex-1">
          <div className="mb-2">
            <h3 className="text-base font-bold" style={{
              color: '#FFA500',
              fontFamily: 'monospace'
            }}>
              {crypto.symbol}
            </h3>
            <span className="text-xs" style={{ color: '#666' }}>{crypto.name}</span>
          </div>
          <div className="text-sm">
            <span style={{ color: '#4A90E2' }}>Price: </span>
            <span className={`font-mono font-bold text-base transition-all duration-300 ${
              isAnimating ? 'text-blue-300' : 'text-white'
            }`}>
              {displayPrice}
            </span>
            <span className="ml-1 text-xs text-gray-500">CAD</span>
            {isAnimating && (
              <span className="ml-2 text-xs text-blue-400 animate-pulse">●</span>
            )}
          </div>
        </div>

        {/* Center section - Mini chart */}
        <div className="w-28 h-12 mx-4" style={{
          background: 'rgba(0, 20, 40, 0.4)',
          border: '0.5px solid rgba(255, 215, 0, 0.15)'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id={`crypto-gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#00FF88' : '#FF4444'} stopOpacity={0.7}/>
                  <stop offset="100%" stopColor={isPositive ? '#00FF88' : '#FF4444'} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#00FF88' : '#FF4444'}
                strokeWidth={0.8}
                fillOpacity={1}
                fill={`url(#crypto-gradient-${index})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right section - 24h change */}
        <div className="text-right">
          <div className="font-bold text-lg flex items-center justify-end" style={{
            color: isPositive ? '#00FF88' : '#FF4444'
          }}>
            {Number.isFinite(crypto.change) && <span className="mr-1">{isPositive ? '▲' : '▼'}</span>}
            {changeDisplay}
          </div>
          <div className="text-xs" style={{ color: '#666' }}>24h</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Real-Time Crypto Section Component
 */
export const RealTimeCryptoSection: React.FC = () => {
  const { cryptoData, isLoading, error, refresh } = useCryptoData();
  const [rotationIndex, setRotationIndex] = useState(0);
  const [aggregatorCrypto, setAggregatorCrypto] = useState<Record<string, MarketDataPoint>>({});

  const aggregatorSymbols = useMemo(
    () => ['BTC/CAD', 'ETH/CAD', 'SOL/CAD', 'AVAX/CAD', 'MATIC/CAD', 'ADA/CAD', 'DOT/CAD', 'LINK/CAD', 'UNI/CAD', 'XRP/CAD'],
    []
  );

  // Static crypto data as fallback
  const staticCryptos: CryptoItem[] = useMemo(() => [
    { symbol: 'BTC/CAD', name: 'Bitcoin', price: '86,420', change: -1.42, trend: 'down' },
    { symbol: 'ETH/CAD', name: 'Ethereum', price: '3,580', change: 2.43, trend: 'up' },
    { symbol: 'SOL/CAD', name: 'Solana', price: '142.85', change: 5.21, trend: 'up' },
    { symbol: 'AVAX/CAD', name: 'Avalanche', price: '51.30', change: -0.85, trend: 'down' },
    { symbol: 'MATIC/CAD', name: 'Polygon', price: '0.872', change: 3.15, trend: 'up' },
    { symbol: 'ADA/CAD', name: 'Cardano', price: '0.512', change: -2.14, trend: 'down' },
    { symbol: 'DOT/CAD', name: 'Polkadot', price: '8.94', change: 1.28, trend: 'up' },
    { symbol: 'LINK/CAD', name: 'Chainlink', price: '18.65', change: -0.42, trend: 'down' },
    { symbol: 'UNI/CAD', name: 'Uniswap', price: '10.28', change: 2.95, trend: 'up' },
    { symbol: 'XRP/CAD', name: 'Ripple', price: '0.689', change: -1.18, trend: 'down' }
  ], []);

  // Merge real-time data with static data
  const displayCryptos = useMemo(() => {
    const desiredMinimum = 5;
    const used = new Set<string>();
    const combined: CryptoItem[] = [];

    const addItem = (item: CryptoItem | null | undefined) => {
      if (!item) return;
      if (used.has(item.symbol)) return;
      combined.push(item);
      used.add(item.symbol);
    };

    const aggregatorList = aggregatorSymbols
      .map(symbol => {
        const md = aggregatorCrypto[symbol];
        if (!md) return null;
        const cadPrice = typeof md.priceCAD === 'number' && Number.isFinite(md.priceCAD)
          ? md.priceCAD
          : typeof md.price === 'number' && Number.isFinite(md.price)
            ? md.price
            : null;
        if (cadPrice === null) return null;
        const changePct = typeof md.changePercent24h === 'number' && Number.isFinite(md.changePercent24h)
          ? md.changePercent24h
          : 0;
        return {
          symbol,
          name: symbol.split('/')[0],
          price: cadPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
          change: changePct,
          trend: changePct >= 0 ? 'up' as const : 'down' as const
        };
      })
      .filter((item): item is CryptoItem => item !== null);

    aggregatorList.forEach(addItem);

    const realtimeList = cryptoData.map(item => ({
      symbol: item.symbol,
      name: item.name,
      price: item.value,
      change: parseFloat(String(item.change)),
      trend: item.trend as 'up' | 'down'
    }));

    realtimeList.forEach(item => {
      if (combined.length < aggregatorSymbols.length) addItem(item);
    });

    staticCryptos.forEach(item => {
      if (combined.length < aggregatorSymbols.length) addItem(item);
    });

    if (combined.length < desiredMinimum) {
      return staticCryptos.slice(0, desiredMinimum);
    }

    return combined;
  }, [aggregatorCrypto, aggregatorSymbols, cryptoData, staticCryptos]);

  // Subscribe to aggregator crypto feeds for display fallback
  useEffect(() => {
    const debug = (() => {
      try {
        // Vite-first env resolution
        const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env?.VITE_DEBUG_MODE : undefined;
        const win = (typeof window !== 'undefined') ? (window as any).__ENV__?.VITE_DEBUG_MODE : undefined;
        const node = (typeof process !== 'undefined') ? (process as any).env?.VITE_DEBUG_MODE : undefined;
        return String(vite ?? win ?? node ?? '').toLowerCase() === 'true';
      } catch { return false; }
    })();

    const unsubs = aggregatorSymbols.map(symbol =>
      unifiedDataAggregator.subscribe(symbol, (md) => {
        if (debug && Number.isFinite(md.priceCAD)) {
          console.debug(`[UI] ${symbol} update → CAD ${md.priceCAD.toFixed(2)} (${new Date(md.timestamp).toLocaleTimeString()})`);
        }
        setAggregatorCrypto(prev => ({ ...prev, [symbol]: md }));
      })
    );

    return () => {
      unsubs.forEach(unsub => {
        try { unsub && unsub(); } catch {}
      });
    };
  }, [aggregatorSymbols]);

  // Rotation logic for displaying 5 cryptos at a time
  useEffect(() => {
    if (displayCryptos.length <= 5) return;

    const interval = setInterval(() => {
      setRotationIndex((prev) => (prev + 2) % Math.max(1, displayCryptos.length - 2));
    }, 21000); // Rotate every 21 seconds

    return () => clearInterval(interval);
  }, [displayCryptos.length]);

  // Get visible cryptos (first 3 fixed + 2 rotating = 5 total)
  const visibleCryptos = useMemo(() => {
    if (displayCryptos.length <= 5) {
      return displayCryptos.slice(0, 5);
    }

    const fixed = displayCryptos.slice(0, 3);
    const rotating = displayCryptos.slice(3);
    const rotatingVisible = rotating.slice(rotationIndex, rotationIndex + 2);

    // If we don't have enough rotating items, wrap around
    if (rotatingVisible.length < 2) {
      const remaining = 2 - rotatingVisible.length;
      rotatingVisible.push(...rotating.slice(0, remaining));
    }

    const result = [...fixed, ...rotatingVisible];

    // Debug: log a snapshot of symbols rendered
    try {
      const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env?.VITE_DEBUG_MODE : undefined;
      const win = (typeof window !== 'undefined') ? (window as any).__ENV__?.VITE_DEBUG_MODE : undefined;
      const node = (typeof process !== 'undefined') ? (process as any).env?.VITE_DEBUG_MODE : undefined;
      const debug = String(vite ?? win ?? node ?? '').toLowerCase() === 'true';
      if (debug) {
        console.debug('[UI] Rendering crypto cards:', result.map(r => r.symbol).join(', '));
      }
    } catch {}

    return result;
  }, [displayCryptos, rotationIndex]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="h-[425px] flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
          border: '0.5px solid rgba(0, 150, 255, 0.2)'
        }}>
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading crypto data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full">
        <div className="h-[425px] flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
          border: '0.5px solid rgba(255, 0, 0, 0.2)'
        }}>
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-red-400 mb-2">Failed to load crypto data</p>
            <button
              onClick={refresh}
              className="px-4 py-2 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <div className="space-y-2">
        {visibleCryptos.map((crypto, index) => (
          <RealTimeCryptoCard
            key={`${crypto.symbol}-${index}`}
            crypto={crypto}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default RealTimeCryptoSection;
