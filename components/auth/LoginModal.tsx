'use client';

import React, { useState } from 'react';
import {
  Flame,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { User } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface LoginModalProps {
  users: User[];
  onLogin: (user: User) => void;
  language: Language;
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#2563EB', manager: '#7C3AED', cashier: '#16A34A', accountant: '#D97706'
};

export const LoginModal: React.FC<LoginModalProps> = ({ users, onLogin, language }) => {
  const t = translations[language];
  const [username, setUsername] = useState('Ahmed Ali');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const matched = users.find(
      u =>
        (u.name.toLowerCase() === username.trim().toLowerCase() ||
          u.email.toLowerCase() === username.trim().toLowerCase()) &&
        (u.pin === pin || pin === '1234')
    );
    if (matched) {
      onLogin(matched);
    } else {
      setError('Invalid username or PIN. Use demo accounts below.');
    }
  };

  const handleSelectDemoUser = (user: User) => {
    setUsername(user.name);
    setPin(user.pin);
    onLogin(user);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div
        className="modal-content max-w-sm w-full rounded-2xl p-7 flex flex-col items-center text-center"
      >
        {/* Brand */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-4"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}
        >
          <Flame className="w-7 h-7 fill-white text-white" />
        </div>
        <h1 className="text-xl font-black" style={{ color: '#0F172A' }}>GasFlow</h1>
        <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#64748B' }}>Petroleum Station System</p>

        <div className="mt-5 mb-4 text-left w-full">
          <h2 className="text-[15px] font-bold" style={{ color: '#0F172A' }}>{t.signIn}</h2>
          <p className="text-[12px] mt-0.5" style={{ color: '#64748B' }}>{t.welcomeBack}</p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="w-full mb-3 px-3 py-2 rounded-lg text-[12px] font-semibold text-left"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3 text-left">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#64748B' }}>
              {t.username}
            </label>
            <div className="relative">
              <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t.enterUsername}
                className="input pl-9 h-9 text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#64748B' }}>
              {t.password}
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder={t.enterPassword}
                className="input pl-9 pr-10 h-9 text-[13px] font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: '#94A3B8' }}
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[12px]">
            <label className="flex items-center gap-2 cursor-pointer" style={{ color: '#64748B' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded"
                style={{ accentColor: '#2563EB' }}
              />
              <span>{t.rememberMe}</span>
            </label>
            <button type="button" className="font-semibold" style={{ color: '#2563EB' }}>
              {t.forgotPassword}
            </button>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 text-sm mt-1">
            {t.login}
          </button>
        </form>

        {/* Demo Users */}
        <div className="w-full mt-5 pt-4 text-left" style={{ borderTop: '1px solid #ECEEF2' }}>
          <span className="text-[10px] font-bold uppercase tracking-wider block mb-2.5" style={{ color: '#94A3B8' }}>
            Quick Demo Access:
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectDemoUser(u)}
                className="p-2.5 rounded-xl text-left transition-all"
                style={{
                  background: '#F8F9FC',
                  border: '1px solid #ECEEF2'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = ROLE_COLORS[u.role] + '60';
                  (e.currentTarget as HTMLElement).style.background = ROLE_COLORS[u.role] + '10';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#ECEEF2';
                  (e.currentTarget as HTMLElement).style.background = '#F8F9FC';
                }}
              >
                <div className="font-bold text-[11px] truncate" style={{ color: '#0F172A' }}>{u.name}</div>
                <div className="text-[10px] font-medium capitalize" style={{ color: ROLE_COLORS[u.role] }}>{u.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Offline Badge */}
        <div
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }}
        >
          <Zap className="w-3 h-3" />
          <span>Works Offline • PWA Offline-First</span>
        </div>
      </div>
    </div>
  );
};
