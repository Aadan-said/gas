'use client';

import React, { useState, useEffect } from 'react';
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
  Zap,
  Edit3
} from 'lucide-react';
import { Tank, Customer, Sale, User as AppUser, FuelTypeCode, PaymentMethod } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { Modal } from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';

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

  // Track selected tank ID dynamically from live state
  const [selectedTankId, setSelectedTankId] = useState<string>(tanks[0]?.id || '');
  const [selectedFuel, setSelectedFuel] = useState<FuelTypeCode>(tanks[0]?.fuelType || 'PMS');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('sahal');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('20');
  const [unit, setUnit] = useState<'L' | 'Gal'>('L');
  const [voidModalSale, setVoidModalSale] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');

  // Keep selected tank synced whenever tanks state changes
  useEffect(() => {
    if (tanks.length > 0) {
      const exists = tanks.find(t => t.id === selectedTankId);
      if (!exists) {
        setSelectedTankId(tanks[0].id);
        setSelectedFuel(tanks[0].fuelType);
      }
    }
  }, [tanks, selectedTankId]);

  // Role-based data isolation: cashiers only see their own sales
  const visibleSales = currentUser.role === 'cashier'
    ? sales.filter(s => s.cashierId === currentUser.id)
    : sales;

  // Find active tank from live state (by selected ID or fuel type)
  const currentTank = tanks.find(t => t.id === selectedTankId) ||
    tanks.find(t => t.fuelType === selectedFuel) ||
    tanks[0] || {
      id: 't_default',
      tankNumber: 'T-01',
      fuelType: 'PMS' as FuelTypeCode,
      name: 'Baasiin (PMS)',
      capacity: 10000,
      currentLevel: 5000,
      unitPrice: 1.19,
      minThreshold: 2000,
      status: 'normal' as const
    };

  const tankUnitPrice = currentTank.unitPrice;

  // Custom editable selling price per unit ($/L or $/cylinder)
  const [customPrice, setCustomPrice] = useState<string>(tankUnitPrice.toFixed(2));

  // Automatically update selling price when selected tank or tank's live unit price changes
  useEffect(() => {
    if (currentTank) {
      setCustomPrice(currentTank.unitPrice.toFixed(2));
    }
  }, [currentTank.id, currentTank.unitPrice]);

  const activeUnitPrice = parseFloat(customPrice) > 0 ? parseFloat(customPrice) : tankUnitPrice;

  // Convert gallon if selected
  const rawQty = parseFloat(quantityInput) || 0;
  const litres = unit === 'Gal' ? rawQty * 3.78541 : rawQty;
  const totalAmount = parseFloat((litres * activeUnitPrice).toFixed(2));

  // Customer info if credit or selected
  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  // Quick preset handlers
  const handlePresetLitres = (val: number) => {
    setUnit('L');
    setQuantityInput(val.toString());
  };

  const handlePresetAmount = (dollarVal: number) => {
    setUnit('L');
    const calculatedLitres = (dollarVal / activeUnitPrice).toFixed(2);
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
          ? `Haanta kuma filna! Waxaa ku haray ${currentTank.currentLevel.toLocaleString()} ${currentTank.fuelType === 'LPG' ? 'Dhululubo' : 'L'}.`
          : `Insufficient tank stock! Remaining level is ${currentTank.currentLevel.toLocaleString()} ${currentTank.fuelType === 'LPG' ? 'Cyl' : 'L'}.`
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
      fuelType: currentTank.fuelType,
      tankId: currentTank.id,
      litres: parseFloat(litres.toFixed(2)),
      unitPrice: activeUnitPrice,
      totalAmount,
      paymentMethod: selectedPayment,
      customerId: activeCustomer ? activeCustomer.id : undefined,
      customerName: activeCustomer ? activeCustomer.name : undefined
    });

    // Reset default
    setQuantityInput('20');
    setSelectedPayment('sahal');
  };

  const isLPG = currentTank.fuelType === 'LPG';
  const effectiveUnit = isLPG ? (language === 'so' ? 'Dhululubo' : 'Cyl') : unit;

  // Build dynamic list of selectable fuels/tanks directly from station's live registered tanks
  const availableTanks = tanks.length > 0 ? tanks : [currentTank];

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
            <CustomSelect
              value={selectedCustomerId}
              onChange={val => setSelectedCustomerId(val)}
              options={[
                {
                  value: '',
                  label: t.walkInCustomer,
                  sublabel: language === 'so' ? 'Iib caddaan ama mobile ah (Walk-in retail)' : 'General walk-in cash customer'
                },
                ...customers.map(c => ({
                  value: c.id,
                  label: `${c.name} (${c.phone})`,
                  sublabel: `${language === 'so' ? 'Dayn:' : 'Debt:'} $${c.currentBalance.toFixed(2)} / Max: $${c.creditLimit}`,
                  badge: c.currentBalance > 0 ? `$${c.currentBalance.toFixed(0)} Deyn` : 'Deyn la\'aan',
                  badgeColor: c.currentBalance > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }))
              ]}
              placeholder={t.walkInCustomer}
              showSearch={true}
              searchPlaceholder={language === 'so' ? 'Raadi magac ama telefoon...' : 'Search customer...'}
            />
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

          {/* Fuel Type Cards (Live Telemetry & Selling Price from Tanks) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {t.selectFuel}
              </label>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {language === 'so' ? 'Xogta Tooska ah ee Haamaha' : 'Live Tank Stock & Rates'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {availableTanks.map(tank => {
                const isSelected = currentTank.id === tank.id;
                const isLow = tank.currentLevel <= tank.minThreshold;
                const isLpgTank = tank.fuelType === 'LPG';
                const unitLabel = isLpgTank ? (language === 'so' ? '/Dhululubo' : '/Cyl') : '/L';
                const unitStock = isLpgTank ? (language === 'so' ? 'Dhululubo' : 'Cyl') : 'L';

                return (
                  <button
                    key={tank.id}
                    type="button"
                    onClick={() => {
                      setSelectedTankId(tank.id);
                      setSelectedFuel(tank.fuelType);
                      setCustomPrice(tank.unitPrice.toFixed(2));
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          tank.fuelType === 'PMS'
                            ? 'bg-emerald-100 text-emerald-600'
                            : tank.fuelType === 'AGO'
                            ? 'bg-amber-100 text-amber-600'
                            : tank.fuelType === 'DPK'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        <Flame className="w-4 h-4" />
                      </div>
                      {isSelected ? (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      ) : isLow ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                          {language === 'so' ? 'Hoos' : 'Low'}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate">{tank.name}</span>
                        {tank.tankNumber && (
                          <span className="text-[10px] font-mono text-slate-400">({tank.tankNumber})</span>
                        )}
                      </div>
                      <div className="text-sm font-black text-blue-600 mt-1">
                        ${tank.unitPrice.toFixed(2)}{unitLabel}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {language === 'so' ? 'Kaydka:' : 'Stock:'} <b className="text-slate-800">{tank.currentLevel.toLocaleString()}</b> {unitStock}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Unit Price Field (Custom or Live Tank Price) */}
          <div className="p-3 bg-gradient-to-r from-blue-50/80 via-slate-50 to-emerald-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {language === 'so' ? 'Qiimaha Iibka ee Xilligan (Selling Price)' : 'Current Selling Unit Price'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {language === 'so'
                    ? `Qiimaha rasmiga ah ee haanta: $${tankUnitPrice.toFixed(2)}${isLPG ? '/Dhululubo' : '/L'} — waad beddeli kartaa intaad rabto`
                    : `Configured tank price: $${tankUnitPrice.toFixed(2)}${isLPG ? '/Cyl' : '/L'} — freely adjustable`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <div className="relative w-32 sm:w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  placeholder={tankUnitPrice.toFixed(2)}
                  className="w-full h-9.5 pl-7 pr-3 bg-white border border-blue-200 focus:border-blue-600 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-right shadow-2xs"
                />
              </div>

              {parseFloat(customPrice) !== tankUnitPrice && (
                <button
                  type="button"
                  onClick={() => setCustomPrice(tankUnitPrice.toFixed(2))}
                  className="px-2.5 py-1.5 h-9.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  title={language === 'so' ? 'Dib ugu celi qiimaha rasmiga ah ee haanta' : 'Reset to official tank rate'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'so' ? 'Dib u celi' : 'Reset'}</span>
                </button>
              )}
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
                <span className="font-bold text-slate-800">${activeUnitPrice.toFixed(2)}{isLPG ? (language === 'so' ? '/Dhululubo' : '/Cyl') : '/L'}</span>
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
                {language === 'so' ? 'Shidaalka ku haraya haanta:' : 'Tank Stock Remaining:'} {Math.max(0, currentTank.currentLevel - litres).toLocaleString()} {isLPG ? (language === 'so' ? 'Dhululubo' : 'Cyl') : 'L'}
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
      <Modal
        isOpen={!!voidModalSale}
        onClose={() => setVoidModalSale(null)}
        title={language === 'so' ? 'Tirtir / Dib-u-celi Iibkan?' : 'Void Transaction?'}
        subtitle={voidModalSale ? `Receipt #${voidModalSale.saleNumber} • $${voidModalSale.totalAmount.toFixed(2)}` : ''}
        icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
        maxWidth="md"
      >
        {voidModalSale && (
          <div className="space-y-4 text-xs">
            <p className="text-xs text-slate-600 leading-relaxed p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-800">
              {language === 'so'
                ? 'Litirka waxaa lagu celinayaa haanta shidaalka, xisaabta deyntana waa laga jarayaa. Hawshani waxay si toos ah u galaysaa Audit Log-ga maamulka.'
                : 'Fuel volume will be returned to the tank and debt deducted. This action requires approval and creates an immutable audit trail.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {language === 'so' ? 'Sababta Tirtiridda (Reason for Void)' : 'Reason for Void'}
              </label>
              <textarea
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder={language === 'so' ? 'Geli sababta tirtiridda...' : 'e.g., Wrong nozzle pumped, customer changed mind...'}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVoidModalSale(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {language === 'so' ? 'Ka noqo' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!voidReason.trim()) {
                    alert(language === 'so' ? 'Fadlan geli sababta tirtiridda.' : 'Please provide a reason for the void.');
                    return;
                  }
                  onVoidSale(voidModalSale.id, voidReason);
                  setVoidModalSale(null);
                  setVoidReason('');
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-colors"
              >
                {language === 'so' ? 'Xaqiiji Tirtiridda' : 'Confirm Void'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
