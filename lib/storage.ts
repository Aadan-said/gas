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
  name: 'GasFlow Main Station',
  branch: 'Mogadishu Central, KM4',
  address: 'KM4 Junction, Airport Road, Mogadishu',
  phone: '+252 61 5000000',
  taxRate: 0,
  currency: 'USD',
  currencySymbol: '$'
};

export const INITIAL_USERS: User[] = [
  {
    id: 'u_1',
    name: 'Ahmed Ali',
    email: 'admin@gasflow.so',
    role: 'admin',
    pin: '1234',
    status: 'active',
    lastLogin: 'Today, 09:12 AM'
  },
  {
    id: 'u_2',
    name: 'Fartuun Mohamed',
    email: 'fartuun@gasflow.so',
    role: 'cashier',
    pin: '1111',
    status: 'active',
    lastLogin: 'Today, 10:15 AM'
  },
  {
    id: 'u_3',
    name: 'Ali Hassan',
    email: 'manager@gasflow.so',
    role: 'manager',
    pin: '2222',
    status: 'active',
    lastLogin: 'Today, 08:45 AM'
  },
  {
    id: 'u_4',
    name: 'Sahra Yusuf',
    email: 'accountant@gasflow.so',
    role: 'accountant',
    pin: '3333',
    status: 'active',
    lastLogin: 'Yesterday, 04:30 PM'
  }
];

export const INITIAL_TANKS: Tank[] = [
  {
    id: 't_1',
    tankNumber: 'T-01',
    fuelType: 'PMS',
    name: 'Petrol (PMS)',
    capacity: 10000,
    currentLevel: 6800,
    unitPrice: 1.70,
    minThreshold: 2000,
    status: 'normal',
    lastCalibrated: '2025-04-28'
  },
  {
    id: 't_2',
    tankNumber: 'T-02',
    fuelType: 'AGO',
    name: 'Diesel (AGO)',
    capacity: 10000,
    currentLevel: 4200,
    unitPrice: 1.50,
    minThreshold: 2000,
    status: 'normal',
    lastCalibrated: '2025-04-28'
  },
  {
    id: 't_3',
    tankNumber: 'T-03',
    fuelType: 'DPK',
    name: 'Kerosene (DPK)',
    capacity: 10000,
    currentLevel: 8500,
    unitPrice: 1.80,
    minThreshold: 2000,
    status: 'normal',
    lastCalibrated: '2025-04-27'
  },
  {
    id: 't_4',
    tankNumber: 'T-04',
    fuelType: 'LPG',
    name: 'LPG Gas',
    capacity: 10000,
    currentLevel: 7600,
    unitPrice: 1.20,
    minThreshold: 2000,
    status: 'normal',
    lastCalibrated: '2025-04-26'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c_1',
    name: 'Mohamed Hassan',
    phone: '+252 61 2345678',
    company: 'Hassan Transport Co.',
    creditLimit: 500,
    currentBalance: 45.00,
    status: 'active',
    createdAt: '2025-01-15'
  },
  {
    id: 'c_2',
    name: 'Amina Farah',
    phone: '+252 61 3456789',
    company: 'Blue Sky Logistics',
    creditLimit: 300,
    currentBalance: 0.00,
    status: 'active',
    createdAt: '2025-02-10'
  },
  {
    id: 'c_3',
    name: 'Abdirahman Ali',
    phone: '+252 61 4567890',
    company: 'Somali Express Fleet',
    creditLimit: 1000,
    currentBalance: 120.00,
    status: 'active',
    createdAt: '2025-03-01'
  },
  {
    id: 'c_4',
    name: 'Hodan Yusuf',
    phone: '+252 61 5678901',
    company: 'Banadir Delivery',
    creditLimit: 200,
    currentBalance: 30.00,
    status: 'active',
    createdAt: '2025-03-20'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_101',
    saleNumber: 'GF-2025-001',
    stationId: 'st_001',
    deviceId: 'DEV-POS-01',
    cashierId: 'u_2',
    cashierName: 'Fartuun Mohamed',
    fuelType: 'PMS',
    tankId: 't_1',
    litres: 20.00,
    unitPrice: 1.70,
    totalAmount: 34.00,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    createdAt: '2025-04-29T10:15:00.000Z',
    syncStatus: 'synced'
  },
  {
    id: 'sale_102',
    saleNumber: 'GF-2025-002',
    stationId: 'st_001',
    deviceId: 'DEV-POS-01',
    cashierId: 'u_2',
    cashierName: 'Fartuun Mohamed',
    fuelType: 'AGO',
    tankId: 't_2',
    litres: 19.00,
    unitPrice: 1.50,
    totalAmount: 28.50,
    paymentMethod: 'evc',
    paymentStatus: 'paid',
    createdAt: '2025-04-29T09:45:00.000Z',
    syncStatus: 'synced'
  },
  {
    id: 'sale_103',
    saleNumber: 'GF-2025-003',
    stationId: 'st_001',
    deviceId: 'DEV-POS-02',
    cashierId: 'u_2',
    cashierName: 'Fartuun Mohamed',
    fuelType: 'LPG',
    tankId: 't_4',
    litres: 15.00,
    unitPrice: 1.20,
    totalAmount: 18.00,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    createdAt: '2025-04-29T09:12:00.000Z',
    syncStatus: 'synced'
  },
  {
    id: 'sale_104',
    saleNumber: 'GF-2025-004',
    stationId: 'st_001',
    deviceId: 'DEV-POS-01',
    cashierId: 'u_2',
    cashierName: 'Fartuun Mohamed',
    customerId: 'c_3',
    customerName: 'Abdirahman Ali',
    fuelType: 'PMS',
    tankId: 't_1',
    litres: 50.00,
    unitPrice: 1.70,
    totalAmount: 85.00,
    paymentMethod: 'credit',
    paymentStatus: 'paid',
    createdAt: '2025-04-29T08:30:00.000Z',
    syncStatus: 'synced'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    category: 'Office Supplies',
    description: 'Receipt rolls & printer ribbon',
    amount: 50.00,
    addedBy: 'Ahmed Ali',
    receiptNumber: 'REC-901',
    createdAt: '2025-04-28'
  },
  {
    id: 'exp_2',
    category: 'Maintenance',
    description: 'Nozzle calibration and filter service',
    amount: 120.00,
    addedBy: 'Ali Hassan',
    receiptNumber: 'REC-902',
    createdAt: '2025-04-28'
  },
  {
    id: 'exp_3',
    category: 'Electricity',
    description: 'Station generator fuel & utility bill',
    amount: 80.00,
    addedBy: 'Ahmed Ali',
    receiptNumber: 'REC-903',
    createdAt: '2025-04-27'
  },
  {
    id: 'exp_4',
    category: 'Salaries',
    description: 'Weekly pump attendant staff advances',
    amount: 500.00,
    addedBy: 'Ahmed Ali',
    receiptNumber: 'REC-904',
    createdAt: '2025-04-26'
  }
];

export const INITIAL_DELIVERIES: FuelDelivery[] = [
  {
    id: 'del_1',
    tankId: 't_1',
    fuelType: 'PMS',
    litres: 5000,
    costPerLitre: 1.45,
    totalCost: 7250,
    supplier: 'Hass Petroleum Somalia',
    invoiceNumber: 'HASS-2025-881',
    receivedBy: 'Ali Hassan',
    receivedAt: '2025-04-26',
    dipstickBefore: 2100,
    dipstickAfter: 7100
  },
  {
    id: 'del_2',
    tankId: 't_2',
    fuelType: 'AGO',
    litres: 4000,
    costPerLitre: 1.30,
    totalCost: 5200,
    supplier: 'Mogadishu Fuel Terminals',
    invoiceNumber: 'MFT-9912',
    receivedBy: 'Ali Hassan',
    receivedAt: '2025-04-25',
    dipstickBefore: 1200,
    dipstickAfter: 5200
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

const STORAGE_KEY = 'gasflow_app_state_v2';

export function getInitialState(): AppState {
  if (typeof window === 'undefined') {
    return {
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
      auditLogs: [
        {
          id: 'log_1',
          userId: 'u_1',
          userName: 'Ahmed Ali',
          action: 'SYSTEM_INIT',
          details: 'GasFlow station management initialized with offline-first engine.',
          createdAt: '2025-04-29T08:00:00.000Z'
        }
      ],
      syncEvents: INITIAL_SYNC_EVENTS,
      networkMode: 'cloud_online',
      activeDeviceId: 'DEV-POS-01'
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        currentUser: parsed.currentUser || INITIAL_USERS[0]
      };
    }
  } catch (err) {
    console.error('Failed to parse GasFlow stored state:', err);
  }

  return {
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
    auditLogs: [
      {
        id: 'log_1',
        userId: 'u_1',
        userName: 'Ahmed Ali',
        action: 'SYSTEM_INIT',
        details: 'GasFlow station management initialized with offline-first engine.',
        createdAt: '2025-04-29T08:00:00.000Z'
      }
    ],
    syncEvents: INITIAL_SYNC_EVENTS,
    networkMode: 'cloud_online',
    activeDeviceId: 'DEV-POS-01'
  };
}

export function saveState(state: AppState) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save GasFlow state:', e);
    }
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
