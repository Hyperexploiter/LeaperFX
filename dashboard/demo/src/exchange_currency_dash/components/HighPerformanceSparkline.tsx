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
}

export const HighPerformanceSparkline: React.FC<HighPerformanceSparklineProps> = ({
  symbol,
  buffer,
  width = 120,
  height = 50,
  color = '#FFD700',
  glowIntensity = 2,
  showStats = false,
  isSignalActive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState({ min: 0, max: 0, current: 0, change: 0 });

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
      const data = buffer.getLastN(Math.min(width, 300));
      if (data.length < 2) {
        animationFrame = requestAnimationFrame(render);
        return;
      }

      const { min, max } = buffer.getMinMax();
      const range = max - min || 1;

      // Update stats
      const current = data[data.length - 1];
      const previous = data[0];
      const change = ((current - previous) / previous) * 100;
      setStats({ min, max, current, change });

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      if (isSignalActive) {
        // Signal mode - intense colors
        gradient.addColorStop(0, change >= 0 ? '#00FF88' : '#FF4444');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        // Normal mode
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      // Draw sparkline
      ctx.beginPath();
      const scaleX = width / (data.length - 1);
      const scaleY = height / range;

      // Move to first point
      ctx.moveTo(0, height - ((data[0] - min) * scaleY));

      // Draw line
      for (let i = 1; i < data.length; i++) {
        const x = i * scaleX;
        const y = height - ((data[i] - min) * scaleY);
        ctx.lineTo(x, y);
      }

      // Apply styles
      ctx.strokeStyle = isSignalActive ? (change >= 0 ? '#00FF88' : '#FF4444') : color;
      ctx.lineWidth = isSignalActive ? 2 : 1.5;
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

      // Reset shadow
      ctx.shadowBlur = 0;

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [buffer, width, height, color, glowIntensity, isSignalActive]);

  return (
    <div className="relative" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          imageRendering: 'crisp-edges'
        }}
      />

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