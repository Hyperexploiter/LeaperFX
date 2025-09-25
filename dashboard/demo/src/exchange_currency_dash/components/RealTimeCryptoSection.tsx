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

// CAD Yield Data Configuration
interface YieldDataPoint {
  name: string;
  value: number;
  status: string;
  color: string;
}

const yieldRotationData: YieldDataPoint[] = [
  { name: 'CAD 30-Year Yield', value: 4.96, status: 'UNCH', color: '#FFB000' },
  { name: 'CAD 10-Year Yield', value: 3.82, status: '+0.02', color: '#00FF88' },
  { name: 'CAD 5-Year Yield', value: 3.45, status: '-0.01', color: '#FF4444' },
  { name: 'CAD 2-Year Yield', value: 3.12, status: '+0.03', color: '#00FF88' },
  { name: 'TSX 60 Index', value: 85, status: '+0.85%', color: '#00FF88' },
  { name: 'S&P/TSX Composite', value: 120, status: '+1.2%', color: '#00FF88' }
];

// Dynamic YieldChart Component with 30s rotation
const YieldChart: React.FC = () => {
  const [view, setView] = useState<'intraday' | '1y'>('intraday');
  const [data, setData] = useState<Array<{ time: string; value: number }>>([]);
  const [rotationIndex, setRotationIndex] = useState(0);

  // Current yield data based on rotation
  const currentYield = yieldRotationData[rotationIndex];

  const generateData = React.useCallback((mode: 'intraday' | '1y', baseValue: number, trend: string) => {
    const now = new Date();
    const points = mode === 'intraday' ? 90 : 240;
    const base = baseValue / (currentYield.name.includes('Index') ? 20 : 1); // Scale index values for chart display
    const arr: Array<{ time: string; value: number }> = [];

    // Determine trend direction
    const isPositive = trend.includes('+') || trend === 'UNCH';
    const volatility = currentYield.name.includes('Index') ? 0.008 : 0.002; // Higher volatility for indices

    for (let i = 0; i < points; i++) {
      const t = new Date(
        now.getTime() - (points - i) * (mode === 'intraday' ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000)
      );

      // Create realistic movement pattern based on instrument type
      const progress = i / (points - 1);
      let drift: number;

      if (currentYield.name.includes('Index')) {
        // Stock indices have more momentum-based movement
        drift = Math.sin(progress * Math.PI * 0.5) * (isPositive ? 0.02 : -0.02) +
                Math.sin(i / 12) * 0.01 + (Math.random() - 0.5) * volatility;
      } else {
        // Bond yields have smoother, more predictable movement
        drift = Math.sin(i / 18) * 0.03 + (Math.random() - 0.5) * volatility;
        if (!isPositive && trend !== 'UNCH') drift -= 0.005;
        if (isPositive && trend !== 'UNCH') drift += 0.005;
      }

      const val = parseFloat((base + drift).toFixed(3));
      arr.push({
        time: mode === 'intraday'
          ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : t.toLocaleDateString('en-CA', { month: 'short' }),
        value: Math.max(0, val) // Ensure non-negative values
      });
    }
    return arr;
  }, [rotationIndex, currentYield]);

  // Rotation effect - every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % yieldRotationData.length);
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Generate data when rotation changes
  useEffect(() => {
    setData(generateData(view, currentYield.value, currentYield.status));
  }, [view, generateData, currentYield]);

  // Live update every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const volatility = currentYield.name.includes('Index') ? 0.003 : 0.001;
        const nextVal = parseFloat((last.value * (1 + (Math.random() - 0.5) * volatility)).toFixed(3));
        const now = new Date();
        const nextLabel = view === 'intraday'
          ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : now.toLocaleDateString('en-CA', { month: 'short' });
        return [...prev.slice(1), { time: nextLabel, value: Math.max(0, nextVal) }];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [view, currentYield]);

  // Dynamic gradient based on current instrument
  const gradientId = `yieldGradient-${rotationIndex}`;
  const isIndex = currentYield.name.includes('Index');

  return (
    <div className="bg-black border transition-all duration-1000" style={{ borderColor: 'rgba(0, 212, 255, 0.15)', borderWidth: '0.5px' }}>
      <div className="p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider transition-all duration-500" style={{ color: '#00D4FF' }}>
          {currentYield.name}
        </h2>
        <p className="text-sm font-bold transition-all duration-500" style={{ color: currentYield.color }}>
          {currentYield.value}{isIndex ? '' : '%'} {currentYield.status}
        </p>
      </div>
      <div className="h-40 px-4 pb-4" style={{
        background: 'linear-gradient(135deg, rgba(0, 40, 60, 0.15) 0%, rgba(0, 20, 35, 0.25) 50%, rgba(0, 8, 20, 0.35) 100%)'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                {isIndex ? (
                  // Stock index gradient (blue-green)
                  <>
                    <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.8} />
                    <stop offset="25%" stopColor="#0099CC" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#006699" stopOpacity={0.4} />
                    <stop offset="75%" stopColor="#003366" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#001133" stopOpacity={0.05} />
                  </>
                ) : (
                  // Bond yield gradient (gold)
                  <>
                    <stop offset="0%" stopColor="#FFD700" stopOpacity={0.8} />
                    <stop offset="25%" stopColor="#FFB000" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#FF8C00" stopOpacity={0.4} />
                    <stop offset="75%" stopColor="#FF6B00" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#FF4500" stopOpacity={0.05} />
                  </>
                )}
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
              labelStyle={{ color: isIndex ? '#00D4FF' : '#FFD700', fontSize: 10 }}
              itemStyle={{ color: currentYield.color, fontSize: 9 }}
            />
            <Area
              type="monotoneX"
              dataKey="value"
              stroke={isIndex ? '#00D4FF' : '#FFD700'}
              strokeWidth={1.2}
              fill={`url(#${gradientId})`}
              filter={`drop-shadow(0 0 2px ${isIndex ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 215, 0, 0.3)'})`}
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

  // Enhanced mini chart data with synchronized updates
  const [chartData, setChartData] = useState<Array<{ time: number; value: number }>>([]);

  // Generate initial chart data
  useEffect(() => {
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
            <span className="mr-1">{isPositive ? '▲' : '▼'}</span>
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
      <div className="w-full">
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
      <div className="w-full">
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
    <div className="w-full">
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