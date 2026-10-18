'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Wifi,
  Radio,
  WifiOff,
  Globe,
  ChevronDown,
  Bell,
  Calendar,
  X,
  Flame,
  LogOut,
  KeyRound,
  CreditCard,
  TrendingDown,
  Fuel,
  CheckCircle2,
  ShieldAlert,
  Users,
  Plus,
  Menu,
  Receipt,
  AlertTriangle,
  DollarSign,
  Package
} from 'lucide-react';
import { User, NetworkMode, UserRole, Sale, Tank, Customer, Expense } from '@/lib/types';
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
  // Real system data for notifications
  sales?: Sale[];
  tanks?: Tank[];
  customers?: Customer[];
  expenses?: Expense[];
}

interface NotificationItem {
  id: string;
  category: 'all' | 'sales' | 'fuel' | 'finance';
  iconName: string;
  iconColor: string;
  iconBg: string;
  title: string;
  message: string;
  time: string;
  roles: UserRole[];
  unread: boolean;
  timestamp: number;
}

const ROLE_STYLES: Record<UserRole, { badge: string; text: string; bg: string; label: string; labelSo: string; descSo: string }> = {
  admin: {
    badge: 'badge-blue',
    text: '#2563EB',
    bg: '#EFF6FF',
    label: 'Administrator',
    labelSo: 'Maamule Guud',
    descSo: 'Awoodda Buuxda ee Nidaamka'
  },
  manager: {
    badge: 'badge-purple',
    text: '#7C3AED',
    bg: '#F5F3FF',
    label: 'Station Manager',
    labelSo: 'Maareeye Saldhig',
    descSo: 'Kaydka, Keenista & Shaqaalaha'
  },
  cashier: {
    badge: 'badge-green',
    text: '#10B981',
    bg: '#ECFDF5',
    label: 'Cashier (POS)',
    labelSo: 'Shuboole (POS)',
    descSo: 'Iibka Shidaalka & Shiftka'
  },
  accountant: {
    badge: 'badge-amber',
    text: '#D97706',
    bg: '#FFFBEB',
    label: 'Accountant',
    labelSo: 'Xisaabiye Guud',
    descSo: 'Dafatirada, Deymaha & Xisaabta'
  }
};

function timeAgo(isoDate: string, language: Language): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60)  return language === 'so' ? `${diff} ilbiriqsi ka hor` : `${diff}s ago`;
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return language === 'so' ? `${m} daqiiqo ka hor` : `${m} min ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return language === 'so' ? `${h} saac ka hor` : `${h}h ago`;
  }
  const d = Math.floor(diff / 86400);
  return language === 'so' ? `${d} maalin ka hor` : `${d}d ago`;
}

// Icon component map
function getNotifIcon(iconName: string) {
  const icons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    Fuel, CreditCard, TrendingDown, CheckCircle2, ShieldAlert, DollarSign, Receipt, Package, AlertTriangle
  };
  return icons[iconName] || Fuel;
}

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
  onLogout,
  sales = [],
  tanks = [],
  customers = [],
  expenses = []
}) => {
  const t = translations[language];
  const [currentDate, setCurrentDate] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'sales' | 'fuel' | 'finance'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const userRef  = useRef<HTMLDivElement>(null);
  const netRef   = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }));
    };
    update();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserDropdownOpen(false);
      if (netRef.current   && !netRef.current.contains(e.target as Node))   setNetworkDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Build dynamic notifications from real data ──────────────────────────
  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    // 1. Recent sales (last 5 paid)
    const recentSales = [...sales]
      .filter(s => s.paymentStatus === 'paid')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    recentSales.forEach((s, i) => {
      items.push({
        id: `sale_${s.id}`,
        category: 'sales',
        iconName: 'Fuel',
        iconColor: '#10B981',
        iconBg: '#ECFDF5',
        title: language === 'so' ? 'Iib Cusub La Dhammaystay' : 'New Sale Completed',
        message: language === 'so'
          ? `Rasiidh ${s.saleNumber} (${s.fuelType} ${s.litres.toFixed(1)}L — $${s.totalAmount.toFixed(2)}) waa la dhammaystay`
          : `Sale ${s.saleNumber} (${s.fuelType} ${s.litres.toFixed(1)}L — $${s.totalAmount.toFixed(2)}) completed`,
        time: timeAgo(s.createdAt, language),
        roles: ['admin', 'manager', 'accountant', 'cashier'],
        unread: i < 1,
        timestamp: new Date(s.createdAt).getTime()
      });
    });

    // 2. Low tank alerts
    tanks.filter(t => t.currentLevel <= t.minThreshold).forEach(t => {
      const pct = Math.round((t.currentLevel / t.capacity) * 100);
      items.push({
        id: `tank_low_${t.id}`,
        category: 'fuel',
        iconName: 'TrendingDown',
        iconColor: '#EF4444',
        iconBg: '#FEF2F2',
        title: language === 'so' ? 'Heerka Haanta Hoose!' : 'Low Tank Level Alert!',
        message: language === 'so'
          ? `${t.name} (${t.tankNumber}) heerkeeda waxay gaadhay ${pct}% — ${t.currentLevel.toLocaleString()}L kaliya baa haray`
          : `${t.name} (${t.tankNumber}) is at ${pct}% capacity — only ${t.currentLevel.toLocaleString()}L remaining`,
        time: language === 'so' ? 'Hadda' : 'Now',
        roles: ['admin', 'manager'],
        unread: true,
        timestamp: Date.now()
      });
    });

    // 3. Customers with outstanding debt
    const debtors = customers.filter(c => c.currentBalance > 0).slice(0, 3);
    debtors.forEach(c => {
      items.push({
        id: `debt_${c.id}`,
        category: 'finance',
        iconName: 'CreditCard',
        iconColor: '#D97706',
        iconBg: '#FFFBEB',
        title: language === 'so' ? 'Macaamiil Dayn Haysta' : 'Outstanding Customer Debt',
        message: language === 'so'
          ? `${c.name} waxay hayaan dayn $${c.currentBalance.toFixed(2)} ah — xadka $${c.creditLimit.toFixed(0)}`
          : `${c.name} has $${c.currentBalance.toFixed(2)} outstanding — limit $${c.creditLimit.toFixed(0)}`,
        time: timeAgo(c.createdAt, language),
        roles: ['admin', 'manager', 'accountant'],
        unread: c.currentBalance > 100,
        timestamp: new Date(c.createdAt).getTime()
      });
    });

    // 4. Recent expenses
    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);

    recentExpenses.forEach(ex => {
      items.push({
        id: `exp_${ex.id}`,
        category: 'finance',
        iconName: 'Receipt',
        iconColor: '#7C3AED',
        iconBg: '#F5F3FF',
        title: language === 'so' ? 'Kharash La Diwaan Geliyay' : 'Expense Recorded',
        message: language === 'so'
          ? `${ex.category}: ${ex.description} — $${ex.amount.toFixed(2)} (${ex.addedBy})`
          : `${ex.category}: ${ex.description} — $${ex.amount.toFixed(2)} by ${ex.addedBy}`,
        time: timeAgo(ex.createdAt, language),
        roles: ['admin', 'manager', 'accountant'],
        unread: false,
        timestamp: new Date(ex.createdAt).getTime()
      });
    });

    // 5. Tanks with recent delivery
    tanks.filter(t => t.currentLevel > t.capacity * 0.7).slice(0, 1).forEach(t => {
      items.push({
        id: `tank_full_${t.id}`,
        category: 'fuel',
        iconName: 'Package',
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        title: language === 'so' ? 'Haan Buux — Kayd Wanaagsan' : 'Tank Well Stocked',
        message: language === 'so'
          ? `${t.name} waxay u buuxtahay ${Math.round((t.currentLevel / t.capacity) * 100)}% — ${t.currentLevel.toLocaleString()}L / ${t.capacity.toLocaleString()}L`
          : `${t.name} is ${Math.round((t.currentLevel / t.capacity) * 100)}% full — ${t.currentLevel.toLocaleString()}L / ${t.capacity.toLocaleString()}L`,
        time: language === 'so' ? 'Maanta' : 'Today',
        roles: ['admin', 'manager'],
        unread: false,
        timestamp: Date.now() - 3600000
      });
    });

    // Sort: unread first, then newest
    return items.sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return b.timestamp - a.timestamp;
    });
  }, [sales, tanks, customers, expenses, language]);

  const networkConfig = {
    cloud_online: { color: '#10B981', label: 'Cloud Online', Icon: Wifi,    bg: '#ECFDF5', border: '#D1FAE5' },
    lan_only:     { color: '#F59E0B', label: 'LAN Network',  Icon: Radio,   bg: '#FFFBEB', border: '#FEF3C7' },
    offline_pwa:  { color: '#EF4444', label: 'Offline Mode', Icon: WifiOff, bg: '#FEF2F2', border: '#FEE2E2' }
  };

  const net       = networkConfig[networkMode];
  const roleStyle = ROLE_STYLES[currentUser.role] || ROLE_STYLES.cashier;
  const initials  = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Role filtered notifications
  const roleNotifications = notifications.filter(n => n.roles.includes(currentUser.role));
  const filteredNotifications = notifFilter === 'all'
    ? roleNotifications
    : roleNotifications.filter(n => n.category === notifFilter);

  const unreadCount = roleNotifications.filter(n => n.unread && !readIds.has(n.id)).length;

  const markAllRead = () => {
    setReadIds(new Set(roleNotifications.map(n => n.id)));
  };

  const markRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]));
  };

  return (
    <header className="h-[62px] px-2.5 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#ECEEF2] w-full max-w-full">
      {/* Left side */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 max-w-sm sm:max-w-md md:max-w-xl">
        {/* Mobile Hamburger */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand */}
        <div className="flex items-center gap-1.5 lg:hidden shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#111318] flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-[13px] tracking-tight text-slate-900 hidden sm:inline">
            GasFlow
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center flex-1 min-w-0">
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={language === 'so' ? 'Raadi wax kasta...' : 'Search for something...'}
            style={{ paddingLeft: '32px', paddingRight: searchQuery ? '28px' : '10px' }}
            className="w-full h-8.5 sm:h-9 bg-[#F8F9FA] hover:bg-[#F2F4F7] focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-[13px] font-medium rounded-xl border border-[#ECEEF2] focus:border-blue-500 focus:outline-none transition-all shadow-2xs truncate"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-1.5">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#ECEEF2] rounded-xl text-xs font-medium text-slate-600 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* Network Mode */}
        <div className="relative" ref={netRef}>
          <button
            onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
            className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-[11.5px] font-semibold transition-all cursor-pointer border shadow-2xs"
            style={{ background: net.bg, borderColor: net.border, color: net.color }}
            title={net.label}
          >
            <net.Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">{net.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60 hidden sm:inline" />
          </button>

          {networkDropdownOpen && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] sm:hidden"
                onClick={() => setNetworkDropdownOpen(false)}
              />
              <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 rounded-2xl p-2 z-50 modal-content bg-white border border-[#ECEEF2] shadow-2xl max-w-[calc(100vw-24px)] sm:max-w-none">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'so' ? 'Qaab-dhismeedka Isku-xirka (Network Simulator)' : 'Network Topology Simulator'}
                </div>
                {(['cloud_online', 'lan_only', 'offline_pwa'] as NetworkMode[]).map(mode => {
                  const cfg = networkConfig[mode];
                  const active = networkMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => { onNetworkModeChange(mode); setNetworkDropdownOpen(false); }}
                      className="w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition-all mb-0.5 cursor-pointer hover:bg-slate-50"
                      style={active ? { background: cfg.bg, border: `1px solid ${cfg.border}` } : { border: '1px solid transparent' }}
                    >
                      <div className="p-1.5 rounded-lg mt-0.5 shrink-0" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <cfg.Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-slate-900 leading-snug">
                          {mode === 'cloud_online' ? (language === 'so' ? '1. Cloud & Internet Online' : '1. Cloud & Internet Online') :
                           mode === 'lan_only'      ? (language === 'so' ? '2. Local LAN Only (Xarunta)' : '2. Local LAN Only (Offline cloud)') :
                                                      (language === 'so' ? '3. IndexedDB Offline Cache' : '3. IndexedDB Offline Cache')}
                        </div>
                        <div className="text-[11px] mt-0.5 text-slate-500 leading-tight">
                          {mode === 'cloud_online' ? (language === 'so' ? 'Xogta toos ayaa Cloud-ka loogu dirayaa' : 'Synchronizing with live backend') :
                           mode === 'lan_only'      ? (language === 'so' ? 'Server-ka xarunta ayaa maamulaya aaladaha' : 'Local server manages multi-device') :
                                                      (language === 'so' ? 'Aaladdan ayey ku kaydsan tahay, dib buu u diri doonaa' : 'Queued locally, auto-sync upon link')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => onLanguageChange(language === 'en' ? 'so' : 'en')}
          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-[11.5px] font-bold transition-all bg-white hover:bg-slate-50 border border-[#ECEEF2] text-slate-700 shadow-2xs cursor-pointer"
          title="Change language / Beddel luuqadda"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Notifications Bell — powered by REAL data */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-8 h-8 rounded-xl flex items-center justify-center relative transition-all bg-white hover:bg-slate-50 border border-[#ECEEF2] text-slate-600 shadow-2xs cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] sm:hidden"
                onClick={() => setNotifOpen(false)}
              />
              <div
                className="fixed inset-x-2.5 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 rounded-2xl p-0 z-50 bg-white border border-[#ECEEF2] shadow-2xl overflow-hidden w-auto sm:w-[380px] sm:min-w-[360px]"
                style={{
                  animation: 'scaleIn 0.18s cubic-bezier(0.16,1,0.3,1)'
                }}
              >
              {/* Header */}
              <div className="p-3.5 border-b border-[#ECEEF2] flex items-center justify-between bg-slate-50/70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'so' ? 'Ogeysiisyada Saldhigga' : 'Station Notifications'}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black">
                        {unreadCount} {language === 'so' ? 'cusub' : 'new'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'so' ? `Xogta u gaarka ah: ${roleStyle.labelSo}` : `Filtered for: ${roleStyle.label}`}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    {language === 'so' ? 'Akhriso dhammaan' : 'Mark all read'}
                  </button>
                )}
              </div>

              {/* Category Tabs */}
              <div className="flex border-b border-[#ECEEF2] px-2 py-1.5 bg-white text-[11px] font-semibold gap-1 overflow-x-auto">
                {[
                  { id: 'all',     label: language === 'so' ? 'Dhammaan' : 'All'     },
                  { id: 'sales',   label: language === 'so' ? 'Iibka'    : 'Sales'   },
                  { id: 'fuel',    label: language === 'so' ? 'Haamaha'  : 'Fuel'    },
                  { id: 'finance', label: language === 'so' ? 'Deymaha'  : 'Finance' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setNotifFilter(tab.id as typeof notifFilter)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      notifFilter === tab.id
                        ? 'bg-blue-50 text-blue-600 font-bold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                    {tab.id !== 'all' && roleNotifications.filter(n => n.category === tab.id && n.unread && !readIds.has(n.id)).length > 0 && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                    )}
                  </button>
                ))}
              </div>

              {/* Notification Items */}
              <div className="max-h-72 overflow-y-auto divide-y divide-[#F1F3F6]">
                {filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {language === 'so' ? 'Ma jiraan ogeysiisyadan xilligan' : 'No notifications in this category'}
                  </div>
                ) : (
                  filteredNotifications.map(notif => {
                    const Icon = getNotifIcon(notif.iconName);
                    const isRead = readIds.has(notif.id);
                    return (
                      <div
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        className={`p-3 flex items-start gap-2.5 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          notif.unread && !isRead ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: notif.iconBg }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: notif.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-bold text-slate-900 leading-tight truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                        {notif.unread && !isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-[#ECEEF2] bg-slate-50/50 text-center">
                <span className="text-[10px] text-slate-400">
                  {language === 'so'
                    ? `${roleNotifications.length} ogeysiis oo ku salaysan xogta nidaamka`
                    : `${roleNotifications.length} notifications from live system data`}
                </span>
              </div>
            </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="relative shrink-0" ref={userRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-white hover:bg-slate-50 border border-[#ECEEF2] shadow-2xs transition-all cursor-pointer"
          >
            <div
              className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-black text-[11px] shrink-0"
              style={{ background: roleStyle.text }}
            >
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-[12px] font-bold text-slate-900 leading-tight">{currentUser.name.split(' ')[0]}</div>
              <div className="text-[10px] font-bold" style={{ color: roleStyle.text }}>
                {language === 'so' ? roleStyle.labelSo : roleStyle.label}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {userDropdownOpen && (
            <>
              {/* Mobile overlay backdrop */}
              <div
                className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] sm:hidden"
                onClick={() => setUserDropdownOpen(false)}
              />
              <div
                className="fixed inset-x-2.5 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 rounded-2xl p-2 z-50 modal-content bg-white border border-[#ECEEF2] shadow-2xl max-w-[calc(100vw-20px)] sm:max-w-none"
                style={{ animation: 'scaleIn 0.18s cubic-bezier(0.16,1,0.3,1)' }}
              >
              {/* Current User Info */}
              <div className="px-3.5 py-3 mb-2 rounded-xl border border-[#ECEEF2]" style={{ background: roleStyle.bg }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-black text-xs shrink-0" style={{ background: roleStyle.text }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border tracking-wide" style={{ background: '#FFFFFF', color: roleStyle.text, borderColor: `${roleStyle.text}40` }}>
                    {language === 'so' ? roleStyle.labelSo : roleStyle.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{roleStyle.descSo}</span>
                </div>
              </div>

              {/* Staff List for managers/admins */}
              {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                <div className="mb-2 p-2 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{language === 'so' ? `Shaqaalaha (${users.length})` : `Staff (${users.length})`}</span>
                    </span>
                    {onOpenAuthPortal && (
                      <button
                        onClick={() => { setUserDropdownOpen(false); onOpenAuthPortal(); }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{language === 'so' ? 'Ku dar' : 'Add'}</span>
                      </button>
                    )}
                  </div>
                  <div className="max-h-28 overflow-y-auto divide-y divide-slate-100">
                    {users.slice(0, 4).map(u => {
                      const uStyle = ROLE_STYLES[u.role] || ROLE_STYLES.cashier;
                      return (
                        <div key={u.id} className="py-1 px-1 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: uStyle.text }} />
                            <span className="font-semibold text-slate-800 truncate">{u.name}</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md shrink-0" style={{ background: uStyle.bg, color: uStyle.text }}>
                            {u.role}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {onOpenProfileModal && (
                <button
                  onClick={() => { setUserDropdownOpen(false); onOpenProfileModal(); }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-[12px] font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors mb-1 border border-slate-200/80 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'so' ? 'Akoonkayga & Amniga' : 'My Account & Security'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-bold">PIN & 2FA</span>
                </button>
              )}

              {onLogout && (
                <div className="mt-1 pt-1 border-t border-slate-100">
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
          </>
        )}
        </div>
      </div>
    </header>
  );
};
