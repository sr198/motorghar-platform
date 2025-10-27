/**
 * Admin User Management Routes
 * Demonstrates usage of new auth decorators
 * Reference: Design Doc § 4.5 - Example Route Usage
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
// Import UserRole as both type and value from repositories
import { UserRole } from '@motorghar-platform/repositories';

export default async function (fastify: FastifyInstance) {
  /**
   * GET /api/v1/admin/users/profile
   * Authenticated route - any logged-in user can access
   */
  fastify.get(
    '/api/v1/admin/users/profile',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest) => {
      return {
        success: true,
        data: {
          user: request.user,
        },
      };
    }
  );

  /**
   * GET /api/v1/admin/users
   * Admin-only route - requires ADMIN role
   */
  fastify.get(
    '/api/v1/admin/users',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
    },
    async () => {
      return {
        success: true,
        data: {
          users: [], // Placeholder - would fetch from database
        },
      };
    }
  );

  /**
   * POST /api/v1/admin/users/broadcast
   * Specific role required - ADMIN only
   */
  fastify.post(
    '/api/v1/admin/users/broadcast',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(UserRole.ADMIN)],
    },
    async () => {
      return {
        success: true,
        data: {
          message: 'Broadcast sent',
        },
      };
    }
  );

  /**
   * GET /api/v1/admin/users/reports
   * Multiple roles allowed - ADMIN or OWNER
   */
  fastify.get(
    '/api/v1/admin/users/reports',
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAnyRole([UserRole.ADMIN, UserRole.OWNER]),
      ],
    },
    async () => {
      return {
        success: true,
        data: {
          reports: [], // Placeholder - would fetch from database
        },
      };
    }
  );
}