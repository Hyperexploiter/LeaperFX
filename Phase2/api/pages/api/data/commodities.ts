/**
 * Commodities Data API Proxy
 * Secure proxy for TwelveData and other commodities data providers
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, CommodityPrice } from '../../../types/api';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { apiKeys } from '../../../lib/api-keys';
import { database } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<CommodityPrice[]>>
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
    const { symbols, provider = 'twelvedata' } = security.sanitizeInput(req.query);

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
    const validSymbols = symbolList.filter((symbol: string) => /^[A-Z0-9.]+$/.test(symbol));

    if (validSymbols.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid commodity symbols provided',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Check cache first
    const cacheKey = `commodities:${provider}:${validSymbols.join(',')}`;
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
    const prices: CommodityPrice[] = [];

    switch (provider) {
      case 'twelvedata':
        const twelveDataPrices = await fetchTwelveDataPrices(validSymbols);
        prices.push(...twelveDataPrices);
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

    // Cache results for 60 seconds (commodities don't change as frequently)
    await database.setex(cacheKey, 60, prices);

    // Record API key usage
    apiKeys.recordUsage(provider);

    res.status(200).json({
      success: true,
      data: prices,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });

  } catch (error) {
    console.error('[Commodities] API error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}

async function fetchTwelveDataPrices(symbols: string[]): Promise<CommodityPrice[]> {
  const apiKey = apiKeys.getApiKey('twelvedata');

  if (!apiKey) {
    throw new Error('TwelveData API key not configured');
  }

  const prices: CommodityPrice[] = [];

  for (const symbol of symbols) {
    try {
      // Get current price
      const priceUrl = apiKeys.buildUrlWithKey('twelvedata',
        `https://api.twelvedata.com/price`,
        { symbol }
      );

      const priceResponse = await fetch(priceUrl, {
        headers: {
          'User-Agent': 'LeaperFX/1.0',
        },
      });

      if (!priceResponse.ok) {
        console.warn(`[Commodities] TwelveData price error for ${symbol}:`, priceResponse.status);
        continue;
      }

      const priceData = await priceResponse.json();

      if (priceData.price) {
        // Get previous day's price for change calculation
        const timeSeriesUrl = apiKeys.buildUrlWithKey('twelvedata',
          `https://api.twelvedata.com/time_series`,
          {
            symbol,
            interval: '1day',
            outputsize: '2'
          }
        );

        let previousPrice = null;
        try {
          const timeSeriesResponse = await fetch(timeSeriesUrl, {
            headers: {
              'User-Agent': 'LeaperFX/1.0',
            },
          });

          if (timeSeriesResponse.ok) {
            const timeSeriesData = await timeSeriesResponse.json();
            const values = timeSeriesData.values;

            if (Array.isArray(values) && values.length > 1) {
              previousPrice = parseFloat(values[1].close);
            }
          }
        } catch (error) {
          console.warn(`[Commodities] Error fetching time series for ${symbol}:`, error);
        }

        const currentPrice = parseFloat(priceData.price);
        const change24h = previousPrice ? currentPrice - previousPrice : 0;
        const changePercent24h = previousPrice && previousPrice !== 0
          ? ((currentPrice - previousPrice) / previousPrice) * 100
          : 0;

        prices.push({
          symbol,
          price: currentPrice,
          timestamp: Date.now(),
          unit: getCommodityUnit(symbol),
          change24h,
          changePercent24h,
          source: 'twelvedata',
        });
      }

    } catch (error) {
      console.error(`[Commodities] Error fetching ${symbol} from TwelveData:`, error);
    }
  }

  return prices;
}

function getCommodityUnit(symbol: string): string {
  const units: Record<string, string> = {
    'GOLD': 'USD/oz',
    'XAU': 'USD/oz',
    'SILVER': 'USD/oz',
    'XAG': 'USD/oz',
    'PLATINUM': 'USD/oz',
    'XPT': 'USD/oz',
    'PALLADIUM': 'USD/oz',
    'XPD': 'USD/oz',
    'COPPER': 'USD/lb',
    'WTI': 'USD/barrel',
    'BRENT': 'USD/barrel',
    'NATURAL_GAS': 'USD/MMBtu',
    'CORN': 'USD/bushel',
    'WHEAT': 'USD/bushel',
    'SOYBEANS': 'USD/bushel',
    'COFFEE': 'USD/lb',
    'SUGAR': 'USD/lb',
    'COTTON': 'USD/lb',
  };

  return units[symbol.toUpperCase()] || 'USD';
}

export const config = {
  api: {
    responseLimit: '8mb',
  },
};