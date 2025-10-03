import React, { useEffect, useMemo, useState } from 'react';
import unifiedDataAggregator, { MarketDataPoint } from '../services/unifiedDataAggregator';

interface TickerProps {
  fxBases: string[];              // e.g., ['USD','EUR']
  cryptoSymbols: string[];        // e.g., ['BTC/CAD','ETH/CAD']
  commoditySymbols: string[];     // e.g., ['XAU/CAD','XAG/CAD']
  indexSymbols: string[];         // e.g., ['TSX','SPX/CAD']
}

type Item = { label: string; value: string; dir: 'up'|'down'|'flat' };

const labelColor = (dir: Item['dir']) => dir === 'up' ? '#00FF88' : dir === 'down' ? '#FF4444' : '#888888';

const UnifiedTicker: React.FC<TickerProps> = ({ fxBases, cryptoSymbols, commoditySymbols, indexSymbols }) => {
  const [map, setMap] = useState<Record<string, MarketDataPoint>>({});

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    // FX as X/CAD pairs
    fxBases.forEach(base => {
      const sym = `${base}/CAD`;
      const unsub = unifiedDataAggregator.subscribe(sym, md => setMap(prev => ({ ...prev, [sym]: md })));
      unsubs.push(unsub);
    });
    // Others
    [...cryptoSymbols, ...commoditySymbols, ...indexSymbols].forEach(sym => {
      const unsub = unifiedDataAggregator.subscribe(sym, md => setMap(prev => ({ ...prev, [sym]: md })));
      unsubs.push(unsub);
    });
    return () => { unsubs.forEach(u => { try { u(); } catch {} }); };
  }, [fxBases, cryptoSymbols, commoditySymbols, indexSymbols]);

  const items: Item[] = useMemo(() => {
    const out: Item[] = [];
    // FX
    fxBases.forEach(base => {
      const sym = `${base}/CAD`;
      const md = map[sym];
      if (!md) return;
      const v = Number.isFinite(md.priceCAD) ? md.priceCAD : (Number.isFinite(md.price) ? md.price : NaN);
      if (!Number.isFinite(v)) return;
      const chg = typeof md.changePercent24h === 'number' ? md.changePercent24h : 0;
      out.push({ label: base, value: (v >= 2 ? v.toFixed(2) : v.toFixed(4)), dir: chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat' });
    });
    // Crypto
    cryptoSymbols.forEach(sym => {
      const md = map[sym];
      if (!md) return;
      const v = Number.isFinite(md.priceCAD) ? md.priceCAD : (Number.isFinite(md.price) ? md.price : NaN);
      if (!Number.isFinite(v)) return;
      const base = sym.replace('/CAD','').replace('-USD','');
      const chg = typeof md.changePercent24h === 'number' ? md.changePercent24h : 0;
      out.push({ label: base, value: (v >= 1000 ? v.toFixed(0) : v >= 1 ? v.toFixed(2) : v.toFixed(4)), dir: chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat' });
    });
    // Commodities
    commoditySymbols.forEach(sym => {
      const md = map[sym];
      if (!md) return;
      const v = Number.isFinite(md.priceCAD) ? md.priceCAD : (Number.isFinite(md.price) ? md.price : NaN);
      if (!Number.isFinite(v)) return;
      const base = sym.replace('/CAD','');
      const chg = typeof md.changePercent24h === 'number' ? md.changePercent24h : 0;
      out.push({ label: base, value: (v >= 1000 ? v.toFixed(0) : v >= 1 ? v.toFixed(2) : v.toFixed(4)), dir: chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat' });
    });
    // Indices
    indexSymbols.forEach(sym => {
      const md = map[sym];
      if (!md) return;
      const v = Number.isFinite(md.priceCAD) ? md.priceCAD : (Number.isFinite(md.price) ? md.price : NaN);
      if (!Number.isFinite(v)) return;
      const base = sym.replace('/CAD','');
      const chg = typeof md.changePercent24h === 'number' ? md.changePercent24h : 0;
      out.push({ label: base, value: (v >= 1000 ? v.toFixed(0) : v >= 1 ? v.toFixed(2) : v.toFixed(4)), dir: chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat' });
    });
    return out;
  }, [map, fxBases, cryptoSymbols, commoditySymbols, indexSymbols]);

  // Build marquee rows (duplicated for infinite scroll illusion)
  const row = (
    <div className="flex items-center gap-6 whitespace-nowrap px-4 py-1 text-xs font-mono">
      {items.map((it, i) => (
        <span key={`${it.label}-${i}`} className="flex items-center gap-1">
          <span style={{ color: '#FFD700' }}>{it.label}</span>
          <span style={{ color: labelColor(it.dir) }}>{it.dir === 'up' ? '▲' : it.dir === 'down' ? '▼' : '•'}</span>
          <span className="text-white">{it.value}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden w-full h-full">
      <div className="absolute inset-0 flex animate-ticker-scroll">
        {row}
        {row}
      </div>
    </div>
  );
};

export default UnifiedTicker;

