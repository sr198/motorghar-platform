/**
 * Health Check Route Tests
 * Tests for service health status endpoint
 * Reference: Constitution § 3 - Testing Requirements
 */

import Fastify, { FastifyInstance } from 'fastify';
import { jest } from '@jest/globals';
import healthzRoute from './healthz';

// Mock database clients
const mockPrisma = {
  $queryRaw: jest.fn(),
};

const mockRedis = {
  ping: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  exists: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  defineCommand: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
};

jest.mock('@motorghar-platform/database', () => ({
  prisma: mockPrisma,
  redis: mockRedis,
}));

describe('Health Check Route', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();
    await server.register(healthzRoute);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await server.close();
  });

  it('should return healthy status when all services are up', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');

    const response = await server.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('healthy');
    expect(body.checks.database).toBe('healthy');
    expect(body.checks.redis).toBe('healthy');
    expect(body.timestamp).toBeDefined();
  });

  it('should return degraded status when database is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));
    mockRedis.ping.mockResolvedValue('PONG');

    const response = await server.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.status).toBe('degraded');
    expect(body.checks.database).toBe('unhealthy');
    expect(body.checks.redis).toBe('healthy');
  });

  it('should return degraded status when redis is down', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockRejectedValue(new Error('Redis connection failed'));

    const response = await server.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.status).toBe('degraded');
    expect(body.checks.database).toBe('healthy');
    expect(body.checks.redis).toBe('unhealthy');
  });

  it('should return degraded status when all services are down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));
    mockRedis.ping.mockRejectedValue(new Error('Redis connection failed'));

    const response = await server.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.status).toBe('degraded');
    expect(body.checks.database).toBe('unhealthy');
    expect(body.checks.redis).toBe('unhealthy');
  });

  it('should include ISO timestamp in response', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');

    const beforeRequest = new Date();
    const response = await server.inject({
      method: 'GET',
      url: '/healthz',
    });
    const afterRequest = new Date();

    expect(response.statusCode).toBe(200);
    const body = response.json();
    const timestamp = new Date(body.timestamp);

    expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime());
    expect(timestamp.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
  });

  it('should perform actual health checks on each request', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');

    await server.inject({ method: 'GET', url: '/healthz' });
    await server.inject({ method: 'GET', url: '/healthz' });

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(mockRedis.ping).toHaveBeenCalledTimes(2);
  });
});
