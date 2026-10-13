/**
 * GasFlow — Prisma Client Singleton
 * Resilient loader: Prevents crashes when Prisma client is not yet generated
 */

let prismaInstance: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = globalThis as unknown as {
    prisma: any;
  };

  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} catch {
  // Offline-first fallback: @prisma/client not yet generated
  prismaInstance = null;
}

export const prisma = prismaInstance;
