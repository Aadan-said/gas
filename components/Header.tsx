'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Wifi,
  Radio,
  WifiOff,
  Globe,
  ChevronDown,
  Bell,
  Calendar,
  Clock,
  Menu,
  Flame,
  X,
  Sparkles,
  LogOut,
  KeyRound
} from 'lucide-react';
import { User, NetworkMode, UserRole } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  users: User[];
  networkMode: NetworkMode;
  onNetworkModeChange: (mode: NetworkMode) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleMobileMenu: () => void;
  onOpenAuthPortal?: () => void;
  onOpenProfileModal?: () => void;
  onLogout?: () => void;
}

const ROLE_STYLES: Record<UserRole, { badge: string; text: string; bg: string }> = {
  admin:      { badge: 'badge-blue',   text: '#2563EB', bg: '#EFF6FF' },
  manager:    { badge: 'badge-purple', text: '#7C3AED', bg: '#F5F3FF' },
  cashier:    { badge: 'badge-green',  text: '#10B981', bg: '#ECFDF5' },
  accountant: { badge: 'badge-amber',  text: '#D97706', bg: '#FFFBEB' }
};

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  users,
  networkMode,
  onNetworkModeChange,
  language,
  onLanguageChange,
  searchQuery,
  onSearchChange,
  onToggleMobileMenu,
  onOpenAuthPortal,
  onOpenProfileModal,
  onLogout
}) => {
  const t = translations[language];
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const netRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropdownOpen(false);
      if (netRef.current  && !netRef.current.contains(e.target as Node))  setNetworkDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const networkConfig = {
    cloud_online: { color: '#10B981', label: 'Cloud Online', Icon: Wifi,    bg: '#ECFDF5', border: '#D1FAE5' },
    lan_only:     { color: '#F59E0B', label: 'LAN Network',  Icon: Radio,   bg: '#FFFBEB', border: '#FEF3C7' },
    offline_pwa:  { color: '#EF4444', label: 'Offline Mode', Icon: WifiOff, bg: '#FEF2F2', border: '#FEE2E2' }
  };

  const net = networkConfig[networkMode];
  const roleStyle = ROLE_STYLES[currentUser.role];
  const initials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <header className="h-[58px] sm:h-[62px] px-2.5 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#ECEEF2] w-full max-w-full overflow-hidden">
      {/* Left side: Mobile menu, brand logo, clean Search Input */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 mr-2">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo */}
        <div className="flex items-center gap-1.5 lg:hidden shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#111318] flex items-center justify-center shrink-0">
            <Flame className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="font-bold text-[13px] sm:text-[14px] tracking-tight text-slate-900 hidden xs:inline">
            GasFlow
          </span>
        </div>

        {/* Clean CRM Search Bar (auto-adjusts width) */}
        <div className="relative flex items-center flex-1 max-w-[140px] xs:max-w-[180px] sm:max-w-xs md:max-w-sm">
          <div className="absolute left-2.5 sm:left-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={language === 'so' ? 'Raadi...' : 'Search...'}
            style={{
              paddingLeft: '32px',
              paddingRight: searchQuery ? '28px' : '10px'
            }}
            className="w-full h-8 sm:h-9 bg-[#F8F9FA] hover:bg-[#F2F4F7] focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-[13px] font-medium rounded-xl border border-[#ECEEF2] focus:border-slate-400 focus:outline-none transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={language === 'so' ? 'Tirtir raadinta' : 'Clear search'}
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Date Display Pill (FlowAI/CloseCRM style) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#ECEEF2] rounded-xl text-xs font-medium text-slate-600 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* Network Mode Simulator Pill */}
        <div className="relative shrink-0" ref={netRef}>
          <button
            onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-[11.5px] font-semibold transition-all cursor-pointer border shadow-2xs"
            style={{
              background: net.bg,
              borderColor: net.border,
              color: net.color
            }}
            title={net.label}
          >
            <net.Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{net.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60 hidden sm:block" />
          </button>

          {networkDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl p-2 z-50 modal-content bg-white border border-[#ECEEF2] shadow-xl">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Network Topology Simulator
              </div>
              {([ 'cloud_online', 'lan_only', 'offline_pwa' ] as NetworkMode[]).map(mode => {
                const cfg = networkConfig[mode];
                const active = networkMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => { onNetworkModeChange(mode); setNetworkDropdownOpen(false); }}
                    className="w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition-all mb-0.5 cursor-pointer"
                    style={active ? {
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`
                    } : { border: '1px solid transparent' }}
                  >
                    <div
                      className="p-1.5 rounded-lg mt-0.5 shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      <cfg.Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-slate-900">
                        {mode === 'cloud_online' ? '1. Cloud & Internet Online' :
                         mode === 'lan_only'      ? '2. Local LAN Only (Offline cloud)' :
                                                    '3. IndexedDB Offline Cache'}
                      </div>
                      <div className="text-[11px] mt-0.5 text-slate-500">
                        {mode === 'cloud_online' ? 'Synchronizing with live backend' :
                         mode === 'lan_only'      ? 'Local server manages multi-device' :
                                                    'Queued locally, auto-sync upon link'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Language Toggle Pill */}
        <button
          onClick={() => onLanguageChange(language === 'en' ? 'so' : 'en')}
          className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-[11.5px] font-semibold transition-all bg-white hover:bg-slate-50 border border-[#ECEEF2] text-slate-700 shadow-2xs cursor-pointer shrink-0"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Notifications Bell */}
        <button
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center relative transition-all bg-white hover:bg-slate-50 border border-[#ECEEF2] text-slate-600 shadow-2xs cursor-pointer shrink-0"
          aria-label="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* User Profile Switcher */}
        <div className="relative shrink-0" ref={userRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-1.5 p-0.5 sm:px-2 sm:py-1 rounded-xl bg-white hover:bg-slate-50 border border-[#ECEEF2] shadow-2xs transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#111318] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-[12px] font-semibold text-slate-900 leading-tight">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[10px] capitalize font-medium text-slate-500">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>


          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl p-2 z-50 modal-content bg-white border border-[#ECEEF2] shadow-xl">
              <div className="px-3 py-2.5 mb-2 rounded-xl bg-[#F8F9FA] border border-[#ECEEF2]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#111318] text-white flex items-center justify-center font-bold text-xs">
                    {initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`badge ${roleStyle.badge}`}>{currentUser.role}</span>
                </div>
              </div>

              {onOpenProfileModal && (
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onOpenProfileModal();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-[12px] font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors mb-2 border border-slate-200/80 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'so' ? 'Akoonkayga & Amniga' : 'My Account & Security'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-bold">PIN & 2FA</span>
                </button>
              )}



              {onLogout && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => { onLogout(); setUserDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 text-[12px] font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>{language === 'so' ? 'Ka Bax (Log Out)' : 'Log Out'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
