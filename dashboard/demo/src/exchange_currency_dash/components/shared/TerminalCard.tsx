/**
 * TerminalCard Component
 * Unified Bloomberg terminal-style card wrapper
 * Provides consistent styling, blue pulse overlay, and animations across all dashboard sections
 */

import React from 'react';
import { useBlueOverlayParams } from '../../hooks/useBlueOverlayParams';
import { TERMINAL_SPACING } from '../../config/terminalTheme';

export interface TerminalCardProps {
  /** Card content */
  children: React.ReactNode;

  /** Card height (default: 90px) */
  height?: string | number;

  /** Visual variant for different sections */
  variant?: 'forex' | 'crypto' | 'commodity' | 'mover' | 'index';

  /** Additional CSS classes */
  className?: string;

  /** Show blue pulse overlay (default: true) */
  showBlueOverlay?: boolean;

  /** Featured/highlighted state */
  featured?: boolean;
}

/**
 * Unified terminal card component with Bloomberg aesthetic
 * Handles blue overlay, animations, and consistent styling
 */
export const TerminalCard: React.FC<TerminalCardProps> = ({
  children,
  height = TERMINAL_SPACING.card.heightPx,
  variant = 'crypto',
  className = '',
  showBlueOverlay = true,
  featured = false,
}) => {
  const blueParams = useBlueOverlayParams();

  // Normalize height to string with px suffix
  const heightStr = typeof height === 'number' ? `${height}px` : height;

  // Build class names
  const cardClasses = [
    'relative',
    'overflow-hidden',
    'transition-all',
    'duration-300',
    'bloomberg-terminal-card',
    'movers-card',
    'slide-up',
    'data-update',
    'min-w-0',
    featured && 'ring-1 ring-orange-500/50',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      style={{ height: heightStr }}
      data-variant={variant}
    >
      {/* Blue pulse overlay - rendered first for proper z-indexing */}
      {showBlueOverlay && (
        <div
          className="card-blue-inner blue-pulse"
          style={{
            opacity: blueParams.opacity,
            animationDuration: `${blueParams.speed}s`
          }}
        />
      )}

      {/* Card content */}
      {children}
    </div>
  );
};

export default TerminalCard;
