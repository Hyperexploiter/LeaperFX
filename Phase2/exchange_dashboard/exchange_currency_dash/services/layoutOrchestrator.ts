import { FOREX_INSTRUMENTS, CRYPTO_INSTRUMENTS, COMMODITY_INSTRUMENTS, INDEX_INSTRUMENTS } from '../config/instrumentCatalog';
import { MOVERS_INDEX_SYMBOLS, getMoversTiming, COMMODITY_PANEL, PROVIDER_PRIORITY } from '../config/dashboardLayout';

export interface ColumnConfig {
  id: 'forex' | 'cryptoMain' | 'cryptoMovers' | 'commodities' | 'indices';
  title: string;
  symbols: string[];              // For forex: list of base codes; others: catalog symbols
  theme: 'forex' | 'crypto' | 'commodity';
  rotation?: { intervalMs: number; fixedSlots?: number; spotlightSlots?: number };
}

export interface LayoutConfig {
  forex: ColumnConfig;
  cryptoMain: ColumnConfig;
  cryptoMovers: ColumnConfig & { moversIndices: string[]; sequence: ('gainers'|'indices'|'losers')[]; cadence: { modeMs: number; featureMs: number } };
  commodities: ColumnConfig;
  indices: ColumnConfig;
  providerPriority: Record<string, string[]>;
}

function readEnvList(key: string, def: string[]): string[] {
  try {
    const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env?.[key] : undefined;
    const win = (typeof window !== 'undefined') ? (window as any).__ENV__?.[key] : undefined;
    const node = (typeof process !== 'undefined') ? (process as any).env?.[key] : undefined;
    const raw = String(vite ?? win ?? node ?? '').trim();
    if (!raw) return def;
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  } catch { return def; }
}

function defaultForexBases(): string[] {
  // Prefer common majors present in catalog
  const majors = ['USD','EUR','GBP','JPY','CHF'];
  const available = new Set(FOREX_INSTRUMENTS.filter(i => i.quoteCurrency === 'CAD').map(i => i.baseCurrency));
  return majors.filter(m => available.has(m));
}

function cryptoCore(): string[] {
  const order = ['BTC/CAD','ETH/CAD','SOL/CAD','AVAX/CAD','MATIC/CAD','ADA/CAD'];
  const known = new Set(CRYPTO_INSTRUMENTS.map(i => i.symbol));
  return order.filter(o => known.has(o));
}

function commodityCore(): string[] {
  const pref = COMMODITY_PANEL.symbols;
  const known = new Set(COMMODITY_INSTRUMENTS.map(i => i.symbol));
  return pref.filter(p => known.has(p));
}

function indicesCore(): string[] {
  const wanted = MOVERS_INDEX_SYMBOLS;
  const known = new Set(INDEX_INSTRUMENTS.map(i => i.symbol));
  return wanted.filter(w => known.has(w));
}

export function getLayoutConfig(): LayoutConfig {
  const forexBases = readEnvList('VITE_FOREX_BASES', defaultForexBases());
  const cryptoMainSymbols = readEnvList('VITE_CRYPTO_MAIN', cryptoCore());
  const commodities = commodityCore();
  const indices = indicesCore();

  // Movers sequence env
  const seqRaw = readEnvList('VITE_MOVERS_SEQUENCE', ['gainers','indices','losers']);
  const sequence = seqRaw.map(s => (s === 'gainers' || s === 'indices' || s === 'losers') ? s : 'gainers') as ('gainers'|'indices'|'losers')[];
  const cadence = getMoversTiming();

  return {
    forex: {
      id: 'forex',
      title: 'Foreign Exchange',
      symbols: forexBases,
      theme: 'forex'
    },
    cryptoMain: {
      id: 'cryptoMain',
      title: 'Cryptocurrency',
      symbols: cryptoMainSymbols,
      theme: 'crypto'
    },
    cryptoMovers: {
      id: 'cryptoMovers',
      title: 'Top Movers',
      symbols: cryptoMainSymbols,
      theme: 'crypto',
      moversIndices: indices,
      sequence,
      cadence
    },
    commodities: {
      id: 'commodities',
      title: 'Precious Metals & Energy',
      symbols: commodities,
      theme: 'commodity',
      rotation: {
        intervalMs: COMMODITY_PANEL.rotationIntervalMs,
        fixedSlots: COMMODITY_PANEL.fixedSlots,
        spotlightSlots: COMMODITY_PANEL.spotlightSlots
      }
    },
    indices: {
      id: 'indices',
      title: 'Market Indices',
      symbols: indices,
      theme: 'commodity'
    },
    providerPriority: PROVIDER_PRIORITY
  };
}

export default {
  getLayoutConfig
};

