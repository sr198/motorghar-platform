/**
 * CORS Plugin Tests
 * Tests for CORS configuration
 * Reference: Constitution § 3 - Testing Requirements
 */

import Fastify, { FastifyInstance } from 'fastify';
import { jest } from '@jest/globals';
import corsPlugin from './cors';
import { CUSTOM_HEADERS } from '@motorghar-platform/constants';

// Mock config
const mockConfig = {
  CORS_ORIGIN: ['http://localhost:3000', 'https://app.motorghar.com'],
  NODE_ENV: 'test',
};

jest.mock('@motorghar-platform/config', () => ({
  getEnvConfig: jest.fn(() => mockConfig),
}));

describe('CORS Plugin', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();
    await server.register(corsPlugin);

    server.get('/test', async () => ({ success: true }));
  });

  afterEach(async () => {
    await server.close();
  });

  it('should allow requests from configured origins', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/test',
      headers: {
        origin: 'http://localhost:3000',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should handle OPTIONS preflight requests', async () => {
    const response = await server.inject({
      method: 'OPTIONS',
      url: '/test',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'POST',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });

  it('should allow configured HTTP methods', async () => {
    const response = await server.inject({
      method: 'OPTIONS',
      url: '/test',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'PUT',
      },
    });

    expect(response.statusCode).toBe(204);
    const allowedMethods = response.headers['access-control-allow-methods'];
    expect(allowedMethods).toContain('GET');
    expect(allowedMethods).toContain('POST');
    expect(allowedMethods).toContain('PUT');
    expect(allowedMethods).toContain('PATCH');
    expect(allowedMethods).toContain('DELETE');
    expect(allowedMethods).toContain('OPTIONS');
  });

  it('should allow configured headers', async () => {
    const response = await server.inject({
      method: 'OPTIONS',
      url: '/test',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'Content-Type,Authorization',
      },
    });

    expect(response.statusCode).toBe(204);
    const allowedHeaders = response.headers['access-control-allow-headers'];
    expect(allowedHeaders).toContain('Content-Type');
    expect(allowedHeaders).toContain('Authorization');
    expect(allowedHeaders).toContain(CUSTOM_HEADERS.REQUEST_ID);
    expect(allowedHeaders).toContain(CUSTOM_HEADERS.API_VERSION);
  });

  it('should expose configured headers', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/test',
      headers: {
        origin: 'http://localhost:3000',
      },
    });

    expect(response.statusCode).toBe(200);
    const exposedHeaders = response.headers['access-control-expose-headers'];
    expect(exposedHeaders).toContain(CUSTOM_HEADERS.REQUEST_ID);
  });

  it('should enable credentials', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/test',
      headers: {
        origin: 'http://localhost:3000',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});
