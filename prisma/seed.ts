/**
 * GasFlow Database Seed Script
 * Run with: npx prisma db seed
 * Or: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * 
 * Seeds default admin user, tanks, and station config.
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
      name: 'GasFlow Main Station',
      branch: 'Mogadishu Central, KM4',
      address: 'KM4 Junction, Airport Road, Mogadishu',
      phone: '+252 61 5000000',
      taxRate: 0,
      currency: 'USD',
      currencySymbol: '$',
    },
  });
  console.log(`✅ Station: ${station.name}`);

  // ─── Users ───────────────────────────────────────────────────────────────────
  const USERS = [
    { id: 'u_1', name: 'Ahmed Ali',       username: 'admin',      email: 'admin@gasflow.so',      role: 'admin',      password: '1234' },
    { id: 'u_2', name: 'Fartuun Mohamed', username: 'fartuun',    email: 'fartuun@gasflow.so',    role: 'cashier',    password: '1111' },
    { id: 'u_3', name: 'Ali Hassan',      username: 'manager',    email: 'manager@gasflow.so',    role: 'manager',    password: '2222' },
    { id: 'u_4', name: 'Sahra Yusuf',     username: 'accountant', email: 'accountant@gasflow.so', role: 'accountant', password: '3333' },
  ];

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { passwordHash },
      create: {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        passwordHash,
        pin: u.password,
        role: u.role as 'admin' | 'manager' | 'cashier' | 'accountant',
        status: 'active',
        branch: 'Mogadishu Central',
      },
    });
    console.log(`✅ User: ${user.name} (${user.role}) — login: ${user.username} / ${u.password}`);
  }

  // ─── Tanks ───────────────────────────────────────────────────────────────────
  const TANKS = [
    { id: 't_1', tankNumber: 'T-01', fuelType: 'PMS', name: 'Petrol (PMS)',     capacity: 10000, currentLevel: 6780, unitPrice: 1.70, minThreshold: 2000 },
    { id: 't_2', tankNumber: 'T-02', fuelType: 'AGO', name: 'Diesel (AGO)',     capacity: 10000, currentLevel: 4190, unitPrice: 1.50, minThreshold: 2000 },
    { id: 't_3', tankNumber: 'T-03', fuelType: 'DPK', name: 'Kerosene (DPK)',   capacity: 10000, currentLevel: 8500, unitPrice: 1.80, minThreshold: 2000 },
    { id: 't_4', tankNumber: 'T-04', fuelType: 'LPG', name: 'LPG Gas',         capacity: 10000, currentLevel: 7600, unitPrice: 1.20, minThreshold: 2000 },
  ];

  for (const t of TANKS) {
    const tank = await prisma.tank.upsert({
      where: { tankNumber: t.tankNumber },
      update: {},
      create: {
        ...t,
        fuelType: t.fuelType as 'PMS' | 'AGO' | 'DPK' | 'LPG',
        status: 'normal',
        lastCalibrated: new Date('2025-04-28'),
      },
    });
    console.log(`✅ Tank: ${tank.name} (${tank.currentLevel}L / ${tank.capacity}L)`);
  }

  // ─── Customers ───────────────────────────────────────────────────────────────
  const CUSTOMERS = [
    { id: 'c_1', name: 'Mohamed Hassan',   phone: '+252 61 2345678', company: 'Hassan Transport Co.', creditLimit: 500, currentBalance: 45.00 },
    { id: 'c_2', name: 'Amina Farah',      phone: '+252 61 3456789', company: 'Blue Sky Logistics',    creditLimit: 300, currentBalance: 0.00 },
    { id: 'c_3', name: 'Abdirahman Ali',   phone: '+252 61 4567890', company: 'Somali Express Fleet',  creditLimit: 1000, currentBalance: 120.00 },
    { id: 'c_4', name: 'Hodan Yusuf',      phone: '+252 61 5678901', company: 'Banadir Delivery',      creditLimit: 200, currentBalance: 30.00 },
  ];

  for (const c of CUSTOMERS) {
    const customer = await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c },
    });
    console.log(`✅ Customer: ${customer.name}`);
  }

  // ─── Audit log ───────────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      id: `log_seed_${Date.now()}`,
      userId: 'u_1',
      userName: 'System',
      action: 'SYSTEM_SEED',
      details: 'Database seeded with initial station data.',
    },
  });

  console.log('\n🎉 GasFlow database seeded successfully!\n');
  console.log('Default credentials:');
  console.log('  Admin:     admin / 1234');
  console.log('  Manager:   manager / 2222');
  console.log('  Cashier:   fartuun / 1111');
  console.log('  Accountant: accountant / 3333');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
