/**
 * Database Library
 * Exports Prisma and Redis clients
 */

export * from './lib/database.js';
export * from './lib/prisma.client.js';
export * from './lib/redis.client.js';

// Re-export PrismaClient type for convenience
export type { PrismaClient } from '@prisma/client';
