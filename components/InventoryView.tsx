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
  AlertTriangle
} from 'lucide-react';
import { Tank, InventoryMovement, User } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface InventoryViewProps {
  tanks: Tank[];
  movements: InventoryMovement[];
  currentUser: User;
  language: Language;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  tanks,
  movements,
  currentUser,
  language
}) => {
  const t = translations[language];
  const [filterType, setFilterType] = useState<string>('all');

  // Sample seed movements if empty
  const displayMovements =
    movements.length > 0
      ? movements
      : [
          {
            id: 'mov_1',
            tankId: 't_1',
            fuelType: 'PMS',
            type: 'sale',
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
            type: 'sale',
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
            type: 'delivery',
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
            type: 'adjustment',
            quantity: 12,
            previousLevel: 8488,
            newLevel: 8500,
            referenceId: 'CALIB-0428',
            note: 'Dipstick calibration adjustment',
            createdAt: '28 Apr 2025'
          }
        ];

  const filtered = displayMovements.filter(m => (filterType === 'all' ? true : m.type === filterType));

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            <span>{t.inventory}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Dhaqdhaqaaqa shidaalka: iibka baxay, keenista soo gashay iyo saxidda dipstick-ga.'
              : 'End-to-end fuel stock ledger tracking every litre pumped, received or adjusted.'}
          </p>
        </div>
      </div>

      {/* Tank Quick Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tanks.map(tank => {
          const pct = Math.round((tank.currentLevel / tank.capacity) * 100);
          return (
            <div key={tank.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-800">{tank.name}</span>
                <span className="text-blue-600">{pct}%</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {tank.currentLevel.toLocaleString()} L
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Cap: {tank.capacity.toLocaleString()} L
              </div>
            </div>
          );
        })}
      </div>

      {/* Movements Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Stock Movement Ledger (Audit Verified)
          </h2>
          <div className="flex gap-2">
            {['all', 'sale', 'delivery', 'adjustment'].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  filterType === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
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
    </div>
  );
};
