import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'compact';
  className?: string;
  size?: number;
  color?: string;
}

/**
 * AlphaIcon — Recreated faithfully from the supplied Alpha Terminal brand reference.
 * Distinctive Greek Alpha symbol with integrated rising financial bars, slanted top cut,
 * swooping bottom tail, and transparent background.
 */
export const AlphaIcon: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 32,
  color = 'var(--accent, #C05621)',
  className = '',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={`logo-icon ${className}`}
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      {/* Main Greek Alpha loop and sweeping tail */}
      <path
        fill={color}
        fillRule="evenodd"
        d="M 10.5 40.1 L 7.3 47.1 L 5.1 55.0 L 5.0 67.2 L 6.3 71.9 L 8.5 76.5 L 12.6 81.2 L 16.3 83.7 L 22.3 85.6 L 27.9 85.6 L 37.7 82.4 L 44.4 78.2 L 53.1 71.0 L 59.2 64.6 L 59.8 60.4 L 61.7 69.2 L 63.9 75.1 L 67.0 79.5 L 72.0 83.5 L 77.2 84.9 L 84.5 84.6 L 89.9 82.3 L 94.6 77.9 L 94.6 77.4 L 93.8 77.1 L 88.4 78.5 L 83.8 78.0 L 81.5 76.9 L 79.1 74.5 L 75.9 67.8 L 72.4 48.8 L 72.9 47.0 L 73.4 49.6 L 74.3 49.9 L 82.3 40.4 L 94.6 27.6 L 95.0 17.0 L 94.5 16.1 L 90.0 18.5 L 84.1 22.7 L 78.6 28.0 L 72.0 36.6 L 72.0 44.0 L 69.0 32.1 L 64.9 23.1 L 61.2 19.3 L 56.8 16.3 L 53.6 15.2 L 47.7 14.4 L 39.0 15.3 L 33.7 17.3 L 28.0 20.5 L 22.6 24.8 L 17.9 29.5 L 13.7 34.9 Z M 47.5 21.9 L 49.8 22.9 L 51.3 24.5 L 54.8 31.0 L 57.1 40.3 L 58.4 50.8 L 48.8 62.5 L 36.6 74.7 L 30.6 78.8 L 26.8 79.7 L 24.9 78.9 L 22.4 75.6 L 21.3 72.8 L 20.5 66.6 L 21.3 54.8 L 23.5 47.0 L 28.9 36.1 L 34.0 29.6 L 40.2 24.1 L 45.3 22.0 Z"
      />
      {/* Outer rising financial bar */}
      <path
        fill={color}
        d="M 93.7 36.6 L 90.0 38.6 L 86.9 41.8 L 86.7 73.1 L 87.7 74.0 L 93.6 74.0 L 94.7 73.0 L 94.7 37.9 Z"
      />
      {/* Inner rising financial bar */}
      <path
        fill={color}
        d="M 83.9 48.4 L 78.5 52.6 L 77.4 54.3 L 77.6 66.8 L 79.8 73.0 L 81.3 74.0 L 83.9 73.9 L 84.5 72.4 L 84.5 49.1 Z"
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  className = '',
  size = 32,
  color,
}) => {
  const iconSize = variant === 'compact' ? Math.round(size * 0.9) : size;

  if (variant === 'icon') {
    return (
      <span className={`logo-wrapper logo-icon-only ${className}`}>
        <AlphaIcon size={iconSize} color={color} />
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`logo-wrapper logo-compact ${className}`}>
        <AlphaIcon size={iconSize} color={color} />
        <span className="logo-wordmark logo-wordmark--compact">AT</span>
      </div>
    );
  }

  // Full variant matching reference: Mark + ALPHA TERMINAL + AI RESEARCH
  return (
    <div className={`logo-wrapper logo-full ${className}`}>
      <AlphaIcon size={iconSize} color={color} />
      <div className="logo-text">
        <span className="logo-name">ALPHA TERMINAL</span>
        <span className="logo-sub">AI RESEARCH</span>
      </div>
    </div>
  );
};
