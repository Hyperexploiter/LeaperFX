/**
 * Crypto Data API Proxy
 * Secure proxy for Coinbase and other crypto data providers
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, CryptoPrice } from '../../../types/api';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { apiKeys } from '../../../lib/api-keys';
import { database } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<CryptoPrice[]>>
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
    const { symbols, provider = 'coinbase', base = 'USD' } = security.sanitizeInput(req.query);

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
    const validSymbols = symbolList.filter((symbol: string) => /^[A-Z0-9]+$/.test(symbol));

    if (validSymbols.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid crypto symbols provided',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Check cache first
    const cacheKey = `crypto:${provider}:${base}:${validSymbols.join(',')}`;
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
    const prices: CryptoPrice[] = [];

    switch (provider) {
      case 'coinbase':
        const coinbasePrices = await fetchCoinbasePrices(validSymbols, base);
        prices.push(...coinbasePrices);
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

    // Cache results for 15 seconds (crypto is fast-moving)
    await database.setex(cacheKey, 15, prices);

    // Record API key usage
    apiKeys.recordUsage(provider);

    res.status(200).json({
      success: true,
      data: prices,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });

  } catch (error) {
    console.error('[Crypto] API error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}

async function fetchCoinbasePrices(symbols: string[], base: string): Promise<CryptoPrice[]> {
  const prices: CryptoPrice[] = [];

  for (const symbol of symbols) {
    try {
      const productId = `${symbol}-${base}`;

      // Get current ticker
      const tickerResponse = await fetch(
        `https://api.exchange.coinbase.com/products/${productId}/ticker`,
        {
          headers: {
            'User-Agent': 'LeaperFX/1.0',
          },
        }
      );

      if (!tickerResponse.ok) {
        console.warn(`[Crypto] Coinbase ticker error for ${symbol}:`, tickerResponse.status);
        continue;
      }

      const ticker = await tickerResponse.json();

      // Get 24h stats
      const statsResponse = await fetch(
        `https://api.exchange.coinbase.com/products/${productId}/stats`,
        {
          headers: {
            'User-Agent': 'LeaperFX/1.0',
          },
        }
      );

      let stats = null;
      if (statsResponse.ok) {
        stats = await statsResponse.json();
      }

      const currentPrice = parseFloat(ticker.price);
      const open24h = stats ? parseFloat(stats.open) : currentPrice;
      const volume24h = stats ? parseFloat(stats.volume) : 0;

      prices.push({
        symbol,
        price: currentPrice,
        timestamp: Date.now(),
        volume24h,
        change24h: currentPrice - open24h,
        changePercent24h: open24h !== 0 ? ((currentPrice - open24h) / open24h) * 100 : 0,
        source: 'coinbase',
      });

    } catch (error) {
      console.error(`[Crypto] Error fetching ${symbol} from Coinbase:`, error);
    }
  }

  return prices;
}

// WebSocket endpoint for real-time crypto data
export async function handleWebSocket(req: NextApiRequest, res: NextApiResponse) {
  // This would be implemented with a WebSocket library
  // For now, return method not allowed
  res.status(405).json({
    success: false,
    error: 'WebSocket not implemented yet',
    timestamp: Date.now(),
    requestId: security.generateRequestId(),
  });
}

export const config = {
  api: {
    responseLimit: '8mb',
  },
};