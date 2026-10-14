/**
 * GET /api/auth/me
 * Returns the currently authenticated user from verified server session
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { session, user, errorResponse } = await authenticateRequest(req);

  if (errorResponse) {
    // If token invalid or user deactivated, ensure cookie is cleared
    const res = errorResponse;
    res.cookies.delete(AUTH_COOKIE_NAME);
    return res;
  }

  return NextResponse.json({
    authenticated: true,
    session,
    user
  });
}
