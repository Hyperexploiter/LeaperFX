/**
 * Minimal serverless proxy for Bank of Canada Valet API
 *
 * This example is provided to ship quickly on static hosting. In production,
 * move to your backend/API gateway and apply proper rate limiting and logging.
 *
 * Usage:
 *   GET /api/boc/observations/CGB.30Y.json?recent=1  ->  https://www.bankofcanada.ca/valet/observations/CGB.30Y.json?recent=1
 */

export default async function handler(req, res) {
  try {
    const upstreamBase = 'https://www.bankofcanada.ca/valet';
    const path = req.url.replace(/^\/api\/boc/, '');
    const url = `${upstreamBase}${path}`;

    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.setHeader('content-type', contentType);
    res.status(upstream.status);
    const body = await upstream.text();
    res.send(body);
  } catch (e) {
    res.status(502).json({ error: 'Upstream error', message: String(e?.message || e) });
  }
}

// Note: adapt the export signature to your platform:
// - Next.js (pages/api): export default function handler(req, res) { ... }
// - Netlify: export const handler = async (event, context) => { ... }
// - Cloudflare Workers: export default { fetch(request) { ... } }

