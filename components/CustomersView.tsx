'use client';

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Building2,
  DollarSign,
  CreditCard,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  History,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import { Customer, CustomerPayment, PaymentMethod, User, Sale } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface CustomersViewProps {
  customers: Customer[];
  payments: CustomerPayment[];
  sales?: Sale[];
  currentUser: User;
  language: Language;
  onAddCustomer: (customer: { name: string; phone: string; company?: string; creditLimit: number }) => void;
  onRecordPayment: (payment: { customerId: string; amount: number; paymentMethod: PaymentMethod; reference?: string }) => void;
}

interface LedgerEntry {
  id: string;
  date: string;
  type: 'debit' | 'credit'; // debit = took fuel on credit (+debt), credit = payment made (-debt)
  title: string;
  details: string;
  amount: number;
  runningBalance: number;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  payments,
  sales = [],
  currentUser,
  language,
  onAddCustomer,
  onRecordPayment
}) => {
  const t = translations[language];

  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [payModalCustomer, setPayModalCustomer] = useState<Customer | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+252 090 ');
  const [newCompany, setNewCompany] = useState('');
  const [newLimit, setNewLimit] = useState('500');

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('sahal');
  const [payRef, setPayRef] = useState('');

  const filtered = customers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  const totalOutstanding = customers.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalRecovered = payments.reduce((sum, p) => sum + p.amount, 0);
  const activeDebtorsCount = customers.filter(c => c.currentBalance > 0).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      company: newCompany.trim(),
      creditLimit: parseFloat(newLimit) || 0
    });
    setAddModalOpen(false);
    setNewName('');
    setNewCompany('');
    setNewPhone('+252 090 ');
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalCustomer) return;
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) return;

    onRecordPayment({
      customerId: payModalCustomer.id,
      amount: amt,
      paymentMethod: payMethod,
      reference: payRef || `SAHAL-${Date.now().toString().slice(-4)}`
    });
    setPayModalCustomer(null);
    setPayAmount('');
    setPayRef('');
  };

  // Build statement ledger for selected customer
  const buildLedger = (cust: Customer): { entries: LedgerEntry[]; totalTaken: number; totalPaid: number } => {
    const custSales = sales.filter(
      s => s.customerId === cust.id && s.paymentMethod === 'credit' && s.paymentStatus !== 'voided'
    );
    const custPayments = payments.filter(p => p.customerId === cust.id);

    const rawList: Array<{
      id: string;
      date: string;
      type: 'debit' | 'credit';
      title: string;
      details: string;
      amount: number;
    }> = [];

    custSales.forEach(s => {
      rawList.push({
        id: s.id,
        date: s.createdAt,
        type: 'debit',
        title: language === 'so' ? `Iib Shidaal (${s.fuelType})` : `Fuel Credit (${s.fuelType})`,
        details: `${s.litres}L @ $${s.unitPrice.toFixed(2)} • Rasiid: ${s.saleNumber}`,
        amount: s.totalAmount
      });
    });

    custPayments.forEach(p => {
      const methodLabel = p.paymentMethod === 'sahal' ? 'Golis Sahal' : p.paymentMethod.toUpperCase();
      rawList.push({
        id: p.id,
        date: p.createdAt,
        type: 'credit',
        title: language === 'so' ? `Lacag-bixin (${methodLabel})` : `Repayment (${methodLabel})`,
        details: `${p.reference || 'Tixraac la\'aan'} • Qabtay: ${p.collectedBy || 'Khasnajiga'}`,
        amount: p.amount
      });
    });

    // Sort chronologically ascending
    rawList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const entries: LedgerEntry[] = rawList.map(item => {
      if (item.type === 'debit') {
        running += item.amount;
      } else {
        running = Math.max(0, running - item.amount);
      }
      return {
        ...item,
        runningBalance: parseFloat(running.toFixed(2))
      };
    });

    const totalTaken = custSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalPaid = custPayments.reduce((acc, p) => acc + p.amount, 0);

    return { entries: entries.reverse(), totalTaken, totalPaid };
  };

  const parsedPayAmount = parseFloat(payAmount) || 0;
  const payModalCurrentDebt = payModalCustomer ? payModalCustomer.currentBalance : 0;
  const payModalRemaining = Math.max(0, parseFloat((payModalCurrentDebt - parsedPayAmount).toFixed(2)));

  return (
    <div className="space-y-3 pb-8 sm:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>{t.customerManagement}</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Maamulka macaamiisha Kaalinta, xisaabaadka deynta, lacag-bixinta qaybta ah iyo bayaanka xisaabta.'
              : 'Fleet customer accounts, credit debt limits, partial settlements, and account ledgers.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setNewPhone('+252 090 ');
              setAddModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addCustomer}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Outstanding Debt */}
        <div className="card card-hover p-4 sm:p-4.5 bg-white flex flex-col justify-between border-l-4 border-l-rose-500">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'so' ? 'Wadarta Deynta Lagu Leeyahay' : 'Total Outstanding Debt'}
              </span>
            </div>
            <div className="text-[26px] font-extrabold text-rose-600 tracking-tight mt-2.5">
              ${totalOutstanding.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F3F6]">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              {language === 'so' ? 'Deyn Furan' : 'Open Credit'}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">
              {language === 'so' ? 'Lacag aan wali soo xeroon' : 'Awaiting collection'}
            </span>
          </div>
        </div>

        {/* Total Recovered */}
        <div className="card card-hover p-4 sm:p-4.5 bg-white flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'so' ? 'Lacagaha la Soo Qabtay' : 'Total Debt Recovered'}
              </span>
            </div>
            <div className="text-[26px] font-extrabold text-emerald-600 tracking-tight mt-2.5">
              ${totalRecovered.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F3F6]">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              {language === 'so' ? 'Waa la bixiyay' : 'Settled'}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">
              {payments.length} {language === 'so' ? 'jeer oo lacag la bixiyay' : 'payment transactions'}
            </span>
          </div>
        </div>

        {/* Active Debtors */}
        <div className="card card-hover p-4 sm:p-4.5 bg-white flex flex-col justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'so' ? 'Macaamiisha Deynta Leh' : 'Active Debtors'}
              </span>
            </div>
            <div className="text-[26px] font-extrabold text-amber-600 tracking-tight mt-2.5">
              {activeDebtorsCount} <span className="text-sm font-semibold text-slate-400">/ {customers.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F3F6]">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              {language === 'so' ? 'Deyn ku taalo' : 'With Balance'}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">
              {language === 'so' ? 'Gaalkacyo & Deegaanka' : 'Registered local fleets'}
            </span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white p-4.5 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={language === 'so' ? 'Raadi magaca macmiilka, telefoonka...' : 'Search customer name, phone...'}
              className="w-full bg-slate-50 text-slate-800 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{language === 'so' ? 'Macmiilka / Shirkadda' : 'Customer / Fleet'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Telefoonka Golis' : 'Phone'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Xadka Deynta' : 'Credit Limit'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Wadarta Deynta La Qaatay' : 'Total Taken'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Wadarta La Bixiyay' : 'Total Paid'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Haraaga Deynta' : 'Balance Due'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Xaaladda' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{language === 'so' ? 'Ficillo' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map(cust => {
                const custSales = sales.filter(
                  s => s.customerId === cust.id && s.paymentMethod === 'credit' && s.paymentStatus !== 'voided'
                );
                const custPayments = payments.filter(p => p.customerId === cust.id);
                const totalTaken = custSales.reduce((sum, s) => sum + s.totalAmount, 0);
                const totalPaid = custPayments.reduce((sum, p) => sum + p.amount, 0);

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      {cust.company && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{cust.company}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">{cust.phone}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">
                      ${cust.creditLimit.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">
                      ${totalTaken.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-bold">
                      ${totalPaid.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                          cust.currentBalance > 0
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        ${cust.currentBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                        {cust.status === 'active' ? (language === 'so' ? 'Shaqeynaya' : 'Active') : cust.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setStatementCustomer(cust)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>{language === 'so' ? 'Bayaan' : 'Statement'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setPayModalCustomer(cust);
                            setPayAmount(cust.currentBalance > 0 ? cust.currentBalance.toString() : '');
                            setPayRef(`SAHAL-${Date.now().toString().slice(-4)}`);
                            setPayMethod('sahal');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <DollarSign className="w-3 h-3 text-blue-600" />
                          <span>{language === 'so' ? 'Qabo Lacag' : 'Record Pay'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    {language === 'so' ? 'Lama helin macmiil u dhigma raadintaada.' : 'No customers matched your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">{t.addCustomer}</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Magaca Macmiilka / Gaariga' : 'Customer / Fleet Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={language === 'so' ? 'Tusaale: Cabdirashiid Xasan' : 'e.g. Cabdirashiid Xasan'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Telefoonka Golis (+252 090)' : 'Phone Number (Golis +252 090)'}
                </label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Shirkadda / Gaariga (Ikhtiyaari)' : 'Company / Fleet (Optional)'}
                </label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder={language === 'so' ? 'Tusaale: Nuur Transport Gaalkacyo' : 'e.g. Nuur Transport Gaalkacyo'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Xadka Deynta Ugu Badan ($)' : 'Credit Limit ($)'}
                </label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={e => setNewLimit(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  {language === 'so' ? 'Ka noqo' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  {language === 'so' ? 'Kaydi Macmiilka' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal with Real-time Balance Calculation */}
      {payModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'so' ? 'Qabo Lacag-bixin' : 'Record Payment'}: {payModalCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">{payModalCustomer.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  {language === 'so' ? 'Deynta Hadda' : 'Current Debt'}
                </span>
                <span className="text-sm font-black text-rose-600">
                  ${payModalCurrentDebt.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Qadarka La Bixinayo ($) — Qayb ama Dhameystir' : 'Payment Amount ($)'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-black text-xl text-emerald-600"
                />
              </div>

              {/* Real-time Calculation Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'so' ? 'Deynta Hore:' : 'Previous Debt:'}</span>
                  <span className="font-bold text-slate-900">${payModalCurrentDebt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>{language === 'so' ? 'Lacagta la bixinayo:' : 'Amount Paying:'}</span>
                  <span>-${parsedPayAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-sm">
                  <span className="text-slate-800">{language === 'so' ? 'Haraaga Deynta Ku Haraya:' : 'Remaining Debt Balance:'}</span>
                  <span className={payModalRemaining > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    ${payModalRemaining.toFixed(2)}
                  </span>
                </div>
                {parsedPayAmount > payModalCurrentDebt && (
                  <p className="text-[11px] text-amber-600 mt-1 font-medium">
                    ⚠️ {language === 'so' ? 'Lacag-bixintu way ka badan tahay deynta taalay.' : 'Payment amount exceeds current balance.'}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Habka Lacag-bixinta' : 'Payment Method'}
                </label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold"
                >
                  <option value="sahal">Golis Sahal (+252 090) — Ugu Muhiimsan Gaalkacyo</option>
                  <option value="cash">Lacag Caddaan ah (Cash)</option>
                  <option value="evc">EVC Plus (Hormuud)</option>
                  <option value="edahab">eDahab (Somtel)</option>
                  <option value="card">Bank Transfer / Kaadh</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Tixraaca Rasiidka / Lambarka Sahal' : 'Receipt / Reference Code'}
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="Tusaale: SAHAL-7781"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalCustomer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  {language === 'so' ? 'Ka noqo' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  {language === 'so' ? 'Xaqiiji Lacag-qabashada' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Statement Ledger Modal */}
      {statementCustomer && (() => {
        const { entries, totalTaken, totalPaid } = buildLedger(statementCustomer);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{language === 'so' ? 'Bayaanka Xisaabta Macmiilka (Account Ledger)' : 'Customer Account Ledger'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <b>{statementCustomer.name}</b> • {statementCustomer.phone} {statementCustomer.company && `• ${statementCustomer.company}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {language === 'so' ? 'Haraaga Hadda Ku Harsan' : 'Balance Due'}
                  </span>
                  <span className="text-lg font-black text-rose-600">
                    ${statementCustomer.currentBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 3 Summary Pills */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">
                    {language === 'so' ? 'Deynta La Qaatay' : 'Total Credit Taken'}
                  </span>
                  <span className="text-sm font-black text-slate-900">${totalTaken.toFixed(2)}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                    {language === 'so' ? 'Wadarta La Bixiyay' : 'Total Repaid'}
                  </span>
                  <span className="text-sm font-black text-emerald-700">${totalPaid.toFixed(2)}</span>
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-700 block uppercase font-bold">
                    {language === 'so' ? 'Haraaga Hadda' : 'Remaining Debt'}
                  </span>
                  <span className="text-sm font-black text-rose-700">${statementCustomer.currentBalance.toFixed(2)}</span>
                </div>
              </div>

              {/* Ledger Transaction History */}
              <div className="border border-slate-200 rounded-xl bg-slate-50/50 max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">{language === 'so' ? 'Taariikh' : 'Date'}</th>
                      <th className="py-2 px-3">{language === 'so' ? 'Faahfaahin' : 'Description'}</th>
                      <th className="py-2 px-3 text-right">{language === 'so' ? 'Qadarka' : 'Amount'}</th>
                      <th className="py-2 px-3 text-right">{language === 'so' ? 'Haraaga' : 'Running Balance'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {entries.map(entry => (
                      <tr key={entry.id} className="hover:bg-white transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            {entry.type === 'debit' ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span>{entry.title}</span>
                          </div>
                          <div className="text-[10.5px] text-slate-400 mt-0.5">{entry.details}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black">
                          {entry.type === 'debit' ? (
                            <span className="text-rose-600">+${entry.amount.toFixed(2)}</span>
                          ) : (
                            <span className="text-emerald-600">-${entry.amount.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                          ${entry.runningBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {entries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-400">
                          {language === 'so'
                            ? 'Wali wax dhaqdhaqaaq ah kuma jiro xisaabta macmiilkan.'
                            : 'No ledger transactions recorded for this account yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'so' ? 'Daabac Bayaanka' : 'Print Statement'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatementCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  {language === 'so' ? 'Xir' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
