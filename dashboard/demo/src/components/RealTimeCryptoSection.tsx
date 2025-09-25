/**
 * Real-Time Crypto Section Component
 *
 * Displays real-time cryptocurrency data with animated price updates and mini-charts
 * Integrates with the new real-time data architecture
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, CartesianGrid, Tooltip } from 'recharts';
import { useCryptoData, useAnimatedPrice } from '../hooks/useRealTimeData';
import { Loader, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

// YieldChart Component (moved from ExchangeDashboard for integration)
const YieldChart: React.FC = () => {
  const [view, setView] = useState<'intraday' | '1y'>('intraday');
  const [data, setData] = useState<Array<{ time: string; value: number }>>([]);

  const generateData = React.useCallback((mode: 'intraday' | '1y') => {
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
      <div className="p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#00D4FF' }}>CAD 30-Year Yield</h2>
        <p className="text-sm font-bold" style={{ color: '#FFB000' }}>4.96 UNCH</p>
      </div>
      <div className="h-40 px-4 pb-4" style={{
        background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.15) 0%, rgba(0, 20, 35, 0.25) 50%, rgba(0, 8, 20, 0.35) 100%)'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8} />
                <stop offset="25%" stopColor="#FFB000" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#FF8C00" stopOpacity={0.4} />
                <stop offset="75%" stopColor="#FF6B00" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FF4500" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={0.5}
              vertical={false}
              horizontal={true}
              strokeDasharray="2 2"
            />
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
            <Area
              type="monotoneX"
              dataKey="value"
              stroke="#FFD700"
              strokeWidth={1.2}
              fill="url(#yieldGradient)"
              filter="drop-shadow(0 0 2px rgba(255, 215, 0, 0.3))"
            />
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
  realTimePrice?: number;
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
    symbol: `${crypto.symbol}-USD`,
    enableAnimation: true,
    animationDuration: 800,
    smoothingFactor: 0.3
  });

  const isPositive = trend === 'up';
  const displayPrice = price ? (price * 1.35).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : crypto.price;

  // Generate mini chart data based on trend
  const generateCryptoData = useMemo(() => {
    const baseValue = price ? price * 1.35 : parseFloat(crypto.price.replace(/,/g, ''));
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

    return data;
  }, [crypto, price]);

  return (
    <div
      className={`h-[85px] relative group overflow-hidden transition-all duration-200 ${
        isAnimating ? 'ring-1 ring-blue-400/50' : ''
      }`}
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
        border: '0.5px solid rgba(0, 150, 255, 0.2)',
        boxShadow: '0 0 20px rgba(0, 150, 255, 0.05), inset 0 0 30px rgba(0, 20, 40, 0.3)'
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
              {crypto.symbol}/CAD
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
            <AreaChart data={generateCryptoData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
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
            {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {Math.abs(crypto.change).toFixed(2)}%
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

  // Static crypto data as fallback
  const staticCryptos: CryptoItem[] = useMemo(() => [
    { symbol: 'BTC', name: 'Bitcoin', price: '86,420', change: -1.42, trend: 'down' },
    { symbol: 'ETH', name: 'Ethereum', price: '3,580', change: 2.43, trend: 'up' },
    { symbol: 'SOL', name: 'Solana', price: '142.85', change: 5.21, trend: 'up' },
    { symbol: 'AVAX', name: 'Avalanche', price: '51.30', change: -0.85, trend: 'down' },
    { symbol: 'MATIC', name: 'Polygon', price: '0.872', change: 3.15, trend: 'up' },
    { symbol: 'ADA', name: 'Cardano', price: '0.512', change: -2.14, trend: 'down' },
    { symbol: 'DOT', name: 'Polkadot', price: '8.94', change: 1.28, trend: 'up' },
    { symbol: 'LINK', name: 'Chainlink', price: '18.65', change: -0.42, trend: 'down' },
    { symbol: 'UNI', name: 'Uniswap', price: '10.28', change: 2.95, trend: 'up' },
    { symbol: 'XRP', name: 'Ripple', price: '0.689', change: -1.18, trend: 'down' }
  ], []);

  // Merge real-time data with static data
  const displayCryptos = useMemo(() => {
    if (cryptoData.length > 0) {
      return cryptoData.map(item => ({
        symbol: item.name,
        name: item.symbol.split('/')[0],
        price: item.value,
        change: parseFloat(item.change),
        trend: item.trend,
        realTimePrice: parseFloat(item.value.replace(/,/g, ''))
      }));
    }
    return staticCryptos;
  }, [cryptoData, staticCryptos]);

  // Rotation logic for displaying 6 cryptos at a time
  useEffect(() => {
    if (displayCryptos.length <= 6) return;

    const interval = setInterval(() => {
      setRotationIndex((prev) => (prev + 3) % Math.max(1, displayCryptos.length - 3));
    }, 21000); // Rotate every 21 seconds

    return () => clearInterval(interval);
  }, [displayCryptos.length]);

  // Get visible cryptos (first 3 fixed + 3 rotating)
  const visibleCryptos = useMemo(() => {
    if (displayCryptos.length <= 6) {
      return displayCryptos;
    }

    const fixed = displayCryptos.slice(0, 3);
    const rotating = displayCryptos.slice(3);
    const rotatingVisible = rotating.slice(rotationIndex, rotationIndex + 3);

    // If we don't have enough rotating items, wrap around
    if (rotatingVisible.length < 3) {
      const remaining = 3 - rotatingVisible.length;
      rotatingVisible.push(...rotating.slice(0, remaining));
    }

    return [...fixed, ...rotatingVisible];
  }, [displayCryptos, rotationIndex]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full xl:w-[440px] 2xl:w-[480px]">
        <div className="h-[510px] flex items-center justify-center" style={{
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
      <div className="w-full xl:w-[440px] 2xl:w-[480px]">
        <div className="h-[510px] flex items-center justify-center" style={{
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
    <div className="w-full xl:w-[440px] 2xl:w-[480px]">
      {/* Fixed height container for crypto rotation */}
      <div className="h-[510px] overflow-hidden" style={{
        background: 'transparent'
      }}>
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

      {/* CAD Yield Chart - Aligned with Daily Bulletin */}
      <div className="mt-3">
        <YieldChart />
      </div>
    </div>
  );
};

export default RealTimeCryptoSection;