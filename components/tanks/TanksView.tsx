'use client';

import React, { useState } from 'react';
import {
  Database,
  Flame,
  Plus,
  Truck,
  RotateCw,
  Gauge,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingDown,
  X
} from 'lucide-react';
import { Tank, FuelDelivery, FuelTypeCode, User } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { Modal } from '@/components/ui/Modal';

interface TanksViewProps {
  tanks: Tank[];
  deliveries: FuelDelivery[];
  currentUser: User;
  language: Language;
  onAddDelivery: (delivery: {
    tankId: string;
    fuelType: FuelTypeCode;
    litres: number;
    costPerLitre: number;
    totalCost: number;
    supplier: string;
    invoiceNumber: string;
    dipstickBefore: number;
    dipstickAfter: number;
  }) => void;
  onCalibrateDipstick: (tankId: string, measuredLevel: number, notes: string) => void;
  onUpdateTankPrice: (tankId: string, newPrice: number) => void;
}

export const TanksView: React.FC<TanksViewProps> = ({
  tanks,
  deliveries,
  currentUser,
  language,
  onAddDelivery,
  onCalibrateDipstick,
  onUpdateTankPrice
}) => {
  const t = translations[language];

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [calibrateModalOpen, setCalibrateModalOpen] = useState(false);
  const [priceModalTank, setPriceModalTank] = useState<Tank | null>(null);

  // Delivery form state
  const [selectedTankId, setSelectedTankId] = useState<string>(tanks[0]?.id || '');
  const [deliveryLitres, setDeliveryLitres] = useState<string>('');
  const [costPerLitre, setCostPerLitre] = useState<string>('1.05');
  const [supplierName, setSupplierName] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  // Calibrate state
  const [calibTankId, setCalibTankId] = useState<string>(tanks[0]?.id || '');
  const [measuredLitres, setMeasuredLitres] = useState<string>('');
  const [calibNotes, setCalibNotes] = useState<string>('Routine morning dipstick rod reading');

  // Price state
  const [newPrice, setNewPrice] = useState<string>('');

  const targetTank = tanks.find(t => t.id === selectedTankId) || tanks[0];
  const targetCalibTank = tanks.find(t => t.id === calibTankId) || tanks[0];

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(deliveryLitres) || 0;
    const c = parseFloat(costPerLitre) || 0;
    if (l <= 0) return;

    if (targetTank.currentLevel + l > targetTank.capacity) {
      alert(`Volume exceeds tank capacity (${targetTank.capacity.toLocaleString()} L)!`);
      return;
    }

    onAddDelivery({
      tankId: targetTank.id,
      fuelType: targetTank.fuelType,
      litres: l,
      costPerLitre: c,
      totalCost: parseFloat((l * c).toFixed(2)),
      supplier: supplierName,
      invoiceNumber: invoiceNumber,
      dipstickBefore: targetTank.currentLevel,
      dipstickAfter: targetTank.currentLevel + l
    });

    setDeliveryModalOpen(false);
    setDeliveryLitres('');
  };

  const handleCalibSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(measuredLitres);
    if (isNaN(val) || val < 0) return;

    onCalibrateDipstick(calibTankId, val, calibNotes);
    setCalibrateModalOpen(false);
    setMeasuredLitres('');
  };

  const fuelBadges: Record<FuelTypeCode, { dot: string; text: string; ring: string }> = {
    PMS: { dot: 'bg-emerald-500', text: 'text-emerald-700', ring: 'stroke-emerald-500' },
    AGO: { dot: 'bg-amber-500', text: 'text-amber-700', ring: 'stroke-amber-500' },
    DPK: { dot: 'bg-blue-500', text: 'text-blue-700', ring: 'stroke-blue-500' },
    LPG: { dot: 'bg-purple-500', text: 'text-purple-700', ring: 'stroke-purple-500' }
  };

  return (
    <div className="space-y-3 pb-8 sm:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span>{t.tanksManagement}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Haamaha shidaalka, heerka litirrada, keenista cusub iyo cabbirka dipstick-ga.'
              : 'Underground fuel tanks, real-time volume, replenishment and dipstick variance.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCalibrateModalOpen(true)}
            className="btn-secondary"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t.calibrateDipstick}</span>
          </button>
          <button
            onClick={() => setDeliveryModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addDelivery}</span>
          </button>
        </div>
      </div>

      {/* Tanks Management Table */}
      <div className="bg-white p-4.5 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{language === 'so' ? 'Haanta' : 'Tank'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Nooca Shidaalka' : 'Fuel Type'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Heerka' : 'Level'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Tirada Ku Jirta' : 'Volume'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Qiimaha' : 'Price'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Xaaladda' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{language === 'so' ? 'Ficillo' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tanks.map(tank => {
                const pct = Math.round((tank.currentLevel / tank.capacity) * 100);
                const badge = fuelBadges[tank.fuelType] || fuelBadges.PMS;
                const isLow = pct < 30;
                const isLPG = tank.fuelType === 'LPG';

                return (
                  <tr key={tank.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <span className="font-mono">{tank.tankNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                        <span>{tank.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full ${
                              isLow ? 'bg-rose-500' : badge.dot
                            }`}
                          />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      <b>{tank.currentLevel.toLocaleString()} {isLPG ? (language === 'so' ? 'Dhululubo' : 'Cyl') : 'L'}</b> / {tank.capacity.toLocaleString()} {isLPG ? (language === 'so' ? 'Dhululubo' : 'Cyl') : 'L'}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      ${tank.unitPrice.toFixed(2)}{isLPG ? (language === 'so' ? '/Dhululubo' : '/Cyl') : '/L'}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isLow ? (language === 'so' ? 'Hooseeya' : 'Low') : (language === 'so' ? 'Caadi' : 'Normal')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setPriceModalTank(tank);
                          setNewPrice(tank.unitPrice.toString());
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                      >
                        {language === 'so' ? 'Bedel Qiimaha' : 'Update Price'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tank Levels Radial Gauges (Exact section from mockup!) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-6">
          {t.tankLevels}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {tanks.map(tank => {
            const pct = Math.round((tank.currentLevel / tank.capacity) * 100);
            const badge = fuelBadges[tank.fuelType] || fuelBadges.PMS;
            const strokeDashoffset = 251.2 - (251.2 * pct) / 100;

            return (
              <div
                key={tank.id}
                className="flex flex-col items-center p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-center"
              >
                {/* SVG Radial Gauge */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-slate-200"
                      strokeWidth="9"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className={`${badge.ring} transition-all duration-1000 ease-out`}
                      strokeWidth="9"
                      strokeDasharray="251.2"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-900">{pct}%</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-bold text-xs text-slate-800">{tank.name}</div>
                  <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    {tank.currentLevel.toLocaleString()} L
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deliveries History */}
      <div className="bg-white p-4.5 sm:p-5 rounded-2xl border border-[#ECEEF2] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {language === 'so' ? 'Taariikhda Keenisyada Shidaalka' : 'Fuel Deliveries History'}
            </h2>
            <p className="text-xs text-slate-400">
              Bulk fuel received from terminals and suppliers
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Fuel Type</th>
                <th className="py-3 px-4">Litres Received</th>
                <th className="py-3 px-4">Cost / Litre</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Received By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {deliveries.map(del => (
                <tr key={del.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 text-slate-500">{del.receivedAt}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{del.fuelType}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">
                    +{del.litres.toLocaleString()} L
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">${del.costPerLitre.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    ${del.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{del.supplier}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{del.invoiceNumber}</td>
                  <td className="py-3.5 px-4 text-slate-600">{del.receivedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Modal */}
      <Modal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        title={t.addDelivery}
        subtitle={
          language === 'so'
            ? 'Shidaalka jumlad ahaan loogu shubayo haamaha xarunta (Gaalkacyo).'
            : 'Receive bulk fuel shipment into tank storage.'
        }
        icon={<Truck className="w-5 h-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleDeliverySubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Dooro Haanta' : 'Select Tank'}
            </label>
            <select
              value={selectedTankId}
              onChange={e => setSelectedTankId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {tanks.map(tank => (
                <option key={tank.id} value={tank.id}>
                  {tank.tankNumber} - {tank.name} (Hadda: {tank.currentLevel.toLocaleString()} L / Max: {tank.capacity.toLocaleString()} L)
                </option>
              ))}
            </select>
          </div>

          {/* Live Tank Telemetry Badge in Modal */}
          {targetTank && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>{language === 'so' ? 'Heerka Hadda (Current):' : 'Current Stock:'}</span>
                <span className="font-bold text-slate-900">{targetTank.currentLevel.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>{language === 'so' ? 'Awoodda Haanta (Max):' : 'Tank Capacity:'}</span>
                <span className="font-bold text-slate-900">{targetTank.capacity.toLocaleString()} L</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>{language === 'so' ? 'Meel Bannaan (Available):' : 'Remaining Space:'}</span>
                <span className="font-bold text-emerald-600">
                  {Math.max(0, targetTank.capacity - targetTank.currentLevel).toLocaleString()} L
                </span>
              </div>
              {parseFloat(deliveryLitres) > 0 && (
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-semibold text-slate-700">
                    {language === 'so' ? 'Heerka Cusub ee Dhalanaya:' : 'Projected Stock:'}
                  </span>
                  <span className={`font-black ${
                    targetTank.currentLevel + (parseFloat(deliveryLitres) || 0) > targetTank.capacity
                      ? 'text-rose-600'
                      : 'text-blue-600'
                  }`}>
                    {(targetTank.currentLevel + (parseFloat(deliveryLitres) || 0)).toLocaleString()} L
                  </span>
                </div>
              )}
              {targetTank.currentLevel + (parseFloat(deliveryLitres) || 0) > targetTank.capacity && (
                <p className="text-[11px] font-bold text-rose-600 pt-1">
                  ⚠️ {language === 'so' ? 'Shidaalkani wuxuu dhaafayaa awoodda haanta!' : 'Warning: Delivery exceeds tank capacity!'}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {language === 'so' ? 'Litirrada La Keenay' : 'Litres Received'}
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5000"
                value={deliveryLitres}
                onChange={e => setDeliveryLitres(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {language === 'so' ? 'Qiimaha / Litir ($)' : 'Cost / Litre ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="1.05"
                value={costPerLitre}
                onChange={e => setCostPerLitre(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Shirkadda Shidaalka (Supplier)' : 'Supplier Company'}
            </label>
            <input
              type="text"
              placeholder={language === 'so' ? 'e.g. SomPetrol ama Boosaaso Supplies' : 'e.g. SomPetrol / Boosaaso Supplies'}
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Lambarka Qaansheegta / Rasiidka (Ikhtiyaari)' : 'Invoice / Delivery Note # (Optional)'}
            </label>
            <input
              type="text"
              placeholder="e.g. PPB-2026-001"
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex justify-between font-bold text-blue-900">
            <span>{language === 'so' ? 'Wadarta Kharashka Keenista:' : 'Total Delivery Cost:'}</span>
            <span className="text-base">${((parseFloat(deliveryLitres) || 0) * (parseFloat(costPerLitre) || 0)).toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeliveryModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer transition-colors"
            >
              {language === 'so' ? 'Ka noqo' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!deliveryLitres || parseFloat(deliveryLitres) <= 0 || (targetTank && targetTank.currentLevel + (parseFloat(deliveryLitres) || 0) > targetTank.capacity)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer transition-colors"
            >
              {language === 'so' ? 'Diiwaangeli Shidaalka' : 'Record Delivery'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Calibrate Dipstick Modal */}
      <Modal
        isOpen={calibrateModalOpen}
        onClose={() => setCalibrateModalOpen(false)}
        title={t.calibrateDipstick}
        subtitle={
          language === 'so'
            ? 'Isku-aaddinta cabbirka birta dipstick-ga iyo xogta nidaamka si sax ah.'
            : 'Reconcile physical tank dipstick reading with digital system log.'
        }
        icon={<SlidersHorizontal className="w-5 h-5 text-amber-500" />}
        maxWidth="md"
      >
        <form onSubmit={handleCalibSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Dooro Haanta' : 'Select Tank'}
            </label>
            <select
              value={calibTankId}
              onChange={e => setCalibTankId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            >
              {tanks.map(tank => (
                <option key={tank.id} value={tank.id}>
                  {tank.name} ({language === 'so' ? 'Hadda nidaamka ku qoran:' : 'Current recorded:'} {tank.currentLevel.toLocaleString()} L)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Litirrada Birtu Cabbirtay (Dipstick Reading)' : 'Physical Measured Litres (from Dipstick)'}
            </label>
            <input
              type="number"
              placeholder={targetCalibTank?.currentLevel.toString()}
              value={measuredLitres}
              onChange={e => setMeasuredLitres(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-black text-slate-900 text-sm focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            />
            {targetCalibTank && measuredLitres && (
              <p className="text-[11px] text-slate-500 mt-1">
                {language === 'so' ? 'Farqiga soo baxaya:' : 'Calculated variance:'}{' '}
                <span className={parseFloat(measuredLitres) - targetCalibTank.currentLevel >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {parseFloat(measuredLitres) - targetCalibTank.currentLevel >= 0 ? '+' : ''}
                  {(parseFloat(measuredLitres) - targetCalibTank.currentLevel).toLocaleString()} L
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Sababta / Xusuus-qorka Cabbirka' : 'Calibration Notes / Reason'}
            </label>
            <textarea
              value={calibNotes}
              onChange={e => setCalibNotes(e.target.value)}
              placeholder={language === 'so' ? 'Tusaale: Cabbirka maalinlaha ah ee birta saaka' : 'e.g. Daily morning manual dipstick verification'}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCalibrateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
            >
              {language === 'so' ? 'Ka noqo' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!measuredLitres}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold shadow-md shadow-amber-600/20 transition-colors"
            >
              {language === 'so' ? 'Xaqiiji Cabbirka' : 'Save Calibration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Price Modal */}
      <Modal
        isOpen={!!priceModalTank}
        onClose={() => setPriceModalTank(null)}
        title={language === 'so' ? `Beddel Qiimaha: ${priceModalTank?.name || ''}` : `Update Price: ${priceModalTank?.name || ''}`}
        subtitle={
          language === 'so'
            ? 'Qiimaha cusub ee 1-da litir ee lagu iibinayo bamka shidaalka.'
            : 'Set new retail dispensing price per litre.'
        }
        icon={<Flame className="w-5 h-5 text-amber-500" />}
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {language === 'so' ? 'Qiimaha Cusub ee 1-ka Litir ($/L)' : 'New Price per Litre ($/L)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-black text-xl text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPriceModalTank(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {language === 'so' ? 'Ka noqo' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                const p = parseFloat(newPrice);
                if (p > 0 && priceModalTank) {
                  onUpdateTankPrice(priceModalTank.id, p);
                  setPriceModalTank(null);
                }
              }}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-colors"
            >
              {language === 'so' ? 'Xaqiiji Qiimaha' : 'Save New Price'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

