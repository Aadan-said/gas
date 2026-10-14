'use client';

import React, { useState } from 'react';
import {
  Fuel,
  Flame,
  CreditCard,
  Phone,
  Banknote,
  Coins,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  RotateCcw,
  User,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { Tank, Customer, Sale, User as AppUser, FuelTypeCode, PaymentMethod } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface SalesPOSViewProps {
  tanks: Tank[];
  customers: Customer[];
  currentUser: AppUser;
  sales: Sale[];
  language: Language;
  onProcessSale: (saleData: {
    fuelType: FuelTypeCode;
    tankId: string;
    litres: number;
    unitPrice: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    customerId?: string;
    customerName?: string;
  }) => void;
  onVoidSale: (saleId: string, reason: string) => void;
  onViewReceipt: (sale: Sale) => void;
}

export const SalesPOSView: React.FC<SalesPOSViewProps> = ({
  tanks,
  customers,
  currentUser,
  sales,
  language,
  onProcessSale,
  onVoidSale,
  onViewReceipt
}) => {
  const t = translations[language];

  // POS State
  const [selectedFuel, setSelectedFuel] = useState<FuelTypeCode>('PMS');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('sahal');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('20');
  const [unit, setUnit] = useState<'L' | 'Gal'>('L');
  const [voidModalSale, setVoidModalSale] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');

  // Role-based data isolation: cashiers only see their own sales
  const visibleSales = currentUser.role === 'cashier'
    ? sales.filter(s => s.cashierId === currentUser.id)
    : sales;

  // Find active tank
  const currentTank = tanks.find(t => t.fuelType === selectedFuel) || tanks[0];
  const unitPrice = currentTank ? currentTank.unitPrice : 1.70;

  // Convert gallon if selected
  const rawQty = parseFloat(quantityInput) || 0;
  const litres = unit === 'Gal' ? rawQty * 3.78541 : rawQty;
  const totalAmount = parseFloat((litres * unitPrice).toFixed(2));

  // Customer info if credit or selected
  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  // Quick preset handlers
  const handlePresetLitres = (val: number) => {
    setUnit('L');
    setQuantityInput(val.toString());
  };

  const handlePresetAmount = (dollarVal: number) => {
    setUnit('L');
    const calculatedLitres = (dollarVal / unitPrice).toFixed(2);
    setQuantityInput(calculatedLitres);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (litres <= 0) {
      alert(language === 'so' ? 'Fadlan geli tiro litir oo sax ah!' : 'Please enter a valid fuel quantity!');
      return;
    }

    if (litres > currentTank.currentLevel) {
      alert(
        language === 'so'
          ? `Haanta kuma filna! Waxaa ku haray ${currentTank.currentLevel} L.`
          : `Insufficient tank stock! Remaining level is ${currentTank.currentLevel} L.`
      );
      return;
    }

    if (selectedPayment === 'credit') {
      if (!activeCustomer) {
        alert(language === 'so' ? 'Dooro macmiilka deynta qaadanaya!' : 'Please select a customer for credit sales!');
        return;
      }
      if (activeCustomer.creditLimit > 0 && activeCustomer.currentBalance + totalAmount > activeCustomer.creditLimit) {
        alert(
          language === 'so'
            ? `Macmiilku wuxuu gaaray xadka deynta ($${activeCustomer.creditLimit})!`
            : `Customer credit limit exceeded ($${activeCustomer.creditLimit})!`
        );
        return;
      }
    }

    onProcessSale({
      fuelType: selectedFuel,
      tankId: currentTank.id,
      litres: parseFloat(litres.toFixed(2)),
      unitPrice,
      totalAmount,
      paymentMethod: selectedPayment,
      customerId: activeCustomer ? activeCustomer.id : undefined,
      customerName: activeCustomer ? activeCustomer.name : undefined
    });

    // Reset default
    setQuantityInput('20');
    setSelectedPayment('sahal');
  };

  const isLPG = selectedFuel === 'LPG';
  const effectiveUnit = isLPG ? (language === 'so' ? 'Dhululubo' : 'Cyl') : unit;

  const fuelTypes: { code: FuelTypeCode; name: string; somaliName: string; price: number; color: string; unitLabel: string }[] = [
    { code: 'PMS', name: language === 'so' ? 'Baasiin (PMS)' : 'Petrol (PMS)', somaliName: 'Baasiin', price: 1.19, color: 'emerald', unitLabel: '/L' },
    { code: 'AGO', name: language === 'so' ? 'Naafto (AGO)' : 'Diesel (AGO)', somaliName: 'Naafto', price: 1.20, color: 'amber', unitLabel: '/L' },
    { code: 'DPK', name: language === 'so' ? 'Gaas Cad (DPK)' : 'Kerosene (DPK)', somaliName: 'Gaas Cad', price: 0.94, color: 'blue', unitLabel: '/L' },
    { code: 'LPG', name: language === 'so' ? 'Gaaska LPG (Dhululubo)' : 'LPG Gas (Cylinder)', somaliName: 'Gaaska LPG', price: 20.00, color: 'purple', unitLabel: language === 'so' ? '/Dhululubo' : '/Cyl' }
  ];

  return (
    <div className="space-y-3 pb-8 sm:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            <span>{t.newSale}</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Diiwaangeli iib cusub oo shidaal ah, daabac rasiidka.'
              : 'Direct fuel pump POS terminal with instant sync and receipt generation.'}
          </p>
        </div>
      </div>

      {/* POS Grid: Left Form (8 cols), Right Summary (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Form: Fuel, Customer, Payment, Quantity */}
        <div className="xl:col-span-8 bg-white p-4.5 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-4.5">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              {t.customerOptional}
            </label>
            <div className="flex gap-3">
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full bg-[#F8F9FA] hover:bg-slate-100/60 focus:bg-white text-slate-800 text-sm font-medium px-4 py-2.5 rounded-xl border border-[#ECEEF2] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
              >
                <option value="">{t.walkInCustomer}</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {language === 'so' ? 'Deyn:' : 'Debt:'} ${c.currentBalance.toFixed(2)} / Max: ${c.creditLimit}
                  </option>
                ))}
              </select>
            </div>
            {activeCustomer && (
              <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs flex items-center justify-between">
                <span className="font-semibold text-blue-900">
                  {language === 'so' ? 'Macaamilka la doortay:' : 'Selected Account:'} {activeCustomer.name}
                </span>
                <span className="text-blue-700">
                  {language === 'so' ? 'Deyn furan:' : 'Current Balance:'} <b>${activeCustomer.currentBalance.toFixed(2)}</b> / Limit: ${activeCustomer.creditLimit}
                </span>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              {language === 'so' ? 'Habka Lacag-bixinta' : 'Payment Method'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { id: 'sahal', label: t.sahal, icon: Zap },
                { id: 'evc', label: t.evcPlus, icon: Phone },
                { id: 'edahab', label: t.edahab, icon: Phone },
                { id: 'cash', label: t.cash, icon: Banknote },
                { id: 'credit', label: t.other, icon: Coins },
                { id: 'card', label: t.card, icon: CreditCard }
              ].map(pm => {
                const Icon = pm.icon;
                const isSelected = selectedPayment === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedPayment(pm.id as PaymentMethod)}
                    className={`py-2.5 px-2 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-[#F8F9FA] border-[#ECEEF2] text-slate-600 hover:bg-slate-100/70 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate w-full text-center text-[11px]">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fuel Type Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              {t.selectFuel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fuelTypes.map(f => {
                const tank = tanks.find(t => t.fuelType === f.code);
                const isSelected = selectedFuel === f.code;
                const price = tank ? tank.unitPrice : f.price;

                return (
                  <button
                    key={f.code}
                    type="button"
                    onClick={() => setSelectedFuel(f.code)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          f.code === 'PMS'
                            ? 'bg-emerald-100 text-emerald-600'
                            : f.code === 'AGO'
                            ? 'bg-amber-100 text-amber-600'
                            : f.code === 'DPK'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        <Flame className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{f.name}</div>
                      <div className="text-sm font-black text-blue-600 mt-1">
                        ${price.toFixed(2)}{f.unitLabel}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {language === 'so' ? 'Kaydka:' : 'Stock:'} {tank ? tank.currentLevel.toLocaleString() : 0} {f.code === 'LPG' ? (language === 'so' ? 'Dhululubo' : 'Cyl') : 'L'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Input & Unit Toggle & Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {isLPG ? (language === 'so' ? 'Tirada (Dhululubo)' : 'Quantity (Cylinders)') : t.quantityLitres}
              </label>
              {!isLPG ? (
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setUnit('L')}
                    className={`px-3 py-1 font-bold rounded-md transition-all ${
                      unit === 'L' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Litres (L)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('Gal')}
                    className={`px-3 py-1 font-bold rounded-md transition-all ${
                      unit === 'Gal' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Gallons (Gal)
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1 font-bold rounded-md bg-purple-50 text-purple-700 text-xs border border-purple-200">
                  {language === 'so' ? 'Dhululubo Gas ah ($20)' : 'Cylinder ($20/ea)'}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={quantityInput}
                onChange={e => setQuantityInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 focus:bg-white text-slate-900 text-2xl font-black px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                {effectiveUnit}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-[11px] font-bold text-slate-400 self-center mr-1">
                {language === 'so' ? 'Xulasho Dhaqso ah:' : 'Presets:'}
              </span>
              {(isLPG ? [1, 2, 3, 5, 10] : [10, 20, 50, 100]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePresetLitres(p)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs rounded-lg transition-all"
                >
                  {p}{isLPG ? (language === 'so' ? ' Dhululubo' : ' Cyl') : 'L'}
                </button>
              ))}
              <div className="h-5 w-px bg-slate-200 mx-1 self-center" />
              {/* Dollar presets */}
              {(isLPG ? [20, 40, 60, 100] : [10, 20, 50]).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handlePresetAmount(d)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-all"
                >
                  ${d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Sale Summary & Process Button */}
        <div className="xl:col-span-4 bg-white p-4.5 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 border-b border-[#F1F3F6] pb-3">
              {t.saleSummary}
            </h2>

            <div className="space-y-3.5 my-5 text-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span>{t.fuel}</span>
                <span className="font-bold text-slate-800">{currentTank.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>{isLPG ? (language === 'so' ? 'Dhululubo' : 'Cylinders') : t.litres}</span>
                <span className="font-bold text-slate-800">
                  {litres.toFixed(isLPG ? 0 : 2)} {effectiveUnit}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>{t.unitPrice}</span>
                <span className="font-bold text-slate-800">${unitPrice.toFixed(2)}{isLPG ? (language === 'so' ? '/Dhululubo' : '/Cyl') : '/L'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>{language === 'so' ? 'Habka lacagta' : 'Payment'}</span>
                <span className="font-bold text-blue-600 uppercase">{selectedPayment === 'sahal' ? 'Golis Sahal' : selectedPayment}</span>
              </div>
              {activeCustomer && (
                <div className="flex items-center justify-between text-slate-500">
                  <span>{language === 'so' ? 'Macmiilka' : 'Customer'}</span>
                  <span className="font-bold text-slate-800">{activeCustomer.name}</span>
                </div>
              )}
            </div>

            {/* Total Display */}
            <div className="p-5 rounded-2xl bg-[#F8F9FB] border border-[#ECEEF2] text-center my-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {t.total}
              </span>
              <div className="text-4xl font-black text-[#0F172A] mt-1 tracking-tight">
                ${totalAmount.toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-400 font-medium block mt-1">
                {language === 'so' ? 'Shidaalka ku haraya haanta:' : 'Tank Stock Remaining:'} {(currentTank.currentLevel - litres).toLocaleString()} {isLPG ? (language === 'so' ? 'Dhululubo' : 'Cyl') : 'L'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3.5 bg-[#111318] hover:bg-black text-white font-bold text-sm rounded-xl shadow-xs transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.processPayment}</span>
          </button>
        </div>
      </div>

      {/* Recent Sales Table with Void feature */}
      <div className="bg-white p-4.5 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {language === 'so' ? 'Iibka Maanta & Dhaqdhaqaaqa' : 'Today’s Sales Ledger'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'so'
                ? 'Diiwaanka iibka xarunta, dib-u-eegis rasiidh iyo tirtirid oggolaansho leh'
                : 'Atomic sale records, official receipt preview and void reversal'}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {visibleSales.length} {language === 'so' ? 'Iib' : 'Transactions'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Fuel Type</th>
                <th className="py-3 px-4">Litres</th>
                <th className="py-3 px-4">Price/L</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {visibleSales.map(sale => {
                const isVoided = sale.paymentStatus === 'voided';
                return (
                  <tr
                    key={sale.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isVoided ? 'opacity-50 line-through' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {sale.saleNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(sale.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {sale.fuelType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{sale.litres.toFixed(2)} L</td>
                    <td className="py-3.5 px-4 text-slate-500">${sale.unitPrice.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ${sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isVoided
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isVoided ? 'VOIDED' : 'PAID'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewReceipt(sale)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center gap-1 transition-all"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                        {!isVoided && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
                          <button
                            onClick={() => setVoidModalSale(sale)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Void</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void Modal */}
      {voidModalSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'so' ? 'Tirtir / Dib-u-celi Iibkan?' : 'Void Transaction?'}
                </h3>
                <p className="text-xs text-slate-500">
                  Receipt #{voidModalSale.saleNumber} • ${voidModalSale.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'so'
                ? 'Litirka waxaa lagu celinayaa haanta shidaalka, xisaabta deyntana waa laga jarayaa. Hawshani waxay galaysaa Audit Log.'
                : 'Fuel volume will be returned to the tank and debt deducted. This action requires approval and creates an immutable audit trail.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                {language === 'so' ? 'Sababta Tirtiridda' : 'Reason for Void'}
              </label>
              <textarea
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder={language === 'so' ? 'Geli sababta...' : 'e.g., Wrong nozzle pumped, customer changed mind...'}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalSale(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!voidReason.trim()) {
                    alert('Please provide a reason for the void.');
                    return;
                  }
                  onVoidSale(voidModalSale.id, voidReason);
                  setVoidModalSale(null);
                  setVoidReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
