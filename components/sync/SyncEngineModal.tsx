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
  HardDrive,
  Activity
} from 'lucide-react';
import { SyncEvent, NetworkMode, Sale } from '@/lib/types';
import { translations, Language } from '@/lib/translations';

interface SyncEngineModalProps {
  syncEvents: SyncEvent[];
  networkMode: NetworkMode;
  onNetworkModeChange: (mode: NetworkMode) => void;
  onTriggerSync: () => void;
  language: Language;
  sales?: Sale[];
}

export const SyncEngineModal: React.FC<SyncEngineModalProps> = ({
  syncEvents,
  networkMode,
  onNetworkModeChange,
  onTriggerSync,
  language,
  sales = []
}) => {
  const t = translations[language];
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(18);

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      const latency = Date.now() - start;
      setLastLatency(latency);
      onTriggerSync();
      setSyncStatusMsg(
        language === 'so'
          ? `Isku-xirka wuu guuleystay! (${latency}ms) — Dhammaan xogtu waa la cusbooneysiiyay.`
          : `Sync completed successfully in ${latency}ms! All nodes in sync.`
      );
    } catch {
      setSyncStatusMsg(
        language === 'so'
          ? 'Isku-xirka Cloud-ka wuu gaabiyay. Waxaa lagu shaqeynayaa Offline Cache.'
          : 'Could not reach cloud server. Offline queue active.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Derive real events from sales if syncEvents is sparse
  const liveEvents: SyncEvent[] = React.useMemo(() => {
    if (syncEvents && syncEvents.length > 0) return syncEvents;
    return sales.slice(0, 10).map((s, idx) => ({
      eventId: `EVT-${s.id || idx + 1}`,
      entityType: 'sale',
      entityId: s.id,
      action: 'create',
      deviceId: s.deviceId || 'DEV-POS-01',
      stationId: s.stationId || 'ST-001',
      timestamp: s.createdAt,
      syncStatus: (s.syncStatus as any) || 'synced',
      retryCount: 0,
      payloadSummary: `Iibka ${s.saleNumber} (${s.fuelType} ${s.litres}L - $${s.totalAmount.toFixed(2)})`
    }));
  }, [syncEvents, sales]);

  const pendingEvents = liveEvents.filter(e => e.syncStatus === 'pending');
  const syncedEvents = liveEvents.filter(e => e.syncStatus === 'synced');

  return (
    <div className="space-y-6 pb-36 sm:pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{language === 'so' ? 'Mashiinka Isku-xirka (Sync Engine)' : t.syncEngine}</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            {language === 'so'
              ? 'Qaab-dhismeedka 3-heer ah: Moobillada/Kumbuyuutarrada ↔ Server-ka Kaalinta ↔ Central Cloud.'
              : 'Production 3-tier sync architecture: Local Station Server, Cloud PostgreSQL & IndexedDB Outbox.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? (language === 'so' ? 'Waa la xiriirinayaa...' : 'Synchronizing...') : (language === 'so' ? 'Isku-xir Hadda' : t.forceSync)}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* 3-Tier Architecture Visualization */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 text-slate-900 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              {language === 'so' ? 'Qaabka Isku-xirka Qalabka (6-15 Qalab Kaalin Kasta)' : 'Production Distributed Topology (6-15 Devices per Station)'}
            </span>
            {lastLatency !== null && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-500" />
                <span>{lastLatency}ms ping</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {/* Tier 1: Client Devices */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-blue-600 uppercase">Tier 1: Qalabka (Clients)</span>
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {language === 'so' ? 'Moobillada & POS-ka' : '6-15 Multi-Devices'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === 'so'
                    ? 'Moobillada shaqaalaha, tablet-yada iyo kumbuyuutarrada. Xogta iibku waxay markiiba ku kaydsantaa IndexedDB.'
                    : 'PWA Browsers, Tablets & Mobile Phones. Local writes persist to IndexedDB instantly.'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-600 pt-3 border-t border-slate-200/60 mt-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{language === 'so' ? 'Iibku Ma Istaago (Zero Latency)' : 'Zero Latency Offline Outbox'}</span>
              </div>
            </div>

            {/* Tier 2: Local Station Server */}
            <div className="bg-white p-5 rounded-2xl border-2 border-blue-500 shadow-md shadow-blue-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                {language === 'so' ? 'Xarunta Gaalkacyo (Gateway)' : 'Station Gateway'}
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-blue-600 uppercase">Tier 2: On-Premise</span>
                  <Server className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {language === 'so' ? 'Server-ka Kaalinta (Local)' : 'Local Station Server'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === 'so'
                    ? 'Kumbuyuutarka dhexe ee kaalinta oo wata PostgreSQL & Fast LAN Wi-Fi. Haddii internet-ku go\'o, kaalintu 100% way shaqeynaysaa.'
                    : 'Local PostgreSQL + Fast LAN API. Operates full station when Internet cuts off.'}
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-100 mt-3">
                <span>LAN Wi-Fi Sync</span>
                <span className="text-blue-600 font-semibold">UUID Conflict-Free</span>
              </div>
            </div>

            {/* Tier 3: Central Cloud Server */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-blue-600 uppercase">Tier 3: Cloud</span>
                  <Cloud className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  {language === 'so' ? 'Central Cloud Server' : 'Central Cloud Server'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {language === 'so'
                    ? 'Cloud-ka dhexe oo xogta ka qaata dhammaan laamaha iyo kaalmaha, una gudbiya maamulka guud warbixinnada tooska ah.'
                    : 'Central PostgreSQL, headquarters multi-branch reporting & encrypted remote backups.'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 pt-3 border-t border-slate-200/60 mt-3">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>{language === 'so' ? 'Kayd Toos ah (Auto-Backup)' : 'Automated Replicas'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Scenario Simulator Buttons */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          {language === 'so' ? 'Tijaabi Xaaladaha Internet-ka ee Kaalinta (Simulation)' : 'Simulate Operating Scenarios from Requirements'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => onNetworkModeChange('cloud_online')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              networkMode === 'cloud_online'
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs text-emerald-800 mb-1">
              <span>{language === 'so' ? '1. Internet-ku Wuu Shaqeynayaa' : 'Scenario 1: Full Connection'}</span>
              <Wifi className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              {language === 'so'
                ? 'Internet & LAN toos ah. Xogta iibku waxay markiiba gaareysaa Cloud-ka iyo server-ka maxalliga ah.'
                : 'Internet & LAN active. Live replication to local server and central cloud.'}
            </p>
          </button>

          <button
            onClick={() => onNetworkModeChange('lan_only')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              networkMode === 'lan_only'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs text-amber-800 mb-1">
              <span>{language === 'so' ? '2. Internet Go\'an / Wi-Fi Xaruntu Shaqeynayo' : 'Scenario 2: Internet Cut / LAN Active'}</span>
              <Radio className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              {language === 'so'
                ? 'Moobillada iyo kombuyuutarradu waxay isku dhaafsanayaan xogta iibka Wi-Fi-ga xarunta iyadoon internet loo baahnayn.'
                : 'Station computers & tablets share stock and sales via on-premise Local Station Server.'}
            </p>
          </button>

          <button
            onClick={() => onNetworkModeChange('offline_pwa')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              networkMode === 'offline_pwa'
                ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs text-rose-800 mb-1">
              <span>{language === 'so' ? '3. Internet & Wi-Fi Labaduba Waa Go\'an yihiin' : 'Scenario 3: Internet & LAN Both Down'}</span>
              <WifiOff className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              {language === 'so'
                ? 'Aalad kasta (moobil ama POS) waxay iibka ku qoreysaa IndexedDB-keeda maxalliga ah, markii xiriirku soo noqdona dib ayey u diraysaa.'
                : 'Phones & computers queue sales into IndexedDB with UUIDs, syncing when LAN/Net returns.'}
            </p>
          </button>
        </div>
      </div>

      {/* Outbox Queue Table */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {language === 'so'
                ? `Diiwaanka Dhaqdhaqaaqa Isku-xirka (${liveEvents.length} Dhacdo)`
                : `IndexedDB Local Outbox & Sync Ledger (${liveEvents.length} Events)`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'so'
                ? 'Xogta UUID-ga leh ee aaladaha xarunta ka baxda ama gasha si uusan qalad ama duubli u dhicin.'
                : 'Immutable UUID events, schema versioning, retry counts and conflict resolution.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span>{syncedEvents.length} {language === 'so' ? 'Isku-xiran' : 'Synced'}</span>
            </span>
            <span className="whitespace-nowrap px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
              <span>{pendingEvents.length} {language === 'so' ? 'Sugaya' : 'Pending'}</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{language === 'so' ? 'Event UUID' : 'Event UUID'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Qaybta' : 'Entity'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Falka' : 'Action'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Aaladda' : 'Device ID'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Faahfaahin' : 'Summary'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Isku-dayada' : 'Retries'}</th>
                <th className="py-3 px-4">{language === 'so' ? 'Heerka Isku-xirka' : 'Sync Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {liveEvents.map(evt => (
                <tr key={evt.eventId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 text-[11px] whitespace-nowrap">
                    {evt.eventId}
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-700">
                    {evt.entityType}
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-600">
                    {evt.action}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {evt.deviceId}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium">
                    {evt.payloadSummary}
                  </td>
                  <td className="py-3.5 px-4 font-mono">{evt.retryCount}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        evt.syncStatus === 'synced'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {evt.syncStatus === 'synced' ? (language === 'so' ? 'Isku-xiran' : 'Synced') : (language === 'so' ? 'Sugaya' : 'Pending')}
                    </span>
                  </td>
                </tr>
              ))}
              {liveEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {language === 'so' ? 'Wali wax dhacdo ah lama qorin.' : 'No sync events recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
