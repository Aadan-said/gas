'use client';

import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  X,
  Smartphone
} from 'lucide-react';
import { User, UserRole } from '@/lib/types';
import { Language } from '@/lib/translations';
import { Modal } from '@/components/ui/Modal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  language: Language;
  onUpdateProfile: (userId: string, updates: Partial<User>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security'>('profile');

  // Profile fields
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '+252 61 ');
  const [branch, setBranch] = useState(currentUser.branch || 'Mogadishu Central, KM4');

  // Password fields
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);

  // 2FA field
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser.twoFactorEnabled || false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg(language === 'so' ? 'Fadlan geli magacaaga.' : 'Please enter your name.');
      return;
    }

    onUpdateProfile(currentUser.id, {
      name: name.trim(),
      phone: phone.trim(),
      branch: branch.trim()
    });

    setSuccessMsg(
      language === 'so' ? 'Xogta akoonkaaga waa la cusbooneysiiyay!' : 'Profile updated successfully!'
    );
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (currentPin.trim() !== currentUser.pin.trim()) {
      setErrorMsg(
        language === 'so' ? 'PIN-kaaga hadda waa khalad.' : 'Current PIN is incorrect.'
      );
      return;
    }

    if (newPin.trim().length < 4) {
      setErrorMsg(
        language === 'so'
          ? 'PIN-ka cusub waa inuu ugu yaraan ka koobnaadaa 4 xaraf/tiro.'
          : 'New PIN must be at least 4 characters.'
      );
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg(
        language === 'so' ? 'Labada PIN isma laha.' : 'New PIN and confirmation do not match.'
      );
      return;
    }

    onUpdateProfile(currentUser.id, {
      pin: newPin.trim()
    });

    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setSuccessMsg(
      language === 'so'
        ? 'PIN-kaaga cusub si guul leh ayaa loo badbaadiyay!'
        : 'Your new PIN has been saved successfully!'
    );
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleToggle2FA = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    onUpdateProfile(currentUser.id, {
      twoFactorEnabled: enabled
    });
    setSuccessMsg(
      enabled
        ? language === 'so'
          ? 'Two-Factor Authentication (2FA) waa la shiday!'
          : '2FA has been enabled!'
        : language === 'so'
        ? 'Two-Factor Authentication (2FA) waa la damiyay!'
        : '2FA has been disabled!'
    );
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'so' ? 'Akoonkayga & Amniga' : 'My Account & Security'}
      subtitle={
        language === 'so'
          ? 'Maamul macluumaadkaaga gaarka ah, PIN-ka, iyo amniga 2FA'
          : 'Manage personal profile, security PIN, and Two-Factor Authentication'
      }
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* User Summary Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-black text-lg">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>{currentUser.name}</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-xs text-slate-400">{currentUser.email} • @{currentUser.username || 'user'}</div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-slate-400">Station Branch:</div>
            <div className="text-xs font-bold text-slate-200">{currentUser.branch || 'KM4 Central'}</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 text-xs font-bold gap-2">
          <button
            onClick={() => { setActiveTab('profile'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`pb-2.5 px-3 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'so' ? 'Xogta Guud' : 'Profile Info'}
          </button>
          <button
            onClick={() => { setActiveTab('password'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`pb-2.5 px-3 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'password'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'so' ? 'Beddel PIN / Password' : 'Change PIN'}
          </button>
          <button
            onClick={() => { setActiveTab('security'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`pb-2.5 px-3 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'security'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'so' ? 'Amniga & 2FA' : 'Security & 2FA'}
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: Profile Info */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'so' ? 'Magacaaga Buuxa' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Telefoonka' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Laanta Saldhigga' : 'Station Branch'}
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'so' ? 'Badbaadi Xogta' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Change PIN */}
        {activeTab === 'password' && (
          <form onSubmit={handleSavePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'so' ? 'PIN-kaaga Hadda' : 'Current PIN'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPin ? 'text' : 'password'}
                  required
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  placeholder="••••"
                  className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono tracking-widest text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'PIN Cusub' : 'New PIN'}
                </label>
                <div className="relative">
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    required
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    placeholder="e.g. 5821"
                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono tracking-widest text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'so' ? 'Xaqiiji PIN-ka Cusub' : 'Confirm New PIN'}
                </label>
                <input
                  type={showNewPin ? 'text' : 'password'}
                  required
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  placeholder="e.g. 5821"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-mono tracking-widest text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{language === 'so' ? 'Cusbooneysii PIN-ka' : 'Update Security PIN'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Security & 2FA */}
        {activeTab === 'security' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {language === 'so' ? 'Two-Factor Authentication (2FA)' : 'Two-Factor Authentication (2FA)'}
                  </h4>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    {language === 'so'
                      ? 'Marka aad soo galayso barnaamijka, waxaa lagu weydiin doonaa koodh xaqiijin ah oo 6-digit ah si loo ilaaliyo akoonkaaga.'
                      : 'When signing in, you will be required to enter a 6-digit verification code to ensure station security.'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={e => handleToggle2FA(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Station Terminal Policy & RBAC</span>
              </div>
              <p className="text-slate-500">
                Doorkaaga hadda waa <b className="text-slate-800 uppercase">{currentUser.role}</b>. Dhammaan hawlaha aad qabato (iibka, lacag-bixinta, kharashaadka) waxaa si toos ah loogu kaydiyaa diiwaanka amniga (Audit Trail).
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
