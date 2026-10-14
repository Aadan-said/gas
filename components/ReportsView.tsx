'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  Droplet,
  Wallet,
  Receipt,
  Users,
  ShieldCheck,
  TrendingUp,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
} from 'lucide-react';
import { Sale, Tank, Expense, Customer, CustomerPayment, AuditLog } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface ReportsViewProps {
  sales: Sale[];
  tanks: Tank[];
  expenses: Expense[];
  customers: Customer[];
  payments?: CustomerPayment[];
  auditLogs: AuditLog[];
  language: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  tanks,
  expenses,
  customers,
  payments = [],
  auditLogs,
  language
}) => {
  const t = translations[language];

  const [selectedReport, setSelectedReport] = useState<
    'sales' | 'fuel' | 'cash' | 'expense' | 'customer' | 'audit'
  >('sales');

  const reportCards = [
    {
      id: 'sales',
      title: language === 'so' ? 'Iibka Shidaalka' : 'Sales Report',
      desc: language === 'so' ? 'Iibka guud & rasiidhada' : 'Daily / Weekly / Monthly',
      icon: Receipt,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      id: 'customer',
      title: language === 'so' ? 'Macaamiisha & Deynta' : 'Customer Report',
      desc: language === 'so' ? 'Deynta & lacag-bixinta' : 'Debts, limits & balances',
      icon: Users,
      color: 'bg-cyan-100 text-cyan-600'
    },
    {
      id: 'fuel',
      title: language === 'so' ? 'Haamaha & Kaydka' : 'Fuel Stock Report',
      desc: language === 'so' ? 'Heerka shidaalka ku jira' : 'Tank levels & calibration',
      icon: Droplet,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'cash',
      title: language === 'so' ? 'Qasnada & Golis/E-Money' : 'Cash Report',
      desc: language === 'so' ? 'Lacagaha caddaan & Sahal' : 'Cash in hand & e-money',
      icon: Wallet,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'expense',
      title: language === 'so' ? 'Kharashka Kaalinta' : 'Expense Report',
      desc: language === 'so' ? 'Kharashaadka guud ee baxay' : 'Station operational expenses',
      icon: Receipt,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      id: 'audit',
      title: language === 'so' ? 'Diiwaanka Ficillada' : 'Audit Log',
      desc: language === 'so' ? 'Tirtirka & dhaqdhaqaaqa' : 'User actions & voids audit',
      icon: ShieldCheck,
      color: 'bg-rose-100 text-rose-600'
    }
  ];

  // Totals calculations
  const totalSalesAmount = sales.filter(s => s.paymentStatus === 'paid').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalSalesLitres = sales.filter(s => s.paymentStatus === 'paid').reduce((sum, s) => sum + s.litres, 0);
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalDebtCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  // Cash / E-Money breakdown
  const cashPayments = sales.filter(s => s.paymentMethod === 'cash' && s.paymentStatus === 'paid').reduce((sum, s) => sum + s.totalAmount, 0);
  const sahalPayments = sales.filter(s => s.paymentMethod === 'sahal' && s.paymentStatus === 'paid').reduce((sum, s) => sum + s.totalAmount, 0);
  const evcPayments = sales.filter(s => s.paymentMethod === 'evc' && s.paymentStatus === 'paid').reduce((sum, s) => sum + s.totalAmount, 0);
  const edahabPayments = sales.filter(s => s.paymentMethod === 'edahab' && s.paymentStatus === 'paid').reduce((sum, s) => sum + s.totalAmount, 0);
  const creditSalesAmount = sales.filter(s => s.paymentMethod === 'credit' && s.paymentStatus === 'paid').reduce((sum, s) => sum + s.totalAmount, 0);

  const exportCSV = () => {
    let rows: string[] = [];
    if (selectedReport === 'sales') {
      rows.push('Receipt,Date,Fuel,Litres,Price,Total,Payment,Status');
      sales.forEach(s =>
        rows.push(
          `${s.saleNumber},${s.createdAt},${s.fuelType},${s.litres},${s.unitPrice},${s.totalAmount},${s.paymentMethod},${s.paymentStatus}`
        )
      );
    } else if (selectedReport === 'customer') {
      rows.push('Customer,Phone,Company,CreditLimit,TotalCreditTaken,TotalPaid,RemainingDebt,Status');
      customers.forEach(c => {
        const custSales = sales.filter(s => s.customerId === c.id && s.paymentMethod === 'credit' && s.paymentStatus !== 'voided');
        const custPays = payments.filter(p => p.customerId === c.id);
        const taken = custSales.reduce((acc, s) => acc + s.totalAmount, 0);
        const paid = custPays.reduce((acc, p) => acc + p.amount, 0);
        rows.push(
          `"${c.name}","${c.phone}","${c.company || ''}",${c.creditLimit},${taken},${paid},${c.currentBalance},${c.status}`
        );
      });
    } else if (selectedReport === 'fuel') {
      rows.push('TankNumber,Name,FuelType,Capacity,CurrentLevel,UnitPrice,StockValueUSD,Status');
      tanks.forEach(t => {
        const val = t.currentLevel * t.unitPrice;
        rows.push(`${t.tankNumber},"${t.name}",${t.fuelType},${t.capacity},${t.currentLevel},${t.unitPrice},${val.toFixed(2)},${t.status}`);
      });
    } else if (selectedReport === 'cash') {
      rows.push('Receipt,Date,Method,Amount,Cashier,Status');
      sales.forEach(s => {
        rows.push(`${s.saleNumber},${s.createdAt},${s.paymentMethod},${s.totalAmount},"${s.cashierName}",${s.paymentStatus}`);
      });
    } else if (selectedReport === 'expense') {
      rows.push('Date,Category,Description,Amount,Receipt,AddedBy');
      expenses.forEach(e =>
        rows.push(`${e.createdAt},${e.category},"${e.description}",${e.amount},${e.receiptNumber || ''},${e.addedBy}`)
      );
    } else {
      rows.push('Id,User,Action,Details,Date');
      auditLogs.forEach(a => rows.push(`${a.id},"${a.userName}","${a.action}","${a.details}",${a.createdAt}`));
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GasFlow_${selectedReport}_Gaalkacyo.csv`;
    a.click();
  };

  return (
    <div className="space-y-3 pb-8 sm:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>{t.reports}</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Warbixinnada xisaabaadka Kaalinta Shidaalka Gaalkacyo, deynta, iibka iyo daabacaadda.'
              : 'Station analytics, customer debt reconciliation, fuel stock audit, and exportable CSVs.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="btn-primary flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'so' ? 'Soo Dejiso CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* 6 Report Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {reportCards.map(rc => {
          const Icon = rc.icon;
          const isSelected = selectedReport === rc.id;

          return (
            <button
              key={rc.id}
              onClick={() => setSelectedReport(rc.id as any)}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer relative ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-[#ECEEF2] hover:border-[#DDE1E8] hover:shadow-xs hover:bg-[#FAFBFC]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={`w-8 h-8 rounded-xl ${rc.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs leading-tight text-slate-900">
                  {rc.title}
                </div>
                <div className="text-[10px] mt-0.5 text-slate-400">
                  {rc.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Report Container */}
      <div className="bg-white p-4.5 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>
                {selectedReport === 'sales' && (language === 'so' ? 'Warbixinta Iibka Shidaalka' : 'Sales Report')}
                {selectedReport === 'customer' && (language === 'so' ? 'Warbixinta Macaamiisha & Xisaabaadka Deynta' : 'Customer & Credit Debt Report')}
                {selectedReport === 'fuel' && (language === 'so' ? 'Warbixinta Haamaha & Kaydka Shidaalka' : 'Fuel Stock Telemetry Report')}
                {selectedReport === 'cash' && (language === 'so' ? 'Warbixinta Lacagaha (Caddaan, Sahal & E-Money)' : 'Cash & Mobile Money Report')}
                {selectedReport === 'expense' && (language === 'so' ? 'Warbixinta Kharashka Kaalinta' : 'Operational Expense Report')}
                {selectedReport === 'audit' && (language === 'so' ? 'Diiwaanka Ficillada & Tirtirka' : 'System Audit Log')}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'so' ? 'Kaalimaha Shidaalka Gaalkacyo • Xisaab-xirka Rasmiga ah' : 'Kaalimaha Shidaalka Gaalkacyo • Official Reconciliation'}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold self-start cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'so' ? 'Daabac Warbixinta' : 'Print Report'}</span>
          </button>
        </div>

        {/* 1. SALES REPORT */}
        {selectedReport === 'sales' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-700 uppercase block">{language === 'so' ? 'Wadarta Dakhliga Iibka' : 'Total Revenue'}</span>
                <span className="text-xl font-black text-emerald-800">${totalSalesAmount.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-[11px] font-bold text-blue-700 uppercase block">{language === 'so' ? 'Wadarta Litirrada La Iibiyay' : 'Total Fuel Sold'}</span>
                <span className="text-xl font-black text-blue-800">{totalSalesLitres.toFixed(1)} L</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase block">{language === 'so' ? 'Tirada Iibka' : 'Transactions'}</span>
                <span className="text-xl font-black text-slate-900">{sales.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{language === 'so' ? 'Rasiidhada' : 'Receipt'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Shidaalka' : 'Fuel'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Litir / Qadarka' : 'Quantity'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Qiimaha' : 'Price'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Wadarta' : 'Total'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Habka Lacagta' : 'Payment'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Khasnajiga' : 'Cashier'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Xaaladda' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{s.saleNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{s.fuelType}</td>
                      <td className="py-3.5 px-4 text-slate-700">{s.litres.toFixed(s.fuelType === 'LPG' ? 0 : 2)} {s.fuelType === 'LPG' ? (language === 'so' ? 'Dhululubo' : 'Cyl') : 'L'}</td>
                      <td className="py-3.5 px-4 text-slate-500">${s.unitPrice.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900">${s.totalAmount.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-bold uppercase text-[10.5px]">
                        {s.paymentMethod === 'sahal' ? 'Golis Sahal' : s.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{s.cashierName}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {s.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. CUSTOMER & DEBT REPORT — WITH ACCURATE BALANCE CALCULATION */}
        {selectedReport === 'customer' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[11px] font-bold text-rose-700 uppercase block">
                  {language === 'so' ? 'Wadarta Deynta Guud ee Maanta' : 'Total Outstanding Debt'}
                </span>
                <span className="text-xl font-black text-rose-700">${totalOutstandingDebt.toFixed(2)}</span>
                <span className="text-[10.5px] text-rose-600/80 block mt-0.5">
                  {language === 'so' ? 'Lacagta macaamiisha lagu leeyahay' : 'Unsettled customer receivables'}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-700 uppercase block">
                  {language === 'so' ? 'Wadarta Lacagaha La Qabtay' : 'Total Debt Recovered'}
                </span>
                <span className="text-xl font-black text-emerald-700">${totalDebtCollected.toFixed(2)}</span>
                <span className="text-[10.5px] text-emerald-600/80 block mt-0.5">
                  {payments.length} {language === 'so' ? 'lacag-bixinood oo la diiwaangeliyay' : 'payments recorded'}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-700 uppercase block">
                  {language === 'so' ? 'Macaamiisha Deynta Leh' : 'Active Debtors'}
                </span>
                <span className="text-xl font-black text-amber-700">
                  {customers.filter(c => c.currentBalance > 0).length} / {customers.length}
                </span>
                <span className="text-[10.5px] text-amber-600/80 block mt-0.5">
                  {language === 'so' ? 'Macaamiil leh haraa furan' : 'Accounts with open balance'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{language === 'so' ? 'Magaca Macmiilka' : 'Customer Name'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Telefoonka Golis' : 'Phone'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Shirkadda / Gaariga' : 'Company'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Xadka Deynta' : 'Credit Limit'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Deynta La Qaatay' : 'Total Credit Taken'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Wadarta La Bixiyay' : 'Total Paid'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Haraaga Deynta' : 'Current Balance'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Xaaladda' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {customers.map(c => {
                    const custSales = sales.filter(s => s.customerId === c.id && s.paymentMethod === 'credit' && s.paymentStatus !== 'voided');
                    const custPays = payments.filter(p => p.customerId === c.id);
                    const taken = custSales.reduce((acc, s) => acc + s.totalAmount, 0);
                    const paid = custPays.reduce((acc, p) => acc + p.amount, 0);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">{c.phone}</td>
                        <td className="py-3.5 px-4 text-slate-600">{c.company || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold">${c.creditLimit.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-slate-900 font-bold">${taken.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">${paid.toFixed(2)}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                              c.currentBalance > 0
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}
                          >
                            ${c.currentBalance.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. FUEL STOCK REPORT */}
        {selectedReport === 'fuel' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{language === 'so' ? 'Lambarka Haanta' : 'Tank'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Nooca Shidaalka' : 'Fuel Name'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Awoodda Haanta' : 'Capacity'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Kaydka Hadda Ku Jira' : 'Current Stock'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Boqolkiiba' : 'Percentage'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Qiimaha Litirka/Dhululubo' : 'Unit Price'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Qiimaha Lacageed ee Kaydka' : 'Stock Value'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Xaaladda' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tanks.map(t => {
                    const pct = Math.min(100, Math.round((t.currentLevel / t.capacity) * 100));
                    const stockVal = t.currentLevel * t.unitPrice;
                    const isLPG = t.fuelType === 'LPG';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 font-bold text-blue-600 font-mono">{t.tankNumber}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{t.name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{t.capacity.toLocaleString()} {isLPG ? (language === 'so' ? 'Dhululubo' : 'Cyl') : 'L'}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {t.currentLevel.toLocaleString()} {isLPG ? (language === 'so' ? 'Dhululubo' : 'Cyl') : 'L'}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          <div className="flex items-center gap-2">
                            <span>{pct}%</span>
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${pct < 25 ? 'bg-rose-500' : pct < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">${t.unitPrice.toFixed(2)}{isLPG ? (language === 'so' ? '/Dhululubo' : '/Cyl') : '/L'}</td>
                        <td className="py-3.5 px-4 font-black text-blue-600">${stockVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              t.status === 'normal'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. CASH & MOBILE MONEY REPORT */}
        {selectedReport === 'cash' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Golis Sahal</span>
                <span className="text-lg font-black text-purple-800">${sahalPayments.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">{language === 'so' ? 'Caddaan (Cash)' : 'Cash'}</span>
                <span className="text-lg font-black text-emerald-800">${cashPayments.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">EVC Plus</span>
                <span className="text-lg font-black text-blue-800">${evcPayments.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">eDahab</span>
                <span className="text-lg font-black text-amber-800">${edahabPayments.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">{language === 'so' ? 'Iibka Deynta' : 'Credit Sales'}</span>
                <span className="text-lg font-black text-rose-800">${creditSalesAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{language === 'so' ? 'Rasiid' : 'Receipt'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Taariikhda' : 'Date'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Habka Lacag-bixinta' : 'Method'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Macmiilka' : 'Customer'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Qadarka' : 'Amount'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Khasnajiga' : 'Cashier'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{s.saleNumber}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-bold uppercase text-slate-800">
                        {s.paymentMethod === 'sahal' ? 'Golis Sahal' : s.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{s.customerName || 'Walk-in'}</td>
                      <td className="py-3 px-4 font-black text-slate-900">${s.totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-600">{s.cashierName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. EXPENSE REPORT */}
        {selectedReport === 'expense' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase block">{language === 'so' ? 'Wadarta Kharashka Baxay' : 'Total Expenses'}</span>
                <span className="text-xl font-black text-amber-800">${totalExpensesAmount.toFixed(2)}</span>
              </div>
              <span className="text-xs text-amber-700 font-semibold">{expenses.length} {language === 'so' ? 'kharash' : 'records'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{language === 'so' ? 'Taariikhda' : 'Date'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Qaybta' : 'Category'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Faahfaahin' : 'Description'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Lacagta' : 'Amount'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Rasiid / Tixraac' : 'Receipt #'}</th>
                    <th className="py-3 px-4">{language === 'so' ? 'Qofka Qoray' : 'Recorded By'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{e.createdAt}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 uppercase text-[10.5px]">{e.category}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{e.description}</td>
                      <td className="py-3.5 px-4 font-black text-rose-600">${e.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{e.receiptNumber || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{e.addedBy}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        {language === 'so' ? 'Wax kharash ah lama diiwaangelin.' : 'No expenses recorded.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. AUDIT REPORT */}
        {selectedReport === 'audit' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{language === 'so' ? 'Waqtiga' : 'Time'}</th>
                  <th className="py-3 px-4">{language === 'so' ? 'Isticmaalaha' : 'User'}</th>
                  <th className="py-3 px-4">{language === 'so' ? 'Ficilka' : 'Action'}</th>
                  <th className="py-3 px-4">{language === 'so' ? 'Faahfaahinta' : 'Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{log.userName}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600 font-mono text-[11px]">{log.action}</td>
                    <td className="py-3.5 px-4 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
