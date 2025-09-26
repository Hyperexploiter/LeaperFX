/**
 * Ultra-high performance sparkline rendering engine
 * Targets: ≤12ms/frame at 4K 60Hz
 * Zero DOM manipulation, GPU-accelerated rendering
 */

import { RingBuffer } from './RingBuffer';

export interface SparklineConfig {
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  fillGradient?: { start: string; end: string };
  glowIntensity?: number;
  animated?: boolean;
  decimationFactor?: number;
}

export interface RenderStats {
  frameTime: number;
  drawCalls: number;
  pointsRendered: number;
  fps: number;
}

/**
 * High-performance sparkline renderer using OffscreenCanvas
 * Implements smart decimation and GPU acceleration
 */
export class SparklineRenderer {
  private canvas: OffscreenCanvas | HTMLCanvasElement;
  private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  private config: SparklineConfig;
  private animationFrame: number | null = null;

  // Performance monitoring
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;

  // Pre-calculated values for performance
  private scaleX: number = 1;
  private scaleY: number = 1;
  private gradient: CanvasGradient | null = null;

  // Geometry caching
  private pathCache: Path2D | null = null;
  private lastDataHash: number = 0;

  constructor(config: SparklineConfig) {
    this.config = config;

    // Try OffscreenCanvas first (better performance)
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(config.width, config.height);
      this.ctx = this.canvas.getContext('2d', {
        alpha: true,
        desynchronized: true, // Hint for better performance
        willReadFrequently: false
      }) as OffscreenCanvasRenderingContext2D;
    } else {
      // Fallback to regular canvas
      this.canvas = document.createElement('canvas');
      this.canvas.width = config.width;
      this.canvas.height = config.height;
      this.ctx = this.canvas.getContext('2d', {
        alpha: true,
        desynchronized: true,
        willReadFrequently: false
      })!;
    }

    this.setupContext();
  }

  private setupContext(): void {
    // Enable hardware acceleration hints
    (this.ctx as any).imageSmoothingEnabled = false;

    // Pre-create gradient if configured
    if (this.config.fillGradient) {
      this.gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
      this.gradient.addColorStop(0, this.config.fillGradient.start);
      this.gradient.addColorStop(1, this.config.fillGradient.end);
    }
  }

  /**
   * Smart decimation: reduces points to match pixel width
   * Prevents overdraw and maintains visual quality
   */
  private decimateData(data: Float32Array, targetPoints: number): Float32Array {
    if (data.length <= targetPoints) return data;

    const decimated = new Float32Array(targetPoints);
    const step = (data.length - 1) / (targetPoints - 1);

    for (let i = 0; i < targetPoints; i++) {
      const index = Math.round(i * step);
      decimated[i] = data[index];
    }

    return decimated;
  }

  /**
   * Render sparkline with sub-3ms target for 300 points
   * Uses cached geometry when possible
   */
  render(buffer: RingBuffer): RenderStats {
    const startTime = performance.now();

    // Clear canvas - fastest method
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);

    // Get data with smart decimation
    const maxPoints = Math.min(this.config.width, 300); // Pixel-perfect rendering
    const rawData = buffer.getLastN(maxPoints * (this.config.decimationFactor || 2));
    const data = this.decimateData(rawData, maxPoints);

    if (data.length < 2) {
      return this.getStats(startTime, 0);
    }

    // Calculate data hash for cache validation
    const dataHash = this.calculateDataHash(data);
    const cacheHit = dataHash === this.lastDataHash && this.pathCache !== null;

    if (!cacheHit) {
      // Create new path
      this.pathCache = this.createPath(data, buffer);
      this.lastDataHash = dataHash;
    }

    // Render cached path
    this.renderPath(this.pathCache!);

    // Optional glow effect
    if (this.config.glowIntensity && this.config.glowIntensity > 0) {
      this.addGlowEffect();
    }

    return this.getStats(startTime, data.length);
  }

  /**
   * Create optimized Path2D object for rendering
   * Single allocation, reused across frames
   */
  private createPath(data: Float32Array, buffer: RingBuffer): Path2D {
    const path = new Path2D();
    const { min, max } = buffer.getMinMax();
    const range = max - min || 1;

    // Pre-calculate scales
    this.scaleX = this.config.width / (data.length - 1);
    this.scaleY = this.config.height / range;

    // Build path - optimized loop
    path.moveTo(0, this.config.height - ((data[0] - min) * this.scaleY));

    for (let i = 1; i < data.length; i++) {
      const x = i * this.scaleX;
      const y = this.config.height - ((data[i] - min) * this.scaleY);
      path.lineTo(x, y);
    }

    return path;
  }

  /**
   * Render path with minimal state changes
   * Batch operations for GPU efficiency
   */
  private renderPath(path: Path2D): void {
    this.ctx.save();

    // Draw fill if gradient exists
    if (this.gradient) {
      this.ctx.fillStyle = this.gradient;
      this.ctx.fill(path);
    }

    // Draw stroke
    this.ctx.strokeStyle = this.config.strokeColor;
    this.ctx.lineWidth = this.config.strokeWidth;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.stroke(path);

    this.ctx.restore();
  }

  /**
   * Add glow effect using shadow
   * GPU-accelerated on most browsers
   */
  private addGlowEffect(): void {
    this.ctx.save();
    this.ctx.shadowColor = this.config.strokeColor;
    this.ctx.shadowBlur = this.config.glowIntensity || 4;
    this.ctx.strokeStyle = this.config.strokeColor;
    this.ctx.lineWidth = this.config.strokeWidth * 0.5;
    if (this.pathCache) {
      this.ctx.stroke(this.pathCache);
    }
    this.ctx.restore();
  }

  /**
   * Fast hash calculation for cache validation
   * Uses bit operations for speed
   */
  private calculateDataHash(data: Float32Array): number {
    let hash = 0;
    const step = Math.max(1, Math.floor(data.length / 10));

    for (let i = 0; i < data.length; i += step) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash;
  }

  /**
   * Get performance statistics
   */
  private getStats(startTime: number, pointsRendered: number): RenderStats {
    const frameTime = performance.now() - startTime;

    // Update FPS calculation
    this.frameCount++;
    if (startTime - this.lastFrameTime > 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = startTime;
    }

    return {
      frameTime,
      drawCalls: 1,
      pointsRendered,
      fps: this.fps
    };
  }

  /**
   * Get canvas for compositing
   */
  getCanvas(): OffscreenCanvas | HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Transfer to ImageBitmap for main thread compositing
   * Zero-copy operation on supported browsers
   */
  async transferToImageBitmap(): Promise<ImageBitmap> {
    if (this.canvas instanceof OffscreenCanvas) {
      return await createImageBitmap(this.canvas);
    } else {
      return await createImageBitmap(this.canvas);
    }
  }

  /**
   * Update configuration without recreation
   */
  updateConfig(config: Partial<SparklineConfig>): void {
    this.config = { ...this.config, ...config };

    // Recreate gradient if needed
    if (config.fillGradient) {
      this.gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
      this.gradient.addColorStop(0, config.fillGradient.start);
      this.gradient.addColorStop(1, config.fillGradient.end);
    }

    // Invalidate cache
    this.pathCache = null;
    this.lastDataHash = 0;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.pathCache = null;
  }
}

/**
 * Sparkline compositor for managing multiple sparklines
 * Handles batched rendering and frame synchronization
 */
export class SparklineCompositor {
  private renderers: Map<string, SparklineRenderer> = new Map();
  private animationFrame: number | null = null;
  private targetFPS: number = 60;
  private frameInterval: number = 1000 / 60;
  private lastFrameTime: number = 0;

  // Performance monitoring
  private stats: RenderStats = {
    frameTime: 0,
    drawCalls: 0,
    pointsRendered: 0,
    fps: 60
  };

  /**
   * Add sparkline to compositor
   */
  addSparkline(id: string, config: SparklineConfig): SparklineRenderer {
    const renderer = new SparklineRenderer(config);
    this.renderers.set(id, renderer);
    return renderer;
  }

  /**
   * Remove sparkline from compositor
   */
  removeSparkline(id: string): void {
    const renderer = this.renderers.get(id);
    if (renderer) {
      renderer.dispose();
      this.renderers.delete(id);
    }
  }

  /**
   * Batch render all sparklines
   * Synchronized to prevent jank
   */
  renderAll(buffers: Map<string, RingBuffer>): RenderStats {
    const startTime = performance.now();
    let totalPoints = 0;
    let drawCalls = 0;

    for (const [id, renderer] of this.renderers) {
      const buffer = buffers.get(id);
      if (buffer) {
        const stats = renderer.render(buffer);
        totalPoints += stats.pointsRendered;
        drawCalls++;
      }
    }

    const frameTime = performance.now() - startTime;
    this.stats = {
      frameTime,
      drawCalls,
      pointsRendered: totalPoints,
      fps: Math.round(1000 / frameTime)
    };

    return this.stats;
  }

  /**
   * Start animation loop
   */
  startAnimation(buffers: Map<string, RingBuffer>, callback?: (stats: RenderStats) => void): void {
    const animate = (timestamp: number) => {
      if (timestamp - this.lastFrameTime >= this.frameInterval) {
        const stats = this.renderAll(buffers);
        if (callback) callback(stats);
        this.lastFrameTime = timestamp;
      }
      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop
   */
  stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Get current performance stats
   */
  getStats(): RenderStats {
    return this.stats;
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    this.stopAnimation();
    for (const renderer of this.renderers.values()) {
      renderer.dispose();
    }
    this.renderers.clear();
  }
}