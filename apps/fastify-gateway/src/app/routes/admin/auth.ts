/**
 * Admin Authentication Routes
 * POST /api/v1/admin/auth/login - Admin login
 * POST /api/v1/admin/auth/refresh - Refresh access token
 * POST /api/v1/admin/auth/logout - Logout and blacklist token
 * Reference: Phase 1 Spec § 2 (Admin Authentication)
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { extractBearerToken } from '@motorghar-platform/auth';
import { HTTP_STATUS } from '@motorghar-platform/constants';
import {
  AdminLoginRequestSchema,
  AdminRefreshRequestSchema,
  type AdminLoginRequest,
  type AdminRefreshRequest,
  type AdminLogoutRequest,
} from '@motorghar-platform/types';
import type { DeviceInfo } from '@motorghar-platform/repositories';

/**
 * Parse User-Agent header to extract device info
 * Simple implementation - can be enhanced with ua-parser-js library
 */
function parseDeviceInfo(userAgent?: string): DeviceInfo {
  const ua = userAgent || 'unknown';

  // Simple device type detection
  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
  if (ua.includes('Mobile')) {
    deviceType = 'mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    deviceType = 'tablet';
  } else if (ua.includes('Mozilla')) {
    deviceType = 'desktop';
  }

  return {
    userAgent: ua,
    deviceType,
  };
}

/**
 * Extract client IP address from request
 */
function getClientIp(request: FastifyRequest): string {
  return (
    (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (request.headers['x-real-ip'] as string) ||
    request.ip ||
    'unknown'
  );
}

export default async function (fastify: FastifyInstance) {
  /**
   * POST /api/v1/admin/auth/login
   * Admin login with email and password
   */
  fastify.post<{ Body: AdminLoginRequest }>(
    '/api/v1/admin/auth/login',
    async (request: FastifyRequest<{ Body: AdminLoginRequest }>, reply: FastifyReply) => {
      try {
        // Validate request body
        const parseResult = AdminLoginRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: 'Invalid request data',
            details: parseResult.error.issues,
          });
        }

        const { email, password } = parseResult.data;

        // Extract device info and IP
        const deviceInfo = parseDeviceInfo(request.headers['user-agent']);
        const ipAddress = getClientIp(request);

        // Use AuthService for login
        const result = await fastify.authService.login(
          email,
          password,
          deviceInfo,
          ipAddress
        );

        // Log successful login
        fastify.log.info({ userId: result.user.id, email: result.user.email }, 'Admin login successful');

        return reply.code(HTTP_STATUS.OK).send({
          success: true,
          data: result,
        });
      } catch (err) {
        // Check if it's an authentication error
        if (err instanceof Error && err.message === 'Invalid email or password') {
          return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
            success: false,
            error: 'Invalid email or password',
          });
        }

        fastify.log.error(err, 'Login error');
        return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/v1/admin/auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post<{ Body: AdminRefreshRequest }>(
    '/api/v1/admin/auth/refresh',
    async (request: FastifyRequest<{ Body: AdminRefreshRequest }>, reply: FastifyReply) => {
      try {
        // Validate request body
        const parseResult = AdminRefreshRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: 'Invalid request data',
            details: parseResult.error.issues,
          });
        }

        const { refreshToken } = parseResult.data;

        // Use AuthService for token refresh
        const result = await fastify.authService.refreshToken(refreshToken);

        return reply.code(HTTP_STATUS.OK).send({
          success: true,
          data: result,
        });
      } catch (err) {
        // Check if it's a token error
        if (
          err instanceof Error &&
          (err.message.includes('Invalid') ||
            err.message.includes('expired') ||
            err.message.includes('revoked') ||
            err.message.includes('not found'))
        ) {
          return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
            success: false,
            error: err.message,
          });
        }

        fastify.log.error(err, 'Token refresh error');
        return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /api/v1/admin/auth/logout
   * Logout and blacklist access token
   */
  fastify.post<{ Body: AdminLogoutRequest }>(
    '/api/v1/admin/auth/logout',
    {
      preHandler: fastify.authenticate, // Use new auth decorator
    },
    async (request: FastifyRequest<{ Body: AdminLogoutRequest }>, reply: FastifyReply) => {
      try {
        const accessToken = extractBearerToken(request.headers.authorization);
        const { refreshToken } = request.body || {};

        if (!accessToken) {
          return reply.code(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: 'Missing access token',
          });
        }

        if (!refreshToken) {
          return reply.code(HTTP_STATUS.BAD_REQUEST).send({
            success: false,
            error: 'Missing refresh token',
          });
        }

        // Use AuthService for logout
        await fastify.authService.logout(
          request.user!.userId,
          accessToken,
          refreshToken
        );

        fastify.log.info({ userId: request.user!.userId }, 'Admin logout successful');

        return reply.code(HTTP_STATUS.OK).send({
          success: true,
          data: {
            message: 'Logged out successfully',
          },
        });
      } catch (error) {
        fastify.log.error(error, 'Logout error');
        return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );
}
