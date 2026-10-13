/**
 * GET /api/auth/me
 * Returns the current user from the session token (cookie or Authorization header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const bearerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  const token = cookieToken || bearerToken;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Session expired or invalid.' }, { status: 401 });
  }

  return NextResponse.json({ session });
}
