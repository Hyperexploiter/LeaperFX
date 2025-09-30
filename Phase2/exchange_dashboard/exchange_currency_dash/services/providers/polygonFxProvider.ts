/**
 * Polygon FX Provider (modular adapter)
 * Shipping velocity note: used under static hosting; move to backend when available.
 */

export async function getFxRate(pair: string, apiKey?: string, apiBase?: string): Promise<number | null> {
  try {
    if (!apiKey) return null;
    const [base, quote] = pair.split('/');
    const ticker = `C:${base}${quote}`;
    const baseUrl = (apiBase || 'https://api.polygon.io').replace(/\/$/, '');
    const url = `${baseUrl}/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev?adjusted=true&apiKey=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: any = await res.json();
    const result = Array.isArray(json?.results) ? json.results[0] : null;
    const value = result?.c ?? result?.close ?? result?.p ?? null;
    return typeof value === 'number' && isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export default {
  getFxRate,
};

