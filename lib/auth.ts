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
