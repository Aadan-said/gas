/**
 * GasFlow Database Seed Script
 * Run with: npx prisma db seed
 * 
 * Seeds default admin user, tanks, and station config for Gaalkacyo Central.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GasFlow database...\n');

  // ─── Station Config ──────────────────────────────────────────────────────────
  const station = await prisma.stationConfig.upsert({
    where: { id: 'st_001' },
    update: {},
    create: {
      id: 'st_001',
      name: 'GasFlow Gaalkacyo Station',
      branch: 'Gaalkacyo Central',
      address: 'Main Commercial Street, Gaalkacyo, Mudug, Somalia',
      phone: '+252 90 7112233',
      taxRate: 0,
      currency: 'USD',
      currencySymbol: '$',
    },
  });
  console.log(`✅ Station: ${station.name}`);

  // ─── Users ───────────────────────────────────────────────────────────────────
  const USERS = [
    { id: 'u_1', name: 'Axmed Cali Gaalkacyo', username: 'admin',      email: 'admin@gasflow.so',      role: 'admin',      password: 'gasflow_admin_2026' },
    { id: 'u_2', name: 'Faadumo Cabdi',       username: 'cashier',    email: 'cashier@gasflow.so',    role: 'cashier',    password: 'cashier_pass_2026' },
    { id: 'u_3', name: 'Jaamac Warsame',      username: 'manager',    email: 'manager@gasflow.so',    role: 'manager',    password: 'manager_pass_2026' },
    { id: 'u_4', name: 'Deeqo Maxamed',       username: 'accountant', email: 'accountant@gasflow.so', role: 'accountant', password: 'accountant_pass_2026' },
  ];

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash, organizationId: 'st_001' } as any,
      create: {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        passwordHash,
        pin: '1234',
        role: u.role as 'admin' | 'manager' | 'cashier' | 'accountant',
        status: 'active',
        branch: 'Gaalkacyo Central',
        organizationId: 'st_001'
      } as any,
    });
    console.log(`✅ User: ${user.name} (${user.role}) — login: ${user.username}`);
  }

  // ─── Tanks ───────────────────────────────────────────────────────────────────
  const TANKS = [
    { id: 't_1', tankNumber: 'T-01', fuelType: 'PMS', name: 'Petrol (PMS)',     unit: 'litres', capacity: 10000, currentLevel: 6780, unitPrice: 1.19, minThreshold: 2000 },
    { id: 't_2', tankNumber: 'T-02', fuelType: 'AGO', name: 'Diesel (AGO)',     unit: 'litres', capacity: 10000, currentLevel: 4190, unitPrice: 1.20, minThreshold: 2000 },
    { id: 't_3', tankNumber: 'T-03', fuelType: 'DPK', name: 'Kerosene (DPK)',   unit: 'litres', capacity: 10000, currentLevel: 8500, unitPrice: 0.94, minThreshold: 2000 },
    { id: 't_4', tankNumber: 'T-04', fuelType: 'LPG', name: 'LPG Gas',         unit: 'kg',     capacity: 2000,  currentLevel: 1200, unitPrice: 20.0, minThreshold: 400 },
  ];

  for (const t of TANKS) {
    const tank = await prisma.tank.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        organizationId: 'st_001',
        tankNumber: t.tankNumber,
        name: t.name,
        unit: t.unit,
        capacity: t.capacity,
        currentLevel: t.currentLevel,
        unitPrice: t.unitPrice,
        minThreshold: t.minThreshold,
        fuelType: t.fuelType as 'PMS' | 'AGO' | 'DPK' | 'LPG',
        status: 'normal',
        lastCalibrated: new Date(),
      } as any,
    });
    console.log(`✅ Tank: ${tank.name} (${tank.currentLevel}${(tank as any).unit || 'L'} / ${tank.capacity}${(tank as any).unit || 'L'})`);
  }

  // ─── Customers ───────────────────────────────────────────────────────────────
  const CUSTOMERS = [
    { id: 'c_1', name: 'Cabdirashiid Xasan Nuur', phone: '+252 90 2110001', company: 'Nuur Transport Gaalkacyo', creditLimit: 500, currentBalance: 45.00 },
    { id: 'c_2', name: 'Faadumo Cabdi Warsame',   phone: '+252 90 2120002', company: 'Warsame Logistics Mudug',  creditLimit: 300, currentBalance: 0.00 },
    { id: 'c_3', name: 'Axmed Cali Dheere',       phone: '+252 90 2130003', company: 'Dheere Fleet Gaalkacyo',   creditLimit: 1000, currentBalance: 120.00 },
  ];

  for (const c of CUSTOMERS) {
    const customer = await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        organizationId: 'st_001',
        name: c.name,
        phone: c.phone,
        company: c.company,
        creditLimit: c.creditLimit,
        currentBalance: c.currentBalance,
        status: 'active'
      } as any,
    });
    console.log(`✅ Customer: ${customer.name}`);
  }

  // ─── Audit log ───────────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      organizationId: 'st_001',
      userId: 'u_1',
      userName: 'System Admin',
      action: 'SYSTEM_SEED',
      details: 'Gaalkacyo station database seeded with initial operational data.',
    } as any,
  });

  console.log('\n🚀 Gaalkacyo Seed finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
