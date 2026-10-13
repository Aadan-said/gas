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
  History
} from 'lucide-react';
import { Customer, CustomerPayment, PaymentMethod, User } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface CustomersViewProps {
  customers: Customer[];
  payments: CustomerPayment[];
  currentUser: User;
  language: Language;
  onAddCustomer: (customer: { name: string; phone: string; company?: string; creditLimit: number }) => void;
  onRecordPayment: (payment: { customerId: string; amount: number; paymentMethod: PaymentMethod; reference?: string }) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  payments,
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
  const [newPhone, setNewPhone] = useState('+252 61 ');
  const [newCompany, setNewCompany] = useState('');
  const [newLimit, setNewLimit] = useState('500');

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('evc');
  const [payRef, setPayRef] = useState('EVC-REF-');

  const filtered = customers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  const totalOutstanding = customers.reduce((sum, c) => sum + c.currentBalance, 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCustomer({
      name: newName,
      phone: newPhone,
      company: newCompany,
      creditLimit: parseFloat(newLimit) || 0
    });
    setAddModalOpen(false);
    setNewName('');
    setNewCompany('');
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
      reference: payRef
    });
    setPayModalCustomer(null);
    setPayAmount('');
  };

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
              ? 'Diiwaanka macaamiisha shidaalka, xadka deynta iyo bixinta lacagaha.'
              : 'Fleet accounts, credit debt limits, repayments and account ledgers.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addCustomer}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats — matching Dashboard card style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Accounts */}
        <div className="card card-hover p-4 sm:p-4.5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-blue-600" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'so' ? 'Wadarta Xisaabaadka' : 'Total Accounts'}
              </span>
            </div>
            <div className="text-[26px] font-extrabold text-[#0F172A] tracking-tight mt-2.5">
              {customers.length}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F3F6]">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {language === 'so' ? 'Fleet + Cash' : 'Fleet + Cash'}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">
              {language === 'so' ? 'macaamiil diiwaan ah' : 'registered customers'}
            </span>
          </div>
        </div>

        {/* Total Outstanding Debt */}
        <div className="card card-hover p-4 sm:p-4.5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-rose-500" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'so' ? 'Wadarta Deynta Jirta' : 'Total Outstanding Debt'}
              </span>
            </div>
            <div className="text-[26px] font-extrabold text-rose-600 tracking-tight mt-2.5">
              ${totalOutstanding.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F3F6]">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              {language === 'so' ? 'Deyn furan' : 'Open credit'}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">
              {language === 'so' ? 'lacag aan la bixin' : 'awaiting settlement'}
            </span>
          </div>
        </div>

        {/* Active Debtors */}
        <div className="card card-hover p-4 sm:p-4.5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-amber-500" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {language === 'so' ? 'Macaamiil Deyn Leh' : 'Active Debtors'}
              </span>
            </div>
            <div className="text-[26px] font-extrabold text-amber-600 tracking-tight mt-2.5">
              {customers.filter(c => c.currentBalance > 0).length}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F3F6]">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              {language === 'so' ? 'Deyn jira' : 'Has balance'}
            </span>
            <span className="text-[11.5px] text-slate-400 font-medium">
              {language === 'so' ? 'ka mid ah macaamiisha' : 'of total accounts'}
            </span>
          </div>
        </div>
      </div>


      {/* Table Section */}
      <div className="bg-white p-4.5 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customer name, phone..."
              className="w-full bg-slate-50 text-slate-800 text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Credit Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map(cust => (
                <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{cust.name}</div>
                    {cust.company && (
                      <div className="text-[11px] text-slate-400">{cust.company}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{cust.phone}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-black text-sm ${
                        cust.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      ${cust.currentBalance.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-semibold">
                    ${cust.creditLimit.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">
                      {cust.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setStatementCustomer(cust)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
                      >
                        Statement
                      </button>
                      <button
                        onClick={() => {
                          setPayModalCustomer(cust);
                          setPayAmount(cust.currentBalance.toString());
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-all"
                      >
                        Record Payment
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                <label className="block font-bold text-slate-700 mb-1">Customer / Fleet Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Hassan Dahir"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Fleet (Optional)</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="e.g. Star Logistics"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Credit Limit ($)</label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={e => setNewLimit(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payModalCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Record Payment: {payModalCustomer.name}
            </h3>
            <p className="text-xs text-slate-500">
              Outstanding Debt: <b className="text-rose-600">${payModalCustomer.currentBalance.toFixed(2)}</b>
            </p>

            <form onSubmit={handlePaySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-black text-lg text-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
                >
                  <option value="evc">EVC Plus (Hormuud)</option>
                  <option value="edahab">eDahab (Somtel)</option>
                  <option value="sahal">Sahal / Zaad (Golis / Telesom)</option>
                  <option value="cash">Cash in Hand (Caddaan)</option>
                  <option value="card">Bank Transfer / Card</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Receipt / Reference</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalCustomer(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {statementCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Account Ledger</h3>
                <p className="text-xs text-slate-500">{statementCustomer.name} • {statementCustomer.phone}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Balance Due:</span>
                <span className="text-base font-black text-rose-600">
                  ${statementCustomer.currentBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 max-h-60 overflow-y-auto space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-500 border-b pb-1">
                <span>Date & Item</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <div>
                  <div className="font-semibold text-slate-800">Fuel Credit PMS 50L</div>
                  <div className="text-[10px] text-slate-400">2025-04-28 • DEV-POS-01</div>
                </div>
                <div className="font-bold text-rose-600">+$85.00</div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <div>
                  <div className="font-semibold text-slate-800">EVC Plus Repayment</div>
                  <div className="text-[10px] text-slate-400">2025-04-27 • Ref: EVC-991</div>
                </div>
                <div className="font-bold text-emerald-600">-$50.00</div>
              </div>
              <div className="flex justify-between py-1">
                <div>
                  <div className="font-semibold text-slate-800">Fuel Credit Diesel 30L</div>
                  <div className="text-[10px] text-slate-400">2025-04-26 • DEV-POS-02</div>
                </div>
                <div className="font-bold text-rose-600">+$45.00</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStatementCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
