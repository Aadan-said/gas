'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Droplet,
  Wallet,
  Receipt,
  ArrowUpRight,
  Fuel,
  Flame,
  Clock,
  ChevronRight,
  Plus,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Sale, Tank, User } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface DashboardViewProps {
  currentUser: User;
  sales: Sale[];
  tanks: Tank[];
  language: Language;
  onNavigate: (view: string) => void;
  onSelectSaleReceipt: (sale: Sale) => void;
}

const FUEL_COLORS: Record<string, { gradient: string; glow: string; text: string; bg: string }> = {
  PMS: { gradient: 'linear-gradient(135deg, #16A34A, #15803D)', glow: 'rgba(22,163,74,0.2)',   text: '#16A34A', bg: '#F0FDF4' },
  AGO: { gradient: 'linear-gradient(135deg, #D97706, #B45309)', glow: 'rgba(217,119,6,0.2)',   text: '#D97706', bg: '#FFFBEB' },
  DPK: { gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)', glow: 'rgba(37,99,235,0.2)',   text: '#2563EB', bg: '#EFF6FF' },
  LPG: { gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)', glow: 'rgba(124,58,237,0.2)',  text: '#7C3AED', bg: '#F5F3FF' }
};

const PAYMENT_COLORS: Record<string, string> = {
  cash:   '#16A34A',
  evc:    '#2563EB',
  credit: '#D97706',
  zaad:   '#7C3AED',
  edahab: '#DC2626',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  sales,
  tanks,
  language,
  onNavigate,
  onSelectSaleReceipt
}) => {
  const t = translations[language];
  const [salesTimeframe, setSalesTimeframe] = useState<'today' | 'week' | 'month'>('today');

  const activeSales = sales.filter(s => s.paymentStatus === 'paid');
  const totalSalesAmount   = activeSales.reduce((a, c) => a + c.totalAmount, 0);
  const totalLitresSold    = activeSales.reduce((a, c) => a + c.litres, 0);
  const cashSales          = activeSales.filter(s => s.paymentMethod === 'cash').reduce((a, c) => a + c.totalAmount, 0);
  const totalTransactions  = activeSales.length;

  const hourlyData = [
    { hour: '08', amount: 380 },
    { hour: '10', amount: 620 },
    { hour: '12', amount: 510 },
    { hour: '14', amount: 780 },
    { hour: '16', amount: 450 },
    { hour: '18', amount: 890 },
    { hour: '20', amount: 340 }
  ];
  const maxChart = Math.max(...hourlyData.map(d => d.amount));

  const kpis = [
    {
      label: t.totalSalesToday,
      value: `$${totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      trend: '+12%',
      icon: DollarSign,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-100'
    },
    {
      label: t.fuelSoldLitres,
      value: `${totalLitresSold.toLocaleString('en-US', { minimumFractionDigits: 2 })} L`,
      trend: '+8%',
      icon: Droplet,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-100'
    },
    {
      label: t.cashInHand,
      value: `$${cashSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      trend: '+5%',
      icon: Wallet,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50 border-purple-100'
    },
    {
      label: t.totalTransactions,
      value: `${totalTransactions}`,
      trend: '+6%',
      icon: Receipt,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-100'
    }
  ];

  return (
    <div className="space-y-5 pb-10 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#0F172A' }}>
            {t.welcomeGreeting}{' '}
            <span className="text-gradient-blue">{currentUser.name}</span>
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#64748B' }}>
            {t.whatsHappening}
          </p>
        </div>
        <button
          onClick={() => onNavigate('sales')}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          {t.newSale}
        </button>
      </div>

      {/* 4 KPI Cards (Clean, Simple, White like Reports) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {kpi.label}
                  </div>
                  <div className="text-[22px] font-black tracking-tight text-slate-900">
                    {kpi.value}
                  </div>
                </div>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${kpi.iconBg}`}
                >
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} strokeWidth={2.4} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3.5 pt-2.5 border-t border-slate-100 text-xs font-semibold text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>
                  {kpi.trend} {t.vsYesterday}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sales Chart */}
        <div
          className="lg:col-span-5 rounded-2xl p-5 glass-card"
          style={{ minHeight: 280 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-bold" style={{ color: '#0F172A' }}>{t.salesOverview}</h2>
              <p className="text-[11px]" style={{ color: '#64748B' }}>Peak pumping hours</p>
            </div>
            <select
              value={salesTimeframe}
              onChange={e => setSalesTimeframe(e.target.value as 'today' | 'week' | 'month')}
              className="input text-[12px] h-7 px-2 w-auto"
            >
              <option value="today">{t.today}</option>
              <option value="week">{t.thisWeek}</option>
              <option value="month">{t.thisMonth}</option>
            </select>
          </div>

          {/* Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-2 pb-1">
            {hourlyData.map((d, i) => {
              const h = Math.round((d.amount / maxChart) * 100);
              const isTopHour = d.amount === maxChart;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                  <div
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE' }}
                  >
                    ${d.amount}
                  </div>
                  <div
                    className="w-full rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-500 cursor-pointer"
                    style={{
                      height: `${h}%`,
                      background: isTopHour
                        ? 'linear-gradient(180deg, #2563EB, #1D4ED8)'
                        : 'linear-gradient(180deg, rgba(37,99,235,0.35), rgba(37,99,235,0.15))',
                      boxShadow: isTopHour ? '0 0 12px rgba(37,99,235,0.25)' : 'none',
                      minHeight: 6,
                      borderRadius: '6px 6px 0 0'
                    }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: '#64748B' }}>{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fuel Stock Levels */}
        <div className="lg:col-span-4 rounded-2xl p-5 glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-bold" style={{ color: '#0F172A' }}>{t.fuelStockLevel}</h2>
              <p className="text-[11px]" style={{ color: '#64748B' }}>Tank capacity monitor</p>
            </div>
            <button
              onClick={() => onNavigate('tanks')}
              className="text-[11px] font-semibold transition-colors"
              style={{ color: '#2563EB' }}
            >
              {t.viewAll}
            </button>
          </div>

          <div className="space-y-4">
            {tanks.map(tank => {
              const pct = Math.round((tank.currentLevel / tank.capacity) * 100);
              const fc  = FUEL_COLORS[tank.fuelType] || FUEL_COLORS.PMS;
              const isLow = pct < 30;
              const barGradient = isLow ? 'linear-gradient(90deg, #DC2626, #EF4444)' : fc.gradient;

              return (
                <div key={tank.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg" style={{ background: fc.bg }}>
                        <Flame className="w-3 h-3" style={{ color: fc.text }} />
                      </div>
                      <span className="text-[12px] font-semibold" style={{ color: '#0F172A' }}>{tank.name}</span>
                      {isLow && (
                        <AlertTriangle className="w-3 h-3" style={{ color: '#DC2626' }} />
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-bold" style={{ color: isLow ? '#DC2626' : '#0F172A' }}>
                        {pct}%
                      </span>
                      <span className="text-[11px] ml-1.5" style={{ color: '#64748B' }}>
                        {tank.currentLevel.toLocaleString()}L
                      </span>
                    </div>
                  </div>
                  <div className="fuel-bar-track">
                    <div
                      className="fuel-bar-fill"
                      style={{ width: `${pct}%`, background: barGradient }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="mt-4 pt-3 flex items-center justify-between text-[11px]"
            style={{ borderTop: '1px solid #E2E6EF' }}
          >
            <span style={{ color: '#64748B' }}>Safety threshold: 20%</span>
            <span className="font-semibold" style={{ color: '#16A34A' }}>✓ All Healthy</span>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-3 rounded-2xl p-5 glass-card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[14px] font-bold" style={{ color: '#0F172A' }}>{t.recentTransactions}</h2>
              <p className="text-[11px]" style={{ color: '#64748B' }}>Latest sales</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-[11px] font-semibold"
              style={{ color: '#2563EB' }}
            >
              {t.viewAll}
            </button>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-64">
            {sales.slice(0, 6).map(sale => {
              const fc = FUEL_COLORS[sale.fuelType] || FUEL_COLORS.PMS;
              const pmColor = PAYMENT_COLORS[sale.paymentMethod] || '#64748B';
              const timeStr = new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={sale.id}
                  onClick={() => onSelectSaleReceipt(sale)}
                  className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ border: '1px solid transparent' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = '#F8F9FC';
                    (e.currentTarget as HTMLElement).style.borderColor = '#E2E6EF';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: fc.bg }}>
                      <Fuel className="w-3.5 h-3.5" style={{ color: fc.text }} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold" style={{ color: '#0F172A' }}>
                        {sale.fuelType} · {sale.litres.toFixed(1)}L
                      </div>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: '#64748B' }}>
                        <Clock className="w-2.5 h-2.5" />
                        {timeStr}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-black" style={{ color: '#0F172A' }}>
                      ${sale.totalAmount.toFixed(2)}
                    </div>
                    <div
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                      style={{ color: pmColor, background: `${pmColor}18` }}
                    >
                      {sale.paymentMethod}
                    </div>
                  </div>
                </div>
              );
            })}

            {sales.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <TrendingUp className="w-8 h-8 mb-2" style={{ color: '#94A3B8' }} />
                <p className="text-[12px]" style={{ color: '#64748B' }}>No sales yet today</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('sales')}
            className="w-full mt-3 py-2 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#2563EB'
            }}
          >
            Open POS Terminal
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
