/**
 * GasFlow — Prisma Client Singleton
 * Multi-environment resilient loader with fast TCP port probe
 */

import { PrismaClient } from '@prisma/client';
import net from 'net';

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

/**
 * Fast non-blocking check to verify if PostgreSQL server is alive.
 * Uses a 300ms TCP probe first to avoid 4-second hangs when PostgreSQL is not running.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  const url = process.env.DATABASE_URL || '';

  // On Vercel, if pointing to localhost, database is not reachable
  if (process.env.VERCEL && (url.includes('localhost') || url.includes('127.0.0.1'))) {
    return false;
  }

  // Fast TCP port probe first (fails in ~5ms if port is closed, instead of hanging for 4,000ms)
  try {
    const rawUrl = url.replace('postgresql://', 'http://').replace('postgres://', 'http://');
    const parsed = new URL(rawUrl);
    const host = parsed.hostname || 'localhost';
    const port = parseInt(parsed.port || '5432', 10);

    const isPortOpen = await new Promise<boolean>(resolve => {
      const socket = net.createConnection({ host, port });
      socket.setTimeout(350);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });

    if (!isPortOpen) {
      return false;
    }
  } catch {
    // If URL parsing fails, continue to Prisma query
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
