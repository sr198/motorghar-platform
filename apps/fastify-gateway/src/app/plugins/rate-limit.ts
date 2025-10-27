/**
 * Rate Limiting Plugin
 * Implements rate limiting per JWT token
 * Reference: Phase 1 Spec § 1 (API Gateway Setup)
 */

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { redis } from '@motorghar-platform/database';
import {
  RATE_LIMIT_PUBLIC_DEFAULT,
  RATE_LIMIT_WINDOW_MS,
} from '@motorghar-platform/constants';

export default fp(async function (fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    global: true,
    max: RATE_LIMIT_PUBLIC_DEFAULT,
    timeWindow: RATE_LIMIT_WINDOW_MS,
    redis: redis,
    nameSpace: 'rate-limit:',
    skipOnError: false,
    keyGenerator: (request) => {
      // Use JWT user ID if authenticated, otherwise use IP
      const user = (request as any).user;
      return user ? `user:${user.userId}` : `ip:${request.ip}`;
    },
  });
});
