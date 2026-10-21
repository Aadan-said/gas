'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Droplet,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Fuel,
  Flame,
  Clock,
  ChevronRight,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  Users,
  CreditCard,
  Scale
} from 'lucide-react';
import { Sale, Tank, User, Customer, Expense, FuelDelivery, CustomerPayment } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface DashboardViewProps {
  currentUser: User;
  sales: Sale[];
  tanks: Tank[];
  customers?: Customer[];
  expenses?: Expense[];
  deliveries?: FuelDelivery[];
  customerPayments?: CustomerPayment[];
  language: Language;
  onNavigate: (view: string) => void;
  onSelectSaleReceipt: (sale: Sale) => void;
}

const FUEL_COLORS: Record<string, { fill: string; stroke: string; text: string; bg: string; border: string }> = {
  PMS: { fill: '#10B981', stroke: '#059669', text: '#059669', bg: '#ECFDF5', border: '#D1FAE5' },
  AGO: { fill: '#F59E0B', stroke: '#D97706', text: '#D97706', bg: '#FFFBEB', border: '#FEF3C7' },
  DPK: { fill: '#3B82F6', stroke: '#2563EB', text: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE' },
  LPG: { fill: '#8B5CF6', stroke: '#7C3AED', text: '#7C3AED', bg: '#F5F3FF', border: '#EDE9FE' }
};

const PAYMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  cash:   { bg: '#ECFDF5', text: '#059669', border: '#D1FAE5' },
  evc:    { bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE' },
  edahab: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  sahal:  { bg: '#F5F3FF', text: '#7C3AED', border: '#EDE9FE' },
  zaad:   { bg: '#F5F3FF', text: '#7C3AED', border: '#EDE9FE' },
  credit: { bg: '#FFFBEB', text: '#D97706', border: '#FEF3C7' },
  card:   { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  sales,
  tanks,
  customers = [],
  expenses = [],
  deliveries = [],
  customerPayments = [],
  language,
  onNavigate,
  onSelectSaleReceipt
}) => {
  const t = translations[language];
  const [salesTimeframe, setSalesTimeframe] = useState<'today' | 'week' | 'month'>('today');

  // Role-specific data isolation: cashiers only see their own shift sales
  const roleSales = currentUser.role === 'cashier'
    ? sales.filter(s => s.cashierId === currentUser.id)
    : sales;

  const activeSales = roleSales.filter(s => s.paymentStatus === 'paid');
  const totalSalesAmount   = activeSales.reduce((a, c) => a + c.totalAmount, 0);
  const totalLitresSold    = activeSales.reduce((a, c) => a + c.litres, 0);
  const cashSales          = activeSales.filter(s => s.paymentMethod === 'cash').reduce((a, c) => a + c.totalAmount, 0);
  const totalTransactions  = activeSales.length;

  // Real Payment Method Breakdown
  const sahalSales   = activeSales.filter(s => s.paymentMethod === 'sahal').reduce((a, c) => a + c.totalAmount, 0);
  const evcSales     = activeSales.filter(s => s.paymentMethod === 'evc').reduce((a, c) => a + c.totalAmount, 0);
  const edahabSales  = activeSales.filter(s => s.paymentMethod === 'edahab').reduce((a, c) => a + c.totalAmount, 0);
  const creditSales  = activeSales.filter(s => s.paymentMethod === 'credit').reduce((a, c) => a + c.totalAmount, 0);
  const cardSales    = activeSales.filter(s => s.paymentMethod === 'card').reduce((a, c) => a + c.totalAmount, 0);
  const totalMobileMoney = sahalSales + evcSales + edahabSales;

  // Real Customer Debts (Daymaha Macaamiisha)
  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.currentBalance, 0);
  const activeDebtorsCount = customers.filter(c => c.currentBalance > 0).length;

  // Real Station Expenses (Kharashaadka Kaalinta)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Net Operating Profit (Faa'iidada Saafiga ah = Dakhliga Iibka - Kharashaadka Baxay)
  const netOperatingProfit = totalSalesAmount - totalExpenses;

  const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
    admin:      { label: language === 'so' ? 'Maamule' : 'Administrator', color: '#2563EB', bg: '#EFF6FF' },
    manager:    { label: language === 'so' ? 'Maamulle' : 'Manager',       color: '#7C3AED', bg: '#F5F3FF' },
    cashier:    { label: language === 'so' ? 'Cashier' : 'Cashier',        color: '#059669', bg: '#ECFDF5' },
    accountant: { label: language === 'so' ? 'Xisaabiye' : 'Accountant',   color: '#D97706', bg: '#FFFBEB' },
  };
  const rConf = roleConfig[currentUser.role] || roleConfig.cashier;

  // Real hourly buckets for live sales curve
  const timeBuckets = [
    { label: '08:00 AM', startHour: 6, endHour: 9 },
    { label: '10:00 AM', startHour: 9, endHour: 11 },
    { label: '12:00 PM', startHour: 11, endHour: 13 },
    { label: '02:00 PM', startHour: 13, endHour: 15 },
    { label: '04:00 PM', startHour: 15, endHour: 17 },
    { label: '06:00 PM', startHour: 17, endHour: 19 },
    { label: '08:00 PM', startHour: 19, endHour: 23 }
  ];

  const hourlyPoints = timeBuckets.map(b => {
    const bucketSales = activeSales.filter(s => {
      const d = new Date(s.createdAt);
      const h = d.getHours();
      return h >= b.startHour && h < b.endHour;
    });
    const amount = bucketSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const litres = bucketSales.reduce((sum, s) => sum + s.litres, 0);
    return { hour: b.label, amount, litres };
  });

  const maxRevenue = Math.max(...hourlyPoints.map(p => p.amount), 0);
  const maxLitres = Math.max(...hourlyPoints.map(p => p.litres), 0);
  const chartMaxRevenue = maxRevenue > 0 ? maxRevenue * 1.2 : 100;
  const chartMaxLitres = maxLitres > 0 ? maxLitres * 1.2 : 100;

  // Dynamic peak hour determination
  const peakPoint = hourlyPoints.reduce((max, p) => p.amount > max.amount ? p : max, hourlyPoints[0]);
  const hasHourlyData = maxRevenue > 0;

  // SVG Coordinates for spline area curve
  const revCoords = hourlyPoints.map((p, i) => ({
    x: (i / (hourlyPoints.length - 1)) * 660 + 20,
    y: hasHourlyData ? Math.max(35, 185 - (p.amount / chartMaxRevenue) * 145) : 185,
    amount: p.amount,
    litres: p.litres,
    hour: p.hour
  }));

  const litCoords = hourlyPoints.map((p, i) => ({
    x: (i / (hourlyPoints.length - 1)) * 660 + 20,
    y: hasHourlyData ? Math.max(35, 185 - (p.litres / chartMaxLitres) * 145) : 185
  }));

  const revPathD = revCoords.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp2x = cp1x;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const revAreaD = `${revPathD} L ${revCoords[revCoords.length - 1].x} 185 L ${revCoords[0].x} 185 Z`;

  const litPathD = litCoords.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp2x = cp1x;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  // Calculate Fuel Share for Donut Chart accurately
  const fuelLitresMap: Record<string, number> = { PMS: 0, AGO: 0, DPK: 0, LPG: 0 };
  activeSales.forEach(s => {
    if (fuelLitresMap[s.fuelType] !== undefined) {
      fuelLitresMap[s.fuelType] += s.litres;
    } else {
      fuelLitresMap[s.fuelType] = s.litres;
    }
  });

  const totalFuelDistributed = Object.values(fuelLitresMap).reduce((a, b) => a + b, 0);
  const pmsPct = totalFuelDistributed > 0 ? Math.round(((fuelLitresMap.PMS || 0) / totalFuelDistributed) * 100) : 0;
  const agoPct = totalFuelDistributed > 0 ? Math.round(((fuelLitresMap.AGO || 0) / totalFuelDistributed) * 100) : 0;
  const dpkPct = totalFuelDistributed > 0 ? Math.round(((fuelLitresMap.DPK || 0) / totalFuelDistributed) * 100) : 0;
  const lpgPct = totalFuelDistributed > 0 ? Math.max(0, 100 - (pmsPct + agoPct + dpkPct)) : 0;

  // Integrated Accounting KPI Cards connecting Sales, Customer Debts, Expenses & Net Profit
  const kpis = [
    {
      indicatorColor: '#2563EB',
      title: t.totalSalesToday,
      value: `$${totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      badge: `${totalLitresSold.toFixed(0)} L`,
      badgePositive: true,
      subtext: language === 'so' ? 'shidaalka la iibiyay' : 'fuel dispensed',
      icon: DollarSign,
      action: () => onNavigate('sales')
    },
    {
      indicatorColor: '#D97706',
      title: language === 'so' ? 'Deymaha Macaamiisha' : 'Customer Credit / Debts',
      value: `$${totalCustomerDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      badge: `${activeDebtorsCount} ${language === 'so' ? 'macmiil' : 'debtors'}`,
      badgePositive: totalCustomerDebt === 0,
      subtext: language === 'so' ? 'dayn furan oo la rabo' : 'receivables balance',
      icon: Users,
      action: () => onNavigate('customers')
    },
    {
      indicatorColor: '#DC2626',
      title: language === 'so' ? 'Kharashaadka Kaalinta' : 'Station Expenses',
      value: `$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      badge: `${expenses.length} ${language === 'so' ? 'jeer' : 'items'}`,
      badgePositive: false,
      subtext: language === 'so' ? 'kharashka guud ee baxay' : 'total operating expenses',
      icon: Wallet,
      action: () => onNavigate('finance')
    },
    {
      indicatorColor: netOperatingProfit >= 0 ? '#059669' : '#DC2626',
      title: language === 'so' ? "Faa'iidada Saafiga ah" : 'Net Operating Profit',
      value: `$${netOperatingProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      badge: netOperatingProfit >= 0 ? '+Net' : '-Deficit',
      badgePositive: netOperatingProfit >= 0,
      subtext: language === 'so' ? 'dakhliga - kharashaadka' : 'revenue minus expenses',
      icon: TrendingUp,
      action: () => onNavigate('reports')
    }
  ];

  return (
    <div className="space-y-3 pb-8 sm:pb-6 max-w-7xl mx-auto">
      {/* 1. FlowAI & CloseCRM Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
              style={{ background: rConf.bg, color: rConf.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: rConf.color }} />
              {rConf.label}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
            {t.welcomeGreeting}, <span className="text-slate-900">{currentUser.name}</span>!
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
            {currentUser.role === 'cashier'
              ? (language === 'so'
                  ? 'Xogta muujinaysa waa iibkaaga shiftkaaga. Shidaalka shub oo rasiidhada soo qaad.'
                  : 'Showing your shift sales only. Process fuel sales and issue receipts.')
              : (language === 'so'
                  ? 'Xarunta kormeerka dhuumaha, haamaha shidaalka iyo dhaqdhaqaaqa iibka xilligan.'
                  : 'Real-time telemetry, automated tank monitoring, and POS operations.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('sales')}
            className="btn-primary flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newSale}</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards Row (CloseCRM / FlowAI Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            onClick={kpi.action}
            className="card card-hover p-4 sm:p-4.5 bg-white flex flex-col justify-between cursor-pointer transition-all hover:border-slate-300"
          >
            <div>
              {/* Header with CloseCRM accent bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1 h-3 rounded-full"
                    style={{ background: kpi.indicatorColor }}
                  />
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {kpi.title}
                  </span>
                </div>
              </div>

              {/* Huge Bold Value */}
              <div className="text-[26px] font-extrabold text-[#0F172A] tracking-tight mt-2.5">
                {kpi.value}
              </div>
            </div>

            {/* Subtitle / Trend Badge */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F3F6]">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                kpi.badgePositive
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                {kpi.badgePositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.badge}
              </span>
              <span className="text-[11.5px] text-slate-400 font-medium">
                {kpi.subtext}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Middle Analytics Section (CloseCRM Revenue Overview + Lead Sources Donut) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* Left: Revenue Overview Smooth Chart (CloseCRM style) */}
        <div className="xl:col-span-8 card p-4.5 sm:p-5 bg-white flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
                  {t.salesOverview}
                </h2>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              </div>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {language === 'so' ? 'Kormeerka saacadaha ugu mashquulka badan' : 'Peak pumping & revenue telemetry'}
              </p>
            </div>

            {/* Segmented Period Tabs */}
            <div className="segmented-control self-start sm:self-auto">
              {(['today', 'week', 'month'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSalesTimeframe(tab)}
                  className={`segmented-item ${salesTimeframe === tab ? 'active' : ''}`}
                >
                  {tab === 'today' ? t.today : tab === 'week' ? t.thisWeek : t.thisMonth}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Dynamic Smooth Curve Area Chart */}
          <div className="relative h-56 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Subtle Horizontal Grid lines */}
              <line x1="0" y1="40" x2="700" y2="40" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="700" y2="140" stroke="#F1F3F6" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="185" x2="700" y2="185" stroke="#ECEEF2" strokeWidth="1" />

              {hasHourlyData ? (
                <>
                  {/* Area 1 (Revenue) */}
                  <path d={revAreaD} fill="url(#revenueGrad)" />

                  {/* Curve 1 (Revenue) */}
                  <path d={revPathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Curve 2 (Fuel Volume Litres) */}
                  <path d={litPathD} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />

                  {/* Dynamic Points with dots */}
                  {revCoords.map((pt, i) => (
                    pt.amount > 0 ? (
                      <circle key={i} cx={pt.x} cy={pt.y} r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
                    ) : null
                  ))}
                </>
              ) : (
                <>
                  {/* Flat baseline when no sales */}
                  <line x1="20" y1="185" x2="680" y2="185" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
                </>
              )}
            </svg>

            {!hasHourlyData && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100/90 text-slate-500 border border-slate-200">
                  {language === 'so' ? 'Wali wax iib ah lama samayn muddadan' : 'No sales recorded for this period yet'}
                </span>
              </div>
            )}

            {/* X-Axis labels */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              {timeBuckets.map((b, i) => (
                <span key={i}>{b.label}</span>
              ))}
            </div>
          </div>

          {/* Chart Legend Footer */}
          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-[#F1F3F6] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="font-medium text-slate-700">Revenue ($)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="font-medium text-slate-700">Fuel Litres (L)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-semibold ml-auto">
              <span>{hasHourlyData && peakPoint.amount > 0 ? `Peak: ${peakPoint.hour} ($${peakPoint.amount.toFixed(2)})` : (language === 'so' ? 'Wali iib ma jiro' : 'No sales yet')}</span>
            </div>
          </div>
        </div>

        {/* Right: Fuel Share Donut Chart (CloseCRM Lead Sources style) */}
        <div className="xl:col-span-4 card p-4.5 sm:p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
                  {language === 'so' ? 'Qaybta Shidaalka' : 'Fuel Distribution'}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  {language === 'so' ? 'Saamiga noocyada shidaalka' : 'Sales share by product'}
                </p>
              </div>
            </div>

            {/* Circular Donut Diagram */}
            <div className="flex items-center justify-center py-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {totalFuelDistributed === 0 ? (
                    <circle
                      cx="50" cy="50" r="38"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="10"
                    />
                  ) : (
                    <>
                      {/* PMS Ring */}
                      {pmsPct > 0 && (
                        <circle
                          cx="50" cy="50" r="38"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="11"
                          strokeDasharray={`${pmsPct * 2.38} 238`}
                          strokeDashoffset="0"
                        />
                      )}
                      {/* AGO Ring */}
                      {agoPct > 0 && (
                        <circle
                          cx="50" cy="50" r="38"
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="11"
                          strokeDasharray={`${agoPct * 2.38} 238`}
                          strokeDashoffset={`-${pmsPct * 2.38}`}
                        />
                      )}
                      {/* DPK Ring */}
                      {dpkPct > 0 && (
                        <circle
                          cx="50" cy="50" r="38"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="11"
                          strokeDasharray={`${dpkPct * 2.38} 238`}
                          strokeDashoffset={`-${(pmsPct + agoPct) * 2.38}`}
                        />
                      )}
                      {/* LPG Ring */}
                      {lpgPct > 0 && (
                        <circle
                          cx="50" cy="50" r="38"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="11"
                          strokeDasharray={`${lpgPct * 2.38} 238`}
                          strokeDashoffset={`-${(pmsPct + agoPct + dpkPct) * 2.38}`}
                        />
                      )}
                    </>
                  )}
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {totalFuelDistributed === 0 ? 'Total' : 'Total'}
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    {totalTransactions}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {totalFuelDistributed === 0 ? 'Iib ma jiro' : 'Pumps'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Donut Legend List */}
          <div className="space-y-2 pt-2 border-t border-[#F1F3F6]">
            {[
              { label: language === 'so' ? 'Baasiin (PMS)' : 'Petrol (PMS)', pct: pmsPct, color: '#10B981', code: 'PMS' },
              { label: language === 'so' ? 'Naafto (AGO)' : 'Diesel (AGO)', pct: agoPct, color: '#F59E0B', code: 'AGO' },
              { label: language === 'so' ? 'Gaas Cad (DPK)' : 'Kerosene (DPK)', pct: dpkPct, color: '#3B82F6', code: 'DPK' },
              { label: language === 'so' ? 'Gaaska LPG' : 'LPG Gas', pct: lpgPct, color: '#8B5CF6', code: 'LPG' },
            ].map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />
                  <span className="font-medium text-slate-700">{f.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{f.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3.5. Integrated Accounting & Shift Balancing Dashboard Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* 1. Khasnadda & Lacag-Qabashada (Till & Mobile Money Breakdown) */}
        <div className="card p-4 sm:p-5 bg-white border border-[#ECEEF2] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {language === 'so' ? 'Khasnadda & Shift-ka (Cash & E-Money)' : 'Till & Payment Methods'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {language === 'so' ? 'Lacagaha gacanta ku jira & Mobile' : 'Real-time settlement balances'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                {language === 'so' ? 'Toos u Xisaabsan' : 'Reconciled'}
              </span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">💵 {language === 'so' ? 'Kaashka Khasnadda (Cash in Till):' : 'Cash in Drawer:'}</span>
                <b className="font-bold text-slate-900">${cashSales.toFixed(2)}</b>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-purple-800 font-medium">⚡ Golis Sahal:</span>
                <b className="font-bold text-purple-900">${sahalSales.toFixed(2)}</b>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="text-blue-800 font-medium">📱 Hormuud EVC Plus:</span>
                <b className="font-bold text-blue-900">${evcSales.toFixed(2)}</b>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-amber-800 font-medium">💳 Somtel eDahab:</span>
                <b className="font-bold text-amber-900">${edahabSales.toFixed(2)}</b>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">{language === 'so' ? 'Isku geynta lacagta soo xarootay:' : 'Total Collected:'}</span>
            <span className="text-sm font-black text-emerald-600">${(cashSales + totalMobileMoney).toFixed(2)}</span>
          </div>
        </div>

        {/* 2. Deymaha Macaamiisha & Gaadiidka (Customer Credit / Debts) */}
        <div className="card p-4 sm:p-5 bg-white border border-[#ECEEF2] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {language === 'so' ? 'Deymaha Macaamiisha (Receivables)' : 'Customer Credit Ledger'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {language === 'so' ? 'Gaadiidka & shirkadaha deynta qaatay' : 'Outstanding company fleet balances'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('customers')}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {t.viewAll} →
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-100/80 mb-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {language === 'so' ? 'Isku-geynta Deynta Furan:' : 'Total Outstanding Balance:'}
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ${totalCustomerDebt.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {activeDebtorsCount} {language === 'so' ? 'macaamiil ayaa deyn ku socotaa' : 'active debtor accounts'}
              </div>
            </div>

            {/* Quick list of top debt customers */}
            <div className="space-y-1.5 text-xs">
              {customers.filter(c => c.currentBalance > 0).slice(0, 2).map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800 truncate max-w-[140px]">{c.name}</span>
                  <span className="font-bold text-amber-700">${c.currentBalance.toFixed(2)}</span>
                </div>
              ))}
              {customers.filter(c => c.currentBalance > 0).length === 0 && (
                <div className="text-center py-3 text-slate-400 text-xs">
                  {language === 'so' ? 'Dhammaan macaamiishu deyn ma qabaan (0 Deyn)' : 'No outstanding customer balances'}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('customers')}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer text-center"
          >
            {language === 'so' ? 'Maamul Macaamiisha & Deynta' : 'Manage Customers & Debts'}
          </button>
        </div>

        {/* 3. Kharashaadka & Faa'iidada (Operating Expenses & Net Margin) */}
        <div className="card p-4 sm:p-5 bg-white border border-[#ECEEF2] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {language === 'so' ? "Kharashka & Faa'iidada (P&L Summary)" : 'Expenses & Net Profit'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {language === 'so' ? 'Xisaabinta dakhliga ka haray kharashka' : 'Net station operating financial health'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('finance')}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {t.viewAll} →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                <span className="text-[10px] font-bold uppercase text-rose-700 block">{language === 'so' ? 'Kharashka Baxay' : 'Total Expenses'}</span>
                <span className="text-lg font-black text-slate-900">${totalExpenses.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{expenses.length} {language === 'so' ? 'qodob' : 'records'}</span>
              </div>
              <div className={`p-3 rounded-xl border ${netOperatingProfit >= 0 ? 'bg-emerald-50/70 border-emerald-100' : 'bg-rose-50/70 border-rose-100'}`}>
                <span className={`text-[10px] font-bold uppercase block ${netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {language === 'so' ? "Faa'iidada Saafiga ah" : 'Net Margin'}
                </span>
                <span className={`text-lg font-black ${netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ${netOperatingProfit.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {netOperatingProfit >= 0 ? (language === 'so' ? 'Faa\'iido furan' : 'In surplus') : (language === 'so' ? 'Khasaare ku jira' : 'In deficit')}
                </span>
              </div>
            </div>

            {/* Recent Expenses preview */}
            <div className="space-y-1.5 text-xs">
              {expenses.slice(0, 2).map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="truncate max-w-[150px]">
                    <span className="font-semibold text-slate-800 block truncate">{e.description}</span>
                    <span className="text-[9px] text-slate-400">{e.category}</span>
                  </div>
                  <span className="font-bold text-rose-600">-${e.amount.toFixed(2)}</span>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-3 text-slate-400 text-xs">
                  {language === 'so' ? 'Wali wax kharash ah lama qorin' : 'No expenses recorded yet'}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('finance')}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer text-center"
          >
            {language === 'so' ? 'Diiwaangeli Kharash Cusub' : 'Add Station Expense'}
          </button>
        </div>
      </div>

      {/* 4. Lower Section (Recently Updated Sales + Active Tanks Cards) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* Left: Recently Updated Sales Table (CloseCRM Recent Deals Style) */}
        <div className="xl:col-span-8 card bg-white overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#ECEEF2] flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
                {language === 'so' ? 'Iibkii Ugu Dambeeyay' : 'Recently Updated Sales'}
              </h2>
              <p className="text-[11.5px] text-slate-400 mt-0.5">
                {language === 'so' ? 'Liiska macaamiisha iyo rasiidhada maanta' : 'Real-time transaction audit & receipts'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('sales')}
                className="text-xs font-semibold text-slate-900 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{t.viewAll}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Fuel & Litres</th>
                  <th>Operator</th>
                  <th>Total</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {roleSales.slice(0, 5).map(sale => {
                  const fc = FUEL_COLORS[sale.fuelType] || FUEL_COLORS.PMS;
                  const pm = PAYMENT_COLORS[sale.paymentMethod] || PAYMENT_COLORS.cash;
                  const timeStr = new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => onSelectSaleReceipt(sale)}
                      className="cursor-pointer"
                    >
                      <td className="font-mono text-xs font-semibold text-slate-900">
                        {sale.saleNumber}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: fc.fill }}
                          />
                          <span className="font-semibold text-slate-900">
                            {sale.fuelType}
                          </span>
                          <span className="text-slate-400 text-xs">
                            · {sale.litres.toFixed(1)} L
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-slate-600 text-xs font-medium">
                          {sale.cashierName.split(' ')[0]}
                        </span>
                      </td>
                      <td className="font-bold text-slate-900">
                        ${sale.totalAmount.toFixed(2)}
                      </td>
                      <td>
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border"
                          style={{
                            background: pm.bg,
                            color: pm.text,
                            borderColor: pm.border
                          }}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-green">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {roleSales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      {currentUser.role === 'cashier'
                        ? (language === 'so' ? 'Wali iib kuma shiftanid maanta. Bilow iib cusub.' : 'No sales in your current shift. Start a new sale.')
                        : (language === 'so' ? 'Wali iib ma jiro. Riix "+ Iib Cusub" si aad u bilowdo.' : 'No sales recorded yet. Click "+ New Sale" to begin.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Active Tanks Stock Telemetry (FlowAI Template Style) */}
        <div className="xl:col-span-4 card p-4 sm:p-4.5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
                  {t.fuelStockLevel}
                </h2>
                <p className="text-[11.5px] text-slate-400 mt-0.5">
                  {language === 'so' ? 'Heerka awoodda haamaha' : 'Tank telemetry & dipsticks'}
                </p>
              </div>

              <button
                onClick={() => onNavigate('tanks')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t.viewAll}
              </button>
            </div>

            {/* Tank Telemetry Rows */}
            <div className="space-y-3.5">
              {tanks.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#F8F9FA] border border-[#ECEEF2] text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      {language === 'so' ? 'Haamo shidaal wali lama diiwaangelin' : 'No tanks registered yet'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'so'
                        ? 'Diiwaangeli haamahaaga oo gal shidaalka booyaddu keentay.'
                        : 'Register your tanks and record bulk deliveries.'}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('tanks')}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span>{language === 'so' ? 'Diiwaangeli Haamo' : 'Setup Tanks'}</span>
                  </button>
                </div>
              ) : (
                tanks.map(tank => {
                  const hasStock = (tank.currentLevel || 0) > 0;
                  const capacity = tank.capacity || 10000;
                  const pct = hasStock ? Math.min(100, Math.max(0, Math.round(((tank.currentLevel || 0) / capacity) * 100))) : 0;
                  const fc  = FUEL_COLORS[tank.fuelType] || FUEL_COLORS.PMS;
                  const isLow = pct < 25;

                  return (
                    <div
                      key={tank.id}
                      className="p-3 rounded-xl bg-[#F8F9FA] border border-[#ECEEF2] space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: fc.bg, color: fc.text }}
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-tight">
                              {tank.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {tank.fuelType} · ${tank.unitPrice ? tank.unitPrice.toFixed(2) : '0.00'}/L
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-xs font-bold ${!hasStock ? 'text-slate-400' : isLow ? 'text-red-600' : 'text-slate-900'}`}>
                            {pct}%
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            ({(tank.currentLevel || 0).toLocaleString()}L)
                          </span>
                        </div>
                      </div>

                      <div className="fuel-bar-track">
                        <div
                          className="fuel-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: !hasStock ? '#CBD5E1' : isLow ? '#EF4444' : fc.fill
                          }}
                        />
                      </div>

                      {!hasStock && (
                        <div className="flex items-center justify-between pt-0.5 text-[10px]">
                          <span className="text-amber-600 font-medium">
                            {language === 'so' ? 'Haantu way madhan tahay' : 'Empty tank'}
                          </span>
                          <button
                            onClick={() => onNavigate('tanks')}
                            className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                          >
                            {language === 'so' ? 'Ku shub shidaal' : 'Log Delivery'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('sales')}
            className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all bg-[#111318] hover:bg-black text-white shadow-xs"
          >
            <span>Open POS Terminal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
