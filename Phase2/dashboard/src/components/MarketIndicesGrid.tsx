import React, { useEffect, useMemo, useState } from 'react';
import unifiedDataAggregator from '../services/unifiedDataAggregator';
import { INDEX_INSTRUMENTS } from '../config/instrumentCatalog';
import { HighPerformanceSparkline } from './HighPerformanceSparkline';
import { getSparklineTheme } from '../services/themePresets';

type Trend = 'up' | 'down';

interface IndexItem {
  label: string;
  symbol: string;      // catalog symbol
  engineSymbol: string;// engine key
  value: number | null;
  change: number | null; // percent
  trend: Trend | null;
}

const valueFormat = (v: number | null, isYield: boolean) => {
  if (v === null || !Number.isFinite(v)) return '—';
  if (isYield) return `${v.toFixed(3)}%`;
  if (v >= 1000) return v.toFixed(0);
  if (v >= 1) return v.toFixed(2);
  return v.toFixed(4);
};

const MarketIndicesGrid: React.FC<{ getBuffer: (symbol: string) => any }> = ({ getBuffer }) => {
  const [indices, setIndices] = useState<Record<string, IndexItem>>({});

  const coreSymbols = useMemo(() => {
    // Preferred set; make sure they exist in catalog
    const wanted = ['CA-30Y-YIELD', 'TSX', 'TSX60', 'SPX/CAD', 'DJI/CAD', 'NASDAQ/CAD'];
    const known = new Set(INDEX_INSTRUMENTS.map(i => i.symbol));
    return wanted.filter(w => known.has(w));
  }, []);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    coreSymbols.forEach(sym => {
      const unsub = unifiedDataAggregator.subscribe(sym, (md) => {
        const isYield = sym === 'CA-30Y-YIELD' || /YIELD/i.test(sym);
        const value = Number.isFinite(md.priceCAD) ? md.priceCAD : (Number.isFinite(md.price) ? md.price : null);
        const chg = typeof md.changePercent24h === 'number' && Number.isFinite(md.changePercent24h) ? md.changePercent24h : null;
        setIndices(prev => ({
          ...prev,
          [sym]: {
            label: sym.replace('/CAD',''),
            symbol: sym,
            engineSymbol: sym.replace('/',''),
            value,
            change: chg,
            trend: chg === null ? null : (chg >= 0 ? 'up' : 'down')
          }
        }));
      });
      unsubs.push(unsub);
    });
    return () => { unsubs.forEach(u => { try { u(); } catch {} }); };
  }, [coreSymbols]);

  const list = useMemo(() => coreSymbols.map(sym => indices[sym] || ({
    label: sym.replace('/CAD',''), symbol: sym, engineSymbol: sym.replace('/',''), value: null, change: null, trend: null
  })), [coreSymbols, indices]);

  const th = getSparklineTheme('commodity');

  return (
    <div className="w-full grid grid-cols-2 gap-2">
      {list.map((it, idx) => {
        const isYield = it.symbol === 'CA-30Y-YIELD';
        return (
          <div
            key={`${it.symbol}-${idx}`}
            className="h-[90px] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
              border: '0.5px solid rgba(0, 212, 255, 0.15)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.05), inset 0 0 30px rgba(0, 20, 40, 0.3)'
            }}
          >
            <div className="h-full flex items-center px-3">
              <div className="flex-1">
                <div className="text-xs font-bold" style={{ color: '#FFA500', fontFamily: 'monospace' }}>{it.label}</div>
                <div className="font-mono font-bold text-sm" style={{ color: '#FFFFFF' }}>{valueFormat(it.value, isYield)}</div>
                <div className="text-[10px] font-bold" style={{ color: it.trend === 'up' ? '#00FF88' : it.trend === 'down' ? '#FF4444' : '#666' }}>
                  {it.change === null ? '• —' : ((it.change >= 0 ? '▲ ' : '▼ ') + Math.abs(it.change).toFixed(2) + '%')}
                </div>
              </div>
              {!isYield && (
                <div className="w-[96px] h-[48px] ml-2 flex items-center">
                  <HighPerformanceSparkline
                    symbol={it.engineSymbol}
                    buffer={getBuffer(it.engineSymbol)}
                    width={96}
                    height={48}
                    color={it.trend === 'down' ? th.colorDown : th.colorUp}
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
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MarketIndicesGrid;

