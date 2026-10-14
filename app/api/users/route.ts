/**
 * GET   /api/users     - List staff users (Admin & Manager only)
 * PATCH /api/users     - Modify user status active/inactive (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { listUsers, updateUserStatus } from '@/lib/server-db';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin', 'manager']
  });

  if (errorResponse) {
    return errorResponse;
  }

  try {
    const users = await listUsers(session.organizationId || session.stationId);
    return NextResponse.json({ users });
  } catch (err) {
    console.error('[/api/users GET]', err);
    return NextResponse.json({ error: 'Failed to retrieve staff directory.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { user: caller, session, errorResponse } = await authenticateRequest(req, {
    allowedRoles: ['admin']
  });

  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await req.json();
    const { targetUserId, status } = body;

    if (!targetUserId || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid targetUserId and status (active | inactive) are required.' },
        { status: 400 }
      );
    }

    // Prevent admin from locking their own account
    if (caller.id === targetUserId && status === 'inactive') {
      return NextResponse.json(
        { error: 'Cannot deactivate your own Administrator account.' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserStatus(
      targetUserId,
      status,
      caller.organizationId || session.organizationId || session.stationId
    );
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    console.error('[/api/users PATCH]', err);
    const msg = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
