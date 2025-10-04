/**
 * Get Exchange Rates API Endpoint
 * Retrieve current exchange rates for store operations
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '../../../types/api';
import { ExchangeRate } from '../../../types/rates';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { rateEngine } from '../../../lib/rate-engine';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ExchangeRate | ExchangeRate[]>>
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
    const canProceed = await rateLimiter.applyRateLimit(req, res, 'rates');
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
    const { pair, storeId, all } = security.sanitizeInput(req.query);

    // Ensure rate engine is running
    if (!rateEngine.getStatus().isRunning) {
      await rateEngine.start();
    }

    // Handle single pair request
    if (pair) {
      const rate = rateEngine.getRate(pair);

      if (!rate) {
        res.status(404).json({
          success: false,
          error: `Exchange rate not found for ${pair}`,
          timestamp: Date.now(),
          requestId: securityContext.requestId,
        });
        return;
      }

      // Filter by store if specified
      if (storeId && rate.storeId && rate.storeId !== storeId) {
        res.status(404).json({
          success: false,
          error: `Exchange rate not found for store ${storeId}`,
          timestamp: Date.now(),
          requestId: securityContext.requestId,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: rate,
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Handle all rates request
    let rates = rateEngine.getAllRates();

    // Filter by store if specified
    if (storeId) {
      rates = rates.filter(rate => !rate.storeId || rate.storeId === storeId);
    }

    // Filter only active rates
    rates = rates.filter(rate => rate.isActive);

    // Sort by currency pair for consistent ordering
    rates.sort((a, b) => {
      const pairA = `${a.baseCurrency}${a.targetCurrency}`;
      const pairB = `${b.baseCurrency}${b.targetCurrency}`;
      return pairA.localeCompare(pairB);
    });

    res.status(200).json({
      success: true,
      data: rates,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });

  } catch (error) {
    console.error('[Rates] Get error:', error);

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