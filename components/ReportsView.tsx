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
  Filter
} from 'lucide-react';
import { Sale, Tank, Expense, Customer, AuditLog } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface ReportsViewProps {
  sales: Sale[];
  tanks: Tank[];
  expenses: Expense[];
  customers: Customer[];
  auditLogs: AuditLog[];
  language: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  tanks,
  expenses,
  customers,
  auditLogs,
  language
}) => {
  const t = translations[language];

  const [selectedReport, setSelectedReport] = useState<
    'sales' | 'fuel' | 'cash' | 'expense' | 'customer' | 'audit'
  >('sales');
  const [dateRange, setDateRange] = useState('7');

  const reportCards = [
    {
      id: 'sales',
      title: 'Sales Report',
      desc: 'Daily / Weekly / Monthly',
      icon: Receipt,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      id: 'fuel',
      title: 'Fuel Stock Report',
      desc: 'Tank levels & movements',
      icon: Droplet,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'cash',
      title: 'Cash Report',
      desc: 'Cash in hand & E-movements',
      icon: Wallet,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'expense',
      title: 'Expense Report',
      desc: 'Station expenses',
      icon: Receipt,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      id: 'customer',
      title: 'Customer Report',
      desc: 'Debts & payments',
      icon: Users,
      color: 'bg-cyan-100 text-cyan-600'
    },
    {
      id: 'audit',
      title: 'Audit Log',
      desc: 'User activities & voids',
      icon: ShieldCheck,
      color: 'bg-rose-100 text-rose-600'
    }
  ];

  const exportCSV = () => {
    let rows: string[] = [];
    if (selectedReport === 'sales') {
      rows.push('Receipt,Date,Fuel,Litres,Price,Total,Payment,Status');
      sales.forEach(s =>
        rows.push(
          `${s.saleNumber},${s.createdAt},${s.fuelType},${s.litres},${s.unitPrice},${s.totalAmount},${s.paymentMethod},${s.paymentStatus}`
        )
      );
    } else if (selectedReport === 'expense') {
      rows.push('Date,Category,Description,Amount,Receipt,AddedBy');
      expenses.forEach(e =>
        rows.push(`${e.createdAt},${e.category},"${e.description}",${e.amount},${e.receiptNumber || ''},${e.addedBy}`)
      );
    } else {
      rows.push('Id,Details,Date');
      auditLogs.forEach(a => rows.push(`${a.id},"${a.action} - ${a.details}",${a.createdAt}`));
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GasFlow_${selectedReport}_Report.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <span>{t.reports}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Warbixinnada iibka, dakhliga, haamaha shidaalka iyo diiwaanka xisaabaadka.'
              : 'Station analytics, shift reconciliation, stock audit and exportable ledgers.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Apr 20, 2025 - Apr 29, 2025</span>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 6 Report Category Cards (Exact match from mockup!) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {reportCards.map(rc => {
          const Icon = rc.icon;
          const isSelected = selectedReport === rc.id;

          return (
            <button
              key={rc.id}
              onClick={() => setSelectedReport(rc.id as any)}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? 'bg-blue-50/50 border-blue-600 shadow-sm ring-1 ring-blue-600'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${rc.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 leading-tight">{rc.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{rc.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Report Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 capitalize">
            {selectedReport} Details
          </h2>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>

        {selectedReport === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt</th>
                  <th className="py-3 px-4">Fuel</th>
                  <th className="py-3 px-4">Litres</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{s.saleNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{s.fuelType}</td>
                    <td className="py-3.5 px-4 text-slate-700">{s.litres.toFixed(2)} L</td>
                    <td className="py-3.5 px-4 text-slate-500">${s.unitPrice.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">${s.totalAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-bold">{s.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-slate-600">{s.cashierName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                        {s.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'fuel' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tank</th>
                  <th className="py-3 px-4">Fuel Type</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tanks.map(t => {
                  const pct = Math.round((t.currentLevel / t.capacity) * 100);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-bold text-blue-600">{t.tankNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{t.name}</td>
                      <td className="py-3.5 px-4">{t.capacity.toLocaleString()} L</td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {t.currentLevel.toLocaleString()} L
                      </td>
                      <td className="py-3.5 px-4 font-bold">{pct}%</td>
                      <td className="py-3.5 px-4">${t.unitPrice.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'audit' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{log.userName}</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{log.action}</td>
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
