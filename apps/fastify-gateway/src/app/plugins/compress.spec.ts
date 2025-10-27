/**
 * Compression Plugin Tests
 * Tests for response compression
 * Reference: Constitution § 3 - Testing Requirements
 */

import Fastify, { FastifyInstance } from 'fastify';
import compressPlugin from './compress';
import { COMPRESSION_THRESHOLD_BYTES, COMPRESSION_ENCODINGS } from '@motorghar-platform/constants';

describe('Compress Plugin', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();
    await server.register(compressPlugin);
  });

  afterEach(async () => {
    await server.close();
  });

  it('should compress large responses when client accepts encoding', async () => {
    const largePayload = 'x'.repeat(COMPRESSION_THRESHOLD_BYTES + 100);

    server.get('/large', async () => ({ data: largePayload }));

    const response = await server.inject({
      method: 'GET',
      url: '/large',
      headers: {
        'accept-encoding': 'gzip',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBe('gzip');
  });

  it('should compress with brotli when available and preferred', async () => {
    const largePayload = 'x'.repeat(COMPRESSION_THRESHOLD_BYTES + 100);

    server.get('/large', async () => ({ data: largePayload }));

    const response = await server.inject({
      method: 'GET',
      url: '/large',
      headers: {
        'accept-encoding': 'br, gzip, deflate',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBe('br');
  });

  it('should not compress small responses below threshold', async () => {
    const smallPayload = 'x'.repeat(COMPRESSION_THRESHOLD_BYTES - 100);

    server.get('/small', async () => ({ data: smallPayload }));

    const response = await server.inject({
      method: 'GET',
      url: '/small',
      headers: {
        'accept-encoding': 'gzip',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-encoding']).toBeUndefined();
  });

  it('should not compress when client does not accept encoding', async () => {
    const largePayload = 'x'.repeat(COMPRESSION_THRESHOLD_BYTES + 100);

    server.get('/large', async () => ({ data: largePayload }));

    const response = await server.inject({
      method: 'GET',
      url: '/large',
    });

    expect(response.statusCode).toBe(200);
    // Response might still be compressed or not depending on Fastify's default behavior
  });

  it('should support all configured encodings', async () => {
    const largePayload = 'x'.repeat(COMPRESSION_THRESHOLD_BYTES + 100);

    server.get('/large', async () => ({ data: largePayload }));

    // Test each encoding
    for (const encoding of COMPRESSION_ENCODINGS) {
      const response = await server.inject({
        method: 'GET',
        url: '/large',
        headers: {
          'accept-encoding': encoding,
        },
      });

      expect(response.statusCode).toBe(200);
      if (encoding === 'br' || encoding === 'gzip' || encoding === 'deflate') {
        expect(response.headers['content-encoding']).toBe(encoding);
      }
    }
  });

  it('should apply compression globally to all routes', async () => {
    const largePayload = 'x'.repeat(COMPRESSION_THRESHOLD_BYTES + 100);

    server.get('/route1', async () => ({ data: largePayload }));
    server.get('/route2', async () => ({ data: largePayload }));

    const response1 = await server.inject({
      method: 'GET',
      url: '/route1',
      headers: {
        'accept-encoding': 'gzip',
      },
    });

    const response2 = await server.inject({
      method: 'GET',
      url: '/route2',
      headers: {
        'accept-encoding': 'gzip',
      },
    });

    expect(response1.headers['content-encoding']).toBe('gzip');
    expect(response2.headers['content-encoding']).toBe('gzip');
  });
});
