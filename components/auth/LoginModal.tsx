'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Flame,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { User } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { GasFlowLogo } from '@/components/ui';

interface LoginModalProps {
  users: User[];
  onLogin: (user: User) => void;
  language: Language;
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#2563EB',
  manager: '#7C3AED',
  cashier: '#16A34A',
  accountant: '#D97706'
};

export const LoginModal: React.FC<LoginModalProps> = ({ users, onLogin, language }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const t = translations[language];
  // Empty by default - no hardcoded credentials!
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [showDemoList, setShowDemoList] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError(language === 'so' ? 'Gali magaca isticmaalaha ama email-ka.' : 'Please enter your username or email.');
      return;
    }
    if (!pin.trim()) {
      setError(language === 'so' ? 'Gali PIN-kaaga ama password-kaaga.' : 'Please enter your security PIN.');
      return;
    }

    const cleanInput = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    // Match strictly against actual user account
    const matched = users.find(
      u =>
        (u.username?.toLowerCase() === cleanInput ||
          u.name.toLowerCase() === cleanInput ||
          u.email.toLowerCase() === cleanInput) &&
        u.pin === cleanPin
    );

    if (matched) {
      if (matched.status === 'inactive') {
        setError(language === 'so' ? 'Akoonkan waa la joojiyay. La hadal maamulaha.' : 'This account is suspended. Contact admin.');
        return;
      }
      onLogin(matched);
    } else {
      setError(
        language === 'so'
          ? 'Username-ka ama PIN-ka aad gelisay waa khalad. Fadlan hubi xogtaada.'
          : 'Invalid username or PIN. Please verify your credentials.'
      );
    }
  };

  const handleSelectDemoUser = (user: User) => {
    setUsername(user.username || user.name);
    setPin(user.pin);
    onLogin(user);
  };

  if (!mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white max-w-sm w-full rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200/90 flex flex-col items-center text-center my-auto max-h-[92dvh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Brand */}
        <div className="mb-4">
          <GasFlowLogo size="lg" variant="compact" />
        </div>

        <div className="mt-4 mb-3 text-left w-full">
          <h2 className="text-[15px] font-bold text-slate-900">{t.signIn}</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {language === 'so' ? 'Gali xogtaada si aad nidaamka u gasho' : t.welcomeBack}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="w-full mb-3 px-3 py-2 rounded-xl text-[12px] font-semibold text-left bg-rose-50 border border-rose-200 text-rose-700 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3.5 text-left">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {t.username}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={language === 'so' ? 'Username ama Email' : t.enterUsername}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 text-xs text-slate-900 font-medium transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {language === 'so' ? 'PIN-ka Ammaanka (Security PIN)' : t.password}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPin ? 'text' : 'password'}
                required
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPin(cleaned);
                }}
                placeholder={showPin ? 'PIN' : '• • • •'}
                className="w-full h-11 pl-9 pr-10 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 text-sm font-mono tracking-[0.35em] text-slate-900 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Visual PIN digit indicator */}
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-200"
                    style={{
                      background: pin.length > i ? '#2563EB' : '#E2E8F0',
                      transform: pin.length > i ? 'scale(1.2)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {pin.length > 0 ? `${pin.length} tiro` : (language === 'so' ? 'Gali 4–5 tiro' : '4–5 digits')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[12px] pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>{t.rememberMe}</span>
            </label>
            <span className="text-slate-400 text-[11px]">Gaalkacyo POS</span>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t.login}</span>
          </button>
        </form>

        {/* Optional Collapsible Demo Access */}
        {users.length > 0 && (
          <div className="w-full mt-4 pt-3 border-t border-slate-100 text-left">
            <button
              type="button"
              onClick={() => setShowDemoList(!showDemoList)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>{language === 'so' ? 'Akoonada Tijaabada (Demo)' : 'Quick Demo Access'}</span>
              </span>
              {showDemoList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDemoList && (
              <div className="grid grid-cols-2 gap-1.5 text-xs mt-2.5 animate-in fade-in">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectDemoUser(u)}
                    className="p-2 rounded-xl text-left transition-all border border-slate-200 bg-slate-50 hover:bg-blue-50/40 hover:border-blue-200 cursor-pointer"
                  >
                    <div className="font-bold text-[11px] text-slate-900 truncate">{u.name}</div>
                    <div className="text-[10px] font-semibold capitalize" style={{ color: ROLE_COLORS[u.role] || '#2563EB' }}>
                      {u.role}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
