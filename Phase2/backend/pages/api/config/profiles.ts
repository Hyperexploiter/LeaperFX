/**
 * Configuration Profiles API Endpoint
 * Manage configuration profiles for the LeaperFX Dashboard
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse, ConfigurationProfile, ValidationError } from '../../../types/api';
import { security } from '../../../lib/security';
import { rateLimiter } from '../../../lib/rate-limiter';
import { database } from '../../../lib/database';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ConfigurationProfile | ConfigurationProfile[]>>
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

    switch (req.method) {
      case 'GET':
        await handleGetProfiles(req, res, securityContext);
        break;
      case 'POST':
        await handleCreateProfile(req, res, securityContext);
        break;
      case 'PUT':
        await handleUpdateProfile(req, res, securityContext);
        break;
      case 'DELETE':
        await handleDeleteProfile(req, res, securityContext);
        break;
      default:
        res.status(405).json({
          success: false,
          error: 'Method not allowed',
          timestamp: Date.now(),
          requestId: securityContext.requestId,
        });
    }

  } catch (error) {
    console.error('[Config Profiles] API error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}

async function handleGetProfiles(
  req: NextApiRequest,
  res: NextApiResponse,
  securityContext: any
): Promise<void> {
  const { id } = security.sanitizeInput(req.query);

  if (id) {
    // Get specific profile
    const profile = await database.getProfile(id);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: `Profile not found: ${id}`,
        timestamp: Date.now(),
        requestId: securityContext.requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  } else {
    // Get all profiles
    const profiles = await database.getAllProfiles();

    // Sort by name for consistent ordering
    profiles.sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      data: profiles,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
  }
}

async function handleCreateProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  securityContext: any
): Promise<void> {
  const sanitizedBody = security.sanitizeInput(req.body);
  const validationErrors = validateProfileData(sanitizedBody);

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

  const now = Date.now();
  const profile: ConfigurationProfile = {
    id: uuidv4(),
    name: sanitizedBody.name,
    description: sanitizedBody.description,
    values: sanitizedBody.values || {},
    isActive: sanitizedBody.isActive || false,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  // If setting as active, deactivate others
  if (profile.isActive) {
    await deactivateAllProfiles();
  }

  const success = await database.setProfile(profile);

  if (!success) {
    res.status(500).json({
      success: false,
      error: 'Failed to create profile',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: profile,
    timestamp: Date.now(),
    requestId: securityContext.requestId,
  });
}

async function handleUpdateProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  securityContext: any
): Promise<void> {
  const { id } = security.sanitizeInput(req.query);

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Profile ID is required',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
    return;
  }

  const existing = await database.getProfile(id);

  if (!existing) {
    res.status(404).json({
      success: false,
      error: `Profile not found: ${id}`,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
    return;
  }

  const sanitizedBody = security.sanitizeInput(req.body);
  const validationErrors = validateProfileData(sanitizedBody, true);

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

  const updatedProfile: ConfigurationProfile = {
    ...existing,
    name: sanitizedBody.name !== undefined ? sanitizedBody.name : existing.name,
    description: sanitizedBody.description !== undefined ? sanitizedBody.description : existing.description,
    values: sanitizedBody.values !== undefined ? sanitizedBody.values : existing.values,
    isActive: sanitizedBody.isActive !== undefined ? sanitizedBody.isActive : existing.isActive,
    updatedAt: Date.now(),
    version: existing.version + 1,
  };

  // If setting as active, deactivate others
  if (updatedProfile.isActive && !existing.isActive) {
    await deactivateAllProfiles();
  }

  const success = await database.setProfile(updatedProfile);

  if (!success) {
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: updatedProfile,
    timestamp: Date.now(),
    requestId: securityContext.requestId,
  });
}

async function handleDeleteProfile(
  req: NextApiRequest,
  res: NextApiResponse,
  securityContext: any
): Promise<void> {
  const { id } = security.sanitizeInput(req.query);

  if (!id) {
    res.status(400).json({
      success: false,
      error: 'Profile ID is required',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
    return;
  }

  const existing = await database.getProfile(id);

  if (!existing) {
    res.status(404).json({
      success: false,
      error: `Profile not found: ${id}`,
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
    return;
  }

  const success = await database.delete(`profile:${id}`);

  if (!success) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete profile',
      timestamp: Date.now(),
      requestId: securityContext.requestId,
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: null,
    timestamp: Date.now(),
    requestId: securityContext.requestId,
  });
}

function validateProfileData(data: any, isUpdate = false): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Request body must be an object',
      value: data
    });
    return errors;
  }

  // Name is required for creation, optional for updates
  if (!isUpdate && (!data.name || typeof data.name !== 'string')) {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a string',
      value: data.name
    });
  } else if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push({
        field: 'name',
        message: 'Name must be a string',
        value: data.name
      });
    } else if (data.name.length < 1 || data.name.length > 100) {
      errors.push({
        field: 'name',
        message: 'Name must be between 1 and 100 characters',
        value: data.name
      });
    }
  }

  // Description is optional but must be string if provided
  if (data.description !== undefined && typeof data.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description must be a string',
      value: data.description
    });
  }

  // Values must be an object if provided
  if (data.values !== undefined && (typeof data.values !== 'object' || Array.isArray(data.values))) {
    errors.push({
      field: 'values',
      message: 'Values must be an object',
      value: data.values
    });
  }

  // isActive must be boolean if provided
  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.push({
      field: 'isActive',
      message: 'isActive must be a boolean',
      value: data.isActive
    });
  }

  return errors;
}

async function deactivateAllProfiles(): Promise<void> {
  try {
    const profiles = await database.getAllProfiles();

    for (const profile of profiles) {
      if (profile.isActive) {
        profile.isActive = false;
        profile.updatedAt = Date.now();
        profile.version += 1;
        await database.setProfile(profile);
      }
    }
  } catch (error) {
    console.error('[Config Profiles] Error deactivating profiles:', error);
  }
}

export const config = {
  api: {
    responseLimit: '8mb',
  },
};