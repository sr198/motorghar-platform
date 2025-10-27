/**
 * App Unit Tests
 * Tests for the Fastify app initialization
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 */

import Fastify, { FastifyInstance } from 'fastify';
import { jest } from '@jest/globals';
import { app } from './app';

// Mock all external dependencies
jest.mock('@motorghar-platform/auth-service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  })),
  SessionService: jest.fn().mockImplementation(() => ({
    createSession: jest.fn(),
    validateSession: jest.fn(),
  })),
}));

jest.mock('@motorghar-platform/rbac-service', () => ({
  RBACService: jest.fn().mockImplementation(() => ({
    hasRole: jest.fn(),
    isAdmin: jest.fn(),
  })),
}));

jest.mock('@motorghar-platform/repositories', () => ({
  PrismaUserRepository: jest.fn().mockImplementation(() => ({})),
  PrismaSessionRepository: jest.fn().mockImplementation(() => ({})),
  RedisTokenBlacklistRepository: jest.fn().mockImplementation(() => ({})),
  UserRole: {
    ADMIN: 'ADMIN',
    OWNER: 'OWNER',
  },
}));

jest.mock('@motorghar-platform/database', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
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
}));

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

describe('Fastify App', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify({
      logger: false,
    });
    await server.register(app);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  it('should initialize successfully', async () => {
    expect(server).toBeDefined();
  });

  it('should respond to GET / with a message', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'Hello API' });
  });

  it('should have auth decorators registered', () => {
    expect(server.authenticate).toBeDefined();
    expect(typeof server.authenticate).toBe('function');
  });

  it('should have RBAC decorators registered', () => {
    expect(server.requireAdmin).toBeDefined();
    expect(server.requireRole).toBeDefined();
    expect(server.requireAnyRole).toBeDefined();
    expect(typeof server.requireAdmin).toBe('function');
    expect(typeof server.requireRole).toBe('function');
    expect(typeof server.requireAnyRole).toBe('function');
  });

  it('should have services decorated on fastify instance', () => {
    expect(server.authService).toBeDefined();
    expect(server.sessionService).toBeDefined();
    expect(server.rbacService).toBeDefined();
  });
});
