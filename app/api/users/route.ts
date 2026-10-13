/**
 * GET  /api/users    - List users (admin/manager only)
 * POST /api/users    - Add staff user (admin only) — delegates to /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role') ?? '';

  if (!['admin', 'manager'].includes(role)) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        branch: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ users: [], offline: true });
  }
}

export async function PATCH(req: NextRequest) {
  const role = req.headers.get('x-user-role') ?? '';
  const userId = req.headers.get('x-user-id') ?? '';
  const userName = req.headers.get('x-user-name') ?? '';

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can modify user accounts.' }, { status: 403 });
  }

  const body = await req.json();
  const { targetUserId, status } = body;

  if (!targetUserId || !['active', 'inactive'].includes(status)) {
    return NextResponse.json({ error: 'targetUserId and valid status (active|inactive) are required.' }, { status: 400 });
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { status },
      select: { id: true, name: true, status: true },
    });

    await prisma.auditLog.create({
      data: {
        id: `log_${Date.now()}`,
        userId,
        userName,
        action: 'USER_STATUS_CHANGE',
        details: `User ${user.name} status set to ${status}`,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ success: true, offline: true });
  }
}
