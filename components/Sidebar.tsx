'use client';

import React from 'react';
import {
  LayoutDashboard,
  Fuel,
  Database,
  Layers,
  Users,
  Wallet,
  BarChart3,
  ShieldCheck,
  Settings,
  RefreshCw,
  Flame,
  Radio,
  Wifi,
  WifiOff,
  Zap,
  X
} from 'lucide-react';
import { NetworkMode, UserRole } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  networkMode: NetworkMode;
  userRole: UserRole;
  language: Language;
  pendingSyncCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  networkMode,
  userRole,
  language,
  pendingSyncCount,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const t = translations[language];

  const navItems = [
    { id: 'dashboard', label: t.dashboard,   icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'accountant'] },
    { id: 'sales',     label: t.sales,       icon: Fuel,            roles: ['admin', 'manager', 'cashier', 'accountant'] },
    { id: 'tanks',     label: t.tanks,       icon: Database,        roles: ['admin', 'manager', 'accountant'] },
    { id: 'inventory', label: t.inventory,   icon: Layers,          roles: ['admin', 'manager', 'accountant'] },
    { id: 'customers', label: t.customers,   icon: Users,           roles: ['admin', 'manager', 'accountant', 'cashier'] },
    { id: 'finance',   label: t.finance,     icon: Wallet,          roles: ['admin', 'manager', 'accountant'] },
    { id: 'reports',   label: t.reports,     icon: BarChart3,       roles: ['admin', 'manager', 'accountant', 'cashier'] },
    { id: 'staff',     label: t.staff,       icon: ShieldCheck,     roles: ['admin', 'manager'] },
    {
      id: 'sync',
      label: t.syncEngine,
      icon: RefreshCw,
      badge: pendingSyncCount > 0 ? pendingSyncCount : null,
      roles: ['admin', 'manager', 'accountant', 'cashier']
    },
    { id: 'settings',  label: t.settings,    icon: Settings,        roles: ['admin'] }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  const networkStatusColor =
    networkMode === 'cloud_online' ? '#16A34A' :
    networkMode === 'lan_only'     ? '#D97706' :
                                     '#DC2626';

  const networkLabel =
    networkMode === 'cloud_online' ? 'Cloud Online' :
    networkMode === 'lan_only'     ? 'LAN Only' :
                                     'Offline';

  const NetworkIcon = networkMode === 'cloud_online' ? Wifi :
                      networkMode === 'lan_only'     ? Radio :
                                                       WifiOff;

  const renderNavContent = (isMobile: boolean) => (
    <>
      {/* Brand Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#E2E6EF]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
            }}
          >
            <Flame className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight text-slate-900">GasFlow</div>
            <p className="text-[10px] font-semibold text-blue-600">
              Petroleum Station
            </p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Section Label */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Navigation
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 pb-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                if (isMobile) onCloseMobile?.();
              }}
              className="nav-item w-full cursor-pointer"
              style={isActive ? {
                background: '#EFF6FF',
                color: '#2563EB',
                borderColor: 'rgba(37,99,235,0.2)',
                fontWeight: 600
              } : {}}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: isActive ? '#2563EB' : '#94A3B8' }}
              />
              <span className="flex-1 text-left text-[13px]">{item.label}</span>
              {item.badge && (
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-full animate-pulse bg-amber-100 text-amber-700 border border-amber-200"
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Network & Device Status Footer */}
      <div className="p-3 border-t border-[#E2E6EF]">
        <div
          className="rounded-xl p-3 space-y-2.5 bg-slate-50 border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{ background: networkStatusColor }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: networkStatusColor }}
                />
              </span>
              <span className="text-[12px] font-semibold" style={{ color: networkStatusColor }}>
                {networkLabel}
              </span>
            </div>
            <NetworkIcon className="w-3.5 h-3.5" style={{ color: networkStatusColor }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] text-slate-500">Main Station</span>
            </div>
            <span className="font-mono text-[10px] font-bold text-blue-600">DEV-POS-01</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar (Screen >= lg) */}
      <aside
        className="hidden lg:flex w-60 flex-shrink-0 flex-col h-screen sticky top-0 z-20 bg-white border-r border-[#E2E6EF]"
      >
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Backdrop (Screen < lg) */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* 3. Mobile Slide-Over Drawer (Screen < lg) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-2xl border-r border-[#E2E6EF] lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {renderNavContent(true)}
      </aside>
    </>
  );
};
