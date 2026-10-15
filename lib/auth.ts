/**
 * GasFlow Auth Library
 * - Password hashing with bcryptjs
 * - JWT session tokens
 * - Role-based access control helpers
 */

import { User, UserRole } from './types';

// ─── Password Hashing (bcryptjs) ──────────────────────────────────────────────
// We use dynamic import so this works in both Node.js API routes and edge cases.

export async function hashPassword(plaintext: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(plaintext, 12);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(plaintext, hash);
}

// ─── JWT Session ──────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'gasflow-dev-secret-change-in-prod-!!';
const JWT_EXPIRES_IN = '8h'; // One shift duration

export interface SessionPayload {
  userId: string;
  username: string;
  role: UserRole;
  name: string;
  stationId: string;
  organizationId: string;
  deviceId: string;
  iat?: number;
  exp?: number;
}

export async function signToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const jwt = await import('jsonwebtoken');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as import('jsonwebtoken').SignOptions);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

// ─── Role Permissions ─────────────────────────────────────────────────────────

type Permission =
  | 'sales:create'
  | 'sales:void'
  | 'tanks:view'
  | 'tanks:deliver'
  | 'tanks:calibrate'
  | 'tanks:price_update'
  | 'customers:manage'
  | 'finance:view'
  | 'finance:manage'
  | 'reports:view'
  | 'staff:manage'
  | 'settings:manage'
  | 'audit:view';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'sales:create', 'sales:void',
    'tanks:view', 'tanks:deliver', 'tanks:calibrate', 'tanks:price_update',
    'customers:manage',
    'finance:view', 'finance:manage',
    'reports:view',
    'staff:manage',
    'settings:manage',
    'audit:view',
  ],
  manager: [
    'sales:create', 'sales:void',
    'tanks:view', 'tanks:deliver', 'tanks:calibrate', 'tanks:price_update',
    'customers:manage',
    'finance:view', 'finance:manage',
    'reports:view',
    'staff:manage',
    'settings:manage',
    'audit:view',
  ],
  cashier: [
    'sales:create',
    'tanks:view',
    'customers:manage',
  ],
  accountant: [
    'sales:create',
    'tanks:view',
    'customers:manage',
    'finance:view', 'finance:manage',
    'reports:view',
    'audit:view',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// ─── Cookie helpers (for App Router) ─────────────────────────────────────────

export const AUTH_COOKIE_NAME = 'gasflow_session';

export function buildCookieOptions(maxAgeSeconds = 8 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

// ─── Request Authentication & Authorization Guard ────────────────────────────

export async function authenticateRequest(
  req: import('next/server').NextRequest,
  options?: {
    allowedRoles?: UserRole[];
    permission?: Permission;
  }
): Promise<
  | { session: SessionPayload; user: User; errorResponse: null }
  | { session: null; user: null; errorResponse: import('next/server').NextResponse }
> {
  const { NextResponse } = await import('next/server');
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const bearerToken = req.headers.get('authorization')?.replace('Bearer ', '');
  const token = cookieToken || bearerToken;

  if (!token) {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json({ error: 'Authentication required. Please log in.' }, { status: 401 })
    };
  }

  const session = await verifyToken(token);
  if (!session) {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 })
    };
  }

  // Verify account status in server database
  const { findUserById } = await import('./server-db');
  const dbUser = await findUserById(session.userId);

  if (!dbUser) {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json({ error: 'Account not found or has been revoked.' }, { status: 401 })
    };
  }

  if (dbUser.status === 'inactive') {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Account is inactive. Please contact station administrator.' },
        { status: 403 }
      )
    };
  }

  // Role check
  if (options?.allowedRoles && !options.allowedRoles.includes(session.role)) {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json(
        { error: `Insufficient permissions. Operation requires role: ${options.allowedRoles.join(', ')}.` },
        { status: 403 }
      )
    };
  }

  // Granular permission check
  if (options?.permission && !hasPermission(session.role, options.permission)) {
    return {
      session: null,
      user: null,
      errorResponse: NextResponse.json(
        { error: `Insufficient permissions. Operation requires: ${options.permission}.` },
        { status: 403 }
      )
    };
  }

  const organizationId = dbUser.organizationId || session.stationId;
  session.stationId = organizationId;
  session.organizationId = organizationId;

  const sanitizedUser: User = {
    id: dbUser.id,
    name: dbUser.name,
    username: dbUser.username,
    email: dbUser.email,
    role: dbUser.role,
    status: dbUser.status,
    phone: dbUser.phone,
    branch: dbUser.branch,
    pin: '****',
    lastLogin: dbUser.lastLogin,
    organizationId
  };

  return { session, user: sanitizedUser, errorResponse: null };
}

