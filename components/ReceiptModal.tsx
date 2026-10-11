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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content max-w-sm w-full rounded-2xl relative flex flex-col overflow-hidden bg-white border border-slate-200 shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg z-10 transition-all text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Receipt Gradient Header */}
        <div
          className="p-6 flex flex-col items-center text-center bg-gradient-to-b from-blue-50/70 to-white border-b border-dashed border-slate-200"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-md bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/25"
          >
            <Flame className="w-6 h-6 fill-white text-white" />
          </div>
          <h2 className="text-lg font-black text-slate-900">GasFlow</h2>
          <p className="text-[11px] font-semibold text-slate-500">Petroleum Station System</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{station.branch}</p>
          <p className="text-[10px] font-mono text-slate-400">Tel: {station.phone}</p>
        </div>

        {/* Receipt Body */}
        <div id="printable-receipt" className="px-5 py-4 space-y-3">
          {/* Metadata */}
          <div className="space-y-1.5 text-xs">
            {[
              ['Receipt #', sale.saleNumber],
              ['Date', `${new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`],
              ['Cashier', sale.cashierName],
              ...(sale.customerName ? [['Customer', sale.customerName]] : []),
              ['Device POS', sale.deviceId]
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between">
                <span className="text-slate-500">{label}:</span>
                <span className="font-semibold font-mono text-right text-slate-900 max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-200" />

          {/* Fuel Item */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-[13px]">
              <span className="text-slate-900">{sale.fuelType} Fuel</span>
              <span className="text-emerald-600 font-bold font-mono">${sale.totalAmount.toFixed(2)}</span>
            </div>
            {[
              ['Quantity', `${sale.litres.toFixed(2)} L`],
              ['Unit Price', `$${sale.unitPrice.toFixed(2)}/L`],
              ['Payment', PAYMENT_LABEL[sale.paymentMethod] || sale.paymentMethod.toUpperCase()]
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between">
                <span className="text-slate-500">{label}:</span>
                <span className="font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-200" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-slate-400">
                Total Paid
              </div>
              <div className="text-2xl font-black text-slate-900">
                ${sale.totalAmount.toFixed(2)}
              </div>
            </div>
            <div
              className={`transform rotate-[-8deg] px-3.5 py-1.5 rounded-xl border-2 font-black text-xs tracking-wider uppercase select-none ${
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
          <div className="text-center space-y-1">
            <p className="text-[10px] text-slate-500">Mahadsanid! Thank you for choosing GasFlow.</p>
            <p className="font-mono text-[9px] text-slate-400">
              ID: {sale.id.slice(0, 16)}...
            </p>
            <div className="flex justify-center pt-1">
              <QrCode className="w-7 h-7 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="px-5 py-4 flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50"
        >
          <button
            onClick={() => { onClose(); onNewSale(); }}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Sale
          </button>
          <button
            onClick={handlePrint}
            className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-xs"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
