export type UserRole = 'admin' | 'cashier' | 'manager' | 'accountant';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
  pin: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  avatar?: string;
  phone?: string;
  branch?: string;
  twoFactorEnabled?: boolean;
}

export type FuelTypeCode = 'PMS' | 'AGO' | 'DPK' | 'LPG';

export interface FuelTypeInfo {
  code: FuelTypeCode;
  name: string;
  somaliName: string;
  unit: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  defaultPrice: number;
}

export interface Tank {
  id: string;
  tankNumber: string;
  fuelType: FuelTypeCode;
  name: string;
  capacity: number;
  currentLevel: number;
  unitPrice: number;
  minThreshold: number;
  status: 'normal' | 'low' | 'critical';
  lastCalibrated?: string;
}

export type PaymentMethod = 'cash' | 'evc' | 'edahab' | 'sahal' | 'card' | 'credit';

export interface Sale {
  id: string;
  saleNumber: string;
  stationId: string;
  deviceId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  fuelType: FuelTypeCode;
  tankId: string;
  litres: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'voided';
  voidReason?: string;
  voidedBy?: string;
  voidedAt?: string;
  createdAt: string;
  syncStatus: 'synced' | 'pending_local' | 'pending_cloud' | 'conflict';
}

export interface FuelDelivery {
  id: string;
  tankId: string;
  fuelType: FuelTypeCode;
  litres: number;
  costPerLitre: number;
  totalCost: number;
  supplier: string;
  invoiceNumber: string;
  receivedBy: string;
  receivedAt: string;
  dipstickBefore: number;
  dipstickAfter: number;
}

export interface InventoryMovement {
  id: string;
  tankId: string;
  fuelType: FuelTypeCode;
  type: 'sale' | 'delivery' | 'adjustment' | 'loss';
  quantity: number; // negative for sales/losses, positive for deliveries
  previousLevel: number;
  newLevel: number;
  referenceId: string;
  note?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  creditLimit: number;
  currentBalance: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  collectedBy: string;
  createdAt: string;
}

export type ExpenseCategory = 'Salaries' | 'Electricity' | 'Maintenance' | 'Rent' | 'Office Supplies' | 'Taxes' | 'Other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  addedBy: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export type NetworkMode = 'cloud_online' | 'lan_only' | 'offline_pwa';

export interface SyncEvent {
  eventId: string;
  entityType: 'sale' | 'delivery' | 'expense' | 'payment' | 'tank_adjust';
  entityId: string;
  action: 'create' | 'update' | 'void';
  deviceId: string;
  stationId: string;
  timestamp: string;
  syncStatus: 'synced' | 'pending' | 'failed' | 'conflict';
  retryCount: number;
  errorMessage?: string;
  payloadSummary: string;
}

export interface StationConfig {
  id: string;
  name: string;
  branch: string;
  address: string;
  phone: string;
  taxRate: number;
  currency: string;
  currencySymbol: string;
}
