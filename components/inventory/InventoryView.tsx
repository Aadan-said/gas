'use client';

import React, { useState } from 'react';
import {
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Flame,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus
} from 'lucide-react';
import { Tank, InventoryMovement, User } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { Modal } from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface InventoryViewProps {
  tanks: Tank[];
  movements: InventoryMovement[];
  currentUser: User;
  language: Language;
  onAddAdjustment?: (adj: {
    tankId: string;
    quantity: number;
    reason: string;
  }) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  tanks,
  movements,
  currentUser,
  language,
  onAddAdjustment
}) => {
  const t = translations[language];
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  // Adjustment form state
  const [selectedTankId, setSelectedTankId] = useState(tanks[0]?.id || '');
  const [adjustLitres, setAdjustLitres] = useState('');
  const [adjustReason, setAdjustReason] = useState('Uumi-bax maalinle ah (Daily evaporation)');

  // Default seed movements if empty
  const displayMovements =
    movements.length > 0
      ? movements
      : [
          {
            id: 'mov_1',
            tankId: 't_1',
            fuelType: 'PMS',
            type: 'sale' as const,
            quantity: -20,
            previousLevel: 6820,
            newLevel: 6800,
            referenceId: 'GF-2025-001',
            note: 'POS Terminal Dispense',
            createdAt: 'Today, 10:15 AM'
          },
          {
            id: 'mov_2',
            tankId: 't_2',
            fuelType: 'AGO',
            type: 'sale' as const,
            quantity: -19,
            previousLevel: 4219,
            newLevel: 4200,
            referenceId: 'GF-2025-002',
            note: 'POS Terminal Dispense',
            createdAt: 'Today, 09:45 AM'
          },
          {
            id: 'mov_3',
            tankId: 't_1',
            fuelType: 'PMS',
            type: 'delivery' as const,
            quantity: 5000,
            previousLevel: 1820,
            newLevel: 6820,
            referenceId: 'HASS-2025-881',
            note: 'Hass Petroleum Delivery',
            createdAt: 'Yesterday, 04:30 PM'
          },
          {
            id: 'mov_4',
            tankId: 't_3',
            fuelType: 'DPK',
            type: 'adjustment' as const,
            quantity: 12,
            previousLevel: 8488,
            newLevel: 8500,
            referenceId: 'CALIB-0428',
            note: 'Dipstick calibration adjustment',
            createdAt: '28 Apr 2025'
          }
        ];

  const filtered = displayMovements.filter(m => {
    const matchesType = filterType === 'all' ? true : m.type === filterType;
    const matchesSearch =
      search === '' ||
      m.fuelType.toLowerCase().includes(search.toLowerCase()) ||
      m.referenceId.toLowerCase().includes(search.toLowerCase()) ||
      (m.note && m.note.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleExportCSV = () => {
    const rows = [
      'Date,Fuel,Type,Litres,PreviousLevel,NewLevel,Reference,Note'
    ];
    filtered.forEach(m => {
      rows.push(
        `"${m.createdAt}","${m.fuelType}","${m.type}","${m.quantity}","${m.previousLevel}","${m.newLevel}","${m.referenceId}","${m.note || ''}"`
      );
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GasFlow_Stock_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(adjustLitres);
    if (isNaN(qty) || qty === 0) return;
    if (onAddAdjustment) {
      onAddAdjustment({
        tankId: selectedTankId,
        quantity: qty,
        reason: adjustReason
      });
    }
    setAdjustModalOpen(false);
    setAdjustLitres('');
  };

  return (
    <div className="space-y-4 pb-8 sm:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>{t.inventory}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Dhaqdhaqaaqa shidaalka: iibka baxay, keenista soo gashay iyo saxidda dipstick-ga.'
              : 'End-to-end fuel stock ledger tracking every litre pumped, received or adjusted.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          {onAddAdjustment && (
            <button
              onClick={() => setAdjustModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'so' ? 'Hagaaji Shidaal' : 'Manual Adjustment'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tank Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tanks.map(tank => {
          const pct = Math.round((tank.currentLevel / tank.capacity) * 100);
          return (
            <div key={tank.id} className="bg-white p-3.5 rounded-2xl border border-[#ECEEF2] shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-800">{tank.name}</span>
                <span className="text-blue-600 font-black">{pct}%</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                {tank.currentLevel.toLocaleString()} L
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Cap: {tank.capacity.toLocaleString()} L
              </div>
            </div>
          );
        })}
      </div>

      {/* Movements Table */}
      <div className="bg-white p-5 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={language === 'so' ? 'Raadi dhaqdhaqaaq...' : 'Search ledger...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="segmented-control">
            {['all', 'sale', 'delivery', 'adjustment'].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`segmented-item capitalize ${filterType === f ? 'active' : ''}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Fuel Type</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4">Litres Changed</th>
                <th className="py-3 px-4">Previous Stock</th>
                <th className="py-3 px-4">Balance After</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map(mov => {
                const isPositive = mov.quantity > 0;
                return (
                  <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500">{mov.createdAt}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{mov.fuelType}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          mov.type === 'delivery'
                            ? 'bg-emerald-100 text-emerald-700'
                            : mov.type === 'sale'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-sm">
                      <span className={isPositive ? 'text-emerald-600' : 'text-slate-900'}>
                        {isPositive ? `+${mov.quantity.toLocaleString()}` : mov.quantity.toLocaleString()} L
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{mov.previousLevel.toLocaleString()} L</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{mov.newLevel.toLocaleString()} L</td>
                    <td className="py-3.5 px-4 font-mono text-blue-600 font-bold">{mov.referenceId}</td>
                    <td className="py-3.5 px-4 text-slate-500">{mov.note || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Stock Adjustment Modal */}
      {adjustModalOpen && (
        <Modal
          isOpen={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          title={language === 'so' ? 'Diiwaangeli Hagaajin Shidaal' : 'Manual Stock Adjustment'}
          subtitle={
            language === 'so'
              ? 'Wax ku dar ama ka jar haanta haddii uumi-bax, farqi dipstick ama tijaabo dhacday.'
              : 'Add or deduct litres for calibration, temperature drift, or evaporation.'
          }
          icon={<SlidersHorizontal className="w-5 h-5 text-blue-600" />}
          maxWidth="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {language === 'so' ? 'Dooro Haanta' : 'Select Tank'}
              </label>
              <CustomSelect
                value={selectedTankId}
                onChange={val => setSelectedTankId(val)}
                options={tanks.map(tank => ({
                  value: tank.id,
                  label: `${tank.tankNumber} — ${tank.name}`,
                  sublabel: `${language === 'so' ? 'Hadda ku jirta:' : 'Current:'} ${tank.currentLevel.toLocaleString()} L / ${tank.capacity.toLocaleString()} L`,
                  badge: `${Math.round((tank.currentLevel / tank.capacity) * 100)}%`,
                  badgeColor: tank.currentLevel <= tank.minThreshold ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }))}
                placeholder={language === 'so' ? 'Dooro Haanta...' : 'Select Tank...'}
              />
            </div>

            {/* Live calculation card */}
            {(() => {
              const currentTank = tanks.find(t => t.id === selectedTankId);
              const qty = parseFloat(adjustLitres) || 0;
              const newTotal = (currentTank?.currentLevel || 0) + qty;
              return currentTank ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium">{language === 'so' ? 'Heerka Hadda:' : 'Current Level:'}</span>
                    <p className="font-bold text-slate-900">{currentTank.currentLevel.toLocaleString()} L</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-medium">{language === 'so' ? 'Heerka Hagaajinta Kadib:' : 'Projected Level:'}</span>
                    <p className={`font-black text-sm ${qty < 0 ? 'text-amber-600' : qty > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {newTotal.toLocaleString()} L
                    </p>
                  </div>
                </div>
              ) : null;
            })()}

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {language === 'so' ? 'Tirada Litir (+ kordhi, - ka jar)' : 'Quantity in Litres (+ or -)'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={adjustLitres}
                onChange={e => setAdjustLitres(e.target.value)}
                placeholder="e.g. -25 ama +50"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-lg focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />

              {/* Quick Adjustment Pills */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-semibold">{language === 'so' ? 'Degdeg:' : 'Quick:'}</span>
                {[-50, -20, -10, 10, 20, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAdjustLitres(val.toString())}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                      val < 0
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {val > 0 ? `+${val} L` : `${val} L`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {language === 'so' ? 'Sababta Hagaajinta' : 'Reason / Justification'}
              </label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                placeholder="e.g. Uumi-bax ama farqi cabbir"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none mb-2"
              />

              {/* Quick Reason Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: language === 'so' ? 'Uumi-bax' : 'Evaporation', val: 'Uumi-bax maalinle ah (Evaporation)' },
                  { label: language === 'so' ? 'Farqi Dipstick' : 'Dipstick Variance', val: 'Farqi dipstick iyo cabbirka birta' },
                  { label: language === 'so' ? 'Tijaabo Bam' : 'Pump Calibration', val: 'Tijaabo bam (Pump test / Calibration)' },
                  { label: language === 'so' ? 'Daadasho' : 'Spillage', val: 'Khasaaro / Daadasho (Spillage)' }
                ].map(r => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setAdjustReason(r.val)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-semibold text-[10px] transition-colors"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                {language === 'so' ? 'Ka noqo' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!adjustLitres || parseFloat(adjustLitres) === 0}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
              >
                {language === 'so' ? 'Xaqiiji Hagaajinta' : 'Save Adjustment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
