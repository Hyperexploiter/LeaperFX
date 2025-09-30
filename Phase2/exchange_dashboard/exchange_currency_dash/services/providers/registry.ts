/**
 * Provider Registry
 * Minimal indirection so we can swap/extend providers without touching aggregator core.
 */

export type ProviderCategory = 'forex' | 'crypto' | 'commodity' | 'index' | 'yield';

export interface ProviderInfo {
  name: string;
  categories: ProviderCategory[];
  notes?: string;
}

export const PROVIDERS: ProviderInfo[] = [
  { name: 'polygon', categories: ['forex', 'index'], notes: 'FX prev-close, last trade for indices' },
  { name: 'twelvedata', categories: ['commodity'], notes: 'Commodities price/time_series (USD)' },
  { name: 'coinbase', categories: ['crypto'] },
  { name: 'boc', categories: ['yield'], notes: 'Bank of Canada Valet (bond yields)' }
];

export function listProvidersByCategory(cat: ProviderCategory): string[] {
  return PROVIDERS.filter(p => p.categories.includes(cat)).map(p => p.name);
}

export function getPrimaryProvider(cat: ProviderCategory): string | null {
  // Simple preference order for now
  const order: Record<ProviderCategory, string[]> = {
    forex: ['polygon'],
    commodity: ['twelvedata'],
    crypto: ['coinbase'],
    index: ['polygon'],
    yield: ['boc']
  };
  return (order[cat] && order[cat][0]) || null;
}

/**
 * Priority per category (and optional symbol overrides) for future fine control.
 */
const CATEGORY_PRIORITY: Record<ProviderCategory, string[]> = {
  forex: ['polygon', 'fxapi'],
  commodity: ['twelvedata', 'polygon'],
  crypto: ['coinbase'],
  index: ['polygon', 'alpaca'],
  yield: ['boc']
};

const SYMBOL_PRIORITY: Record<string, string[]> = {
  // e.g., 'XAU/CAD': ['twelvedata']
};

export function getProviderPriority(category: ProviderCategory, symbol?: string): string[] {
  if (symbol && SYMBOL_PRIORITY[symbol]) return SYMBOL_PRIORITY[symbol];
  return CATEGORY_PRIORITY[category] || [];
}

export function setSymbolPriority(symbol: string, providers: string[]) {
  SYMBOL_PRIORITY[symbol] = providers;
}

export function setCategoryPriority(category: ProviderCategory, providers: string[]) {
  CATEGORY_PRIORITY[category] = providers;
}

export default {
  PROVIDERS,
  listProvidersByCategory,
  getPrimaryProvider,
  getProviderPriority,
  setSymbolPriority,
  setCategoryPriority
};
