/**
 * Bloomberg Terminal Design System
 * Centralized color palette and styling constants for unified dashboard appearance
 */

export const TERMINAL_COLORS = {
  // Primary brand colors
  primary: {
    orange: '#FFA500',      // Headers, symbols, primary labels
    blue: '#4A90E2',        // Secondary text, metadata
    cyan: '#00D4FF',        // Accents, borders
    gold: '#FFD700',        // Alternative accent
  },

  // Trend indicators
  trend: {
    up: '#00FF88',          // Positive changes (neon green)
    down: '#FF4444',        // Negative changes (bright red)
  },

  // Background gradients
  background: {
    card: 'linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)',
    cardDark: '#000000',
    cardMid: '#000814',
    cardLight: '#001428',
  },

  // Border colors
  border: {
    default: 'rgba(0, 150, 255, 0.2)',
    movers: 'rgba(255, 165, 0, 0.28)',
    hover: 'rgba(0, 212, 255, 0.4)',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#4A90E2',
    muted: '#666666',
    disabled: '#999999',
  },

  // Overlay effects
  overlay: {
    blue: 'radial-gradient(140% 90% at 80% 0%, rgba(0, 212, 255, 0.18) 0%, rgba(0, 120, 200, 0.10) 40%, rgba(0,0,0,0) 70%)',
  },
} as const;

export const TERMINAL_TYPOGRAPHY = {
  // Font families
  fonts: {
    mono: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    display: "monospace",
  },

  // Font sizes (in px)
  sizes: {
    symbol: 16,        // text-base
    price: 16,         // text-base
    label: 12,         // text-xs
    change: 12,        // text-xs
    metadata: 10,      // text-[10px]
  },

  // Font weights
  weights: {
    bold: 700,
    semibold: 600,
    normal: 400,
  },

  // Letter spacing
  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

export const TERMINAL_SPACING = {
  // Card dimensions
  card: {
    height: 90,                    // Standard card height
    heightPx: '90px',
    padding: {
      horizontal: 12,              // px-3
      vertical: 0,                 // Flex centering
    },
  },

  // Gap between elements
  gap: {
    grid: 8,                       // gap-2
    stack: 8,                      // space-y-2
    inline: 4,                     // ml-1, mr-1
  },

  // Sparkline dimensions
  sparkline: {
    small: { width: 120, height: 50 },
    large: { width: 240, height: 70 },
  },
} as const;

export const TERMINAL_ANIMATIONS = {
  // Animation durations
  duration: {
    fast: '200ms',
    normal: '300ms',
    slow: '600ms',
  },

  // Animation easing
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'ease-in-out',
  },

  // Blue pulse configuration
  bluePulse: {
    defaultSpeed: 6,              // seconds
    defaultOpacity: 1.0,
    minSpeed: 2,
    maxSpeed: 12,
    minOpacity: 0.05,
    maxOpacity: 1.0,
  },
} as const;
