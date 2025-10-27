/**
 * Health Check Route
 * Returns service health status
 * Reference: Phase 1 Spec § 1 (API Gateway Setup)
 */

import { FastifyInstance } from 'fastify';
import { prisma, redis } from '@motorghar-platform/database';

export default async function (fastify: FastifyInstance) {
  fastify.get('/healthz', async (request, reply) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = 'healthy';
    } catch (error) {
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
    }

    try {
      // Check Redis connection
      await redis.ping();
      health.checks.redis = 'healthy';
    } catch (error) {
      health.checks.redis = 'unhealthy';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return reply.code(statusCode).send(health);
  });
}