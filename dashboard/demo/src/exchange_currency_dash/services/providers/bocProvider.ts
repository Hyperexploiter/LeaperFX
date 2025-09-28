/**
 * Bank of Canada Valet Provider (yields)
 * During dev: set VITE_BOC_URL to /api/boc to use Vite proxy.
 */

export async function getLatestYield(series: string, apiBase?: string): Promise<number | null> {
  const baseUrl = (apiBase || 'https://www.bankofcanada.ca/valet').replace(/\/$/, '');
  // Try series endpoint
  const tryUrls = [
    `${baseUrl}/observations/${series}.json?recent=1`,
    `${baseUrl}/observations/group/bond_yields/json?recent=1`,
  ];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const json = await res.json();
      if (url.includes('/group/')) {
        const observations = Array.isArray(json?.observations) ? json.observations : [];
        const latest = observations.length > 0 ? observations[observations.length - 1] : null;
        if (!latest) continue;
        // Try common keys in preference order
        const keys = [series, 'CGB.30Y', 'CGB_YR_30', 'long', '30'];
        for (const k of keys) {
          const entry: any = latest[k];
          const v = parseFloat(entry?.v ?? entry);
          if (Number.isFinite(v)) return v;
        }
      } else {
        const observations = Array.isArray(json?.observations) ? json.observations : [];
        const latest = observations.length > 0 ? observations[observations.length - 1] : null;
        const entry: any = latest ? latest[series] : undefined;
        const v = parseFloat(entry?.v ?? entry);
        if (Number.isFinite(v)) return v;
      }
    } catch {
      // continue to next url
    }
  }
  return null;
}

export default {
  getLatestYield,
};

