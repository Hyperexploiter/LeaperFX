import { INSTRUMENT_CATALOG } from '../config/instrumentCatalog';
import registry from './providers/registry';

export interface CoverageEntry {
  symbol: string;
  name: string;
  category: string;
  provider: string | null;
}

/**
 * Returns a simple coverage list mapping instruments to their primary provider by category.
 * Helps planning provider expansion and auditing UI columns.
 */
export function getCoverageByCategory(category: 'forex' | 'crypto' | 'commodity' | 'index' | 'yield'): CoverageEntry[] {
  const primary = registry.getPrimaryProvider(category as any);
  return INSTRUMENT_CATALOG
    .filter(i => i.category === category)
    .map(i => ({ symbol: i.symbol, name: i.name, category: i.category, provider: primary }));
}

/**
 * Returns a map of provider -> instruments for quick overview.
 */
export function getProviderMap(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const cats: Array<'forex' | 'crypto' | 'commodity' | 'index' | 'yield'> = ['forex', 'crypto', 'commodity', 'index', 'yield'];
  cats.forEach(cat => {
    const primary = registry.getPrimaryProvider(cat as any) || 'unknown';
    if (!out[primary]) out[primary] = [];
    INSTRUMENT_CATALOG.filter(i => i.category === cat).forEach(i => out[primary].push(i.symbol));
  });
  return out;
}

export default {
  getCoverageByCategory,
  getProviderMap
};

