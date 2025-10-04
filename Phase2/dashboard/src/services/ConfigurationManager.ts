/**
 * Configuration Manager - Singleton Pattern for Runtime Configuration
 * High-performance configuration system with zero-cost abstractions
 * Maintains <12ms frame budget with runtime updates and change events
 */

import { DashboardConfig, DEFAULT_CONFIG, ENV_MAPPING, PERFORMANCE_CONSTANTS } from '../config/DashboardConfig';
import { getProfile, detectEnvironment, Environment } from '../config/profiles';

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  readonly path: string;
  readonly oldValue: any;
  readonly newValue: any;
  readonly timestamp: number;
  readonly source: 'environment' | 'runtime' | 'profile';
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Performance metrics for configuration operations
 */
export interface ConfigPerformanceMetrics {
  readonly getOperations: number;
  readonly setOperations: number;
  readonly validationTime: number;
  readonly lastUpdateTime: number;
  readonly cacheHitRate: number;
}

/**
 * Configuration cache entry for performance optimization
 */
interface ConfigCacheEntry {
  readonly value: any;
  readonly timestamp: number;
  readonly accessCount: number;
}

/**
 * Singleton Configuration Manager
 * Provides high-performance configuration access with runtime updates
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager | null = null;

  // Core configuration state
  private config: DashboardConfig;
  private environment: Environment;
  private listeners: Map<string, Array<(event: ConfigChangeEvent) => void>> = new Map();

  // Performance optimization
  private cache: Map<string, ConfigCacheEntry> = new Map();
  private batchedUpdates: Map<string, any> = new Map();
  private updateTimeoutId: number | null = null;

  // Metrics tracking
  private metrics: ConfigPerformanceMetrics = {
    getOperations: 0,
    setOperations: 0,
    validationTime: 0,
    lastUpdateTime: 0,
    cacheHitRate: 0,
  };

  // Pre-calculated hot paths for performance
  private readonly hotPaths: Set<string> = new Set([
    'timing.refreshIntervals.critical',
    'timing.refreshIntervals.high',
    'timing.animations.sparklineFrame',
    'performance.engine.maxRenderTime',
    'performance.engine.targetFPS',
    'display.counts.maxSparklinePoints',
    'colors.trends.bullish',
    'colors.trends.bearish',
  ]);

  private constructor() {
    this.environment = detectEnvironment();
    this.config = this.mergeConfigurations();
    this.initializeEnvironmentVariables();
    this.validateConfiguration();

    // Setup performance monitoring
    if (this.environment === 'development') {
      this.setupPerformanceMonitoring();
    }
  }

  /**
   * Get singleton instance with lazy initialization
   */
  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Merge default configuration with environment profile and overrides
   */
  private mergeConfigurations(): DashboardConfig {
    const profile = getProfile(this.environment);
    return this.deepMerge(DEFAULT_CONFIG, profile) as DashboardConfig;
  }

  /**
   * Deep merge configuration objects with performance optimization
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Initialize configuration from environment variables
   */
  private initializeEnvironmentVariables(): void {
    for (const [envKey, configPath] of Object.entries(ENV_MAPPING)) {
      const envValue = this.getEnvironmentValue(envKey);
      if (envValue !== undefined) {
        this.setByPath(configPath, envValue, 'environment');
      }
    }
  }

  /**
   * Get environment variable value with type coercion
   */
  private getEnvironmentValue(key: string): any {
    let value: string | undefined;

    // Check Vite environment
    if (typeof import.meta !== 'undefined') {
      value = (import.meta as any).env?.[key];
    }

    // Check window environment (runtime injection)
    if (!value && typeof window !== 'undefined') {
      value = (window as any).__ENV__?.[key];
    }

    // Check Node.js environment
    if (!value && typeof process !== 'undefined') {
      value = (process as any).env?.[key];
    }

    if (value === undefined) return undefined;

    // Type coercion
    if (value === 'true') return true;
    if (value === 'false') return false;

    const numValue = Number(value);
    if (!isNaN(numValue) && isFinite(numValue)) return numValue;

    return value;
  }

  /**
   * Get configuration value by path with performance optimization
   */
  public get<T = any>(path: string): T {
    this.metrics.getOperations++;

    // Check cache for hot paths
    if (this.hotPaths.has(path)) {
      const cached = this.cache.get(path);
      if (cached && Date.now() - cached.timestamp < 1000) { // 1s cache for hot paths
        cached.accessCount++;
        return cached.value as T;
      }
    }

    const value = this.getByPath(path);

    // Cache hot paths
    if (this.hotPaths.has(path)) {
      this.cache.set(path, {
        value,
        timestamp: Date.now(),
        accessCount: 1,
      });
    }

    return value as T;
  }

  /**
   * Get value by dot notation path
   */
  private getByPath(path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Set configuration value by path with validation and change events
   */
  public set<T = any>(path: string, value: T, source: 'runtime' | 'environment' = 'runtime'): boolean {
    this.metrics.setOperations++;

    const oldValue = this.getByPath(path);
    if (oldValue === value) return true; // No change

    // Validate the change
    const validation = this.validateConfigChange(path, value);
    if (!validation.isValid) {
      console.warn(`Configuration validation failed for ${path}:`, validation.errors);
      return false;
    }

    // Apply the change
    this.setByPath(path, value, source);

    // Invalidate cache
    this.cache.delete(path);

    // Emit change event
    this.emitChangeEvent(path, oldValue, value, source);

    return true;
  }

  /**
   * Set value by dot notation path
   */
  private setByPath(path: string, value: any, source: 'runtime' | 'environment'): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;

    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.config as any);

    target[lastKey] = value;
    this.metrics.lastUpdateTime = Date.now();
  }

  /**
   * Batch update multiple configuration values
   */
  public batchUpdate(updates: Record<string, any>): void {
    // Add to batched updates
    for (const [path, value] of Object.entries(updates)) {
      this.batchedUpdates.set(path, value);
    }

    // Debounce the actual update
    if (this.updateTimeoutId) {
      clearTimeout(this.updateTimeoutId);
    }

    this.updateTimeoutId = window.setTimeout(() => {
      this.processBatchedUpdates();
    }, PERFORMANCE_CONSTANTS.FRAME_TIME_MS);
  }

  /**
   * Process batched updates for performance
   */
  private processBatchedUpdates(): void {
    const updates = Array.from(this.batchedUpdates.entries());
    this.batchedUpdates.clear();
    this.updateTimeoutId = null;

    for (const [path, value] of updates) {
      this.set(path, value, 'runtime');
    }
  }

  /**
   * Get configuration section with type safety
   */
  public getSection<K extends keyof DashboardConfig>(section: K): DashboardConfig[K] {
    return this.config[section];
  }

  /**
   * Get pre-calculated performance constants
   */
  public getPerformanceConstants() {
    return PERFORMANCE_CONSTANTS;
  }

  /**
   * Subscribe to configuration changes
   */
  public subscribe(path: string, callback: (event: ConfigChangeEvent) => void): () => void {
    const listeners = this.listeners.get(path) || [];
    listeners.push(callback);
    this.listeners.set(path, listeners);

    // Return unsubscribe function
    return () => {
      const current = this.listeners.get(path) || [];
      const index = current.indexOf(callback);
      if (index >= 0) {
        current.splice(index, 1);
        if (current.length === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }

  /**
   * Emit configuration change event
   */
  private emitChangeEvent(path: string, oldValue: any, newValue: any, source: 'runtime' | 'environment'): void {
    const event: ConfigChangeEvent = {
      path,
      oldValue,
      newValue,
      timestamp: Date.now(),
      source,
    };

    // Notify exact path listeners
    const exactListeners = this.listeners.get(path) || [];
    for (const listener of exactListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Configuration change listener error for ${path}:`, error);
      }
    }

    // Notify wildcard listeners (parent paths)
    const pathParts = path.split('.');
    for (let i = 0; i < pathParts.length; i++) {
      const parentPath = pathParts.slice(0, i + 1).join('.') + '.*';
      const parentListeners = this.listeners.get(parentPath) || [];
      for (const listener of parentListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Configuration change listener error for ${parentPath}:`, error);
        }
      }
    }
  }

  /**
   * Validate configuration change
   */
  private validateConfigChange(path: string, value: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type validation based on path
    if (path.includes('interval') || path.includes('timeout') || path.includes('duration')) {
      if (typeof value !== 'number' || value < 0) {
        errors.push(`${path} must be a positive number`);
      }
    }

    if (path.includes('color') && typeof value === 'string') {
      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        errors.push(`${path} must be a valid hex color`);
      }
    }

    if (path.includes('enabled') && typeof value !== 'boolean') {
      errors.push(`${path} must be a boolean`);
    }

    // Performance warnings
    if (path === 'performance.engine.maxRenderTime' && value > 16) {
      warnings.push('Render time > 16ms may cause frame drops');
    }

    if (path.includes('refreshIntervals') && value < 100) {
      warnings.push('Very short refresh intervals may impact performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate entire configuration
   */
  private validateConfiguration(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required sections
    const requiredSections: (keyof DashboardConfig)[] = ['timing', 'display', 'colors', 'performance', 'providers', 'features'];
    for (const section of requiredSections) {
      if (!this.config[section]) {
        errors.push(`Required configuration section '${section}' is missing`);
      }
    }

    // Performance validation
    if (this.config.performance?.engine?.maxRenderTime > PERFORMANCE_CONSTANTS.FRAME_TIME_BUDGET) {
      warnings.push('Max render time exceeds frame budget');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Reset configuration to defaults
   */
  public reset(): void {
    this.config = this.mergeConfigurations();
    this.cache.clear();
    this.metrics = {
      getOperations: 0,
      setOperations: 0,
      validationTime: 0,
      lastUpdateTime: Date.now(),
      cacheHitRate: 0,
    };

    // Emit reset event
    this.emitChangeEvent('*', null, this.config, 'runtime');
  }

  /**
   * Get current environment
   */
  public getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Switch environment profile
   */
  public switchEnvironment(env: Environment): void {
    if (env === this.environment) return;

    const oldEnv = this.environment;
    this.environment = env;
    this.config = this.mergeConfigurations();
    this.cache.clear();

    console.log(`Configuration environment switched from ${oldEnv} to ${env}`);
    this.emitChangeEvent('environment', oldEnv, env, 'runtime');
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): ConfigPerformanceMetrics {
    // Calculate cache hit rate
    const totalAccess = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0);
    const cacheHitRate = totalAccess > 0 ? (this.cache.size / totalAccess) : 0;

    return {
      ...this.metrics,
      cacheHitRate,
    };
  }

  /**
   * Setup performance monitoring for development
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor configuration access patterns
    const originalGet = this.get.bind(this);
    this.get = function<T = any>(path: string): T {
      const start = performance.now();
      const result = originalGet(path);
      const duration = performance.now() - start;

      if (duration > 1) { // Log slow access
        console.warn(`Slow config access: ${path} took ${duration.toFixed(2)}ms`);
      }

      return result;
    };

    // Setup periodic metrics logging
    setInterval(() => {
      const metrics = this.getMetrics();
      console.group('ConfigurationManager Metrics');
      console.log('Get operations:', metrics.getOperations);
      console.log('Set operations:', metrics.setOperations);
      console.log('Cache hit rate:', (metrics.cacheHitRate * 100).toFixed(1) + '%');
      console.log('Last update:', new Date(metrics.lastUpdateTime).toISOString());
      console.groupEnd();
    }, 30000); // Every 30 seconds
  }

  /**
   * Export configuration for debugging
   */
  public exportConfig(): DashboardConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Import configuration (development only)
   */
  public importConfig(config: Partial<DashboardConfig>): void {
    if (this.environment !== 'development') {
      console.warn('Configuration import is only allowed in development environment');
      return;
    }

    this.config = this.deepMerge(this.config, config) as DashboardConfig;
    this.cache.clear();
    this.emitChangeEvent('*', null, this.config, 'runtime');
  }
}

/**
 * Global configuration instance
 * Pre-initialized for performance
 */
export const configManager = ConfigurationManager.getInstance();

/**
 * Convenience function for getting configuration values
 */
export function getConfig<T = any>(path: string): T {
  return configManager.get<T>(path);
}

/**
 * Convenience function for setting configuration values
 */
export function setConfig<T = any>(path: string, value: T): boolean {
  return configManager.set(path, value);
}

/**
 * Convenience function for getting configuration sections
 */
export function getConfigSection<K extends keyof DashboardConfig>(section: K): DashboardConfig[K] {
  return configManager.getSection(section);
}

export default configManager;