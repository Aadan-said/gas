/**
 * GET /api/health
 * Returns system status: DB connectivity, version info
 */

import { NextResponse } from 'next/server';

export async function GET() {
  let dbStatus: 'connected' | 'offline' = 'offline';
  let dbLatencyMs: number | null = null;

  try {
    const { prisma } = await import('@/lib/prisma');
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'offline';
  }

  return NextResponse.json({
    status: 'ok',
    system: 'GasFlow Station Management',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      mode: dbStatus === 'offline' ? 'localStorage fallback' : 'PostgreSQL',
    },
    features: {
      auth: true,
      offlineFirst: true,
      pwa: true,
      sync: dbStatus === 'connected',
    },
  });
}
