'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  UserCheck,
  KeyRound,
  ShieldAlert,
  Check,
  X,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { User, UserRole } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface StaffViewProps {
  users: User[];
  currentUser: User;
  language: Language;
  onAddUser: (user: { name: string; username?: string; email: string; role: UserRole; pin: string }) => void;
  onToggleUserStatus: (userId: string) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  users,
  currentUser,
  language,
  onAddUser,
  onToggleUserStatus
}) => {
  const t = translations[language];

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [pin, setPin] = useState('1234');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || pin.length < 4) {
      alert('Name and 4-digit PIN required');
      return;
    }

    const cleanUsername = username.trim().toLowerCase() || name.toLowerCase().replace(/\s+/g, '_');
    const cleanEmail = email.trim().toLowerCase() || `${cleanUsername}@gasflow.so`;

    onAddUser({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      role,
      pin: pin.trim()
    });

    setModalOpen(false);
    setName('');
    setUsername('');
    setEmail('');
    setPin('1234');
  };

  const rolePills: Record<UserRole, { bg: string; text: string }> = {
    admin: { bg: 'bg-blue-100', text: 'text-blue-700' },
    manager: { bg: 'bg-purple-100', text: 'text-purple-700' },
    cashier: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    accountant: { bg: 'bg-amber-100', text: 'text-amber-700' }
  };

  // OWASP Least Privilege Matrix based on the user's requirements prompt
  const permissionsMatrix = [
    {
      task: 'Users & Roles Management',
      admin: 'Full Manage',
      cashier: 'No Access',
      manager: 'Limited Read',
      accountant: 'No Access'
    },
    {
      task: 'Create Fuel Sales (POS)',
      admin: 'Yes',
      cashier: 'Yes',
      manager: 'Yes',
      accountant: 'If Allowed'
    },
    {
      task: 'Refund / Void Sale',
      admin: 'Approve & Void',
      cashier: 'Request Only',
      manager: 'Approve & Void',
      accountant: 'Audit Review'
    },
    {
      task: 'Tanks & Bulk Deliveries',
      admin: 'Full Manage',
      cashier: 'Read Stock',
      manager: 'Full Manage',
      accountant: 'Read Only'
    },
    {
      task: 'Shift & Cash Reconciliation',
      admin: 'Full Audit',
      cashier: 'Own Shift Only',
      manager: 'Approve Shift',
      accountant: 'Audit & Verify'
    },
    {
      task: 'Expenses & Finance Ledger',
      admin: 'Full Manage',
      cashier: 'Basic Record',
      manager: 'Approve',
      accountant: 'Full Manage'
    },
    {
      task: 'Reports & Audit Logs',
      admin: 'All Reports',
      cashier: 'Own Shift',
      manager: 'Operations',
      accountant: 'Financial & Audit'
    }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span>{t.staffPermissions}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Shaqaalaha saldhigga, rukhsadaha doorka (RBAC) iyo ammaanka PIN-ka.'
              : 'Station staff accounts, role-based security policies (RBAC) and PIN auth.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addStaff}</span>
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white p-6 rounded-2xl border border-[#ECEEF2] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.map(u => {
                const pill = rolePills[u.role] || rolePills.cashier;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                          {u.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${pill.bg} ${pill.text}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{u.lastLogin || 'Just now'}</td>
                    <td className="py-3.5 px-4 text-right">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className="px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Permissions Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Role-Based Access Control (RBAC Policy Matrix)
          </h2>
          <p className="text-xs text-slate-400">
            Server-side authorization enforcement based on OWASP least-privilege security principle.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Operation / Task</th>
                <th className="py-3 px-4 text-blue-700">Admin</th>
                <th className="py-3 px-4 text-emerald-700">Cashier</th>
                <th className="py-3 px-4 text-purple-700">Manager</th>
                <th className="py-3 px-4 text-amber-700">Accountant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {permissionsMatrix.map((pm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-800">{pm.task}</td>
                  <td className="py-3 px-4 font-semibold text-blue-600">{pm.admin}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{pm.cashier}</td>
                  <td className="py-3 px-4 font-semibold text-purple-600">{pm.manager}</td>
                  <td className="py-3 px-4 font-semibold text-amber-600">{pm.accountant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">{t.addStaff}</h3>
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Warsame Jama"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. warsame"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="warsame@gasflow.so"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-semibold"
                >
                  <option value="cashier">Cashier (Point of Sale, Shift Entry)</option>
                  <option value="manager">Manager (Stock, Deliveries, Voids)</option>
                  <option value="accountant">Accountant (Ledgers, Debts, Finance)</option>
                  <option value="admin">Administrator (Complete System Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Security PIN (4+ digits)</label>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono tracking-widest text-base"
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
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
