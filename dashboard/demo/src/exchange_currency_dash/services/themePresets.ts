export type ThemeCategory = 'forex' | 'commodity' | 'crypto';

export interface SparklineTheme {
  colorUp: string;
  colorDown: string;
  glowIntensity: number;
  smoothingFactor: number;
  baseLineWidth: number;
  maxLineWidth: number;
}

const THEMES: Record<ThemeCategory, SparklineTheme> = {
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
  return THEMES[category];
}
