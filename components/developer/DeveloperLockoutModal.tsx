'use client';

import React, { useState } from 'react';
import { ShieldAlert, Lock, Phone, KeyRound, ArrowRight, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

interface DeveloperLockoutModalProps {
  isOpen: boolean;
  suspendedReason?: string;
  developerContact?: string;
  onMasterUnlock: (pin: string) => Promise<{ success: boolean; message?: string }>;
  deviceId?: string;
}

export const DeveloperLockoutModal: React.FC<DeveloperLockoutModalProps> = ({
  isOpen,
  suspendedReason = 'Khidmadda adeegga softweerka ee bishan ayaan la bixin. Fadlan la xiriir Software Engineer-ka si nidaamka dib loogu furo.',
  developerContact = 'Software Engineer: Aadan Said — Tel/WhatsApp: +252 61 2100000',
  onMasterUnlock,
  deviceId = 'POS-CLIENT-DEV'
}) => {
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await onMasterUnlock(pin.trim());
      setLoading(false);
      if (res.success) {
        setSuccess('Nidaamka si buuxda ayaa loo furay! Waad ku mahadsan tahay.');
      } else {
        setError(res.message || 'Master PIN-ka aad gelisay waa khalad.');
      }
    } catch {
      setLoading(false);
      setError('Khalad ayaa dhacay marka nidaamka la furayay.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden text-center flex flex-col items-center p-6 sm:p-9 relative">
        {/* Top Developer Warning Badge */}
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-lg shadow-rose-600/20 mb-4 animate-bounce">
          <AlertOctagon className="w-8 h-8 stroke-[2.2]" />
        </div>

        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider mb-2">
          Awoodda Developer-ka (Kill-Switch Active)
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
          Adeegga Nidaamka Waa La Joojiyay
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          System Access Suspended by Software Engineer
        </p>

        {/* Reason Box */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left w-full">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-700 font-medium leading-relaxed">
              {suspendedReason}
            </div>
          </div>
        </div>

        {/* Developer Contact Card */}
        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-left mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-950">
              Xiriirka Software Engineer-ka:
            </span>
          </div>
          <p className="text-xs font-semibold text-emerald-800 break-words">
            {developerContact}
          </p>
        </div>

        {/* Terminal Info */}
        <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-mono px-1 mb-4">
          <span>Terminal ID: {deviceId}</span>
          <span>Status: LOCKED</span>
        </div>

        {/* Master Unlock Accordion */}
        {!showUnlockForm ? (
          <button
            type="button"
            onClick={() => setShowUnlockForm(true)}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Engineer Master Unlock (Koodhka Furista)</span>
          </button>
        ) : (
          <form onSubmit={handleUnlockSubmit} className="w-full space-y-3 pt-2 border-t border-slate-100">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}
            {success && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="password"
                required
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Geli Master Developer PIN"
                className="flex-1 h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 h-11 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <span>{loading ? '...' : 'Fur Nidaamka'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setShowUnlockForm(false); setError(''); }}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
            >
              Ka noqo
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
