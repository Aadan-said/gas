/**
 * POST /api/customers/[id]/payment
 * Records a customer debt payment and updates ledger balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { recordCustomerPaymentTransaction } from '@/lib/server-db';
import type { PaymentMethod } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager', 'accountant', 'cashier']
  });
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { amount, paymentMethod, reference } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valid positive payment amount is required.' }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required.' }, { status: 400 });
    }

    const payment = await recordCustomerPaymentTransaction({
      organizationId: session.organizationId || session.stationId,
      customerId: id,
      amount: parsedAmount,
      paymentMethod: paymentMethod as PaymentMethod,
      reference,
      receivedBy: user.name,
      userId: user.id
    });

    return NextResponse.json({ success: true, payment });
  } catch (err: unknown) {
    console.error('[/api/customers/[id]/payment POST]', err);
    const msg = err instanceof Error ? err.message : 'Failed to record customer payment.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
