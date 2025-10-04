/**
 * Configuration Get API Endpoint
 * Retrieve configuration values for the LeaperFX Dashboard
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, ConfigurationValue } from '../../../types/api';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { database } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ConfigurationValue | ConfigurationValue[]>>
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
    const canProceed = await rateLimiter.applyRateLimit(req, res, 'config');
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
    const { key, category, keys } = security.sanitizeInput(req.query);

    // Handle multiple key requests
    if (keys) {
      const keyList = Array.isArray(keys) ? keys : keys.split(',');
      const configurations: ConfigurationValue[] = [];

      for (const configKey of keyList) {
        const config = await database.getConfiguration(configKey);
        if (config) {
          configurations.push(config);
        }
      }

      res.status(200).json({
        success: true,
        data: configurations,
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Handle single key request
    if (key) {
      const config = await database.getConfiguration(key);

      if (!config) {
        res.status(404).json({
          success: false,
          error: `Configuration not found: ${key}`,
          timestamp: Date.now(),
          requestId: securityContext.requestId,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: config,
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Handle category request or get all
    let configurations = await database.getAllConfigurations();

    if (category) {
      configurations = configurations.filter(config => config.category === category);
    }

    // Sort by category and key for consistent ordering
    configurations.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.key.localeCompare(b.key);
    });

    res.status(200).json({
      success: true,
      data: configurations,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });

  } catch (error) {
    console.error('[Config] Get error:', error);

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