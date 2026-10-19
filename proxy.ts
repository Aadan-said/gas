/**
 * GasFlow Auth Proxy (Next.js 16+ "proxy" convention — replaces middleware.ts)
 * Protects /api/* routes that require authentication.
 * Auth portal and public endpoints are excluded.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

// Routes that do NOT require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/setup',
  '/api/auth/setup-status',
  '/api/state',
  '/api/health',
  '/api/developer/license',
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Sanitize incoming untrusted identity headers
  const sanitizedHeaders = new Headers(req.headers);
  sanitizedHeaders.delete('x-user-id');
  sanitizedHeaders.delete('x-user-role');
  sanitizedHeaders.delete('x-user-name');
  sanitizedHeaders.delete('x-station-id');
  sanitizedHeaders.delete('x-device-id');

  // Allow public routes through
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next({ request: { headers: sanitizedHeaders } });
  }

  // Extract token from cookie or Authorization header
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const bearerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  const token = cookieToken || bearerToken;

  if (!token) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
  }

  // Inject session context into request headers for downstream handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', session.userId);
  requestHeaders.set('x-user-role', session.role);
  requestHeaders.set('x-user-name', session.name);
  requestHeaders.set('x-station-id', session.stationId);
  requestHeaders.set('x-device-id', session.deviceId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/api/:path*'],
};
