/**
 * Market Rates API Endpoint
 * Retrieve real-time market rates from external providers
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '../../../types/api';
import { MarketRateData } from '../../../types/rates';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { dataAggregator } from '../../../lib/data-aggregator';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<MarketRateData[]>>
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
    const canProceed = await rateLimiter.applyRateLimit(req, res, 'market_data');
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
    const { symbols, type = 'forex', provider } = security.sanitizeInput(req.query);

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
    const validSymbols = symbolList.filter((symbol: string) => /^[A-Z0-9\/\-]+$/.test(symbol));

    if (validSymbols.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid symbols provided',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Validate data type
    const validTypes = ['forex', 'crypto', 'commodities', 'indices'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: `Invalid data type. Must be one of: ${validTypes.join(', ')}`,
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Start data aggregator if not running
    if (!dataAggregator.getStats().isRunning) {
      dataAggregator.start();
    }

    // Get market data based on type
    let marketData: MarketRateData[] = [];

    try {
      switch (type) {
        case 'forex':
          const forexRates = await dataAggregator.getForexRates(validSymbols);
          marketData = forexRates.map(rate => ({
            symbol: rate.pair,
            price: rate.rate,
            timestamp: rate.timestamp,
            bid: rate.bid,
            ask: rate.ask,
            source: rate.source,
          }));
          break;

        case 'crypto':
          const cryptoPrices = await dataAggregator.getCryptoPrices(validSymbols);
          marketData = cryptoPrices.map(crypto => ({
            symbol: crypto.symbol,
            price: crypto.price,
            timestamp: crypto.timestamp,
            volume: crypto.volume24h,
            change24h: crypto.change24h,
            changePercent24h: crypto.changePercent24h,
            source: crypto.source,
          }));
          break;

        case 'commodities':
        case 'indices':
          // For now, use forex endpoint for these
          const otherRates = await dataAggregator.getForexRates(validSymbols);
          marketData = otherRates.map(rate => ({
            symbol: rate.pair,
            price: rate.rate,
            timestamp: rate.timestamp,
            source: rate.source,
          }));
          break;

        default:
          throw new Error(`Unsupported data type: ${type}`);
      }

      // Filter by provider if specified
      if (provider) {
        marketData = marketData.filter(data => data.source === provider);
      }

      // Add metadata about data quality
      const aggregatorStats = dataAggregator.getStats();
      const providerStatus = dataAggregator.getProviderStatus();

      res.status(200).json({
        success: true,
        data: marketData,
        metadata: {
          dataType: type,
          symbolsRequested: validSymbols.length,
          symbolsReturned: marketData.length,
          completeness: (marketData.length / validSymbols.length) * 100,
          aggregatorStats,
          providerStatus: providerStatus.filter(p => p.isActive),
          lastUpdate: Math.max(...marketData.map(d => d.timestamp), 0),
        },
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });

    } catch (dataError) {
      console.error('[MarketRates] Data aggregation error:', dataError);

      res.status(503).json({
        success: false,
        error: 'Market data temporarily unavailable',
        details: dataError instanceof Error ? dataError.message : 'Unknown error',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
    }

  } catch (error) {
    console.error('[MarketRates] API error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}

export const config = {
  api: {
    responseLimit: '8mb',
  },
};