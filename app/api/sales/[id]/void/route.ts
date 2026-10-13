/**
 * PATCH /api/sales/[id]/void
 * Body: { reason: string }
 * Voids a sale and restores tank stock
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/lib/storage';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = req.headers.get('x-user-id') ?? '';
  const userName = req.headers.get('x-user-name') ?? '';
  const role = req.headers.get('x-user-role') ?? '';

  if (!['admin', 'manager'].includes(role)) {
    return NextResponse.json({ error: 'Only managers and admins can void sales.' }, { status: 403 });
  }

  const body = await req.json();
  const { reason } = body;
  if (!reason) {
    return NextResponse.json({ error: 'Void reason is required.' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    const sale = await prisma.sale.findUnique({ where: { id } });
    if (!sale) return NextResponse.json({ error: 'Sale not found.' }, { status: 404 });
    if (sale.paymentStatus === 'voided') {
      return NextResponse.json({ error: 'Sale is already voided.' }, { status: 400 });
    }

    const [updatedSale] = await prisma.$transaction([
      prisma.sale.update({
        where: { id },
        data: {
          paymentStatus: 'voided',
          voidReason: reason,
          voidedBy: userName,
          voidedAt: new Date(),
        },
      }),
      // Restore tank stock
      prisma.tank.update({
        where: { id: sale.tankId },
        data: { currentLevel: { increment: sale.litres } },
      }),
      // Audit
      prisma.auditLog.create({
        data: {
          id: generateUUID(),
          userId,
          userName,
          action: 'SALE_VOID',
          details: `Voided ${sale.saleNumber} ($${sale.totalAmount}). Reason: ${reason}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, sale: updatedSale });
  } catch {
    // Offline: return instruction for client to update locally
    return NextResponse.json({
      success: true,
      offline: true,
      instruction: { saleId: id, reason, voidedBy: userName, voidedAt: new Date().toISOString() },
    });
  }
}
