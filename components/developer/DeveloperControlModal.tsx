'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  AlertTriangle,
  Phone,
  Save,
  CheckCircle2,
  X,
  Users,
  Terminal,
  Smartphone,
  Globe,
  Radio
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { User } from '@/lib/types';

interface DeveloperControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  users?: User[];
  currentLicense: {
    isSuspended: boolean;
    suspendedReason: string;
    developerContact: string;
    graceWarning: string | null;
    suspendedUserIds: string[];
  };
  onSaveLicense: (data: {
    masterPin: string;
    isSuspended: boolean;
    suspendedReason: string;
    developerContact: string;
    graceWarning: string | null;
    suspendedUserIds: string[];
  }) => Promise<{ success: boolean; message?: string }>;
}

export const DeveloperControlModal: React.FC<DeveloperControlModalProps> = ({
  isOpen,
  onClose,
  users = [],
  currentLicense,
  onSaveLicense
}) => {
  const [isSuspended, setIsSuspended] = useState(currentLicense.isSuspended);
  const [suspendedReason, setSuspendedReason] = useState(currentLicense.suspendedReason);
  const [developerContact, setDeveloperContact] = useState(currentLicense.developerContact);
  const [graceWarning, setGraceWarning] = useState(currentLicense.graceWarning || '');
  const [suspendedUserIds, setSuspendedUserIds] = useState<string[]>(currentLicense.suspendedUserIds || []);
  const [masterPin, setMasterPin] = useState('778899');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setIsSuspended(currentLicense.isSuspended);
    setSuspendedReason(currentLicense.suspendedReason);
    setDeveloperContact(currentLicense.developerContact);
    setGraceWarning(currentLicense.graceWarning || '');
    setSuspendedUserIds(currentLicense.suspendedUserIds || []);
  }, [currentLicense, isOpen]);

  const toggleUserSuspension = (userId: string) => {
    setSuspendedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await onSaveLicense({
      masterPin: masterPin.trim(),
      isSuspended,
      suspendedReason: suspendedReason.trim(),
      developerContact: developerContact.trim(),
      graceWarning: graceWarning.trim() ? graceWarning.trim() : null,
      suspendedUserIds
    });

    setIsSaving(false);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message || 'Xogta Liisanka si guul leh ayaa loo kaydiyay!' });
      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Khalad ayaa dhacay. Hubi Master PIN-ka.' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Awoodaha Software Engineer-ka (Developer Master Control)"
      subtitle="Maamul liisanka, xanibaadda fog (Kill-Switch) iyo xakameynta macaamiisha taleefannada iyo kumbuyuutarrada."
      icon={<Terminal className="w-5 h-5 text-emerald-600" />}
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {feedback && (
          <div
            className={`p-3 rounded-xl font-bold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Master Kill-Switch Toggle Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isSuspended
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                  isSuspended ? 'bg-rose-600 shadow-md shadow-rose-600/20' : 'bg-emerald-600 shadow-md shadow-emerald-600/20'
                }`}
              >
                {isSuspended ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </div>
              <div>
                <span className="block text-sm font-black">
                  {isSuspended ? 'Xanibaad Guud Waa Firfircoon (SYSTEM LOCKED)' : 'Nidaamku Wuu Furanyahay (SYSTEM ACTIVE)'}
                </span>
                <span className="text-[11px] opacity-80">
                  {isSuspended
                    ? 'Qofna ma isticmaali karo nidaamka xitaa haddii uu mobeel ama PC ku jiro.'
                    : 'Dhammaan isticmaalayaasha waxay ku shaqaysan karaan nidaamka si caadi ah.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSuspended(!isSuspended)}
              className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all shadow-sm cursor-pointer ${
                isSuspended
                  ? 'bg-white hover:bg-slate-100 text-rose-700 border border-rose-300'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {isSuspended ? 'Fur Nidaamka' : 'Xanib Hadda (Lockdown)'}
            </button>
          </div>
        </div>

        {/* Suspended Reason Text */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Fariinta Xanibaadda (Reason shown to Client) *
          </label>
          <textarea
            rows={2}
            required
            value={suspendedReason}
            onChange={e => setSuspendedReason(e.target.value)}
            placeholder="Tusaale: Khidmadda bishan ayaan la bixin. Fadlan la xiriir Engineer-ka..."
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Developer Contact Details */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Xiriirka Engineer-ka (WhatsApp / Tel) *
          </label>
          <input
            type="text"
            required
            value={developerContact}
            onChange={e => setDeveloperContact(e.target.value)}
            placeholder="Software Engineer: Aadan Said — Tel/WhatsApp: +252 61 2100000"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Grace Warning Banner (Pre-lock warning) */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Digniinta Ka Horreysa Xanibaadda (Grace Period Warning Banner)
          </label>
          <input
            type="text"
            value={graceWarning}
            onChange={e => setGraceWarning(e.target.value)}
            placeholder="Tusaale: Digniin: Khidmadda softweerka waxaad haysataa 3 maalmood..."
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Haddii aad qorto fariintan, banner jaale ah ayaa ka soo muuqanaya headerka nidaamka si uu ugu digo qofka kahor intaadan xanibin.
          </p>
        </div>

        {/* Master Developer Key Verification */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-700 mb-1">
            Master Developer PIN (Xaqiijinta Engineer-ka) *
          </label>
          <input
            type="password"
            required
            value={masterPin}
            onChange={e => setMasterPin(e.target.value)}
            placeholder="Geli Master Developer PIN (Default: 778899)"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-mono tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors cursor-pointer"
          >
            Xidh
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Waa la kaydinayaa...' : 'Kaydi Awoodaha Developer-ka'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
