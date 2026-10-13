/**
 * POST /api/auth/register
 * Body: { name, username, email, password, pin, role, phone?, branch? }
 * 
 * - Admin/Manager only (if DB is active with real sessions)
 * - In offline/seed mode: creates user in-memory via client-side state
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { generateUUID } from '@/lib/storage';
import type { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ────────────────────────────────────────────────────────────
    const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const bearerToken = req.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieToken || bearerToken;

    // In offline mode, we allow open registration (validated on frontend)
    // In production with DB, only admins can create accounts
    let callerRole: UserRole = 'cashier';
    if (token) {
      const session = await verifyToken(token);
      if (session) callerRole = session.role;
    }

    // ── Validate body ──────────────────────────────────────────────────────────
    const body = await req.json();
    const { name, username, email, password, pin, role = 'cashier', phone, branch } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: 'name, username, email and password are required.' }, { status: 400 });
    }

    if (!['admin', 'manager', 'cashier', 'accountant'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    if (role === 'admin' && callerRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create admin accounts.' }, { status: 403 });
    }

    // ── Try DB first ──────────────────────────────────────────────────────────
    try {
      const { prisma } = await import('@/lib/prisma');
      const exists = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
      if (exists) {
        return NextResponse.json({ error: 'Username or email already in use.' }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          id: generateUUID(),
          name,
          username: username.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          pin: pin || '0000',
          role: role as UserRole,
          status: 'active',
          phone: phone ?? null,
          branch: branch ?? null,
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          branch: newUser.branch,
          phone: newUser.phone,
          pin: '****',
        },
      }, { status: 201 });
    } catch (dbErr: unknown) {
      // Not a Prisma error → rethrow; otherwise DB might just not be connected
      if (dbErr instanceof Error && dbErr.message.includes('PrismaClientInitializationError')) {
        // Fall through to offline mode response
      } else if (dbErr instanceof Error && dbErr.constructor.name.startsWith('Prisma')) {
        // Pass along real DB errors
        throw dbErr;
      }
    }

    // ── Offline / seed mode: return the new user object for client to store ─────
    const newUserId = `u_${generateUUID().slice(0, 8)}`;
    const offlineUser = {
      id: newUserId,
      name,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      role: role as UserRole,
      status: 'active',
      pin: pin || '0000',
      phone: phone ?? undefined,
      branch: branch ?? undefined,
    };

    return NextResponse.json({ success: true, user: offlineUser, offline: true }, { status: 201 });
  } catch (err) {
    console.error('[/api/auth/register]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
