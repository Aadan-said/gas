'use client';

import React from 'react';
import { Flame, Printer, Plus, X, QrCode } from 'lucide-react';
import { Sale, StationConfig } from '@/lib/types';
import { Language } from '@/lib/translations';

interface ReceiptModalProps {
  sale: Sale | null;
  station: StationConfig;
  language: Language;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  station,
  language,
  onClose,
  onNewSale
}) => {
  if (!sale) return null;

  const handlePrint = () => window.print();
  const isVoided = sale.paymentStatus === 'voided';

  const PAYMENT_LABEL: Record<string, string> = {
    cash: 'Cash', evc: 'EVC Plus', zaad: 'Zaad', edahab: 'eDahab', credit: 'Credit', card: 'Card'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content max-w-[340px] w-full max-h-[90vh] my-auto rounded-2xl relative flex flex-col overflow-hidden bg-white border border-slate-200 shadow-2xl transition-all"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg z-10 transition-all text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
          aria-label="Close Receipt"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Compact Header */}
        <div
          className="px-4 py-3.5 flex flex-col items-center text-center bg-gradient-to-b from-blue-50/60 to-white border-b border-dashed border-slate-200"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 shadow-sm bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/25"
          >
            <Flame className="w-4 h-4 fill-white text-white" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900 leading-tight">GasFlow</h2>
          <p className="text-[10.5px] font-semibold text-slate-500">Petroleum Station System</p>
          <p className="text-[9.5px] text-slate-400 mt-0.5">{station.branch}</p>
          <p className="text-[9.5px] font-mono text-slate-400">Tel: {station.phone}</p>
        </div>

        {/* Receipt Body */}
        <div id="printable-receipt" className="px-4 py-3 space-y-2.5 text-xs overflow-y-auto">
          {/* Metadata */}
          <div className="space-y-1 text-[11px]">
            {[
              ['Receipt #', sale.saleNumber],
              ['Date', `${new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`],
              ['Cashier', sale.cashierName],
              ...(sale.customerName ? [['Customer', sale.customerName]] : []),
              ['Device POS', sale.deviceId]
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between">
                <span className="text-slate-400">{label}:</span>
                <span className="font-semibold font-mono text-right text-slate-900 max-w-[65%] truncate">{value}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-200" />

          {/* Fuel Item */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between font-bold text-xs">
              <span className="text-slate-900">{sale.fuelType} Fuel</span>
              <span className="text-emerald-600 font-mono font-bold">${sale.totalAmount.toFixed(2)}</span>
            </div>
            {[
              ['Quantity', `${sale.litres.toFixed(2)} L`],
              ['Unit Price', `$${sale.unitPrice.toFixed(2)}/L`],
              ['Payment', PAYMENT_LABEL[sale.paymentMethod] || sale.paymentMethod.toUpperCase()]
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between">
                <span className="text-slate-400">{label}:</span>
                <span className="font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-200" />

          {/* Total & Paid Badge */}
          <div className="flex items-center justify-between py-0.5">
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                Total Paid
              </div>
              <div className="text-xl font-black text-slate-900 leading-tight">
                ${sale.totalAmount.toFixed(2)}
              </div>
            </div>
            <div
              className={`transform rotate-[-6deg] px-2.5 py-0.5 rounded-lg border-2 font-black text-[10px] tracking-wider uppercase select-none ${
                isVoided
                  ? 'border-rose-400 text-rose-600 bg-rose-50'
                  : 'border-emerald-500 text-emerald-600 bg-emerald-50'
              }`}
            >
              {isVoided ? 'VOIDED' : 'PAID'}
            </div>
          </div>

          <div className="border-b border-dashed border-slate-200" />

          {/* Footer */}
          <div className="text-center space-y-0.5 pt-0.5">
            <p className="text-[9.5px] text-slate-500">Mahadsanid! Thank you for choosing GasFlow.</p>
            <p className="font-mono text-[8.5px] text-slate-400">
              ID: {sale.id.slice(0, 16)}...
            </p>
            <div className="flex justify-center pt-0.5">
              <QrCode className="w-5 h-5 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Compact Actions Side-by-Side */}
        <div
          className="p-3 grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/60 shrink-0"
        >
          <button
            onClick={() => { onClose(); onNewSale(); }}
            className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5 rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Sale
          </button>
          <button
            onClick={handlePrint}
            className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1.5 rounded-xl cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
