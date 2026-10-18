'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Eye,
  EyeOff,
  X,
  Lock,
  User as UserIcon,
  Mail,
  AtSign,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  UserPlus
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

const ROLE_CONFIG: Record<UserRole, { label: string; labelSo: string; bg: string; text: string; border: string; desc: string; descSo: string }> = {
  admin:      { label: 'Administrator',   labelSo: 'Maamule Buuxa',  bg: '#EFF6FF', text: '#2563EB', border: '#DBEAFE', desc: 'Complete System Access',    descSo: 'Maamul dhamaystiran nidaamka' },
  manager:    { label: 'Manager',         labelSo: 'Maareeye',       bg: '#F5F3FF', text: '#7C3AED', border: '#EDE9FE', desc: 'Stock, Deliveries, Voids',  descSo: 'Kaydka, Keenista, Baabinta' },
  cashier:    { label: 'Cashier',         labelSo: 'Shuboole',       bg: '#ECFDF5', text: '#059669', border: '#D1FAE5', desc: 'Point of Sale, Shift Entry', descSo: 'POS, Galitaanka Shiftka' },
  accountant: { label: 'Accountant',      labelSo: 'Xisaabiye',      bg: '#FFFBEB', text: '#D97706', border: '#FEF3C7', desc: 'Ledgers, Debts, Finance',   descSo: 'Dafatirada, Deymaha, Maaliyadda' }
};

const ASSIGNABLE_ROLES_MANAGER: UserRole[] = ['cashier', 'accountant', 'manager'];
const ASSIGNABLE_ROLES_ADMIN: UserRole[]   = ['cashier', 'accountant', 'manager', 'admin'];

export const StaffView: React.FC<StaffViewProps> = ({
  users,
  currentUser,
  language,
  onAddUser,
  onToggleUserStatus
}) => {
  const t = translations[language];
  const canManageStaff = currentUser.role === 'admin' || currentUser.role === 'manager';

  // Inline expand form (not modal)
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [name, setName]         = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [role, setRole]         = useState<UserRole>('cashier');
  const [pin, setPin]           = useState('');
  const [showPin, setShowPin]   = useState(false);
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);

  const assignableRoles = currentUser.role === 'admin' ? ASSIGNABLE_ROLES_ADMIN : ASSIGNABLE_ROLES_MANAGER;

  // scroll to form when opened
  useEffect(() => {
    if (formOpen && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    }
  }, [formOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(language === 'so' ? 'Magaca waa lagama maarmaan' : 'Full name is required');
      return;
    }
    if (!username.trim()) {
      setError(language === 'so' ? 'Username-ka waa lagama maarmaan' : 'Username is required');
      return;
    }
    if (pin.replace(/\D/g, '').length < 4) {
      setError(language === 'so' ? 'PIN-ka waa inuu noqdaa ugu yaraan 4 tiro' : 'PIN must be at least 4 digits');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanEmail    = email.trim().toLowerCase() || `${cleanUsername}@gasflow.so`;
    const cleanPin      = pin.replace(/\D/g, '');

    setSubmitting(true);
    try {
      await onAddUser({ name: name.trim(), username: cleanUsername, email: cleanEmail, role, pin: cleanPin });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormOpen(false);
        resetForm();
      }, 1800);
    } catch {
      setError(language === 'so' ? 'Waxay ku guuldareysatay server-ka' : 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName(''); setUsername(''); setEmail(''); setPin('');
    setShowPin(false); setError(''); setRole('cashier'); setSuccess(false);
  };

  const permissionsMatrix = [
    { task: language === 'so' ? 'Maamulka Shaqaalaha & Doorarka' : 'Users & Roles Management',   admin: '✓ Buuxa', manager: '✓ Buuxa',       cashier: '✗',           accountant: '✗'         },
    { task: language === 'so' ? 'Iibka Shidaalka (POS)'          : 'Fuel Sales (POS)',            admin: '✓',       manager: '✓',             cashier: '✓',           accountant: '✓ Haddii'  },
    { task: language === 'so' ? 'Baabinta Iibka (Void)'          : 'Void / Refund Sale',          admin: '✓',       manager: '✓',             cashier: 'Codsasho',    accountant: 'Audit'     },
    { task: language === 'so' ? 'Haanaha & Keenista'             : 'Tanks & Deliveries',          admin: '✓ Buuxa', manager: '✓ Buuxa',       cashier: 'Akhris',      accountant: 'Akhris'    },
    { task: language === 'so' ? 'Xisaabinta Shiftka'             : 'Shift Reconciliation',        admin: '✓ Audit', manager: '✓ Ogolaanshaha', cashier: 'Shiftkaaga', accountant: '✓ Xaqiijin'},
    { task: language === 'so' ? 'Kharashyada & Maaliyad'         : 'Expenses & Finance',          admin: '✓ Buuxa', manager: '✓ Ogolaanshaha', cashier: 'Aasaasi',    accountant: '✓ Buuxa'   },
    { task: language === 'so' ? 'Warbixinta & Dhaqdhaqaaqa'      : 'Reports & Audit Logs',        admin: '✓ Dhamaan', manager: '✓ Hawlaha',   cashier: 'Shiftkaaga',  accountant: '✓ Xisaabeed'}
  ];

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto page-enter">

      {/* ── Page Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
            <span>{t.staffPermissions}</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Shaqaalaha saldhigga, doorarka amniga (RBAC) iyo maamulka PIN-ka.'
              : 'Station staff accounts, role-based security (RBAC) and PIN management.'}
          </p>
        </div>

        {canManageStaff && (
          <button
            id="add-staff-btn"
            onClick={() => { resetForm(); setFormOpen(prev => !prev); }}
            className={`btn-primary shrink-0 transition-all ${formOpen ? 'bg-slate-700 hover:bg-slate-800' : ''}`}
          >
            {formOpen ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{language === 'so' ? (formOpen ? 'Xidh Foomka' : 'Ku dar Shaqaale') : (formOpen ? 'Close Form' : t.addStaff)}</span>
          </button>
        )}
        {!canManageStaff && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{language === 'so' ? 'Xaqqa maamulidda shaqaalaha uma lihid' : 'No permission to manage staff'}</span>
          </div>
        )}
      </div>

      {/* ── Inline Add Staff Form (expands below) ─ */}
      <div
        ref={formRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: formOpen ? '700px' : '0',
          opacity: formOpen ? 1 : 0,
          marginBottom: formOpen ? undefined : '0'
        }}
      >
        <div className="bg-white rounded-2xl border border-blue-200 shadow-md shadow-blue-500/5 overflow-hidden"
          style={{ animation: formOpen ? 'pageSlideUp 0.25s cubic-bezier(0.16,1,0.3,1) both' : undefined }}>

          {/* Form Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-[13px] font-black text-slate-900">{language === 'so' ? 'Ku dar Shaqaale Cusub' : 'Add New Staff Account'}</div>
                <div className="text-[10px] text-slate-500">{language === 'so' ? 'Buuxi macluumaadka shaqaalaha cusub' : 'Fill in the new staff member details'}</div>
              </div>
            </div>
            <button
              onClick={() => { setFormOpen(false); resetForm(); }}
              className="p-1.5 rounded-xl hover:bg-white/80 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-4">

            {/* Success State */}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{language === 'so' ? 'Shaqaale cusub si guul leh ayaa loo abuuray!' : 'Staff account created successfully!'}</span>
              </div>
            )}

            {/* Error Banner */}
            {error && !success && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'so' ? 'Magaca Buuxa *' : 'Full Name *'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={language === 'so' ? 'e.g. Warsame Jama' : 'e.g. Warsame Jama'}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 text-xs text-slate-900 font-medium transition-all outline-none"
                />
              </div>
            </div>

            {/* Username + Email — responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Username *</label>
                <div className="relative">
                  <AtSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="warsame"
                    className="w-full h-10 pl-8 pr-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 text-xs text-slate-900 font-mono transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email ({language === 'so' ? 'ikhtiyaari' : 'optional'})</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="w@gasflow.so"
                    className="w-full h-10 pl-8 pr-2.5 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 text-xs text-slate-900 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Assigned Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'so' ? 'Doorka Loo Xilsaaray' : 'Assigned Role'}
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 text-xs text-slate-900 font-semibold appearance-none transition-all cursor-pointer outline-none"
                >
                  {assignableRoles.map(r => {
                    const rc = ROLE_CONFIG[r];
                    return (
                      <option key={r} value={r}>
                        {language === 'so' ? `${rc.labelSo} — ${rc.descSo}` : `${rc.label} — ${rc.desc}`}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {/* Role preview pill */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border"
                  style={{ background: ROLE_CONFIG[role].bg, color: ROLE_CONFIG[role].text, borderColor: ROLE_CONFIG[role].border }}
                >
                  {language === 'so' ? ROLE_CONFIG[role].labelSo : ROLE_CONFIG[role].label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'so' ? ROLE_CONFIG[role].descSo : ROLE_CONFIG[role].desc}
                </span>
              </div>
            </div>

            {/* Security PIN — 4–5 digits with spaced visual boxes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {language === 'so' ? 'PIN-ka Ammaanka (4–5 tiro) *' : 'Security PIN (4–5 digits) *'}
                </label>
                <span className="text-[10px] text-slate-400">
                  {pin.length > 0 ? `${pin.length}/5 ${language === 'so' ? 'tiro' : 'digits'}` : (language === 'so' ? 'Ugu yaraan 4 tiro' : 'Min 4 digits')}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setPin(cleaned);
                  }}
                  placeholder="• • • • •"
                  maxLength={5}
                  className="w-full h-11 pl-9 pr-12 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 text-sm text-slate-900 font-mono tracking-[0.45em] transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  tabIndex={-1}
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Spaced digit visual feedback slots */}
              <div className="flex items-center gap-2 mt-2">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                      pin.length > i
                        ? 'bg-blue-600'
                        : i === pin.length
                        ? 'bg-blue-200'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => { setFormOpen(false); resetForm(); }}
                className="px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                {language === 'so' ? 'Jooji' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting || success}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span>{language === 'so' ? 'Waa la abuurayaa...' : 'Creating...'}</span>
                  </>
                ) : (
                  <span>{language === 'so' ? 'Samee Akoon Shaqaale' : 'Create Staff Account'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Staff List ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#ECEEF2] flex items-center justify-between">
          <div>
            <div className="text-[14px] font-bold text-slate-900">{language === 'so' ? 'Shaqaalaha Diiwaansan' : 'Registered Staff'}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{users.length} {language === 'so' ? 'shaqaale' : 'accounts'}</div>
          </div>
        </div>

        {/* Mobile Card view */}
        <div className="md:hidden divide-y divide-[#F1F3F6]">
          {users.map(u => {
            const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.cashier;
            return (
              <div key={u.id} className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: rc.bg, color: rc.text }}
                  >
                    {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-xs truncate">{u.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border"
                        style={{ background: rc.bg, color: rc.text, borderColor: rc.border }}
                      >
                        {language === 'so' ? rc.labelSo : rc.label}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.status === 'active' ? (language === 'so' ? 'Firfircoon' : 'Active') : (language === 'so' ? 'Joojin' : 'Inactive')}
                      </span>
                    </div>
                  </div>
                </div>
                {canManageStaff && u.id !== currentUser.id && (
                  <button
                    onClick={() => onToggleUserStatus(u.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {u.status === 'active' ? (language === 'so' ? 'Jooji' : 'Suspend') : (language === 'so' ? 'Fur' : 'Activate')}
                  </button>
                )}
              </div>
            );
          })}
          {users.length === 0 && (
            <div className="py-10 text-center text-slate-400 text-xs">
              {language === 'so' ? 'Ma jiraan shaqaale diiwaansan' : 'No staff accounts yet'}
            </div>
          )}
        </div>

        {/* Desktop Table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="table-clean">
            <thead>
              <tr>
                <th>{language === 'so' ? 'Magaca' : 'Name'}</th>
                <th>{language === 'so' ? 'Doorka' : 'Role'}</th>
                <th>{language === 'so' ? 'Xaaladda' : 'Status'}</th>
                <th>{language === 'so' ? 'Username' : 'Username'}</th>
                <th className="text-right">{language === 'so' ? 'Tallaabooyin' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.cashier;
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0" style={{ background: rc.bg, color: rc.text }}>
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-[13px]">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full inline-block border" style={{ background: rc.bg, color: rc.text, borderColor: rc.border }}>
                          {language === 'so' ? rc.labelSo : rc.label}
                        </span>
                        <span className="text-[10px] text-slate-400">{language === 'so' ? rc.descSo : rc.desc}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.status === 'active' ? (language === 'so' ? 'Firfircoon' : 'Active') : (language === 'so' ? 'Joojin' : 'Inactive')}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-slate-500">@{u.username || u.name.toLowerCase().replace(/\s+/g, '_')}</td>
                    <td className="text-right">
                      {canManageStaff && u.id !== currentUser.id && (
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                        >
                          {u.status === 'active' ? (language === 'so' ? 'Jooji' : 'Suspend') : (language === 'so' ? 'Fur' : 'Activate')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                    {language === 'so' ? 'Ma jiraan shaqaale diiwaansan' : 'No staff accounts yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RBAC Matrix ─────────────────────────── */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-4">
        <div>
          <h2 className="text-[14px] font-bold text-slate-900">
            {language === 'so' ? 'Jadwalka Rukhsadaha (RBAC)' : 'Role-Based Access Control (RBAC) Matrix'}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'so' ? "Server-gaaga wuxuu xaqiijiyaa rukhsadaha ku salaysan mabda'a OWASP ee xaqda ugu yar." : 'Server enforces authorization based on OWASP least-privilege principle.'}
          </p>
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="table-clean min-w-[480px]">
            <thead>
              <tr>
                <th>{language === 'so' ? 'Hawsha / Shaqada' : 'Operation / Task'}</th>
                <th className="text-blue-700">{language === 'so' ? 'Maamule' : 'Admin'}</th>
                <th className="text-purple-700">{language === 'so' ? 'Maareeye' : 'Manager'}</th>
                <th className="text-emerald-700">{language === 'so' ? 'Shuboole' : 'Cashier'}</th>
                <th className="text-amber-700">{language === 'so' ? 'Xisaabiye' : 'Accountant'}</th>
              </tr>
            </thead>
            <tbody>
              {permissionsMatrix.map((pm, idx) => (
                <tr key={idx}>
                  <td className="font-bold text-slate-800 text-[12px] whitespace-nowrap">{pm.task}</td>
                  <td className="text-blue-600 font-semibold text-[11px]">{pm.admin}</td>
                  <td className="text-purple-600 font-semibold text-[11px]">{pm.manager}</td>
                  <td className="text-slate-600 font-semibold text-[11px]">{pm.cashier}</td>
                  <td className="text-amber-600 font-semibold text-[11px]">{pm.accountant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
