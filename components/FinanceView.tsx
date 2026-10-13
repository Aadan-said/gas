'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Expense, ExpenseCategory, User, Sale, Customer } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface FinanceViewProps {
  expenses: Expense[];
  sales: Sale[];
  customers: Customer[];
  currentUser: User;
  language: Language;
  onAddExpense: (expense: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    receiptNumber?: string;
  }) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  expenses,
  sales,
  customers,
  currentUser,
  language,
  onAddExpense
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'expenses' | 'cashflow' | 'deposits' | 'debts'>('expenses');
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState<ExpenseCategory>('Maintenance');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSales = sales.filter(s => s.paymentStatus === 'paid').reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCashCollected = sales
    .filter(s => s.paymentStatus === 'paid' && s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const totalDebts = customers.reduce((sum, c) => sum + c.currentBalance, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(amount) || 0;
    if (a <= 0 || !description.trim()) return;

    onAddExpense({
      category,
      description,
      amount: a,
      receiptNumber: receiptNumber || `EXP-${Date.now().toString().slice(-4)}`
    });

    setModalOpen(false);
    setDescription('');
    setAmount('');
    setReceiptNumber('');
  };

  const categories: ExpenseCategory[] = [
    'Office Supplies',
    'Maintenance',
    'Electricity',
    'Salaries',
    'Rent',
    'Taxes',
    'Other'
  ];

  return (
    <div className="space-y-3 pb-8 sm:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span>{language === 'so' ? 'Maaliyadda & Xisaabaadka' : 'Finance & Accounting'}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Kharashaadka xarunta, dhaqdhaqaaqa lacagta iyo xisaab-celinta khasnadda.'
              : 'Station cash flow, operational overhead expenses, bank deposits and reconciliations.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addExpense}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="segmented-control">
        {[
          { id: 'expenses', label: t.expenses },
          { id: 'cashflow', label: t.cashFlow },
          { id: 'deposits', label: t.deposits },
          { id: 'debts', label: t.debts }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`segmented-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-[#ECEEF2] shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1 h-3 rounded-full bg-emerald-600" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ${totalSales.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1 h-3 rounded-full bg-rose-600" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Expenses
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            ${totalExpenses.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1 h-3 rounded-full bg-blue-600" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Cash in Register
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ${(totalCashCollected - totalExpenses).toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1 h-3 rounded-full bg-amber-500" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Customer Credit Debts
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            ${totalDebts.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white p-4.5 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Added By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500">{exp.createdAt}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold">{exp.description}</td>
                  <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                    ${exp.amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {exp.receiptNumber || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{exp.addedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">{t.addExpense}</h3>
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Details</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Generator diesel maintenance service..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-black text-lg text-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Voucher / Receipt # (Optional)</label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  placeholder="e.g. REC-892"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
