/**
 * Lock-free ring buffer for ultra-fast time-series data ingestion
 * Zero-allocation updates using pre-allocated typed arrays
 * Optimized for 60fps rendering at 4K resolution
 */

export interface DataPoint {
  timestamp: number;
  value: number;
}

export class RingBuffer {
  private readonly buffer: Float32Array;
  private readonly timestamps: Float32Array;
  private readonly capacity: number;
  private head: number = 0;
  private size: number = 0;

  // Pre-allocated arrays for zero-allocation operations
  private readonly tempArray: Float32Array;
  private readonly downsampledCache: Map<string, Float32Array>;

  constructor(capacity: number = 5000) {
    this.capacity = capacity;
    this.buffer = new Float32Array(capacity);
    this.timestamps = new Float32Array(capacity);
    this.tempArray = new Float32Array(capacity);
    this.downsampledCache = new Map();
  }

  /**
   * Push new data point - O(1) operation
   * No allocations, direct memory write
   */
  push(value: number, timestamp: number = Date.now()): void {
    const index = this.head % this.capacity;
    this.buffer[index] = value;
    this.timestamps[index] = timestamp;
    this.head++;

    if (this.size < this.capacity) {
      this.size++;
    }

    // Invalidate downsampled cache
    this.downsampledCache.clear();
  }

  /**
   * Batch push for WebSocket data streams
   * Optimized for bulk updates
   */
  pushBatch(values: Float32Array, startTimestamp: number, interval: number): void {
    const count = Math.min(values.length, this.capacity);

    for (let i = 0; i < count; i++) {
      const index = (this.head + i) % this.capacity;
      this.buffer[index] = values[i];
      this.timestamps[index] = startTimestamp + (i * interval);
    }

    this.head += count;
    this.size = Math.min(this.size + count, this.capacity);
    this.downsampledCache.clear();
  }

  /**
   * Get raw data slice without allocation
   * Returns view into internal buffer
   */
  getRawData(count?: number): { values: Float32Array; timestamps: Float32Array } {
    const n = Math.min(count || this.size, this.size);
    const start = this.getStartIndex();

    if (start + n <= this.capacity) {
      // Contiguous slice
      return {
        values: this.buffer.subarray(start, start + n),
        timestamps: this.timestamps.subarray(start, start + n)
      };
    } else {
      // Wrapped buffer - need to copy
      const values = new Float32Array(n);
      const timestamps = new Float32Array(n);

      const firstPart = this.capacity - start;
      values.set(this.buffer.subarray(start, this.capacity), 0);
      values.set(this.buffer.subarray(0, n - firstPart), firstPart);

      timestamps.set(this.timestamps.subarray(start, this.capacity), 0);
      timestamps.set(this.timestamps.subarray(0, n - firstPart), firstPart);

      return { values, timestamps };
    }
  }

  /**
   * Get last N values for sparkline rendering
   * Optimized for frequent calls
   */
  getLastN(n: number): Float32Array {
    const count = Math.min(n, this.size);
    const result = new Float32Array(count);

    const start = this.getStartIndex();
    const end = start + this.size;

    if (end <= this.capacity) {
      result.set(this.buffer.subarray(end - count, end));
    } else {
      const wrapped = end - this.capacity;
      const fromEnd = count - wrapped;
      result.set(this.buffer.subarray(this.capacity - fromEnd, this.capacity), 0);
      result.set(this.buffer.subarray(0, wrapped), fromEnd);
    }

    return result;
  }

  /**
   * Get min/max for Y-axis scaling
   * Single pass, cache-friendly
   */
  getMinMax(): { min: number; max: number } {
    if (this.size === 0) return { min: 0, max: 0 };

    let min = Infinity;
    let max = -Infinity;

    const start = this.getStartIndex();
    const end = start + this.size;

    if (end <= this.capacity) {
      // Contiguous data
      for (let i = start; i < end; i++) {
        const val = this.buffer[i];
        min = Math.min(min, val);
        max = Math.max(max, val);
      }
    } else {
      // Wrapped buffer
      for (let i = start; i < this.capacity; i++) {
        const val = this.buffer[i];
        min = Math.min(min, val);
        max = Math.max(max, val);
      }
      for (let i = 0; i < end - this.capacity; i++) {
        const val = this.buffer[i];
        min = Math.min(min, val);
        max = Math.max(max, val);
      }
    }

    return { min, max };
  }

  /**
   * Calculate statistics for signal detection
   * Returns mean, std deviation, and recent velocity
   */
  getStats(windowSize: number = 100): {
    mean: number;
    stdDev: number;
    velocity: number;
    volatility: number;
  } {
    const window = Math.min(windowSize, this.size);
    const data = this.getLastN(window);

    // Calculate mean
    let sum = 0;
    for (let i = 0; i < window; i++) {
      sum += data[i];
    }
    const mean = sum / window;

    // Calculate standard deviation
    let variance = 0;
    for (let i = 0; i < window; i++) {
      const diff = data[i] - mean;
      variance += diff * diff;
    }
    const stdDev = Math.sqrt(variance / window);

    // Calculate velocity (rate of change)
    const recentWindow = Math.min(10, window);
    const recentData = data.subarray(window - recentWindow);
    let velocity = 0;
    if (recentWindow > 1) {
      velocity = (recentData[recentWindow - 1] - recentData[0]) / recentWindow;
    }

    // Calculate volatility (rolling std dev)
    const volatilityWindow = Math.min(20, window);
    const volatilityData = data.subarray(window - volatilityWindow);
    let volatilitySum = 0;
    for (let i = 1; i < volatilityWindow; i++) {
      const change = Math.abs(volatilityData[i] - volatilityData[i - 1]);
      volatilitySum += change;
    }
    const volatility = volatilitySum / (volatilityWindow - 1);

    return { mean, stdDev, velocity, volatility };
  }

  private getStartIndex(): number {
    if (this.size < this.capacity) {
      return 0;
    }
    return this.head % this.capacity;
  }

  clear(): void {
    this.head = 0;
    this.size = 0;
    this.downsampledCache.clear();
  }

  getSize(): number {
    return this.size;
  }

  getCapacity(): number {
    return this.capacity;
  }
}

/**
 * Ring buffer pool for managing multiple data streams
 * Prevents allocation/deallocation overhead
 */
export class RingBufferPool {
  private readonly buffers: Map<string, RingBuffer> = new Map();
  private readonly capacity: number;

  constructor(capacity: number = 5000) {
    this.capacity = capacity;
  }

  getBuffer(key: string): RingBuffer {
    let buffer = this.buffers.get(key);
    if (!buffer) {
      buffer = new RingBuffer(this.capacity);
      this.buffers.set(key, buffer);
    }
    return buffer;
  }

  removeBuffer(key: string): void {
    this.buffers.delete(key);
  }

  clear(): void {
    this.buffers.clear();
  }

  getAllKeys(): string[] {
    return Array.from(this.buffers.keys());
  }
}