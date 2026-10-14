/**
 * GET  /api/customers  - List customers & credit balances
 * POST /api/customers  - Register credit customer (Admin, Manager, Accountant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { listCustomers, createCustomer } from '@/lib/server-db';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const customers = await listCustomers(session.organizationId || session.stationId);
    return NextResponse.json({ customers });
  } catch (err) {
    console.error('[/api/customers GET]', err);
    return NextResponse.json({ error: 'Failed to retrieve customer accounts.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager', 'accountant']
  });
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, phone, email, company, creditLimit } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Customer name and phone number are required.' }, { status: 400 });
    }

    const customer = await createCustomer(session.organizationId || session.stationId, {
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      company: company?.trim(),
      creditLimit: parseFloat(creditLimit || 500)
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (err: unknown) {
    console.error('[/api/customers POST]', err);
    const msg = err instanceof Error ? err.message : 'Failed to register customer.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
