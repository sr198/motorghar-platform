/**
 * RBAC Plugin for Fastify
 * Reference: Design Doc § 4.3.2 - RBAC Plugin
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 *
 * Provides role-based access control decorators for Fastify routes:
 * - requireRole: Require specific role
 * - requireAnyRole: Require any of the specified roles
 * - requireAdmin: Require ADMIN role
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { RBACService } from '@motorghar-platform/rbac-service';
import type { UserRole } from '@motorghar-platform/repositories';

/**
 * Extend Fastify types to include RBAC decorators
 */
declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Decorator: Require specific role
     * Returns a preHandler that checks if user has the required role
     * Returns 401 if not authenticated, 403 if role doesn't match
     */
    requireRole: (
      role: UserRole
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    /**
     * Decorator: Require any of the specified roles
     * Returns a preHandler that checks if user has any of the roles
     * Returns 401 if not authenticated, 403 if no role matches
     */
    requireAnyRole: (
      roles: UserRole[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    /**
     * Decorator: Require admin role
     * Returns 401 if not authenticated, 403 if not admin
     */
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * RBAC plugin options
 */
export interface RBACPluginOptions {
  rbacService: RBACService;
}

/**
 * RBAC plugin implementation
 * Registers role-based access control decorators on Fastify instance
 *
 * @param fastify - Fastify instance
 * @param options - Plugin options
 */
async function rbacPlugin(fastify: FastifyInstance, options: RBACPluginOptions) {
  const { rbacService } = options;

  /**
   * Decorator: Require specific role
   */
  fastify.decorate('requireRole', (role: UserRole) => {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required',
        });
      }

      const hasRole = await rbacService.hasRole(request.user.userId, role);

      if (!hasRole) {
        return reply.code(403).send({
          success: false,
          error: `${role} role required`,
        });
      }
    };
  });

  /**
   * Decorator: Require any of the specified roles
   */
  fastify.decorate('requireAnyRole', (roles: UserRole[]) => {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required',
        });
      }

      const hasAnyRole = await rbacService.hasAnyRole(request.user.userId, roles);

      if (!hasAnyRole) {
        return reply.code(403).send({
          success: false,
          error: `One of [${roles.join(', ')}] roles required`,
        });
      }
    };
  });

  /**
   * Decorator: Require admin role
   */
  fastify.decorate('requireAdmin', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const isAdmin = await rbacService.isAdmin(request.user.userId);

    if (!isAdmin) {
      return reply.code(403).send({
        success: false,
        error: 'Admin access required',
      });
    }
  });
}

/**
 * Export as fastify plugin with metadata
 */
export default fp(rbacPlugin, {
  name: '@motorghar/rbac-plugin',
  dependencies: ['@motorghar/auth-plugin'],
});
