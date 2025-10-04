/**
 * Bond Yields Data API Proxy
 * Secure proxy for Bank of Canada and other yield data providers
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, YieldData } from '../../../types/api';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { apiKeys } from '../../../lib/api-keys';
import { database } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<YieldData[]>>
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
    const { instruments, provider = 'boc', country = 'CA' } = security.sanitizeInput(req.query);

    if (!instruments) {
      res.status(400).json({
        success: false,
        error: 'Instruments parameter is required',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    const instrumentList = Array.isArray(instruments) ? instruments : instruments.split(',');
    const validInstruments = instrumentList.filter(inst => /^[A-Z0-9_]+$/.test(inst));

    if (validInstruments.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid yield instruments provided',
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Check cache first
    const cacheKey = `yields:${provider}:${country}:${validInstruments.join(',')}`;
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
    const yields: YieldData[] = [];

    switch (provider) {
      case 'boc':
        const bocYields = await fetchBankOfCanadaYields(validInstruments);
        yields.push(...bocYields);
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

    // Cache results for 5 minutes (yields change infrequently)
    await database.setex(cacheKey, 300, yields);

    // Record API key usage
    apiKeys.recordUsage(provider);

    res.status(200).json({
      success: true,
      data: yields,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });

  } catch (error) {
    console.error('[Yields] API error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}

async function fetchBankOfCanadaYields(instruments: string[]): Promise<YieldData[]> {
  const yields: YieldData[] = [];

  try {
    // Bank of Canada Valet API
    const seriesIds = instruments.map(inst => getBOCSeriesId(inst)).filter(Boolean);

    if (seriesIds.length === 0) {
      return yields;
    }

    // Get recent observations (last 2 days to calculate change)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Look back 7 days to ensure we get data
    const endDate = new Date();

    const url = new URL('https://www.bankofcanada.ca/valet/observations');
    url.searchParams.set('series', seriesIds.join(','));
    url.searchParams.set('start_date', startDate.toISOString().split('T')[0]);
    url.searchParams.set('end_date', endDate.toISOString().split('T')[0]);
    url.searchParams.set('order_by', 'date:desc');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'LeaperFX/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[Yields] Bank of Canada API error:', response.status);
      return yields;
    }

    const data = await response.json();

    if (!data.observations || !Array.isArray(data.observations)) {
      return yields;
    }

    // Process each series
    for (const [index, instrument] of instruments.entries()) {
      const seriesId = seriesIds[index];
      if (!seriesId) continue;

      // Get observations for this series
      const observations = data.observations.filter((obs: any) => obs[seriesId]);

      if (observations.length === 0) continue;

      // Sort by date descending
      observations.sort((a: any, b: any) => new Date(b.d).getTime() - new Date(a.d).getTime());

      const latestObs = observations[0];
      const currentYield = parseFloat(latestObs[seriesId]);

      if (isNaN(currentYield)) continue;

      // Calculate change from previous observation
      let change = 0;
      if (observations.length > 1) {
        const previousObs = observations[1];
        const previousYield = parseFloat(previousObs[seriesId]);
        if (!isNaN(previousYield)) {
          change = currentYield - previousYield;
        }
      }

      yields.push({
        instrument,
        yield: currentYield,
        timestamp: new Date(latestObs.d).getTime(),
        maturity: getMaturityFromInstrument(instrument),
        change,
        source: 'boc',
      });
    }

  } catch (error) {
    console.error('[Yields] Error fetching from Bank of Canada:', error);
  }

  return yields;
}

function getBOCSeriesId(instrument: string): string | null {
  // Map common yield instruments to Bank of Canada series IDs
  const seriesMap: Record<string, string> = {
    'CA_2Y': 'V122484',   // 2-year Government of Canada bond yield
    'CA_5Y': 'V122487',   // 5-year Government of Canada bond yield
    'CA_10Y': 'V122487',  // 10-year Government of Canada bond yield
    'CA_30Y': 'V122487',  // 30-year Government of Canada bond yield
    'CA_OVERNIGHT': 'V39079', // Bank of Canada overnight rate
    'CA_PRIME': 'V176924',    // Canadian prime rate
    'CA_3M_TB': 'V122531',    // 3-month Treasury Bill
    'CA_6M_TB': 'V122532',    // 6-month Treasury Bill
    'CA_1Y_TB': 'V122533',    // 1-year Treasury Bill
  };

  return seriesMap[instrument.toUpperCase()] || null;
}

function getMaturityFromInstrument(instrument: string): string {
  const maturityMap: Record<string, string> = {
    'CA_2Y': '2Y',
    'CA_5Y': '5Y',
    'CA_10Y': '10Y',
    'CA_30Y': '30Y',
    'CA_OVERNIGHT': 'Overnight',
    'CA_PRIME': 'Prime',
    'CA_3M_TB': '3M',
    'CA_6M_TB': '6M',
    'CA_1Y_TB': '1Y',
  };

  return maturityMap[instrument.toUpperCase()] || 'Unknown';
}

// Real-time updates for yields (Bank of Canada updates once daily)
export function getYieldUpdateFrequency(): number {
  // Bank of Canada updates yields once per business day
  return 24 * 60 * 60 * 1000; // 24 hours in milliseconds
}

export const config = {
  api: {
    responseLimit: '8mb',
  },
};