/**
 * POST /api/auth/login
 * Body: { identifier: string, password: string, deviceId?: string }
 * Returns: { user, token } on success | { error } on failure
 *
 * Strategy (offline-first):
 *  1. Try DB lookup (if DATABASE_URL is set and Prisma is available)
 *  2. Fall back to in-memory seed users (dev/offline mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { signToken, buildCookieOptions, AUTH_COOKIE_NAME } from '@/lib/auth';
import { INITIAL_USERS } from '@/lib/storage';

// Helper: attempt DB lookup
async function findUserInDB(identifier: string): Promise<{ id: string; name: string; username: string; email: string; passwordHash: string; pin: string; role: string; status: string; branch?: string | null; phone?: string | null } | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
    });
    return user;
  } catch {
    // DB not connected — fall through to seed data
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, pin, deviceId = 'DEV-WEB-01' } = body;

    if (!identifier) {
      return NextResponse.json({ error: 'Username / email is required.' }, { status: 400 });
    }
    if (!password && !pin) {
      return NextResponse.json({ error: 'Password or PIN is required.' }, { status: 400 });
    }

    // ── 1. Try real database ──────────────────────────────────────────────────
    let dbUser = await findUserInDB(identifier.toLowerCase().trim());

    if (dbUser) {
      const { verifyPassword } = await import('@/lib/auth');
      const valid = await verifyPassword(password || pin, dbUser.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
      }

      const sessionPayload = {
        userId: dbUser.id,
        username: dbUser.username,
        role: dbUser.role as import('@/lib/types').UserRole,
        name: dbUser.name,
        stationId: 'st_001',
        deviceId,
      };

      const token = await signToken(sessionPayload);

      const userOut = {
        id: dbUser.id,
        name: dbUser.name,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        branch: dbUser.branch ?? undefined,
        phone: dbUser.phone ?? undefined,
        pin: '****',
      };

      const res = NextResponse.json({ success: true, user: userOut, token });
      res.cookies.set(AUTH_COOKIE_NAME, token, buildCookieOptions());
      return res;
    }

    // ── 2. Offline / seed fallback ────────────────────────────────────────────
    const seedUser = INITIAL_USERS.find(
      u =>
        u.username?.toLowerCase() === identifier.toLowerCase() ||
        u.email?.toLowerCase() === identifier.toLowerCase()
    );

    if (!seedUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // In seed mode, password = pin value (no hashing)
    const inputCred = password || pin;
    if (inputCred !== seedUser.pin) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    if (seedUser.status !== 'active') {
      return NextResponse.json({ error: 'Account is inactive. Contact your administrator.' }, { status: 403 });
    }

    const token = await signToken({
      userId: seedUser.id,
      username: seedUser.username ?? seedUser.email,
      role: seedUser.role,
      name: seedUser.name,
      stationId: 'st_001',
      deviceId,
    });

    const res = NextResponse.json({
      success: true,
      user: { ...seedUser, pin: '****' },
      token,
    });
    res.cookies.set(AUTH_COOKIE_NAME, token, buildCookieOptions());
    return res;
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
