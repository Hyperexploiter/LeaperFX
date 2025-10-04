/**
 * Set Exchange Rates API Endpoint
 * Allow store owners to set custom exchange rates
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '../../../types/api';
import { ExchangeRate, RateUpdateRequest } from '../../../types/rates';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { rateEngine } from '../../../lib/rate-engine';
import { webSocketHub } from '../../../lib/websocket-hub';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ExchangeRate>>
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

  // Only allow POST and PUT requests
  if (req.method !== 'POST' && req.method !== 'PUT') {
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

    // Validate request body
    const validationErrors = security.validateRequest(req, {
      currencyPair: { required: true, type: 'string', pattern: /^[A-Z]{3}[\/]?[A-Z]{3}$/ },
      spread: { type: 'number', min: 0.001, max: 0.2 },
      buyRate: { type: 'number', min: 0 },
      sellRate: { type: 'number', min: 0 },
      source: { required: true, type: 'string', enum: ['manual', 'calculated'] },
      storeId: { type: 'string', minLength: 1 }
    });

    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Sanitize input
    const updateRequest: RateUpdateRequest = security.sanitizeInput({
      currencyPair: req.body.currencyPair,
      spread: req.body.spread ? parseFloat(req.body.spread) : undefined,
      buyRate: req.body.buyRate ? parseFloat(req.body.buyRate) : undefined,
      sellRate: req.body.sellRate ? parseFloat(req.body.sellRate) : undefined,
      source: req.body.source,
      storeId: req.body.storeId,
    });

    // Ensure rate engine is running
    if (!rateEngine.getStatus().isRunning) {
      await rateEngine.start();
    }

    // Validate rate logic
    if (updateRequest.buyRate && updateRequest.sellRate) {
      if (updateRequest.buyRate <= updateRequest.sellRate) {
        res.status(400).json({
          success: false,
          error: 'Buy rate must be higher than sell rate',
          timestamp: Date.now(),
          requestId: securityContext.requestId,
        });
        return;
      }

      // Calculate spread from rates
      const avgRate = (updateRequest.buyRate + updateRequest.sellRate) / 2;
      const calculatedSpread = (updateRequest.buyRate - updateRequest.sellRate) / avgRate;

      if (!updateRequest.spread) {
        updateRequest.spread = calculatedSpread;
      } else {
        // Validate spread consistency
        const spreadDifference = Math.abs(calculatedSpread - updateRequest.spread);
        if (spreadDifference > 0.001) { // Allow 0.1% tolerance
          res.status(400).json({
            success: false,
            error: 'Spread is inconsistent with buy/sell rates',
            details: {
              providedSpread: updateRequest.spread,
              calculatedSpread,
              difference: spreadDifference
            },
            timestamp: Date.now(),
            requestId: securityContext.requestId,
          });
          return;
        }
      }
    }

    // Update the rate
    try {
      const updatedRate = await rateEngine.updateRateManually(updateRequest);

      // Broadcast rate update via WebSocket
      if (webSocketHub.isRunning()) {
        webSocketHub.broadcastRateUpdate([updatedRate]);
      }

      // Log the rate update
      console.log(`[Rates] Rate updated by ${updateRequest.storeId || 'system'}: ${updateRequest.currencyPair} - Spread: ${(updatedRate.spread * 100).toFixed(2)}%`);

      res.status(200).json({
        success: true,
        data: updatedRate,
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });

    } catch (updateError) {
      console.error('[Rates] Update error:', updateError);

      res.status(400).json({
        success: false,
        error: updateError instanceof Error ? updateError.message : 'Failed to update rate',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
    }

  } catch (error) {
    console.error('[Rates] Set error:', error);

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