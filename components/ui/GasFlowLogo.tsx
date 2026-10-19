import React from 'react';

interface GasFlowLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export const GasFlowLogo: React.FC<GasFlowLogoProps> = ({
  variant = 'compact',
  size = 'md',
  theme = 'light',
  className = ''
}) => {
  // Dimensions map
  const sizeMap = {
    xs: { icon: 24, font: 'text-xs', sub: 'text-[8.5px]', badge: 'text-[8px] px-1 py-0.2' },
    sm: { icon: 30, font: 'text-sm', sub: 'text-[9.5px]', badge: 'text-[8.5px] px-1.5 py-0.5' },
    md: { icon: 38, font: 'text-base', sub: 'text-[10px]', badge: 'text-[9px] px-2 py-0.5' },
    lg: { icon: 48, font: 'text-xl', sub: 'text-xs', badge: 'text-[10px] px-2.5 py-0.5' },
    xl: { icon: 60, font: 'text-2xl', sub: 'text-sm', badge: 'text-xs px-3 py-1' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic Emblem Badge */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
        style={{
          width: currentSize.icon,
          height: currentSize.icon,
        }}
      >
        <svg
          viewBox="0 0 512 512"
          width={currentSize.icon}
          height={currentSize.icon}
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Background Gradient */}
            <linearGradient id="gfBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B111E" />
              <stop offset="50%" stopColor="#111827" />
              <stop offset="100%" stopColor="#030712" />
            </linearGradient>

            {/* Outer Flow Gradient */}
            <linearGradient id="gfFlowGrad" x1="15%" y1="90%" x2="85%" y2="10%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="35%" stopColor="#2563EB" />
              <stop offset="70%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            {/* Core Energy Gradient */}
            <linearGradient id="gfCoreGrad" x1="30%" y1="100%" x2="70%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="45%" stopColor="#FBBF24" />
              <stop offset="80%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            <linearGradient id="gfHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Squircle Shell */}
          <rect x="20" y="20" width="472" height="472" rx="124" fill="url(#gfBgGrad)" />
          <rect x="20" y="20" width="472" height="472" rx="124" fill="none" stroke="#1E293B" strokeWidth="8" />
          <rect x="24" y="24" width="464" height="464" rx="120" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.3" />

          {/* Primary Droplet Body */}
          <path
            d="M 256 92 C 240 144, 202 202, 170 248 C 136 298, 122 340, 122 380 C 122 454, 182 494, 256 494 C 330 494, 390 454, 390 380 C 390 340, 376 298, 342 248 C 310 202, 272 144, 256 92 Z"
            transform="translate(0, -28) scale(1, 0.96)"
            style={{ transformOrigin: '256px 256px' }}
            fill="url(#gfFlowGrad)"
          />

          {/* Core Flame / Fuel Flow Stream */}
          <path
            d="M 256 186 C 248 220, 226 256, 208 286 C 190 316, 182 340, 182 364 C 182 406, 214 438, 256 438 C 298 438, 330 406, 330 364 C 330 340, 322 316, 304 286 C 286 256, 264 220, 256 186 Z"
            transform="translate(0, -26) scale(1, 0.94)"
            style={{ transformOrigin: '256px 256px' }}
            fill="url(#gfCoreGrad)"
          />

          {/* Core Seed Droplet Highlight */}
          <circle cx="256" cy="328" r="32" fill="#FFFFFF" fillOpacity="0.95" />
          
          {/* Sheen Highlight */}
          <path
            d="M 256 114 C 270 156, 300 208, 322 246 C 338 274, 346 304, 350 332 C 340 306, 322 274, 304 246 C 280 210, 255 166, 246 128 C 249 122, 252 118, 256 114 Z"
            fill="url(#gfHighlight)"
          />
        </svg>
      </div>

      {/* Brand Text */}
      {variant !== 'icon' && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight ${currentSize.font} ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Gas<span className="bg-gradient-to-r from-blue-600 via-sky-500 to-teal-400 bg-clip-text text-transparent">Flow</span>
            </span>
            {variant === 'full' && (
              <span
                className={`font-black uppercase tracking-wider rounded-md border ${currentSize.badge} ${
                  isDark
                    ? 'bg-blue-950/60 text-blue-300 border-blue-700/50'
                    : 'bg-blue-50 text-blue-700 border-blue-200/80'
                }`}
              >
                PRO ERP
              </span>
            )}
          </div>
          <span
            className={`font-semibold tracking-tight leading-tight mt-0.5 ${currentSize.sub} ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Petroleum Station System
          </span>
        </div>
      )}
    </div>
  );
};
