import {
  User,
  Tank,
  Sale,
  FuelDelivery,
  InventoryMovement,
  Customer,
  CustomerPayment,
  Expense,
  AuditLog,
  SyncEvent,
  StationConfig,
  NetworkMode,
  FuelTypeCode
} from './types';

export const INITIAL_STATION: StationConfig = {
  id: 'st_001',
  name: 'Kaalimaha Shidaalka Gaalkacyo',
  branch: 'Gaalkacyo, Galmudug — Xaafadda Suuqa Weyn',
  address: 'Wadada Boosaaso, Gaalkacyo Koonfur, Galmudug',
  phone: '+252 090 2100000',
  taxRate: 0,
  currency: 'USD',
  currencySymbol: '$'
};

export const INITIAL_USERS: User[] = [];

export const INITIAL_TANKS: Tank[] = [
  {
    id: 't_1',
    tankNumber: 'T-01',
    fuelType: 'PMS',
    name: 'Baasiin (PMS)',
    capacity: 10000,
    currentLevel: 6780,
    unitPrice: 1.19,   // Qiimaha suuqa Gaalkacyo ($1.19 / Litir)
    minThreshold: 2000,
    status: 'normal',
    lastCalibrated: '2026-10-10'
  },
  {
    id: 't_2',
    tankNumber: 'T-02',
    fuelType: 'AGO',
    name: 'Naafto (AGO)',
    capacity: 10000,
    currentLevel: 4190,
    unitPrice: 1.20,   // Qiimaha suuqa Gaalkacyo ($1.20 / Litir)
    minThreshold: 2000,
    status: 'normal',
    lastCalibrated: '2026-10-10'
  },
  {
    id: 't_3',
    tankNumber: 'T-03',
    fuelType: 'DPK',
    name: 'Gaas Cad (DPK)',
    capacity: 10000,
    currentLevel: 5200,
    unitPrice: 0.94,   // Qiimaha suuqa Gaalkacyo ($0.94 / Litir)
    minThreshold: 2000,
    status: 'normal',
    lastCalibrated: '2026-10-09'
  },
  {
    id: 't_4',
    tankNumber: 'T-04',
    fuelType: 'LPG',
    name: 'Gaaska LPG (Dhululubo)',
    capacity: 10000,
    currentLevel: 3800,
    unitPrice: 20.00,  // Qiimaha suuqa Gaalkacyo ($20.00 / Dhululubo)
    minThreshold: 2000,
    status: 'normal',
    lastCalibrated: '2026-10-08'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c_1',
    name: 'Cabdirashiid Xasan Nuur',
    phone: '+252 090 2110001',
    company: 'Nuur Transport Gaalkacyo',
    creditLimit: 500,
    currentBalance: 85.00,
    status: 'active',
    createdAt: '2026-09-01'
  },
  {
    id: 'c_2',
    name: 'Faadumo Cabdi Warsame',
    phone: '+252 090 2120002',
    company: 'Warsame Logistics Galmudug',
    creditLimit: 300,
    currentBalance: 0.00,
    status: 'active',
    createdAt: '2026-09-10'
  },
  {
    id: 'c_3',
    name: 'Axmed Cali Dheere',
    phone: '+252 090 2130003',
    company: 'Dheere Fleet Services',
    creditLimit: 1000,
    currentBalance: 230.00,
    status: 'active',
    createdAt: '2026-08-15'
  },
  {
    id: 'c_4',
    name: 'Saado Maxamed Guure',
    phone: '+252 090 2140004',
    company: 'Guure Guri-Dhis Construction',
    creditLimit: 800,
    currentBalance: 55.00,
    status: 'active',
    createdAt: '2026-09-20'
  },
  {
    id: 'c_5',
    name: 'Muuse Ibraahim Cumar',
    phone: '+252 090 2150005',
    company: 'Galmudug Gaari Raac',
    creditLimit: 600,
    currentBalance: 0.00,
    status: 'active',
    createdAt: '2026-10-01'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_101',
    saleNumber: 'KSG-2026-001',
    stationId: 'st_001',
    deviceId: 'DEV-POS-01',
    cashierId: 'u_2',
    cashierName: 'Caasho Cumar',
    fuelType: 'PMS',
    tankId: 't_1',
    litres: 25.00,
    unitPrice: 1.85,
    totalAmount: 46.25,
    paymentMethod: 'sahal',   // Golis Sahal — ugu badan Gaalkacyo
    paymentStatus: 'paid',
    createdAt: '2026-10-14T07:30:00.000Z',
    syncStatus: 'synced'
  },
  {
    id: 'sale_102',
    saleNumber: 'KSG-2026-002',
    stationId: 'st_001',
    deviceId: 'DEV-POS-01',
    cashierId: 'u_2',
    cashierName: 'Caasho Cumar',
    fuelType: 'AGO',
    tankId: 't_2',
    litres: 30.00,
    unitPrice: 1.65,
    totalAmount: 49.50,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    createdAt: '2026-10-14T08:00:00.000Z',
    syncStatus: 'synced'
  },
  {
    id: 'sale_103',
    saleNumber: 'KSG-2026-003',
    stationId: 'st_001',
    deviceId: 'DEV-POS-01',
    cashierId: 'u_2',
    cashierName: 'Caasho Cumar',
    fuelType: 'LPG',
    tankId: 't_4',
    litres: 20.00,
    unitPrice: 1.30,
    totalAmount: 26.00,
    paymentMethod: 'sahal',
    paymentStatus: 'paid',
    createdAt: '2026-10-14T09:00:00.000Z',
    syncStatus: 'synced'
  },
  {
    id: 'sale_104',
    saleNumber: 'KSG-2026-004',
    stationId: 'st_001',
    deviceId: 'DEV-POS-01',
    cashierId: 'u_2',
    cashierName: 'Caasho Cumar',
    customerId: 'c_3',
    customerName: 'Axmed Cali Dheere',
    fuelType: 'PMS',
    tankId: 't_1',
    litres: 60.00,
    unitPrice: 1.85,
    totalAmount: 111.00,
    paymentMethod: 'credit',
    paymentStatus: 'paid',
    createdAt: '2026-10-14T09:45:00.000Z',
    syncStatus: 'synced'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    category: 'Office Supplies',
    description: 'Rasiidyo & Daabacan tartanka',
    amount: 40.00,
    addedBy: 'Caasho Cumar',
    receiptNumber: 'KSG-REC-001',
    createdAt: '2026-10-13'
  },
  {
    id: 'exp_2',
    category: 'Maintenance',
    description: 'Dayactirka dhuumaha & fooldiga',
    amount: 150.00,
    addedBy: 'Cali Warsame',
    receiptNumber: 'KSG-REC-002',
    createdAt: '2026-10-12'
  },
  {
    id: 'exp_3',
    category: 'Electricity',
    description: 'Shidaalka jeneretarka & biilka korontada',
    amount: 95.00,
    addedBy: 'Caasho Cumar',
    receiptNumber: 'KSG-REC-003',
    createdAt: '2026-10-11'
  },
  {
    id: 'exp_4',
    category: 'Salaries',
    description: 'Mushaarka toddobaadlaha shaqaalaha dhuumaha',
    amount: 480.00,
    addedBy: 'Caasho Cumar',
    receiptNumber: 'KSG-REC-004',
    createdAt: '2026-10-10'
  }
];

export const INITIAL_DELIVERIES: FuelDelivery[] = [
  {
    id: 'del_1',
    tankId: 't_1',
    fuelType: 'PMS',
    litres: 5000,
    costPerLitre: 1.58,
    totalCost: 7900,
    supplier: 'Puntland Petroleum Boosaaso',
    invoiceNumber: 'PPB-2026-441',
    receivedBy: 'Cali Warsame',
    receivedAt: '2026-10-08',
    dipstickBefore: 1900,
    dipstickAfter: 6900
  },
  {
    id: 'del_2',
    tankId: 't_2',
    fuelType: 'AGO',
    litres: 4000,
    costPerLitre: 1.40,
    totalCost: 5600,
    supplier: 'Galmudug Fuel Depot',
    invoiceNumber: 'GFD-2026-192',
    receivedBy: 'Cali Warsame',
    receivedAt: '2026-10-07',
    dipstickBefore: 800,
    dipstickAfter: 4800
  }
];

export const INITIAL_SYNC_EVENTS: SyncEvent[] = [
  {
    eventId: 'evt_001',
    entityType: 'sale',
    entityId: 'sale_101',
    action: 'create',
    deviceId: 'DEV-POS-01',
    stationId: 'st_001',
    timestamp: '2025-04-29T10:15:00.000Z',
    syncStatus: 'synced',
    retryCount: 0,
    payloadSummary: 'Sale GF-2025-001 (PMS 20.00L - $34.00)'
  },
  {
    eventId: 'evt_002',
    entityType: 'sale',
    entityId: 'sale_102',
    action: 'create',
    deviceId: 'DEV-POS-01',
    stationId: 'st_001',
    timestamp: '2025-04-29T09:45:00.000Z',
    syncStatus: 'synced',
    retryCount: 0,
    payloadSummary: 'Sale GF-2025-002 (AGO 19.00L - $28.50)'
  }
];

export interface AppState {
  station: StationConfig;
  currentUser: User | null;
  users: User[];
  tanks: Tank[];
  sales: Sale[];
  deliveries: FuelDelivery[];
  movements: InventoryMovement[];
  customers: Customer[];
  customerPayments: CustomerPayment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  syncEvents: SyncEvent[];
  networkMode: NetworkMode;
  activeDeviceId: string;
}

const STORAGE_KEY = 'gasflow_app_state_v3';
const DEVICE_KEY = 'gasflow_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'DEV-SERVER';
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
      id = `DEV-${rand}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'DEV-POS-01';
  }
}

export function emptyAppState(): AppState {
  return {
    station: {
      id: '',
      name: 'GasFlow Station',
      branch: '',
      address: '',
      phone: '',
      taxRate: 0,
      currency: 'USD',
      currencySymbol: '$'
    },
    currentUser: null,
    users: [],
    tanks: [],
    sales: [],
    deliveries: [],
    movements: [],
    customers: [],
    customerPayments: [],
    expenses: [],
    auditLogs: [],
    syncEvents: [],
    networkMode: 'cloud_online',
    activeDeviceId: typeof window === 'undefined' ? 'DEV-SERVER' : getDeviceId()
  };
}

export function getInitialState(): AppState {
  return emptyAppState();
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    const orgId = state.currentUser?.organizationId || state.station.id;
    if (!orgId) return;
    localStorage.setItem(`${STORAGE_KEY}_${orgId}`, JSON.stringify({
      ...state,
      currentUser: state.currentUser
    }));
  } catch (e) {
    console.error('Failed to save GasFlow state:', e);
  }
}

// Generate unique UUID
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
