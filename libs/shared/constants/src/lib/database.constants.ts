/**
 * Database Constants
 * Prisma configuration and database settings
 * Reference: Solution Design v1.0 § 5 (Data Model)
 */

import type { Prisma } from '@prisma/client';

// Prisma Log Levels by Environment
export const PRISMA_LOG_LEVELS_DEV: Prisma.LogLevel[] = ['query', 'error', 'warn'];
export const PRISMA_LOG_LEVELS_PROD: Prisma.LogLevel[] = ['error'];

// Connection Pool Settings
export const DATABASE_CONNECTION_TIMEOUT_MS = 10000; // 10 seconds
export const DATABASE_POOL_TIMEOUT_MS = 30000; // 30 seconds
export const DATABASE_POOL_SIZE_MIN = 2;
export const DATABASE_POOL_SIZE_MAX = 10;

// Query Timeouts
export const DATABASE_QUERY_TIMEOUT_MS = 5000; // 5 seconds
export const DATABASE_TRANSACTION_TIMEOUT_MS = 10000; // 10 seconds
