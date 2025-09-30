/**
 * Animation Buffer Service
 *
 * Provides smooth animation buffering for real-time price updates and chart transitions
 * Ensures fluid visual updates without jarring price jumps
 */

import { RealTimePrice } from './coinbaseWebSocketService';
import { RechartsDataPoint } from './chartDataAdapter';

export interface AnimationFrame {
  timestamp: number;
  value: number;
  interpolated: boolean;
}

export interface BufferedPriceUpdate {
  symbol: string;
  targetPrice: number;
  currentPrice: number;
  animationFrames: AnimationFrame[];
  startTime: number;
  duration: number;
  easing: EasingFunction;
}

export type EasingFunction = (t: number) => number;

export interface AnimationConfig {
  duration: number; // Animation duration in ms
  frameRate: number; // Target frames per second
  easing: keyof typeof EasingFunctions;
  smoothingFactor: number; // For price smoothing (0-1)
  maxPriceChange: number; // Max % change to animate vs instant update
}

/**
 * Easing functions for smooth animations
 */
export const EasingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInSine: (t: number) => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t: number) => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  spring: (t: number) => 1 - Math.cos(t * Math.PI * 2) * Math.exp(-t * 6),
  bounce: (t: number) => {
    if (t < 1/2.75) return 7.5625 * t * t;
    if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
    if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
  }
};

/**
 * Animation Buffer Service Class
 */
class AnimationBufferService {
  private activeAnimations: Map<string, BufferedPriceUpdate> = new Map();
  private animationCallbacks: Map<string, ((value: number) => void)[]> = new Map();
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;

  // Default configuration
  private defaultConfig: AnimationConfig = {
    duration: 800, // 800ms animation
    frameRate: 60, // 60 FPS
    easing: 'easeOutCubic',
    smoothingFactor: 0.3,
    maxPriceChange: 5.0 // 5% max change to animate
  };

  // Price smoothing buffers
  private priceHistories: Map<string, number[]> = new Map();
  private smoothedPrices: Map<string, number> = new Map();

  constructor() {
    this.startAnimationLoop();
  }

  /**
   * Start the animation loop
   */
  private startAnimationLoop(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    const animate = (currentTime: number) => {
      this.processAnimationFrame(currentTime);

      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop the animation loop
   */
  stopAnimationLoop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Process animation frame
   */
  private processAnimationFrame(currentTime: number): void {
    const deltaTime = currentTime - this.lastFrameTime;
    const targetFrameTime = 1000 / this.defaultConfig.frameRate;

    if (deltaTime < targetFrameTime) return;

    this.lastFrameTime = currentTime;

    // Update all active animations
    for (const [symbol, animation] of this.activeAnimations.entries()) {
      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);

      if (progress >= 1) {
        // Animation complete
        this.notifyCallbacks(symbol, animation.targetPrice);
        this.activeAnimations.delete(symbol);
      } else {
        // Calculate intermediate value
        const easedProgress = animation.easing(progress);
        const currentValue = animation.currentPrice +
          (animation.targetPrice - animation.currentPrice) * easedProgress;

        this.notifyCallbacks(symbol, currentValue);
      }
    }
  }

  /**
   * Animate price update with smooth transition
   */
  animatePrice(
    symbol: string,
    newPrice: number,
    currentPrice?: number,
    config?: Partial<AnimationConfig>
  ): void {
    const effectiveConfig = { ...this.defaultConfig, ...config };
    const lastKnownPrice = currentPrice || this.smoothedPrices.get(symbol) || newPrice;

    // Calculate price change percentage
    const priceChange = Math.abs((newPrice - lastKnownPrice) / lastKnownPrice) * 100;

    // Skip animation for very large price changes (likely data errors or major events)
    if (priceChange > effectiveConfig.maxPriceChange) {
      this.smoothedPrices.set(symbol, newPrice);
      this.notifyCallbacks(symbol, newPrice);
      return;
    }

    // Skip animation if price hasn't changed significantly
    if (priceChange < 0.01) {
      return;
    }

    // Create animation
    const animation: BufferedPriceUpdate = {
      symbol,
      targetPrice: newPrice,
      currentPrice: lastKnownPrice,
      animationFrames: [],
      startTime: performance.now(),
      duration: effectiveConfig.duration,
      easing: EasingFunctions[effectiveConfig.easing]
    };

    // Store the animation
    this.activeAnimations.set(symbol, animation);

    // Update price history for smoothing
    this.updatePriceHistory(symbol, newPrice, effectiveConfig.smoothingFactor);
  }

  /**
   * Update price history and apply smoothing
   */
  private updatePriceHistory(symbol: string, price: number, smoothingFactor: number): void {
    let history = this.priceHistories.get(symbol) || [];
    history.push(price);

    // Keep only last 50 prices
    if (history.length > 50) {
      history = history.slice(-50);
    }

    this.priceHistories.set(symbol, history);

    // Calculate smoothed price using EMA
    const lastSmoothed = this.smoothedPrices.get(symbol) || price;
    const smoothedPrice = smoothingFactor * price + (1 - smoothingFactor) * lastSmoothed;
    this.smoothedPrices.set(symbol, smoothedPrice);
  }

  /**
   * Subscribe to animated price updates
   */
  subscribe(symbol: string, callback: (value: number) => void): () => void {
    let callbacks = this.animationCallbacks.get(symbol);
    if (!callbacks) {
      callbacks = [];
      this.animationCallbacks.set(symbol, callbacks);
    }

    callbacks.push(callback);

    // Send current smoothed price if available
    const currentPrice = this.smoothedPrices.get(symbol);
    if (currentPrice !== undefined) {
      callback(currentPrice);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.animationCallbacks.get(symbol);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify all callbacks for a symbol
   */
  private notifyCallbacks(symbol: string, value: number): void {
    const callbacks = this.animationCallbacks.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error('[AnimationBuffer] Error in callback:', error);
        }
      });
    }
  }

  /**
   * Generate buffered chart data for smooth transitions
   */
  generateBufferedChartData(
    symbol: string,
    newDataPoint: RechartsDataPoint,
    existingData: RechartsDataPoint[],
    maxPoints: number = 50
  ): RechartsDataPoint[] {
    if (existingData.length === 0) {
      return [newDataPoint];
    }

    const lastPoint = existingData[existingData.length - 1];
    const valueDifference = newDataPoint.value - lastPoint.value;
    const steps = 5; // Number of interpolation steps

    // Generate intermediate points for smooth transition
    const intermediatePoints: RechartsDataPoint[] = [];
    for (let i = 1; i <= steps; i++) {
      const progress = i / (steps + 1);
      const easedProgress = EasingFunctions.easeOutQuad(progress);
      const interpolatedValue = lastPoint.value + (valueDifference * easedProgress);

      intermediatePoints.push({
        time: `interp_${lastPoint.time}_${i}`,
        value: interpolatedValue
      });
    }

    // Combine existing data, intermediate points, and new point
    const allData = [...existingData, ...intermediatePoints, newDataPoint];

    // Keep only the last N points
    return allData.slice(-maxPoints);
  }

  /**
   * Create smooth price transition data for mini charts
   */
  createSmoothTransition(
    startValue: number,
    endValue: number,
    points: number = 20,
    easingType: keyof typeof EasingFunctions = 'easeOutCubic'
  ): RechartsDataPoint[] {
    const data: RechartsDataPoint[] = [];
    const easing = EasingFunctions[easingType];

    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const easedProgress = easing(progress);
      const value = startValue + (endValue - startValue) * easedProgress;

      data.push({
        time: i,
        value
      });
    }

    return data;
  }

  /**
   * Apply volume-weighted smoothing
   */
  applyVolumeWeightedSmoothing(
    prices: number[],
    volumes: number[],
    windowSize: number = 10
  ): number[] {
    if (prices.length !== volumes.length) {
      throw new Error('Prices and volumes arrays must have same length');
    }

    const smoothed: number[] = [];

    for (let i = 0; i < prices.length; i++) {
      const startIndex = Math.max(0, i - windowSize + 1);
      const endIndex = i + 1;

      const windowPrices = prices.slice(startIndex, endIndex);
      const windowVolumes = volumes.slice(startIndex, endIndex);

      let totalVolumePrice = 0;
      let totalVolume = 0;

      for (let j = 0; j < windowPrices.length; j++) {
        totalVolumePrice += windowPrices[j] * windowVolumes[j];
        totalVolume += windowVolumes[j];
      }

      const vwap = totalVolume > 0 ? totalVolumePrice / totalVolume : prices[i];
      smoothed.push(vwap);
    }

    return smoothed;
  }

  /**
   * Create animated sparkline data
   */
  createAnimatedSparkline(
    prices: number[],
    duration: number = 2000,
    steps: number = 30
  ): Promise<RechartsDataPoint[][]> {
    return new Promise((resolve) => {
      const frames: RechartsDataPoint[][] = [];
      const frameCount = steps;
      const frameDelay = duration / frameCount;

      let currentFrame = 0;

      const generateFrame = () => {
        const progress = currentFrame / (frameCount - 1);
        const pointsToShow = Math.ceil(prices.length * progress);

        const frameData = prices.slice(0, pointsToShow).map((price, index) => ({
          time: index,
          value: price
        }));

        frames.push(frameData);
        currentFrame++;

        if (currentFrame < frameCount) {
          setTimeout(generateFrame, frameDelay);
        } else {
          resolve(frames);
        }
      };

      generateFrame();
    });
  }

  /**
   * Get current smoothed price
   */
  getSmoothedPrice(symbol: string): number | null {
    return this.smoothedPrices.get(symbol) || null;
  }

  /**
   * Get price history
   */
  getPriceHistory(symbol: string, limit: number = 50): number[] {
    const history = this.priceHistories.get(symbol) || [];
    return history.slice(-limit);
  }

  /**
   * Check if animation is active for symbol
   */
  isAnimating(symbol: string): boolean {
    return this.activeAnimations.has(symbol);
  }

  /**
   * Get animation progress for symbol
   */
  getAnimationProgress(symbol: string): number | null {
    const animation = this.activeAnimations.get(symbol);
    if (!animation) return null;

    const elapsed = performance.now() - animation.startTime;
    return Math.min(elapsed / animation.duration, 1);
  }

  /**
   * Clear all animations for symbol
   */
  clearAnimations(symbol?: string): void {
    if (symbol) {
      this.activeAnimations.delete(symbol);
      this.animationCallbacks.delete(symbol);
    } else {
      this.activeAnimations.clear();
      this.animationCallbacks.clear();
    }
  }

  /**
   * Update default configuration
   */
  updateConfig(config: Partial<AnimationConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AnimationConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    activeAnimations: number;
    totalSubscribers: number;
    priceHistories: number;
    isRunning: boolean;
  } {
    const totalSubscribers = Array.from(this.animationCallbacks.values())
      .reduce((total, callbacks) => total + callbacks.length, 0);

    return {
      activeAnimations: this.activeAnimations.size,
      totalSubscribers,
      priceHistories: this.priceHistories.size,
      isRunning: this.isRunning
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAnimationLoop();
    this.activeAnimations.clear();
    this.animationCallbacks.clear();
    this.priceHistories.clear();
    this.smoothedPrices.clear();
  }
}

// Export singleton instance
export const animationBufferService = new AnimationBufferService();
export default animationBufferService;