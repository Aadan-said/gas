'use client';

import React, { useState } from 'react';
import {
  RefreshCw,
  Server,
  Cloud,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  Wifi,
  WifiOff,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Zap,
  HardDrive
} from 'lucide-react';
import { SyncEvent, NetworkMode } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface SyncEngineModalProps {
  syncEvents: SyncEvent[];
  networkMode: NetworkMode;
  onNetworkModeChange: (mode: NetworkMode) => void;
  onTriggerSync: () => void;
  language: Language;
}

export const SyncEngineModal: React.FC<SyncEngineModalProps> = ({
  syncEvents,
  networkMode,
  onNetworkModeChange,
  onTriggerSync,
  language
}) => {
  const t = translations[language];
  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onTriggerSync();
      setIsSyncing(false);
    }, 1200);
  };

  const pendingEvents = syncEvents.filter(e => e.syncStatus === 'pending');
  const syncedEvents = syncEvents.filter(e => e.syncStatus === 'synced');

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <RefreshCw className={`w-6 h-6 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{t.syncEngine}</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Local Station Server (PostgreSQL) ↔ Central Cloud ↔ Qalabka (IndexedDB Outbox).'
              : 'Production 3-tier sync architecture: Local Station Server, Cloud PostgreSQL & IndexedDB Outbox.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing...' : t.forceSync}</span>
          </button>
        </div>
      </div>

      {/* 3-Tier Architecture Visualization */}
      <div className="bg-gradient-to-br from-white via-slate-50/60 to-blue-50/40 p-6 rounded-3xl border border-slate-200/90 text-slate-900 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
            Production Distributed Topology (6-15 Devices per Station)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Tier 1: Client Devices */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-48">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-600 uppercase">Tier 1: Clients</span>
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">6-15 Multi-Devices</h3>
                <p className="text-xs text-slate-500 mt-1">
                  PWA Browsers, Tablets & Mobile Phones. Local writes persist to <b className="text-slate-800">IndexedDB</b> instantly.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Zero Latency Offline Outbox</span>
              </div>
            </div>

            {/* Tier 2: Local Station Server */}
            <div className="bg-white p-5 rounded-2xl border-2 border-blue-500 shadow-md shadow-blue-500/10 flex flex-col justify-between h-48 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                Station Gateway
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-600 uppercase">Tier 2: On-Prem</span>
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Local Station Server</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Local PostgreSQL + Fast LAN API. Operates full station when Internet cuts off.
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>LAN / Wi-Fi Sync Engine</span>
                <span className="text-blue-600 font-semibold">UUID Deduplication</span>
              </div>
            </div>

            {/* Tier 3: Central Cloud Server */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-48">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-600 uppercase">Tier 3: Cloud</span>
                <Cloud className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Central Cloud Server</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Central PostgreSQL, headquarters multi-branch reporting & encrypted remote backups.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>Automated Replicas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Scenario Simulator Buttons */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Simulate Operating Scenarios from Requirements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => onNetworkModeChange('cloud_online')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              networkMode === 'cloud_online'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs text-emerald-800 mb-1">
              <span>Scenario 1: Full Connection</span>
              <Wifi className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-600">
              Internet & LAN active. Live replication to local server and central cloud.
            </p>
          </button>

          <button
            onClick={() => onNetworkModeChange('lan_only')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              networkMode === 'lan_only'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs text-amber-800 mb-1">
              <span>Scenario 2: Internet Cut / LAN Active</span>
              <Radio className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[11px] text-slate-600">
              Station computers & tablets share stock and sales via on-premise Local Station Server.
            </p>
          </button>

          <button
            onClick={() => onNetworkModeChange('offline_pwa')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
              networkMode === 'offline_pwa'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs text-rose-800 mb-1">
              <span>Scenario 3: Internet & LAN Both Down</span>
              <WifiOff className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-[11px] text-slate-600">
              Phones & computers queue sales into IndexedDB with UUIDs, syncing when LAN/Net returns.
            </p>
          </button>
        </div>
      </div>

      {/* Outbox Queue Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              IndexedDB Local Outbox & Sync Ledger ({syncEvents.length} Events)
            </h2>
            <p className="text-xs text-slate-400">
              Immutable UUID events, schema versioning, retry counts and conflict resolution.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg">
              {syncedEvents.length} Synced
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg">
              {pendingEvents.length} Pending
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Event UUID</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Device ID</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Retries</th>
                <th className="py-3 px-4">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium font-mono">
              {syncEvents.map(evt => (
                <tr key={evt.eventId} className="hover:bg-slate-50/60 font-sans">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 text-[11px]">
                    {evt.eventId}
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-700">
                    {evt.entityType}
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-600">
                    {evt.action}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    {evt.deviceId}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium">
                    {evt.payloadSummary}
                  </td>
                  <td className="py-3.5 px-4 font-mono">{evt.retryCount}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        evt.syncStatus === 'synced'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {evt.syncStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
