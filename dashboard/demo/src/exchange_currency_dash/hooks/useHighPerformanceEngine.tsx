/**
 * React Hook for High-Performance Dashboard Engine
 * Integrates ring buffers, sparklines, signal detection, and rotation
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RingBuffer, RingBufferPool } from '../services/RingBuffer';
import { SparklineRenderer, SparklineCompositor, SparklineConfig, RenderStats } from '../services/SparklineEngine';
import { SignalAggregator, MarketSignal, SignalConfig } from '../services/SignalDetectionEngine';
import { RotationOrchestrator, RotationScheduler, SchedulerConfig, RotationItem } from '../services/RotationScheduler';

export interface EngineConfig {
  bufferCapacity?: number;
  sparklineConfig?: Partial<SparklineConfig>;
  signalConfig?: SignalConfig;
  rotationConfig?: SchedulerConfig;
  targetFPS?: number;
  debugMode?: boolean;
}

export interface EngineState {
  isRunning: boolean;
  fps: number;
  frameTime: number;
  activeSignals: MarketSignal[];
  topSignal: MarketSignal | null;
  currentRotation: Record<string, string[]>;
  stats: {
    bufferedPoints: number;
    renderedFrames: number;
    detectedSignals: number;
    rotationCount: number;
  };
}

/**
 * Main hook for high-performance engine
 */
export function useHighPerformanceEngine(config: EngineConfig = {}) {
  // Core services
  const bufferPool = useRef(new RingBufferPool(config.bufferCapacity || 5000));
  const sparklineCompositor = useRef(new SparklineCompositor());
  const signalAggregator = useRef<SignalAggregator>();
  const rotationOrchestrator = useRef(new RotationOrchestrator());

  // Animation state
  const animationFrame = useRef<number>();
  const lastFrameTime = useRef(0);
  const frameCount = useRef(0);

  // Component state
  const [engineState, setEngineState] = useState<EngineState>({
    isRunning: false,
    fps: 0,
    frameTime: 0,
    activeSignals: [],
    topSignal: null,
    currentRotation: {},
    stats: {
      bufferedPoints: 0,
      renderedFrames: 0,
      detectedSignals: 0,
      rotationCount: 0
    }
  });

  // Canvas refs for rendering targets
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Initialize signal aggregator
  useEffect(() => {
    const defaultSignalConfig: SignalConfig = {
      priceChangeThreshold: 2.0,        // 2% change
      priceChangeWindow: 5,              // 5 minutes
      volatilityMultiplier: 2.5,        // 2.5x baseline volatility
      bookImbalanceThreshold: 0.7,      // 70% imbalance
      minSignalDuration: 8,              // 8 seconds
      cooldownPeriod: 30,                // 30 seconds
      ...config.signalConfig
    };

    signalAggregator.current = new SignalAggregator(
      defaultSignalConfig,
      (signal) => handleSignalDetected(signal)
    );

    return () => {
      signalAggregator.current?.resetAll();
    };
  }, [config.signalConfig]);

  /**
   * Initialize sparkline for a widget
   */
  const initializeSparkline = useCallback((
    widgetId: string,
    canvas: HTMLCanvasElement,
    customConfig?: Partial<SparklineConfig>
  ) => {
    const defaultConfig: SparklineConfig = {
      width: canvas.width || 120,
      height: canvas.height || 50,
      strokeColor: '#FFD700',
      strokeWidth: 1.5,
      fillGradient: {
        start: 'rgba(255, 215, 0, 0.6)',
        end: 'rgba(255, 140, 0, 0.1)'
      },
      glowIntensity: 2,
      animated: true,
      decimationFactor: 2,
      ...config.sparklineConfig,
      ...customConfig
    };

    sparklineCompositor.current.addSparkline(widgetId, defaultConfig);
    canvasRefs.current.set(widgetId, canvas);

    if (config.debugMode) {
      console.log(`[Engine] Initialized sparkline: ${widgetId}`);
    }
  }, [config.sparklineConfig, config.debugMode]);

  /**
   * Initialize rotation scheduler for a group
   */
  const initializeRotation = useCallback((
    groupId: string,
    items: RotationItem[],
    customConfig?: Partial<SchedulerConfig>
  ) => {
    const defaultConfig: SchedulerConfig = {
      fixedSlots: 3,
      spotlightSlots: 2,
      rotationInterval: 21,
      fairnessWindow: 3,
      sectorDiversity: true,
      dayParts: [
        {
          name: 'morning',
          startHour: 6,
          endHour: 12,
          weights: { currency: 1.5, crypto: 1.0, commodity: 1.2, index: 1.0 }
        },
        {
          name: 'afternoon',
          startHour: 12,
          endHour: 18,
          weights: { currency: 1.2, crypto: 1.5, commodity: 1.0, index: 1.3 }
        },
        {
          name: 'evening',
          startHour: 18,
          endHour: 24,
          weights: { currency: 1.0, crypto: 2.0, commodity: 0.8, index: 1.0 }
        },
        {
          name: 'overnight',
          startHour: 0,
          endHour: 6,
          weights: { currency: 0.8, crypto: 1.5, commodity: 0.5, index: 0.8 }
        }
      ],
      ...config.rotationConfig,
      ...customConfig
    };

    const scheduler = rotationOrchestrator.current.createScheduler(
      groupId,
      defaultConfig,
      (rotatedItems) => handleRotation(groupId, rotatedItems)
    );

    // Add items to scheduler
    items.forEach(item => scheduler.addItem(item));

    if (config.debugMode) {
      console.log(`[Engine] Initialized rotation: ${groupId} with ${items.length} items`);
    }

    return scheduler;
  }, [config.rotationConfig, config.debugMode]);

  /**
   * Push data to buffer
   */
  const pushData = useCallback((
    symbol: string,
    value: number,
    timestamp?: number
  ) => {
    const buffer = bufferPool.current.getBuffer(symbol);
    buffer.push(value, timestamp);

    // Check for signals if aggregator is ready
    if (signalAggregator.current) {
      const signal = signalAggregator.current.processData(
        symbol,
        buffer,
        value
      );

      if (signal && config.debugMode) {
        console.log(`[Signal] Detected: ${signal.type} for ${symbol}`, signal);
      }
    }
  }, [config.debugMode]);

  /**
   * Push batch data (for WebSocket streams)
   */
  const pushBatchData = useCallback((
    symbol: string,
    values: Float32Array,
    startTimestamp: number,
    interval: number
  ) => {
    const buffer = bufferPool.current.getBuffer(symbol);
    buffer.pushBatch(values, startTimestamp, interval);
  }, []);

  /**
   * Handle signal detection
   */
  const handleSignalDetected = useCallback((signal: MarketSignal) => {
    // Update state
    setEngineState(prev => ({
      ...prev,
      activeSignals: [...prev.activeSignals, signal],
      topSignal: signal.priority > (prev.topSignal?.priority || 0) ? signal : prev.topSignal,
      stats: {
        ...prev.stats,
        detectedSignals: prev.stats.detectedSignals + 1
      }
    }));

    // Notify rotation schedulers
    rotationOrchestrator.current.broadcastSignal(signal);

    // Trigger visual effects (will be implemented in component)
    if (signal.priority >= 7) {
      triggerPauseOnSignal(signal);
    }
  }, []);

  /**
   * Handle rotation update
   */
  const handleRotation = useCallback((groupId: string, items: string[]) => {
    setEngineState(prev => ({
      ...prev,
      currentRotation: {
        ...prev.currentRotation,
        [groupId]: items
      },
      stats: {
        ...prev.stats,
        rotationCount: prev.stats.rotationCount + 1
      }
    }));
  }, []);

  /**
   * Trigger pause-on-signal visual effects
   */
  const triggerPauseOnSignal = useCallback((signal: MarketSignal) => {
    // This will be connected to visual effects component
    const event = new CustomEvent('pauseOnSignal', {
      detail: signal
    });
    window.dispatchEvent(event);
  }, []);

  /**
   * Main render loop
   */
  const renderLoop = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastFrameTime.current;

    // Target 60 FPS
    if (deltaTime >= 1000 / (config.targetFPS || 60)) {
      // Get all buffers
      const buffers = new Map<string, RingBuffer>();
      for (const key of bufferPool.current.getAllKeys()) {
        buffers.set(key, bufferPool.current.getBuffer(key));
      }

      // Render all sparklines
      const stats = sparklineCompositor.current.renderAll(buffers);

      // Transfer rendered sparklines to canvas elements
      for (const [widgetId, canvas] of canvasRefs.current) {
        const renderer = sparklineCompositor.current['renderers'].get(widgetId);
        if (renderer && canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const sourceCanvas = renderer.getCanvas();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(sourceCanvas as any, 0, 0);
          }
        }
      }

      // Update FPS counter
      frameCount.current++;
      if (now - lastFrameTime.current > 1000) {
        setEngineState(prev => ({
          ...prev,
          fps: frameCount.current,
          frameTime: stats.frameTime,
          stats: {
            ...prev.stats,
            renderedFrames: prev.stats.renderedFrames + frameCount.current
          }
        }));
        frameCount.current = 0;
      }

      lastFrameTime.current = now;
    }

    if (engineState.isRunning) {
      animationFrame.current = requestAnimationFrame(renderLoop);
    }
  }, [config.targetFPS, engineState.isRunning]);

  /**
   * Start engine
   */
  const start = useCallback(() => {
    setEngineState(prev => ({ ...prev, isRunning: true }));
    lastFrameTime.current = performance.now();
    frameCount.current = 0;
    animationFrame.current = requestAnimationFrame(renderLoop);

    if (config.debugMode) {
      console.log('[Engine] Started');
    }
  }, [renderLoop, config.debugMode]);

  /**
   * Stop engine
   */
  const stop = useCallback(() => {
    setEngineState(prev => ({ ...prev, isRunning: false }));
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    if (config.debugMode) {
      console.log('[Engine] Stopped');
    }
  }, [config.debugMode]);

  /**
   * Start rotation for a group
   */
  const startRotation = useCallback((groupId: string, intervalMs?: number) => {
    rotationOrchestrator.current.startRotation(groupId, intervalMs);
  }, []);

  /**
   * Stop rotation for a group
   */
  const stopRotation = useCallback((groupId: string) => {
    rotationOrchestrator.current.stopRotation(groupId);
  }, []);

  /**
   * Get buffer for direct access
   */
  const getBuffer = useCallback((symbol: string): RingBuffer => {
    return bufferPool.current.getBuffer(symbol);
  }, []);

  /**
   * Get performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    return {
      fps: engineState.fps,
      frameTime: engineState.frameTime,
      sparklineStats: sparklineCompositor.current.getStats(),
      signalStats: signalAggregator.current?.getAllActiveSignals().length || 0,
      bufferCount: bufferPool.current.getAllKeys().length
    };
  }, [engineState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stop();
      sparklineCompositor.current.dispose();
      rotationOrchestrator.current.dispose();
      bufferPool.current.clear();
    };
  }, [stop]);

  return {
    // State
    engineState,

    // Core functions
    initializeSparkline,
    initializeRotation,
    pushData,
    pushBatchData,
    start,
    stop,

    // Rotation control
    startRotation,
    stopRotation,

    // Direct access
    getBuffer,
    getPerformanceMetrics,

    // Service refs (for advanced usage)
    services: {
      bufferPool: bufferPool.current,
      sparklineCompositor: sparklineCompositor.current,
      signalAggregator: signalAggregator.current,
      rotationOrchestrator: rotationOrchestrator.current
    }
  };
}