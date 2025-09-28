import React, { useEffect, useMemo, useState } from 'react';
import unifiedDataAggregator from '../services/unifiedDataAggregator';
import { CRYPTO_INSTRUMENTS } from '../config/instrumentCatalog';
import { HighPerformanceSparkline } from './HighPerformanceSparkline';
import { getSparklineTheme } from '../services/themePresets';

type Trend = 'up' | 'down';

interface MoverItem {
  symbol: string;         // display like BTC
  engineSymbol: string;   // BTCCAD
  change: number;         // percent
  price: number | null;   // CAD
  trend: Trend;
}

const formatPrice = (p: number | null) => {
  if (p === null || !Number.isFinite(p)) return '—';
  if (p >= 1000) return p.toFixed(0);
  if (p >= 1) return p.toFixed(2);
  return p.toFixed(4);
};

const TopMoversGrid: React.FC<{ getBuffer: (symbol: string) => any }> = ({ getBuffer }) => {
  const [movers, setMovers] = useState<Record<string, MoverItem>>({});
  const [tick, setTick] = useState(0);
  const [featureIndex, setFeatureIndex] = useState(0);

  // Subscribe to all crypto instruments
  useEffect(() => {
    const unsubs: Array<() => void> = [];
    CRYPTO_INSTRUMENTS.forEach(inst => {
      const unsub = unifiedDataAggregator.subscribe(inst.symbol, (md) => {
        const name = inst.symbol.split('/')[0];
        const chg = typeof md.changePercent24h === 'number' && Number.isFinite(md.changePercent24h) ? md.changePercent24h : 0;
        const priceCAD = Number.isFinite(md.priceCAD) ? md.priceCAD : (Number.isFinite(md.price) ? md.price : null);
        setMovers(prev => ({
          ...prev,
          [inst.symbol]: {
            symbol: name,
            engineSymbol: inst.symbol.replace('/',''),
            change: chg,
            price: priceCAD,
            trend: chg >= 0 ? 'up' : 'down'
          }
        }));
      });
      unsubs.push(unsub);
    });
    const t = setInterval(() => setTick(t => t + 1), 20000); // rotate set every 20s
    const f = setInterval(() => setFeatureIndex(i => (i + 1) % 6), 12000); // feature cycles every 12s
    return () => { unsubs.forEach(u => { try { u(); } catch {} }); clearInterval(t); clearInterval(f); };
  }, []);

  // Build top gainers/losers list
  const visible = useMemo(() => {
    const arr = Object.values(movers);
    if (arr.length === 0) return [] as MoverItem[];
    const gainers = arr.filter(x => x.change >= 0).sort((a,b) => b.change - a.change).slice(0, 6);
    const losers = arr.filter(x => x.change < 0).sort((a,b) => a.change - b.change).slice(0, 6);
    // Alternate modes by tick: even shows gainers, odd shows losers
    const chosen = (tick % 2 === 0 ? gainers : losers);
    // Ensure 6 entries (pad with placeholders if needed)
    while (chosen.length < 6) chosen.push({ symbol: '—', engineSymbol: '—', change: 0, price: null, trend: 'down' });
    return chosen.slice(0,6);
  }, [movers, tick]);

  const th = getSparklineTheme('crypto');

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: '#FFA500', fontFamily: 'monospace' }}>
          {tick % 2 === 0 ? 'Top Gainers' : 'Top Losers'}
        </div>
        <div className="text-[10px] text-gray-500 font-mono">Auto‑rotating</div>
      </div>

      {/* Grid: 3 columns, 2 rows; first cell can be featured (span 3 on first row) */}
      <div className="grid grid-cols-3 gap-2">
        {visible.map((it, idx) => {
          const featured = idx === (featureIndex % 6);
          const key = `${it.symbol}-${idx}`;
          const cardStyle = {
            background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
            border: '0.5px solid rgba(0, 212, 255, 0.15)',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.05), inset 0 0 30px rgba(0, 20, 40, 0.3)'
          } as React.CSSProperties;
          return (
            <div
              key={key}
              className={`relative overflow-hidden ${featured ? 'col-span-3 h-[110px]' : 'h-[85px]'} transition-all duration-300`}
              style={cardStyle}
            >
              <div className="h-full flex items-center px-3">
                {/* Left info */}
                <div className="flex-1">
                  <div className="mb-1">
                    <div className="text-sm font-bold" style={{ color: '#FFA500', fontFamily: 'monospace' }}>{it.symbol}</div>
                  </div>
                  <div className="text-xs">
                    <span style={{ color: '#4A90E2' }}>Price: </span>
                    <span className={`font-mono font-bold ${it.price === null ? 'text-gray-500' : 'text-white'}`}>{formatPrice(it.price)}</span>
                    <span className="ml-1 text-[10px] text-gray-500">CAD</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: it.change >= 0 ? '#00FF88' : '#FF4444' }}>
                    {it.price !== null ? (it.change >= 0 ? '▲' : '▼') : '•'} {Math.abs(it.change).toFixed(2)}%
                  </div>
                </div>
                {/* Sparkline */}
                <div className={`${featured ? 'w-[220px] h-[80px]' : 'w-[120px] h-[50px]'} ml-3 flex items-center`}>
                  <HighPerformanceSparkline
                    symbol={`${it.engineSymbol}`}
                    buffer={getBuffer(it.engineSymbol)}
                    width={featured ? 220 : 120}
                    height={featured ? 80 : 50}
                    color={it.trend === 'up' ? th.colorUp : th.colorDown}
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
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopMoversGrid;
