'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Flame,
  User as UserIcon,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Fuel,
  Database,
  Wallet,
  Check,
  Globe,
  Sparkles,
  KeyRound,
  AlertCircle,
  X
} from 'lucide-react';
import { User, UserRole } from '@/lib/types';
import { Language } from '@/lib/translations';

interface AuthPortalProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
  onResetPin?: (email: string, newPin: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onClose?: () => void;
  initialMode?: 'login' | 'register' | 'forgot' | '2fa';
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  users,
  onLogin,
  onRegister,
  onResetPin,
  language,
  onLanguageChange,
  onClose,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | '2fa'>(initialMode);

  // 1. Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Register State
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('cashier');
  const [regPhone, setRegPhone] = useState('+252 61 ');
  const [regBranch, setRegBranch] = useState('Mogadishu Central, KM4');
  const [reg2FAEnabled, setReg2FAEnabled] = useState(false);
  const [regError, setRegError] = useState('');

  // 3. Forgot Password State
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotUser, setForgotUser] = useState<User | null>(null);
  const [forgotResetCode, setForgotResetCode] = useState('');
  const [forgotEnteredCode, setForgotEnteredCode] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // 4. 2FA State
  const [twoFactorDigits, setTwoFactorDigits] = useState(['', '', '', '', '', '']);
  const [twoFactorUser, setTwoFactorUser] = useState<User | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first digit in 2FA mode
  useEffect(() => {
    if (mode === '2fa' && digitInputRefs.current[0]) {
      digitInputRefs.current[0].focus();
    }
  }, [mode]);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const trimmed = loginIdentifier.trim().toLowerCase();
      const matched = users.find(
        u =>
          (u.username && u.username.toLowerCase() === trimmed) ||
          u.name.toLowerCase() === trimmed ||
          u.email.toLowerCase() === trimmed
      );

      if (!matched) {
        setLoginError(
          language === 'so'
            ? 'Username ama email-kaan lama helin. Fadlan hubi xogtaada ama isdiiwaangeli.'
            : 'No account found with this username or email. Please check your credentials.'
        );
        return;
      }

      // Strict PIN / Password matching against the real user
      if (loginPassword.trim() !== matched.pin.trim()) {
        setLoginError(
          language === 'so'
            ? 'Password-ka ama PIN-ka aad gelisay waa khalad.'
            : 'Incorrect password or PIN.'
        );
        return;
      }

      if (matched.status === 'inactive') {
        setLoginError(
          language === 'so'
            ? 'Akoonkani waa xiran yahay (Inactive). Fadlan la xiriir maamulaha saldhigga.'
            : 'This account is deactivated. Please contact your station administrator.'
        );
        return;
      }

      // If user has 2FA enabled, proceed to dynamic 2FA
      if (matched.twoFactorEnabled) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setTwoFactorUser(matched);
        setTwoFactorDigits(['', '', '', '', '', '']);
        setTwoFactorError('');
        setMode('2fa');
        return;
      }

      // Direct success login
      onLogin(matched);
    }, 350);
  };

  // Handle Register Step 1
  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError(
        language === 'so'
          ? 'Fadlan buuxi dhammaan meelaha loo baahan yahay (*).'
          : 'Please fill in all required fields (*).'
      );
      return;
    }

    if (users.some(u => u.username?.toLowerCase() === regUsername.trim().toLowerCase())) {
      setRegError(
        language === 'so'
          ? 'Username-kaan horey ayaa loo qaatay. Fadlan dooro mid kale.'
          : 'This username is already taken. Please choose another.'
      );
      return;
    }

    if (users.some(u => u.email.toLowerCase() === regEmail.trim().toLowerCase())) {
      setRegError(
        language === 'so'
          ? 'Email-kaan horey ayaa loogu diiwaangeliyay akoon kale.'
          : 'This email is already registered.'
      );
      return;
    }

    if (regPassword.length < 4) {
      setRegError(
        language === 'so'
          ? 'Password-ku waa inuu ugu yaraan ka koobnaadaa 4 xaraf/tiro.'
          : 'Password must be at least 4 characters.'
      );
      return;
    }

    setRegStep(2);
  };

  // Handle Complete Registration
  const handleRegisterComplete = () => {
    const newUser: User = {
      id: `u_${Date.now()}`,
      name: regFullName.trim(),
      username: regUsername.trim().toLowerCase(),
      email: regEmail.trim().toLowerCase(),
      role: regRole,
      pin: regPassword.trim(),
      status: 'active',
      phone: regPhone.trim(),
      branch: regBranch.trim(),
      twoFactorEnabled: reg2FAEnabled,
      lastLogin: 'Just now'
    };

    onRegister(newUser);
  };

  // Handle Forgot Password - Step 1: Email Lookup
  const handleForgotLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    const matched = users.find(u => u.email.toLowerCase() === forgotEmail.trim().toLowerCase());
    if (!matched) {
      setForgotError(
        language === 'so'
          ? 'Email-kaan kuma jiro diiwaanka saldhigga. Fadlan hubi email-kaaga.'
          : 'No account registered with this email address.'
      );
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setForgotResetCode(code);
    setForgotUser(matched);
    setForgotStep(2);
  };

  // Handle Forgot Password - Step 2: Code Verification & Reset
  const handleForgotReset = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (forgotEnteredCode.trim() !== forgotResetCode.trim()) {
      setForgotError(
        language === 'so'
          ? 'Koodhka xaqiijintu waa khalad.'
          : 'Invalid verification code.'
      );
      return;
    }

    if (forgotNewPin.trim().length < 4) {
      setForgotError(
        language === 'so'
          ? 'PIN-ka cusub waa inuu ugu yaraan ka koobnaadaa 4 xaraf/tiro.'
          : 'New PIN must be at least 4 characters.'
      );
      return;
    }

    if (forgotNewPin.trim() !== forgotConfirmPin.trim()) {
      setForgotError(
        language === 'so' ? 'Labada PIN isma laha.' : 'PINs do not match.'
      );
      return;
    }

    if (onResetPin && forgotUser) {
      onResetPin(forgotUser.email, forgotNewPin.trim());
    }

    setForgotStep(3);
  };

  // Handle 2FA Input
  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const updated = [...twoFactorDigits];
    updated[index] = clean;
    setTwoFactorDigits(updated);

    if (clean && index < 5 && digitInputRefs.current[index + 1]) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !twoFactorDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const digits = pasted.split('');
    const updated = [...twoFactorDigits];
    digits.forEach((d, i) => {
      if (i < 6) updated[i] = d;
    });
    setTwoFactorDigits(updated);

    const nextIndex = Math.min(digits.length, 5);
    digitInputRefs.current[nextIndex]?.focus();
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');

    const entered = twoFactorDigits.join('');
    if (entered.length < 6) {
      setTwoFactorError(
        language === 'so'
          ? 'Fadlan buuxi dhammaan 6-da tiro ee koodhka.'
          : 'Please enter all 6 digits of the verification code.'
      );
      return;
    }

    if (entered !== generatedOtp) {
      setTwoFactorError(
        language === 'so'
          ? 'Koodhka aad gelisay waa khalad. Fadlan hubi koodhka.'
          : 'Invalid verification code. Please check your code.'
      );
      return;
    }

    if (twoFactorUser) {
      onLogin(twoFactorUser);
    }
  };

  const handleResend2FA = () => {
    const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(freshOtp);
    setTwoFactorDigits(['', '', '', '', '', '']);
    setTwoFactorError('');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col font-sans select-none antialiased">
      {/* Top Navbar */}
      <div className="w-full h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Flame className="w-4.5 h-4.5 fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-none tracking-tight flex items-center gap-1.5">
              <span>GasFlow</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-widest">
                ERP Station
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Petroleum Station Management System</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Encrypted Terminal</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => onLanguageChange(language === 'so' ? 'en' : 'so')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer text-xs font-bold"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="uppercase">{language}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        {/* ========================================================================= */}
        {/* 1. LOGIN SCREEN                                                           */}
        {/* ========================================================================= */}
        {mode === 'login' && (
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] transition-all">
            {/* Left Hero (GasFlow Illuminated Petroleum Station Canopy) */}
            <div className="lg:col-span-7 relative bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#022c22] text-white p-6 sm:p-10 flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/images/gas_station_hero.jpg"
                  alt="GasFlow Illuminated Modern Petroleum Station"
                  fill
                  className="object-cover opacity-35 mix-blend-luminosity scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#022c22]/95 via-[#064e3b]/85 to-[#022c22]/90" />
              </div>

              {/* Top Branding */}
              <div className="relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Flame className="w-6 h-6 fill-white text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight leading-none text-white">GasFlow</h2>
                    <p className="text-[11px] font-medium text-emerald-200/80 mt-0.5">
                      Petroleum Station Management System
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {language === 'so'
                      ? 'Maaree Saldhiggaaga Si Casri Ah'
                      : 'Next-Generation Petroleum Station Management'}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/80 max-w-md leading-relaxed font-medium">
                    {language === 'so'
                      ? 'Nidaam dhamaystiran oo ku caawinaya maamulka shidaalka dhuumaha, xisaab-xirka khasnadda, iyo deynta gaadiidka shirkadaha.'
                      : 'End-to-end station management: live pump telemetry, inventory reconciliation, fleet credit accounts, and offline-first POS.'}
                  </p>
                </div>

                {/* Core Feature Badges */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md">
                  {[
                    { icon: Fuel, text: language === 'so' ? 'Iibka Dhuumaha (POS)' : 'Pump Terminal POS' },
                    { icon: Database, text: language === 'so' ? 'Mugga Haamaha & Booyadaha' : 'Tank Telemetry' },
                    { icon: Wallet, text: language === 'so' ? 'Khasnadda & EVC Plus' : 'Cash & Mobile Payments' },
                    { icon: ShieldCheck, text: language === 'so' ? 'RBAC Awoodaha Shaqaalaha' : 'Staff RBAC Security' }
                  ].map((feat, idx) => {
                    const Icon = feat.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-xs font-semibold text-emerald-50"
                      >
                        <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{feat.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Offline Badge */}
              <div className="relative z-10 mt-8 pt-4 border-t border-emerald-700/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <WifiOff className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Offline-First Engine</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[11px] text-emerald-200/80">
                    {language === 'so'
                      ? "Wuxuu shaqeeyaa 100% xitaa marka internet-ku go'an yahay"
                      : 'Operates 100% uninterrupted during network outages'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card (Login Form) */}
            <div className="lg:col-span-5 p-6 sm:p-9 flex flex-col justify-between bg-white">
              <div>
                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {language === 'so' ? 'Ku Soo Dhowow' : 'Welcome Back'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {language === 'so'
                      ? 'Geli username-kaaga iyo password-kaaga si aad u gasho'
                      : 'Sign in to access your station terminal'}
                  </p>
                </div>

                {/* Error Banner */}
                {loginError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Username or Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Username / Email
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={e => setLoginIdentifier(e.target.value)}
                        placeholder={language === 'so' ? 'e.g. aadan ama email' : 'e.g. aadan or email'}
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Password / PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Password / PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setForgotStep(1); setForgotError(''); }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        {language === 'so' ? 'Ma ilowday PIN-ka?' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 font-mono tracking-widest transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-slate-600 font-medium">
                        {language === 'so' ? 'I xusuuso kumbuyuutarkan' : 'Remember me'}
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-[#007A55] hover:bg-[#006244] active:bg-[#005238] text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
                  >
                    <span>{isSubmitting ? (language === 'so' ? 'Waa la hubinayaa...' : 'Verifying...') : (language === 'so' ? 'Gal Saldhigga' : 'Sign In')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Security Trust Notice */}
                <div className="mt-8 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {language === 'so'
                      ? 'Nidaam ammaan ah: Gelitaanka waxaa ilaaliya shuruucda RBAC & Audit Trail.'
                      : 'Protected station terminal. Access attempts are logged in the audit log.'}
                  </span>
                </div>
              </div>

              {/* Bottom Register Prompt */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                <span>{language === 'so' ? 'Shaqaale cusub ma tahay?' : "Don't have an account?"} </span>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setRegStep(1); setRegError(''); }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold transition-colors cursor-pointer"
                >
                  {language === 'so' ? 'Isdiiwaangeli halkan' : 'Register now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. REGISTER SCREEN                                                        */}
        {/* ========================================================================= */}
        {mode === 'register' && (
          <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] transition-all">
            {/* Left Form Column */}
            <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                      <Flame className="w-4.5 h-4.5 fill-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 leading-none">GasFlow</h2>
                      <p className="text-[10px] text-slate-400">Petroleum Station System</p>
                    </div>
                  </div>

                  <button
                    onClick={() => { setMode('login'); setLoginError(''); }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{language === 'so' ? 'Ku laabo Login' : 'Back to Login'}</span>
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {language === 'so' ? 'Samee Akawnt Cusub' : 'Create New Account'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'so'
                      ? 'Diiwaangeli akoon shaqaale ama maamule saldhig'
                      : 'Register a new employee or station operator'}
                  </p>
                </div>

                {/* 3-Step Stepper Header */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {[
                    { step: 1, label: language === 'so' ? 'Xogta Guud' : 'General Info' },
                    { step: 2, label: language === 'so' ? 'Doorka & Laanta' : 'Role & Branch' },
                    { step: 3, label: language === 'so' ? 'Hubin & Dhammaystir' : 'Review & Finish' }
                  ].map(s => {
                    const isActive = regStep === s.step;
                    const isDone = regStep > s.step;
                    return (
                      <div key={s.step} className="flex flex-col items-center text-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                            isActive
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : s.step}
                        </div>
                        <span className={`text-[11px] font-semibold leading-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Error Banner */}
                {regError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* STEP 1: General Info */}
                {regStep === 1 && (
                  <form onSubmit={handleRegisterStep1} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'so' ? 'Magacaaga Buuxa *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={e => setRegFullName(e.target.value)}
                        placeholder="e.g. Aadan Said"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Username *
                        </label>
                        <input
                          type="text"
                          required
                          value={regUsername}
                          onChange={e => setRegUsername(e.target.value)}
                          placeholder="e.g. aadansaid"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="e.g. aadan@gasflow.so"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password / PIN *
                      </label>
                      <div className="relative">
                        <input
                          type={regShowPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          placeholder={language === 'so' ? 'PIN ama password (ugu yaraan 4 xaraf)' : 'PIN or password (min 4 chars)'}
                          className="w-full h-10 px-3 pr-10 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 font-mono tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => setRegShowPassword(!regShowPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 bg-[#007A55] hover:bg-[#006244] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-4"
                    >
                      <span>{language === 'so' ? 'Tallaabada Xigta' : 'Next Step'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* STEP 2: Role & Branch Selection */}
                {regStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        {language === 'so' ? 'Doorka Shaqaalaha (System Role) *' : 'System Role *'}
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { role: 'cashier', label: 'Cashier / POS', desc: 'Nozzles, sales, receipts' },
                          { role: 'manager', label: 'Station Manager', desc: 'Tanks, deliveries, calibration' },
                          { role: 'accountant', label: 'Accountant', desc: 'Ledger, expenses, debt credit' },
                          { role: 'admin', label: 'Full Admin', desc: 'Full station authority' }
                        ].map(item => (
                          <button
                            key={item.role}
                            type="button"
                            onClick={() => setRegRole(item.role as UserRole)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              regRole === item.role
                                ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-900">{item.label}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Telefoonka (Phone)
                        </label>
                        <input
                          type="text"
                          value={regPhone}
                          onChange={e => setRegPhone(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Laanta Saldhigga (Branch)
                        </label>
                        <select
                          value={regBranch}
                          onChange={e => setRegBranch(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-xs text-slate-900 font-semibold"
                        >
                          <option value="Mogadishu Central, KM4">Mogadishu Central, KM4</option>
                          <option value="Mogadishu Wadajir, Airport Rd">Mogadishu Wadajir, Airport Rd</option>
                          <option value="Hargeisa Main, Jigjiga Yar">Hargeisa Main, Jigjiga Yar</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="px-4 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        {language === 'so' ? 'Dib u noqo' : 'Back'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegStep(3)}
                        className="flex-1 h-11 bg-[#007A55] hover:bg-[#006244] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                      >
                        <span>{language === 'so' ? 'Tallaabada Xigta' : 'Review & Finish'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Review & Complete */}
                {regStep === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Magaca:</span>
                        <span className="font-bold text-slate-900">{regFullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Username:</span>
                        <span className="font-mono font-bold text-slate-900">{regUsername}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-bold text-slate-900">{regEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Doorka:</span>
                        <span className="font-bold uppercase text-emerald-800">{regRole}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Branch:</span>
                        <span className="font-bold text-slate-900">{regBranch}</span>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <input
                        type="checkbox"
                        checked={reg2FAEnabled}
                        onChange={e => setReg2FAEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-800">
                        {language === 'so' ? 'Daar Two-Factor Authentication (2FA) akoonkan' : 'Enable 2FA security on this account'}
                      </span>
                    </label>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(2)}
                        className="px-4 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        {language === 'so' ? 'Dib u noqo' : 'Back'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRegisterComplete}
                        className="flex-1 h-11 bg-[#007A55] hover:bg-[#006244] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === 'so' ? 'Dhammaystir & Gal Dashboard' : 'Complete & Enter Dashboard'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Login Link */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                <span>{language === 'so' ? 'Horey ma u lahayd akoon?' : 'Already have an account?'} </span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setLoginError(''); }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold transition-colors cursor-pointer"
                >
                  {language === 'so' ? 'Gal halkan' : 'Sign in here'}
                </button>
              </div>
            </div>

            {/* Right Banner with Cashier Illustration */}
            <div className="lg:col-span-5 relative bg-gradient-to-b from-[#ECFDF5] to-[#D1FAE5] p-6 sm:p-8 flex flex-col justify-between items-center text-center border-l border-emerald-100">
              <div className="w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-emerald-200 text-[11px] font-bold text-emerald-800 shadow-2xs mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>GasFlow Certified Station</span>
                </div>

                <div className="relative w-48 sm:w-60 h-64 sm:h-80 mx-auto my-2">
                  <Image
                    src="/images/gas_operator.jpg"
                    alt="GasFlow Attendant Operator"
                    fill
                    className="object-contain drop-shadow-md"
                    priority
                  />
                </div>
              </div>

              <div className="w-full max-w-xs bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-emerald-200/80 shadow-sm mt-4">
                <p className="text-xs font-bold text-emerald-950 italic">
                  &ldquo;Shidaal wanaagsan, Ganacsi guul leh.&rdquo;
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">
                  GasFlow Petroleum ERP & Offline Station Engine
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. FORGOT PASSWORD SCREEN                                                 */}
        {/* ========================================================================= */}
        {mode === 'forgot' && (
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-7 sm:p-9 transition-all">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">GasFlow</h3>
                <p className="text-[10px] text-slate-400">Petroleum Station System</p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: Email Lookup */}
            {forgotStep === 1 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {language === 'so' ? 'Dib-u-dejinta Password-ka' : 'Reset Password'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {language === 'so'
                      ? 'Geli email-kaaga si aan kuugu soo dirno koodhka xaqiijinta dib-u-dejinta.'
                      : 'Enter your registered email address to receive a verification reset code.'}
                  </p>
                </div>

                <form onSubmit={handleForgotLookup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="e.g. aadan@gasflow.so"
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#007A55] hover:bg-[#006244] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
                  >
                    <span>{language === 'so' ? 'U Dir Koodhka' : 'Send Verification Code'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setForgotError(''); }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{language === 'so' ? 'Ku laabo Login' : 'Back to Login'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Enter Code & New PIN */}
            {forgotStep === 2 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {language === 'so' ? 'Geli Koodhka & Deji PIN Cusub' : 'Enter Code & Set New PIN'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'so'
                      ? `Koodh ayaa loo diray ${forgotEmail}.`
                      : `A verification code was dispatched to ${forgotEmail}.`}
                  </p>
                </div>

                {/* Simulated Verification Dispatch Alert */}
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  <div>Verification code: <b className="font-mono text-sm tracking-wider">{forgotResetCode}</b></div>
                </div>

                <form onSubmit={handleForgotReset} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'so' ? 'Koodhka 6-da Tiro ah' : '6-Digit Code'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={forgotEnteredCode}
                      onChange={e => setForgotEnteredCode(e.target.value)}
                      placeholder="e.g. 582910"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold tracking-widest text-center text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'so' ? 'PIN / Password Cusub' : 'New PIN / Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        required
                        value={forgotNewPin}
                        onChange={e => setForgotNewPin(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-10 px-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 font-mono tracking-widest text-slate-900"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'so' ? 'Xaqiiji PIN-ka Cusub' : 'Confirm New PIN'}
                    </label>
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      required
                      value={forgotConfirmPin}
                      onChange={e => setForgotConfirmPin(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono tracking-widest text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#007A55] hover:bg-[#006244] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-3"
                  >
                    <span>{language === 'so' ? 'Cusbooneysii PIN-ka' : 'Save New PIN'}</span>
                    <KeyRound className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: Success Confirmation */}
            {forgotStep === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {language === 'so' ? 'Password-kaagii Waa La Beddelay!' : 'Password Reset Successful!'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {language === 'so'
                    ? 'Waxaad hadda ku geli kartaa username-kaaga iyo password-kaaga cusub.'
                    : 'Your new PIN has been saved. You can now sign in with your updated credentials.'}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setLoginIdentifier(forgotUser?.username || forgotEmail);
                    setLoginPassword('');
                    setForgotStep(1);
                    setMode('login');
                  }}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer"
                >
                  {language === 'so' ? 'Hadda Gal Saldhigga' : 'Sign In Now'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TWO-FACTOR AUTHENTICATION (2FA)                                        */}
        {/* ========================================================================= */}
        {mode === '2fa' && (
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-7 sm:p-9 transition-all text-center">
            {/* Shield Icon */}
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Two-Factor Authentication
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              {language === 'so'
                ? `Koodh xaqiijin ah ayaa loo diray akoonka ${twoFactorUser?.name || ''}.`
                : `Enter the 6-digit verification code sent to ${twoFactorUser?.phone || twoFactorUser?.email}.`}
            </p>

            {/* Dynamic Simulated SMS Dispatch Badge */}
            <div className="my-4 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 font-medium">
              <div className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider mb-0.5">
                SMS Code Notification:
              </div>
              <div className="font-mono text-base font-black text-emerald-800 tracking-widest">
                {generatedOtp}
              </div>
            </div>

            {twoFactorError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{twoFactorError}</span>
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-5">
              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleDigitPaste}>
                {twoFactorDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { digitInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(idx, e)}
                    className="w-11 sm:w-12 h-14 text-center text-xl font-black rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 shadow-2xs transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-[#007A55] hover:bg-[#006244] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>{language === 'so' ? 'Xaqiiji & Gal Dashboard' : 'Verify & Enter Dashboard'}</span>
                <Check className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handleResend2FA}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer block mx-auto"
              >
                {language === 'so' ? '← Dib u dir koodh cusub' : '← Resend new code'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setTwoFactorError(''); }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer block mx-auto pt-2"
              >
                {language === 'so' ? 'Ka noqo' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
