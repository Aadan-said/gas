/**
 * POST /api/auth/register
 *
 * 1. Public: create a brand-new station + admin (isolated data).
 * 2. Authenticated admin/manager: create staff inside the caller's station.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, signToken, buildCookieOptions, AUTH_COOKIE_NAME } from '@/lib/auth';
import { createUser, createStationWithAdmin } from '@/lib/server-db';
import type { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    const caller = authResult.user;
    const callerSession = authResult.session;

    const body = await req.json();
    const { name, username, email, password, pin, phone, branch, stationName, address } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Magaca, username, email, iyo password ayaa loo baahan yahay / Name, username, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password-ku waa inuu ugu yaraan ka koobnaadaa 4 xaraf ama tiro / Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    if (caller && callerSession && (caller.role === 'admin' || caller.role === 'manager')) {
      const role = (body.role || 'cashier') as UserRole;
      if (!['admin', 'manager', 'cashier', 'accountant'].includes(role)) {
        return NextResponse.json({ error: 'Invalid staff role specified.' }, { status: 400 });
      }

      if (caller.role === 'manager' && ['admin', 'manager'].includes(role)) {
        return NextResponse.json(
          { error: 'Managers are only authorized to create Cashier or Accountant accounts.' },
          { status: 403 }
        );
      }

      const organizationId = caller.organizationId || callerSession.organizationId || callerSession.stationId;
      const newUser = await createUser({
        name,
        username,
        email,
        password,
        pin: pin || password,
        role,
        phone,
        branch: branch || caller.branch,
        status: 'active',
        organizationId
      });

      return NextResponse.json(
        {
          success: true,
          message: `Account created for ${newUser.name} (${newUser.role.toUpperCase()}).`,
          user: newUser
        },
        { status: 201 }
      );
    }

    const { user, station } = await createStationWithAdmin({
      name,
      username,
      email,
      password,
      pin: pin || password,
      phone,
      stationName,
      branch,
      address
    });

    const organizationId = station.id;
    const token = await signToken({
      userId: user.id,
      username: user.username || user.email,
      role: 'admin',
      name: user.name,
      stationId: organizationId,
      organizationId,
      deviceId: 'PRIMARY-CANOPY-SERVER'
    });

    const res = NextResponse.json(
      {
        success: true,
        message: `Maamulaha saldhigga waa la diiwaangeliyay: ${user.name}`,
        user,
        station,
        token
      },
      { status: 201 }
    );

    res.cookies.set(AUTH_COOKIE_NAME, token, buildCookieOptions());
    return res;
  } catch (err: unknown) {
    console.error('[/api/auth/register]', err);
    const msg = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
