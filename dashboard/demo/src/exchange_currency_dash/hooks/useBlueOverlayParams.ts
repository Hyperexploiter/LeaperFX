/**
 * useBlueOverlayParams Hook
 * Extracts blue pulse overlay configuration from environment variables
 * Provides consistent animation parameters across all terminal cards
 */

import { useMemo } from 'react';
import { TERMINAL_ANIMATIONS } from '../config/terminalTheme';

export interface BlueOverlayParams {
  speed: number;    // Animation duration in seconds
  opacity: number;  // Overlay opacity (0.05 - 1.0)
}

/**
 * Reads blue pulse configuration from env with fallbacks
 * Supports Vite, window.__ENV__, and process.env
 */
export function useBlueOverlayParams(): BlueOverlayParams {
  return useMemo(() => {
    try {
      // Multi-environment variable resolution
      const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env : undefined;
      const winEnv = (typeof window !== 'undefined') ? (window as any).__ENV__ : undefined;
      const nodeEnv = (typeof process !== 'undefined') ? (process as any).env : undefined;

      // Read speed configuration
      const speedRaw = String(
        (vite && vite.VITE_BLUE_PULSE_SPEED) ||
        (winEnv && winEnv.VITE_BLUE_PULSE_SPEED) ||
        (nodeEnv && nodeEnv.VITE_BLUE_PULSE_SPEED) ||
        TERMINAL_ANIMATIONS.bluePulse.defaultSpeed
      );

      // Read opacity configuration
      const opacRaw = String(
        (vite && vite.VITE_BLUE_WASH_OPACITY) ||
        (winEnv && winEnv.VITE_BLUE_WASH_OPACITY) ||
        (nodeEnv && nodeEnv.VITE_BLUE_WASH_OPACITY) ||
        TERMINAL_ANIMATIONS.bluePulse.defaultOpacity
      );

      // Parse and clamp values
      const speed = Math.max(
        TERMINAL_ANIMATIONS.bluePulse.minSpeed,
        Math.min(TERMINAL_ANIMATIONS.bluePulse.maxSpeed, parseFloat(speedRaw))
      );

      const opacity = Math.max(
        TERMINAL_ANIMATIONS.bluePulse.minOpacity,
        Math.min(TERMINAL_ANIMATIONS.bluePulse.maxOpacity, parseFloat(opacRaw))
      );

      return { speed, opacity };
    } catch (error) {
      // Fallback to defaults on error
      return {
        speed: TERMINAL_ANIMATIONS.bluePulse.defaultSpeed,
        opacity: TERMINAL_ANIMATIONS.bluePulse.defaultOpacity
      };
    }
  }, []); // Computed once per component mount
}
