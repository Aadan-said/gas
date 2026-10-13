/**
 * GET  /api/sales         - List sales (with optional filters)
 * POST /api/sales         - Create a new sale
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/lib/storage';
import type { Sale, PaymentMethod, FuelTypeCode } from '@/lib/types';

// Helper to read session from injected headers (set by middleware)
function getSession(req: NextRequest) {
  return {
    userId: req.headers.get('x-user-id') ?? '',
    role: req.headers.get('x-user-role') ?? '',
    name: req.headers.get('x-user-name') ?? '',
    stationId: req.headers.get('x-station-id') ?? 'st_001',
    deviceId: req.headers.get('x-device-id') ?? 'DEV-WEB-01',
  };
}

// ─── GET /api/sales ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const cashierId = searchParams.get('cashierId');
  const fuelType = searchParams.get('fuelType');
  const status = searchParams.get('status');
  const date = searchParams.get('date'); // YYYY-MM-DD

  try {
    const { prisma } = await import('@/lib/prisma');
    const where: Record<string, unknown> = {};
    if (cashierId) where.cashierId = cashierId;
    if (fuelType) where.fuelType = fuelType;
    if (status) where.paymentStatus = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { cashier: { select: { name: true } }, tank: { select: { name: true } } },
      }),
      prisma.sale.count({ where }),
    ]);

    return NextResponse.json({ sales, total, limit, offset });
  } catch {
    // DB unavailable — client should use local state
    return NextResponse.json({ sales: [], total: 0, offline: true });
  }
}

// ─── POST /api/sales ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = getSession(req);

  try {
    const body = await req.json();
    const {
      fuelType,
      tankId,
      litres,
      unitPrice,
      totalAmount,
      paymentMethod,
      customerId,
      customerName,
    } = body;

    // Validate required fields
    if (!fuelType || !tankId || !litres || !unitPrice || !totalAmount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required sale fields.' }, { status: 400 });
    }

    const saleNumber = `GF-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    // ── Try DB ─────────────────────────────────────────────────────────────
    try {
      const { prisma } = await import('@/lib/prisma');

      // Check tank has enough stock
      const tank = await prisma.tank.findUnique({ where: { id: tankId } });
      if (!tank) return NextResponse.json({ error: 'Tank not found.' }, { status: 404 });
      if (tank.currentLevel < litres) {
        return NextResponse.json({ error: `Insufficient stock. Tank has ${tank.currentLevel}L available.` }, { status: 400 });
      }

      const [newSale] = await prisma.$transaction([
        prisma.sale.create({
          data: {
            id: generateUUID(),
            saleNumber,
            stationId: session.stationId,
            deviceId: session.deviceId,
            cashierId: session.userId,
            customerId: customerId ?? null,
            fuelType: fuelType as FuelTypeCode,
            tankId,
            litres,
            unitPrice,
            totalAmount,
            paymentMethod: paymentMethod as PaymentMethod,
            paymentStatus: 'paid',
            syncStatus: 'synced',
          },
        }),
        // Deduct tank level
        prisma.tank.update({
          where: { id: tankId },
          data: { currentLevel: { decrement: litres } },
        }),
        // Log inventory movement
        prisma.inventoryMovement.create({
          data: {
            id: generateUUID(),
            tankId,
            fuelType: fuelType as FuelTypeCode,
            type: 'sale',
            quantity: -litres,
            previousLevel: tank.currentLevel,
            newLevel: tank.currentLevel - litres,
            referenceId: saleNumber,
            note: `Dispensed to ${customerName || 'Walk-in'}`,
          },
        }),
        // Audit log
        prisma.auditLog.create({
          data: {
            id: generateUUID(),
            userId: session.userId,
            userName: session.name,
            action: 'SALE_CREATE',
            details: `Sale ${saleNumber}: ${fuelType} ${litres}L for $${totalAmount} (${paymentMethod})`,
          },
        }),
      ]);

      return NextResponse.json({ success: true, sale: newSale }, { status: 201 });
    } catch (dbErr: unknown) {
      if (dbErr instanceof Error && dbErr.constructor.name.startsWith('Prisma')) {
        throw dbErr;
      }
      // DB unavailable → return offline sale object for client to store locally
    }

    // ── Offline response ───────────────────────────────────────────────────
    const offlineSale: Sale = {
      id: `sale_${generateUUID()}`,
      saleNumber,
      stationId: session.stationId,
      deviceId: session.deviceId,
      cashierId: session.userId,
      cashierName: session.name,
      customerId,
      customerName,
      fuelType: fuelType as FuelTypeCode,
      tankId,
      litres,
      unitPrice,
      totalAmount,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: 'paid',
      createdAt: timestamp,
      syncStatus: 'pending_local',
    };

    return NextResponse.json({ success: true, sale: offlineSale, offline: true }, { status: 201 });
  } catch (err) {
    console.error('[/api/sales POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
