/**
 * POST /api/auth/setup
 * First-time bootstrap: creates a new isolated station + primary admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStationWithAdmin } from '@/lib/server-db';
import { signToken, buildCookieOptions, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, password, pin, phone, branch, stationName, address } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Name, username, email, and password are required for initial setup.' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password or PIN must be at least 4 characters.' },
        { status: 400 }
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

    const res = NextResponse.json({
      success: true,
      message: 'Primary station administrator created successfully.',
      user,
      station,
      token
    }, { status: 201 });

    res.cookies.set(AUTH_COOKIE_NAME, token, buildCookieOptions());
    return res;
  } catch (err: unknown) {
    console.error('[/api/auth/setup]', err);
    const msg = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
