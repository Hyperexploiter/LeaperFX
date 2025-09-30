/**
 * Signal Effects Component
 * Implements pause-on-signal visual effects with expansion, glow, and QR overlay
 */

import React, { useState, useEffect, useRef } from 'react';
import { MarketSignal } from '../services/SignalDetectionEngine';

interface SignalEffectsProps {
  signal: MarketSignal | null;
  children: React.ReactNode;
  onSignalEnd?: () => void;
}

/**
 * Visual effects wrapper for pause-on-signal
 */
export const SignalEffects: React.FC<SignalEffectsProps> = ({
  signal,
  children,
  onSignalEnd
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (signal && signal.priority >= 7) {
      // Trigger expansion
      setIsExpanded(true);
      setPulseIntensity(signal.priority);

      // Show QR after delay
      setTimeout(() => setShowQR(true), 500);

      // Auto-dismiss
      const timer = setTimeout(() => {
        setIsExpanded(false);
        setShowQR(false);
        setPulseIntensity(0);
        if (onSignalEnd) onSignalEnd();
      }, signal.duration);

      return () => clearTimeout(timer);
    }
  }, [signal, onSignalEnd]);

  const getGlowColor = () => {
    if (!signal) return 'transparent';
    return signal.direction === 'up' ? '#00FF88' : '#FF4444';
  };

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-500 ${
        isExpanded ? 'scale-150 z-50' : 'scale-100 z-auto'
      }`}
      style={{
        boxShadow: isExpanded
          ? `0 0 ${20 + pulseIntensity * 5}px ${getGlowColor()}`
          : 'none',
        animation: isExpanded ? 'pulse 1s infinite' : 'none'
      }}
    >
      {children}

      {/* Signal overlay */}
      {isExpanded && signal && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Stats overlay */}
          <div className="absolute top-2 right-2 bg-black/90 px-2 py-1 rounded">
            <div className="text-xs font-mono" style={{ color: getGlowColor() }}>
              {signal.metadata.priceChange > 0 ? '+' : ''}
              {signal.metadata.priceChange?.toFixed(2)}% in {Math.round(signal.duration / 60000)}m
            </div>
          </div>

          {/* QR Code placeholder */}
          {showQR && (
            <div className="absolute bottom-2 left-2 bg-white p-2 rounded">
              <div className="w-16 h-16 bg-black/10 flex items-center justify-center">
                <span className="text-xs">QR</span>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

/**
 * Ticker takeover component for bottom bar
 */
export const TickerTakeover: React.FC<{
  signal: MarketSignal | null;
  duration?: number;
}> = ({ signal, duration = 8000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (signal && signal.priority >= 8) {
      setIsVisible(true);
      setProgress(0);

      // Animate progress bar
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsVisible(false), 500);
            return 100;
          }
          return prev + (100 / (duration / 100));
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [signal, duration]);

  if (!isVisible || !signal) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] transform transition-transform duration-500"
         style={{ transform: isVisible ? 'translateY(0)' : 'translateY(100%)' }}>
      <div className="relative bg-gradient-to-r from-black via-gray-900 to-black border-t-2"
           style={{ borderColor: signal.direction === 'up' ? '#00FF88' : '#FF4444' }}>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-0.5 transition-all duration-100"
             style={{
               width: `${progress}%`,
               background: signal.direction === 'up' ? '#00FF88' : '#FF4444'
             }} />

        <div className="flex items-center justify-between px-6 py-3">
          {/* Signal info */}
          <div className="flex items-center space-x-4">
            <div className="animate-pulse">
              <div className="w-3 h-3 rounded-full"
                   style={{ background: signal.direction === 'up' ? '#00FF88' : '#FF4444' }} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {signal.symbol} ALERT
              </div>
              <div className="text-xs" style={{ color: '#FFA500' }}>
                {signal.type.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-mono font-bold"
                   style={{ color: signal.direction === 'up' ? '#00FF88' : '#FF4444' }}>
                {signal.metadata.priceChange > 0 ? '+' : ''}
                {signal.metadata.priceChange?.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400">CHANGE</div>
            </div>

            {signal.metadata.volatility && (
              <div className="text-center">
                <div className="text-lg font-mono font-bold text-yellow-400">
                  {(signal.metadata.volatility * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">VOLATILITY</div>
              </div>
            )}

            {/* QR Code */}
            <div className="flex items-center space-x-2 border-l pl-6 border-gray-700">
              <div className="bg-white p-2 rounded">
                <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-600">QR</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">SCAN FOR</div>
                <div className="text-sm font-bold" style={{ color: '#FFA500' }}>
                  LIVE RATE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Performance monitor overlay
 */
export const PerformanceMonitor: React.FC<{
  fps: number;
  frameTime: number;
  visible?: boolean;
}> = ({ fps, frameTime, visible = false }) => {
  if (!visible) return null;

  const getFPSColor = () => {
    if (fps >= 55) return '#00FF88';
    if (fps >= 30) return '#FFA500';
    return '#FF4444';
  };

  return (
    <div className="fixed top-4 right-4 bg-black/90 border border-gray-700 rounded p-3 font-mono text-xs z-[90]">
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">FPS:</span>
          <span style={{ color: getFPSColor() }} className="ml-4 font-bold">
            {fps}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Frame:</span>
          <span className="ml-4 text-white">
            {frameTime.toFixed(2)}ms
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Target:</span>
          <span className="ml-4 text-gray-500">
            ≤12ms @ 4K
          </span>
        </div>
      </div>
    </div>
  );
};