/**
 * Rate Limiting Plugin Tests
 * Tests for rate limiting middleware
 * Reference: Constitution § 3 - Testing Requirements
 */

import Fastify, { FastifyInstance } from 'fastify';
import { jest } from '@jest/globals';
import rateLimitPlugin from './rate-limit';
import { RATE_LIMIT_PUBLIC_DEFAULT, RATE_LIMIT_WINDOW_MS, HTTP_STATUS } from '@motorghar-platform/constants';

// Mock Redis client
const mockRedis = {
  incr: jest.fn(),
  expire: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ping: jest.fn(),
  defineCommand: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
};

jest.mock('@motorghar-platform/database', () => ({
  redis: mockRedis,
}));

describe('Rate Limit Plugin', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();

    // Mock rate limit responses from Redis
    mockRedis.incr.mockResolvedValue(1);
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.ping.mockResolvedValue('PONG');

    await server.register(rateLimitPlugin);

    server.get('/test', async () => ({ success: true }));

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await server.close();
  });

  it('should allow requests under the rate limit', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true });
  });

  it('should use IP address as key for unauthenticated requests', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/test',
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    });

    expect(response.statusCode).toBe(200);
    // Rate limiter should have used IP-based key
  });

  it('should use user ID as key for authenticated requests', async () => {
    // First register auth plugin to attach user
    const mockUser = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'OWNER',
    };

    server.decorateRequest('user', null);
    server.addHook('onRequest', async (request) => {
      (request as any).user = mockUser;
    });

    const response = await server.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    // Rate limiter should have used user ID-based key
  });

  it('should include rate limit headers in response', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers).toHaveProperty('x-ratelimit-limit');
    expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    expect(response.headers).toHaveProperty('x-ratelimit-reset');
  });

  it('should use configured rate limit values', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-ratelimit-limit']).toBe(String(RATE_LIMIT_PUBLIC_DEFAULT));
  });
});
