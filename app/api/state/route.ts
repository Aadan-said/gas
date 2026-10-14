/**
 * GET   /api/state  - Tenant-scoped station snapshot (auth required)
 * PATCH /api/state  - Update this station's profile (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getSanitizedState, updateStationConfig } from '@/lib/server-db';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const orgId = session.organizationId || session.stationId;
    const state = await getSanitizedState(orgId);
    return NextResponse.json({
      success: true,
      state,
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[/api/state GET]', err);
    return NextResponse.json({ error: 'Failed to retrieve station state.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin']
  });
  if (errorResponse) return errorResponse;

  try {
    const orgId = session.organizationId || session.stationId;
    const body = await req.json();
    const station = await updateStationConfig(orgId, {
      name: body.name,
      branch: body.branch,
      address: body.address,
      phone: body.phone,
      taxRate: body.taxRate,
      currency: body.currency,
      currencySymbol: body.currencySymbol
    });
    return NextResponse.json({ success: true, station });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update station.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
