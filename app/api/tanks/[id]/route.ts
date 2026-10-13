/**
 * POST /api/tanks/[id]/deliver
 * Records a fuel delivery and updates tank level
 * 
 * POST /api/tanks/[id]/calibrate
 * Records a dipstick calibration adjustment
 * 
 * PATCH /api/tanks/[id]/price
 * Updates the unit price of a tank's fuel
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/lib/storage';
import type { FuelTypeCode } from '@/lib/types';

type RouteCtx = { params: Promise<{ id: string }> };

// ─── POST /api/tanks/[id]/deliver ─────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const userName = req.headers.get('x-user-name') ?? '';
  const userId = req.headers.get('x-user-id') ?? '';
  const role = req.headers.get('x-user-role') ?? '';

  if (!['admin', 'manager'].includes(role)) {
    return NextResponse.json({ error: 'Only managers/admins can record deliveries.' }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body; // 'deliver' | 'calibrate'

  if (action === 'deliver') {
    const { litres, costPerLitre, totalCost, supplier, invoiceNumber, dipstickBefore, dipstickAfter } = body;

    if (!litres || !supplier || !invoiceNumber) {
      return NextResponse.json({ error: 'litres, supplier, and invoiceNumber are required.' }, { status: 400 });
    }

    try {
      const { prisma } = await import('@/lib/prisma');
      const tank = await prisma.tank.findUnique({ where: { id } });
      if (!tank) return NextResponse.json({ error: 'Tank not found.' }, { status: 404 });

      const newLevel = Math.min(tank.capacity, tank.currentLevel + litres);

      await prisma.$transaction([
        prisma.fuelDelivery.create({
          data: {
            id: generateUUID(),
            tankId: id,
            fuelType: tank.fuelType,
            litres,
            costPerLitre: costPerLitre ?? 0,
            totalCost: totalCost ?? 0,
            supplier,
            invoiceNumber,
            receivedById: userId,
            dipstickBefore: dipstickBefore ?? tank.currentLevel,
            dipstickAfter: dipstickAfter ?? newLevel,
          },
        }),
        prisma.tank.update({ where: { id }, data: { currentLevel: newLevel } }),
        prisma.inventoryMovement.create({
          data: {
            id: generateUUID(),
            tankId: id,
            fuelType: tank.fuelType as FuelTypeCode,
            type: 'delivery',
            quantity: litres,
            previousLevel: tank.currentLevel,
            newLevel,
            referenceId: invoiceNumber,
            note: `Received from ${supplier}`,
          },
        }),
        prisma.auditLog.create({
          data: {
            id: generateUUID(),
            userId,
            userName,
            action: 'DELIVERY_RECEIVE',
            details: `${litres}L ${tank.fuelType} from ${supplier} ($${totalCost})`,
          },
        }),
      ]);

      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: true, offline: true });
    }
  }

  if (action === 'calibrate') {
    const { measuredLevel, notes } = body;
    if (measuredLevel == null) {
      return NextResponse.json({ error: 'measuredLevel is required.' }, { status: 400 });
    }

    try {
      const { prisma } = await import('@/lib/prisma');
      const tank = await prisma.tank.findUnique({ where: { id } });
      if (!tank) return NextResponse.json({ error: 'Tank not found.' }, { status: 404 });

      const diff = measuredLevel - tank.currentLevel;
      await prisma.$transaction([
        prisma.tank.update({
          where: { id },
          data: { currentLevel: measuredLevel, lastCalibrated: new Date() },
        }),
        prisma.inventoryMovement.create({
          data: {
            id: generateUUID(),
            tankId: id,
            fuelType: tank.fuelType as FuelTypeCode,
            type: 'adjustment',
            quantity: diff,
            previousLevel: tank.currentLevel,
            newLevel: measuredLevel,
            referenceId: `CAL-${Date.now()}`,
            note: notes || 'Dipstick calibration',
          },
        }),
        prisma.auditLog.create({
          data: {
            id: generateUUID(),
            userId,
            userName,
            action: 'TANK_CALIBRATE',
            details: `Tank ${tank.tankNumber} calibrated: ${tank.currentLevel}L → ${measuredLevel}L (Δ${diff > 0 ? '+' : ''}${diff.toFixed(2)}L). ${notes || ''}`,
          },
        }),
      ]);

      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ success: true, offline: true });
    }
  }

  return NextResponse.json({ error: 'Unknown action. Use deliver or calibrate.' }, { status: 400 });
}

// ─── PATCH /api/tanks/[id]/price ──────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const role = req.headers.get('x-user-role') ?? '';
  const userId = req.headers.get('x-user-id') ?? '';
  const userName = req.headers.get('x-user-name') ?? '';

  if (!['admin', 'manager'].includes(role)) {
    return NextResponse.json({ error: 'Only managers/admins can update fuel prices.' }, { status: 403 });
  }

  const { unitPrice } = await req.json();
  if (unitPrice == null || unitPrice <= 0) {
    return NextResponse.json({ error: 'Valid unitPrice is required.' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const tank = await prisma.tank.update({
      where: { id },
      data: { unitPrice },
    });

    await prisma.auditLog.create({
      data: {
        id: generateUUID(),
        userId,
        userName,
        action: 'TANK_PRICE_UPDATE',
        details: `Tank ${tank.tankNumber} price updated to $${unitPrice}/L`,
      },
    });

    return NextResponse.json({ success: true, tank });
  } catch {
    return NextResponse.json({ success: true, offline: true });
  }
}
