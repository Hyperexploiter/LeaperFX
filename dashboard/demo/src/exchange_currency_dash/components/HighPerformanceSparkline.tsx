/**
 * High-Performance Sparkline Component
 * Canvas-based rendering with zero DOM manipulation
 */

import React, { useRef, useEffect, useState } from 'react';
import { RingBuffer } from '../services/RingBuffer';

interface HighPerformanceSparklineProps {
  symbol: string;
  buffer: RingBuffer;
  width?: number;
  height?: number;
  color?: string;
  glowIntensity?: number;
  showStats?: boolean;
  isSignalActive?: boolean;
  volatilityAdaptive?: boolean;
  baseLineWidth?: number;
  maxLineWidth?: number;
  smoothingFactor?: number; // 0..1 EMA smoothing
  expandOnHover?: boolean;
  expandedWidth?: number;
  expandedHeight?: number;
  // Neon area style with white (or specified) core line and glowing under-fill
  renderMode?: 'line' | 'areaNeon';
  lineColor?: string; // used in areaNeon; defaults to '#FFFFFF'
  areaTopColor?: string; // gradient start color for fill (defaults derived from color)
  areaBottomColor?: string; // gradient end color (defaults to transparent)
  glowPulseSpeed?: number; // pulses per second for glow modulation
}

export const HighPerformanceSparkline: React.FC<HighPerformanceSparklineProps> = ({
  symbol,
  buffer,
  width = 120,
  height = 50,
  color = '#FFD700',
  glowIntensity = 2,
  showStats = false,
  isSignalActive = false,
  volatilityAdaptive = true,
  baseLineWidth = 1.25,
  maxLineWidth = 2.5,
  smoothingFactor = 0.25,
  expandOnHover = false,
  expandedWidth = 240,
  expandedHeight = 100,
  renderMode = 'line',
  lineColor = '#FFFFFF',
  areaTopColor,
  areaBottomColor,
  glowPulseSpeed = 0.6
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const expandedRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState(false);
  const [stats, setStats] = useState({ min: 0, max: 0, current: 0, change: 0 });

  // Helpers to build gradients from various color inputs (#hex or rgb/rgba)
  const parseHex = (hex: string): [number, number, number] | null => {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
    if (!m) return null;
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  };
  const parseRgb = (rgb: string): [number, number, number] | null => {
    const m = rgb.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
    if (!m) return null;
    return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  };
  const toRgba = (c: string, a: number): string => {
    const hex = parseHex(c);
    if (hex) return `rgba(${hex[0]}, ${hex[1]}, ${hex[2]}, ${a})`;
    const rgb = parseRgb(c);
    if (rgb) return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
    // Fallback to provided color if unknown format
    return c;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false
    });

    if (!ctx) return;

    // Set canvas resolution for high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    let animationFrame: number;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get data
      const raw = buffer.getLastN(Math.min(width, 300));
      if (raw.length < 2) {
        animationFrame = requestAnimationFrame(render);
        return;
      }

      // EMA smoothing (optional)
      const data = new Float32Array(raw.length);
      if (smoothingFactor > 0 && smoothingFactor < 1) {
        data[0] = raw[0];
        for (let i = 1; i < raw.length; i++) {
          data[i] = smoothingFactor * raw[i] + (1 - smoothingFactor) * data[i - 1];
        }
      } else {
        data.set(raw);
      }

      const { min, max } = buffer.getMinMax();
      const range = max - min || 1;

      // Update stats
      const current = data[data.length - 1];
      const previous = data[0];
      const change = ((current - previous) / previous) * 100;
      setStats({ min, max, current, change });

      // Create gradient (base)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      if (renderMode === 'areaNeon') {
        const top = areaTopColor || toRgba(color, 0.85);
        const bottom = areaBottomColor || 'rgba(0,0,0,0)';
        gradient.addColorStop(0, top);
        gradient.addColorStop(1, bottom);
      } else {
        if (isSignalActive) {
          gradient.addColorStop(0, change >= 0 ? '#00FF88' : '#FF4444');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          gradient.addColorStop(0, toRgba(color, 0.9));
          gradient.addColorStop(0.5, toRgba(color, 0.45));
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
      }

      const scaleX = width / (data.length - 1);
      const scaleY = height / range;

      if (renderMode === 'areaNeon') {
        // Area under curve
        ctx.beginPath();
        ctx.moveTo(0, height - ((data[0] - min) * scaleY));
        for (let i = 1; i < data.length; i++) {
          const x = i * scaleX;
          const y = height - ((data[i] - min) * scaleY);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Pulsating glow halo under the core line
        const t = performance.now() * 0.001;
        const pulse = 0.15 + 0.20 * (0.5 + 0.5 * Math.sin(t * (Math.max(glowPulseSpeed, 0.1)) * Math.PI * 2));

        // Halo stroke (wide, low alpha)
        ctx.beginPath();
        ctx.moveTo(0, height - ((data[0] - min) * scaleY));
        for (let i = 1; i < data.length; i++) {
          const x = i * scaleX;
          const y = height - ((data[i] - min) * scaleY);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = toRgba(lineColor, pulse);
        let lw = baseLineWidth;
        if (volatilityAdaptive) {
          const s = buffer.getStats(100);
          const denom = Math.abs(s.mean) > 1e-6 ? Math.abs(s.mean) : 1;
          const rel = Math.min((s.stdDev / denom) * 10, 1);
          lw = baseLineWidth + (maxLineWidth - baseLineWidth) * rel;
        }
        ctx.lineWidth = Math.max(lw * 2.4, 2.4);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowColor = toRgba(lineColor, 0.6);
        ctx.shadowBlur = glowIntensity * 4;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Core line (sharp)
        ctx.beginPath();
        ctx.moveTo(0, height - ((data[0] - min) * scaleY));
        for (let i = 1; i < data.length; i++) {
          const x = i * scaleX;
          const y = height - ((data[i] - min) * scaleY);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = Math.max(lw * 1.1, 1.4);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      } else {
        // Legacy line + fill mode
        ctx.beginPath();
        ctx.moveTo(0, height - ((data[0] - min) * scaleY));
        for (let i = 1; i < data.length; i++) {
          const x = i * scaleX;
          const y = height - ((data[i] - min) * scaleY);
          ctx.lineTo(x, y);
        }
        // Apply styles
        ctx.strokeStyle = isSignalActive ? (change >= 0 ? '#00FF88' : '#FF4444') : color;
        // Volatility-aware stroke width
        let lineWidth = baseLineWidth;
        if (volatilityAdaptive) {
          const s = buffer.getStats(100);
          const denom = Math.abs(s.mean) > 0.000001 ? Math.abs(s.mean) : 1;
          const rel = Math.min((s.stdDev / denom) * 10, 1); // clamp 0..1 roughly
          lineWidth = baseLineWidth + (maxLineWidth - baseLineWidth) * rel;
        }
        ctx.lineWidth = isSignalActive ? Math.max(lineWidth, 2) : lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        // Add glow effect
        if (glowIntensity > 0 || isSignalActive) {
          ctx.shadowColor = ctx.strokeStyle as string;
          ctx.shadowBlur = isSignalActive ? 10 : glowIntensity;
        }
        ctx.stroke();
        // Fill area under line
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Reset shadow
      ctx.shadowBlur = 0;

      // Expanded overlay rendering
      if (expandOnHover && hovered && expandedRef.current) {
        const ctx2 = expandedRef.current.getContext('2d');
        if (ctx2) {
          const dpr2 = window.devicePixelRatio || 1;
          expandedRef.current.width = expandedWidth * dpr2;
          expandedRef.current.height = expandedHeight * dpr2;
          expandedRef.current.style.width = `${expandedWidth}px`;
          expandedRef.current.style.height = `${expandedHeight}px`;
          ctx2.setTransform(1, 0, 0, 1, 0, 0);
          ctx2.scale(dpr2, dpr2);
          ctx2.clearRect(0, 0, expandedWidth, expandedHeight);
          const gradient2 = ctx2.createLinearGradient(0, 0, 0, expandedHeight);
          gradient2.addColorStop(0, toRgba(color, 0.9));
          gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx2.strokeStyle = ctx.strokeStyle as string;
          ctx2.lineWidth = Math.max(lineWidth, 2);
          ctx2.lineJoin = 'round';
          ctx2.lineCap = 'round';
          ctx2.shadowColor = ctx2.strokeStyle as string;
          ctx2.shadowBlur = 10;
          // Draw expanded series
          ctx2.beginPath();
          const scaleX2 = expandedWidth / (data.length - 1);
          const { min: min2, max: max2 } = buffer.getMinMax();
          const range2 = max2 - min2 || 1;
          const scaleY2 = expandedHeight / range2;
          ctx2.moveTo(0, expandedHeight - ((data[0] - min2) * scaleY2));
          for (let i = 1; i < data.length; i++) {
            const x = i * scaleX2;
            const y = expandedHeight - ((data[i] - min2) * scaleY2);
            ctx2.lineTo(x, y);
          }
          ctx2.stroke();
          ctx2.lineTo(expandedWidth, expandedHeight);
          ctx2.lineTo(0, expandedHeight);
          ctx2.closePath();
          ctx2.fillStyle = gradient2;
          ctx2.fill();
          ctx2.shadowBlur = 0;
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [buffer, width, height, color, glowIntensity, isSignalActive, volatilityAdaptive, baseLineWidth, maxLineWidth, smoothingFactor, expandOnHover, expandedWidth, expandedHeight, hovered, renderMode, lineColor, areaTopColor, areaBottomColor, glowPulseSpeed]);

  return (
    <div
      className="relative"
      style={{ width, height }}
      onMouseEnter={() => expandOnHover && setHovered(true)}
      onMouseLeave={() => expandOnHover && setHovered(false)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: 'crisp-edges'
        }}
      />

      {expandOnHover && hovered && (
        <div
          className="absolute -top-1/2 left-1/2 -translate-x-1/2 z-20 p-1"
          style={{ background: 'rgba(0,0,0,0.7)', border: '0.5px solid rgba(0,212,255,0.3)' }}
        >
          <canvas ref={expandedRef} />
        </div>
      )}

      {showStats && (
        <div className="absolute top-0 right-0 text-xs font-mono p-1 bg-black/60 rounded">
          <span style={{ color: stats.change >= 0 ? '#00FF88' : '#FF4444' }}>
            {stats.change >= 0 ? '▲' : '▼'} {Math.abs(stats.change).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};
