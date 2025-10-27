/**
 * Auth Plugin for Fastify
 * Reference: Design Doc § 4.3.1 - Auth Plugin
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 *
 * Provides authentication decorators for Fastify routes:
 * - authenticate: Require valid JWT token
 * - optionalAuth: Optionally attach user if token is valid
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import type { AuthService, TokenPayload } from '@motorghar-platform/auth-service';
import { extractBearerToken } from '@motorghar-platform/auth';

/**
 * Extend Fastify types to include user in request
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }

  interface FastifyInstance {
    /**
     * Decorator: Require authentication
     * Attaches user to request.user
     * Returns 401 if token is missing or invalid
     */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    /**
     * Decorator: Optional authentication
     * Attaches user to request.user if token is valid
     * Continues without user if token is missing or invalid
     */
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Auth plugin options
 */
export interface AuthPluginOptions {
  authService: AuthService;
}

/**
 * Auth plugin implementation
 * Registers authentication decorators on Fastify instance
 *
 * @param fastify - Fastify instance
 * @param options - Plugin options
 */
async function authPlugin(fastify: FastifyInstance, options: AuthPluginOptions) {
  const { authService } = options;

  /**
   * Decorator: Require authentication
   * Attaches user to request.user
   */
  fastify.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    }

    try {
      const payload = await authService.verifyAccessToken(token);
      request.user = payload;
    } catch (error) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  });

  /**
   * Decorator: Optional authentication
   * Attaches user if token is valid, otherwise continues
   */
  fastify.decorate('optionalAuth', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      return; // No token, continue without user
    }

    try {
      const payload = await authService.verifyAccessToken(token);
      request.user = payload;
    } catch (error) {
      // Invalid token, continue without user
      return;
    }
  });
}

/**
 * Export as fastify plugin with metadata
 */
export default fp(authPlugin, {
  name: '@motorghar/auth-plugin',
  dependencies: [],
});
