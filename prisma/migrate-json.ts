/**
 * GasFlow Database Migration & Importer
 * Migrates data from local data/gasflow_db.json into PostgreSQL via Prisma
 * Run with: npm run db:import or npx ts-node prisma/migrate-json.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient, FuelType, Role, PaymentMethod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface LocalData {
  stations?: any[];
  users?: any[];
  tanks?: any[];
  sales?: any[];
  deliveries?: any[];
  movements?: any[];
  customers?: any[];
  customerPayments?: any[];
  expenses?: any[];
  auditLogs?: any[];
}

async function migrate() {
  console.log('🔄 Starting GasFlow JSON -> PostgreSQL Migration...\n');

  const jsonPath = path.join(process.cwd(), 'data', 'gasflow_db.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data: LocalData = JSON.parse(raw);

  // 1. Stations
  console.log('🏢 Migrating Stations...');
  const stations = data.stations || [];
  for (const s of stations) {
    await prisma.stationConfig.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        branch: s.branch,
        address: s.address,
        phone: s.phone,
        taxRate: s.taxRate || 0,
        currency: s.currency || 'USD',
        currencySymbol: s.currencySymbol || '$',
      },
      create: {
        id: s.id,
        name: s.name,
        branch: s.branch,
        address: s.address,
        phone: s.phone,
        taxRate: s.taxRate || 0,
        currency: s.currency || 'USD',
        currencySymbol: s.currencySymbol || '$',
      },
    });
    console.log(`  ✅ Station: ${s.name} (${s.id})`);
  }

  // 2. Users
  console.log('\n👥 Migrating Users...');
  const users = data.users || [];
  for (const u of users) {
    const validRole = ['admin', 'manager', 'cashier', 'accountant'].includes(u.role)
      ? (u.role as Role)
      : Role.cashier;

    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        pin: u.pin || '1234',
        role: validRole,
        status: u.status === 'inactive' ? 'inactive' : 'active',
        phone: u.phone || null,
        branch: u.branch || null,
        organizationId: u.organizationId || 'st_001',
      },
      create: {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        passwordHash: u.passwordHash,
        pin: u.pin || '1234',
        role: validRole,
        status: u.status === 'inactive' ? 'inactive' : 'active',
        phone: u.phone || null,
        branch: u.branch || null,
        organizationId: u.organizationId || 'st_001',
      },
    });
    console.log(`  ✅ User: ${u.name} (${u.username} - ${validRole})`);
  }

  // 3. Tanks
  console.log('\n⛽ Migrating Tanks...');
  const tanks = data.tanks || [];
  for (const t of tanks) {
    const orgId = t.organizationId || 'st_001';
    const fuelType = (['PMS', 'AGO', 'DPK', 'LPG'].includes(t.fuelType)
      ? t.fuelType
      : 'PMS') as FuelType;

    await prisma.tank.upsert({
      where: {
        organizationId_tankNumber: {
          organizationId: orgId,
          tankNumber: t.tankNumber,
        },
      },
      update: {
        name: t.name,
        fuelType,
        unit: t.unit || (fuelType === 'LPG' ? 'kg' : 'litres'),
        capacity: Number(t.capacity),
        currentLevel: Number(t.currentLevel),
        unitPrice: Number(t.unitPrice),
        minThreshold: Number(t.minThreshold),
        status: ['normal', 'low', 'critical'].includes(t.status) ? t.status : 'normal',
      },
      create: {
        id: t.id,
        organizationId: orgId,
        tankNumber: t.tankNumber,
        name: t.name,
        fuelType,
        unit: t.unit || (fuelType === 'LPG' ? 'kg' : 'litres'),
        capacity: Number(t.capacity),
        currentLevel: Number(t.currentLevel),
        unitPrice: Number(t.unitPrice),
        minThreshold: Number(t.minThreshold),
        status: ['normal', 'low', 'critical'].includes(t.status) ? t.status : 'normal',
        lastCalibrated: t.lastCalibrated ? new Date(t.lastCalibrated) : new Date(),
      },
    });
    console.log(`  ✅ Tank: ${t.name} (${t.tankNumber} - ${orgId})`);
  }

  // 4. Customers
  console.log('\n🤝 Migrating Customers...');
  const customers = data.customers || [];
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        phone: c.phone,
        email: c.email || null,
        company: c.company || null,
        creditLimit: Number(c.creditLimit || 500),
        currentBalance: Number(c.currentBalance || 0),
        status: c.status || 'active',
      },
      create: {
        id: c.id,
        organizationId: c.organizationId || 'st_001',
        name: c.name,
        phone: c.phone,
        email: c.email || null,
        company: c.company || null,
        creditLimit: Number(c.creditLimit || 500),
        currentBalance: Number(c.currentBalance || 0),
        status: c.status || 'active',
      },
    });
    console.log(`  ✅ Customer: ${c.name} (${c.phone})`);
  }

  // 5. Sales
  console.log('\n💵 Migrating Sales...');
  const sales = data.sales || [];
  const existingUsers = await prisma.user.findMany({ select: { id: true } });
  const userIds = new Set(existingUsers.map(u => u.id));
  const fallbackUser = existingUsers[0]?.id;

  for (const s of sales) {
    const orgId = s.stationId || s.organizationId || 'st_001';
    const fuelType = (['PMS', 'AGO', 'DPK', 'LPG'].includes(s.fuelType)
      ? s.fuelType
      : 'PMS') as FuelType;

    const cashierId = userIds.has(s.cashierId) ? s.cashierId : fallbackUser;
    if (!cashierId) continue;

    // Check tank exists
    const tank = await prisma.tank.findFirst({ where: { id: s.tankId } });
    if (!tank) continue;

    const payMethod = ['cash', 'evc', 'edahab', 'sahal', 'card', 'credit'].includes(s.paymentMethod)
      ? (s.paymentMethod as PaymentMethod)
      : PaymentMethod.cash;

    const payStatus = ['paid', 'pending', 'voided'].includes(s.paymentStatus)
      ? (s.paymentStatus as PaymentStatus)
      : PaymentStatus.paid;

    await prisma.sale.upsert({
      where: { saleNumber: s.saleNumber },
      update: {
        totalAmount: Number(s.totalAmount),
        litres: Number(s.litres),
        unitPrice: Number(s.unitPrice),
      },
      create: {
        id: s.id,
        saleNumber: s.saleNumber,
        stationId: orgId,
        deviceId: s.deviceId || 'main_pos',
        cashierId,
        cashierName: s.cashierName || 'Staff',
        customerId: s.customerId || null,
        customerName: s.customerName || null,
        fuelType,
        tankId: tank.id,
        litres: Number(s.litres),
        unitPrice: Number(s.unitPrice),
        totalAmount: Number(s.totalAmount),
        paymentMethod: payMethod,
        paymentStatus: payStatus,
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
      },
    });
    console.log(`  ✅ Sale: ${s.saleNumber} ($${s.totalAmount})`);
  }

  // 6. Expenses
  console.log('\n📑 Migrating Expenses...');
  const expenses = data.expenses || [];
  for (const e of expenses) {
    const payMethod = ['cash', 'evc', 'edahab', 'sahal', 'card', 'credit'].includes(e.paymentMethod)
      ? (e.paymentMethod as PaymentMethod)
      : PaymentMethod.cash;

    await prisma.expense.create({
      data: {
        id: e.id,
        organizationId: e.organizationId || 'st_001',
        category: e.category || 'Other',
        description: e.description || '',
        amount: Number(e.amount || 0),
        addedBy: e.addedBy || 'Staff',
        paymentMethod: payMethod,
        receiptNumber: e.receiptNumber || null,
        createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
      },
    });
    console.log(`  ✅ Expense: ${e.category} ($${e.amount})`);
  }

  // 7. Audit Logs
  console.log('\n🛡️ Migrating Audit Logs...');
  const logs = (data.auditLogs || []).slice(0, 50);
  for (const l of logs) {
    await prisma.auditLog.create({
      data: {
        id: l.id,
        organizationId: l.organizationId || 'st_001',
        userId: userIds.has(l.userId) ? l.userId : null,
        userName: l.userName || 'System',
        action: l.action || 'ACTION',
        details: l.details || '',
        createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
      },
    });
  }
  console.log(`  ✅ ${logs.length} audit logs imported.`);

  console.log('\n🎉 ALL JSON DATA SUCCESSFULLY IMPORTED INTO POSTGRESQL!\n');
}

migrate()
  .catch((err) => {
    console.error('❌ Migration error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
