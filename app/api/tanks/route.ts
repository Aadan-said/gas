/**
 * GET  /api/tanks  - List all station tanks (authenticated staff)
 * POST /api/tanks  - Add tank (Admin/Manager only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { listTanks, createTank } from '@/lib/server-db';
import type { FuelTypeCode } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const tanks = await listTanks(session.organizationId || session.stationId);
    return NextResponse.json({ tanks });
  } catch (err) {
    console.error('[/api/tanks GET]', err);
    return NextResponse.json({ error: 'Failed to retrieve tank telemetry.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager']
  });
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { tankNumber, fuelType, name, capacity, currentLevel, unitPrice, minThreshold } = body;

    if (!tankNumber || !fuelType || !name || capacity == null) {
      return NextResponse.json(
        { error: 'tankNumber, fuelType, name, and capacity are required.' },
        { status: 400 }
      );
    }

    const tank = await createTank(session.organizationId || session.stationId, {
      tankNumber,
      fuelType: fuelType as FuelTypeCode,
      name,
      capacity: parseFloat(capacity),
      currentLevel: parseFloat(currentLevel || 0),
      unitPrice: parseFloat(unitPrice || 0),
      minThreshold: parseFloat(minThreshold || 1000),
      status: 'normal'
    });

    return NextResponse.json({ success: true, tank }, { status: 201 });
  } catch (err: unknown) {
    console.error('[/api/tanks POST]', err);
    const msg = err instanceof Error ? err.message : 'Failed to create tank.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
