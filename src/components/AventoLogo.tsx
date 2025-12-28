import React from 'react';

interface AventoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon-only' | 'with-text' | 'full';
  className?: string;
}

export function AventoLogo({ 
  size = 'md', 
  variant = 'icon-only',
  className = '' 
}: AventoLogoProps) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Image */}
      <img
        src="/assets/avento-logo.png"
        alt="Avento Logo"
        className={`${sizeMap[size]} object-contain flex-shrink-0`}
      />

      {/* Text Variants */}
      {variant === 'with-text' && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold bg-gradient-to-r from-blue-500 via-pink-500 to-orange-500 bg-clip-text text-transparent ${textSizeMap[size]}`}>
            AVENTO
          </span>
        </div>
      )}

      {variant === 'full' && (
        <div className="flex flex-col">
          <span className={`font-bold bg-gradient-to-r from-blue-500 via-pink-500 to-orange-500 bg-clip-text text-transparent ${textSizeMap[size]}`}>
            AVENTO
          </span>
          <span className="text-xs text-slate-500 leading-tight">Matchmaking the spot of friendships</span>
        </div>
      )}
    </div>
  );
}
