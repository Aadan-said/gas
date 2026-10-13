/**
 * GET  /api/tanks         - List all tanks
 * POST /api/tanks         - Create a new tank (admin/manager only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/lib/storage';
import type { FuelTypeCode } from '@/lib/types';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const tanks = await prisma.tank.findMany({ orderBy: { tankNumber: 'asc' } });
    return NextResponse.json({ tanks });
  } catch {
    return NextResponse.json({ tanks: [], offline: true });
  }
}

export async function POST(req: NextRequest) {
  const role = req.headers.get('x-user-role') ?? '';
  if (!['admin', 'manager'].includes(role)) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
  }

  const body = await req.json();
  const { tankNumber, fuelType, name, capacity, currentLevel, unitPrice, minThreshold } = body;

  if (!tankNumber || !fuelType || !name || capacity == null) {
    return NextResponse.json({ error: 'tankNumber, fuelType, name, and capacity are required.' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const tank = await prisma.tank.create({
      data: {
        id: generateUUID(),
        tankNumber,
        fuelType: fuelType as FuelTypeCode,
        name,
        capacity,
        currentLevel: currentLevel ?? 0,
        unitPrice: unitPrice ?? 0,
        minThreshold: minThreshold ?? 0,
        status: 'normal',
      },
    });
    return NextResponse.json({ success: true, tank }, { status: 201 });
  } catch {
    return NextResponse.json({ success: true, offline: true, tank: { id: generateUUID(), tankNumber, fuelType, name, capacity, currentLevel: currentLevel ?? 0, unitPrice: unitPrice ?? 0, minThreshold: minThreshold ?? 0, status: 'normal' } }, { status: 201 });
  }
}
