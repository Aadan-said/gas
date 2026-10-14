/**
 * GET  /api/sales  - List sales with strict role & branch scoping
 * POST /api/sales  - Process fuel sale with server-calculated totals and atomic inventory deduction
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { createSaleTransaction, getTenantState } from '@/lib/server-db';
import type { FuelTypeCode, PaymentMethod } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { user, session, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const db = await getTenantState(session.organizationId || session.stationId);
    let sales = [...db.sales];

    // Role-based visibility scoping: Cashiers can ONLY review their own sales
    if (user.role === 'cashier') {
      sales = sales.filter(s => s.cashierId === user.id);
    } else {
      const cashierFilter = req.nextUrl.searchParams.get('cashierId');
      if (cashierFilter) {
        sales = sales.filter(s => s.cashierId === cashierFilter);
      }
    }

    const fuelTypeFilter = req.nextUrl.searchParams.get('fuelType');
    if (fuelTypeFilter) {
      sales = sales.filter(s => s.fuelType === fuelTypeFilter);
    }

    const statusFilter = req.nextUrl.searchParams.get('status');
    if (statusFilter) {
      sales = sales.filter(s => s.paymentStatus === statusFilter);
    }

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 200);
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    const total = sales.length;
    const paginated = sales.slice(offset, offset + limit);

    return NextResponse.json({
      sales: paginated,
      total,
      limit,
      offset
    });
  } catch (err) {
    console.error('[/api/sales GET]', err);
    return NextResponse.json({ error: 'Failed to retrieve sales records.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['cashier', 'manager', 'admin']
  });
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      fuelType,
      tankId,
      litres,
      unitPrice,
      paymentMethod,
      customerId,
      customerName,
      deviceId
    } = body;

    if (!fuelType || !tankId || litres == null || unitPrice == null || !paymentMethod) {
      return NextResponse.json(
        { error: 'fuelType, tankId, litres, unitPrice, and paymentMethod are required.' },
        { status: 400 }
      );
    }

    const parsedLitres = parseFloat(litres);
    const parsedUnitPrice = parseFloat(unitPrice);

    if (isNaN(parsedLitres) || parsedLitres <= 0) {
      return NextResponse.json({ error: 'Valid positive litres amount is required.' }, { status: 400 });
    }
    if (isNaN(parsedUnitPrice) || parsedUnitPrice <= 0) {
      return NextResponse.json({ error: 'Valid positive unit price is required.' }, { status: 400 });
    }

    // Execute atomic sale transaction
    const result = await createSaleTransaction({
      organizationId: session.organizationId || session.stationId,
      fuelType: fuelType as FuelTypeCode,
      tankId,
      litres: parsedLitres,
      unitPrice: parsedUnitPrice,
      paymentMethod: paymentMethod as PaymentMethod,
      customerId,
      customerName,
      cashierId: user.id,
      cashierName: user.name,
      deviceId
    });

    return NextResponse.json(
      {
        success: true,
        sale: result.sale,
        totalAmount: result.totalAmount,
        tank: result.tank
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[/api/sales POST]', err);
    const msg = err instanceof Error ? err.message : 'Failed to process sale.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
