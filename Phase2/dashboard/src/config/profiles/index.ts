/**
 * Configuration Profiles Index
 * Exports all environment-specific configurations
 */

export { PRODUCTION_CONFIG, PRODUCTION_CONSTANTS, PRODUCTION_VALIDATION } from './production';
export { DEVELOPMENT_CONFIG, DEVELOPMENT_CONSTANTS, DEV_DEBUG_CONFIG, DEV_HOT_RELOAD } from './development';
export { DEMO_CONFIG, DEMO_CONSTANTS, DEMO_PRESENTATION, DEMO_SIMULATION } from './demo';

import { DashboardConfig } from '../DashboardConfig';
import { PRODUCTION_CONFIG } from './production';
import { DEVELOPMENT_CONFIG } from './development';
import { DEMO_CONFIG } from './demo';

/**
 * Environment type definitions
 */
export type Environment = 'production' | 'development' | 'demo';

/**
 * Profile registry for runtime environment detection
 */
export const PROFILE_REGISTRY: Record<Environment, Partial<DashboardConfig>> = {
  production: PRODUCTION_CONFIG,
  development: DEVELOPMENT_CONFIG,
  demo: DEMO_CONFIG,
} as const;

/**
 * Detect current environment from various sources
 */
export function detectEnvironment(): Environment {
  // Check Vite environment variable first
  if (typeof import.meta !== 'undefined') {
    const viteEnv = (import.meta as any).env?.VITE_ENVIRONMENT;
    if (viteEnv && viteEnv in PROFILE_REGISTRY) {
      return viteEnv as Environment;
    }
  }

  // Check window environment (for runtime injection)
  if (typeof window !== 'undefined') {
    const windowEnv = (window as any).__ENV__?.ENVIRONMENT;
    if (windowEnv && windowEnv in PROFILE_REGISTRY) {
      return windowEnv as Environment;
    }
  }

  // Check Node.js environment
  if (typeof process !== 'undefined') {
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'development') return 'development';

    // Check for demo flag
    if (process.env.DEMO_MODE === 'true') return 'demo';
  }

  // Check hostname for environment detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('demo') || hostname.includes('showcase')) return 'demo';
    if (hostname.includes('localhost') || hostname.includes('dev')) return 'development';
  }

  // Default to development for safety
  return 'development';
}

/**
 * Get configuration profile for environment
 */
export function getProfile(env?: Environment): Partial<DashboardConfig> {
  const environment = env || detectEnvironment();
  return PROFILE_REGISTRY[environment];
}

/**
 * Environment-specific feature availability
 */
export const ENVIRONMENT_FEATURES = {
  production: {
    debugMode: false,
    experimentalFeatures: false,
    performanceMonitoring: true,
    errorReporting: true,
    analytics: true,
  },
  development: {
    debugMode: true,
    experimentalFeatures: true,
    performanceMonitoring: true,
    errorReporting: false,
    analytics: false,
    hotReload: true,
    mockData: true,
  },
  demo: {
    debugMode: false,
    experimentalFeatures: false,
    performanceMonitoring: false,
    errorReporting: false,
    analytics: false,
    presentationMode: true,
    enhancedVisuals: true,
  },
} as const;

/**
 * Get features available for environment
 */
export function getEnvironmentFeatures(env?: Environment) {
  const environment = env || detectEnvironment();
  return ENVIRONMENT_FEATURES[environment];
}

export default PROFILE_REGISTRY;