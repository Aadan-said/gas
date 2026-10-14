/**
 * GET  /api/expenses  - List expenses (Admin, Manager, Accountant only — Cashiers forbidden)
 * POST /api/expenses  - Add expense (Admin, Manager, Accountant only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { listExpenses, createExpenseTransaction } from '@/lib/server-db';
import type { ExpenseCategory } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager', 'accountant']
  });
  if (errorResponse) return errorResponse;

  try {
    const expenses = await listExpenses(session.organizationId || session.stationId);
    return NextResponse.json({ expenses });
  } catch (err) {
    console.error('[/api/expenses GET]', err);
    return NextResponse.json({ error: 'Failed to retrieve expenses.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager', 'accountant']
  });
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { category, description, amount, receiptNumber } = body;

    const parsedAmount = parseFloat(amount);
    if (!category || !description || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid category, description, and positive amount are required.' },
        { status: 400 }
      );
    }

    const expense = await createExpenseTransaction(
      session.organizationId || session.stationId,
      {
        category: category as ExpenseCategory,
        description: description.trim(),
        amount: parsedAmount,
        addedBy: user.name,
        receiptNumber: receiptNumber?.trim()
      },
      user.id,
      user.name
    );

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (err: unknown) {
    console.error('[/api/expenses POST]', err);
    const msg = err instanceof Error ? err.message : 'Failed to record expense.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
