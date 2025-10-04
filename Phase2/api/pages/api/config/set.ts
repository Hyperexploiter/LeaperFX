/**
 * Configuration Set API Endpoint
 * Update configuration values for the LeaperFX Dashboard
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, ConfigurationValue, ConfigurationUpdate, ValidationError } from '../../../types/api';
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

  // Only allow POST and PUT requests
  if (!['POST', 'PUT'].includes(req.method || '')) {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
    return;
  }

  try {
    // Apply rate limiting (more restrictive for config updates)
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

    // Sanitize input
    const sanitizedBody = security.sanitizeInput(req.body);

    // Handle batch updates
    if (Array.isArray(sanitizedBody)) {
      const results: ConfigurationValue[] = [];
      const errors: ValidationError[] = [];

      for (const update of sanitizedBody) {
        const validationErrors = validateConfigurationUpdate(update);

        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          continue;
        }

        try {
          const config = await updateConfiguration(update);
          results.push(config);
        } catch (error) {
          errors.push({
            field: update.key,
            message: error instanceof Error ? error.message : 'Update failed',
            value: update.value
          });
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation errors occurred',
          details: errors,
          timestamp: Date.now(),
          requestId: securityContext.requestId,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: results,
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    // Handle single update
    const validationErrors = validateConfigurationUpdate(sanitizedBody);

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

    const config = await updateConfiguration(sanitizedBody);

    res.status(200).json({
      success: true,
      data: config,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });

  } catch (error) {
    console.error('[Config] Set error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}

function validateConfigurationUpdate(update: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!update || typeof update !== 'object') {
    errors.push({
      field: 'root',
      message: 'Request body must be an object',
      value: update
    });
    return errors;
  }

  if (!update.key || typeof update.key !== 'string') {
    errors.push({
      field: 'key',
      message: 'Key is required and must be a string',
      value: update.key
    });
  }

  if (update.value === undefined || update.value === null) {
    errors.push({
      field: 'value',
      message: 'Value is required',
      value: update.value
    });
  }

  // Validate key format
  if (update.key && !/^[a-zA-Z0-9._-]+$/.test(update.key)) {
    errors.push({
      field: 'key',
      message: 'Key can only contain letters, numbers, dots, underscores, and hyphens',
      value: update.key
    });
  }

  // Validate category if provided
  if (update.category && typeof update.category !== 'string') {
    errors.push({
      field: 'category',
      message: 'Category must be a string',
      value: update.category
    });
  }

  // Validate description if provided
  if (update.description && typeof update.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description must be a string',
      value: update.description
    });
  }

  return errors;
}

async function updateConfiguration(update: ConfigurationUpdate): Promise<ConfigurationValue> {
  const now = Date.now();

  // Get existing configuration if it exists
  const existing = await database.getConfiguration(update.key);

  const configValue: ConfigurationValue = {
    key: update.key,
    value: update.value,
    type: getValueType(update.value),
    category: update.category || existing?.category || 'general',
    description: update.description || existing?.description,
    lastModified: now,
    version: (existing?.version || 0) + 1,
  };

  // Validate value based on type
  validateConfigurationValue(configValue);

  const success = await database.setConfiguration(configValue);

  if (!success) {
    throw new Error('Failed to save configuration');
  }

  return configValue;
}

function getValueType(value: any): 'string' | 'number' | 'boolean' | 'object' | 'array' {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'object';

  const type = typeof value;
  return type as 'string' | 'number' | 'boolean' | 'object';
}

function validateConfigurationValue(config: ConfigurationValue): void {
  // Add business logic validation here

  switch (config.category) {
    case 'timing':
      validateTimingConfig(config);
      break;
    case 'display':
      validateDisplayConfig(config);
      break;
    case 'colors':
      validateColorConfig(config);
      break;
    case 'performance':
      validatePerformanceConfig(config);
      break;
    case 'providers':
      validateProviderConfig(config);
      break;
  }
}

function validateTimingConfig(config: ConfigurationValue): void {
  if (config.key.includes('interval') && typeof config.value === 'number') {
    if (config.value < 100 || config.value > 60000) {
      throw new Error('Timing intervals must be between 100ms and 60000ms');
    }
  }
}

function validateDisplayConfig(config: ConfigurationValue): void {
  if (config.key.includes('size') && typeof config.value === 'number') {
    if (config.value < 1 || config.value > 100) {
      throw new Error('Display sizes must be between 1 and 100');
    }
  }
}

function validateColorConfig(config: ConfigurationValue): void {
  if (config.key.includes('color') && typeof config.value === 'string') {
    if (!/^#[0-9A-Fa-f]{6}$/.test(config.value)) {
      throw new Error('Colors must be valid hex codes (e.g., #FF0000)');
    }
  }
}

function validatePerformanceConfig(config: ConfigurationValue): void {
  if (config.key.includes('fps') && typeof config.value === 'number') {
    if (config.value < 1 || config.value > 144) {
      throw new Error('FPS must be between 1 and 144');
    }
  }
}

function validateProviderConfig(config: ConfigurationValue): void {
  if (config.key.includes('provider') && typeof config.value === 'string') {
    const validProviders = ['polygon', 'twelvedata', 'coinbase', 'boc'];
    if (!validProviders.includes(config.value)) {
      throw new Error(`Provider must be one of: ${validProviders.join(', ')}`);
    }
  }
}

export const config = {
  api: {
    responseLimit: '8mb',
  },
};