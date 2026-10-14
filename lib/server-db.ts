/**
 * GasFlow Server Database
 *
 * Multi-tenant JSON store: each station (organization) has its own
 * tanks, sales, customers, staff, and ledger. Concurrent device writes
 * are serialized with an in-process lock.
 */

import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth';
import type {
  User,
  UserRole,
  Tank,
  Sale,
  FuelDelivery,
  InventoryMovement,
  Customer,
  CustomerPayment,
  Expense,
  AuditLog,
  StationConfig,
  FuelTypeCode,
  PaymentMethod
} from './types';

export interface ServerUserRecord extends Omit<User, 'pin'> {
  passwordHash: string;
  pinHash?: string;
  pin: string;
  organizationId: string;
}

export interface DatabaseState {
  version: string;
  stations: StationConfig[];
  users: ServerUserRecord[];
  tanks: Tank[];
  sales: Sale[];
  deliveries: FuelDelivery[];
  movements: InventoryMovement[];
  customers: Customer[];
  customerPayments: CustomerPayment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
}

export interface TenantState {
  version: string;
  station: StationConfig;
  users: User[];
  tanks: Tank[];
  sales: Sale[];
  deliveries: FuelDelivery[];
  movements: InventoryMovement[];
  customers: Customer[];
  customerPayments: CustomerPayment[];
  expenses: Expense[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'gasflow_db.json');

const EMPTY_DB = (): DatabaseState => ({
  version: '3.0.0',
  stations: [],
  users: [],
  tanks: [],
  sales: [],
  deliveries: [],
  movements: [],
  customers: [],
  customerPayments: [],
  expenses: [],
  auditLogs: []
});

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function belongsTo(orgId: string, record: { organizationId?: string; stationId?: string }): boolean {
  return record.organizationId === orgId || record.stationId === orgId;
}

function starterTanks(organizationId: string): Tank[] {
  const specs: Array<Pick<Tank, 'tankNumber' | 'fuelType' | 'name' | 'unitPrice'>> = [
    { tankNumber: 'T-01', fuelType: 'PMS', name: 'Baasiin (PMS)',            unitPrice: 1.19 },
    { tankNumber: 'T-02', fuelType: 'AGO', name: 'Naafto (AGO)',             unitPrice: 1.20 },
    { tankNumber: 'T-03', fuelType: 'DPK', name: 'Gaas Cad (DPK)',           unitPrice: 0.94 },
    { tankNumber: 'T-04', fuelType: 'LPG', name: 'Gaaska LPG (Dhululubo)',   unitPrice: 20.00 }
  ];
  return specs.map((spec, index) => ({
    id: `${organizationId}_t${index + 1}`,
    tankNumber: spec.tankNumber,
    fuelType: spec.fuelType,
    name: spec.name,
    capacity: 10000,
    currentLevel: 5000,
    unitPrice: spec.unitPrice,
    minThreshold: 2000,
    status: 'normal',
    lastCalibrated: new Date().toISOString().split('T')[0],
    organizationId
  }));
}

function starterCustomers(organizationId: string): Customer[] {
  return [
    {
      id: `${organizationId}_c1`,
      name: 'Cabdirashiid Xasan Nuur',
      phone: '+252 090 2110001',
      company: 'Nuur Transport Gaalkacyo',
      creditLimit: 500,
      currentBalance: 85.00,
      status: 'active',
      createdAt: '2026-09-01',
      organizationId
    },
    {
      id: `${organizationId}_c2`,
      name: 'Faadumo Cabdi Warsame',
      phone: '+252 090 2120002',
      company: 'Warsame Logistics Galmudug',
      creditLimit: 300,
      currentBalance: 0.00,
      status: 'active',
      createdAt: '2026-09-10',
      organizationId
    },
    {
      id: `${organizationId}_c3`,
      name: 'Axmed Cali Dheere',
      phone: '+252 090 2130003',
      company: 'Dheere Fleet Services',
      creditLimit: 1000,
      currentBalance: 230.00,
      status: 'active',
      createdAt: '2026-08-15',
      organizationId
    },
    {
      id: `${organizationId}_c4`,
      name: 'Saado Maxamed Guure',
      phone: '+252 090 2140004',
      company: 'Guure Guri-Dhis Construction',
      creditLimit: 800,
      currentBalance: 55.00,
      status: 'active',
      createdAt: '2026-09-20',
      organizationId
    },
    {
      id: `${organizationId}_c5`,
      name: 'Muuse Ibraahim Cumar',
      phone: '+252 090 2150005',
      company: 'Galmudug Gaari Raac',
      creditLimit: 600,
      currentBalance: 0.00,
      status: 'active',
      createdAt: '2026-10-01',
      organizationId
    }
  ];
}

function stampOrg<T extends { organizationId?: string; stationId?: string }>(
  items: T[] | undefined,
  orgId: string
): T[] {
  return (items || []).map(item => ({
    ...item,
    organizationId: item.organizationId || item.stationId || orgId
  }));
}

function normalizeDb(raw: Record<string, unknown>): DatabaseState {
  if (Array.isArray(raw.stations)) {
    const db = raw as unknown as DatabaseState;
    return {
      ...EMPTY_DB(),
      ...db,
      version: '3.0.0',
      stations: db.stations || [],
      users: db.users || [],
      tanks: db.tanks || [],
      sales: db.sales || [],
      deliveries: db.deliveries || [],
      movements: db.movements || [],
      customers: db.customers || [],
      customerPayments: db.customerPayments || [],
      expenses: db.expenses || [],
      auditLogs: db.auditLogs || []
    };
  }

  const legacyStation = (raw.station as StationConfig) || {
    id: 'st_001',
    name: 'GasFlow Main Station',
    branch: 'Mogadishu Central, KM4',
    address: 'KM4 Junction, Airport Road, Mogadishu',
    phone: '+252 61 5000000',
    taxRate: 0,
    currency: 'USD',
    currencySymbol: '$'
  };
  const orgId = legacyStation.id || 'st_001';

  return {
    version: '3.0.0',
    stations: [{ ...legacyStation, id: orgId }],
    users: stampOrg(raw.users as ServerUserRecord[], orgId),
    tanks: stampOrg(raw.tanks as Tank[], orgId),
    sales: stampOrg(raw.sales as Sale[], orgId).map(s => ({ ...s, stationId: s.stationId || orgId })),
    deliveries: stampOrg(raw.deliveries as FuelDelivery[], orgId),
    movements: stampOrg(raw.movements as InventoryMovement[], orgId),
    customers: stampOrg(raw.customers as Customer[], orgId),
    customerPayments: stampOrg(raw.customerPayments as CustomerPayment[], orgId),
    expenses: stampOrg(raw.expenses as Expense[], orgId),
    auditLogs: stampOrg(raw.auditLogs as AuditLog[], orgId)
  };
}

function readDbSync(): DatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = EMPTY_DB();
      writeDbSync(initial);
      return initial;
    }
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as Record<string, unknown>;
    const normalized = normalizeDb(raw);
    if (raw.version !== '3.0.0' || !Array.isArray(raw.stations)) {
      writeDbSync(normalized);
    }
    return normalized;
  } catch (err) {
    console.error('[server-db] Failed to read database file:', err);
    return EMPTY_DB();
  }
}

function writeDbSync(data: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

let writeQueue: Promise<void> = Promise.resolve();

async function withLock<T>(fn: (db: DatabaseState) => T | Promise<T>): Promise<T> {
  let release!: () => void;
  const previous = writeQueue;
  writeQueue = new Promise<void>(resolve => {
    release = resolve;
  });
  await previous;
  try {
    const db = readDbSync();
    const result = await fn(db);
    writeDbSync(db);
    return result;
  } finally {
    release();
  }
}

function requireStation(db: DatabaseState, organizationId: string): StationConfig {
  const station = db.stations.find(s => s.id === organizationId);
  if (!station) throw new Error('Station not found for this account.');
  return station;
}

function sanitizeUser(u: ServerUserRecord): User {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    role: u.role,
    status: u.status,
    phone: u.phone,
    branch: u.branch,
    pin: '****',
    lastLogin: u.lastLogin,
    twoFactorEnabled: u.twoFactorEnabled,
    organizationId: u.organizationId
  };
}

function addAudit(
  db: DatabaseState,
  organizationId: string,
  userId: string,
  userName: string,
  action: string,
  details: string
) {
  db.auditLogs.unshift({
    id: newId('log'),
    userId,
    userName,
    action,
    details,
    createdAt: new Date().toISOString(),
    organizationId
  });
}

function tankStatus(tank: Tank): Tank['status'] {
  if (tank.currentLevel <= tank.minThreshold / 2) return 'critical';
  if (tank.currentLevel <= tank.minThreshold) return 'low';
  return 'normal';
}

export async function countUsers(): Promise<number> {
  return readDbSync().users.length;
}

export async function findUserById(id: string): Promise<ServerUserRecord | null> {
  return readDbSync().users.find(u => u.id === id) || null;
}

export async function findUserByIdentifier(identifier: string): Promise<ServerUserRecord | null> {
  const normalized = identifier.toLowerCase().trim();
  const db = readDbSync();
  return (
    db.users.find(
      u => u.username?.toLowerCase() === normalized || u.email.toLowerCase() === normalized
    ) || null
  );
}

export async function createStationWithAdmin(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  pin?: string;
  phone?: string;
  stationName?: string;
  branch?: string;
  address?: string;
}): Promise<{ user: User; station: StationConfig }> {
  const passwordHash = await hashPassword(data.password.trim());
  const pinHash = data.pin ? await hashPassword(data.pin.trim()) : passwordHash;
  const normalizedUsername = data.username.toLowerCase().trim();
  const normalizedEmail = data.email.toLowerCase().trim();

  return withLock(db => {
    const exists = db.users.some(
      u => u.username?.toLowerCase() === normalizedUsername || u.email.toLowerCase() === normalizedEmail
    );
    if (exists) {
      throw new Error('Username or email is already registered.');
    }

    const organizationId = newId('st');
    const station: StationConfig = {
      id: organizationId,
      name: (data.stationName || `${data.name.trim()}'s Station`).trim(),
      branch: data.branch?.trim() || 'Main Branch',
      address: data.address?.trim() || '',
      phone: data.phone?.trim() || '',
      taxRate: 0,
      currency: 'USD',
      currencySymbol: '$'
    };

    const admin: ServerUserRecord = {
      id: newId('u'),
      name: data.name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      role: 'admin',
      passwordHash,
      pinHash,
      pin: '****',
      status: 'active',
      phone: data.phone?.trim(),
      branch: station.branch,
      lastLogin: 'Never',
      twoFactorEnabled: false,
      organizationId
    };

    db.stations.push(station);
    db.users.push(admin);
    db.tanks.push(...starterTanks(organizationId));
    db.customers.push(...starterCustomers(organizationId));
    addAudit(
      db,
      organizationId,
      admin.id,
      admin.name,
      'STATION_CREATE',
      `New station created: ${station.name} — admin ${admin.username}`
    );

    return { user: sanitizeUser(admin), station };
  });
}

export async function createUser(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  pin?: string;
  role: UserRole;
  phone?: string;
  branch?: string;
  status?: 'active' | 'inactive';
  organizationId: string;
}): Promise<User> {
  const passwordHash = await hashPassword(data.password.trim());
  const pinHash = data.pin ? await hashPassword(data.pin.trim()) : undefined;
  const normalizedUsername = data.username.toLowerCase().trim();
  const normalizedEmail = data.email.toLowerCase().trim();

  return withLock(db => {
    requireStation(db, data.organizationId);
    const exists = db.users.some(
      u => u.username?.toLowerCase() === normalizedUsername || u.email.toLowerCase() === normalizedEmail
    );
    if (exists) {
      throw new Error('Username or email is already registered.');
    }

    const station = requireStation(db, data.organizationId);
    const newUserRecord: ServerUserRecord = {
      id: newId('u'),
      name: data.name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      role: data.role,
      passwordHash,
      pinHash,
      pin: '****',
      status: data.status ?? 'active',
      phone: data.phone?.trim(),
      branch: data.branch?.trim() || station.branch,
      lastLogin: 'Never',
      twoFactorEnabled: false,
      organizationId: data.organizationId
    };

    db.users.push(newUserRecord);
    addAudit(
      db,
      data.organizationId,
      newUserRecord.id,
      newUserRecord.name,
      'USER_REGISTER',
      `Staff registered: ${newUserRecord.name} (${newUserRecord.role.toUpperCase()})`
    );
    return sanitizeUser(newUserRecord);
  });
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive',
  organizationId: string
): Promise<User> {
  return withLock(db => {
    const user = db.users.find(u => u.id === userId && u.organizationId === organizationId);
    if (!user) throw new Error('User not found.');
    user.status = status;
    return sanitizeUser(user);
  });
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await withLock(db => {
    const user = db.users.find(u => u.id === userId);
    if (user) user.lastLogin = new Date().toISOString();
  });
}

export async function listUsers(organizationId: string): Promise<User[]> {
  const db = readDbSync();
  return db.users.filter(u => u.organizationId === organizationId).map(sanitizeUser);
}

export async function listTanks(organizationId: string): Promise<Tank[]> {
  const db = readDbSync();
  return db.tanks.filter(t => belongsTo(organizationId, t));
}

export async function findTankById(id: string, organizationId: string): Promise<Tank | null> {
  const db = readDbSync();
  return db.tanks.find(t => t.id === id && belongsTo(organizationId, t)) || null;
}

export async function createTank(organizationId: string, data: Omit<Tank, 'id' | 'organizationId'>): Promise<Tank> {
  return withLock(db => {
    requireStation(db, organizationId);
    const newTank: Tank = { ...data, id: newId('t'), organizationId };
    db.tanks.push(newTank);
    return newTank;
  });
}

export async function updateTankPrice(
  tankId: string,
  unitPrice: number,
  userId: string,
  userName: string,
  organizationId: string
): Promise<Tank> {
  return withLock(db => {
    const tank = db.tanks.find(t => t.id === tankId && belongsTo(organizationId, t));
    if (!tank) throw new Error('Tank not found.');
    tank.unitPrice = unitPrice;
    addAudit(db, organizationId, userId, userName, 'TANK_PRICE_UPDATE', `Updated ${tank.name} to $${unitPrice.toFixed(2)}/L`);
    return tank;
  });
}

export async function calibrateTank(
  tankId: string,
  measuredLevel: number,
  notes: string | undefined,
  userId: string,
  userName: string,
  organizationId: string
): Promise<Tank> {
  return withLock(db => {
    const tank = db.tanks.find(t => t.id === tankId && belongsTo(organizationId, t));
    if (!tank) throw new Error('Tank not found.');

    const diff = measuredLevel - tank.currentLevel;
    const prevLevel = tank.currentLevel;
    tank.currentLevel = Math.max(0, Math.min(tank.capacity, measuredLevel));
    tank.lastCalibrated = new Date().toISOString().split('T')[0];
    tank.status = tankStatus(tank);

    db.movements.unshift({
      id: newId('mov'),
      tankId,
      fuelType: tank.fuelType,
      type: 'adjustment',
      quantity: diff,
      previousLevel: prevLevel,
      newLevel: tank.currentLevel,
      referenceId: `CAL-${Date.now().toString().slice(-5)}`,
      note: notes || 'Manual Dipstick Calibration',
      createdAt: new Date().toISOString(),
      organizationId
    });
    addAudit(
      db,
      organizationId,
      userId,
      userName,
      'TANK_CALIBRATE',
      `Calibrated ${tank.name}: ${prevLevel}L -> ${tank.currentLevel}L`
    );
    return tank;
  });
}

export async function createSaleTransaction(data: {
  organizationId: string;
  fuelType: FuelTypeCode;
  tankId: string;
  litres: number;
  unitPrice: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  deviceId?: string;
}): Promise<{ sale: Sale; totalAmount: number; tank: Tank }> {
  return withLock(db => {
    const station = requireStation(db, data.organizationId);
    const tank = db.tanks.find(t => t.id === data.tankId && belongsTo(data.organizationId, t));
    if (!tank) throw new Error('Selected tank does not exist.');
    if (tank.fuelType !== data.fuelType) {
      throw new Error(`Tank fuel mismatch: Tank is configured for ${tank.fuelType}, not ${data.fuelType}.`);
    }
    if (tank.currentLevel < data.litres) {
      throw new Error(`Insufficient fuel inventory! Tank has ${tank.currentLevel.toFixed(2)}L remaining.`);
    }

    const serverTotalAmount = Math.round(data.litres * tank.unitPrice * 100) / 100;
    const timestamp = new Date().toISOString();
    const orgSales = db.sales.filter(s => belongsTo(data.organizationId, s));
    const saleNumber = `GF-${new Date().getFullYear()}-${(orgSales.length + 1).toString().padStart(4, '0')}`;

    if (data.paymentMethod === 'credit' && data.customerId) {
      const customer = db.customers.find(c => c.id === data.customerId && belongsTo(data.organizationId, c));
      if (!customer) throw new Error('Credit customer not found.');
      if (customer.currentBalance + serverTotalAmount > customer.creditLimit) {
        throw new Error(
          `Customer credit limit exceeded! Limit is $${customer.creditLimit}, current balance is $${customer.currentBalance}.`
        );
      }
      customer.currentBalance = parseFloat((customer.currentBalance + serverTotalAmount).toFixed(2));
    }

    const prevLevel = tank.currentLevel;
    tank.currentLevel = parseFloat((tank.currentLevel - data.litres).toFixed(2));
    tank.status = tankStatus(tank);

    const newSale: Sale = {
      id: newId('sale'),
      saleNumber,
      stationId: station.id,
      deviceId: data.deviceId || 'DEV-POS-01',
      cashierId: data.cashierId,
      cashierName: data.cashierName,
      customerId: data.customerId,
      customerName: data.customerName,
      fuelType: data.fuelType,
      tankId: data.tankId,
      litres: data.litres,
      unitPrice: tank.unitPrice,
      totalAmount: serverTotalAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'paid',
      createdAt: timestamp,
      syncStatus: 'synced'
    };

    db.sales.unshift(newSale);
    db.movements.unshift({
      id: newId('mov'),
      tankId: tank.id,
      fuelType: tank.fuelType,
      type: 'sale',
      quantity: -data.litres,
      previousLevel: prevLevel,
      newLevel: tank.currentLevel,
      referenceId: saleNumber,
      note: `Dispensed to ${data.customerName || 'Walk-in'}`,
      createdAt: timestamp,
      organizationId: data.organizationId
    });
    addAudit(
      db,
      data.organizationId,
      data.cashierId,
      data.cashierName,
      'SALE_CREATE',
      `Sale ${saleNumber}: ${data.fuelType} ${data.litres}L = $${serverTotalAmount} (${data.paymentMethod.toUpperCase()})`
    );

    return { sale: newSale, totalAmount: serverTotalAmount, tank };
  });
}

export async function voidSaleTransaction(
  saleId: string,
  reason: string,
  voidedBy: string,
  userId: string,
  organizationId: string
): Promise<Sale> {
  return withLock(db => {
    const sale = db.sales.find(s => s.id === saleId && belongsTo(organizationId, s));
    if (!sale) throw new Error('Sale not found.');
    if (sale.paymentStatus === 'voided') throw new Error('Sale is already voided.');

    sale.paymentStatus = 'voided';
    sale.voidReason = reason;
    sale.voidedBy = voidedBy;
    sale.voidedAt = new Date().toISOString();

    const tank = db.tanks.find(t => t.id === sale.tankId && belongsTo(organizationId, t));
    if (tank) {
      const prevLevel = tank.currentLevel;
      tank.currentLevel = parseFloat((tank.currentLevel + sale.litres).toFixed(2));
      tank.status = tankStatus(tank);
      db.movements.unshift({
        id: newId('mov'),
        tankId: tank.id,
        fuelType: tank.fuelType,
        type: 'adjustment',
        quantity: sale.litres,
        previousLevel: prevLevel,
        newLevel: tank.currentLevel,
        referenceId: sale.saleNumber,
        note: `Void restoration: ${reason}`,
        createdAt: new Date().toISOString(),
        organizationId
      });
    }

    if (sale.paymentMethod === 'credit' && sale.customerId) {
      const customer = db.customers.find(c => c.id === sale.customerId && belongsTo(organizationId, c));
      if (customer) {
        customer.currentBalance = Math.max(0, parseFloat((customer.currentBalance - sale.totalAmount).toFixed(2)));
      }
    }

    addAudit(db, organizationId, userId, voidedBy, 'SALE_VOID', `Voided ${sale.saleNumber}. Reason: ${reason}`);
    return sale;
  });
}

export async function recordDeliveryTransaction(data: {
  organizationId: string;
  tankId: string;
  litres: number;
  costPerLitre: number;
  totalCost: number;
  supplier: string;
  invoiceNumber: string;
  dipstickBefore?: number;
  dipstickAfter?: number;
  receivedById: string;
  receivedByName: string;
}): Promise<{ delivery: FuelDelivery; tank: Tank }> {
  return withLock(db => {
    const tank = db.tanks.find(t => t.id === data.tankId && belongsTo(data.organizationId, t));
    if (!tank) throw new Error('Tank not found.');

    const prevLevel = tank.currentLevel;
    const newLevel = Math.min(tank.capacity, parseFloat((tank.currentLevel + data.litres).toFixed(2)));
    tank.currentLevel = newLevel;
    tank.status = tankStatus(tank);

    const delivery: FuelDelivery = {
      id: newId('del'),
      tankId: tank.id,
      fuelType: tank.fuelType,
      litres: data.litres,
      costPerLitre: data.costPerLitre,
      totalCost: data.totalCost,
      supplier: data.supplier,
      invoiceNumber: data.invoiceNumber,
      receivedBy: data.receivedByName,
      receivedAt: new Date().toISOString(),
      dipstickBefore: data.dipstickBefore ?? prevLevel,
      dipstickAfter: data.dipstickAfter ?? newLevel,
      organizationId: data.organizationId
    };

    db.deliveries.unshift(delivery);
    db.movements.unshift({
      id: newId('mov'),
      tankId: tank.id,
      fuelType: tank.fuelType,
      type: 'delivery',
      quantity: data.litres,
      previousLevel: prevLevel,
      newLevel,
      referenceId: data.invoiceNumber,
      note: `Delivery from ${data.supplier}`,
      createdAt: new Date().toISOString(),
      organizationId: data.organizationId
    });
    addAudit(
      db,
      data.organizationId,
      data.receivedById,
      data.receivedByName,
      'DELIVERY_RECEIVE',
      `Received ${data.litres}L ${tank.fuelType} from ${data.supplier}`
    );
    return { delivery, tank };
  });
}

export async function listCustomers(organizationId: string): Promise<Customer[]> {
  return readDbSync().customers.filter(c => belongsTo(organizationId, c));
}

export async function createCustomer(
  organizationId: string,
  data: Omit<Customer, 'id' | 'currentBalance' | 'createdAt' | 'status' | 'organizationId'>
): Promise<Customer> {
  return withLock(db => {
    requireStation(db, organizationId);
    const newCustomer: Customer = {
      ...data,
      id: newId('c'),
      currentBalance: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      organizationId
    };
    db.customers.unshift(newCustomer);
    return newCustomer;
  });
}

export async function recordCustomerPaymentTransaction(data: {
  organizationId: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  receivedBy: string;
  userId: string;
}): Promise<CustomerPayment> {
  return withLock(db => {
    const customer = db.customers.find(c => c.id === data.customerId && belongsTo(data.organizationId, c));
    if (!customer) throw new Error('Customer not found.');

    customer.currentBalance = Math.max(0, parseFloat((customer.currentBalance - data.amount).toFixed(2)));
    const payment: CustomerPayment = {
      id: newId('pay'),
      customerId: data.customerId,
      customerName: customer.name,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      collectedBy: data.receivedBy,
      createdAt: new Date().toISOString(),
      organizationId: data.organizationId
    };
    db.customerPayments.unshift(payment);
    addAudit(
      db,
      data.organizationId,
      data.userId,
      data.receivedBy,
      'CUSTOMER_PAYMENT',
      `Collected $${data.amount.toFixed(2)} from ${customer.name}`
    );
    return payment;
  });
}

export async function listExpenses(organizationId: string): Promise<Expense[]> {
  return readDbSync().expenses.filter(e => belongsTo(organizationId, e));
}

export async function createExpenseTransaction(
  organizationId: string,
  data: Omit<Expense, 'id' | 'createdAt' | 'organizationId'>,
  userId: string,
  userName: string
): Promise<Expense> {
  return withLock(db => {
    requireStation(db, organizationId);
    const expense: Expense = {
      ...data,
      id: newId('exp'),
      createdAt: new Date().toISOString().split('T')[0],
      organizationId
    };
    db.expenses.unshift(expense);
    addAudit(db, organizationId, userId, userName, 'EXPENSE_ADD', `Expense: ${data.description} ($${data.amount.toFixed(2)})`);
    return expense;
  });
}

export async function listAuditLogs(organizationId: string, limit = 100): Promise<AuditLog[]> {
  return readDbSync().auditLogs.filter(l => belongsTo(organizationId, l)).slice(0, limit);
}

export async function getStationConfig(organizationId: string): Promise<StationConfig> {
  return requireStation(readDbSync(), organizationId);
}

export async function updateStationConfig(
  organizationId: string,
  patch: Partial<Omit<StationConfig, 'id'>>
): Promise<StationConfig> {
  return withLock(db => {
    const station = requireStation(db, organizationId);
    Object.assign(station, patch, { id: organizationId });
    return station;
  });
}

export async function getSanitizedState(organizationId: string): Promise<TenantState> {
  const db = readDbSync();
  const station = requireStation(db, organizationId);
  return {
    version: db.version,
    station,
    users: db.users.filter(u => u.organizationId === organizationId).map(sanitizeUser),
    tanks: db.tanks.filter(t => belongsTo(organizationId, t)),
    sales: db.sales.filter(s => belongsTo(organizationId, s)),
    deliveries: db.deliveries.filter(d => belongsTo(organizationId, d)),
    movements: db.movements.filter(m => belongsTo(organizationId, m)),
    customers: db.customers.filter(c => belongsTo(organizationId, c)),
    customerPayments: db.customerPayments.filter(p => belongsTo(organizationId, p)),
    expenses: db.expenses.filter(e => belongsTo(organizationId, e)),
    auditLogs: db.auditLogs.filter(l => belongsTo(organizationId, l)).slice(0, 200)
  };
}

export async function getTenantState(organizationId: string): Promise<TenantState> {
  return getSanitizedState(organizationId);
}
