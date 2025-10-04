/**
 * Health Check API Endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, HealthStatus } from '../../types/api';
import { security } from '../../lib/security';
import { database } from '../../lib/database';
import { apiKeys } from '../../lib/api-keys';
import { rateLimiter } from '../../lib/rate-limiter';

const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<HealthStatus>>
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
    // Apply rate limiting (generous for health checks)
    const canProceed = await rateLimiter.applyRateLimit(req, res, 'health');
    if (!canProceed) return;

    const checkStart = Date.now();

    // Check database health
    const dbHealth = await database.healthCheck();

    // Check API keys
    const apiKeyInfo = apiKeys.getAllApiKeyInfo();
    const activeKeys = apiKeyInfo.filter(key => key.status === 'active').length;
    const totalKeys = apiKeyInfo.length;

    // System metrics
    const memoryUsage = process.memoryUsage();
    const uptime = Date.now() - startTime;
    const responseTime = Date.now() - checkStart;

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (dbHealth.status === 'unhealthy' || activeKeys === 0) {
      overallStatus = 'unhealthy';
    } else if (dbHealth.status === 'degraded' || activeKeys < totalKeys / 2) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: Date.now(),
      services: {
        database: dbHealth.status === 'healthy' ? 'up' :
                 dbHealth.status === 'degraded' ? 'degraded' : 'down',
        providers: apiKeyInfo.reduce((acc, key) => {
          acc[key.provider] = key.status === 'active' ? 'up' : 'down';
          return acc;
        }, {} as Record<string, 'up' | 'down' | 'degraded'>),
        cache: dbHealth.details.memory ? 'up' : 'down',
        rateLimit: 'up', // Rate limiter is always up if we reach this point
      },
      performance: {
        responseTimeMs: responseTime,
        memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        cpuUsagePercent: undefined, // Would need additional monitoring for CPU
      },
      version: '1.0.0',
      uptime,
    };

    res.status(200).json({
      success: true,
      data: healthStatus,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });

  } catch (error) {
    console.error('[Health] Error during health check:', error);

    const healthStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: Date.now(),
      services: {
        database: 'down',
        providers: {},
        cache: 'down',
        rateLimit: 'down',
      },
      performance: {
        responseTimeMs: Date.now() - Date.now(),
        memoryUsageMB: 0,
      },
      version: '1.0.0',
      uptime: Date.now() - startTime,
    };

    res.status(503).json({
      success: false,
      error: 'Health check failed',
      data: healthStatus,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}