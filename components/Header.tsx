'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Wifi,
  Radio,
  WifiOff,
  Globe,
  ChevronDown,
  UserCheck,
  Bell,
  Calendar,
  Clock,
  Menu,
  Flame,
  X
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
}

const ROLE_STYLES: Record<UserRole, { badge: string; text: string; bg: string }> = {
  admin:      { badge: 'badge-blue',   text: '#2563EB', bg: '#EFF6FF' },
  manager:    { badge: 'badge-purple', text: '#7C3AED', bg: '#F5F3FF' },
  cashier:    { badge: 'badge-green',  text: '#16A34A', bg: '#F0FDF4' },
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
  onToggleMobileMenu
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
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
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
    cloud_online: { color: '#16A34A', label: 'Cloud Online', Icon: Wifi,    bg: '#F0FDF4', border: '#BBF7D0' },
    lan_only:     { color: '#D97706', label: 'LAN Server',   Icon: Radio,   bg: '#FFFBEB', border: '#FDE68A' },
    offline_pwa:  { color: '#DC2626', label: 'Offline',      Icon: WifiOff, bg: '#FEF2F2', border: '#FECACA' }
  };

  const net = networkConfig[networkMode];
  const roleStyle = ROLE_STYLES[currentUser.role];
  const initials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <header
      className="h-[60px] px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#E2E6EF] shadow-xs"
    >
      {/* Left side: Hamburger (mobile), Brand (mobile), Search */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
          >
            <Flame className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-extrabold text-[14px] sm:text-[15px] tracking-tight text-slate-900 hidden xs:inline">
            GasFlow
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={language === 'so' ? 'Raadi wax kasta...' : 'Search sales, tanks...'}
            style={{
              paddingLeft: '36px',
              paddingRight: searchQuery ? '32px' : '12px'
            }}
            className="w-36 xs:w-44 sm:w-60 md:w-68 lg:w-72 h-9 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-[13px] font-medium rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={language === 'so' ? 'Tirtir raadinta' : 'Clear search'}
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Network Mode */}
        <div className="relative" ref={netRef}>
          <button
            onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
            style={{
              background: net.bg,
              border: `1px solid ${net.border}`,
              color: net.color
            }}
          >
            <net.Icon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{net.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {networkDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-xl p-2 z-50 modal-content bg-white border border-slate-200 shadow-xl"
            >
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Simulate Network Architecture
              </div>
              {([ 'cloud_online', 'lan_only', 'offline_pwa' ] as NetworkMode[]).map(mode => {
                const cfg = networkConfig[mode];
                const active = networkMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => { onNetworkModeChange(mode); setNetworkDropdownOpen(false); }}
                    className="w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-all mb-0.5 cursor-pointer"
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
                        {mode === 'cloud_online' ? '1. Internet & LAN Connected' :
                         mode === 'lan_only'      ? '2. Internet Down, LAN Active' :
                                                    '3. Fully Offline (IndexedDB)'}
                      </div>
                      <div className="text-[11px] mt-0.5 text-slate-500">
                        {mode === 'cloud_online' ? 'Real-time cloud sync & backup active' :
                         mode === 'lan_only'      ? 'Local Station Server syncs all devices' :
                                                    'Outbox queue, auto-retry when reconnected'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => onLanguageChange(language === 'en' ? 'so' : 'en')}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-blue-50 border border-blue-200 text-blue-600 cursor-pointer"
        >
          <Globe className="w-3 h-3" />
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Date/Time (Desktop only) */}
        <div className="hidden xl:flex flex-col items-end gap-0" style={{ minWidth: 95 }}>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-900">
            <Calendar className="w-2.5 h-2.5 text-slate-400" />
            {currentDate}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="w-2.5 h-2.5 text-slate-400" />
            {currentTime}
          </div>
        </div>

        <div className="w-px h-6 mx-0.5 hidden sm:block bg-slate-200" />

        {/* Notifications */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center relative transition-all bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-600"
          />
        </button>

        {/* User Profile Switcher */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 sm:pr-2.5 rounded-xl transition-all cursor-pointer"
            style={{
              background: userDropdownOpen ? '#F4F6FA' : 'transparent',
              border: `1px solid ${userDropdownOpen ? '#BFDBFE' : 'transparent'}`
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[11px] shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-[12px] font-semibold leading-tight text-slate-900">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[10px] capitalize font-medium" style={{ color: roleStyle.text }}>
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {userDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl p-2 z-50 modal-content bg-white border border-slate-200 shadow-xl"
            >
              {/* Current user info */}
              <div
                className="px-3 py-2.5 mb-2 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
                  >
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

              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Switch Role / User
              </div>
              {users.map(u => {
                const rs = ROLE_STYLES[u.role];
                const isActive = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => { onUserChange(u); setUserDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-[12px] transition-all mb-0.5 cursor-pointer"
                    style={isActive ? {
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE'
                    } : { border: '1px solid transparent' }}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span style={{ color: isActive ? '#2563EB' : '#0F172A', fontWeight: isActive ? 600 : 400 }}>
                        {u.name}
                      </span>
                    </div>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold capitalize"
                      style={{ color: rs.text, background: rs.bg }}
                    >
                      {u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
