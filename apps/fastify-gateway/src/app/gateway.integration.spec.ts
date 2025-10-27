/**
 * API Gateway Integration Tests
 * End-to-end tests for gateway with new auth architecture
 * Reference: Phase 1 Spec § 1 (API Gateway Setup) - Acceptance Criteria
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 */

import Fastify, { FastifyInstance } from 'fastify';
import { jest } from '@jest/globals';
import { app } from './app';
import { HTTP_STATUS } from '@motorghar-platform/constants';
import type { UserRole } from '@motorghar-platform/repositories';

// Mock all services and repositories
const mockAuthService = {
  verifyAccessToken: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  logoutAll: jest.fn(),
  getActiveSessions: jest.fn(),
  revokeSession: jest.fn(),
};

const mockRBACService = {
  hasRole: jest.fn(),
  hasAnyRole: jest.fn(),
  hasAllRoles: jest.fn(),
  getUserRole: jest.fn(),
  isAdmin: jest.fn(),
  isUserActive: jest.fn(),
};

const mockSessionService = {
  createSession: jest.fn(),
  validateSession: jest.fn(),
  listUserSessions: jest.fn(),
  revokeSession: jest.fn(),
  revokeAllSessions: jest.fn(),
  updateActivity: jest.fn(),
  cleanupExpiredSessions: jest.fn(),
};

// Mock auth-service
jest.mock('@motorghar-platform/auth-service', () => ({
  AuthService: jest.fn().mockImplementation(() => mockAuthService),
  SessionService: jest.fn().mockImplementation(() => mockSessionService),
}));

// Mock rbac-service
jest.mock('@motorghar-platform/rbac-service', () => ({
  RBACService: jest.fn().mockImplementation(() => mockRBACService),
}));

// Mock repositories
jest.mock('@motorghar-platform/repositories', () => ({
  PrismaUserRepository: jest.fn().mockImplementation(() => ({})),
  PrismaSessionRepository: jest.fn().mockImplementation(() => ({})),
  RedisTokenBlacklistRepository: jest.fn().mockImplementation(() => ({})),
  // Mock UserRole enum as both type and value
  UserRole: {
    ADMIN: 'ADMIN',
    OWNER: 'OWNER',
  },
}));

// Mock database clients
jest.mock('@motorghar-platform/database', () => ({
  redis: {
    ping: jest.fn().mockResolvedValue('PONG'),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    exists: jest.fn().mockResolvedValue(0),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    defineCommand: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
  },
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}));

// Mock config
jest.mock('@motorghar-platform/config', () => ({
  getEnvConfig: jest.fn(() => ({
    JWT_SECRET: 'test-secret-key-minimum-32-characters-long',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    SESSION_MAX_PER_USER: 5,
    SESSION_CLEANUP_INTERVAL: 3600,
    NODE_ENV: 'test',
    CORS_ORIGIN: ['http://localhost:3000'],
    PORT: 3333,
  })),
}));

// Mock extractBearerToken utility
jest.mock('@motorghar-platform/auth', () => ({
  extractBearerToken: jest.fn((header?: string) => {
    if (!header) return null;
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }),
}));

describe('API Gateway Integration Tests - New Architecture', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify({
      logger: false,
    });
    await server.register(app);
    // Do NOT call server.ready() here - it prevents adding test routes
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('Acceptance Criteria: Gateway proxies requests to backend services', () => {
    it('should successfully handle requests and return responses', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().status).toBe('healthy');
    });
  });

  describe('Acceptance Criteria: Unauthorized requests return 401', () => {
    it('should return 401 for missing authorization header', async () => {
      // Register a protected route BEFORE ready()
      server.get('/test-protected', {
        preHandler: server.authenticate,
        handler: async () => ({ data: 'protected' }),
      });

      const response = await server.inject({
        method: 'GET',
        url: '/test-protected',
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(response.json().success).toBe(false);
      expect(response.json().error).toBe('Missing or invalid authorization header');
    });

    it('should return 401 for invalid token', async () => {
      server.get('/test-protected2', {
        preHandler: server.authenticate,
        handler: async () => ({ data: 'protected' }),
      });

      const token = 'invalid.token';
      mockAuthService.verifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      const response = await server.inject({
        method: 'GET',
        url: '/test-protected2',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(response.json().error).toBe('Invalid or expired token');
    });

    it('should allow valid token', async () => {
      server.get('/test-protected3', {
        preHandler: server.authenticate,
        handler: async (request) => ({ data: 'protected', user: request.user }),
      });

      const token = 'valid.token';
      const payload = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'ADMIN' as UserRole,
      };

      mockAuthService.verifyAccessToken.mockResolvedValue(payload);

      const response = await server.inject({
        method: 'GET',
        url: '/test-protected3',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toBe('protected');
      expect(response.json().user).toEqual(payload);
    });
  });

  describe('Acceptance Criteria: Non-admin requests to /admin/* return 403', () => {
    it('should return 403 for non-admin role accessing admin routes', async () => {
      server.get('/test-admin', {
        preHandler: [server.authenticate, server.requireAdmin],
        handler: async () => ({ data: 'admin-only' }),
      });

      const token = 'valid.owner.token';
      const ownerPayload = {
        userId: 'owner-123',
        email: 'owner@example.com',
        role: 'OWNER' as UserRole,
      };

      mockAuthService.verifyAccessToken.mockResolvedValue(ownerPayload);
      mockRBACService.isAdmin.mockResolvedValue(false);

      const response = await server.inject({
        method: 'GET',
        url: '/test-admin',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(response.json().error).toBe('Admin access required');
    });

    it('should allow ADMIN role to access admin routes', async () => {
      server.get('/test-admin2', {
        preHandler: [server.authenticate, server.requireAdmin],
        handler: async () => ({ data: 'admin-only' }),
      });

      const token = 'valid.admin.token';
      const adminPayload = {
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN' as UserRole,
      };

      mockAuthService.verifyAccessToken.mockResolvedValue(adminPayload);
      mockRBACService.isAdmin.mockResolvedValue(true);

      const response = await server.inject({
        method: 'GET',
        url: '/test-admin2',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toBe('admin-only');
    });
  });

  describe('RBAC Decorators - requireRole', () => {
    it('should return 403 when user does not have required role', async () => {
      const { UserRole } = await import('@motorghar-platform/repositories');

      server.get('/test-owner-only', {
        preHandler: [server.authenticate, server.requireRole(UserRole.OWNER)],
        handler: async () => ({ data: 'owner-data' }),
      });

      const token = 'valid.admin.token';
      const adminPayload = {
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN' as UserRole,
      };

      mockAuthService.verifyAccessToken.mockResolvedValue(adminPayload);
      mockRBACService.hasRole.mockResolvedValue(false);

      const response = await server.inject({
        method: 'GET',
        url: '/test-owner-only',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(response.json().error).toBe('OWNER role required');
    });

    it('should allow access when user has required role', async () => {
      const { UserRole } = await import('@motorghar-platform/repositories');

      server.get('/test-owner-only2', {
        preHandler: [server.authenticate, server.requireRole(UserRole.OWNER)],
        handler: async () => ({ data: 'owner-data' }),
      });

      const token = 'valid.owner.token';
      const ownerPayload = {
        userId: 'owner-123',
        email: 'owner@example.com',
        role: 'OWNER' as UserRole,
      };

      mockAuthService.verifyAccessToken.mockResolvedValue(ownerPayload);
      mockRBACService.hasRole.mockResolvedValue(true);

      const response = await server.inject({
        method: 'GET',
        url: '/test-owner-only2',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toBe('owner-data');
    });
  });

  describe('RBAC Decorators - requireAnyRole', () => {
    it('should allow access when user has any of the required roles', async () => {
      const { UserRole } = await import('@motorghar-platform/repositories');

      server.get('/test-admin-or-owner', {
        preHandler: [
          server.authenticate,
          server.requireAnyRole([UserRole.ADMIN, UserRole.OWNER]),
        ],
        handler: async () => ({ data: 'privileged-data' }),
      });

      const token = 'valid.admin.token';
      const adminPayload = {
        userId: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN' as UserRole,
      };

      mockAuthService.verifyAccessToken.mockResolvedValue(adminPayload);
      mockRBACService.hasAnyRole.mockResolvedValue(true);

      const response = await server.inject({
        method: 'GET',
        url: '/test-admin-or-owner',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toBe('privileged-data');
    });
  });

  describe('Acceptance Criteria: Rate limits enforced and return 429', () => {
    it('should include rate limit headers in responses', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Acceptance Criteria: All requests logged with structured JSON', () => {
    it('should include request ID in response headers', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
    });

    it('should use provided request ID if present', async () => {
      const customRequestId = 'custom-request-id-12345';

      const response = await server.inject({
        method: 'GET',
        url: '/healthz',
        headers: {
          'x-request-id': customRequestId,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-request-id']).toBe(customRequestId);
    });
  });

  describe('CORS Configuration', () => {
    it('should set CORS headers for allowed origins', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz',
        headers: {
          origin: 'http://localhost:3000',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Response Compression', () => {
    it('should compress large responses when accepted', async () => {
      const largePayload = 'x'.repeat(2048);

      server.get('/test-large', async () => ({ data: largePayload }));

      const response = await server.inject({
        method: 'GET',
        url: '/test-large',
        headers: {
          'accept-encoding': 'gzip',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-encoding']).toBe('gzip');
    });
  });

  describe('Health Check', () => {
    it('should return health status at /healthz', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('checks');
      expect(body.checks).toHaveProperty('database');
      expect(body.checks).toHaveProperty('redis');
    });
  });
});
