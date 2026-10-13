import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  badge?: string;
  badgePositive?: boolean;
  icon: React.ElementType;
  indicatorColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  badge,
  badgePositive = true,
  icon: Icon,
  indicatorColor = '#2563EB',
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-[#ECEEF2] shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all hover:shadow-md hover:border-slate-300 relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: indicatorColor }}
      />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {value}
          </div>
        </div>
        <div
          className="p-2.5 rounded-xl text-white shadow-sm shrink-0"
          style={{ backgroundColor: indicatorColor }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtext || badge) && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {badge && (
            <span
              className={`font-bold px-1.5 py-0.5 rounded-md ${
                badgePositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {badge}
            </span>
          )}
          {subtext && <span className="text-slate-500 font-medium truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
