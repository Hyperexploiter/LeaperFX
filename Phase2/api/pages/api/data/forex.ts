/**
 * Forex Data API Proxy
 * Secure proxy for Polygon and other forex data providers
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, ForexRate } from '../../../types/api';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { apiKeys } from '../../../lib/api-keys';
import { database } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ForexRate[]>>
) {
  const securityContext = security.createSecurityContext(req);

  // Set security headers
  security.setSecurityHeaders(res);

  // Set CORS headers
  const corsHeaders = security.getCorsHeaders(req.headers.origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
    return;
  }

  try {
    // Apply rate limiting
    const canProceed = await rateLimiter.applyRateLimit(req, res, 'data');
    if (!canProceed) return;

    // Validate API access
    if (!security.validateApiKey(req)) {
      res.status(401).json({
        success: false,
        error: 'Invalid or missing API key',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Sanitize and validate input
    const { pairs, provider = 'polygon' } = security.sanitizeInput(req.query);

    if (!pairs) {
      res.status(400).json({
        success: false,
        error: 'Currency pairs parameter is required',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    const pairList = Array.isArray(pairs) ? pairs : pairs.split(',');
    const validPairs = pairList.filter((pair: string) => /^[A-Z]{3}\/[A-Z]{3}$/.test(pair));

    if (validPairs.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid currency pairs provided (format: USD/CAD)',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Check cache first
    const cacheKey = `forex:${provider}:${validPairs.join(',')}`;
    const cached = await database.get(cacheKey);

    if (cached) {
      res.status(200).json({
        success: true,
        data: cached,
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Fetch from provider
    const rates: ForexRate[] = [];

    switch (provider) {
      case 'polygon':
        const polygonRates = await fetchPolygonRates(validPairs);
        rates.push(...polygonRates);
        break;

      default:
        res.status(400).json({
          success: false,
          error: `Unsupported provider: ${provider}`,
          timestamp: Date.now(),
          requestId: securityContext.requestId,
        });
        return;
    }

    // Cache results for 30 seconds
    await database.setex(cacheKey, 30, rates);

    // Record API key usage
    apiKeys.recordUsage(provider);

    res.status(200).json({
      success: true,
      data: rates,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });

  } catch (error) {
    console.error('[Forex] API error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}

async function fetchPolygonRates(pairs: string[]): Promise<ForexRate[]> {
  const apiKey = apiKeys.getApiKey('polygon');

  if (!apiKey) {
    throw new Error('Polygon API key not configured');
  }

  const rates: ForexRate[] = [];

  for (const pair of pairs) {
    try {
      const [base, quote] = pair.split('/');
      const ticker = `C:${base}${quote}`;

      const url = apiKeys.buildUrlWithKey('polygon',
        `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev`,
        { adjusted: 'true' }
      );

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'LeaperFX/1.0',
        },
      });

      if (!response.ok) {
        console.warn(`[Forex] Polygon API error for ${pair}:`, response.status);
        continue;
      }

      const data = await response.json();
      const result = Array.isArray(data?.results) ? data.results[0] : null;

      if (result) {
        rates.push({
          pair,
          rate: result.c || result.close || result.p,
          timestamp: Date.now(),
          source: 'polygon',
          bid: result.l || result.low,
          ask: result.h || result.high,
        });
      }
    } catch (error) {
      console.error(`[Forex] Error fetching ${pair} from Polygon:`, error);
    }
  }

  return rates;
}

// Real-time WebSocket support (for future implementation)
export const config = {
  api: {
    responseLimit: '8mb',
  },
};