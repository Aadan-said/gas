/**
 * POST /api/auth/login
 * Authenticates against the server database and issues a tenant-scoped JWT.
 */

import { NextRequest, NextResponse } from 'next/server';
import { signToken, buildCookieOptions, AUTH_COOKIE_NAME, verifyPassword } from '@/lib/auth';
import { findUserByIdentifier, updateUserLastLogin } from '@/lib/server-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, pin, deviceId = 'STATION-POS-TERM' } = body;

    if (!identifier) {
      return NextResponse.json({ error: 'Username ama email ayaa loo baahan yahay / Username or email is required.' }, { status: 400 });
    }
    if (!password && !pin) {
      return NextResponse.json({ error: 'Password ama PIN ayaa loo baahan yahay / Password or PIN is required.' }, { status: 400 });
    }

    const inputCred = (password || pin || '').trim();
    const normalizedId = identifier.toLowerCase().trim();

    const user = await findUserByIdentifier(normalizedId);
    if (!user) {
      return NextResponse.json(
        { error: 'Username-kan ama email-kan lama helin / Invalid credentials.' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Akoonkani waa xiran yahay (Inactive). Fadlan la xiriir maamulaha kaalinta / Account is deactivated. Contact station administrator.' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(inputCred, user.passwordHash);
    if (!isValid) {
      let pinValid = false;
      if (user.pinHash) {
        pinValid = await verifyPassword(inputCred, user.pinHash);
      }
      if (!pinValid) {
        return NextResponse.json(
          { error: 'Password-ka ama PIN-ka aad gelisay waa khalad / Incorrect password or PIN.' },
          { status: 401 }
        );
      }
    }

    await updateUserLastLogin(user.id);

    const organizationId = user.organizationId;
    const sessionPayload = {
      userId: user.id,
      username: user.username || user.email,
      role: user.role,
      name: user.name,
      stationId: organizationId,
      organizationId,
      deviceId
    };

    const token = await signToken(sessionPayload);

    const userResponse = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      branch: user.branch,
      phone: user.phone,
      twoFactorEnabled: user.twoFactorEnabled,
      organizationId,
      pin: '****',
      lastLogin: new Date().toISOString()
    };

    const res = NextResponse.json({
      success: true,
      user: userResponse,
      token
    });

    res.cookies.set(AUTH_COOKIE_NAME, token, buildCookieOptions());
    return res;
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error during authentication.' }, { status: 500 });
  }
}
