import React, { useEffect, useMemo, useState } from 'react';
import unifiedDataAggregator from '../services/unifiedDataAggregator';
import { CRYPTO_INSTRUMENTS, INDEX_INSTRUMENTS } from '../config/instrumentCatalog';
import { MOVERS_INDEX_SYMBOLS, getMoversTiming } from '../config/dashboardLayout';
import orchestrator from '../services/layoutOrchestrator';
import { HighPerformanceSparkline } from './HighPerformanceSparkline';
import { getSparklineTheme } from '../services/themePresets';
import { TerminalCard } from './shared/TerminalCard';
import { TERMINAL_COLORS } from '../config/terminalTheme';

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
  const [fade, setFade] = useState(false);
  const [lastTick, setLastTick] = useState(0);

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
    const { modeMs } = getMoversTiming();
    const t = setInterval(() => setTick(t => t + 1), modeMs);
    return () => { unsubs.forEach(u => { try { u(); } catch {} }); clearInterval(t); };
  }, []);

  // Trigger grid fade on mode changes
  useEffect(() => {
    if (tick !== lastTick) {
      setFade(true);
      setLastTick(tick);
      const id = setTimeout(() => setFade(false), 600); // match CSS duration
      return () => clearTimeout(id);
    }
  }, [tick, lastTick]);

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
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: TERMINAL_COLORS.primary.orange, fontFamily: 'monospace' }}>
          {(() => { const mode = sequence[tick % sequence.length]; return mode === 'gainers' ? 'Top Gainers' : mode === 'losers' ? 'Top Losers' : 'Market Indices'; })()}
        </div>
        <div className="text-[10px] text-gray-500 font-mono">Auto‑rotating</div>
      </div>

      {/* Grid: Simple 3x2 layout (6 tiles) */}
      <div className={`grid grid-cols-3 gap-2 ${fade ? 'fade-in' : ''}`}>
        {visible.map((it, idx) => {
          const isYield = it.engineSymbol.endsWith('YIELD');

          return (
            <TerminalCard key={`${it.engineSymbol}-${idx}`} height="90px" variant="mover">
              <div className="h-full flex items-center px-3">
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1 truncate">
                    <div className="text-sm font-bold" style={{ color: TERMINAL_COLORS.primary.orange, fontFamily: 'monospace' }}>
                      {it.symbol}
                    </div>
                  </div>
                  <div className="text-xs">
                    <span style={{ color: TERMINAL_COLORS.primary.blue }}>Price: </span>
                    <span className={`font-mono font-bold ${it.price === null ? 'text-gray-500' : 'text-white'}`}>
                      {formatPrice(it.price)}
                    </span>
                    <span className="ml-1 text-[10px] text-gray-500">CAD</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{
                    color: it.change >= 0 ? TERMINAL_COLORS.trend.up : TERMINAL_COLORS.trend.down
                  }}>
                    {it.price !== null ? (it.change >= 0 ? '▲' : '▼') : '•'} {Math.abs(it.change).toFixed(2)}%
                  </div>
                </div>

                {/* Sparkline - Skip for yield symbols */}
                {!isYield && (
                  <div className="w-[120px] h-[50px] ml-3 flex items-center">
                    <HighPerformanceSparkline
                      symbol={it.engineSymbol}
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
                )}
              </div>
            </TerminalCard>
          );
        })}
      </div>
    </div>
  );
};

export default TopMoversGrid;
