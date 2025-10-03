/**
 * Intelligent Rotation Scheduler with Weighted Round-Robin
 * Implements day-parting, fairness, and spotlight management
 * Ensures dynamic but non-repetitive content display
 */

import { MarketSignal } from './SignalDetectionEngine';

export interface RotationItem {
  id: string;
  symbol: string;
  category: 'currency' | 'crypto' | 'commodity' | 'index';
  weight: number;           // Base weight for rotation priority
  lastShown: number;         // Timestamp of last display
  showCount: number;         // Total times shown
  pinned: boolean;          // Owner-pinned items
  signalActive: boolean;     // Currently in signal mode
  metadata?: any;
}

export interface DayPartConfig {
  name: string;
  startHour: number;        // 0-23
  endHour: number;          // 0-23
  weights: {
    currency: number;
    crypto: number;
    commodity: number;
    index: number;
  };
  prioritySymbols?: string[]; // Symbols to prioritize during this period
}

export interface SchedulerConfig {
  fixedSlots: number;        // Number of fixed display slots
  spotlightSlots: number;    // Dynamic spotlight slots
  rotationInterval: number;  // Base rotation interval in seconds
  fairnessWindow: number;    // Rotations before item can repeat
  sectorDiversity: boolean;  // Enforce category diversity
  dayParts: DayPartConfig[]; // Time-based configurations
}

/**
 * Core rotation scheduler
 * Manages item display order with sophisticated logic
 */
export class RotationScheduler {
  private config: SchedulerConfig;
  private items: Map<string, RotationItem> = new Map();
  private rotationHistory: string[][] = [];
  private currentRotation: string[] = [];
  private rotationIndex: number = 0;

  // Performance tracking
  private lastRotationTime: number = 0;
  private rotationCount: number = 0;

  // Signal integration
  private activeSignals: Map<string, MarketSignal> = new Map();
  private spotlightOverride: string | null = null;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  /**
   * Add item to rotation pool
   */
  addItem(item: RotationItem): void {
    this.items.set(item.id, {
      ...item,
      lastShown: 0,
      showCount: 0
    });
  }

  /**
   * Remove item from rotation
   */
  removeItem(itemId: string): void {
    this.items.delete(itemId);
    // Clean from current rotation
    this.currentRotation = this.currentRotation.filter(id => id !== itemId);
  }

  /**
   * Calculate weighted priority for item
   * Considers multiple factors for intelligent rotation
   */
  private calculatePriority(item: RotationItem, now: number): number {
    let priority = item.weight;

    // Apply day-part multiplier
    const dayPart = this.getCurrentDayPart();
    if (dayPart) {
      const categoryMultiplier = dayPart.weights[item.category] || 1;
      priority *= categoryMultiplier;

      // Boost priority symbols
      if (dayPart.prioritySymbols?.includes(item.symbol)) {
        priority *= 1.5;
      }
    }

    // Apply fairness decay
    const timeSinceShown = now - item.lastShown;
    const fairnessBoost = Math.min(2, timeSinceShown / (this.config.rotationInterval * 1000 * 10));
    priority *= fairnessBoost;

    // Reduce priority for frequently shown items
    const showPenalty = Math.max(0.5, 1 - (item.showCount / 100));
    priority *= showPenalty;

    // Massive boost for active signals
    if (item.signalActive) {
      priority *= 10;
    }

    // Boost for pinned items
    if (item.pinned) {
      priority *= 2;
    }

    return priority;
  }

  /**
   * Get current day part configuration
   */
  private getCurrentDayPart(): DayPartConfig | null {
    const now = new Date();
    const currentHour = now.getHours();

    for (const dayPart of this.config.dayParts) {
      if (dayPart.startHour <= currentHour && currentHour < dayPart.endHour) {
        return dayPart;
      }
      // Handle overnight periods
      if (dayPart.startHour > dayPart.endHour) {
        if (currentHour >= dayPart.startHour || currentHour < dayPart.endHour) {
          return dayPart;
        }
      }
    }

    return null;
  }

  /**
   * Check if item was recently shown
   */
  private isInFairnessWindow(itemId: string): boolean {
    const windowSize = Math.min(this.config.fairnessWindow, this.rotationHistory.length);
    const recentRotations = this.rotationHistory.slice(-windowSize);

    return recentRotations.some(rotation => rotation.includes(itemId));
  }

  /**
   * Ensure sector diversity in selection
   */
  private ensureSectorDiversity(candidates: RotationItem[], selected: RotationItem[]): RotationItem[] {
    if (!this.config.sectorDiversity) return candidates;

    const selectedCategories = new Set(selected.map(item => item.category));
    const diverse: RotationItem[] = [];
    const remaining: RotationItem[] = [];

    for (const candidate of candidates) {
      if (!selectedCategories.has(candidate.category)) {
        diverse.push(candidate);
        selectedCategories.add(candidate.category);
      } else {
        remaining.push(candidate);
      }
    }

    return [...diverse, ...remaining];
  }

  /**
   * Select next rotation of items
   * Core algorithm implementing weighted round-robin
   */
  selectNextRotation(): string[] {
    const now = Date.now();
    const selected: RotationItem[] = [];
    const totalSlots = this.config.fixedSlots + this.config.spotlightSlots;

    // Get all items sorted by priority
    const allItems = Array.from(this.items.values())
      .filter(item => !this.isInFairnessWindow(item.id))
      .map(item => ({
        ...item,
        calculatedPriority: this.calculatePriority(item, now)
      }))
      .sort((a, b) => b.calculatedPriority - a.calculatedPriority);

    // Handle spotlight override
    if (this.spotlightOverride) {
      const spotlightItem = this.items.get(this.spotlightOverride);
      if (spotlightItem) {
        selected.push(spotlightItem);
      }
    }

    // Fill fixed slots with pinned items first
    const pinnedItems = allItems.filter(item => item.pinned);
    for (const item of pinnedItems) {
      if (selected.length >= this.config.fixedSlots) break;
      selected.push(item);
    }

    // Fill remaining slots with diversity consideration
    const remainingCandidates = allItems.filter(
      item => !selected.some(s => s.id === item.id)
    );

    const diverseCandidates = this.ensureSectorDiversity(remainingCandidates, selected);

    for (const item of diverseCandidates) {
      if (selected.length >= totalSlots) break;
      selected.push(item);
    }

    // Update statistics
    const selectedIds = selected.map(item => item.id);
    for (const item of selected) {
      item.lastShown = now;
      item.showCount++;
      this.items.set(item.id, item);
    }

    // Update history
    this.currentRotation = selectedIds;
    this.rotationHistory.push(selectedIds);
    if (this.rotationHistory.length > 100) {
      this.rotationHistory = this.rotationHistory.slice(-50);
    }

    this.lastRotationTime = now;
    this.rotationCount++;

    return selectedIds;
  }

  /**
   * Register active market signal
   * Triggers spotlight mode for affected item
   */
  registerSignal(signal: MarketSignal): void {
    this.activeSignals.set(signal.symbol, signal);

    // Find and update item
    for (const [id, item] of this.items) {
      if (item.symbol === signal.symbol) {
        item.signalActive = true;
        this.items.set(id, item);

        // Set spotlight override for high priority signals
        if (signal.priority >= 7) {
          this.spotlightOverride = id;

          // Auto-clear spotlight after signal duration
          setTimeout(() => {
            if (this.spotlightOverride === id) {
              this.spotlightOverride = null;
            }
          }, signal.duration);
        }
        break;
      }
    }
  }

  /**
   * Clear signal for symbol
   */
  clearSignal(symbol: string): void {
    this.activeSignals.delete(symbol);

    for (const [id, item] of this.items) {
      if (item.symbol === symbol) {
        item.signalActive = false;
        this.items.set(id, item);
        if (this.spotlightOverride === id) {
          this.spotlightOverride = null;
        }
        break;
      }
    }
  }

  /**
   * Get current rotation
   */
  getCurrentRotation(): string[] {
    return this.currentRotation;
  }

  /**
   * Get next item in rotation sequence
   */
  getNextInSequence(): string | null {
    if (this.currentRotation.length === 0) {
      this.selectNextRotation();
    }

    if (this.currentRotation.length === 0) return null;

    const item = this.currentRotation[this.rotationIndex];
    this.rotationIndex = (this.rotationIndex + 1) % this.currentRotation.length;

    return item;
  }

  /**
   * Force rotation refresh
   */
  forceRefresh(): void {
    this.selectNextRotation();
    this.rotationIndex = 0;
  }

  /**
   * Get rotation statistics
   */
  getStats(): {
    totalItems: number;
    activeRotation: number;
    rotationCount: number;
    averageShowCount: number;
    signalsActive: number;
  } {
    const items = Array.from(this.items.values());
    const totalShowCount = items.reduce((sum, item) => sum + item.showCount, 0);

    return {
      totalItems: this.items.size,
      activeRotation: this.currentRotation.length,
      rotationCount: this.rotationCount,
      averageShowCount: items.length > 0 ? totalShowCount / items.length : 0,
      signalsActive: this.activeSignals.size
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset scheduler state
   */
  reset(): void {
    for (const item of this.items.values()) {
      item.lastShown = 0;
      item.showCount = 0;
      item.signalActive = false;
    }
    this.rotationHistory = [];
    this.currentRotation = [];
    this.rotationIndex = 0;
    this.activeSignals.clear();
    this.spotlightOverride = null;
  }
}

/**
 * Rotation orchestrator for managing multiple schedulers
 * Coordinates rotation across different widget groups
 */
export class RotationOrchestrator {
  private schedulers: Map<string, RotationScheduler> = new Map();
  private intervalHandles: Map<string, NodeJS.Timeout> = new Map();
  private rotationCallbacks: Map<string, (items: string[]) => void> = new Map();

  /**
   * Create scheduler for widget group
   */
  createScheduler(
    groupId: string,
    config: SchedulerConfig,
    onRotation?: (items: string[]) => void
  ): RotationScheduler {
    const scheduler = new RotationScheduler(config);
    this.schedulers.set(groupId, scheduler);

    if (onRotation) {
      this.rotationCallbacks.set(groupId, onRotation);
    }

    return scheduler;
  }

  /**
   * Start automatic rotation for group
   */
  startRotation(groupId: string, intervalMs?: number): void {
    const scheduler = this.schedulers.get(groupId);
    if (!scheduler) return;

    // Clear existing interval
    this.stopRotation(groupId);

    const interval = intervalMs || 21000; // Default 21 seconds

    const rotate = () => {
      const items = scheduler.selectNextRotation();
      const callback = this.rotationCallbacks.get(groupId);
      if (callback) {
        callback(items);
      }
    };

    // Initial rotation
    rotate();

    // Set interval
    const handle = setInterval(rotate, interval);
    this.intervalHandles.set(groupId, handle);
  }

  /**
   * Stop automatic rotation
   */
  stopRotation(groupId: string): void {
    const handle = this.intervalHandles.get(groupId);
    if (handle) {
      clearInterval(handle);
      this.intervalHandles.delete(groupId);
    }
  }

  /**
   * Broadcast signal to all schedulers
   */
  broadcastSignal(signal: MarketSignal): void {
    for (const scheduler of this.schedulers.values()) {
      scheduler.registerSignal(signal);
    }
  }

  /**
   * Get scheduler for group
   */
  getScheduler(groupId: string): RotationScheduler | undefined {
    return this.schedulers.get(groupId);
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    // Stop all rotations
    for (const groupId of this.intervalHandles.keys()) {
      this.stopRotation(groupId);
    }

    // Clear all data
    this.schedulers.clear();
    this.rotationCallbacks.clear();
  }
}