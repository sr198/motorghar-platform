/**
 * MotorGhar Platform - API Gateway Application
 * Reference: Design Doc § 4.4 - Usage in Fastify Gateway
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 */

import * as path from 'path';
import { FastifyInstance } from 'fastify';
import AutoLoad from '@fastify/autoload';

// New architecture imports
import { authPlugin, rbacPlugin } from '@motorghar-platform/fastify-plugins';
import { AuthService, SessionService } from '@motorghar-platform/auth-service';
import { RBACService } from '@motorghar-platform/rbac-service';
import {
  PrismaUserRepository,
  PrismaSessionRepository,
  RedisTokenBlacklistRepository,
} from '@motorghar-platform/repositories';
import { prisma, redis } from '@motorghar-platform/database';
import { getEnvConfig } from '@motorghar-platform/config';

// Extend Fastify types to include services
declare module 'fastify' {
  interface FastifyInstance {
    authService: AuthService;
    sessionService: SessionService;
    rbacService: RBACService;
  }
}

/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // Load and validate configuration
  const config = getEnvConfig();

  // Initialize repositories (dependency injection)
  const userRepo = new PrismaUserRepository(prisma);
  const sessionRepo = new PrismaSessionRepository(prisma);
  const blacklistRepo = new RedisTokenBlacklistRepository(redis);

  // Initialize services
  const authService = new AuthService(userRepo, sessionRepo, blacklistRepo, {
    jwtSecret: config.JWT_SECRET,
    accessTokenExpiry: config.JWT_ACCESS_EXPIRY,
    refreshTokenExpiry: config.JWT_REFRESH_EXPIRY,
    maxSessionsPerUser: config.SESSION_MAX_PER_USER,
  });

  const sessionService = new SessionService(sessionRepo, {
    maxSessionsPerUser: config.SESSION_MAX_PER_USER,
    sessionTTL: config.SESSION_CLEANUP_INTERVAL,
  });

  const rbacService = new RBACService(userRepo);

  // Decorate fastify instance with services for use in routes
  fastify.decorate('authService', authService);
  fastify.decorate('sessionService', sessionService);
  fastify.decorate('rbacService', rbacService);

  // Register auth and RBAC plugins (clean architecture)
  await fastify.register(authPlugin, { authService });
  await fastify.register(rbacPlugin, { rbacService });

  // Load other plugins (sensible, cors, rate-limit, compress)
  // Note: We skip the old auth.ts plugin as it's replaced by the new architecture
  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: { ...opts },
    ignorePattern: /(auth\.(ts|js)|\.spec\.(ts|js)|\.old)$/, // Ignore old auth plugin, test files, and .old files
  });

  // Load routes
  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: { ...opts },
    autoHooks: true,
    cascadeHooks: true,
    ignorePattern: /\.spec\.(ts|js)$/, // Ignore test files
  });
}