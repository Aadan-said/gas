'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getInitialState,
  saveState,
  generateUUID,
  emptyAppState,
  getDeviceId,
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
import {
  apiLogin,
  apiLogout,
  apiRegister,
  apiGetMe,
  apiGetState,
  apiCreateSale,
  apiVoidSale,
  apiRecordDelivery,
  apiCalibrateTank,
  apiUpdateTankPrice,
  apiAddCustomer,
  apiRecordPayment,
  apiAddExpense,
  apiToggleUserStatus,
  apiUpdateStation
} from '@/lib/api';

// Modular Enterprise Architecture Components
import { AuthPortal, LoginModal } from '@/components/auth';
import { Sidebar, Header, ToastContainer } from '@/components/layout';
import { DashboardView } from '@/components/dashboard';
import { SalesPOSView, ReceiptModal } from '@/components/sales';
import { TanksView } from '@/components/tanks';
import { InventoryView } from '@/components/inventory';
import { CustomersView } from '@/components/customers';
import { FinanceView } from '@/components/finance';
import { ReportsView } from '@/components/reports';
import { StaffView } from '@/components/staff';
import { SyncEngineModal } from '@/components/sync';
import { SettingsView } from '@/components/settings';
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
  const [language, setLanguage] = useState<Language>('so');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'forgot' | '2fa'>('login');

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

  const applyServerState = useCallback((serverState: Record<string, unknown>, user?: User | null) => {
    setState(prev => ({
      ...prev,
      station: (serverState.station as StationConfig) || prev.station,
      users: (serverState.users as User[]) || [],
      tanks: (serverState.tanks as Tank[]) || [],
      sales: (serverState.sales as Sale[]) || [],
      deliveries: (serverState.deliveries as FuelDelivery[]) || [],
      movements: (serverState.movements as AppState['movements']) || [],
      customers: (serverState.customers as Customer[]) || [],
      customerPayments: (serverState.customerPayments as AppState['customerPayments']) || [],
      expenses: (serverState.expenses as Expense[]) || [],
      auditLogs: (serverState.auditLogs as AppState['auditLogs']) || [],
      currentUser: user === undefined ? prev.currentUser : user ?? prev.currentUser,
      networkMode: 'cloud_online',
      activeDeviceId: getDeviceId()
    }));
  }, []);

  const refreshStationState = useCallback(async (user?: User | null) => {
    const res = await apiGetState();
    if (res.data?.success && res.data.state) {
      applyServerState(res.data.state, user);
      return true;
    }
    return false;
  }, [applyServerState]);

  // Restore session, then keep this device in sync with the station server
  useEffect(() => {
    setMounted(true);
    setState(prev => ({ ...prev, activeDeviceId: getDeviceId() }));

    apiGetMe().then(async res => {
      const authData = res.data;
      if (authData && authData.authenticated && authData.user) {
        const u = authData.user;
        setIsAuthenticated(true);
        await refreshStationState(u);
      } else {
        setIsAuthenticated(false);
        setState(emptyAppState());
      }
    }).catch(() => {
      setIsAuthenticated(false);
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('Service Worker registered:', reg.scope))
        .catch(err => console.log('Service Worker registration failed:', err));
    }
  }, [refreshStationState]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const tick = () => {
      refreshStationState().catch(() => {});
    };
    const interval = setInterval(tick, 8000);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated, refreshStationState]);

  // Auto-save state to localStorage on every change
  useEffect(() => {
    if (mounted) {
      saveState(state);
    }
  }, [state, mounted]);

  const currentUser: User = state.currentUser || {
    id: 'guest',
    name: 'Operator',
    email: 'operator@gasflow.so',
    role: 'cashier',
    pin: '****',
    status: 'active'
  };
  const pendingSyncCount = state.syncEvents.filter(e => e.syncStatus === 'pending').length;

  // 0. Authentication Handlers
  const handleLogin = (user: User) => {
    setIsAuthenticated(true);
    setState(prev => ({ ...prev, currentUser: user, activeDeviceId: getDeviceId() }));
    refreshStationState(user).catch(() => {});
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gasflow_session_active', 'true');
    }
    setCurrentView(user.role === 'cashier' ? 'sales' : 'dashboard');
    showToast(
      language === 'so'
        ? `Ku soo dhowow GasFlow, ${user.name} (${user.role.toUpperCase()})!`
        : `Welcome to GasFlow, ${user.name}!`,
      'success'
    );
  };

  const handleRegister = async (newUser: User) => {
    const { data, error } = await apiRegister({
      name: newUser.name,
      username: newUser.username ?? newUser.email,
      email: newUser.email,
      password: newUser.pin,
      pin: newUser.pin,
      role: newUser.role,
      phone: newUser.phone,
      branch: newUser.branch,
    });

    if (error || !data?.success) {
      showToast(error || 'Failed to create staff account.', 'error');
      return;
    }

    const registeredUser = data.user;

    setState(prev => ({
      ...prev,
      users: [registeredUser, ...prev.users],
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          action: 'USER_REGISTERED',
          details: `New account created: ${registeredUser.name} (${registeredUser.role.toUpperCase()})`,
          createdAt: new Date().toISOString()
        },
        ...prev.auditLogs
      ]
    }));
    showToast(
      language === 'so'
        ? `Akoon cusub waa la sameeyay: ${registeredUser.name}`
        : `Account created successfully: ${registeredUser.name}`,
      'success'
    );
  };

  const handleLogout = async () => {
    await apiLogout();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gasflow_session_active');
    }
    setState(emptyAppState());
    setIsAuthenticated(false);
    setAuthInitialMode('login');
    setCurrentView('dashboard');
    showToast(
      language === 'so' ? 'Waad ka baxday nidaamka GasFlow. Saldhigga waa la quflay.' : 'You have signed out of GasFlow. Station locked.',
      'info'
    );
  };

  // 1. Process Sale (Single atomic transaction)
  const handleProcessSale = async (saleData: {
    fuelType: FuelTypeCode;
    tankId: string;
    litres: number;
    unitPrice: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    customerId?: string;
    customerName?: string;
  }) => {
    const { data, error } = await apiCreateSale({
      fuelType: saleData.fuelType,
      tankId: saleData.tankId,
      litres: saleData.litres,
      unitPrice: saleData.unitPrice,
      totalAmount: saleData.totalAmount,
      paymentMethod: saleData.paymentMethod,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      deviceId: getDeviceId()
    });

    if (error || !data?.success) {
      showToast(error || 'Failed to process sale.', 'error');
      return;
    }

    const createdSale = data.sale as Sale;
    const effectiveTotal = (data as { totalAmount?: number }).totalAmount ?? saleData.totalAmount;
    await refreshStationState();

    // Automatically display official receipt
    setSelectedReceiptSale(createdSale);
    showToast(
      language === 'so'
        ? `Iibka ${createdSale.saleNumber} waa la xaqiijiyay! ($${effectiveTotal.toFixed(2)})`
        : `Sale ${createdSale.saleNumber} processed! ($${effectiveTotal.toFixed(2)})`
    );
  };

  // 2. Void Sale
  const handleVoidSale = async (saleId: string, reason: string) => {
    const targetSale = state.sales.find(s => s.id === saleId);
    if (!targetSale) {
      showToast('Iibka la doortay ma jiro.', 'error');
      return;
    }

    const { data, error } = await apiVoidSale(saleId, reason);
    if (error || !data?.success) {
      showToast(error || 'Failed to void sale.', 'error');
      return;
    }

    await refreshStationState();

    showToast(
      language === 'so'
        ? `Iibka ${targetSale.saleNumber} waa la baab'iyay. Shidaalkiina dib baa loogu celiyay haanta.`
        : `Sale ${targetSale.saleNumber} voided. Stock restored to tank.`,
      'info'
    );
  };

  // 3. Add Fuel Delivery
  const handleAddDelivery = async (deliveryData: {
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
    const { data, error } = await apiRecordDelivery(deliveryData.tankId, {
      litres: deliveryData.litres,
      costPerLitre: deliveryData.costPerLitre,
      totalCost: deliveryData.totalCost,
      supplier: deliveryData.supplier,
      invoiceNumber: deliveryData.invoiceNumber,
      dipstickBefore: deliveryData.dipstickBefore,
      dipstickAfter: deliveryData.dipstickAfter
    });

    if (error || !data?.success) {
      showToast(error || 'Failed to record delivery on server.', 'error');
      return;
    }

    await refreshStationState();

    showToast(`Delivery of ${deliveryData.litres.toLocaleString()}L recorded into Tank.`);
  };

  // 4. Dipstick Calibration
  const handleCalibrateDipstick = async (tankId: string, measuredLevel: number, notes: string) => {
    const targetTank = state.tanks.find(t => t.id === tankId);
    if (!targetTank) return;

    const { data, error } = await apiCalibrateTank(tankId, measuredLevel, notes);
    if (error || !data?.success) {
      showToast(error || 'Failed to calibrate dipstick on server.', 'error');
      return;
    }

    const diff = measuredLevel - targetTank.currentLevel;
    await refreshStationState();

    showToast(`Dipstick calibrated: variance ${diff >= 0 ? '+' : ''}${diff}L adjusted.`);
  };

  // 4b. Manual Stock Adjustment
  const handleStockAdjustment = async (adj: { tankId: string; quantity: number; reason: string }) => {
    const targetTank = state.tanks.find(t => t.id === adj.tankId);
    if (!targetTank) return;
    const newLevel = Math.max(0, parseFloat((targetTank.currentLevel + adj.quantity).toFixed(2)));
    const { data, error } = await apiCalibrateTank(adj.tankId, newLevel, adj.reason);
    if (error || !data?.success) {
      showToast(error || 'Failed to adjust stock on server.', 'error');
      return;
    }
    await refreshStationState();

    showToast(`Stock adjustment of ${adj.quantity >= 0 ? '+' : ''}${adj.quantity}L applied to ${targetTank.name}.`);
  };

  // 5. Update Tank Price
  const handleUpdateTankPrice = async (tankId: string, newPrice: number) => {
    const { data, error } = await apiUpdateTankPrice(tankId, newPrice);
    if (error || !data?.success) {
      showToast(error || 'Failed to update tank price on server.', 'error');
      return;
    }

    await refreshStationState();

    showToast(`Fuel price updated to $${newPrice.toFixed(2)}/L.`);
  };

  // 6. Customers & Payments
  const handleAddCustomer = async (cData: { name: string; phone: string; company?: string; creditLimit: number }) => {
    const { data, error } = await apiAddCustomer(cData);
    if (error || !data?.success) {
      showToast(error || 'Failed to add customer on server.', 'error');
      return;
    }

    await refreshStationState();
    showToast(`Customer ${cData.name} registered.`);
  };

  const handleRecordPayment = async (pData: { customerId: string; amount: number; paymentMethod: PaymentMethod; reference?: string }) => {
    const targetCust = state.customers.find(c => c.id === pData.customerId);
    if (!targetCust) return;

    const { data, error } = await apiRecordPayment(pData.customerId, pData.amount, pData.paymentMethod, pData.reference);
    if (error || !data?.success) {
      showToast(error || 'Failed to record customer payment on server.', 'error');
      return;
    }

    await refreshStationState();
    showToast(`Payment of $${pData.amount.toFixed(2)} collected from ${targetCust.name}.`);
  };

  // 7. Expenses
  const handleAddExpense = async (expData: { category: ExpenseCategory; description: string; amount: number; receiptNumber?: string }) => {
    const { data, error } = await apiAddExpense({
      title: expData.description,
      category: expData.category,
      amount: expData.amount,
      paymentMethod: 'cash',
      recipient: expData.description,
      note: expData.receiptNumber
    });

    if (error || !data?.success) {
      showToast(error || 'Failed to record expense on server.', 'error');
      return;
    }

    await refreshStationState();
    showToast(`Expense of $${expData.amount.toFixed(2)} recorded.`);
  };

  // 8. Staff & Roles
  const handleAddUser = async (uData: { name: string; username?: string; email: string; role: UserRole; pin: string }) => {
    const cleanUsername = (uData.username || uData.name.toLowerCase().replace(/\s+/g, '_')).trim().toLowerCase();
    const cleanEmail = (uData.email || `${cleanUsername}@gasflow.so`).trim().toLowerCase();

    const { data, error } = await apiRegister({
      name: uData.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: uData.pin,
      pin: uData.pin,
      role: uData.role
    });

    if (error || !data?.success) {
      showToast(error || 'Failed to create staff account on server.', 'error');
      return;
    }

    const newUser = data.user;
    await refreshStationState();
    showToast(
      language === 'so'
        ? `Shaqaale cusub ayaa la abuuray: ${uData.name} (${uData.role.toUpperCase()}) — Username: ${cleanUsername}`
        : `Staff account created for ${uData.name} (${uData.role.toUpperCase()}) — Username: ${cleanUsername}`,
      'success'
    );
  };

  const handleToggleUserStatus = async (userId: string) => {
    const target = state.users.find(u => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';

    const { data, error } = await apiToggleUserStatus(userId, newStatus);
    if (error || !data?.success) {
      showToast(error || 'Failed to update user status on server.', 'error');
      return;
    }

    await refreshStationState();
    showToast(`User ${target.name} status updated to ${newStatus}.`);
  };

  // 9. Sync Engine
  const handleTriggerSync = async () => {
    const ok = await refreshStationState();
    showToast(
      ok
        ? (language === 'so' ? 'Xogta qalabkan waa la isku xiray server-ka saldhigga.' : 'This device is now synced with the station server.')
        : (language === 'so' ? 'Isku-xirku wuu fashilmay. Hubi internet-ka.' : 'Sync failed. Check the network.'),
      ok ? 'success' : 'error'
    );
  };

  // 10. Settings & Backup/Restore
  const handleUpdateStation = async (st: StationConfig) => {
    const { data, error } = await apiUpdateStation(st);
    if (error || !data?.success) {
      showToast(error || 'Failed to update station profile.', 'error');
      return;
    }
    await refreshStationState();
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

  if (!isAuthenticated) {
    return (
      <>
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

        <AuthPortal
          users={state.users}
          onLogin={handleLogin}
          onRegister={handleRegister}
          language={language}
          onLanguageChange={setLanguage}
          initialMode={authInitialMode}
        />
      </>
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
          onLogout={handleLogout}
        />

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-hidden">
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
            onOpenAuthPortal={() => setCurrentView('auth')}
            onLogout={handleLogout}
          />

          {/* Active View */}
          <main className="flex-1 p-2.5 sm:p-4 lg:p-6 pb-32 sm:pb-36 lg:pb-8 overflow-y-auto w-full max-w-full overflow-x-hidden">
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
                onAddAdjustment={handleStockAdjustment}
              />
            )}

            {currentView === 'customers' && (
              <CustomersView
                customers={state.customers}
                payments={state.customerPayments}
                sales={state.sales}
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
                payments={state.customerPayments}
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

            {currentView === 'auth' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-2 sm:p-4">
                <AuthPortal
                  users={state.users}
                  onLogin={(user) => {
                    handleLogin(user);
                    // handleLogin sets the view based on role automatically
                  }}
                  onRegister={handleRegister}
                  language={language}
                  onLanguageChange={setLanguage}
                  onClose={() => setCurrentView('dashboard')}
                  initialMode={authInitialMode}
                />
              </div>
            )}

            {/* Extra breathing buffer for mobile screens so all cards complete well above tabs */}
            <div className="h-4 lg:hidden" aria-hidden="true" />
          </main>
        </div>
      </div>

      {/* Subtle bottom gradient scrim so content scrolling into dock dissolves smoothly */}
      <div 
        className="fixed bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#F4F6FA] via-[#F4F6FA]/80 to-transparent pointer-events-none z-30 lg:hidden" 
        aria-hidden="true"
      />

      {/* Mobile Bottom Navigation Bar (Screen < lg) - Floating Island Dock with clear separation and gap */}
      <nav
        className={`fixed bottom-2 inset-x-2 sm:bottom-3 sm:inset-x-6 z-40 max-w-lg mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.04)] lg:hidden transition-all duration-200 ${
          isMobileMenuOpen ? 'opacity-0 pointer-events-none translate-y-6' : 'opacity-100 translate-y-0'
        }`}
        style={{ marginBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around px-1 py-1">
        {[
          { id: 'dashboard', label: language === 'so' ? 'Hoyga' : 'Home', icon: LayoutDashboard },
          { id: 'sales',     label: language === 'so' ? 'Iibka' : 'Sales', icon: Fuel },
          { id: 'tanks',     label: language === 'so' ? 'Haamaha' : 'Tanks', icon: Database },
          { id: 'reports',   label: language === 'so' ? 'Warbixin' : 'Reports', icon: BarChart3 },
          { id: 'menu',      label: language === 'so' ? 'Wax kale' : 'Menu', icon: Menu, isMenuButton: true }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id && !tab.isMenuButton;
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
              className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 cursor-pointer min-w-[56px] relative ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {/* Active pill indicator */}
              {isActive && (
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-blue-600" />
              )}
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-blue-50' : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              </div>
              <span className={`text-[10px] tracking-tight font-medium leading-none ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-400'
              }`}>{tab.label}</span>
            </button>
          );
        })}
        </div>
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
