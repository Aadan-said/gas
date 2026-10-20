import React, { useId } from 'react';

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
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  // Dimensions map with balanced icon sizes & crisp typography
  const sizeMap = {
    xs: { icon: 26, font: 'text-[13px]', sub: 'text-[8.5px]', badge: 'text-[8px] px-1 py-0.2', radius: 'rounded-lg' },
    sm: { icon: 32, font: 'text-sm', sub: 'text-[9.5px]', badge: 'text-[8.5px] px-1.5 py-0.5', radius: 'rounded-lg' },
    md: { icon: 38, font: 'text-base', sub: 'text-[10px]', badge: 'text-[9px] px-2 py-0.5', radius: 'rounded-xl' },
    lg: { icon: 48, font: 'text-xl', sub: 'text-xs', badge: 'text-[10px] px-2.5 py-0.5', radius: 'rounded-xl' },
    xl: { icon: 60, font: 'text-2xl', sub: 'text-sm', badge: 'text-xs px-3 py-1', radius: 'rounded-2xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isDark = theme === 'dark';

  const flowGradId = `gfFlow_${uid}`;
  const coreGradId = `gfCore_${uid}`;
  const glowGradId = `gfGlow_${uid}`;

  return (
    <div className={`flex items-center gap-2 select-none shrink-0 ${className}`}>
      {/* ── Dynamic Emblem Badge ── */}
      <div
        className={`relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${currentSize.radius} bg-[#0A0F1D] border border-slate-800/90 shadow-md shadow-blue-950/20`}
        style={{
          width: currentSize.icon,
          height: currentSize.icon,
          padding: '2px'
        }}
      >
        <svg
          viewBox="0 0 512 512"
          width="100%"
          height="100%"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer Droplet Gradient (Electric Sapphire to Cyan) */}
            <linearGradient id={flowGradId} x1="20%" y1="95%" x2="80%" y2="5%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="40%" stopColor="#2563EB" />
              <stop offset="75%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>

            {/* Core Energy Flame (Amber-Gold to Clean Fuel Emerald) */}
            <linearGradient id={coreGradId} x1="30%" y1="100%" x2="70%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="45%" stopColor="#FBBF24" />
              <stop offset="85%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            {/* Atmosphere Glow */}
            <radialGradient id={glowGradId} cx="50%" cy="60%" r="55%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0A0F1D" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Deep Dark Squircle Base */}
          <rect x="16" y="16" width="480" height="480" rx="120" fill="#0A0F1D" />
          <rect x="16" y="16" width="480" height="480" rx="120" fill="none" stroke="#1E293B" strokeWidth="6" />

          {/* Core Ambient Glow */}
          <circle cx="256" cy="280" r="160" fill={`url(#${glowGradId})`} />

          {/* Fuel Droplet Stream (Left swoosh dynamic) */}
          <path
            d="M 175 340 C 155 310, 148 270, 165 230 C 172 215, 188 192, 205 175 C 196 198, 188 226, 195 254 C 200 276, 215 300, 230 320 C 208 332, 190 338, 175 340 Z"
            fill="#38BDF8"
            opacity="0.45"
          />

          {/* Primary Fuel Droplet Body */}
          <path
            d="M 256 82 C 240 138, 202 200, 170 248 C 136 298, 120 342, 120 384 C 120 458, 180 500, 256 500 C 332 500, 392 458, 392 384 C 392 342, 376 298, 342 248 C 310 200, 272 138, 256 82 Z"
            transform="translate(0, -28) scale(1, 0.96)"
            style={{ transformOrigin: '256px 256px' }}
            fill={`url(#${flowGradId})`}
          />

          {/* Inner Energy Flame / Fuel Vortex */}
          <path
            d="M 256 182 C 248 218, 224 256, 206 288 C 188 320, 180 346, 180 370 C 180 414, 214 446, 256 446 C 298 446, 332 414, 332 370 C 332 346, 324 320, 306 288 C 288 256, 264 218, 256 182 Z"
            transform="translate(0, -26) scale(1, 0.94)"
            style={{ transformOrigin: '256px 256px' }}
            fill={`url(#${coreGradId})`}
          />

          {/* Seed Highlight Droplet (Bright White Core) */}
          <circle cx="256" cy="336" r="26" fill="#FFFFFF" fillOpacity="0.95" />

          {/* Sheen Highlight Curve */}
          <path
            d="M 256 112 C 270 156, 302 210, 324 248 C 340 278, 348 308, 350 336 C 340 310, 322 278, 304 250 C 280 214, 256 168, 246 128 C 249 122, 252 116, 256 112 Z"
            fill="#FFFFFF"
            fillOpacity="0.65"
          />
        </svg>
      </div>

      {/* ── Brand Typography: Clean, Authoritative, Executive ── */}
      {variant !== 'icon' && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight ${currentSize.font} ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Gas<span className="text-blue-600 font-black">Flow</span>
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
