/**
 * Central dashboard layout + rotation + provider preferences registry
 * Purpose: one place to manage columns/grids, instruments, providers, and cadence.
 */

export const MOVERS_INDEX_SYMBOLS = [
  'CA-30Y-YIELD',
  'TSX',
  'TSX60',
  'SPX/CAD',
  'DJI/CAD',
  'NASDAQ/CAD'
];

export function getMoversTiming() {
  const modeMs = readEnvNumber('VITE_MOVERS_MODE_MS', 24000);
  const featureMs = readEnvNumber('VITE_MOVERS_FEATURE_MS', 12000);
  return { modeMs, featureMs };
}

export const COMMODITY_PANEL = {
  symbols: ['XAU/CAD', 'XAG/CAD', 'XPT/CAD', 'WTI/CAD', 'BRENT/CAD', 'NG/CAD'],
  rotationIntervalMs: readEnvNumber('VITE_COMMODITIES_ROTATE_MS', 21000),
  fixedSlots: 3,
  spotlightSlots: 3
};

export const PROVIDER_PRIORITY: Record<string, string[]> = {
  forex: ['polygon', 'fxapi'],
  commodity: ['twelvedata', 'polygon'],
  crypto: ['coinbase'],
  index: ['polygon', 'alpaca'],
  yield: ['boc']
};

function readEnvNumber(key: string, def: number): number {
  try {
    const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env?.[key] : undefined;
    const win = (typeof window !== 'undefined') ? (window as any).__ENV__?.[key] : undefined;
    const node = (typeof process !== 'undefined') ? (process as any).env?.[key] : undefined;
    const raw = (vite ?? win ?? node);
    const n = parseFloat(String(raw));
    return Number.isFinite(n) ? n : def;
  } catch { return def; }
}

