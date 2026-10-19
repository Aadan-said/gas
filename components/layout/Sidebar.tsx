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
  X,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { NetworkMode, UserRole } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { GasFlowLogo } from '@/components/ui';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  networkMode: NetworkMode;
  userRole: UserRole;
  language: Language;
  pendingSyncCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  networkMode,
  userRole,
  language,
  pendingSyncCount,
  isOpenMobile = false,
  onCloseMobile,
  onLogout
}) => {
  const t = translations[language];

  // Grouped Navigation matching modern CRM structure (CloseCRM / FlowAI)
  const navSections = [
    {
      group: language === 'so' ? 'QAYBTA HORE' : 'WORKSPACES',
      items: [
        { id: 'dashboard', label: t.dashboard,   icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'accountant'] },
        { id: 'sales',     label: t.sales,       icon: Fuel,            badge: 'POS', badgeColor: 'bg-emerald-50 text-emerald-600 border border-emerald-100', roles: ['admin', 'manager', 'cashier', 'accountant'] },
        { id: 'tanks',     label: t.tanks,       icon: Database,        roles: ['admin', 'manager', 'accountant'] },
        { id: 'inventory', label: t.inventory,   icon: Layers,          roles: ['admin', 'manager', 'accountant'] },
        { id: 'customers', label: t.customers,   icon: Users,           roles: ['admin', 'manager', 'accountant', 'cashier'] },
      ]
    },
    {
      group: language === 'so' ? 'KONTROOLKA & MAALIYADDA' : 'INSIGHT & CONTROL',
      items: [
        { id: 'finance',   label: t.finance,     icon: Wallet,          roles: ['admin', 'manager', 'accountant'] },
        { id: 'reports',   label: t.reports,     icon: BarChart3,       roles: ['admin', 'manager', 'accountant', 'cashier'] },
        { id: 'staff',     label: t.staff,       icon: ShieldCheck,     roles: ['admin', 'manager'] },
      ]
    },
    {
      group: language === 'so' ? 'NIDAAMKA' : 'SYSTEM',
      items: [
        {
          id: 'sync',
          label: t.syncEngine,
          icon: RefreshCw,
          badge: pendingSyncCount > 0 ? `${pendingSyncCount}` : null,
          badgeColor: 'bg-amber-50 text-amber-600 border border-amber-200',
          roles: ['admin', 'manager', 'accountant', 'cashier']
        },
        { id: 'settings',  label: t.settings,    icon: Settings,        roles: ['admin'] }
      ]
    }
  ];

  const networkStatusColor =
    networkMode === 'cloud_online' ? '#10B981' :
    networkMode === 'lan_only'     ? '#F59E0B' :
                                     '#EF4444';

  const networkLabel =
    networkMode === 'cloud_online' ? 'Cloud Online' :
    networkMode === 'lan_only'     ? 'LAN Network' :
                                     'Offline Mode';

  const NetworkIcon = networkMode === 'cloud_online' ? Wifi :
                      networkMode === 'lan_only'     ? Radio :
                                                       WifiOff;

  const renderNavContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. Brand Logo Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#ECEEF2]">
        <GasFlowLogo size="md" variant="compact" />

        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close Menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Navigation Sections */}
      <div className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {navSections.map((sec, secIdx) => {
          const visibleItems = sec.items.filter(item => item.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={secIdx} className="space-y-1">
              <div className="px-2.5 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400/90">
                  {sec.group}
                </span>
              </div>

              <div className="space-y-0.5">
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
                      className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : (item.badgeColor || 'bg-slate-100 text-slate-600')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. System Hardware & Telemetry Card (CloseCRM/FlowAI inspired) */}
      <div className="p-3 border-t border-[#ECEEF2] space-y-2">
        <div className="rounded-xl p-3 bg-[#F8F9FB] border border-[#ECEEF2] space-y-2">
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
              <span
                className="text-[11.5px] font-semibold tracking-tight"
                style={{ color: networkStatusColor }}
              >
                {networkLabel}
              </span>
            </div>
            <NetworkIcon className="w-3.5 h-3.5" style={{ color: networkStatusColor }} />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Zap className="w-3 h-3 text-slate-400" />
              <span>Pumps & Tanks</span>
            </div>
            <span className="font-mono text-[10px] font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              DEV-POS-01
            </span>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onLogout();
            }}
            className="w-full mt-2 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50/70 transition-all cursor-pointer border border-transparent hover:border-rose-100"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500" />
              <span>{language === 'so' ? 'Ka Bax / Quful' : 'Sign Out / Lock'}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Shift</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col h-full bg-white border-r border-[#ECEEF2] overflow-hidden select-none">
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* 3. Mobile Slide-Over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-2xl border-r border-[#ECEEF2] lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {renderNavContent(true)}
      </aside>
    </>
  );
};
