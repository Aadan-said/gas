'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getInitialState,
  saveState,
  generateUUID,
  AppState
} from '@/lib/storage';
import {
  User,
  Sale,
  Tank,
  FuelDelivery,
  Customer,
  Expense,
  ExpenseCategory,
  UserRole,
  FuelTypeCode,
  PaymentMethod,
  NetworkMode,
  StationConfig
} from '@/lib/types';
import { translations, Language } from '@/lib/translations';

// Components
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/DashboardView';
import { SalesPOSView } from '@/components/SalesPOSView';
import { TanksView } from '@/components/TanksView';
import { InventoryView } from '@/components/InventoryView';
import { CustomersView } from '@/components/CustomersView';
import { FinanceView } from '@/components/FinanceView';
import { ReportsView } from '@/components/ReportsView';
import { StaffView } from '@/components/StaffView';
import { SyncEngineModal } from '@/components/SyncEngineModal';
import { SettingsView } from '@/components/SettingsView';
import { ReceiptModal } from '@/components/ReceiptModal';
import { LoginModal } from '@/components/LoginModal';
import {
  CheckCircle,
  AlertCircle,
  X,
  LayoutDashboard,
  Fuel,
  Database,
  BarChart3,
  Menu
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<AppState>(getInitialState);

  // UI state
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast system
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Hydrate stored state from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('gasflow_app_state_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        setState(prev => ({
          ...prev,
          ...parsed,
          currentUser: parsed.currentUser || prev.currentUser
        }));
      }
    } catch (e) {
      console.error('Error hydrating GasFlow state:', e);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('Service Worker registered:', reg.scope))
        .catch(err => console.log('Service Worker registration failed:', err));
    }
  }, []);

  // Auto-save state to localStorage on every change
  useEffect(() => {
    if (mounted) {
      saveState(state);
    }
  }, [state, mounted]);

  const currentUser = state.currentUser || state.users[0];
  const pendingSyncCount = state.syncEvents.filter(e => e.syncStatus === 'pending').length;

  // 1. Process Sale (Single atomic transaction)
  const handleProcessSale = (saleData: {
    fuelType: FuelTypeCode;
    tankId: string;
    litres: number;
    unitPrice: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    customerId?: string;
    customerName?: string;
  }) => {
    const saleId = `sale_${generateUUID()}`;
    const saleNumber = `GF-2025-${(state.sales.length + 1).toString().padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const newSale: Sale = {
      id: saleId,
      saleNumber,
      stationId: state.station.id,
      deviceId: state.activeDeviceId,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      fuelType: saleData.fuelType,
      tankId: saleData.tankId,
      litres: saleData.litres,
      unitPrice: saleData.unitPrice,
      totalAmount: saleData.totalAmount,
      paymentMethod: saleData.paymentMethod,
      paymentStatus: 'paid',
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      createdAt: timestamp,
      syncStatus: state.networkMode === 'cloud_online' ? 'synced' : 'pending_local'
    };

    // Update target tank level
    const updatedTanks = state.tanks.map(tank => {
      if (tank.id === saleData.tankId) {
        return {
          ...tank,
          currentLevel: Math.max(0, parseFloat((tank.currentLevel - saleData.litres).toFixed(2)))
        };
      }
      return tank;
    });

    // Update customer debt if credit
    const updatedCustomers = state.customers.map(cust => {
      if (saleData.customerId && cust.id === saleData.customerId) {
        return {
          ...cust,
          currentBalance: parseFloat((cust.currentBalance + saleData.totalAmount).toFixed(2))
        };
      }
      return cust;
    });

    // Add inventory movement
    const prevLevel = state.tanks.find(t => t.id === saleData.tankId)?.currentLevel || 0;
    const newMovement = {
      id: `mov_${generateUUID()}`,
      tankId: saleData.tankId,
      fuelType: saleData.fuelType,
      type: 'sale' as const,
      quantity: -saleData.litres,
      previousLevel: prevLevel,
      newLevel: prevLevel - saleData.litres,
      referenceId: saleNumber,
      note: `Dispensed to ${saleData.customerName || 'Walk-in'}`,
      createdAt: timestamp
    };

    // Add sync event
    const newSyncEvent = {
      eventId: generateUUID(),
      entityType: 'sale' as const,
      entityId: saleId,
      action: 'create' as const,
      deviceId: state.activeDeviceId,
      stationId: state.station.id,
      timestamp,
      syncStatus: state.networkMode === 'cloud_online' ? ('synced' as const) : ('pending' as const),
      retryCount: 0,
      payloadSummary: `Sale ${saleNumber} (${saleData.fuelType} ${saleData.litres}L - $${saleData.totalAmount})`
    };

    // Audit log
    const newAuditLog = {
      id: `log_${generateUUID()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'SALE_CREATE',
      details: `Created sale ${saleNumber}: ${saleData.fuelType} ${saleData.litres}L for $${saleData.totalAmount} (${saleData.paymentMethod.toUpperCase()})`,
      createdAt: timestamp
    };

    setState(prev => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      tanks: updatedTanks,
      customers: updatedCustomers,
      movements: [newMovement, ...prev.movements],
      syncEvents: [newSyncEvent, ...prev.syncEvents],
      auditLogs: [newAuditLog, ...prev.auditLogs]
    }));

    // Automatically display official receipt
    setSelectedReceiptSale(newSale);
    showToast(
      language === 'so'
        ? `Iibka ${saleNumber} waa la xaqiijiyay! ($${saleData.totalAmount.toFixed(2)})`
        : `Sale ${saleNumber} processed! ($${saleData.totalAmount.toFixed(2)})`
    );
  };

  // 2. Void Sale
  const handleVoidSale = (saleId: string, reason: string) => {
    const targetSale = state.sales.find(s => s.id === saleId);
    if (!targetSale || targetSale.paymentStatus === 'voided') return;

    const timestamp = new Date().toISOString();

    const updatedTanks = state.tanks.map(tank => {
      if (tank.id === targetSale.tankId) {
        return {
          ...tank,
          currentLevel: parseFloat((tank.currentLevel + targetSale.litres).toFixed(2))
        };
      }
      return tank;
    });

    const updatedCustomers = state.customers.map(cust => {
      if (targetSale.customerId && cust.id === targetSale.customerId) {
        return {
          ...cust,
          currentBalance: Math.max(0, parseFloat((cust.currentBalance - targetSale.totalAmount).toFixed(2)))
        };
      }
      return cust;
    });

    const updatedSales = state.sales.map(s => {
      if (s.id === saleId) {
        return {
          ...s,
          paymentStatus: 'voided' as const,
          voidReason: reason,
          voidedBy: currentUser.name,
          voidedAt: timestamp
        };
      }
      return s;
    });

    const newAuditLog = {
      id: `log_${generateUUID()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'SALE_VOID',
      details: `Voided sale ${targetSale.saleNumber} ($${targetSale.totalAmount}). Reason: ${reason}`,
      createdAt: timestamp
    };

    setState(prev => ({
      ...prev,
      sales: updatedSales,
      tanks: updatedTanks,
      customers: updatedCustomers,
      auditLogs: [newAuditLog, ...prev.auditLogs]
    }));

    showToast(`Transaction ${targetSale.saleNumber} voided and fuel stock restored.`, 'info');
  };

  // 3. Add Fuel Delivery
  const handleAddDelivery = (deliveryData: {
    tankId: string;
    fuelType: FuelTypeCode;
    litres: number;
    costPerLitre: number;
    totalCost: number;
    supplier: string;
    invoiceNumber: string;
    dipstickBefore: number;
    dipstickAfter: number;
  }) => {
    const deliveryId = `del_${generateUUID()}`;
    const timestamp = new Date().toISOString().split('T')[0];

    const newDelivery: FuelDelivery = {
      id: deliveryId,
      ...deliveryData,
      receivedBy: currentUser.name,
      receivedAt: timestamp
    };

    const updatedTanks = state.tanks.map(tank => {
      if (tank.id === deliveryData.tankId) {
        return {
          ...tank,
          currentLevel: Math.min(tank.capacity, tank.currentLevel + deliveryData.litres)
        };
      }
      return tank;
    });

    const prevLevel = state.tanks.find(t => t.id === deliveryData.tankId)?.currentLevel || 0;
    const newMovement = {
      id: `mov_${generateUUID()}`,
      tankId: deliveryData.tankId,
      fuelType: deliveryData.fuelType,
      type: 'delivery' as const,
      quantity: deliveryData.litres,
      previousLevel: deliveryData.dipstickBefore,
      newLevel: deliveryData.dipstickAfter,
      referenceId: deliveryData.invoiceNumber,
      note: `Received from ${deliveryData.supplier}`,
      createdAt: timestamp
    };

    const newAuditLog = {
      id: `log_${generateUUID()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'DELIVERY_RECEIVE',
      details: `Received ${deliveryData.litres}L ${deliveryData.fuelType} from ${deliveryData.supplier} ($${deliveryData.totalCost})`,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      deliveries: [newDelivery, ...prev.deliveries],
      tanks: updatedTanks,
      movements: [newMovement, ...prev.movements],
      auditLogs: [newAuditLog, ...prev.auditLogs]
    }));

    showToast(`Delivery of ${deliveryData.litres.toLocaleString()}L recorded into Tank.`);
  };

  // 4. Dipstick Calibration
  const handleCalibrateDipstick = (tankId: string, measuredLevel: number, notes: string) => {
    const targetTank = state.tanks.find(t => t.id === tankId);
    if (!targetTank) return;

    const diff = measuredLevel - targetTank.currentLevel;
    const timestamp = new Date().toISOString().split('T')[0];

    const updatedTanks = state.tanks.map(t => {
      if (t.id === tankId) {
        return { ...t, currentLevel: measuredLevel, lastCalibrated: timestamp };
      }
      return t;
    });

    const newMovement = {
      id: `mov_${generateUUID()}`,
      tankId,
      fuelType: targetTank.fuelType,
      type: 'adjustment' as const,
      quantity: diff,
      previousLevel: targetTank.currentLevel,
      newLevel: measuredLevel,
      referenceId: `CALIB-${Date.now().toString().slice(-4)}`,
      note: notes,
      createdAt: timestamp
    };

    const newAuditLog = {
      id: `log_${generateUUID()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'DIPSTICK_CALIBRATE',
      details: `Calibrated ${targetTank.name} from ${targetTank.currentLevel}L to ${measuredLevel}L (Variance: ${diff >= 0 ? '+' : ''}${diff}L)`,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      tanks: updatedTanks,
      movements: [newMovement, ...prev.movements],
      auditLogs: [newAuditLog, ...prev.auditLogs]
    }));

    showToast(`Dipstick calibrated: variance ${diff >= 0 ? '+' : ''}${diff}L adjusted.`);
  };

  // 5. Update Tank Price
  const handleUpdateTankPrice = (tankId: string, newPrice: number) => {
    const updatedTanks = state.tanks.map(t => {
      if (t.id === tankId) return { ...t, unitPrice: newPrice };
      return t;
    });

    setState(prev => ({
      ...prev,
      tanks: updatedTanks,
      auditLogs: [
        {
          id: `log_${generateUUID()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'PRICE_CHANGE',
          details: `Updated fuel price for tank ${tankId} to $${newPrice}/L`,
          createdAt: new Date().toISOString()
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Fuel price updated to $${newPrice.toFixed(2)}/L.`);
  };

  // 6. Customers & Payments
  const handleAddCustomer = (cData: { name: string; phone: string; company?: string; creditLimit: number }) => {
    const newCust: Customer = {
      id: `c_${Date.now()}`,
      ...cData,
      currentBalance: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setState(prev => ({ ...prev, customers: [newCust, ...prev.customers] }));
    showToast(`Customer ${cData.name} registered.`);
  };

  const handleRecordPayment = (pData: { customerId: string; amount: number; paymentMethod: PaymentMethod; reference?: string }) => {
    const targetCust = state.customers.find(c => c.id === pData.customerId);
    if (!targetCust) return;

    const updatedCustomers = state.customers.map(c => {
      if (c.id === pData.customerId) {
        return { ...c, currentBalance: Math.max(0, parseFloat((c.currentBalance - pData.amount).toFixed(2))) };
      }
      return c;
    });

    const newPayment = {
      id: `pay_${Date.now()}`,
      customerId: pData.customerId,
      customerName: targetCust.name,
      amount: pData.amount,
      paymentMethod: pData.paymentMethod,
      reference: pData.reference,
      collectedBy: currentUser.name,
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      customers: updatedCustomers,
      customerPayments: [newPayment, ...prev.customerPayments]
    }));
    showToast(`Payment of $${pData.amount.toFixed(2)} collected from ${targetCust.name}.`);
  };

  // 7. Expenses
  const handleAddExpense = (expData: { category: ExpenseCategory; description: string; amount: number; receiptNumber?: string }) => {
    const newExp: Expense = {
      id: `exp_${Date.now()}`,
      ...expData,
      addedBy: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setState(prev => ({ ...prev, expenses: [newExp, ...prev.expenses] }));
    showToast(`Expense of $${expData.amount.toFixed(2)} recorded.`);
  };

  // 8. Staff & Roles
  const handleAddUser = (uData: { name: string; email: string; role: UserRole; pin: string }) => {
    const newUser: User = {
      id: `u_${Date.now()}`,
      ...uData,
      status: 'active',
      lastLogin: 'Never'
    };

    setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
    showToast(`Staff account created for ${uData.name}.`);
  };

  const handleToggleUserStatus = (userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.id === userId) {
          return { ...u, status: (u.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' };
        }
        return u;
      })
    }));
  };

  // 9. Sync Engine
  const handleTriggerSync = () => {
    setState(prev => ({
      ...prev,
      syncEvents: prev.syncEvents.map(evt => ({ ...evt, syncStatus: 'synced' as const })),
      sales: prev.sales.map(s => ({ ...s, syncStatus: 'synced' as const }))
    }));

    showToast('Replication complete! All outbox events committed to PostgreSQL.');
  };

  // 10. Settings & Backup/Restore
  const handleUpdateStation = (st: StationConfig) => {
    setState(prev => ({ ...prev, station: st }));
    showToast('Station profile updated.');
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GasFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      setState(parsed);
      showToast('Database snapshot restored.');
    } catch {
      showToast('Failed to import backup file.', 'error');
    }
  };

  const handleResetData = () => {
    import('@/lib/storage').then(({ INITIAL_STATION, INITIAL_USERS, INITIAL_TANKS, INITIAL_SALES, INITIAL_DELIVERIES, INITIAL_CUSTOMERS, INITIAL_EXPENSES, INITIAL_SYNC_EVENTS }) => {
      setState({
        station: INITIAL_STATION,
        currentUser: INITIAL_USERS[0],
        users: INITIAL_USERS,
        tanks: INITIAL_TANKS,
        sales: INITIAL_SALES,
        deliveries: INITIAL_DELIVERIES,
        movements: [],
        customers: INITIAL_CUSTOMERS,
        customerPayments: [],
        expenses: INITIAL_EXPENSES,
        auditLogs: [],
        syncEvents: INITIAL_SYNC_EVENTS,
        networkMode: 'cloud_online',
        activeDeviceId: 'DEV-POS-01'
      });
      showToast('All data reset to factory defaults.', 'info');
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">GasFlow</div>
            <div className="text-xs text-slate-500 mt-0.5">Initializing station system...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900 flex flex-col font-sans">
      {/* Toast Stack */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="toast pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[260px] max-w-[400px] bg-white border border-slate-200 rounded-xl shadow-lg"
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toast.type === 'error'   && <AlertCircle  className="w-4 h-4 text-rose-600 shrink-0" />}
            {toast.type === 'info'    && <AlertCircle  className="w-4 h-4 text-blue-600 shrink-0" />}
            <span className="text-xs font-semibold text-slate-800 flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div className="flex flex-1 min-h-screen">
        {/* Universal Responsive Sidebar (desktop sticky & mobile slide-over) */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          networkMode={state.networkMode}
          userRole={currentUser.role}
          language={language}
          pendingSyncCount={pendingSyncCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Universal Header */}
          <Header
            currentUser={currentUser}
            onUserChange={u => setState(prev => ({ ...prev, currentUser: u }))}
            users={state.users}
            networkMode={state.networkMode}
            onNetworkModeChange={m => setState(prev => ({ ...prev, networkMode: m }))}
            language={language}
            onLanguageChange={setLanguage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          />

          {/* Active View */}
          <main className="flex-1 p-3.5 sm:p-5 lg:p-6 pb-24 lg:pb-8 overflow-y-auto">
            {currentView === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                sales={state.sales}
                tanks={state.tanks}
                language={language}
                onNavigate={setCurrentView}
                onSelectSaleReceipt={setSelectedReceiptSale}
              />
            )}

            {currentView === 'sales' && (
              <SalesPOSView
                tanks={state.tanks}
                customers={state.customers}
                currentUser={currentUser}
                sales={state.sales}
                language={language}
                onProcessSale={handleProcessSale}
                onVoidSale={handleVoidSale}
                onViewReceipt={setSelectedReceiptSale}
              />
            )}

            {currentView === 'tanks' && (
              <TanksView
                tanks={state.tanks}
                deliveries={state.deliveries}
                currentUser={currentUser}
                language={language}
                onAddDelivery={handleAddDelivery}
                onCalibrateDipstick={handleCalibrateDipstick}
                onUpdateTankPrice={handleUpdateTankPrice}
              />
            )}

            {currentView === 'inventory' && (
              <InventoryView
                tanks={state.tanks}
                movements={state.movements}
                currentUser={currentUser}
                language={language}
              />
            )}

            {currentView === 'customers' && (
              <CustomersView
                customers={state.customers}
                payments={state.customerPayments}
                currentUser={currentUser}
                language={language}
                onAddCustomer={handleAddCustomer}
                onRecordPayment={handleRecordPayment}
              />
            )}

            {currentView === 'finance' && (
              <FinanceView
                expenses={state.expenses}
                sales={state.sales}
                customers={state.customers}
                currentUser={currentUser}
                language={language}
                onAddExpense={handleAddExpense}
              />
            )}

            {currentView === 'reports' && (
              <ReportsView
                sales={state.sales}
                tanks={state.tanks}
                expenses={state.expenses}
                customers={state.customers}
                auditLogs={state.auditLogs}
                language={language}
              />
            )}

            {currentView === 'staff' && (
              <StaffView
                users={state.users}
                currentUser={currentUser}
                language={language}
                onAddUser={handleAddUser}
                onToggleUserStatus={handleToggleUserStatus}
              />
            )}

            {currentView === 'sync' && (
              <SyncEngineModal
                syncEvents={state.syncEvents}
                networkMode={state.networkMode}
                onNetworkModeChange={m => setState(prev => ({ ...prev, networkMode: m }))}
                onTriggerSync={handleTriggerSync}
                language={language}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView
                station={state.station}
                currentUser={currentUser}
                language={language}
                onUpdateStation={handleUpdateStation}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onResetData={handleResetData}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Screen < lg) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E2E6EF] px-2 py-1.5 flex items-center justify-around shadow-lg lg:hidden"
      >
        {[
          { id: 'dashboard', label: language === 'so' ? 'Hoyga' : 'Home', icon: LayoutDashboard },
          { id: 'sales',     label: language === 'so' ? 'Iibka' : 'Sales', icon: Fuel },
          { id: 'tanks',     label: language === 'so' ? 'Haamaha' : 'Tanks', icon: Database },
          { id: 'reports',   label: language === 'so' ? 'Warbixin' : 'Reports', icon: BarChart3 },
          { id: 'menu',      label: language === 'so' ? 'Wax kale' : 'Menu', icon: Menu, isMenuButton: true }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.isMenuButton) {
                  setIsMobileMenuOpen(true);
                } else {
                  setCurrentView(tab.id);
                }
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isActive && !tab.isMenuButton
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Receipt Modal */}
      {selectedReceiptSale && (
        <ReceiptModal
          sale={selectedReceiptSale}
          station={state.station}
          language={language}
          onClose={() => setSelectedReceiptSale(null)}
          onNewSale={() => {
            setSelectedReceiptSale(null);
            setCurrentView('sales');
          }}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          users={state.users}
          onLogin={u => {
            setState(prev => ({ ...prev, currentUser: u }));
            setShowLoginModal(false);
          }}
          language={language}
        />
      )}
    </div>
  );
}
