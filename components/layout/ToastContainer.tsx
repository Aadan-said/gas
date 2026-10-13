'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[280px] max-w-[420px] bg-white border border-slate-200 rounded-2xl shadow-xl animate-in slide-in-from-bottom-3 duration-200"
        >
          {toast.type === 'success' && (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
          <span className="text-xs font-semibold text-slate-800 flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
