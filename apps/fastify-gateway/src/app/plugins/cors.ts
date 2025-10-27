/**
 * CORS Plugin
 * Configures Cross-Origin Resource Sharing
 * Reference: Phase 1 Spec § 1 (API Gateway Setup)
 */

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { getEnvConfig } from '@motorghar-platform/config';
import { CUSTOM_HEADERS } from '@motorghar-platform/constants';

const CORS_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const;
const CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  CUSTOM_HEADERS.REQUEST_ID,
  CUSTOM_HEADERS.API_VERSION,
] as const;

export default fp(async function (fastify: FastifyInstance) {
  const config = getEnvConfig();

  await fastify.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: [...CORS_METHODS],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
    exposedHeaders: [CUSTOM_HEADERS.REQUEST_ID],
  });
});
