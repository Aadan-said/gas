'use client';

import React from 'react';
import { ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { User, UserRole } from '@/lib/types';
import { Language } from '@/lib/translations';

interface SessionGuardProps {
  currentUser: User;
  allowedRoles: UserRole[];
  language: Language;
  onOpenLoginModal?: () => void;
  children: React.ReactNode;
}

export const SessionGuard: React.FC<SessionGuardProps> = ({
  currentUser,
  allowedRoles,
  language,
  onOpenLoginModal,
  children
}) => {
  const hasAccess = allowedRoles.includes(currentUser.role);

  if (hasAccess) {
    return <>{children}</>;
  }

  const roleLabels: Record<UserRole, string> = {
    admin: language === 'so' ? 'Maamulaha Sare (Admin)' : 'Administrator',
    manager: language === 'so' ? 'Maareeyaha (Manager)' : 'Manager',
    cashier: language === 'so' ? 'Khasnajiga (Cashier)' : 'Cashier',
    accountant: language === 'so' ? 'Xisaabiyaha (Accountant)' : 'Accountant'
  };

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-center max-w-lg mx-auto shadow-sm my-8">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-black text-slate-900 tracking-tight">
        {language === 'so' ? 'Oggolaansho Kuma Lihid Qaybtaan' : 'Restricted Access'}
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        {language === 'so'
          ? `Qaybtan waxaa loo oggol yahay oo kaliya: ${allowedRoles
              .map(r => roleLabels[r])
              .join(', ')}. Awooddaada hadda waa: ${roleLabels[currentUser.role]}.`
          : `This section is restricted to: ${allowedRoles
              .map(r => roleLabels[r])
              .join(', ')}. Your current role is: ${roleLabels[currentUser.role]}.`}
      </p>

      {onOpenLoginModal && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-sm cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>
              {language === 'so' ? 'Gal Akoon Maamule (Switch User)' : 'Switch User / Enter PIN'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
