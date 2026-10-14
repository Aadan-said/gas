/**
 * GET /api/reports/summary
 * Returns aggregated financial and operational KPIs (Admin, Manager, Accountant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getTenantState } from '@/lib/server-db';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager', 'accountant']
  });
  if (errorResponse) return errorResponse;

  try {
    const db = await getTenantState(session.organizationId || session.stationId);
    const period = req.nextUrl.searchParams.get('period') || 'today';

    let startTime = new Date();
    if (period === 'today') {
      startTime.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startTime.setDate(startTime.getDate() - 7);
    } else if (period === 'month') {
      startTime.setMonth(startTime.getMonth() - 1);
    } else {
      startTime.setHours(0, 0, 0, 0);
    }

    const filteredSales = db.sales.filter(
      s => s.paymentStatus === 'paid' && new Date(s.createdAt) >= startTime
    );

    const filteredExpenses = db.expenses.filter(
      e => new Date(e.createdAt) >= startTime
    );

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalLitres = filteredSales.reduce((acc, s) => acc + s.litres, 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const paymentMethodBreakdown: Record<string, { totalAmount: number; count: number }> = {};
    filteredSales.forEach(s => {
      if (!paymentMethodBreakdown[s.paymentMethod]) {
        paymentMethodBreakdown[s.paymentMethod] = { totalAmount: 0, count: 0 };
      }
      paymentMethodBreakdown[s.paymentMethod].totalAmount += s.totalAmount;
      paymentMethodBreakdown[s.paymentMethod].count += 1;
    });

    return NextResponse.json({
      period,
      from: startTime.toISOString(),
      to: new Date().toISOString(),
      totalSalesCount: filteredSales.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalLitres: parseFloat(totalLitres.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      tankStatuses: db.tanks.map(t => ({
        name: t.name,
        fuelType: t.fuelType,
        currentLevel: t.currentLevel,
        capacity: t.capacity,
        status: t.status
      })),
      paymentMethodBreakdown
    });
  } catch (err) {
    console.error('[/api/reports/summary GET]', err);
    return NextResponse.json({ error: 'Failed to generate report summary.' }, { status: 500 });
  }
}
