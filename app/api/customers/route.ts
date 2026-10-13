/**
 * GET  /api/customers      - List customers
 * POST /api/customers      - Add a customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateUUID } from '@/lib/storage';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json({ customers: [], offline: true });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, company, creditLimit } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: 'name and phone are required.' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const customer = await prisma.customer.create({
      data: {
        id: generateUUID(),
        name,
        phone,
        email: email ?? null,
        company: company ?? null,
        creditLimit: creditLimit ?? 500,
        currentBalance: 0,
      },
    });
    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch {
    return NextResponse.json({
      success: true,
      offline: true,
      customer: { id: `c_${generateUUID().slice(0,8)}`, name, phone, email, company, creditLimit: creditLimit ?? 500, currentBalance: 0, status: 'active', createdAt: new Date().toISOString() },
    }, { status: 201 });
  }
}
