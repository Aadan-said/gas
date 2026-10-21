/**
 * GasFlow Server Database
 * Enterprise PostgreSQL / Prisma layer with ACID Transactions & Multi-Tenancy
 * Scoped strictly to organizationId (stationId).
 */

import fs from 'fs';
import path from 'path';
import { prisma, checkDatabaseConnection } from './prisma';
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
  PaymentMethod,
  ExpenseCategory
} from './types';

export interface ServerUserRecord extends Omit<User, 'pin'> {
  passwordHash: string;
  pinHash?: string;
  pin: string;
  organizationId: string;
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

// ── Local Fallback Store (Used when running in Standalone Local Mode or Vercel Demo) ─────
const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'gasflow_db.json');
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'gasflow_data') : path.join(process.cwd(), 'data');
const DB_FILE = IS_VERCEL ? path.join(DATA_DIR, 'gasflow_db.json') : BUNDLED_DB_FILE;

let inMemoryDbCache: DatabaseState | null = null;

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

function readLocalDbSync(): DatabaseState {
  if (inMemoryDbCache) return inMemoryDbCache;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      if (fs.existsSync(BUNDLED_DB_FILE)) {
        const bundled = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
        fs.writeFileSync(DB_FILE, bundled, 'utf-8');
        inMemoryDbCache = JSON.parse(bundled) as DatabaseState;
        return inMemoryDbCache;
      }
      const initial = EMPTY_DB();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      inMemoryDbCache = initial;
      return initial;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    inMemoryDbCache = JSON.parse(raw) as DatabaseState;
    return inMemoryDbCache;
  } catch (err) {
    console.error('[server-db] Failed to read local database:', err);
    if (inMemoryDbCache) return inMemoryDbCache;
    return EMPTY_DB();
  }
}

function writeLocalDbSync(data: DatabaseState): void {
  inMemoryDbCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[server-db] Failed to write local database file:', err);
  }
}

let isPrismaLive: boolean = false;
let lastPrismaCheck = 0;
const PRISMA_CHECK_INTERVAL_MS = 60000;

export async function hasPrisma(): Promise<boolean> {
  const now = Date.now();
  if (isPrismaLive) return true;
  if (now - lastPrismaCheck < PRISMA_CHECK_INTERVAL_MS) return false;

  lastPrismaCheck = now;
  isPrismaLive = await checkDatabaseConnection();
  if (isPrismaLive) {
    console.log('[server-db] Connected to PostgreSQL via Prisma Client.');
  } else {
    console.warn('[server-db] PostgreSQL not reachable at DATABASE_URL. Running in resilient local fallback mode.');
  }
  return isPrismaLive;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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

function starterTanks(organizationId: string): Array<Omit<Tank, 'id'>> {
  return [
    {
      tankNumber: 'T-01',
      fuelType: 'PMS',
      name: 'Baasiin (PMS)',
      unitPrice: 1.19,
      capacity: 10000,
      currentLevel: 5000,
      minThreshold: 2000,
      status: 'normal',
      lastCalibrated: new Date().toISOString().split('T')[0],
      organizationId
    },
    {
      tankNumber: 'T-02',
      fuelType: 'AGO',
      name: 'Naafto (AGO)',
      unitPrice: 1.20,
      capacity: 10000,
      currentLevel: 4000,
      minThreshold: 2000,
      status: 'normal',
      lastCalibrated: new Date().toISOString().split('T')[0],
      organizationId
    },
    {
      tankNumber: 'T-03',
      fuelType: 'DPK',
      name: 'Gaas Cad (DPK)',
      unitPrice: 0.94,
      capacity: 10000,
      currentLevel: 3500,
      minThreshold: 2000,
      status: 'normal',
      lastCalibrated: new Date().toISOString().split('T')[0],
      organizationId
    },
    {
      tankNumber: 'T-04',
      fuelType: 'LPG',
      name: 'Gaaska LPG (Dhululubo)',
      unitPrice: 20.00,
      capacity: 2000,
      currentLevel: 500,
      minThreshold: 400,
      status: 'normal',
      lastCalibrated: new Date().toISOString().split('T')[0],
      organizationId
    }
  ];
}

// ── 1. USER AUTH & ACCOUNTS ──────────────────────────────────────────────────

export async function countUsers(): Promise<number> {
  if (await hasPrisma()) {
    try {
      return await prisma.user.count();
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  return db.users.length;
}

export async function findUserById(id: string): Promise<ServerUserRecord | null> {
  if (await hasPrisma()) {
    try {
      const u = await prisma.user.findUnique({ where: { id } });
      if (!u) return null;
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        passwordHash: u.passwordHash,
        pin: u.pin,
        role: u.role as UserRole,
        status: u.status as 'active' | 'inactive',
        phone: u.phone || undefined,
        branch: u.branch || undefined,
        twoFactorEnabled: u.twoFactorEnabled,
        lastLogin: u.lastLoginAt ? u.lastLoginAt.toISOString() : undefined,
        organizationId: u.organizationId
      };
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  return db.users.find(u => u.id === id) || null;
}

export async function findUserByIdentifier(identifier: string): Promise<ServerUserRecord | null> {
  const clean = identifier.trim().toLowerCase();
  if (await hasPrisma()) {
    try {
      const u = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: clean, mode: 'insensitive' } },
            { email: { equals: clean, mode: 'insensitive' } }
          ]
        }
      });
      if (!u) return null;
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        passwordHash: u.passwordHash,
        pin: u.pin,
        role: u.role as UserRole,
        status: u.status as 'active' | 'inactive',
        phone: u.phone || undefined,
        branch: u.branch || undefined,
        twoFactorEnabled: u.twoFactorEnabled,
        lastLogin: u.lastLoginAt ? u.lastLoginAt.toISOString() : undefined,
        organizationId: u.organizationId
      };
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  return db.users.find(u =>
    (u.username && u.username.toLowerCase() === clean) ||
    u.email.toLowerCase() === clean
  ) || null;
}

export async function createStationWithAdmin(data: {
  name?: string;
  adminName?: string;
  username?: string;
  adminUsername?: string;
  email?: string;
  adminEmail?: string;
  password?: string;
  adminPassword?: string;
  pin?: string;
  adminPin?: string;
  phone?: string;
  stationName?: string;
  branch?: string;
  address?: string;
  currency?: string;
  currencySymbol?: string;
}): Promise<{ user: User; station: StationConfig }> {
  const stationId = newId('st');
  const adminId = newId('usr');
  const effectiveName = (data.adminName || data.name || 'Admin').trim();
  const effectiveUsername = (data.adminUsername || data.username || 'admin').trim().toLowerCase();
  const effectiveEmail = (data.adminEmail || data.email || 'admin@gasflow.so').trim().toLowerCase();
  const effectivePassword = data.adminPassword || data.password || 'gasflow1234';
  const effectivePin = data.adminPin || data.pin || effectivePassword;
  const effectiveStation = (data.stationName || 'GasFlow Gaalkacyo Main Station').trim();
  const effectiveBranch = (data.branch || 'Gaalkacyo Central').trim();
  const effectiveAddress = (data.address || 'Main Road, Gaalkacyo, Mudug, Somalia').trim();
  const effectivePhone = (data.phone || '+252 90 7000000').trim();

  const passwordHash = await hashPassword(effectivePassword);

  if (await hasPrisma()) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const station = await tx.stationConfig.create({
          data: {
            id: stationId,
            name: effectiveStation,
            branch: effectiveBranch,
            address: effectiveAddress,
            phone: effectivePhone,
            currency: data.currency || 'USD',
            currencySymbol: data.currencySymbol || '$',
            taxRate: 0
          }
        });

        const admin = await tx.user.create({
          data: {
            id: adminId,
            name: effectiveName,
            username: effectiveUsername,
            email: effectiveEmail,
            passwordHash,
            pin: effectivePin,
            role: 'admin',
            status: 'active',
            branch: effectiveBranch,
            phone: effectivePhone,
            organizationId: stationId
          }
        });

        // Initialize starter tanks
        for (const tank of starterTanks(stationId)) {
          await tx.tank.create({
            data: {
              organizationId: stationId,
              tankNumber: tank.tankNumber,
              fuelType: tank.fuelType,
              name: tank.name,
              unit: tank.fuelType === 'LPG' ? 'kg' : 'litres',
              capacity: tank.capacity,
              currentLevel: tank.currentLevel,
              unitPrice: tank.unitPrice,
              minThreshold: tank.minThreshold,
              status: tank.status,
              lastCalibrated: new Date()
            }
          });
        }

        await tx.auditLog.create({
          data: {
            organizationId: stationId,
            userId: admin.id,
            userName: admin.name,
            action: 'STATION_SETUP',
            details: `Initial bootstrap: station "${effectiveStation}" created in ${effectiveBranch}.`
          }
        });

        return {
          station: {
            id: station.id,
            name: station.name,
            branch: station.branch,
            address: station.address,
            phone: station.phone,
            taxRate: station.taxRate,
            currency: station.currency,
            currencySymbol: station.currencySymbol
          },
          user: {
            id: admin.id,
            name: admin.name,
            username: admin.username,
            email: admin.email,
            role: 'admin' as UserRole,
            status: 'active' as const,
            branch: admin.branch || undefined,
            phone: admin.phone || undefined,
            pin: '****',
            organizationId: stationId
          }
        };
      });
      return result;
    } catch (err) {
      console.error('[server-db] Prisma createStationWithAdmin failed, falling back:', err);
    }
  }

  // Local fallback
  const db = readLocalDbSync();
  const station: StationConfig = {
    id: stationId,
    name: effectiveStation,
    branch: effectiveBranch,
    address: effectiveAddress,
    phone: effectivePhone,
    taxRate: 0,
    currency: data.currency || 'USD',
    currencySymbol: data.currencySymbol || '$'
  };

  const adminRecord: ServerUserRecord = {
    id: adminId,
    name: effectiveName,
    username: effectiveUsername,
    email: effectiveEmail,
    passwordHash,
    pin: effectivePin,
    role: 'admin',
    status: 'active',
    phone: effectivePhone,
    branch: effectiveBranch,
    twoFactorEnabled: false,
    organizationId: stationId
  };

  db.stations.push(station);
  db.users.push(adminRecord);
  for (const t of starterTanks(stationId)) {
    db.tanks.push({ ...t, id: newId('tnk') });
  }
  db.auditLogs.push({
    id: newId('aud'),
    organizationId: stationId,
    userId: adminId,
    userName: effectiveName,
    action: 'STATION_SETUP',
    details: `Station ${effectiveStation} initialized.`,
    createdAt: new Date().toISOString()
  });

  writeLocalDbSync(db);
  return { station, user: sanitizeUser(adminRecord) };
}

export async function createUser(
  data: {
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
  },
  actorId?: string,
  actorName?: string
): Promise<User> {
  const passwordHash = await hashPassword(data.password);
  const orgId = data.organizationId;
  const callerName = actorName || 'Admin';
  const callerId = actorId || 'system';

  if (await hasPrisma()) {
    try {
      const u = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: data.name.trim(),
            username: data.username.trim().toLowerCase(),
            email: data.email.trim().toLowerCase(),
            passwordHash,
            pin: data.pin || data.password,
            role: data.role,
            status: data.status || 'active',
            phone: data.phone?.trim(),
            branch: data.branch?.trim(),
            organizationId: orgId
          }
        });

        await tx.auditLog.create({
          data: {
            organizationId: orgId,
            userId: callerId,
            userName: callerName,
            action: 'USER_CREATED',
            details: `Created user ${user.name} (${user.role}).`
          }
        });

        return user;
      });

      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role as UserRole,
        status: u.status as 'active' | 'inactive',
        phone: u.phone || undefined,
        branch: u.branch || undefined,
        pin: '****',
        organizationId: u.organizationId
      };
    } catch (err) {
      console.error('[server-db] Prisma createUser error:', err);
    }
  }

  const db = readLocalDbSync();
  const id = newId('usr');
  const userRecord: ServerUserRecord = {
    id,
    name: data.name.trim(),
    username: data.username.trim().toLowerCase(),
    email: data.email.trim().toLowerCase(),
    passwordHash,
    pin: data.pin || data.password,
    role: data.role,
    status: data.status || 'active',
    phone: data.phone?.trim(),
    branch: data.branch?.trim(),
    organizationId: orgId
  };

  db.users.push(userRecord);
  db.auditLogs.push({
    id: newId('aud'),
    organizationId: orgId,
    userId: callerId,
    userName: callerName,
    action: 'USER_CREATED',
    details: `Created user ${userRecord.name} (${userRecord.role}).`,
    createdAt: new Date().toISOString()
  });

  writeLocalDbSync(db);
  return sanitizeUser(userRecord);
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive',
  organizationId?: string,
  actorId?: string,
  actorName?: string
): Promise<User> {
  const callerName = actorName || 'Admin';
  const callerId = actorId || 'system';

  if (await hasPrisma()) {
    try {
      const u = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: { status }
        });

        await tx.auditLog.create({
          data: {
            organizationId: user.organizationId,
            userId: callerId,
            userName: callerName,
            action: 'USER_STATUS_CHANGE',
            details: `User ${user.name} set to ${status}.`
          }
        });

        return user;
      });

      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role as UserRole,
        status: u.status as 'active' | 'inactive',
        phone: u.phone || undefined,
        branch: u.branch || undefined,
        pin: '****',
        organizationId: u.organizationId
      };
    } catch {
      // fallback
    }
  }

  const db = readLocalDbSync();
  const u = db.users.find(x => x.id === userId);
  if (!u) throw new Error('User not found.');
  u.status = status;
  db.auditLogs.push({
    id: newId('aud'),
    organizationId: u.organizationId,
    userId: callerId,
    userName: callerName,
    action: 'USER_STATUS_CHANGE',
    details: `User ${u.name} set to ${status}.`,
    createdAt: new Date().toISOString()
  });
  writeLocalDbSync(db);
  return sanitizeUser(u);
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  if (await hasPrisma()) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      });
      return;
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  const u = db.users.find(x => x.id === userId);
  if (u) {
    u.lastLogin = new Date().toISOString();
    writeLocalDbSync(db);
  }
}

export async function listUsers(organizationId: string): Promise<User[]> {
  if (await hasPrisma()) {
    try {
      const users = await prisma.user.findMany({
        where: { organizationId }
      });
      return users.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role as UserRole,
        status: u.status as 'active' | 'inactive',
        phone: u.phone || undefined,
        branch: u.branch || undefined,
        pin: '****',
        lastLogin: u.lastLoginAt ? u.lastLoginAt.toISOString() : undefined,
        organizationId: u.organizationId
      }));
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  return db.users.filter(u => u.organizationId === organizationId).map(sanitizeUser);
}

// ── 2. TANKS & INVENTORY ─────────────────────────────────────────────────────

export async function listTanks(organizationId: string): Promise<Tank[]> {
  if (await hasPrisma()) {
    try {
      const tanks = await prisma.tank.findMany({
        where: { organizationId },
        orderBy: { tankNumber: 'asc' }
      });
      return tanks.map(t => ({
        id: t.id,
        tankNumber: t.tankNumber,
        fuelType: t.fuelType as FuelTypeCode,
        name: t.name,
        capacity: t.capacity,
        currentLevel: t.currentLevel,
        unitPrice: t.unitPrice,
        minThreshold: t.minThreshold,
        status: t.status as 'normal' | 'low' | 'critical',
        lastCalibrated: t.lastCalibrated ? t.lastCalibrated.toISOString().split('T')[0] : undefined,
        organizationId: t.organizationId
      }));
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  return db.tanks.filter(t => t.organizationId === organizationId);
}

export async function findTankById(id: string, organizationId: string): Promise<Tank | null> {
  if (await hasPrisma()) {
    try {
      const t = await prisma.tank.findFirst({
        where: { id, organizationId }
      });
      if (!t) return null;
      return {
        id: t.id,
        tankNumber: t.tankNumber,
        fuelType: t.fuelType as FuelTypeCode,
        name: t.name,
        capacity: t.capacity,
        currentLevel: t.currentLevel,
        unitPrice: t.unitPrice,
        minThreshold: t.minThreshold,
        status: t.status as 'normal' | 'low' | 'critical',
        lastCalibrated: t.lastCalibrated ? t.lastCalibrated.toISOString().split('T')[0] : undefined,
        organizationId: t.organizationId
      };
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  return db.tanks.find(t => t.id === id && t.organizationId === organizationId) || null;
}

export async function createTank(
  organizationId: string,
  data: Omit<Tank, 'id' | 'organizationId'>
): Promise<Tank> {
  if (await hasPrisma()) {
    try {
      const t = await prisma.tank.create({
        data: {
          organizationId,
          tankNumber: data.tankNumber.trim(),
          fuelType: data.fuelType,
          name: data.name.trim(),
          unit: data.fuelType === 'LPG' ? 'kg' : 'litres',
          capacity: data.capacity,
          currentLevel: data.currentLevel,
          unitPrice: data.unitPrice,
          minThreshold: data.minThreshold,
          status: data.status || 'normal',
          lastCalibrated: data.lastCalibrated ? new Date(data.lastCalibrated) : new Date()
        }
      });
      return {
        id: t.id,
        tankNumber: t.tankNumber,
        fuelType: t.fuelType as FuelTypeCode,
        name: t.name,
        capacity: t.capacity,
        currentLevel: t.currentLevel,
        unitPrice: t.unitPrice,
        minThreshold: t.minThreshold,
        status: t.status as 'normal' | 'low' | 'critical',
        lastCalibrated: t.lastCalibrated ? t.lastCalibrated.toISOString().split('T')[0] : undefined,
        organizationId: t.organizationId
      };
    } catch (err) {
      console.error('[server-db] Prisma createTank error:', err);
    }
  }

  const db = readLocalDbSync();
  const newTank: Tank = {
    ...data,
    id: newId('tnk'),
    organizationId
  };
  db.tanks.push(newTank);
  writeLocalDbSync(db);
  return newTank;
}

export async function updateTankPrice(
  tankId: string,
  newPrice: number,
  userIdOrActor?: string | { id: string; name: string },
  userName?: string,
  organizationId?: string
): Promise<Tank> {
  if (newPrice <= 0) throw new Error('Price must be greater than zero.');

  const actorId = typeof userIdOrActor === 'object' ? userIdOrActor.id : (userIdOrActor || 'system');
  const actorName = typeof userIdOrActor === 'object' ? userIdOrActor.name : (userName || 'Admin');
  const orgId = organizationId || 'st_001';

  if (await hasPrisma()) {
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const old = await tx.tank.findFirst({ where: { id: tankId } });
        if (!old) throw new Error('Tank not found.');

        const tank = await tx.tank.update({
          where: { id: tankId },
          data: { unitPrice: newPrice }
        });

        await tx.auditLog.create({
          data: {
            organizationId: tank.organizationId,
            userId: actorId,
            userName: actorName,
            action: 'TANK_PRICE_UPDATE',
            details: `Updated ${tank.name} price from $${old.unitPrice.toFixed(2)} to $${newPrice.toFixed(2)}.`
          }
        });

        return tank;
      });

      return {
        id: updated.id,
        tankNumber: updated.tankNumber,
        fuelType: updated.fuelType as FuelTypeCode,
        name: updated.name,
        capacity: updated.capacity,
        currentLevel: updated.currentLevel,
        unitPrice: updated.unitPrice,
        minThreshold: updated.minThreshold,
        status: updated.status as 'normal' | 'low' | 'critical',
        organizationId: updated.organizationId
      };
    } catch {
      // fallback
    }
  }

  const db = readLocalDbSync();
  const tank = db.tanks.find(t => t.id === tankId && (t.organizationId === orgId || !organizationId));
  if (!tank) throw new Error('Tank not found.');
  const oldPrice = tank.unitPrice;
  tank.unitPrice = newPrice;
  db.auditLogs.push({
    id: newId('aud'),
    organizationId: tank.organizationId || orgId,
    userId: actorId,
    userName: actorName,
    action: 'TANK_PRICE_UPDATE',
    details: `Updated ${tank.name} price from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}.`,
    createdAt: new Date().toISOString()
  });
  writeLocalDbSync(db);
  return tank;
}

export async function calibrateTank(
  tankId: string,
  measuredLevelOrOrgId: number | string,
  measuredOrNote?: number | string,
  noteOrUserId?: string,
  actorOrUserName?: string | { id: string; name: string },
  finalOrgId?: string
): Promise<Tank> {
  let measuredLevel: number;
  let note: string | undefined;
  let actorId = 'system';
  let actorName = 'Admin';
  let orgId = finalOrgId || 'st_001';

  if (typeof measuredLevelOrOrgId === 'number') {
    measuredLevel = measuredLevelOrOrgId;
    note = typeof measuredOrNote === 'string' ? measuredOrNote : undefined;
    actorId = noteOrUserId || 'system';
    actorName = typeof actorOrUserName === 'string' ? actorOrUserName : (actorOrUserName?.name || 'Admin');
  } else {
    orgId = measuredLevelOrOrgId;
    measuredLevel = typeof measuredOrNote === 'number' ? measuredOrNote : 0;
    note = noteOrUserId;
    if (typeof actorOrUserName === 'object' && actorOrUserName !== null) {
      actorId = actorOrUserName.id;
      actorName = actorOrUserName.name;
    }
  }

  if (await hasPrisma()) {
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const old = await tx.tank.findFirst({ where: { id: tankId } });
        if (!old) throw new Error('Tank not found.');

        const diff = measuredLevel - old.currentLevel;
        let newStatus: 'normal' | 'low' | 'critical' = 'normal';
        if (measuredLevel < old.minThreshold * 0.5) newStatus = 'critical';
        else if (measuredLevel < old.minThreshold) newStatus = 'low';

        const tank = await tx.tank.update({
          where: { id: tankId },
          data: {
            currentLevel: measuredLevel,
            status: newStatus,
            lastCalibrated: new Date()
          }
        });

        await tx.inventoryMovement.create({
          data: {
            organizationId: tank.organizationId,
            tankId: tank.id,
            fuelType: tank.fuelType,
            type: diff >= 0 ? 'adjustment' : 'loss',
            quantity: diff,
            previousLevel: old.currentLevel,
            newLevel: measuredLevel,
            referenceId: newId('cal'),
            note: note || `Manual Dipstick Calibration by ${actorName}`
          }
        });

        await tx.auditLog.create({
          data: {
            organizationId: tank.organizationId,
            userId: actorId,
            userName: actorName,
            action: 'TANK_CALIBRATED',
            details: `Calibrated ${tank.name}: level set from ${old.currentLevel.toFixed(1)}L to ${measuredLevel.toFixed(1)}L (diff: ${diff.toFixed(1)}L).`
          }
        });

        return tank;
      });

      return {
        id: updated.id,
        tankNumber: updated.tankNumber,
        fuelType: updated.fuelType as FuelTypeCode,
        name: updated.name,
        capacity: updated.capacity,
        currentLevel: updated.currentLevel,
        unitPrice: updated.unitPrice,
        minThreshold: updated.minThreshold,
        status: updated.status as 'normal' | 'low' | 'critical',
        lastCalibrated: updated.lastCalibrated ? updated.lastCalibrated.toISOString().split('T')[0] : undefined,
        organizationId: updated.organizationId
      };
    } catch {
      // fallback
    }
  }

  const db = readLocalDbSync();
  const tank = db.tanks.find(t => t.id === tankId);
  if (!tank) throw new Error('Tank not found.');
  const prevLevel = tank.currentLevel;
  tank.currentLevel = measuredLevel;
  tank.lastCalibrated = new Date().toISOString().split('T')[0];
  if (measuredLevel < tank.minThreshold * 0.5) tank.status = 'critical';
  else if (measuredLevel < tank.minThreshold) tank.status = 'low';
  else tank.status = 'normal';

  const diff = measuredLevel - prevLevel;
  db.movements.push({
    id: newId('mov'),
    organizationId: tank.organizationId || orgId,
    tankId: tank.id,
    fuelType: tank.fuelType,
    type: diff >= 0 ? 'adjustment' : 'loss',
    quantity: diff,
    previousLevel: prevLevel,
    newLevel: measuredLevel,
    referenceId: newId('cal'),
    note: note || `Manual Dipstick Calibration by ${actorName}`,
    createdAt: new Date().toISOString()
  });

  db.auditLogs.push({
    id: newId('aud'),
    organizationId: tank.organizationId || orgId,
    userId: actorId,
    userName: actorName,
    action: 'TANK_CALIBRATED',
    details: `Calibrated ${tank.name}: level set from ${prevLevel.toFixed(1)}L to ${measuredLevel.toFixed(1)}L.`,
    createdAt: new Date().toISOString()
  });

  writeLocalDbSync(db);
  return tank;
}

// ── 3. SALES & POS ATOMIC TRANSACTIONS ────────────────────────────────────────

export async function createSaleTransaction(data: {
  stationId?: string;
  organizationId?: string;
  deviceId?: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  fuelType: FuelTypeCode;
  tankId: string;
  litres: number;
  unitPrice: number;
  totalAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'paid' | 'pending';
}): Promise<{ sale: Sale; totalAmount: number; tank: Tank } & Sale> {
  const orgId = data.organizationId || data.stationId || 'st_001';
  const calculatedTotal = data.totalAmount ?? Number((data.litres * data.unitPrice).toFixed(2));

  if (await hasPrisma()) {
    try {
      const transactionResult = await prisma.$transaction(async (tx) => {
        // 1. Verify Tank & Stock
        const tankRecord = await tx.tank.findFirst({
          where: { id: data.tankId }
        });
        if (!tankRecord) throw new Error('Designated fuel tank not found.');
        if (tankRecord.currentLevel < data.litres) {
          throw new Error(`Insufficient fuel in ${tankRecord.name}. Available: ${tankRecord.currentLevel.toFixed(1)}L, requested: ${data.litres.toFixed(1)}L.`);
        }

        // 2. Decrement Tank Level
        const newLevel = tankRecord.currentLevel - data.litres;
        let newStatus: 'normal' | 'low' | 'critical' = 'normal';
        if (newLevel < tankRecord.minThreshold * 0.5) newStatus = 'critical';
        else if (newLevel < tankRecord.minThreshold) newStatus = 'low';

        const updatedTank = await tx.tank.update({
          where: { id: tankRecord.id },
          data: {
            currentLevel: newLevel,
            status: newStatus
          }
        });

        // 3. Customer Debt Tracking (if credit)
        let resolvedCustomerName = data.customerName;
        if (data.customerId) {
          const cust = await tx.customer.findFirst({
            where: { id: data.customerId }
          });
          if (cust) {
            resolvedCustomerName = cust.name;
            if (data.paymentMethod === 'credit') {
              if (cust.currentBalance + calculatedTotal > cust.creditLimit) {
                throw new Error(`Credit limit exceeded for ${cust.name}. Limit: $${cust.creditLimit}, current balance: $${cust.currentBalance}.`);
              }
              await tx.customer.update({
                where: { id: cust.id },
                data: { currentBalance: cust.currentBalance + calculatedTotal }
              });
            }
          }
        }

        // 4. Create Sale Record
        const saleCount = await tx.sale.count({ where: { stationId: orgId } });
        const saleNumber = `INV-${String(saleCount + 1).padStart(5, '0')}`;

        const saleRecord = await tx.sale.create({
          data: {
            saleNumber,
            stationId: orgId,
            deviceId: data.deviceId || 'main_pos',
            cashierId: data.cashierId,
            cashierName: data.cashierName,
            customerId: data.customerId || null,
            customerName: resolvedCustomerName || null,
            fuelType: data.fuelType,
            tankId: data.tankId,
            litres: data.litres,
            unitPrice: data.unitPrice,
            totalAmount: calculatedTotal,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus || 'paid',
            syncStatus: 'synced'
          }
        });

        // 5. Inventory Movement Audit
        await tx.inventoryMovement.create({
          data: {
            organizationId: orgId,
            tankId: tankRecord.id,
            fuelType: data.fuelType,
            type: 'sale',
            quantity: -data.litres,
            previousLevel: tankRecord.currentLevel,
            newLevel,
            referenceId: saleRecord.id,
            note: `POS Dispensed #${saleRecord.saleNumber}`
          }
        });

        // 6. Audit Log
        await tx.auditLog.create({
          data: {
            organizationId: orgId,
            userId: data.cashierId,
            userName: data.cashierName,
            action: 'SALE_CREATED',
            details: `Sale ${saleRecord.saleNumber}: ${data.litres}L of ${data.fuelType} for $${calculatedTotal.toFixed(2)} (${data.paymentMethod.toUpperCase()}).`
          }
        });

        const formattedSale: Sale = {
          id: saleRecord.id,
          saleNumber: saleRecord.saleNumber,
          stationId: saleRecord.stationId,
          deviceId: saleRecord.deviceId,
          cashierId: saleRecord.cashierId,
          cashierName: saleRecord.cashierName || data.cashierName,
          customerId: saleRecord.customerId || undefined,
          customerName: saleRecord.customerName || undefined,
          fuelType: saleRecord.fuelType as FuelTypeCode,
          tankId: saleRecord.tankId,
          litres: saleRecord.litres,
          unitPrice: saleRecord.unitPrice,
          totalAmount: saleRecord.totalAmount,
          paymentMethod: saleRecord.paymentMethod as PaymentMethod,
          paymentStatus: saleRecord.paymentStatus as 'paid' | 'pending' | 'voided',
          createdAt: saleRecord.createdAt.toISOString(),
          syncStatus: 'synced'
        };

        const formattedTank: Tank = {
          id: updatedTank.id,
          tankNumber: updatedTank.tankNumber,
          fuelType: updatedTank.fuelType as FuelTypeCode,
          name: updatedTank.name,
          capacity: updatedTank.capacity,
          currentLevel: updatedTank.currentLevel,
          unitPrice: updatedTank.unitPrice,
          minThreshold: updatedTank.minThreshold,
          status: updatedTank.status as 'normal' | 'low' | 'critical',
          organizationId: updatedTank.organizationId
        };

        return {
          ...formattedSale,
          sale: formattedSale,
          totalAmount: calculatedTotal,
          tank: formattedTank
        };
      });

      return transactionResult;
    } catch (err) {
      console.error('[server-db] Prisma createSaleTransaction failed, falling back:', err);
    }
  }

  // Local fallback
  const db = readLocalDbSync();
  const tank = db.tanks.find(t => t.id === data.tankId);
  if (!tank) throw new Error('Tank not found.');
  if (tank.currentLevel < data.litres) throw new Error('Insufficient fuel in tank.');

  const prevLevel = tank.currentLevel;
  tank.currentLevel -= data.litres;
  if (tank.currentLevel < tank.minThreshold * 0.5) tank.status = 'critical';
  else if (tank.currentLevel < tank.minThreshold) tank.status = 'low';

  const saleNumber = `INV-${String(db.sales.filter(s => s.stationId === orgId).length + 1).padStart(5, '0')}`;
  const sale: Sale = {
    id: newId('sal'),
    saleNumber,
    stationId: orgId,
    deviceId: data.deviceId || 'main_pos',
    cashierId: data.cashierId,
    cashierName: data.cashierName,
    customerId: data.customerId,
    customerName: data.customerName,
    fuelType: data.fuelType,
    tankId: data.tankId,
    litres: data.litres,
    unitPrice: data.unitPrice,
    totalAmount: calculatedTotal,
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentStatus || 'paid',
    createdAt: new Date().toISOString(),
    syncStatus: 'synced'
  };

  db.sales.push(sale);
  db.movements.push({
    id: newId('mov'),
    organizationId: orgId,
    tankId: tank.id,
    fuelType: data.fuelType,
    type: 'sale',
    quantity: -data.litres,
    previousLevel: prevLevel,
    newLevel: tank.currentLevel,
    referenceId: sale.id,
    note: `Sale #${sale.saleNumber}`,
    createdAt: new Date().toISOString()
  });

  if (data.customerId && data.paymentMethod === 'credit') {
    const cust = db.customers.find(c => c.id === data.customerId);
    if (cust) cust.currentBalance += calculatedTotal;
  }

  db.auditLogs.push({
    id: newId('aud'),
    organizationId: orgId,
    userId: data.cashierId,
    userName: data.cashierName,
    action: 'SALE_CREATED',
    details: `Sale ${sale.saleNumber}: ${data.litres}L of ${data.fuelType} for $${calculatedTotal.toFixed(2)}.`,
    createdAt: new Date().toISOString()
  });

  writeLocalDbSync(db);
  return {
    ...sale,
    sale,
    totalAmount: calculatedTotal,
    tank
  };
}

export async function voidSaleTransaction(
  saleId: string,
  reasonOrOrgId: string,
  userNameOrReason?: string,
  userId?: string,
  finalOrgId?: string
): Promise<Sale> {
  let reason = reasonOrOrgId;
  let actorName = 'Admin';
  let actorId = 'system';
  let orgId = finalOrgId || 'st_001';

  if (userNameOrReason && userId) {
    reason = userNameOrReason;
    actorName = userNameOrReason;
    actorId = userId;
  }

  if (await hasPrisma()) {
    try {
      const voided = await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.findFirst({
          where: { id: saleId }
        });
        if (!sale) throw new Error('Sale record not found.');
        if (sale.paymentStatus === 'voided') throw new Error('This sale is already voided.');

        // Reversal of tank level
        const tank = await tx.tank.findFirst({
          where: { id: sale.tankId }
        });
        if (tank) {
          const restoredLevel = Math.min(tank.capacity, tank.currentLevel + sale.litres);
          await tx.tank.update({
            where: { id: tank.id },
            data: { currentLevel: restoredLevel }
          });

          await tx.inventoryMovement.create({
            data: {
              organizationId: sale.stationId,
              tankId: tank.id,
              fuelType: sale.fuelType,
              type: 'adjustment',
              quantity: sale.litres,
              previousLevel: tank.currentLevel,
              newLevel: restoredLevel,
              referenceId: sale.id,
              note: `Void Reversal for Sale #${sale.saleNumber}`
            }
          });
        }

        // Reversal of customer balance if credit
        if (sale.customerId && sale.paymentMethod === 'credit') {
          const cust = await tx.customer.findFirst({
            where: { id: sale.customerId }
          });
          if (cust) {
            await tx.customer.update({
              where: { id: cust.id },
              data: { currentBalance: Math.max(0, cust.currentBalance - sale.totalAmount) }
            });
          }
        }

        const updated = await tx.sale.update({
          where: { id: sale.id },
          data: {
            paymentStatus: 'voided',
            voidReason: reason,
            voidedBy: actorName,
            voidedAt: new Date()
          }
        });

        await tx.auditLog.create({
          data: {
            organizationId: sale.stationId,
            userId: actorId,
            userName: actorName,
            action: 'SALE_VOIDED',
            details: `Voided sale #${sale.saleNumber} ($${sale.totalAmount.toFixed(2)}): ${reason}`
          }
        });

        return updated;
      });

      return {
        id: voided.id,
        saleNumber: voided.saleNumber,
        stationId: voided.stationId,
        deviceId: voided.deviceId,
        cashierId: voided.cashierId,
        cashierName: voided.cashierName || 'Staff',
        customerId: voided.customerId || undefined,
        customerName: voided.customerName || undefined,
        fuelType: voided.fuelType as FuelTypeCode,
        tankId: voided.tankId,
        litres: voided.litres,
        unitPrice: voided.unitPrice,
        totalAmount: voided.totalAmount,
        paymentMethod: voided.paymentMethod as PaymentMethod,
        paymentStatus: 'voided',
        voidReason: voided.voidReason || undefined,
        voidedBy: voided.voidedBy || undefined,
        voidedAt: voided.voidedAt ? voided.voidedAt.toISOString() : undefined,
        createdAt: voided.createdAt.toISOString(),
        syncStatus: 'synced'
      };
    } catch {
      // fallback
    }
  }

  const db = readLocalDbSync();
  const sale = db.sales.find(s => s.id === saleId);
  if (!sale) throw new Error('Sale not found.');
  if (sale.paymentStatus === 'voided') throw new Error('Already voided.');

  sale.paymentStatus = 'voided';
  sale.voidReason = reason;
  sale.voidedBy = actorName;
  sale.voidedAt = new Date().toISOString();

  const tank = db.tanks.find(t => t.id === sale.tankId);
  if (tank) {
    const prev = tank.currentLevel;
    tank.currentLevel = Math.min(tank.capacity, tank.currentLevel + sale.litres);
    db.movements.push({
      id: newId('mov'),
      organizationId: sale.stationId,
      tankId: tank.id,
      fuelType: sale.fuelType,
      type: 'adjustment',
      quantity: sale.litres,
      previousLevel: prev,
      newLevel: tank.currentLevel,
      referenceId: sale.id,
      note: `Void Reversal for Sale #${sale.saleNumber}`,
      createdAt: new Date().toISOString()
    });
  }

  if (sale.customerId && sale.paymentMethod === 'credit') {
    const cust = db.customers.find(c => c.id === sale.customerId);
    if (cust) cust.currentBalance = Math.max(0, cust.currentBalance - sale.totalAmount);
  }

  db.auditLogs.push({
    id: newId('aud'),
    organizationId: sale.stationId,
    userId: actorId,
    userName: actorName,
    action: 'SALE_VOIDED',
    details: `Voided sale #${sale.saleNumber}: ${reason}`,
    createdAt: new Date().toISOString()
  });

  writeLocalDbSync(db);
  return sale;
}

export async function recordDeliveryTransaction(data: {
  organizationId: string;
  tankId: string;
  fuelType?: FuelTypeCode;
  litres: number;
  costPerLitre: number;
  totalCost: number;
  supplier: string;
  invoiceNumber: string;
  receivedBy?: string;
  receivedById?: string;
  receivedByName?: string;
  dipstickBefore?: number;
  dipstickAfter?: number;
}): Promise<{ delivery: FuelDelivery; tank: Tank }> {
  const orgId = data.organizationId;
  const staffName = data.receivedByName || data.receivedBy || 'Staff';

  if (await hasPrisma()) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const tank = await tx.tank.findFirst({
          where: { id: data.tankId }
        });
        if (!tank) throw new Error('Tank not found.');

        const newLevel = Math.min(tank.capacity, tank.currentLevel + data.litres);
        const updatedTank = await tx.tank.update({
          where: { id: tank.id },
          data: {
            currentLevel: newLevel,
            status: 'normal'
          }
        });

        // Resolve staff user
        const staff = await tx.user.findFirst({ where: { organizationId: orgId } });
        const receivedById = data.receivedById || (staff ? staff.id : newId('usr'));

        const d = await tx.fuelDelivery.create({
          data: {
            organizationId: orgId,
            tankId: tank.id,
            fuelType: data.fuelType || tank.fuelType,
            litres: data.litres,
            costPerLitre: data.costPerLitre,
            totalCost: data.totalCost,
            supplier: data.supplier.trim(),
            invoiceNumber: data.invoiceNumber.trim(),
            receivedById,
            dipstickBefore: data.dipstickBefore,
            dipstickAfter: data.dipstickAfter
          }
        });

        await tx.inventoryMovement.create({
          data: {
            organizationId: orgId,
            tankId: tank.id,
            fuelType: tank.fuelType,
            type: 'delivery',
            quantity: data.litres,
            previousLevel: tank.currentLevel,
            newLevel,
            referenceId: d.id,
            note: `Delivery from ${data.supplier} (Inv #${data.invoiceNumber})`
          }
        });

        await tx.auditLog.create({
          data: {
            organizationId: orgId,
            userName: staffName,
            action: 'FUEL_DELIVERY',
            details: `Received ${data.litres}L of ${tank.fuelType} into ${tank.name} from ${data.supplier}.`
          }
        });

        const formattedDelivery: FuelDelivery = {
          id: d.id,
          tankId: d.tankId,
          fuelType: d.fuelType as FuelTypeCode,
          litres: d.litres,
          costPerLitre: d.costPerLitre,
          totalCost: d.totalCost,
          supplier: d.supplier,
          invoiceNumber: d.invoiceNumber,
          receivedBy: staffName,
          receivedAt: d.receivedAt.toISOString(),
          dipstickBefore: d.dipstickBefore || 0,
          dipstickAfter: d.dipstickAfter || 0,
          organizationId: d.organizationId
        };

        const formattedTank: Tank = {
          id: updatedTank.id,
          tankNumber: updatedTank.tankNumber,
          fuelType: updatedTank.fuelType as FuelTypeCode,
          name: updatedTank.name,
          capacity: updatedTank.capacity,
          currentLevel: updatedTank.currentLevel,
          unitPrice: updatedTank.unitPrice,
          minThreshold: updatedTank.minThreshold,
          status: updatedTank.status as 'normal' | 'low' | 'critical',
          organizationId: updatedTank.organizationId
        };

        return { delivery: formattedDelivery, tank: formattedTank };
      });

      return result;
    } catch {
      // fallback
    }
  }

  const db = readLocalDbSync();
  const tank = db.tanks.find(t => t.id === data.tankId);
  if (!tank) throw new Error('Tank not found.');

  const prev = tank.currentLevel;
  tank.currentLevel = Math.min(tank.capacity, tank.currentLevel + data.litres);
  tank.status = 'normal';

  const d: FuelDelivery = {
    id: newId('del'),
    tankId: data.tankId,
    fuelType: data.fuelType || tank.fuelType,
    litres: data.litres,
    costPerLitre: data.costPerLitre,
    totalCost: data.totalCost,
    supplier: data.supplier,
    invoiceNumber: data.invoiceNumber,
    receivedBy: staffName,
    receivedAt: new Date().toISOString(),
    dipstickBefore: data.dipstickBefore || prev,
    dipstickAfter: data.dipstickAfter || tank.currentLevel,
    organizationId: orgId
  };

  db.deliveries.push(d);
  db.movements.push({
    id: newId('mov'),
    organizationId: orgId,
    tankId: tank.id,
    fuelType: d.fuelType,
    type: 'delivery',
    quantity: data.litres,
    previousLevel: prev,
    newLevel: tank.currentLevel,
    referenceId: d.id,
    note: `Delivery from ${data.supplier}`,
    createdAt: new Date().toISOString()
  });

  db.auditLogs.push({
    id: newId('aud'),
    organizationId: orgId,
    userId: 'system',
    userName: staffName,
    action: 'FUEL_DELIVERY',
    details: `Delivery: ${data.litres}L to ${tank.name}.`,
    createdAt: new Date().toISOString()
  });

  writeLocalDbSync(db);
  return { delivery: d, tank };
}

// ── 4. CUSTOMERS & CREDIT LEDGER ──────────────────────────────────────────────

export async function listCustomers(organizationId: string): Promise<Customer[]> {
  if (await hasPrisma()) {
    try {
      const customers = await prisma.customer.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' }
      });
      return customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email || undefined,
        company: c.company || undefined,
        creditLimit: c.creditLimit,
        currentBalance: c.currentBalance,
        status: (c.status as 'active' | 'suspended') || 'active',
        createdAt: c.createdAt.toISOString().split('T')[0],
        organizationId: c.organizationId
      }));
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  return db.customers.filter(c => c.organizationId === organizationId);
}

export async function createCustomer(
  organizationId: string,
  data: Omit<Customer, 'id' | 'organizationId' | 'createdAt' | 'currentBalance' | 'status'> & { status?: 'active' | 'suspended' },
  actor?: { id: string; name: string }
): Promise<Customer> {
  const actorId = actor?.id || 'system';
  const actorName = actor?.name || 'Staff';

  if (await hasPrisma()) {
    try {
      const c = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.create({
          data: {
            organizationId,
            name: data.name.trim(),
            phone: data.phone.trim(),
            email: data.email?.trim(),
            company: data.company?.trim(),
            creditLimit: data.creditLimit || 500,
            currentBalance: 0,
            status: data.status || 'active'
          }
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            userId: actorId,
            userName: actorName,
            action: 'CUSTOMER_CREATED',
            details: `Created customer account for ${customer.name} (Limit: $${customer.creditLimit}).`
          }
        });

        return customer;
      });

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email || undefined,
        company: c.company || undefined,
        creditLimit: c.creditLimit,
        currentBalance: c.currentBalance,
        status: (c.status as 'active' | 'suspended') || 'active',
        createdAt: c.createdAt.toISOString().split('T')[0],
        organizationId: c.organizationId
      };
    } catch {
      // fallback
    }
  }

  const db = readLocalDbSync();
  const newCust: Customer = {
    ...data,
    status: data.status || 'active',
    id: newId('cus'),
    organizationId,
    currentBalance: 0,
    createdAt: new Date().toISOString().split('T')[0]
  };
  db.customers.push(newCust);
  db.auditLogs.push({
    id: newId('aud'),
    organizationId,
    userId: actorId,
    userName: actorName,
    action: 'CUSTOMER_CREATED',
    details: `Customer ${newCust.name} created.`,
    createdAt: new Date().toISOString()
  });
  writeLocalDbSync(db);
  return newCust;
}

export async function recordCustomerPaymentTransaction(data: {
  customerId: string;
  organizationId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  collectedBy?: string;
  receivedBy?: string;
  userId?: string;
  note?: string;
}): Promise<CustomerPayment> {
  const orgId = data.organizationId;
  const staffName = data.receivedBy || data.collectedBy || 'Staff';

  if (await hasPrisma()) {
    try {
      const payment = await prisma.$transaction(async (tx) => {
        const cust = await tx.customer.findFirst({
          where: { id: data.customerId }
        });
        if (!cust) throw new Error('Customer account not found.');

        const newBalance = Math.max(0, cust.currentBalance - data.amount);
        await tx.customer.update({
          where: { id: cust.id },
          data: { currentBalance: newBalance }
        });

        const pay = await tx.customerPayment.create({
          data: {
            organizationId: orgId,
            customerId: cust.id,
            customerName: cust.name,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            reference: data.reference,
            collectedBy: staffName,
            note: data.note
          }
        });

        await tx.auditLog.create({
          data: {
            organizationId: orgId,
            userName: staffName,
            action: 'CUSTOMER_PAYMENT',
            details: `Received debt payment of $${data.amount.toFixed(2)} from ${cust.name}. New balance: $${newBalance.toFixed(2)}.`
          }
        });

        return pay;
      });

      return {
        id: payment.id,
        customerId: payment.customerId,
        customerName: payment.customerName || 'Customer',
        amount: payment.amount,
        paymentMethod: payment.paymentMethod as PaymentMethod,
        reference: payment.reference || undefined,
        collectedBy: payment.collectedBy,
        createdAt: payment.createdAt.toISOString(),
        organizationId: payment.organizationId
      };
    } catch {
      // fallback
    }
  }

  const db = readLocalDbSync();
  const cust = db.customers.find(c => c.id === data.customerId);
  if (!cust) throw new Error('Customer not found.');

  cust.currentBalance = Math.max(0, cust.currentBalance - data.amount);
  const p: CustomerPayment = {
    id: newId('pay'),
    customerId: cust.id,
    customerName: cust.name,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    reference: data.reference,
    collectedBy: staffName,
    createdAt: new Date().toISOString(),
    organizationId: orgId
  };

  db.customerPayments.push(p);
  db.auditLogs.push({
    id: newId('aud'),
    organizationId: orgId,
    userId: 'system',
    userName: staffName,
    action: 'CUSTOMER_PAYMENT',
    details: `Customer payment: $${data.amount} from ${cust.name}.`,
    createdAt: new Date().toISOString()
  });

  writeLocalDbSync(db);
  return p;
}

// ── 5. EXPENSES & FINANCE ─────────────────────────────────────────────────────

export async function listExpenses(organizationId: string): Promise<Expense[]> {
  if (await hasPrisma()) {
    try {
      const expenses = await prisma.expense.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      });
      return expenses.map(e => ({
        id: e.id,
        category: e.category as ExpenseCategory,
        description: e.description,
        amount: e.amount,
        addedBy: e.addedBy,
        receiptNumber: e.receiptNumber || undefined,
        createdAt: e.createdAt.toISOString(),
        organizationId: e.organizationId
      }));
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  return db.expenses.filter(e => e.organizationId === organizationId);
}

export async function createExpenseTransaction(
  organizationId: string,
  data: Omit<Expense, 'id' | 'organizationId' | 'createdAt'>,
  actorId?: string,
  actorName?: string
): Promise<Expense> {
  const callerName = actorName || 'Staff';
  const callerId = actorId || 'system';

  if (await hasPrisma()) {
    try {
      const exp = await prisma.$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            organizationId,
            category: data.category,
            description: data.description.trim(),
            amount: data.amount,
            addedBy: data.addedBy || callerName,
            receiptNumber: data.receiptNumber?.trim()
          }
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            userId: callerId,
            userName: callerName,
            action: 'EXPENSE_RECORDED',
            details: `Expense $${data.amount.toFixed(2)} (${data.category}): ${data.description}`
          }
        });

        return expense;
      });

      return {
        id: exp.id,
        category: exp.category as ExpenseCategory,
        description: exp.description,
        amount: exp.amount,
        addedBy: exp.addedBy,
        receiptNumber: exp.receiptNumber || undefined,
        createdAt: exp.createdAt.toISOString(),
        organizationId: exp.organizationId
      };
    } catch {
      // fallback
    }
  }

  const db = readLocalDbSync();
  const e: Expense = {
    ...data,
    id: newId('exp'),
    organizationId,
    createdAt: new Date().toISOString()
  };
  db.expenses.push(e);
  db.auditLogs.push({
    id: newId('aud'),
    organizationId,
    userId: callerId,
    userName: callerName,
    action: 'EXPENSE_RECORDED',
    details: `Expense $${e.amount} (${e.category}): ${e.description}`,
    createdAt: new Date().toISOString()
  });
  writeLocalDbSync(db);
  return e;
}

// ── 6. AUDIT LOGS & STATION SETTINGS ──────────────────────────────────────────

export async function listAuditLogs(organizationId: string, limit = 100): Promise<AuditLog[]> {
  if (await hasPrisma()) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      return logs.map(l => ({
        id: l.id,
        userId: l.userId || 'system',
        userName: l.userName,
        action: l.action,
        details: l.details,
        ipAddress: l.ipAddress || undefined,
        createdAt: l.createdAt.toISOString(),
        organizationId: l.organizationId
      }));
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  return db.auditLogs.filter(l => l.organizationId === organizationId).slice(-limit).reverse();
}

export async function getStationConfig(organizationId: string): Promise<StationConfig> {
  if (await hasPrisma()) {
    try {
      const st = await prisma.stationConfig.findUnique({
        where: { id: organizationId }
      });
      if (st) {
        return {
          id: st.id,
          name: st.name,
          branch: st.branch,
          address: st.address,
          phone: st.phone,
          taxRate: st.taxRate,
          currency: st.currency,
          currencySymbol: st.currencySymbol
        };
      }
    } catch {
      // fallback
    }
  }
  const db = readLocalDbSync();
  const station = db.stations.find(s => s.id === organizationId);
  if (!station) {
    return {
      id: organizationId,
      name: 'GasFlow Station Gaalkacyo',
      branch: 'Gaalkacyo Central',
      address: 'Main Street, Gaalkacyo, Mudug, Somalia',
      phone: '+252 90 7000000',
      taxRate: 0,
      currency: 'USD',
      currencySymbol: '$'
    };
  }
  return station;
}

export async function updateStationConfig(
  organizationId: string,
  updates: Partial<StationConfig>,
  actor?: { id: string; name: string }
): Promise<StationConfig> {
  const actorId = actor?.id || 'system';
  const actorName = actor?.name || 'Admin';

  if (await hasPrisma()) {
    try {
      const st = await prisma.$transaction(async (tx) => {
        const station = await tx.stationConfig.update({
          where: { id: organizationId },
          data: {
            name: updates.name,
            branch: updates.branch,
            address: updates.address,
            phone: updates.phone,
            taxRate: updates.taxRate,
            currency: updates.currency,
            currencySymbol: updates.currencySymbol
          }
        });

        await tx.auditLog.create({
          data: {
            organizationId,
            userId: actorId,
            userName: actorName,
            action: 'STATION_CONFIG_UPDATE',
            details: `Updated station settings for ${station.name}.`
          }
        });

        return station;
      });

      return {
        id: st.id,
        name: st.name,
        branch: st.branch,
        address: st.address,
        phone: st.phone,
        taxRate: st.taxRate,
        currency: st.currency,
        currencySymbol: st.currencySymbol
      };
    } catch {
      // fallback
    }
  }

  const db = readLocalDbSync();
  const station = db.stations.find(s => s.id === organizationId);
  if (!station) throw new Error('Station not found.');
  Object.assign(station, updates);
  db.auditLogs.push({
    id: newId('aud'),
    organizationId,
    userId: actorId,
    userName: actorName,
    action: 'STATION_CONFIG_UPDATE',
    details: `Updated station settings.`,
    createdAt: new Date().toISOString()
  });
  writeLocalDbSync(db);
  return station;
}

export async function getTenantState(organizationId: string): Promise<TenantState> {
  const [station, users, tanks, customers, expenses, logs] = await Promise.all([
    getStationConfig(organizationId),
    listUsers(organizationId),
    listTanks(organizationId),
    listCustomers(organizationId),
    listExpenses(organizationId),
    listAuditLogs(organizationId, 100)
  ]);

  let sales: Sale[] = [];
  let deliveries: FuelDelivery[] = [];
  let movements: InventoryMovement[] = [];
  let customerPayments: CustomerPayment[] = [];

  if (await hasPrisma()) {
    try {
      const [salesDb, delDb, movDb, payDb] = await Promise.all([
        prisma.sale.findMany({ where: { stationId: organizationId }, orderBy: { createdAt: 'desc' }, take: 200 }),
        prisma.fuelDelivery.findMany({ where: { organizationId }, orderBy: { receivedAt: 'desc' }, take: 100 }),
        prisma.inventoryMovement.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, take: 100 }),
        prisma.customerPayment.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' }, take: 100 })
      ]);

      sales = salesDb.map(s => ({
        id: s.id,
        saleNumber: s.saleNumber,
        stationId: s.stationId,
        deviceId: s.deviceId,
        cashierId: s.cashierId,
        cashierName: s.cashierName || 'Staff',
        customerId: s.customerId || undefined,
        customerName: s.customerName || undefined,
        fuelType: s.fuelType as FuelTypeCode,
        tankId: s.tankId,
        litres: s.litres,
        unitPrice: s.unitPrice,
        totalAmount: s.totalAmount,
        paymentMethod: s.paymentMethod as PaymentMethod,
        paymentStatus: s.paymentStatus as 'paid' | 'pending' | 'voided',
        createdAt: s.createdAt.toISOString(),
        syncStatus: 'synced'
      }));

      deliveries = delDb.map(d => ({
        id: d.id,
        tankId: d.tankId,
        fuelType: d.fuelType as FuelTypeCode,
        litres: d.litres,
        costPerLitre: d.costPerLitre,
        totalCost: d.totalCost,
        supplier: d.supplier,
        invoiceNumber: d.invoiceNumber,
        receivedBy: 'Staff',
        receivedAt: d.receivedAt.toISOString(),
        dipstickBefore: d.dipstickBefore || 0,
        dipstickAfter: d.dipstickAfter || 0,
        organizationId: d.organizationId
      }));

      movements = movDb.map(m => ({
        id: m.id,
        tankId: m.tankId,
        fuelType: m.fuelType as FuelTypeCode,
        type: m.type as 'sale' | 'delivery' | 'adjustment' | 'loss',
        quantity: m.quantity,
        previousLevel: m.previousLevel,
        newLevel: m.newLevel,
        referenceId: m.referenceId,
        note: m.note || undefined,
        createdAt: m.createdAt.toISOString(),
        organizationId: m.organizationId
      }));

      customerPayments = payDb.map(p => ({
        id: p.id,
        customerId: p.customerId,
        customerName: p.customerName || 'Customer',
        amount: p.amount,
        paymentMethod: p.paymentMethod as PaymentMethod,
        reference: p.reference || undefined,
        collectedBy: p.collectedBy,
        createdAt: p.createdAt.toISOString(),
        organizationId: p.organizationId
      }));
    } catch {
      // fallback
    }
  } else {
    const db = readLocalDbSync();
    sales = db.sales.filter(s => s.stationId === organizationId);
    deliveries = db.deliveries.filter(d => d.organizationId === organizationId);
    movements = db.movements.filter(m => m.organizationId === organizationId);
    customerPayments = db.customerPayments.filter(p => p.organizationId === organizationId);
  }

  return {
    version: '3.0.0',
    station,
    users,
    tanks,
    sales,
    deliveries,
    movements,
    customers,
    customerPayments,
    expenses,
    auditLogs: logs
  };
}

export async function getSanitizedState(organizationId: string): Promise<TenantState> {
  return getTenantState(organizationId);
}
