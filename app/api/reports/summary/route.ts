/**
 * GET /api/reports/summary
 * Returns aggregated financial and operational KPIs
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role') ?? '';
  if (!['admin', 'manager', 'accountant'].includes(role)) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const period = searchParams.get('period') ?? 'today'; // today | week | month | custom
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const { prisma } = await import('@/lib/prisma');

    // Build date range
    let start: Date;
    let end = new Date();
    if (period === 'today') {
      start = new Date(); start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start = new Date(); start.setDate(start.getDate() - 7);
    } else if (period === 'month') {
      start = new Date(); start.setMonth(start.getMonth() - 1);
    } else if (from && to) {
      start = new Date(from);
      end = new Date(to);
    } else {
      start = new Date(); start.setHours(0, 0, 0, 0);
    }

    const dateFilter = { gte: start, lte: end };

    const [
      totalSalesCount,
      salesAggregate,
      expensesAggregate,
      tankStatuses,
      paymentMethodBreakdown,
    ] = await Promise.all([
      prisma.sale.count({ where: { paymentStatus: 'paid', createdAt: dateFilter } }),
      prisma.sale.aggregate({ where: { paymentStatus: 'paid', createdAt: dateFilter }, _sum: { totalAmount: true, litres: true } }),
      prisma.expense.aggregate({ where: { createdAt: dateFilter }, _sum: { amount: true } }),
      prisma.tank.findMany({ select: { name: true, fuelType: true, currentLevel: true, capacity: true, status: true } }),
      prisma.sale.groupBy({ by: ['paymentMethod'], where: { paymentStatus: 'paid', createdAt: dateFilter }, _sum: { totalAmount: true }, _count: true }),
    ]);

    const totalRevenue = salesAggregate._sum.totalAmount ?? 0;
    const totalLitres = salesAggregate._sum.litres ?? 0;
    const totalExpenses = expensesAggregate._sum.amount ?? 0;
    const netProfit = totalRevenue - totalExpenses;

    return NextResponse.json({
      period,
      from: start.toISOString(),
      to: end.toISOString(),
      totalSalesCount,
      totalRevenue,
      totalLitres,
      totalExpenses,
      netProfit,
      tankStatuses,
      paymentMethodBreakdown,
    });
  } catch {
    return NextResponse.json({ offline: true, message: 'Reports require database connection.' });
  }
}
