export type ThemeCategory = 'forex' | 'commodity' | 'crypto';

export interface SparklineTheme {
  colorUp: string;
  colorDown: string;
  glowIntensity: number;
  smoothingFactor: number;
  baseLineWidth: number;
  maxLineWidth: number;
}

const BASE_THEMES: Record<ThemeCategory, SparklineTheme> = {
  forex: {
    colorUp: '#FFD700', // gold
    colorDown: '#8B0000', // deep red
    glowIntensity: 2,     // slightly lower glow for storefront readability
    smoothingFactor: 0.30,
    baseLineWidth: 1.25,
    maxLineWidth: 2.4,
  },
  commodity: {
    colorUp: '#FFD700',
    colorDown: '#8B0000',
    glowIntensity: 2,
    smoothingFactor: 0.20,
    baseLineWidth: 1.10,
    maxLineWidth: 2.2,
  },
  crypto: {
    colorUp: '#00FF88',
    colorDown: '#FF4444',
    glowIntensity: 4,
    smoothingFactor: 0.25,
    baseLineWidth: 1.3,
    maxLineWidth: 2.6,
  }
};

export function getSparklineTheme(category: ThemeCategory): SparklineTheme {
  const env = getDisplayEnv();
  const base = BASE_THEMES[category];
  const mult = env === 'bright' ? 0.85 : env === 'dim' ? 1.15 : 1.0;
  const smoothAdj = env === 'bright' ? -0.02 : env === 'dim' ? +0.02 : 0;
  return {
    ...base,
    glowIntensity: Math.max(1, base.glowIntensity * mult),
    smoothingFactor: Math.max(0.15, Math.min(0.4, base.smoothingFactor + smoothAdj))
  };
}

type DisplayEnv = 'auto' | 'bright' | 'normal' | 'dim';

export function getDisplayEnv(): DisplayEnv {
  try {
    const vite = (typeof import.meta !== 'undefined') ? (import.meta as any).env?.VITE_DISPLAY_ENV : undefined;
    const win = (typeof window !== 'undefined') ? (window as any).__ENV__?.VITE_DISPLAY_ENV : undefined;
    const node = (typeof process !== 'undefined') ? (process as any).env?.VITE_DISPLAY_ENV : undefined;
    const raw = String(vite ?? win ?? node ?? '').toLowerCase();
    if (raw === 'bright' || raw === 'dim' || raw === 'normal' || raw === 'auto') return raw as DisplayEnv;
  } catch {}
  return 'auto';
}
