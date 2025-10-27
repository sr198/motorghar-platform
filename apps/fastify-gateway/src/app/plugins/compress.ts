/**
 * Compression Plugin
 * Enables response compression (brotli/gzip)
 * Reference: Phase 1 Spec § 1 (API Gateway Setup)
 */

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import compress from '@fastify/compress';
import { COMPRESSION_THRESHOLD_BYTES, COMPRESSION_ENCODINGS } from '@motorghar-platform/constants';

export default fp(async function (fastify: FastifyInstance) {
  await fastify.register(compress, {
    global: true,
    threshold: COMPRESSION_THRESHOLD_BYTES,
    encodings: [...COMPRESSION_ENCODINGS],
  });
});
