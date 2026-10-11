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
  TrendingDown
} from 'lucide-react';
import { Tank, FuelDelivery, FuelTypeCode, User } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

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
  const [deliveryLitres, setDeliveryLitres] = useState<string>('5000');
  const [costPerLitre, setCostPerLitre] = useState<string>('1.40');
  const [supplierName, setSupplierName] = useState<string>('Hass Petroleum Somalia');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('HASS-2025-099');

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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span>{t.tanksManagement}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Haamaha shidaalka, heerka litirrada, keenista cusub iyo cabbirka dipstick-ga.'
              : 'Underground fuel tanks, real-time volume, replenishment and dipstick variance.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCalibrateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t.calibrateDipstick}</span>
          </button>
          <button
            onClick={() => setDeliveryModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addDelivery}</span>
          </button>
        </div>
      </div>

      {/* Tanks Management Table (Exact match from bottom-middle mockup!) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tank</th>
                <th className="py-3 px-4">Fuel Type</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Volume</th>
                <th className="py-3 px-4">Price/L</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tanks.map(tank => {
                const pct = Math.round((tank.currentLevel / tank.capacity) * 100);
                const badge = fuelBadges[tank.fuelType] || fuelBadges.PMS;
                const isLow = pct < 30;

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
                      <b>{tank.currentLevel.toLocaleString()} L</b> / {tank.capacity.toLocaleString()} L
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      ${tank.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isLow ? 'Low' : 'Normal'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setPriceModalTank(tank);
                          setNewPrice(tank.unitPrice.toString());
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
                      >
                        Update Price
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
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
      {deliveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{t.addDelivery}</h3>
                <p className="text-xs text-slate-400">Receive bulk fuel shipment into tank</p>
              </div>
            </div>

            <form onSubmit={handleDeliverySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Tank</label>
                <select
                  value={selectedTankId}
                  onChange={e => setSelectedTankId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                >
                  {tanks.map(tank => (
                    <option key={tank.id} value={tank.id}>
                      {tank.tankNumber} - {tank.name} (Current: {tank.currentLevel} L / Max: {tank.capacity} L)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Litres Received</label>
                  <input
                    type="number"
                    value={deliveryLitres}
                    onChange={e => setDeliveryLitres(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost / Litre ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPerLitre}
                    onChange={e => setCostPerLitre(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier Company</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice / Delivery Note #</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex justify-between font-bold text-blue-900">
                <span>Total Delivery Cost:</span>
                <span>${((parseFloat(deliveryLitres) || 0) * (parseFloat(costPerLitre) || 0)).toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Record Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calibrate Dipstick Modal */}
      {calibrateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{t.calibrateDipstick}</h3>
                <p className="text-xs text-slate-400">Reconcile physical tank dipstick with system log</p>
              </div>
            </div>

            <form onSubmit={handleCalibSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Tank</label>
                <select
                  value={calibTankId}
                  onChange={e => setCalibTankId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                >
                  {tanks.map(tank => (
                    <option key={tank.id} value={tank.id}>
                      {tank.name} (Current recorded: {tank.currentLevel} L)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Physical Measured Litres (from Dipstick)
                </label>
                <input
                  type="number"
                  placeholder={targetCalibTank.currentLevel.toString()}
                  value={measuredLitres}
                  onChange={e => setMeasuredLitres(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Calibration Notes / Reason</label>
                <textarea
                  value={calibNotes}
                  onChange={e => setCalibNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCalibrateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20"
                >
                  Adjust & Log Calibration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {priceModalTank && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Update Price: {priceModalTank.name}
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Price per Litre ($/L)
              </label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-black text-lg text-blue-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPriceModalTank(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = parseFloat(newPrice);
                  if (p > 0) {
                    onUpdateTankPrice(priceModalTank.id, p);
                    setPriceModalTank(null);
                  }
                }}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20"
              >
                Save New Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
