/**
 * POST /api/customers/[id]/payment
 * Records a customer debt payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/lib/storage';
import type { PaymentMethod } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userName = req.headers.get('x-user-name') ?? '';
  const userId = req.headers.get('x-user-id') ?? '';

  const body = await req.json();
  const { amount, paymentMethod, reference, note } = body;

  if (!amount || !paymentMethod) {
    return NextResponse.json({ error: 'amount and paymentMethod are required.' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });

    const [payment] = await prisma.$transaction([
      prisma.customerPayment.create({
        data: {
          id: generateUUID(),
          customerId: id,
          amount,
          paymentMethod: paymentMethod as PaymentMethod,
          reference: reference ?? null,
          receivedBy: userName,
          note: note ?? null,
        },
      }),
      prisma.customer.update({
        where: { id },
        data: { currentBalance: { decrement: amount } },
      }),
      prisma.auditLog.create({
        data: {
          id: generateUUID(),
          userId,
          userName,
          action: 'CUSTOMER_PAYMENT',
          details: `Payment of $${amount} received from ${customer.name} via ${paymentMethod}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, payment });
  } catch {
    return NextResponse.json({
      success: true,
      offline: true,
      payment: { id: generateUUID(), customerId: id, amount, paymentMethod, reference, receivedBy: userName, createdAt: new Date().toISOString() },
    });
  }
}
