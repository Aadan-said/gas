/**
 * GasFlow — Prisma Client Singleton
 * Multi-environment resilient loader with Vercel safe-guard
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Safe fallback DATABASE_URL for build phase if not provided in Vercel environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/gasflow?schema=public';
}

function initPrisma(): PrismaClient {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch (err) {
    console.warn('[prisma] PrismaClient init deferred or failed:', err);
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error('Database is offline or not configured.');
      }
    });
  }
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? initPrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const url = process.env.DATABASE_URL || '';
  // On Vercel, if pointing to localhost, database is not reachable
  if (process.env.VERCEL && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
