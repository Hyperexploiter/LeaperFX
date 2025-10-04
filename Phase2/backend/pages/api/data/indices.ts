/**
 * Market Indices Data API Proxy
 * Secure proxy for Polygon and other indices data providers
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, IndexData } from '../../../types/api';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { apiKeys } from '../../../lib/api-keys';
import { database } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<IndexData[]>>
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
    const { symbols, provider = 'polygon' } = security.sanitizeInput(req.query);

    if (!symbols) {
      res.status(400).json({
        success: false,
        error: 'Symbols parameter is required',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    const symbolList = Array.isArray(symbols) ? symbols : symbols.split(',');
    const validSymbols = symbolList.filter(symbol => /^[A-Z0-9.^]+$/.test(symbol));

    if (validSymbols.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid index symbols provided',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Check cache first
    const cacheKey = `indices:${provider}:${validSymbols.join(',')}`;
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
    const indices: IndexData[] = [];

    switch (provider) {
      case 'polygon':
        const polygonIndices = await fetchPolygonIndices(validSymbols);
        indices.push(...polygonIndices);
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
    await database.setex(cacheKey, 30, indices);

    // Record API key usage
    apiKeys.recordUsage(provider);

    res.status(200).json({
      success: true,
      data: indices,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });

  } catch (error) {
    console.error('[Indices] API error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}

async function fetchPolygonIndices(symbols: string[]): Promise<IndexData[]> {
  const apiKey = apiKeys.getApiKey('polygon');

  if (!apiKey) {
    throw new Error('Polygon API key not configured');
  }

  const indices: IndexData[] = [];

  for (const symbol of symbols) {
    try {
      // Format symbol for Polygon (some indices use I: prefix)
      const ticker = symbol.startsWith('I:') ? symbol : `I:${symbol}`;

      // Get previous close data
      const prevCloseUrl = apiKeys.buildUrlWithKey('polygon',
        `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev`,
        { adjusted: 'true' }
      );

      const prevResponse = await fetch(prevCloseUrl, {
        headers: {
          'User-Agent': 'LeaperFX/1.0',
        },
      });

      if (!prevResponse.ok) {
        console.warn(`[Indices] Polygon prev close error for ${symbol}:`, prevResponse.status);
        continue;
      }

      const prevData = await prevResponse.json();
      const prevResult = Array.isArray(prevData?.results) ? prevData.results[0] : null;

      if (!prevResult) {
        continue;
      }

      // Get current snapshot
      const snapshotUrl = apiKeys.buildUrlWithKey('polygon',
        `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(ticker)}`
      );

      let currentValue = prevResult.c || prevResult.close;
      let currentTimestamp = Date.now();

      try {
        const snapshotResponse = await fetch(snapshotUrl, {
          headers: {
            'User-Agent': 'LeaperFX/1.0',
          },
        });

        if (snapshotResponse.ok) {
          const snapshotData = await snapshotResponse.json();
          const ticker_data = snapshotData?.results?.value || snapshotData?.results;

          if (ticker_data && ticker_data.lastQuote) {
            currentValue = ticker_data.lastQuote.price || currentValue;
            currentTimestamp = ticker_data.lastQuote.timeframe || currentTimestamp;
          } else if (ticker_data && ticker_data.lastTrade) {
            currentValue = ticker_data.lastTrade.price || currentValue;
            currentTimestamp = ticker_data.lastTrade.timestamp || currentTimestamp;
          }
        }
      } catch (error) {
        console.warn(`[Indices] Error fetching snapshot for ${symbol}:`, error);
      }

      const previousClose = prevResult.c || prevResult.close;
      const change = currentValue - previousClose;
      const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

      indices.push({
        symbol: symbol.replace('I:', ''), // Remove prefix for clean response
        value: currentValue,
        timestamp: currentTimestamp,
        change,
        changePercent,
        source: 'polygon',
      });

    } catch (error) {
      console.error(`[Indices] Error fetching ${symbol} from Polygon:`, error);
    }
  }

  return indices;
}

// Common market indices mapping
const COMMON_INDICES = {
  'SPX': 'S&P 500',
  'DJI': 'Dow Jones Industrial Average',
  'IXIC': 'NASDAQ Composite',
  'RUT': 'Russell 2000',
  'VIX': 'CBOE Volatility Index',
  'TSX': 'S&P/TSX Composite',
  'FTSE': 'FTSE 100',
  'DAX': 'DAX',
  'CAC': 'CAC 40',
  'NIKKEI': 'Nikkei 225',
  'HSI': 'Hang Seng Index',
};

export function getIndexName(symbol: string): string {
  return COMMON_INDICES[symbol.toUpperCase()] || symbol;
}

export const config = {
  api: {
    responseLimit: '8mb',
  },
};