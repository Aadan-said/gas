'use client';

import React, { useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  Building,
  DollarSign,
  HardDrive,
  FileJson
} from 'lucide-react';
import { StationConfig, User } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface SettingsViewProps {
  station: StationConfig;
  currentUser: User;
  language: Language;
  onUpdateStation: (station: StationConfig) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonString: string) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  station,
  currentUser,
  language,
  onUpdateStation,
  onExportBackup,
  onImportBackup,
  onResetData
}) => {
  const t = translations[language];

  const [name, setName] = useState(station.name);
  const [branch, setBranch] = useState(station.branch);
  const [address, setAddress] = useState(station.address);
  const [phone, setPhone] = useState(station.phone);
  const [currency, setCurrency] = useState(station.currency);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupJsonInput, setBackupJsonInput] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStation({
      ...station,
      name,
      branch,
      address,
      phone,
      currency
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleImportSubmit = () => {
    if (!backupJsonInput.trim()) return;
    try {
      onImportBackup(backupJsonInput);
      setBackupJsonInput('');
      alert('Backup restored successfully!');
    } catch (e) {
      alert('Invalid backup JSON format!');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>{t.settings}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Xogta saldhigga, lacagta, kaydka JSON iyo dib-u-habeynta xogta.'
              : 'Station profile, tax rates, JSON disaster backups and database reset.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Station Profile (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Station Identity & Location</h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Station Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#ECEEF2] bg-[#F8F9FA] focus:bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch / Location</label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#ECEEF2] bg-[#F8F9FA] focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#ECEEF2] bg-[#F8F9FA] focus:bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Station Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#ECEEF2] bg-[#F8F9FA] focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Support Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#ECEEF2] bg-[#F8F9FA] focus:bg-white font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-emerald-600 font-bold text-xs">
                  Settings saved successfully!
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="btn-primary"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Station Details</span>
              </button>
            </div>
          </form>
        </div>

        {/* Backups & Maintenance (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Backup Download */}
          <div className="bg-white p-6 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">Database Backup & Recovery</h2>
            <p className="text-xs text-slate-500">
              Download complete local JSON snapshot for offline archival and off-site cloud retention.
            </p>

            <button
              onClick={onExportBackup}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Download Full JSON Backup</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="bg-white p-6 rounded-2xl border border-[#ECEEF2] shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Restore from JSON</h2>
            <textarea
              value={backupJsonInput}
              onChange={e => setBackupJsonInput(e.target.value)}
              placeholder="Paste exported backup JSON here..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-mono h-20 focus:outline-none focus:bg-white"
            />
            <button
              onClick={handleImportSubmit}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Backup</span>
            </button>
          </div>

          {/* Factory Reset */}
          <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200/80 shadow-xs space-y-2">
            <h2 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Factory Reset Database</span>
            </h2>
            <p className="text-[11px] text-rose-700/80">
              Resets all sales, deliveries and expenses back to initial seed state.
            </p>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all station data to initial defaults?')) {
                  onResetData();
                }
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
