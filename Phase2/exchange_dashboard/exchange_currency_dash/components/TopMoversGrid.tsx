import React, { useEffect, useMemo, useState } from 'react';
import unifiedDataAggregator from '../services/unifiedDataAggregator';
import { CRYPTO_INSTRUMENTS, INDEX_INSTRUMENTS } from '../config/instrumentCatalog';
import { MOVERS_INDEX_SYMBOLS, getMoversTiming } from '../config/dashboardLayout';
import orchestrator from '../services/layoutOrchestrator';
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

type ItemType = 'crypto' | 'index' | 'yield';

const TopMoversGrid: React.FC<{ getBuffer: (symbol: string) => any }> = ({ getBuffer }) => {
  const [movers, setMovers] = useState<Record<string, MoverItem>>({});
  const [tick, setTick] = useState(0);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [fade, setFade] = useState(false);
  const [lastTick, setLastTick] = useState(0);
  type LayoutMode = 'six' | 'twoPlusRect' | 'threePlusRect';
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('six');

  // Read blue overlay params from env
  const blueParams = useMemo(() => {
    try {
      const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env : undefined;
      const winEnv = (typeof window !== 'undefined') ? (window as any).__ENV__ : undefined;
      const nodeEnv = (typeof process !== 'undefined') ? (process as any).env : undefined;
      const speedRaw = String((vite && vite.VITE_BLUE_PULSE_SPEED) || (winEnv && winEnv.VITE_BLUE_PULSE_SPEED) || (nodeEnv && nodeEnv.VITE_BLUE_PULSE_SPEED) || '6');
      const opacRaw = String((vite && vite.VITE_BLUE_WASH_OPACITY) || (winEnv && winEnv.VITE_BLUE_WASH_OPACITY) || (nodeEnv && nodeEnv.VITE_BLUE_WASH_OPACITY) || '1.0');
      const speed = Math.max(2, Math.min(12, parseFloat(speedRaw)));
      const opacity = Math.max(0.05, Math.min(1.0, parseFloat(opacRaw)));
      return { speed, opacity };
    } catch { return { speed: 6, opacity: 1.0 }; }
  }, []);

  // Subscribe to crypto + selected indices / yield
  useEffect(() => {
    const unsubs: Array<() => void> = [];
    // Crypto instruments
    CRYPTO_INSTRUMENTS.forEach(inst => {
      const unsub = unifiedDataAggregator.subscribe(inst.symbol, (md) => {
        const name = inst.symbol.split('/')[0];
        const chg = typeof md.changePercent24h === 'number' && Number.isFinite(md.changePercent24h) ? md.changePercent24h : 0;
        const priceCAD = Number.isFinite(md.priceCAD) ? md.priceCAD : (Number.isFinite(md.price) ? md.price : null);
        setMovers(prev => ({
          ...prev,
          [inst.symbol]: {
            symbol: name,
            engineSymbol: inst.symbol.replace('/','').replace(/-/g,''),
            change: chg,
            price: priceCAD,
            trend: chg >= 0 ? 'up' : 'down'
          }
        }));
      });
      unsubs.push(unsub);
    });
    // Indices and yield: include TSX, TSX60, SPX/CAD, DJI/CAD, NASDAQ/CAD, CA-30Y-YIELD
    const wanted = new Set(MOVERS_INDEX_SYMBOLS);
    INDEX_INSTRUMENTS.filter(i => wanted.has(i.symbol)).forEach(inst => {
      const unsub = unifiedDataAggregator.subscribe(inst.symbol, (md) => {
        const display = inst.symbol.replace('/CAD','');
        const chg = typeof md.changePercent24h === 'number' && Number.isFinite(md.changePercent24h) ? md.changePercent24h : 0;
        const priceCAD = Number.isFinite(md.priceCAD) ? md.priceCAD : (Number.isFinite(md.price) ? md.price : null);
        setMovers(prev => ({
          ...prev,
          [inst.symbol]: {
            symbol: display,
            engineSymbol: inst.symbol.replace('/','').replace(/-/g,''),
            change: chg,
            price: priceCAD,
            trend: chg >= 0 ? 'up' : 'down'
          }
        }));
      });
      unsubs.push(unsub);
    });
    const { modeMs, featureMs } = getMoversTiming();
    const t = setInterval(() => setTick(t => t + 1), modeMs);
    const f = setInterval(() => setFeatureIndex(i => (i + 1) % 6), featureMs);
    return () => { unsubs.forEach(u => { try { u(); } catch {} }); clearInterval(t); clearInterval(f); };
  }, []);

  // Trigger grid fade on mode changes and rotate layout mode
  useEffect(() => {
    if (tick !== lastTick) {
      setFade(true);
      setLastTick(tick);
      // Rotate layout pattern every mode tick: six → 2+rect → 3+rect → six
      setLayoutMode(prev => prev === 'six' ? 'twoPlusRect' : prev === 'twoPlusRect' ? 'threePlusRect' : 'six');
      const id = setTimeout(() => setFade(false), 600); // match CSS duration
      return () => clearTimeout(id);
    }
  }, [tick]);

  // Build top gainers/losers list across both crypto + indices (yield included but may have 0 change)
  const sequence = useMemo(() => {
    try {
      const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env?.VITE_MOVERS_SEQUENCE : undefined;
      const win = (typeof window !== 'undefined') ? (window as any).__ENV__?.VITE_MOVERS_SEQUENCE : undefined;
      const node = (typeof process !== 'undefined') ? (process as any).env?.VITE_MOVERS_SEQUENCE : undefined;
      const raw = String(vite ?? win ?? node ?? 'gainers,indices,losers');
      const parts = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const valid = ['gainers','losers','indices'];
      const seq = parts.filter(p => valid.includes(p));
      if (seq.length) return seq as any;
      // fallback from orchestrator
      const lc = orchestrator.getLayoutConfig();
      return lc.cryptoMovers.sequence;
    } catch { return ['gainers','indices','losers']; }
  }, []);

  const visible = useMemo(() => {
    const arr = Object.values(movers);
    if (arr.length === 0) return [] as MoverItem[];
    const gainers = arr.filter(x => x.change >= 0).sort((a,b) => b.change - a.change).slice(0, 6);
    const losers = arr.filter(x => x.change < 0).sort((a,b) => a.change - b.change).slice(0, 6);
    const indices = MOVERS_INDEX_SYMBOLS.map(sym => movers[sym]).filter(Boolean).slice(0,6);
    const mode = sequence[tick % sequence.length];
    const chosen = mode === 'gainers' ? gainers : mode === 'losers' ? losers : indices;
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
          {(() => { const mode = sequence[tick % sequence.length]; return mode === 'gainers' ? 'Top Gainers' : mode === 'losers' ? 'Top Losers' : 'Market Indices'; })()}
        </div>
        <div className="text-[10px] text-gray-500 font-mono">Auto‑rotating</div>
      </div>

      {/* Grid: 3 columns with fixed row height; layout pattern rotates to avoid truncation */}
      <div className={`grid grid-cols-3 gap-2 ${fade ? 'fade-in' : ''}`}>
        {(() => {
          const renderSmall = (it: MoverItem, key: string) => (
            <div
              key={key}
              className={`relative overflow-hidden h-[90px] transition-all duration-300 bloomberg-terminal-card movers-card slide-up data-update min-w-0`}
            >
              <div className="h-full flex items-center px-3">
                <div className="card-blue-inner blue-pulse" style={{ opacity: blueParams.opacity, animationDuration: `${blueParams.speed}s` }}></div>
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1 truncate">
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
                <div className={`w-[120px] h-[50px] ml-3 flex items-center`}>
                  <HighPerformanceSparkline
                    symbol={`${it.engineSymbol}`}
                    buffer={getBuffer(it.engineSymbol)}
                    width={120}
                    height={50}
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
                    sampleCount={160}
                  />
                </div>
              </div>
            </div>
          );

          const renderRect = (it: MoverItem, key: string) => (
            <div
              key={key}
              className={`relative overflow-hidden col-span-3 h-[90px] transition-all duration-300 bloomberg-terminal-card movers-card feature-zoom min-w-0`}
            >
              <div className="h-full flex items-center px-3">
                <div className="card-blue-inner blue-pulse" style={{ opacity: blueParams.opacity, animationDuration: `${blueParams.speed}s` }}></div>
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1 truncate">
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
                <div className={`w-[240px] h-[70px] ml-3 flex items-center`}>
                  <HighPerformanceSparkline
                    symbol={`${it.engineSymbol}`}
                    buffer={getBuffer(it.engineSymbol)}
                    width={240}
                    height={70}
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
                    sampleCount={300}
                  />
                </div>
              </div>
            </div>
          );

          // Prepare items based on layout mode
          const smallCount = layoutMode === 'six' ? 6 : layoutMode === 'twoPlusRect' ? 2 : 3;
          const items: JSX.Element[] = [];
          for (let i = 0; i < Math.min(smallCount, visible.length); i++) {
            items.push(renderSmall(visible[i], `${visible[i].symbol}-s-${i}`));
          }

          // Fill the remaining spot on the first row when we only render 2 squares (for visual balance)
          if (layoutMode === 'twoPlusRect') {
            items.push(<div key="ph" className="h-[90px] invisible" />);
          }

          if (layoutMode !== 'six') {
            const rectIdx = (smallCount + (featureIndex % Math.max(1, visible.length - smallCount))) % visible.length;
            items.push(renderRect(visible[rectIdx], `${visible[rectIdx].symbol}-r`));
          } else {
            // Ensure exactly 6 squares in six mode
            for (let i = smallCount; i < 6; i++) {
              items.push(renderSmall(visible[i], `${visible[i].symbol}-s-${i}`));
            }
          }

          return items;
        })()}
      </div>
    </div>
  );
};

export default TopMoversGrid;
