/**
 * TwelveData Provider (commodities adapter)
 * Shipping velocity note: used under static hosting; move to backend when available.
 */

export async function getCommodityUSD(symbol: string, apiKey?: string, apiBase?: string): Promise<number | null> {
  try {
    if (!apiKey) return null;
    const baseUrl = (apiBase || 'https://api.twelvedata.com').replace(/\/$/, '');
    // Try /price first
    const priceUrl = `${baseUrl}/price?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    let res = await fetch(priceUrl);
    if (res.ok) {
      const json = await res.json();
      const price = parseFloat(json?.price ?? json?.data?.price ?? '');
      if (Number.isFinite(price) && price > 0) return price;
    }
    // Fallback: /time_series last close
    const tsUrl = `${baseUrl}/time_series?symbol=${encodeURIComponent(symbol)}&interval=1min&outputsize=1&apikey=${apiKey}`;
    res = await fetch(tsUrl);
    if (res.ok) {
      const ts = await res.json();
      const close = parseFloat(ts?.values?.[0]?.close ?? ts?.data?.[0]?.close ?? '');
      if (Number.isFinite(close) && close > 0) return close;
    }
    return null;
  } catch {
    return null;
  }
}

export default {
  getCommodityUSD,
};

