/**
 * POST  /api/tanks/[id]  - Log fuel delivery or dipstick calibration (Admin & Manager)
 * PATCH /api/tanks/[id]  - Update tank unit price (Admin & Manager)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { recordDeliveryTransaction, calibrateTank, updateTankPrice } from '@/lib/server-db';

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const { user, session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager']
  });
  if (errorResponse) return errorResponse;
  const organizationId = session.organizationId || session.stationId;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'deliver') {
      const { litres, costPerLitre, totalCost, supplier, invoiceNumber, dipstickBefore, dipstickAfter } = body;

      if (!litres || !supplier || !invoiceNumber) {
        return NextResponse.json({ error: 'litres, supplier, and invoiceNumber are required.' }, { status: 400 });
      }

      const result = await recordDeliveryTransaction({
        organizationId,
        tankId: id,
        litres: parseFloat(litres),
        costPerLitre: parseFloat(costPerLitre || 0),
        totalCost: parseFloat(totalCost || 0),
        supplier,
        invoiceNumber,
        dipstickBefore: dipstickBefore ? parseFloat(dipstickBefore) : undefined,
        dipstickAfter: dipstickAfter ? parseFloat(dipstickAfter) : undefined,
        receivedById: user.id,
        receivedByName: user.name
      });

      return NextResponse.json({ success: true, delivery: result.delivery, tank: result.tank });
    }

    if (action === 'calibrate') {
      const { measuredLevel, notes } = body;
      if (measuredLevel == null) {
        return NextResponse.json({ error: 'measuredLevel is required.' }, { status: 400 });
      }

      const tank = await calibrateTank(id, parseFloat(measuredLevel), notes, user.id, user.name, organizationId);
      return NextResponse.json({ success: true, tank });
    }

    return NextResponse.json({ error: 'Invalid action. Must be deliver or calibrate.' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[/api/tanks/[id] POST]', err);
    const msg = err instanceof Error ? err.message : 'Operation failed.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const { user, session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager']
  });
  if (errorResponse) return errorResponse;

  try {
    const { unitPrice } = await req.json();
    if (unitPrice == null || parseFloat(unitPrice) <= 0) {
      return NextResponse.json({ error: 'Valid positive unitPrice is required.' }, { status: 400 });
    }

    const tank = await updateTankPrice(
      id,
      parseFloat(unitPrice),
      user.id,
      user.name,
      session.organizationId || session.stationId
    );
    return NextResponse.json({ success: true, tank });
  } catch (err: unknown) {
    console.error('[/api/tanks/[id] PATCH]', err);
    const msg = err instanceof Error ? err.message : 'Failed to update tank price.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
