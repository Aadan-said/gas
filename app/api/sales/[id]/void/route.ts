/**
 * PATCH /api/sales/[id]/void
 * Voids a sale and restores fuel stock to the target tank
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { voidSaleTransaction } from '@/lib/server-db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager']
  });

  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Void reason is required.' }, { status: 400 });
    }

    const updatedSale = await voidSaleTransaction(
      id,
      reason.trim(),
      user.name,
      user.id,
      session.organizationId || session.stationId
    );
    return NextResponse.json({ success: true, sale: updatedSale });
  } catch (err: unknown) {
    console.error('[/api/sales/[id]/void PATCH]', err);
    const msg = err instanceof Error ? err.message : 'Failed to void sale.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
