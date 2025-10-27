/**
 * Prisma Client Singleton
 * Reference: Prisma Best Practices for Node.js
 * Ensures single instance in development (HMR) and production
 */

import { PrismaClient } from '@prisma/client';
import { PRISMA_LOG_LEVELS_DEV, PRISMA_LOG_LEVELS_PROD } from '@motorghar-platform/constants';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? PRISMA_LOG_LEVELS_DEV
        : PRISMA_LOG_LEVELS_PROD,
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect Prisma on process termination
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
