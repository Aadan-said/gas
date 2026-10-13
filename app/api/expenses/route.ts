/**
 * GET  /api/expenses   - List expenses
 * POST /api/expenses   - Add an expense
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/lib/storage';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const expenses = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ expenses });
  } catch {
    return NextResponse.json({ expenses: [], offline: true });
  }
}

export async function POST(req: NextRequest) {
  const role = req.headers.get('x-user-role') ?? '';
  const userName = req.headers.get('x-user-name') ?? '';
  const userId = req.headers.get('x-user-id') ?? '';

  if (!['admin', 'manager', 'accountant'].includes(role)) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
  }

  const body = await req.json();
  const { title, category, amount, paymentMethod, recipient, note, receiptUrl } = body;

  if (!title || !category || !amount || !paymentMethod || !recipient) {
    return NextResponse.json({ error: 'title, category, amount, paymentMethod, and recipient are required.' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const expense = await prisma.expense.create({
      data: {
        id: generateUUID(),
        title,
        category,
        amount,
        paymentMethod,
        recipient,
        approvedBy: userName,
        note: note ?? null,
        receiptUrl: receiptUrl ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        id: generateUUID(),
        userId,
        userName,
        action: 'EXPENSE_ADD',
        details: `Expense: ${title} ($${amount}) — ${category}`,
      },
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch {
    return NextResponse.json({
      success: true,
      offline: true,
      expense: { id: generateUUID(), title, category, amount, paymentMethod, recipient, approvedBy: userName, note, createdAt: new Date().toISOString() },
    }, { status: 201 });
  }
}
