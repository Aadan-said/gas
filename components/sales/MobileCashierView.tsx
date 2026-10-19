'use client';

import React from 'react';
import {
  Flame,
  Fuel,
  Database,
  Receipt,
  BarChart3,
  Home,
  Menu,
  Wifi,
  Radio,
  WifiOff,
  User,
  ArrowRight,
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react';
import { Sale, Tank, User as AppUser, NetworkMode } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { GasFlowLogo } from '@/components/ui';

interface MobileCashierViewProps {
  currentUser: AppUser;
  tanks: Tank[];
  sales: Sale[];
  networkMode: NetworkMode;
  language: Language;
  onNavigate: (view: string) => void;
  onSelectSaleReceipt: (sale: Sale) => void;
}

export const MobileCashierView: React.FC<MobileCashierViewProps> = ({
  currentUser,
  tanks,
  sales,
  networkMode,
  language,
  onNavigate,
  onSelectSaleReceipt
}) => {
  const t = translations[language];

  const todaySales = sales.filter(s => s.paymentStatus === 'paid');
  const todayTotal = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const todayLitres = todaySales.reduce((acc, s) => acc + s.litres, 0);

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-[844px] rounded-[42px] border-[10px] border-slate-900 shadow-2xl overflow-hidden flex flex-col justify-between my-4 relative">
      {/* Mobile Top Status Bar */}
      <div className="bg-slate-900 text-white px-6 pt-3 pb-2 flex items-center justify-between text-xs font-semibold">
        <span>9:41</span>
        <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto" />
        <div className="flex items-center gap-1.5 text-[11px]">
          {networkMode === 'cloud_online' ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : networkMode === 'lan_only' ? (
            <Radio className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="font-mono">100%</span>
        </div>
      </div>

      {/* Mobile App Header (Exact match from mockup!) */}
      <div className="bg-white px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <button className="p-1 text-slate-700">
          <Menu className="w-5 h-5" />
        </button>
        <GasFlowLogo size="xs" variant="compact" />
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{networkMode === 'cloud_online' ? 'Online' : 'LAN Only'}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 space-y-5 overflow-y-auto bg-slate-50/70">
        {/* Cashier Greeting */}
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Good Morning, {currentUser.name.split(' ')[0]}
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Today, 29 Apr 2025 • Shift #1
          </p>
        </div>

        {/* Quick Shift Summary Bar */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
              Today's Shift Sales
            </span>
            <div className="text-2xl font-black tracking-tight mt-0.5">
              ${todayTotal.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
              Fuel Pumped
            </span>
            <div className="text-base font-bold text-white mt-0.5">
              {todayLitres.toFixed(1)} L
            </div>
          </div>
        </div>

        {/* 4 Quick Action Cards (Exact match from mockup!) */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* New Sale Card */}
          <button
            onClick={() => onNavigate('sales')}
            className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center text-center hover:border-blue-500 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Fuel className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="font-black text-sm text-slate-900">New Sale</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Create fuel sale</div>
          </button>

          {/* Tanks Card */}
          <button
            onClick={() => onNavigate('tanks')}
            className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center text-center hover:border-emerald-500 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Database className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="font-black text-sm text-slate-900">Tanks</div>
            <div className="text-[10px] text-slate-400 mt-0.5">View fuel levels</div>
          </button>

          {/* Transactions Card */}
          <button
            onClick={() => onNavigate('sales')}
            className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center text-center hover:border-blue-500 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Receipt className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="font-black text-sm text-slate-900">Transactions</div>
            <div className="text-[10px] text-slate-400 mt-0.5">View recent sales</div>
          </button>

          {/* Reports Card */}
          <button
            onClick={() => onNavigate('reports')}
            className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center text-center hover:border-purple-500 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="font-black text-sm text-slate-900">Reports</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Quick reports</div>
          </button>
        </div>

        {/* Live Tank Mini Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Live Fuel Levels</span>
            <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => onNavigate('tanks')}>
              Details →
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {tanks.map(tk => {
              const pct = Math.round((tk.currentLevel / tk.capacity) * 100);
              return (
                <div key={tk.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between font-bold text-[11px]">
                    <span className="text-slate-700">{tk.fuelType}</span>
                    <span className="text-blue-600">{pct}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {tk.currentLevel.toLocaleString()} L
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions Mini List */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Last 3 Dispenses</span>
          </div>

          {sales.slice(0, 3).map(sale => (
            <div
              key={sale.id}
              onClick={() => onSelectSaleReceipt(sale)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <div>
                <div className="font-bold text-xs text-slate-900">
                  {sale.fuelType} • {sale.litres.toFixed(1)} L
                </div>
                <div className="text-[10px] text-slate-400">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-xs text-slate-900">${sale.totalAmount.toFixed(2)}</div>
                <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {sale.paymentMethod}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Exact match from mockup!) */}
      <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between text-slate-400">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex flex-col items-center gap-1 text-blue-600 font-bold"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>
        <button
          onClick={() => onNavigate('sales')}
          className="flex flex-col items-center gap-1 hover:text-slate-700"
        >
          <Fuel className="w-5 h-5" />
          <span className="text-[10px]">Sales</span>
        </button>
        <button
          onClick={() => onNavigate('tanks')}
          className="flex flex-col items-center gap-1 hover:text-slate-700"
        >
          <Database className="w-5 h-5" />
          <span className="text-[10px]">Tanks</span>
        </button>
        <button
          onClick={() => onNavigate('reports')}
          className="flex flex-col items-center gap-1 hover:text-slate-700"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    </div>
  );
};
