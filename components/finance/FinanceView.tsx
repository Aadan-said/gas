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
  Calendar,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Expense, ExpenseCategory, User, Sale, Customer } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { Modal } from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';

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

const CATEGORY_MAP: Record<ExpenseCategory, { so: string; en: string }> = {
  'Electricity': { so: 'Koronto & Matoorka (Generator & Power)', en: 'Electricity & Generator' },
  'Maintenance': { so: 'Dayactirka Kaalinta (Station Maintenance)', en: 'Station Maintenance' },
  'Salaries': { so: 'Mushaarka & Gunnooyinka (Staff Salaries)', en: 'Staff Salaries & Allowances' },
  'Rent': { so: 'Kirada Goobta (Rent & Leases)', en: 'Rent & Lease' },
  'Office Supplies': { so: 'Agabka Xafiiska & Nadiifinta (Office Supplies)', en: 'Office & Cleaning Supplies' },
  'Taxes': { so: 'Canshuuraha & Dawladda (Taxes & Municipal)', en: 'Taxes & Municipal Fees' },
  'Other': { so: 'Kharashaad Kale (Other Expenses)', en: 'Other Miscellaneous' }
};

export const FinanceView: React.FC<FinanceViewProps> = ({
  expenses,
  sales,
  customers,
  currentUser,
  language,
  onAddExpense
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'expenses' | 'cashflow' | 'debts'>('expenses');
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
      description: description.trim(),
      amount: a,
      receiptNumber: receiptNumber.trim() || `EXP-${Date.now().toString().slice(-4)}`
    });

    setModalOpen(false);
    setDescription('');
    setAmount('');
    setReceiptNumber('');
  };

  const categories: ExpenseCategory[] = [
    'Electricity',
    'Maintenance',
    'Salaries',
    'Office Supplies',
    'Rent',
    'Taxes',
    'Other'
  ];

  return (
    <div className="space-y-4 pb-8 sm:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span>{language === 'so' ? 'Maaliyadda & Kharashka' : 'Finance & Expenses'}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Diiwaanka kharashaadka saldhigga, dakhliga soo xarooday iyo xisaab-celinta khasnadda Gaalkacyo.'
              : 'Station cash flow, operational overhead expenses, revenue and customer credit summaries.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'so' ? 'Kharash Cusub' : 'Add Expense'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'expenses', label: language === 'so' ? 'Kharashaadka Baxay' : 'Expenses' },
          { id: 'cashflow', label: language === 'so' ? 'Dhaqdhaqaaqa Khasnadda' : 'Cash Flow' },
          { id: 'debts', label: language === 'so' ? 'Deymaha Macaamiisha' : 'Customer Debts' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-3 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {language === 'so' ? 'Wadarta Dakhliga' : 'Total Revenue'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            ${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{language === 'so' ? 'Iibka guud ee xarunta' : 'Total station sales'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-3 rounded-full bg-rose-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {language === 'so' ? 'Wadarta Kharashka' : 'Total Expenses'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">
            ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{language === 'so' ? 'Kharashaadka hawlgalka' : 'Operational expenses'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-3 rounded-full bg-blue-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {language === 'so' ? 'Kaashka Gacanta Ku Jira' : 'Cash Collected'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600">
            ${totalCashCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{language === 'so' ? 'Lacagta caddaanka ah' : 'Physical cash collected'}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-3 rounded-full bg-amber-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {language === 'so' ? 'Deymaha Dibadda' : 'Customer Debts'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            ${totalDebts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{language === 'so' ? 'Xisaabaadka macaamiisha' : 'Credit accounts balance'}</p>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'so' ? 'Diiwaanka Kharashaadka Xarunta' : 'Station Expenses Record'}
            </h3>
            <p className="text-xs text-slate-500">
              {expenses.length} {language === 'so' ? 'kharash oo diiwaangashan' : 'recorded transactions'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{language === 'so' ? 'Taariikhda' : 'Date'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Qaybta' : 'Category'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Faahfaahinta' : 'Description'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Cadadka' : 'Amount'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Rasiidka #' : 'Receipt #'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Qofka Diiwaangeliyay' : 'Added By'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {language === 'so' ? 'Wali wax kharash ah lama diiwaangelin.' : 'No expenses recorded yet.'}
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{exp.createdAt}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {CATEGORY_MAP[exp.category]?.[language] || exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">{exp.description}</td>
                    <td className="py-3.5 px-4 font-black text-rose-600 text-sm whitespace-nowrap">
                      ${exp.amount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {exp.receiptNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{exp.addedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal with React Portal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={language === 'so' ? 'Kharash Cusub' : 'Add New Expense'}
        subtitle={
          language === 'so'
            ? 'Diiwaangeli lacagaha ka baxay xarunta sida matoorka, korontada, dayactirka iyo gunnooyinka.'
            : 'Record fuel station operational outflows and overhead costs.'
        }
        icon={<Wallet className="w-5 h-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Qaybta Kharashka (Category)' : 'Expense Category'}
            </label>
            <CustomSelect
              value={category}
              onChange={val => setCategory(val as ExpenseCategory)}
              options={categories.map(cat => ({
                value: cat,
                label: CATEGORY_MAP[cat]?.[language] || cat
              }))}
              placeholder={language === 'so' ? 'Dooro Qaybta Kharashka...' : 'Select Category...'}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Faahfaahinta Kharashka' : 'Description / Details'}
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={language === 'so' ? 'Tusaale: Saliidda matoorka iyo shaandhada' : 'e.g. Generator service & fuel filter'}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Cadadka Lacagta ($ USD)' : 'Amount ($ USD)'}
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-black text-xl text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />

            {/* Quick Amount Pills */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 font-semibold">{language === 'so' ? 'Degdeg:' : 'Quick:'}</span>
              {[5, 10, 20, 50, 100].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-bold text-[11px] transition-colors"
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Lambarka Rasiidka / Foojarka (Ikhtiyaari)' : 'Receipt / Voucher # (Optional)'}
            </label>
            <input
              type="text"
              value={receiptNumber}
              onChange={e => setReceiptNumber(e.target.value)}
              placeholder="e.g. REC-2026-001"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              {language === 'so' ? 'Ka noqo' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || !description.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-md shadow-blue-500/20 transition-colors"
            >
              {language === 'so' ? 'Diiwaangeli Kharashka' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
